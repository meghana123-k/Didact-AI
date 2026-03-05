import React, { useState, useEffect } from "react";
import { User, Topic, Quiz, QuizAttempt } from "../types";
import { topicService } from "../services/topicService";
import { quizService } from "../services/quizService";
import QuizAttemptSession from "../components/QuizAttemptSession";
import { View } from "../App";

interface QuizPageProps {
  user: User;
  onNavigate: (view: View) => void;
}

const QuizPage: React.FC<QuizPageProps> = ({ user, onNavigate }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(
    null,
  );
  const [error, setError] = useState("");

  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const history = await topicService.getHistory(user.id, token);
        setTopics(history);
      } catch {
        setError("Failed to load topics.");
      }
    };

    loadTopics();
  }, [user.id, token]);

  const handleTopicChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const topicId = e.target.value;
    setSelectedTopicId(topicId);
    setCurrentQuiz(null);
    setSelectedAttempt(null);
    setIsTakingQuiz(false);

    if (!topicId) {
      setAttempts([]);
      return;
    }

    try {
      const history = await quizService.getTopicAttemptHistory(topicId, token);
      setAttempts(history);
    } catch {
      setAttempts([]);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTopicId) {
      setError("Select a topic first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const quiz = await quizService.generate(selectedTopicId, token);
      setCurrentQuiz(quiz);
    } catch (err: any) {
      setError(err.message || "Quiz generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetToGenerator = () => {
    setIsTakingQuiz(false);
    setSelectedAttempt(null);
    setCurrentQuiz(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-80 border-r border-gray-200 bg-white p-6 overflow-y-auto">
        <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-4">
          Attempt History
        </h3>

        {attempts.length === 0 && (
          <p className="text-gray-500 text-sm">No attempts yet.</p>
        )}

        {attempts.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setIsTakingQuiz(false);
              setSelectedAttempt(a);
            }}
            className={`w-full text-left p-4 rounded-xl mb-3 border transition ${
              selectedAttempt?.id === a.id
                ? "border-indigo-400 bg-indigo-50"
                : "border-gray-200 hover:bg-gray-100"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">Attempt #{a.attempt_number}</span>

              <span
                className={`text-sm font-semibold ${
                  a.score >= 75 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {a.score.toFixed(0)}%
              </span>
            </div>
          </button>
        ))}
      </aside>

      {/* ================= MAIN PANEL ================= */}
      <main className="flex-1 p-10 overflow-y-auto">
        {/* ===== TAKING QUIZ ===== */}
        {isTakingQuiz && currentQuiz && (
          <QuizAttemptSession
            quiz={currentQuiz}
            user={user}
            onComplete={async (attempt) => {
              setIsTakingQuiz(false);
              setSelectedAttempt(attempt);

              const history = await quizService.getTopicAttemptHistory(
                selectedTopicId,
                token,
              );
              setAttempts(history);

              if (attempt.passed) {
                onNavigate(View.CERTIFICATES);
              }
            }}
            onCancel={resetToGenerator}
          />
        )}

        {/* ===== REVIEW ATTEMPT ===== */}
        {!isTakingQuiz && selectedAttempt && (
          <div className="max-w-4xl mx-auto">
            <button
              onClick={resetToGenerator}
              className="mb-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
            >
              ← Back to Quiz Page
            </button>

            <h2 className="text-2xl font-semibold mb-6">
              Attempt #{selectedAttempt.attempt_number} Review
            </h2>

            {selectedAttempt.question_results.map((q, index) => (
              <div
                key={q.question_id}
                className={`p-6 rounded-2xl border mb-6 ${
                  q.is_correct
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <p className="font-semibold mb-4">
                  {index + 1}. {q.question}
                </p>

                {q.options.map((opt: string, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border mb-2 ${
                      idx === q.correct_answer
                        ? "bg-emerald-100 border-emerald-300"
                        : idx === q.selected_answer
                          ? "bg-red-100 border-red-300"
                          : "bg-white border-gray-200"
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ===== GENERATOR VIEW ===== */}
        {!isTakingQuiz && !selectedAttempt && (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">
              Generate Mastery Assessment
            </h1>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <select
                value={selectedTopicId}
                onChange={handleTopicChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 mb-4 focus:border-indigo-500 outline-none"
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
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition"
              >
                {loading ? "Generating..." : "Generate Quiz"}
              </button>

              {currentQuiz && (
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setSelectedAttempt(null);
                      setIsTakingQuiz(true);
                    }}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-400 transition"
                  >
                    Start Attempt
                  </button>
                </div>
              )}

              {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizPage;
