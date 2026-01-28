from database.db import db
from datetime import datetime
import uuid

class Quiz(db.Model):
    __tablename__ = "quizzes"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = db.Column(db.String(36), db.ForeignKey("topics.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    questions = db.relationship("Question", backref="quiz", cascade="all, delete-orphan")
    attempts = db.relationship("QuizAttempt", backref="quiz")
    certificates = db.relationship("Certificate", backref="quiz")

    def to_dict(self):
        return {
            "id": self.id,
            "topic_id": self.topic_id,
            "created_at": self.created_at.isoformat(),
            "questions": [q.to_dict() for q in self.questions]
        }

