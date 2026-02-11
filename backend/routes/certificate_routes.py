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
from PIL import Image, ImageDraw, ImageFont

certificate_bp = Blueprint('certificate', __name__)


def _build_file_path(cert_uid: str):
    base = current_app.config.get("UPLOAD_FOLDER", "certificates")
    os.makedirs(base, exist_ok=True)
    return os.path.join(base, f"{cert_uid}.png")


def _generate_certificate(cert, user, quiz, path):

    width, height = 1600, 1100
    image = Image.new("RGB", (width, height), "#fdfcf8")
    draw = ImageDraw.Draw(image)

    try:
        title_font = ImageFont.truetype("arial.ttf", 70)
        name_font = ImageFont.truetype("arial.ttf", 55)
        body_font = ImageFont.truetype("arial.ttf", 35)
        small_font = ImageFont.truetype("arial.ttf", 25)
    except:
        title_font = name_font = body_font = small_font = None

    # Border
    draw.rectangle([40, 40, width-40, height-40], outline="#1e3a8a", width=8)

    # Title
    draw.text((width/2, 200), "Certificate of Achievement",
              fill="#1e3a8a", font=title_font, anchor="mm")

    draw.text((width/2, 300), "This is proudly presented to",
              fill="black", font=body_font, anchor="mm")

    draw.text((width/2, 420), user.name,
              fill="#0f172a", font=name_font, anchor="mm")

    text = f"For successfully completing the mastery assessment on '{quiz.topic.title}' with a score of {cert.score:.1f}%."
    draw.text((width/2, 520), text,
              fill="black", font=body_font, anchor="mm")

    draw.text((150, 950),
              f"Issued on: {cert.issued_at.strftime('%d %B %Y')}",
              fill="black", font=small_font)

    draw.text((150, 990),
              f"Certificate ID: {cert.certificate_uid}",
              fill="black", font=small_font)

    image.save(path)


@certificate_bp.route('/generate/<quiz_id>', methods=['POST'])
@jwt_required()
def generate_certificate(quiz_id):

    user_id = get_jwt_identity()

    best_attempt = (
        QuizAttempt.query
        .filter_by(user_id=user_id, quiz_id=quiz_id)
        .order_by(QuizAttempt.score.desc())
        .first()
    )

    # if not best_attempt or best_attempt.score < 75:
    #     return jsonify({"error": "Minimum 75% required"}), 403
    MIN_SCORE = current_app.config.get("CERT_MIN_SCORE", 75)

    if not best_attempt or best_attempt.score < MIN_SCORE:
        return jsonify({
            "error": f"Minimum {MIN_SCORE}% required"
        }), 403


    user = User.query.get(user_id)
    quiz = Quiz.query.get(quiz_id)

    existing = Certificate.query.filter_by(user_id=user_id, quiz_id=quiz_id).first()

    if existing:
        if not existing.file_path or not os.path.exists(existing.file_path):
            path = _build_file_path(existing.certificate_uid)
            _generate_certificate(existing, user, quiz, path)
            existing.file_path = path
            db.session.commit()
        return jsonify(existing.to_dict())

    cert_uid = f"CERT-{uuid.uuid4().hex[:8].upper()}"

    new_cert = Certificate(
        user_id=user_id,
        quiz_id=quiz_id,
        certificate_uid=cert_uid,
        score=best_attempt.score,
        issued_at=datetime.utcnow()
    )

    try:
        path = _build_file_path(cert_uid)
        _generate_certificate(new_cert, user, quiz, path)
        new_cert.file_path = path

        db.session.add(new_cert)
        db.session.commit()

        return jsonify(new_cert.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@certificate_bp.route('/download/<cert_uid>')
def download_certificate(cert_uid):

    cert = Certificate.query.filter_by(certificate_uid=cert_uid).first()

    if not cert or not cert.file_path or not os.path.exists(cert.file_path):
        return jsonify({"error": "Certificate not found"}), 404

    return send_file(
        cert.file_path,
        mimetype="image/png",
        as_attachment=True,
        download_name=f"{cert.certificate_uid}.png"
    )


@certificate_bp.route('/my')
@jwt_required()
def get_my_certificates():
    user_id = get_jwt_identity()

    certs = Certificate.query.filter_by(user_id=user_id)\
        .order_by(Certificate.issued_at.desc()).all()

    return jsonify([c.to_dict() for c in certs])
