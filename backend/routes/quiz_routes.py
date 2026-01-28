from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import db

from models.quiz import Quiz
from models.question import Question
from models.attempt import QuizAttempt
from models.topic import Topic

from datetime import datetime, timedelta
import json
import os
from dotenv import load_dotenv
from google import genai
from transformers import pipeline

load_dotenv()

quiz_bp = Blueprint("quiz", __name__)

# ======================
# ✅ Gemini Quiz Generator (primary)
# ======================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not set. Gemini quiz generation will be skipped.")

gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# ======================
# ✅ HuggingFace Fallback
# ======================
HF_QUIZ_MODEL_NAME = os.getenv("HF_QUIZ_MODEL", "google/flan-t5-large")
_hf_quiz_generator = None


def get_hf_quiz_generator():
    global _hf_quiz_generator
    if _hf_quiz_generator is None:
        _hf_quiz_generator = pipeline(
            "text2text-generation",
            model=HF_QUIZ_MODEL_NAME,
        )
    return _hf_quiz_generator


def quiz_prompt(summary_text: str) -> str:
    """
    Build an instruction prompt that forces a strict JSON output.
    """
    return f"""
You are DidAct AI Quiz Generator.

Generate EXACTLY 30 multiple-choice questions based on the topic summary below.
You MUST output ONLY valid JSON (no markdown, no comments, no extra text).

JSON format:
[
  {{
    "text": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "difficulty": "easy" | "medium" | "hard",
    "concept_tag": "short concept label"
  }},
  ...
]

Difficulty distribution:
- Exactly 10 questions with difficulty = "easy"
- Exactly 10 questions with difficulty = "medium"
- Exactly 10 questions with difficulty = "hard"

Important rules:
- options must be exactly 4 strings
- correct_answer is an integer index 0–3
- Do NOT include any explanation fields.

Topic summary:
{summary_text}
"""


def extract_json(text: str):
    """
    Extract and parse the first JSON array from the model output.
    """
    try:
        start = text.index("[")
        end = text.rindex("]") + 1
        return json.loads(text[start:end])
    except Exception:
        return None


def validate_questions(questions_data):
    """
    Validate that we have exactly 30 questions with the correct structure
    and difficulty distribution.
    """
    if not isinstance(questions_data, list) or len(questions_data) != 30:
        return False, "Model must return exactly 30 questions."

    counts = {"easy": 0, "medium": 0, "hard": 0}

    for idx, q in enumerate(questions_data):
        try:
            text = q["text"]
            options = q["options"]
            correct_answer = int(q["correct_answer"])
            difficulty = q["difficulty"].lower()
            concept_tag = q["concept_tag"]
        except Exception:
            return False, f"Invalid question structure at index {idx}."

        if not isinstance(options, list) or len(options) != 4:
            return False, f"Question {idx + 1} must have exactly 4 options."
        if correct_answer < 0 or correct_answer > 3:
            return False, f"Question {idx + 1} has invalid correct_answer index."
        if difficulty not in counts:
            return False, f"Question {idx + 1} has invalid difficulty '{difficulty}'."

        counts[difficulty] += 1

    if counts["easy"] != 10 or counts["medium"] != 10 or counts["hard"] != 10:
        return (
            False,
            "Difficulty distribution must be exactly 10 easy, 10 medium, 10 hard.",
        )

    return True, None


