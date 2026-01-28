from database.db import db
import uuid
import json

class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = db.Column(db.String(36), db.ForeignKey("quizzes.id"), nullable=False)

    text = db.Column(db.Text, nullable=False)
    options = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.Integer, nullable=False)

    difficulty = db.Column(db.String(20), nullable=False)
    concept_tag = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "text": self.text,
            "options": json.loads(self.options),
            "correct_answer": self.correct_answer,
            "difficulty": self.difficulty,
            "concept_tag": self.concept_tag
        }

