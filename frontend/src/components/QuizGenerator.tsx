import React, { useState, useEffect } from "react";
import { topicService } from "../services/topicService";
import { quizService } from "../services/quizService";
import { certificateService } from "../services/certificateService";
import { Topic, User, Quiz, QuizAttempt } from "../types";
import QuizAttemptSession from "./QuizAttemptSession";
interface QuizGeneratorProps {
  user: User;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ user }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [certLoading, setCertLoading] = useState<string | null>(null);

  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [error, setError] = useState("");
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  const token = localStorage.getItem("token") || "";

  // ==========================
  // Load Topics
  // ==========================
  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const history = await topicService.getHistory(user.id, token);
      setTopics(history);
    } catch (err) {
      console.error("Failed to load topics", err);
    }
  };

  // ==========================
  // Load Attempt History
  // ==========================
  const loadHistory = async (quizId: string) => {
    try {
      const history = await quizService.getAttemptHistory(quizId, token);
      setAttempts(history);
    } catch (err) {
      console.error("Failed to load attempts", err);
    }
  };


  // ==========================
  // Generate Quiz (Backend Gemini)
  // ==========================
  const handleGenerate = async () => {
    if (!selectedTopicId) return setError("Topic required");

    setLoading(true);
    setError("");
    setCurrentQuiz(null);
    setAttempts([]);
    setLastAttempt(null);

    try {
      // ✅ Backend generates quiz directly
      const quiz = await quizService.generate(selectedTopicId, token);

      setCurrentQuiz(quiz);

      // Load history immediately
      await loadHistory(quiz.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onClaimCert = async (quizId: string) => {
    setCertLoading(quizId);
    try {
      const cert = await certificateService.generate(quizId, token);

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

  // ==========================
  // Quiz Attempt Mode
  // ==========================
  if (isTakingQuiz && currentQuiz) {
    return (
      <QuizAttemptSession
        quiz={currentQuiz}
        user={user}
        onComplete={(a) => {
          setIsTakingQuiz(false);
          setLastAttempt(a);
          setAttempts([a, ...attempts]);
        }}
        onCancel={() => setIsTakingQuiz(false)}
      />
    );
  }

  // ==========================
  // UI
  // ==========================
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Topic Selection */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-tasks text-indigo-600"></i> Mastery Assessment
        </h2>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">
              Topic Source
            </label>

            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white"
            >
              <option value="">-- Select Study Topic --</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !selectedTopicId}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading ? (
              <i className="fas fa-circle-notch fa-spin"></i>
            ) : (
              <i className="fas fa-brain"></i>
            )}
            Generate Quiz
          </button>
        </div>

        {error && (
          <p className="mt-4 text-xs text-red-600 font-bold uppercase">
            {error}
          </p>
        )}
      </div>

      {/* Quiz Preview */}
      {currentQuiz && (
        <div className="bg-white p-8 rounded-3xl border shadow-sm">
          <h3 className="text-xl font-bold mb-4">
            Quiz Ready ({currentQuiz.questions.length} Questions)
          </h3>

          <button
            onClick={() => setIsTakingQuiz(true)}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700"
          >
            Start Attempt
          </button>

          <div className="mt-6 space-y-2 max-h-[300px] overflow-y-auto">
            {currentQuiz.questions.slice(0, 5).map((q, i) => (
              <div
                key={i}
                className="p-3 bg-slate-50 rounded-xl border text-sm"
              >
                {i + 1}. {q.text}
              </div>
            ))}
            <p className="text-xs text-slate-400 mt-3">
              ... and 10 more questions
            </p>
          </div>
        </div>
      )}

      {/* Attempt History */}
      {attempts.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <h3 className="font-bold mb-4">Attempts</h3>

          {attempts.map((a) => (
            <div key={a.id} className="p-4 bg-slate-50 rounded-xl border mb-3">
              Attempt #{a.attempt_number} — Score: {a.score.toFixed(0)}%
              {a.score >= 75 && (
                <button
                  onClick={() => onClaimCert(a.quiz_id)}
                  className="block mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                >
                  Claim Certificate
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {lastAttempt && (
        <div className="bg-white p-8 rounded-3xl border shadow-sm">
          <h3 className="text-xl font-bold mb-6">
            Detailed Performance Review
          </h3>
          <button
            onClick={() => setLastAttempt(null)}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Close Review
          </button>

          <div className="mb-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
            <h4 className="text-lg font-bold text-indigo-700">
              Final Score: {lastAttempt.score.toFixed(0)}%
            </h4>
          </div>

          <div className="space-y-6">
            {lastAttempt.question_results.map((q, index) => (
              <div
                key={q.question_id}
                className={`p-5 rounded-2xl border ${
                  q.is_correct
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <p className="font-semibold mb-3">
                  {index + 1}. {q.question}
                </p>

                <div className="space-y-2">
                  {q.options.map((opt: string, idx: number) => {
                    const isSelected = idx === q.selected_answer;
                    const isCorrect = idx === q.correct_answer;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border ${
                          isCorrect
                            ? "bg-emerald-100 border-emerald-500"
                            : isSelected
                              ? "bg-red-100 border-red-400"
                              : "bg-white border-slate-100"
                        }`}
                      >
                        {opt}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  Concept: {q.concept_tag} • Difficulty: {q.difficulty}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;
