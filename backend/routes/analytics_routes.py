
from flask import Blueprint, jsonify
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
        return jsonify({"error": "Unauthorized", "status": 403}), 403

    attempts = (
        QuizAttempt.query.filter_by(user_id=user_id)
        .order_by(QuizAttempt.attempted_at.asc())
        .all()
    )

    if not attempts:
        return jsonify({"message": "No data available", "status": 200}), 200

    # 1. Accuracy Trend
    accuracy_trend = [
        {"date": a.attempted_at.strftime("%Y-%m-%d"), "score": a.score} for a in attempts
    ]

    # 2. Concept Breakdown & Weak Spots
    concept_stats = {}
    difficulty_stats = {"easy": [], "medium": [], "hard": []}
    total_violations = 0
    suspicious_count = 0

    for a in attempts:
        quiz = Quiz.query.get(a.quiz_id)
        if not quiz:
            continue

        flags = json.loads(a.integrity_flags) if a.integrity_flags else []
        total_violations += len(flags)
        if len(flags) > 3:
            suspicious_count += 1

        # ✅ Use stored per-question results for fast analytics
        if not a.question_results:
            continue

        for r in a.question_results:
            concept = r["concept_tag"]
            difficulty = r["difficulty"]

            # Concept stats
            if concept not in concept_stats:
                concept_stats[concept] = {"correct": 0, "total": 0}

            concept_stats[concept]["total"] += 1
            if r["is_correct"]:
                concept_stats[concept]["correct"] += 1

            # Difficulty stats
            if difficulty not in difficulty_stats:
                difficulty_stats[difficulty] = []
            difficulty_stats[difficulty].append(1 if r["is_correct"] else 0)

    weak_concepts = [
        {
            "concept": k,
            "score": (v["correct"] / v["total"]) * 100,
            "totalQuestions": v["total"],
        }
        for k, v in concept_stats.items()
        if v["total"] > 0
    ]
    weak_concepts.sort(key=lambda x: x["score"])

    diff_breakdown = [
        {
            "difficulty": k,
            "score": (sum(v) / len(v)) * 100 if v else 0,
        }
        for k, v in difficulty_stats.items()
    ]

    # 3. Heuristic AI-style insights and recommended resources
    suggestions = []
    resources = []

    if weak_concepts:
        worst = weak_concepts[0]
        suggestions.append(
            f"Revisit the concept '{worst['concept']}' — your accuracy here is only {worst['score']:.0f}%. "
            f"Spend extra time solving 5–10 focused problems on this topic."
        )
        resources.append(
            {
                "title": f"Crash course on {worst['concept']}",
                "type": "course",
                "url": f"https://www.khanacademy.org/search?page_search_query={worst['concept'].replace(' ', '%20')}",
            }
        )

    medium_perf = [d for d in diff_breakdown if 40 <= d["score"] < 70]
    if medium_perf:
        suggestions.append(
            "Your performance on medium-difficulty questions is inconsistent. "
            "Practice timed quizzes with mixed difficulty to build stability."
        )

    if total_violations > 0:
        suggestions.append(
            "Integrity events (tab-switch or window blur) were detected. "
            "Try to stay focused in one window to build real exam resilience."
        )

    # Fallback generic tips
    if not suggestions:
        suggestions.append(
            "Great work maintaining consistent performance. Gradually increase difficulty and review explanations for any missed questions."
        )

    if len(resources) < 3:
        resources.append(
            {
                "title": "Active recall & spaced repetition guide",
                "type": "article",
                "url": "https://www.coursera.org/articles/study-techniques",
            }
        )
        resources.append(
            {
                "title": "Evidence-based learning strategies",
                "type": "article",
                "url": "https://www.scientificamerican.com/article/the-science-of-effective-learning/",
            }
        )

    return jsonify({
        "accuracyTrend": accuracy_trend,
        "weakConcepts": weak_concepts[:5],
        "difficultyBreakdown": diff_breakdown,
        "integrityReport": {
            "totalViolations": total_violations,
            "suspiciousAttempts": suspicious_count,
            "tabSwitches": total_violations // 2,  # Approximation for dashboard
            "windowBlurs": total_violations // 2,
        },
        "aiInsights": {
            "suggestions": suggestions,
            "recommendedResources": resources,
        },
    }), 200
