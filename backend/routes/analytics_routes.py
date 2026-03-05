from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.attempt import QuizAttempt
from models.quiz import Quiz
from models.topic import Topic
from database.db import db
from services.recommendation_service import (fetch_youtube_video, recommendation_cache,CACHE_TTL)
from datetime import datetime
import json

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user_analytics(user_id):

    current_user = get_jwt_identity()
    if str(current_user) != str(user_id):
        return jsonify({"error": "Unauthorized"}), 403

    topic_filter = request.args.get("topic_id")

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
            "overallScore": 0,
            "performanceTier": "N/A",
            "integrityReport": {
                "totalViolations": 0,
                "suspiciousAttempts": 0,
                "tabSwitches": 0,
                "windowBlurs": 0
            },
            "aiInsights": None
        }), 200

    overall_score = round(
        sum(a.score for a in attempts) / len(attempts), 2
    )

    if overall_score >= 90:
        performance_tier = "Expert"
    elif overall_score >= 75:
        performance_tier = "Advanced"
    elif overall_score >= 60:
        performance_tier = "Intermediate"
    else:
        performance_tier = "Needs Improvement"

    accuracy_trend = []
    concept_stats = {}
    difficulty_stats = {"easy": [], "medium": [], "hard": []}

    total_violations = 0
    suspicious_count = 0
    tab_switch_count = 0
    window_blur_count = 0


    for attempt in attempts:

        quiz = Quiz.query.get(attempt.quiz_id)
        if not quiz:
            continue

        accuracy_trend.append({
            "date": attempt.attempted_at.strftime("%Y-%m-%d"),
            "score": attempt.score,
            "topic": quiz.topic.title
        })

        flags = json.loads(attempt.integrity_flags) if attempt.integrity_flags else []

        total_violations += len(flags)

        for f in flags:
            if f == "tab_switch":
                tab_switch_count += 1
            elif f == "window_blur":
                window_blur_count += 1

        if len(flags) > 3:
            suspicious_count += 1


        results = attempt.question_results or []

        if isinstance(results, str):
            results = json.loads(results)

        for r in results:
            raw_concept = r.get("concept_tag", "general")

            concept = raw_concept.strip().lower()

            difficulty = r.get("difficulty", "medium")

            concept_stats.setdefault(concept, {"correct": 0, "total": 0})
            concept_stats[concept]["total"] += 1

            if r.get("is_correct"):
                concept_stats[concept]["correct"] += 1

            if difficulty in difficulty_stats:
                difficulty_stats[difficulty].append(
                    1 if r.get("is_correct") else 0
                )
    weak_concepts = []

    for c, s in concept_stats.items():
        if s["total"] == 0:
            continue

        accuracy = (s["correct"] / s["total"]) * 100

       
        if s["total"] >= 2 and accuracy < 70:
            weak_concepts.append({
                "concept": c,
                "score": round(accuracy, 2),
                "totalQuestions": s["total"]
            })

    weak_concepts.sort(key=lambda x: x["score"])

  
    diff_breakdown = [
        {
            "difficulty": d,
            "score": round((sum(v) / len(v)) * 100, 2) if v else 0
        }
        for d, v in difficulty_stats.items()
    ]

   
    suggestions = []

    if weak_concepts:
        worst = weak_concepts[0]
        suggestions.append(
            f"You are struggling with '{worst['concept']}' "
            f"(accuracy {worst['score']}%). Prioritize this concept."
        )

    if overall_score >= 90:
        suggestions.append(
            "Outstanding mastery detected. Begin advanced-level problem solving."
        )
    elif overall_score >= 75:
        suggestions.append(
            "Strong performance. Increase exposure to hard-level questions."
        )
    elif overall_score < 60:
        suggestions.append(
            "Revisit fundamentals before progressing further."
        )

    if suspicious_count > 0:
        suggestions.append(
            "Integrity flags detected. Stay focused during assessments."
        )

    
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
        "overallScore": overall_score,
        "performanceTier": performance_tier,
        "integrityReport": {
            "totalViolations": total_violations,
            "suspiciousAttempts": suspicious_count,
            "tabSwitches": tab_switch_count,
            "windowBlurs": window_blur_count,
        },
        "aiInsights": {
            "suggestions": suggestions,
            "recommendedResources": []
        }
    }), 200
