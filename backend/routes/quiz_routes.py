from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import db

from models.quiz import Quiz
from models.question import Question
from models.attempt import QuizAttempt
from models.topic import Topic
from models.certificate import Certificate
from models.user import User
from routes.certificate_routes import _build_file_path, _generate_certificate  # adjust import if needed
import uuid
from datetime import datetime, timedelta
import json
import os
from dotenv import load_dotenv
from google import genai
from transformers import pipeline
from flask import current_app
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
# ✅ HuggingFace Fallback (lightweight, safe defaults)
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

Generate EXACTLY 15 multiple-choice questions based on the topic summary below.
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
- Exactly 5 questions with difficulty = "easy"
- Exactly 5 questions with difficulty = "medium"
- Exactly 5 questions with difficulty = "hard"


Important rules:
- options must be exactly 4 strings
- correct_answer is an integer index 0–3
- Do NOT include any explanation fields.

Topic summary:
{summary_text}
"""


def simple_fallback_prompt(summary_text: str) -> str:
    """
    Simplified prompt for HuggingFace fallback model.
    Generates 10-15 questions only to fit within token limits.
    """
    return f"""Generate 15 multiple choice questions as JSON.

[
  {{"text": "question?", "options": ["A", "B", "C", "D"], "correct_answer": 0, "difficulty": "easy", "concept_tag": "concept"}}
]

