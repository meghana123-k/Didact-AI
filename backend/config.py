
import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'didact-ai-enterprise-secret-2025')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-super-secret-key-0987')
    # Use PostgreSQL if DATABASE_URL is provided, else fallback to SQLite for local development
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///didact_v3_prod.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'backend', 'certificates', 'generated')
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}
    CERT_MIN_SCORE = int(os.environ.get("CERT_MIN_SCORE", 75))

    # Ensure upload directory exists
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
