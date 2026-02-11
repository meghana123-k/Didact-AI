from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.attempt import QuizAttempt
from models.quiz import Quiz
import json

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user_analytics(user_id):
    current_user = get_jwt_identity()
    if str(current_user) != str(user_id):
        return jsonify({"error": "Unauthorized"}), 403

    topic_filter = request.args.get("topic_id")

    attempts_query = QuizAttempt.query.filter_by(user_id=user_id)

    attempts = attempts_query.order_by(
        QuizAttempt.attempted_at.asc()
    ).all()

    if not attempts:
        return jsonify({
            "accuracyTrend": [],
            "weakConcepts": [],
            "difficultyBreakdown": [],
            "integrityReport": {
                "totalViolations": 0,
                "suspiciousAttempts": 0,
                "tabSwitches": 0,
                "windowBlurs": 0
            }
        }), 200

    accuracy_trend = []
    concept_stats = {}
    difficulty_stats = {"easy": [], "medium": [], "hard": []}
    total_violations = 0
    suspicious_count = 0

    for a in attempts:
        quiz = Quiz.query.get(a.quiz_id)
        if not quiz:
            continue

        topic = quiz.topic

        if topic_filter and str(topic.id) != str(topic_filter):
            continue

        accuracy_trend.append({
            "date": a.attempted_at.strftime("%Y-%m-%d"),
            "score": a.score,
            "topic": topic.title
        })

        flags = json.loads(a.integrity_flags) if a.integrity_flags else []
        total_violations += len(flags)
        if len(flags) > 3:
            suspicious_count += 1

        for r in a.question_results:
            concept = r["concept_tag"]
            difficulty = r["difficulty"]

            if concept not in concept_stats:
                concept_stats[concept] = {"correct": 0, "total": 0}

            concept_stats[concept]["total"] += 1
            if r["is_correct"]:
                concept_stats[concept]["correct"] += 1

            difficulty_stats[difficulty].append(
                1 if r["is_correct"] else 0
            )

    weak_concepts = [
        {
            "concept": k,
            "score": round((v["correct"] / v["total"]) * 100, 2),
            "totalQuestions": v["total"]
        }
        for k, v in concept_stats.items()
        if v["total"] >= 3  # avoid noise
    ]

    weak_concepts.sort(key=lambda x: x["score"])

    diff_breakdown = [
        {
            "difficulty": k,
            "score": round((sum(v) / len(v)) * 100, 2) if v else 0
        }
        for k, v in difficulty_stats.items()
    ]

    # ===== Intelligent Recommendations =====
    suggestions = []
    resources = []

    if weak_concepts:
        worst = weak_concepts[0]
        suggestions.append(
            f"You are struggling with '{worst['concept']}' "
            f"(accuracy {worst['score']}%). Focus revision here first."
        )

    low_difficulty = [
        d for d in diff_breakdown if d["score"] < 60
    ]

    if low_difficulty:
        suggestions.append(
            "Your difficulty handling is unstable. "
            "Practice mixed-difficulty timed quizzes."
        )

    if suspicious_count > 0:
        suggestions.append(
            "Integrity flags detected. Stay focused to build exam resilience."
        )

    if not suggestions:
        suggestions.append(
            "Excellent consistency. Increase difficulty level gradually."
        )

    resources = [
        {
            "title": "Active Recall Strategy",
            "type": "article",
            "url": "https://www.coursera.org/articles/study-techniques"
        }
    ]

    return jsonify({
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
