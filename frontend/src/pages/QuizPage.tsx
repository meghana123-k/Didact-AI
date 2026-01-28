import React, { useState, useEffect } from "react";
import { User, Topic, Quiz, QuizAttempt } from "../types";

import { topicService } from "../services/topicService";
import { quizService } from "../services/quizService";
import { certificateService } from "../services/certificateService";

import QuizAttemptSession from "../components/QuizAttemptSession";

interface QuizPageProps {
  user: User;
}

const QuizPage: React.FC<QuizPageProps> = ({ user }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");

  const [loading, setLoading] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);

  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);

  const [error, setError] = useState("");
  const [certLoading, setCertLoading] = useState<string | null>(null);

  const token = localStorage.getItem("token") || "";

  // ================================
  // Load Topic History
  // ================================
  useEffect(() => {
    async function loadTopics() {
      try {
        const history = await topicService.getHistory(user.id, token);
        setTopics(history);
      } catch {
        setError("Failed to load saved topics.");
      }
    }

    loadTopics();
  }, [user.id]);

  // ================================
  // Generate Quiz (Backend Only)
  // ================================
  const handleGenerate = async () => {
    if (!selectedTopicId) {
      return setError("Please select a topic first.");
    }

    setLoading(true);
    setError("");

    try {
      // ✅ Backend generates quiz automatically
      const newQuiz = await quizService.generate(selectedTopicId, token);

      setCurrentQuiz(newQuiz);

      // Load attempts history
      const history = await quizService.getAttemptHistory(newQuiz.id, token);
      setAttempts(history);
    } catch (err: any) {
      setError(err.message || "Quiz generation failed.");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // Claim Certificate
  // ================================
  const handleClaimCert = async (quizId: string) => {
    setCertLoading(quizId);

    try {
      const cert = await certificateService.generate(quizId, token);

      alert(`Certificate Issued: ${cert.certificate_uid}`);

      window.open(
        certificateService.getDownloadUrl(cert.certificate_uid),
        "_blank",
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCertLoading(null);
    }
  };

  // ================================
  // Quiz Attempt Session
  // ================================
  if (isTakingQuiz && currentQuiz) {
    return (
      <QuizAttemptSession
        quiz={currentQuiz}
        user={user}
        onComplete={(attempt) => {
          setIsTakingQuiz(false);
          setAttempts((prev) => [attempt, ...prev]);
        }}
        onCancel={() => setIsTakingQuiz(false)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl shadow border">
        <h1 className="text-3xl font-bold text-slate-800">
          Mastery Assessments
        </h1>

        <p className="text-slate-500 mt-2">
          Select a saved topic → Backend generates a 30-question quiz.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="px-4 py-3 rounded-xl border w-full"
          >
            <option value="">-- Choose Topic --</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold"
          >
            {loading ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      </div>

      {/* Quiz Preview */}
      {currentQuiz && (
        <div className="bg-white p-8 rounded-3xl border shadow">
          <h2 className="text-xl font-bold mb-3">Quiz Ready (30 Questions)</h2>

          <button
            onClick={() => setIsTakingQuiz(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold"
          >
            Start Attempt
          </button>
        </div>
      )}

      {/* Attempts */}
      {attempts.length > 0 && (
        <div className="bg-white p-8 rounded-3xl border shadow">
          <h2 className="text-lg font-bold mb-4">Attempt History</h2>

          {attempts.map((a) => (
            <div
              key={a.id}
              className="p-4 border rounded-xl mb-3 flex justify-between"
            >
              <div>
                Attempt #{a.attempt_number} — Score:{" "}
                <b>{a.score.toFixed(0)}%</b>
              </div>

              {a.score >= 75 && (
                <button
                  onClick={() => handleClaimCert(a.quiz_id)}
                  disabled={certLoading === a.quiz_id}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
                >
                  Claim Certificate
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizPage;
