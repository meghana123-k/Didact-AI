from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .topic import Topic
from .quiz import Quiz
from .question import Question
from .attempt import QuizAttempt
from .certificate import Certificate
