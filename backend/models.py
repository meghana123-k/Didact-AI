
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    topics = db.relationship('Topic', backref='author', lazy=True)
    attempts = db.relationship('QuizAttempt', backref='user', lazy=True)
    certificates = db.relationship('Certificate', backref='user', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat()
        }

class Topic(db.Model):
    __tablename__ = 'topics'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    extracted_text = db.Column(db.Text, nullable=False)
    summary = db.Column(db.Text, nullable=False)
    mode = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    quizzes = db.relationship('Quiz', backref='topic', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "extracted_text": self.extracted_text,
            "summary": self.summary,
            "mode": self.mode,
            "created_at": self.created_at.isoformat()
        }

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = db.Column(db.String(36), db.ForeignKey('topics.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    questions = db.relationship('Question', backref='quiz', lazy=True, cascade="all, delete-orphan")
    attempts = db.relationship('QuizAttempt', backref='quiz', lazy=True)
    certificates = db.relationship('Certificate', backref='quiz', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "topic_id": self.topic_id,
            "created_at": self.created_at.isoformat(),
            "questions": [q.to_dict() for q in self.questions]
        }

class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = db.Column(db.String(36), db.ForeignKey('quizzes.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    options = db.Column(db.Text, nullable=False) # JSON list
    correct_answer = db.Column(db.Integer, nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)
    concept_tag = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "quiz_id": self.quiz_id,
            "text": self.text,
            "options": json.loads(self.options),
            "correct_answer": self.correct_answer,
            "difficulty": self.difficulty,
            "concept_tag": self.concept_tag
        }

class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = db.Column(db.String(36), db.ForeignKey('quizzes.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    attempt_number = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Float, nullable=False)
    answers_json = db.Column(db.Text, nullable=False)
    time_taken_seconds = db.Column(db.Integer, nullable=False)
    attempted_at = db.Column(db.DateTime, default=datetime.utcnow)
    integrity_flags = db.Column(db.Text, nullable=True) # JSON list

    def to_dict(self):
        return {
            "id": self.id,
            "quiz_id": self.quiz_id,
            "user_id": self.user_id,
            "attempt_number": self.attempt_number,
            "score": self.score,
            "answers_json": json.loads(self.answers_json),
            "time_taken_seconds": self.time_taken_seconds,
            "attempted_at": self.attempted_at.isoformat(),
            "integrity_flags": json.loads(self.integrity_flags) if self.integrity_flags else []
        }

class Certificate(db.Model):
    __tablename__ = 'certificates'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    quiz_id = db.Column(db.String(36), db.ForeignKey('quizzes.id'), nullable=False)
    certificate_uid = db.Column(db.String(50), unique=True, nullable=False)
    score = db.Column(db.Float, nullable=False)
    issued_at = db.Column(db.DateTime, default=datetime.utcnow)
    pdf_path = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "quiz_id": self.quiz_id,
            "certificate_uid": self.certificate_uid,
            "score": self.score,
            "topic_title": self.quiz.topic.title if self.quiz else "Unknown",
            "user_name": self.user.name if self.user else "Unknown",
            "issued_at": self.issued_at.isoformat(),
            "pdf_url": f"/api/certificate/download/{self.certificate_uid}"
        }
