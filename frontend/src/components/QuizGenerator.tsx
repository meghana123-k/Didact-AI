import React, { useState, useEffect } from "react";
import { topicService } from "../services/topicService";
import { quizService } from "../services/quizService";
import { Topic, User, Quiz, QuizAttempt } from "../types";
import QuizAttemptSession from "./QuizAttemptSession";

interface QuizGeneratorProps {
  user: User;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ user }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(
    null,
  );
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token") || "";

  /* -------------------- LOAD TOPICS -------------------- */
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const history = await topicService.getHistory(user.id, token);
        setTopics(history);
      } catch (err) {
        console.error("Failed to load topics");
      }
    };

    loadTopics();
  }, [user.id, token]);

  /* -------------------- LOAD ATTEMPTS -------------------- */
  const loadHistory = async (quizId: string) => {
    try {
      const history = await quizService.getAttemptHistory(quizId, token);
      setAttempts(history);
    } catch (err) {
      console.error("Failed to load attempts");
    }
  };

  /* -------------------- GENERATE QUIZ -------------------- */
  const handleGenerate = async () => {
    if (!selectedTopicId) {
      setError("Please select a topic.");
      return;
    }

    setLoading(true);
    setError("");
    setSelectedAttempt(null);
    setIsTakingQuiz(false);

    try {
      const quiz = await quizService.generate(selectedTopicId, token);
      setCurrentQuiz(quiz);
      await loadHistory(quiz.id);
    } catch (err: any) {
      setError(err.message || "Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- VIEW ATTEMPT -------------------- */
  const handleSelectAttempt = (attempt: QuizAttempt) => {
    setIsTakingQuiz(false);
    setSelectedAttempt(attempt);
  };

  /* -------------------- START ATTEMPT -------------------- */
  const handleStartAttempt = () => {
    setSelectedAttempt(null);
    setIsTakingQuiz(true);
  };

  /* -------------------- BACK TO GENERATOR -------------------- */
  const resetToGenerator = () => {
    setSelectedAttempt(null);
    setIsTakingQuiz(false);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 text-gray-800">
      {/* -------------------- LEFT SIDEBAR -------------------- */}
      <aside className="w-80 border-r border-gray-200 bg-white p-4 overflow-y-auto">
        <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-4">
          Assessment History
        </h3>

        {attempts.length === 0 && (
          <p className="text-gray-500 text-sm">No attempts yet.</p>
        )}

        {attempts.map((a) => (
          <button
            key={a.id}
            onClick={() => handleSelectAttempt(a)}
            className={`w-full text-left p-4 rounded-xl mb-2 border transition ${
              selectedAttempt?.id === a.id
                ? "border-indigo-400 bg-indigo-50"
                : "border-gray-200 hover:bg-gray-100"
            }`}
          >
            <div className="flex justify-between">
              <span className="font-medium text-sm">
                Attempt #{a.attempt_number}
              </span>
              <span className="text-xs font-semibold text-indigo-600">
                {a.score.toFixed(0)}%
              </span>
            </div>
          </button>
        ))}
      </aside>

      {/* -------------------- RIGHT PANEL -------------------- */}
      <main className="flex-1 p-10 overflow-y-auto">
        {/* 1️⃣ Taking Quiz */}
        {isTakingQuiz && currentQuiz && (
          <QuizAttemptSession
            quiz={currentQuiz}
            user={user}
            onComplete={async (attempt) => {
              setIsTakingQuiz(false);
              setSelectedAttempt(attempt);
              await loadHistory(attempt.quiz_id);
            }}
            onCancel={resetToGenerator}
          />
        )}

        {/* 2️⃣ Reviewing Attempt */}
        {!isTakingQuiz && selectedAttempt && (
          <div className="max-w-4xl mx-auto">
            <button
              onClick={resetToGenerator}
              className="text-sm text-indigo-600 mb-6 hover:underline"
            >
              ← Back
            </button>

            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              Detailed Review
            </h2>

            <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-200 mb-8">
              Final Score:
              <span className="text-indigo-700 font-bold ml-2">
                {selectedAttempt.score.toFixed(0)}%
              </span>
            </div>

            <div className="space-y-6">
              {selectedAttempt.question_results.map((q, i) => (
                <div
                  key={i}
                  className={`p-6 rounded-2xl border ${
                    q.is_correct
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <p className="font-semibold mb-3 text-gray-800">
                    {i + 1}. {q.question}
                  </p>

                  {q.options.map((opt, idx) => (
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

                  <p className="text-xs text-gray-500 mt-2">
                    Concept: {q.concept_tag} • Difficulty: {q.difficulty}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3️⃣ Generator View */}
        {!isTakingQuiz && !selectedAttempt && (
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-2xl font-semibold text-gray-800">
              Generate Mastery Assessment
            </h2>

            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-indigo-500 outline-none"
              >
                <option value="">Select Study Topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>

              <button
                onClick={handleGenerate}
                disabled={loading || !selectedTopicId}
                className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition"
              >
                {loading ? "Generating..." : "Generate Quiz"}
              </button>

              {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </div>

            {currentQuiz && (
              <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="font-semibold mb-4 text-gray-800">
                  Quiz Ready ({currentQuiz?.questions?.length ?? 0} Questions)
                </h3>

                <button
                  onClick={handleStartAttempt}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-400 transition"
                >
                  Start Attempt
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizGenerator;
