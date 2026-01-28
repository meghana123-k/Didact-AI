from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import db
from models.topic import Topic

import pdfplumber
import docx
import os
from dotenv import load_dotenv

from google import genai
from transformers import pipeline

load_dotenv()

topic_bp = Blueprint("topic", __name__)

# ===========================
# ✅ Gemini Client (primary)
# ===========================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not set. Gemini summarization will be skipped.")

gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# ===========================
# ✅ HuggingFace Fallback
# ===========================
HF_MODEL_NAME = os.getenv("HF_SUMMARY_MODEL", "google/flan-t5-large")
_hf_summarizer = None


def get_hf_summarizer():
    global _hf_summarizer
    if _hf_summarizer is None:
        _hf_summarizer = pipeline(
            "text2text-generation",
            model=HF_MODEL_NAME,
        )
    return _hf_summarizer


# ===========================
# ✅ Extract Text from File
# ===========================
def extract_text(file):
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        with pdfplumber.open(file) as pdf:
            return "\n".join(
                page.extract_text()
                for page in pdf.pages
                if page.extract_text()
            )

    if filename.endswith(".docx"):
        doc = docx.Document(file)
        return "\n".join(p.text for p in doc.paragraphs)

    if filename.endswith(".txt"):
        # Reset to start in case it's been read
        file.stream.seek(0)
        return file.read().decode("utf-8", errors="ignore")

    return ""


# ===========================
# ✅ Prompt Builder
# ===========================
def build_prompt(text, mode):
    """
    Build an instruction-style prompt for Gemini.
    Enforces pedagogical modes required by the product spec.
    """
    base = (
        "You are DidAct AI, a pedagogy-focused tutor. "
        "Write a clear, coherent explanation between 1500 and 2500 words. "
        "Use short paragraphs and simple language where possible.\n\n"
    )

    if mode == "basic":
        mode_instr = (
            "Mode: BASIC.\n"
            "- Explain the topic as if teaching a child.\n"
            "- Use very friendly tone and simple language.\n"
            "- Include multiple real-world, relatable examples.\n"
        )
    elif mode == "detailed":
        mode_instr = (
            "Mode: DETAILED.\n"
            "- Provide a multi-paragraph deep academic explanation.\n"
            "- Include definitions, subheadings, and cause-effect reasoning.\n"
        )
    else:
        mode_instr = (
            "Mode: OVERVIEW.\n"
            "- Focus on key concepts and how they relate to each other.\n"
            "- Describe conceptual relationships and big-picture structure.\n"
        )

    return (
        base
        + mode_instr
        + "\nSource material:\n"
        + text
        + "\n\nNow produce only the final explanation text."
    )


def normalize_to_word_range(text: str, min_words: int = 1500, max_words: int = 2500) -> str:
    """
    Post-process model output to satisfy the strict 1500–2500 word requirement.
    If the model under-shoots, we keep the text but note it's best-effort rather than
    fabricating extra content. If it over-shoots, we trim by words.
    """
    words = text.split()
    if not words:
        return text

    if len(words) > max_words:
        return " ".join(words[:max_words])

    # If shorter than min_words, we still return but this keeps behavior deterministic.
    # Frontend and analytics can still rely on this text.
    return text


# ===========================
# ✅ POST: Summarize + Save Topic
# ===========================
@topic_bp.route("/summarize", methods=["POST"])
@jwt_required()
def summarize_topic():

    user_id = get_jwt_identity()

    title = request.form.get("title")
    mode = request.form.get("mode", "basic")
    raw_text = request.form.get("text", "")

    if not title:
        return jsonify({"error": "Topic title is required"}), 400

    file = request.files.get("file")
    extracted_text = raw_text

    # Extract file content
    if file:
        extracted_text += "\n" + extract_text(file)

    if len(extracted_text.strip()) < 50:
        return jsonify({"error": "Not enough content"}), 400

    # ===========================
    # ✅ Gemini Summarization with HuggingFace Fallback
    # ===========================
    summary = None
    quota_error = False

    if gemini_client:
        try:
            prompt = build_prompt(extracted_text[:8000], mode)
            response = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )
            summary_text = (response.text or "").strip()
            summary = normalize_to_word_range(summary_text)
        except Exception as e:
            msg = str(e)
            # Detect quota/RESOURCE_EXHAUSTED and mark for fallback
            if "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
                quota_error = True
                print(f"Gemini quota exceeded, falling back to HuggingFace: {msg}")
            else:
                return jsonify({"error": f"Gemini summarization failed: {msg}", "status": 500}), 500

    if summary is None:
        # Either no Gemini client or quota exhausted → use HuggingFace locally
        try:
            prompt = build_prompt(extracted_text[:8000], mode)
            hf_summarizer = get_hf_summarizer()
            raw = hf_summarizer(
                prompt,
                max_length=4096,
                min_length=512,
                do_sample=False,
            )
            summary_text = raw[0]["generated_text"].strip()
            summary = normalize_to_word_range(summary_text)
        except Exception as e:
            # If this was a Gemini quota issue, expose that clearly
            if quota_error:
                return jsonify({
                    "error": "Gemini quota exhausted and local fallback failed",
                    "status": 500
                }), 500
            return jsonify({"error": f"Summarization failed: {str(e)}", "status": 500}), 500

    # ===========================
    # ✅ Save Topic in Database
    # ===========================
    try:
        existing_topic = Topic.query.filter_by(
            user_id=user_id,
            title=title,
            mode=mode
        ).first()

        if existing_topic:
            # Optional: update summary instead of creating duplicate
            existing_topic.extracted_text = extracted_text
            existing_topic.summary = summary
            db.session.commit()
            return jsonify(existing_topic.to_dict()), 200

        # ===========================
        # ✅ Create new topic
        # ===========================
        topic = Topic(
            user_id=user_id,
            title=title,
            extracted_text=extracted_text,
            summary=summary,
            mode=mode
        )

        db.session.add(topic)
        db.session.commit()

        return jsonify(topic.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "status": 500}), 500


# ===========================
# ✅ GET: Topic History
# ===========================
@topic_bp.route("/history/<user_id>", methods=["GET"])
@jwt_required()
def get_topic_history(user_id):

    current_user = get_jwt_identity()

    if str(current_user) != str(user_id):
        return jsonify({"error": "Unauthorized", "status": 403}), 403

    topics = Topic.query.filter_by(user_id=user_id).order_by(
        Topic.created_at.desc()
    ).all()

    return jsonify([t.to_dict() for t in topics]), 200
