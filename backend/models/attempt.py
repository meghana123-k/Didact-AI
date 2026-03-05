from database.db import db
from datetime import datetime
import uuid
import json

class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempts"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = db.Column(db.String(36), db.ForeignKey("quizzes.id"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)

    attempt_number = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Float, nullable=False)

    answers_json = db.Column(db.Text, nullable=False)
    time_taken_seconds = db.Column(db.Integer, nullable=False)

    attempted_at = db.Column(db.DateTime, default=datetime.utcnow)
    integrity_flags = db.Column(db.Text, nullable=True)
    question_results = db.Column(db.JSON, nullable=False)

    def to_dict(self):
        results = self.question_results

        if isinstance(results, str):
            results = json.loads(results)

        return {
            "id": self.id,
            "quiz_id": self.quiz_id,
            "user_id": self.user_id,
            "attempt_number": self.attempt_number,
            "score": self.score,
            "question_results": results,
            "answers": json.loads(self.answers_json),
            "time_taken_seconds": self.time_taken_seconds,
            "attempted_at": self.attempted_at.isoformat(),
            "integrity_flags": json.loads(self.integrity_flags) if self.integrity_flags else []
        }
