
from flask import Blueprint, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import db
from models.certificate import Certificate
from models.attempt import QuizAttempt
from models.user import User
from models.quiz import Quiz
from datetime import datetime
import uuid
import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

certificate_bp = Blueprint('certificate', __name__)


def _build_certificate_pdf_path(cert_uid: str) -> str:
    base_folder = current_app.config.get("UPLOAD_FOLDER")
    return os.path.join(base_folder, f"{cert_uid}.pdf")


def _generate_certificate_pdf(cert: Certificate, user: User, quiz: Quiz, path: str):
    """
    Generate a professional-looking PDF certificate using ReportLab.
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)
    c = canvas.Canvas(path, pagesize=A4)
    width, height = A4

    # Background
    c.setFillColorRGB(1, 1, 1)
    c.rect(0, 0, width, height, fill=1)

    # Title
    c.setFont("Helvetica-Bold", 28)
    c.setFillColorRGB(0.2, 0.2, 0.4)
    c.drawCentredString(width / 2, height - 150, "Certificate of Achievement")

    # Subtitle
    c.setFont("Helvetica", 14)
    c.setFillColorRGB(0.25, 0.25, 0.25)
    c.drawCentredString(width / 2, height - 190, "This certifies that")

    # Student Name
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(width / 2, height - 230, user.name)

    # Body text
    c.setFont("Helvetica", 13)
    text = (
        f"has successfully completed the mastery assessment on '{quiz.topic.title}' "
        f"with a score of {cert.score:.1f}%."
    )
    c.drawCentredString(width / 2, height - 270, text)

    # Metadata
    c.setFont("Helvetica", 11)
    issued = cert.issued_at.strftime("%d %B %Y")
    c.drawString(80, 120, f"Date: {issued}")
    c.drawString(80, 100, f"Certificate ID: {cert.certificate_uid}")

    c.setFont("Helvetica-Oblique", 10)
    c.drawRightString(width - 80, 100, "DidAct AI · Intelligent Learning Insights")

    c.showPage()
    c.save()


@certificate_bp.route('/generate/<quiz_id>', methods=['POST'])
@jwt_required()
def generate_cert(quiz_id):
    user_id = get_jwt_identity()

    # Check if user has passed (Score >= 75%)
    best_attempt = (
        QuizAttempt.query.filter_by(user_id=user_id, quiz_id=quiz_id)
        .order_by(QuizAttempt.score.desc())
        .first()
    )

    if not best_attempt or best_attempt.score < 75:
        return jsonify({
            "error": "Certificate requires a passing score of 75% or higher",
            "status": 403,
        }), 403

    user = User.query.get(user_id)
    quiz = Quiz.query.get(quiz_id)
    if not user or not quiz or not quiz.topic:
        return jsonify({"error": "Quiz or user not found", "status": 404}), 404

    # Check for existing certificate
    existing = Certificate.query.filter_by(user_id=user_id, quiz_id=quiz_id).first()
    if existing:
        # Ensure PDF exists; regenerate if missing.
        if not existing.pdf_path or not os.path.exists(existing.pdf_path):
            pdf_path = _build_certificate_pdf_path(existing.certificate_uid)
            _generate_certificate_pdf(existing, user, quiz, pdf_path)
            existing.pdf_path = pdf_path
            db.session.commit()
        return jsonify(existing.to_dict()), 200

    # Create record
    cert_uid = f"CERT-{uuid.uuid4().hex[:8].upper()}"
    new_cert = Certificate(
        user_id=user_id,
        quiz_id=quiz_id,
        certificate_uid=cert_uid,
        score=best_attempt.score,
        issued_at=datetime.utcnow(),
    )

    try:
        pdf_path = _build_certificate_pdf_path(cert_uid)
        _generate_certificate_pdf(new_cert, user, quiz, pdf_path)
        new_cert.pdf_path = pdf_path

        db.session.add(new_cert)
        db.session.commit()
        return jsonify(new_cert.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "status": 500}), 500


@certificate_bp.route('/download/<cert_uid>', methods=['GET'])
def download_cert(cert_uid):
    cert = Certificate.query.filter_by(certificate_uid=cert_uid).first()
    if not cert:
        return jsonify({"error": "Certificate not found", "status": 404}), 404

    if not cert.pdf_path or not os.path.exists(cert.pdf_path):
        return jsonify({"error": "Certificate PDF not available", "status": 404}), 404

    return send_file(
        cert.pdf_path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"{cert.certificate_uid}.pdf",
    )
