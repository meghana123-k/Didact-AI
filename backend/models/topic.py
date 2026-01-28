
from database.db import db
from datetime import datetime
import uuid

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

    __table_args__ = (
        db.UniqueConstraint(
            'user_id',
            'title',
            'mode',
            name='uq_user_title_mode'
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "extracted_text": self.extracted_text,
            "summary": self.summary,
            "mode": self.mode,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
