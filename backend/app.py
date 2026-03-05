from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from database.db import db

from routes.auth_routes import auth_bp
from routes.topic_routes import topic_bp
from routes.quiz_routes import quiz_bp
# from routes.attempt_routes import attempt_bp
from routes.integrity_routes import integrity_bp
from routes.analytics_routes import analytics_bp
from routes.certificate_routes import certificate_bp
from dotenv import load_dotenv

load_dotenv()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ✅ Correct CORS & preflight
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                ]
            }
        },
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        max_age=3600,
    )

    # Init Extensions
    db.init_app(app)
    jwt = JWTManager(app)

    # Standard JWT error handlers -> clean JSON
    @jwt.unauthorized_loader
    def missing_jwt(err):
        return jsonify({"error": "Missing or invalid authorization token", "status": 401}), 401

    @jwt.invalid_token_loader
    def invalid_jwt(err):
        return jsonify({"error": "Invalid token", "status": 401}), 401

    @jwt.expired_token_loader
    def expired_jwt(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired", "status": 401}), 401

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(topic_bp, url_prefix="/api/topic")
    app.register_blueprint(quiz_bp, url_prefix="/api/quiz")
    # app.register_blueprint(attempt_bp, url_prefix="/api/attempt")
    app.register_blueprint(integrity_bp, url_prefix="/api/integrity")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(certificate_bp, url_prefix="/api/certificate")

    # Health & global 404
    @app.route("/api/health")
    def health():
        return jsonify({"status": "DidAct AI Backend Running"}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found", "status": 404}), 404

    return app


# ✅ Run Server Correctly
if __name__ == "__main__":
    app = create_app()

    # ✅ Create tables AFTER app is created
    with app.app_context():
        from models import User, Topic, Quiz, Question, QuizAttempt, Certificate

        db.create_all()
        print("✅ Database tables created successfully!")

    app.run(host="127.0.0.1", port=5001, debug=True)
