from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import db
from models.topic import Topic

import pdfplumber
import docx
import os
from dotenv import load_dotenv

try:
    import google.generativeai as genai  # type: ignore[reportMissingImports]
except ImportError:
    genai = None

load_dotenv()

topic_bp = Blueprint("topic", __name__)

# ===========================
#  Gemini Client (primary)
# ===========================
GEMINI_SUMMARY_KEY = os.getenv("GEMINI_SUMMARY_KEY")
if not GEMINI_SUMMARY_KEY:
    print("WARNING: GEMINI_SUMMARY_KEY not set. Gemini summarization will be skipped.")
elif genai is None:
    print(
        "WARNING: google-generativeai is not installed. Gemini summarization will be skipped."
    )

if GEMINI_SUMMARY_KEY and genai is not None:
    genai.configure(api_key=GEMINI_SUMMARY_KEY)

# ===========================
#  HuggingFace Fallback — DISABLED FOR NOW
# ===========================
# Loading google/flan-t5-large (~3GB) inside a request on a small Render
# instance is what caused the SIGKILL/OOM in your logs. Keep this off
# until summarization is stable on Gemini alone, then reintroduce it
# behind a background job instead of an inline fallback.
HF_FALLBACK_ENABLED = os.getenv("HF_FALLBACK_ENABLED", "false").lower() == "true"
HF_MODEL_NAME = os.getenv("HF_SUMMARY_MODEL", "sshleifer/distilbart-cnn-12-6")
_hf_summarizer = None


def get_hf_summarizer():
    global _hf_summarizer
    if _hf_summarizer is None:
        from transformers import pipeline  # imported lazily, only if actually used

        _hf_summarizer = pipeline("summarization", model=HF_MODEL_NAME)
    return _hf_summarizer


# ===========================
#  Extract Text from File
# ===========================
def extract_text(file):
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        with pdfplumber.open(file) as pdf:
            return "\n".join(
                page.extract_text() for page in pdf.pages if page.extract_text()
            )

    if filename.endswith(".docx"):
        doc = docx.Document(file)
        return "\n".join(p.text for p in doc.paragraphs)

    if filename.endswith(".txt"):
        file.stream.seek(0)
        return file.read().decode("utf-8", errors="ignore")

    return ""


# ===========================
#  Prompt Builder
# ===========================
def build_prompt(text, mode):
    base = (
        "You are DidAct AI, a pedagogy-focused tutor.\n"
        "Write a clear, coherent explanation between 1000 and 1500 words.\n"
        "Use short paragraphs and simple language where possible.\n\n"
    )

    if mode == "basic":
        mode_instr = (
            "Mode: BASIC.\n"
            "- Explain the topic as if teaching a child.\n"
            "- Use very friendly tone and simple language.\n"
            "- Include multiple real-world, relatable examples.\n\n"
        )
    elif mode == "detailed":
        mode_instr = (
            "Mode: DETAILED.\n"
            "- Provide a multi-paragraph deep academic explanation.\n"
            "- Include definitions, subheadings, and cause-effect reasoning.\n\n"
        )
    else:
        mode_instr = (
            "Mode: OVERVIEW.\n"
            "- Focus on key concepts and how they relate to each other.\n"
            "- Describe conceptual relationships and big-picture structure.\n\n"
        )

    markdown_rules = (
        "Output the explanation in WELL-STRUCTURED MARKDOWN.\n"
        "Rules:\n"
        "- Use # for the title\n"
        "- Use ## for major sections\n"
        "- Use ### for sub-sections\n"
        "- Use bullet points and tables where appropriate\n"
        "- Do NOT include JSON\n"
        "- Do NOT include explanations outside the content\n"
        "- Do NOT wrap the output in markdown code fences\n\n"
    )

    return base + mode_instr + "Source material:\n" + text + "\n\n" + markdown_rules


def normalize_to_word_range(
    text: str, min_words: int = 800, max_words: int = 1500
) -> str:
    words = text.split()
    if not words:
        return text
    if len(words) > max_words:
        return " ".join(words[:max_words])
    return text


# ===========================
#  POST: Summarize + Save Topic
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

    if file:
        extracted_text += "\n" + extract_text(file)

    if len(extracted_text.strip()) < 50:
        return jsonify({"error": "Not enough content"}), 400

    # ===========================
    #  Gemini Summarization (with real timeout)
    # ===========================
    summary = None
    quota_error = False

    if GEMINI_SUMMARY_KEY and genai is not None:
        try:
            print("STEP: calling gemini", flush=True)
            prompt = build_prompt(extracted_text[:5000], mode)
            model = genai.GenerativeModel("gemini-flash-latest")
            response = model.generate_content(
                prompt, request_options={"timeout": 30}  # <-- prevents indefinite hang
            )
            print("STEP: gemini responded", flush=True)
            summary_text = response.text.strip() if response.text else ""
            summary = normalize_to_word_range(summary_text)
        except Exception as e:
            msg = str(e)
            print(f"STEP: gemini call failed/timed out: {msg}", flush=True)
            if (
                "RESOURCE_EXHAUSTED" in msg
                or "quota" in msg.lower()
                or "UNAVAILABLE" in msg
                or "503" in msg
            ):
                quota_error = True

    # ===========================
    #  Fallback (only if explicitly enabled)
    # ===========================
    if summary is None:
        if not HF_FALLBACK_ENABLED:
            return (
                jsonify(
                    {
                        "error": "Summarization is temporarily unavailable. Please try again shortly.",
                        "status": 503,
                    }
                ),
                503,
            )

        try:
            truncated_text = extracted_text[:1500]
            hf_summarizer = get_hf_summarizer()
            raw = hf_summarizer(
                truncated_text, max_length=300, min_length=120, do_sample=False
            )
            summary_text = raw[0]["summary_text"].strip()
            summary = normalize_to_word_range(summary_text)
        except Exception as e:
            if quota_error:
                print(
                    f"HuggingFace fallback failed after Gemini quota error: {e}",
                    flush=True,
                )
                return (
                    jsonify(
                        {
                            "error": "Gemini quota exhausted and local fallback failed",
                            "status": 500,
                        }
                    ),
                    500,
                )
            return (
                jsonify({"error": f"Summarization failed: {str(e)}", "status": 500}),
                500,
            )

    # ===========================
    #  Save Topic in Database
    # ===========================
    try:
        existing_topic = Topic.query.filter_by(
            user_id=user_id, title=title, mode=mode
        ).first()

        if existing_topic:
            existing_topic.extracted_text = extracted_text
            existing_topic.summary = summary
            db.session.commit()
            return jsonify(existing_topic.to_dict()), 200

        topic = Topic(
            user_id=user_id,
            title=title,
            extracted_text=extracted_text,
            summary=summary,
            mode=mode,
        )
        db.session.add(topic)
        db.session.commit()
        return jsonify(topic.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "status": 500}), 500


# ===========================
#  GET: Topic History
# ===========================
@topic_bp.route("/history/<user_id>", methods=["GET"])
@jwt_required()
def get_topic_history(user_id):
    current_user = get_jwt_identity()
    if str(current_user) != str(user_id):
        return jsonify({"error": "Unauthorized", "status": 403}), 403

    topics = (
        Topic.query.filter_by(user_id=user_id).order_by(Topic.created_at.desc()).all()
    )
    return jsonify([t.to_dict() for t in topics]), 200