Topic: {summary_text[:500]}
"""


def extract_json(text: str):
    """
    Extract and parse the first JSON array from the model output.
    Includes repair logic for common formatting issues.
    """
    try:
        start = text.index("[")
        end = text.rindex("]") + 1
        json_str = text[start:end]
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {e}")
        print(f"Attempted JSON string (first 200 chars): {text[start:end][:200] if 'start' in locals() else 'N/A'}")
        
        # Try JSON repair: remove trailing commas
        try:
            if 'start' in locals():
                json_str = text[start:end]
                json_str = json_str.rstrip(',]') + ']'  # Remove trailing comma before ]
                return json.loads(json_str)
        except:
            pass
        
        return None
    except Exception as e:
        print(f"Extract JSON Error: {e}")
        return None


def validate_questions(questions_data):
    """
    Validate questions with flexible requirements for fallback model.
    Minimum: 10 questions, Maximum: 30 questions.
    If less than 30, we accept it rather than fail completely.
    """
    if not isinstance(questions_data, list):
        return False, "Questions must be a list."
    
    # Accept exactly 15 questions
    if len(questions_data) != 15:
        return False, "Exactly 15 questions required."

    if len(questions_data) > 30:
        questions_data = questions_data[:30]  # Trim to 30

    counts = {"easy": 0, "medium": 0, "hard": 0}

    for idx, q in enumerate(questions_data):
        try:
            text = q.get("text", "").strip()
            options = q.get("options", [])
            correct_answer = int(q.get("correct_answer", -1))
            difficulty = str(q.get("difficulty", "medium")).lower().strip()
            concept_tag = q.get("concept_tag", "general")
        except Exception:
            return False, f"Invalid question structure at index {idx}."

        if not text:
            return False, f"Question {idx + 1} has empty text."
        
        if not isinstance(options, list) or len(options) != 4:
            return False, f"Question {idx + 1} must have exactly 4 options."
        
        if correct_answer < 0 or correct_answer > 3:
            return False, f"Question {idx + 1} has invalid correct_answer index."
        
        if difficulty not in counts:
            difficulty = "medium"  # Default to medium if invalid
            q["difficulty"] = difficulty
        
        counts[difficulty] += 1

    # For fallback model, we're lenient on distribution
    # Just ensure we have at least some variety
    if counts["easy"] == 0 and counts["medium"] == 0:
        return False, "Must have at least some easy or medium questions."

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
                model="gemini-flash-latest",
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
            # Use simplified prompt for fallback model
            truncated_summary = topic.summary[:500]
            hf_generator = get_hf_quiz_generator()
            result = hf_generator(
                simple_fallback_prompt(truncated_summary),
                max_length=1024,  # Reduced but sufficient for simplified prompt
                min_length=200,
                do_sample=False,
                truncation=True,
            )
            raw_text = result[0]["generated_text"]
            print(f"HuggingFace fallback raw output (first 500 chars): {raw_text[:500]}")
            questions_data = extract_json(raw_text)
            
            if not questions_data:
                print(f"Failed to extract JSON from HuggingFace. Full output:\n{raw_text}")
                return jsonify({"error": "Fallback model returned invalid JSON. Full output:\n" + raw_text[:500], "status": 500}), 500

            ok, msg = validate_questions(questions_data)
            if not ok:
                return jsonify({"error": f"Validation failed: {msg}", "status": 500}), 500
        except Exception as e:
            if quota_error:
                print(f"HuggingFace quiz fallback failed after Gemini quota error: {e}")
                return jsonify({
                    "error": "Gemini quiz quota exhausted and local fallback failed",
                    "status": 500
                }), 500
            print(f"HuggingFace fallback exception: {e}")
            return jsonify({"error": f"Fallback generation failed: {str(e)}", "status": 500}), 500

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
        return jsonify({"error": "Quiz not found"}), 404

    attempt_count = (
        db.session.query(QuizAttempt)
        .join(Quiz)
        .filter(
            Quiz.topic_id == quiz.topic_id,
            QuizAttempt.user_id == user_id
        )
        .count()
    )

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
    MIN_SCORE = current_app.config.get("CERT_MIN_SCORE", 75)
    passed = score >= MIN_SCORE

    attempt = QuizAttempt(
        quiz_id=quiz_id,
        user_id=user_id,
        attempt_number=attempt_count + 1,
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
        return jsonify({"error": str(e)}), 500

    certificate_data = None

    if passed:
        user = User.query.get(user_id)

        old_certs = Certificate.query.filter_by(
            user_id=user_id,
            quiz_id=quiz_id
        ).all()

        for cert in old_certs:
            if cert.file_path and os.path.exists(cert.file_path):
                os.remove(cert.file_path)
            db.session.delete(cert)

        db.session.commit()

        cert_uid = f"CERT-{uuid.uuid4().hex[:8].upper()}"

        new_cert = Certificate(
            user_id=user_id,
            quiz_id=quiz_id,
            certificate_uid=cert_uid,
            score=score,
            issued_at=datetime.utcnow()
        )

        try:
            path = _build_file_path(cert_uid)
            _generate_certificate(new_cert, user, quiz, path)
            new_cert.file_path = path

            db.session.add(new_cert)
            db.session.commit()

            certificate_data = new_cert.to_dict()

        except Exception as e:
            db.session.rollback()
            print("Certificate generation error:", e)

    response = attempt.to_dict()
    response["passed"] = passed
    response["certificate"] = certificate_data

    return jsonify(response), 201



@quiz_bp.route("/history/<quiz_id>", methods=["GET"])
@jwt_required()
def quiz_history(quiz_id):
    user_id = get_jwt_identity()

    attempts = QuizAttempt.query.filter_by(
        user_id=user_id,
        quiz_id=quiz_id
    ).order_by(QuizAttempt.attempted_at.desc()).all()

    return jsonify([a.to_dict() for a in attempts]), 200

@quiz_bp.route("/topic-history/<topic_id>", methods=["GET"])
@jwt_required()
def topic_attempt_history(topic_id):
    user_id = get_jwt_identity()

    attempts = (
        QuizAttempt.query
        .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
        .filter(
            Quiz.topic_id == topic_id,
            QuizAttempt.user_id == user_id
        )
        .order_by(QuizAttempt.attempted_at.desc())
        .all()
    )

    return jsonify([a.to_dict() for a in attempts]), 200
