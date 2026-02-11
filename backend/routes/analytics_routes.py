from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.attempt import QuizAttempt
from models.quiz import Quiz
from models.topic import Topic
from database.db import db
import json

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user_analytics(user_id):

    current_user = get_jwt_identity()
    if str(current_user) != str(user_id):
        return jsonify({"error": "Unauthorized"}), 403

    topic_filter = request.args.get("topic_id")

    # ✅ Proper SQL-level filtering
    attempts_query = (
        db.session.query(QuizAttempt)
        .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
        .filter(QuizAttempt.user_id == user_id)
    )

    if topic_filter:
        attempts_query = attempts_query.filter(
            Quiz.topic_id == topic_filter
        )

    attempts = attempts_query.order_by(
        QuizAttempt.attempted_at.asc()
    ).all()

    if not attempts:
        return jsonify({
            "availableTopics": [],
            "accuracyTrend": [],
            "weakConcepts": [],
            "difficultyBreakdown": [],
            "integrityReport": {
                "totalViolations": 0,
                "suspiciousAttempts": 0,
                "tabSwitches": 0,
                "windowBlurs": 0
            },
            "aiInsights": None
        }), 200

    accuracy_trend = []
    concept_stats = {}
    difficulty_stats = {"easy": [], "medium": [], "hard": []}
    total_violations = 0
    suspicious_count = 0

    for attempt in attempts:

        quiz = Quiz.query.get(attempt.quiz_id)
        if not quiz:
            continue

        topic = quiz.topic

        accuracy_trend.append({
            "date": attempt.attempted_at.strftime("%Y-%m-%d"),
            "score": attempt.score,
            "topic": topic.title
        })

        # Integrity
        flags = json.loads(attempt.integrity_flags) if attempt.integrity_flags else []
        total_violations += len(flags)
        if len(flags) > 3:
            suspicious_count += 1

        # Question-level analytics
        for r in attempt.question_results:
            concept = r.get("concept_tag", "general")
            difficulty = r.get("difficulty", "medium")

            if concept not in concept_stats:
                concept_stats[concept] = {"correct": 0, "total": 0}

            concept_stats[concept]["total"] += 1
            if r.get("is_correct"):
                concept_stats[concept]["correct"] += 1

            if difficulty in difficulty_stats:
                difficulty_stats[difficulty].append(
                    1 if r.get("is_correct") else 0
                )


    weak_concepts = []

    for concept, stats in concept_stats.items():
        if stats["total"] >= 3:
            score = round((stats["correct"] / stats["total"]) * 100, 2)
            weak_concepts.append({
                "concept": concept,
                "score": score,
                "totalQuestions": stats["total"]
            })

    weak_concepts.sort(key=lambda x: x["score"])


    diff_breakdown = []
    for difficulty, values in difficulty_stats.items():
        if values:
            score = round((sum(values) / len(values)) * 100, 2)
        else:
            score = 0

        diff_breakdown.append({
            "difficulty": difficulty,
            "score": score
        })

   

    suggestions = []
    resources = []

    # Concept-based suggestion (only if weak)
    if weak_concepts and weak_concepts[0]["score"] < 70:
        worst = weak_concepts[0]

        suggestions.append(
            f"You are struggling with '{worst['concept']}' "
            f"(accuracy {worst['score']}%). Focus revision here first."
        )

        # Generic concept-based search link
        resources.append({
            "title": f"Improve {worst['concept']}",
            "type": "search",
            "url": f"https://www.google.com/search?q={worst['concept']}+concept+explained"
        })

    # Difficulty instability
    unstable = [d for d in diff_breakdown if d["score"] < 60]
    if unstable:
        suggestions.append(
            "Your difficulty handling is unstable. Practice mixed-difficulty timed quizzes."
        )

    # Integrity insight
    if suspicious_count > 0:
        suggestions.append(
            "Integrity flags detected. Stay focused to build exam resilience."
        )

    # Positive reinforcement
    if not suggestions:
        suggestions.append(
            "Excellent consistency. Increase difficulty level gradually."
        )

    # Fallback resource if nothing added
    if not resources:
        resources.append({
            "title": "Active Recall Strategy",
            "type": "article",
            "url": "https://www.coursera.org/articles/study-techniques"
        })

  

    topic_ids = set()
    available_topics = []

    for attempt in attempts:
        quiz = Quiz.query.get(attempt.quiz_id)
        if quiz and quiz.topic_id not in topic_ids:
            topic_ids.add(quiz.topic_id)
            available_topics.append({
                "id": quiz.topic.id,
                "name": quiz.topic.title
            })


    return jsonify({
        "availableTopics": available_topics,
        "accuracyTrend": accuracy_trend,
        "weakConcepts": weak_concepts[:5],
        "difficultyBreakdown": diff_breakdown,
        "integrityReport": {
            "totalViolations": total_violations,
            "suspiciousAttempts": suspicious_count,
            "tabSwitches": total_violations // 2,
            "windowBlurs": total_violations // 2,
        },
        "aiInsights": {
            "suggestions": suggestions,
            "recommendedResources": resources
        }
    }), 200