# ======================
# ✅ Generate Quiz
# ======================
@quiz_bp.route("/generate/<topic_id>", methods=["POST"])
@jwt_required()
def generate_quiz(topic_id):
    user_id = get_jwt_identity()

    topic = Topic.query.filter_by(id=topic_id, user_id=user_id).first()
    if not topic:
        return jsonify({"error": "Topic not found", "status": 404}), 404

    questions_data = None
    quota_error = False

    try:
        if gemini_client:
            result = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=quiz_prompt(topic.summary[:8000]),
            )
            raw_text = (result.text or "").strip()
            questions_data = extract_json(raw_text)
            if not questions_data:
                return jsonify({"error": "Model returned invalid JSON", "status": 500}), 500

            ok, msg = validate_questions(questions_data)
            if not ok:
                return jsonify({"error": msg, "status": 500}), 500
    except Exception as e:
        msg = str(e)
        if "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
            quota_error = True
            print(f"Gemini quiz quota exceeded, falling back to HuggingFace: {msg}")
        else:
            return jsonify({"error": str(e), "status": 500}), 500

    if questions_data is None:
        # Gemini unavailable or quota exceeded → use HuggingFace fallback
        try:
            hf_generator = get_hf_quiz_generator()
            result = hf_generator(
                quiz_prompt(topic.summary[:8000]),
                max_length=4096,
                do_sample=False,
            )
            raw_text = result[0]["generated_text"]
            questions_data = extract_json(raw_text)
            if not questions_data:
                return jsonify({"error": "Fallback model returned invalid JSON", "status": 500}), 500

            ok, msg = validate_questions(questions_data)
            if not ok:
                return jsonify({"error": msg, "status": 500}), 500
        except Exception as e:
            if quota_error:
                return jsonify({
                    "error": "Gemini quiz quota exhausted and local fallback failed",
                    "status": 500
                }), 500
            return jsonify({"error": str(e), "status": 500}), 500

    try:
        quiz = Quiz(topic_id=topic.id)
        db.session.add(quiz)
        db.session.flush()

        for q in questions_data:
            question = Question(
                quiz_id=quiz.id,
                text=q["text"],
                options=json.dumps(q["options"]),
                correct_answer=int(q["correct_answer"]),
                difficulty=q["difficulty"].lower(),
                concept_tag=q["concept_tag"],
            )
            db.session.add(question)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "status": 500}), 500

    return jsonify(quiz.to_dict()), 201


# ======================
# ✅ Submit Attempt
# ======================
@quiz_bp.route("/attempt", methods=["POST"])
@jwt_required()
def submit_attempt():
    user_id = get_jwt_identity()
    data = request.get_json()

    quiz_id = data.get("quiz_id")
    answers = data.get("answers", [])
    time_taken = data.get("time_taken_seconds", 0)
    integrity_flags = data.get("integrity_flags", [])

    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found", "status": 404}), 404

    attempts = QuizAttempt.query.filter_by(
        user_id=user_id,
        quiz_id=quiz_id
    ).all()

    if len(attempts) >= 10:
        last = max(attempts, key=lambda x: x.attempted_at)
        cooldown = last.attempted_at + timedelta(minutes=30)
        if datetime.utcnow() < cooldown:
            return jsonify({
                "error": "Attempt limit reached",
                "status": 429,
                "retry_after": int((cooldown - datetime.utcnow()).total_seconds())
            }), 429

    questions = Question.query.filter_by(quiz_id=quiz_id).all()

    question_results = []
    correct = 0

    for idx, q in enumerate(questions):
        selected = answers[idx] if idx < len(answers) else None
        is_correct = selected == q.correct_answer

        if is_correct:
            correct += 1

        question_results.append({
            "question_id": q.id,
            "question": q.text,
            "options": json.loads(q.options),
            "selected_answer": selected,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
            "difficulty": q.difficulty,
            "concept_tag": q.concept_tag
        })

    score = round((correct / len(questions)) * 100, 2) if questions else 0.0

    attempt = QuizAttempt(
        quiz_id=quiz_id,
        user_id=user_id,
        attempt_number=len(attempts) + 1,
        score=score,
        answers_json=json.dumps(answers),
        question_results=question_results,
        time_taken_seconds=time_taken,
        integrity_flags=json.dumps(integrity_flags),
    )

    try:
        db.session.add(attempt)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "status": 500}), 500

    return jsonify(attempt.to_dict()), 201


# ======================
# ✅ Quiz History (THIS WAS MISSING)
# ======================
# ======================
# ✅ Quiz Attempt History per Quiz
# ======================
@quiz_bp.route("/history/<quiz_id>", methods=["GET"])
@jwt_required()
def quiz_history(quiz_id):
    user_id = get_jwt_identity()

    attempts = QuizAttempt.query.filter_by(
        user_id=user_id,
        quiz_id=quiz_id
    ).order_by(QuizAttempt.attempted_at.desc()).all()

    return jsonify([a.to_dict() for a in attempts]), 200

