from database.db import db
from datetime import datetime
import uuid

class Certificate(db.Model):
    __tablename__ = 'certificates'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    quiz_id = db.Column(db.String(36), db.ForeignKey('quizzes.id'), nullable=False)

    certificate_uid = db.Column(db.String(50), unique=True, nullable=False)
    score = db.Column(db.Float, nullable=False)
    issued_at = db.Column(db.DateTime, default=datetime.utcnow)

    file_path = db.Column(db.String(255), nullable=True)

    # Proper relationship
    user = db.relationship("User", back_populates="certificates")
    quiz = db.relationship("Quiz", back_populates="certificates")
    
    def to_dict(self):
        return {
            "id": self.id,
            "certificate_uid": self.certificate_uid,
            "score": self.score,
            "issued_at": self.issued_at.strftime("%d %B %Y"),
            "topic_title": self.quiz.topic.title,
            "user_name": self.user.name,
            "download_url": f"/api/certificate/download/{self.certificate_uid}"
        }
