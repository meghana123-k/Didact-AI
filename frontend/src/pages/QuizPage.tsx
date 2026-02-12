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

  // ==============================
  // Load Topics
  // ==============================
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

  // ==============================
  // Load Attempt History
  // ==============================
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

  // ==============================
  // Generate Quiz
  // ==============================
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
    <div className="flex min-h-screen bg-[#0f172a] text-slate-100">
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-80 border-r border-slate-800 bg-[#111827] p-6 overflow-y-auto">
        <h3 className="text-sm uppercase tracking-wide text-slate-400 mb-4">
          Attempt History
        </h3>

        {attempts.length === 0 && (
          <p className="text-slate-500 text-sm">No attempts yet.</p>
        )}

        {attempts.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setIsTakingQuiz(false);
              setSelectedAttempt(a);
            }}
            className={`w-full text-left p-4 rounded-xl mb-2 transition ${
              selectedAttempt?.id === a.id
                ? "bg-slate-700"
                : "hover:bg-slate-800"
            }`}
          >
            <div className="flex justify-between">
              <span>Attempt #{a.attempt_number}</span>
              <span className="text-indigo-400">{a.score.toFixed(0)}%</span>
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

              // 🔥 AUTO REDIRECT IF PASSED
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
              className="mb-6 px-4 py-2 bg-slate-700 rounded-xl text-sm"
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
                    ? "bg-emerald-900/20 border-emerald-700"
                    : "bg-red-900/20 border-red-700"
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
                        ? "bg-emerald-700/30 border-emerald-500"
                        : idx === q.selected_answer
                          ? "bg-red-700/30 border-red-500"
                          : "bg-[#1e293b] border-slate-700"
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
            <h1 className="text-3xl font-semibold mb-6">
              Generate Mastery Assessment
            </h1>

            <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700">
              <select
                value={selectedTopicId}
                onChange={handleTopicChange}
                className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-slate-700 mb-4"
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
                className="px-6 py-3 bg-indigo-600 rounded-xl font-semibold"
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
                    className="px-6 py-3 bg-emerald-600 rounded-xl font-semibold"
                  >
                    Start Attempt
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizPage;
