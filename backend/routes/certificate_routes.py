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
import textwrap
import qrcode
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

    # ---------- Fonts ----------
    try:
        title_font = ImageFont.truetype("arial.ttf", 80)
        name_font = ImageFont.truetype("arial.ttf", 70)
        body_font = ImageFont.truetype("arial.ttf", 36)
        small_font = ImageFont.truetype("arial.ttf", 26)
    except:
        title_font = name_font = body_font = small_font = None

    # ---------- Double Border ----------
    draw.rectangle([40, 40, width-40, height-40], outline="#1e3a8a", width=8)
    draw.rectangle([80, 80, width-80, height-80], outline="#1e3a8a", width=2)

    # ---------- Branding ----------
    draw.text(
        (width/2, 130),
        "DidactAI Learning System",
        fill="#475569",
        font=small_font,
        anchor="mm"
    )

    # ---------- Title ----------
    draw.text(
        (width/2, 200),
        "Certificate of Achievement",
        fill="#1e3a8a",
        font=title_font,
        anchor="mm"
    )

    # ---------- Subtitle ----------
    draw.text(
        (width/2, 280),
        "This is proudly presented to",
        fill="black",
        font=body_font,
        anchor="mm"
    )

    # ---------- Student Name ----------
    draw.text(
        (width/2, 400),
        user.name,
        fill="#0f172a",
        font=name_font,
        anchor="mm"
    )

    # ---------- Divider ----------
    draw.line(
        (width/2 - 350, 470, width/2 + 350, 470),
        fill="#1e3a8a",
        width=3
    )

    # ---------- Body Text (Wrapped) ----------
    body_text = f"For successfully completing the mastery assessment on '{quiz.topic.title}' with a score of {cert.score:.1f}%."

    wrapped = textwrap.fill(body_text, width=60)

    draw.multiline_text(
        (width/2, 560),
        wrapped,
        fill="black",
        font=body_font,
        anchor="mm",
        align="center"
    )

    # ---------- Gold Certification Seal ----------
    draw.ellipse(
        (width/2 - 70, 650, width/2 + 70, 770),
        outline="#d4af37",
        width=6
    )

    draw.text(
        (width/2, 710),
        "CERTIFIED",
        fill="#d4af37",
        font=small_font,
        anchor="mm"
    )

    # ---------- Signature ----------
    draw.line((1100, 900, 1400, 900), fill="black", width=2)

    draw.text(
        (1250, 930),
        "DidactAI Academic Board",
        fill="black",
        font=small_font,
        anchor="mm"
    )

    # ---------- Footer Info ----------
    draw.text(
        (150, 950),
        f"Issued on: {cert.issued_at.strftime('%d %B %Y')}",
        fill="black",
        font=small_font
    )

    draw.text(
        (150, 990),
        f"Certificate ID: {cert.certificate_uid}",
        fill="black",
        font=small_font
    )

    # ---------- QR Code Verification ----------
    try:
        verify_url = f"http://localhost:5173/verify/{cert.certificate_uid}"

        qr = qrcode.make(verify_url)
        qr = qr.resize((140, 140))

        image.paste(qr, (1350, 880))
    except:
        pass

    image.save(path)


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