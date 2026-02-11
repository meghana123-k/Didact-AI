# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from database.db import db
# from models.quiz import Quiz
# from models.question import Question

# from models.attempt import QuizAttempt
# from datetime import datetime, timedelta
# import json

# attempt_bp = Blueprint('attempt', __name__)

# @attempt_bp.route('', methods=['POST'])
# @jwt_required()
# def submit_attempt():
#     user_id = get_jwt_identity()
#     data = request.get_json()
#     quiz_id = data.get('quiz_id')
#     answers = data.get('answers', [])
#     time_taken = data.get('time_taken_seconds', 0)
#     integrity_flags = data.get('integrity_flags', [])
    
#     if not quiz_id:
#         return jsonify({"error": "Quiz ID is required"}), 400
        
#     # Check attempt limits
#     existing_attempts = QuizAttempt.query.filter_by(user_id=user_id, quiz_id=quiz_id).all()
#     if len(existing_attempts) >= 10:
#         last_attempt = max(existing_attempts, key=lambda x: x.attempted_at)
#         cooldown_end = last_attempt.attempted_at + timedelta(minutes=30)
#         if datetime.utcnow() < cooldown_end:
#             wait_seconds = (cooldown_end - datetime.utcnow()).total_seconds()
#             return jsonify({
#                 "error": "Cooldown in effect. Max 10 attempts per quiz.",
#                 "retry_after": int(wait_seconds)
#             }), 429
            
#     quiz = Quiz.query.get(quiz_id)
#     if not quiz:
#         return jsonify({"error": "Quiz not found"}), 404
        
#     # Calculate Score
#     correct_count = 0
#     questions = sorted(quiz.questions, key=lambda x: x.id)
#     for idx, ans in enumerate(answers):
#         if idx < len(questions) and ans == questions[idx].correct_answer:
#             correct_count += 1
            
#     score = (correct_count / len(questions)) * 100 if questions else 0
    
#     new_attempt = QuizAttempt(
#         quiz_id=quiz_id,
#         user_id=user_id,
#         attempt_number=len(existing_attempts) + 1,
#         score=score,
#         answers_json=json.dumps(answers),
#         time_taken_seconds=time_taken,
#         integrity_flags=json.dumps(integrity_flags)
#     )
    
#     try:
#         db.session.add(new_attempt)
#         db.session.commit()
#         return jsonify(new_attempt.to_dict()), 201
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": str(e)}), 500

# @attempt_bp.route('/history/<quiz_id>', methods=['GET'])
# @jwt_required()
# def get_quiz_history(quiz_id):
#     user_id = get_jwt_identity()
#     attempts = QuizAttempt.query.join(Quiz).filter(
#     Quiz.topic_id == quiz.topic_id,
#     QuizAttempt.user_id == user_id
# ).all()

#     return jsonify([a.to_dict() for a in attempts]), 200
