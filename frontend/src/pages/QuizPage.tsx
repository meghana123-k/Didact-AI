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
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  const token = localStorage.getItem("token") || "";

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

  const handleTopicChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const topicId = e.target.value;
    setSelectedTopicId(topicId);
    setCurrentQuiz(null);
    setLastAttempt(null);

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
      return setError("Please select a topic first.");
    }

    setLoading(true);
    setError("");

    try {
      const newQuiz = await quizService.generate(selectedTopicId, token);
      setCurrentQuiz(newQuiz);
    } catch (err: any) {
      setError(err.message || "Quiz generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCert = async (quizId: string) => {
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

  if (isTakingQuiz && currentQuiz) {
    return (
      <QuizAttemptSession
        quiz={currentQuiz}
        user={user}
        onComplete={async (attempt) => {
          setIsTakingQuiz(false);
          setLastAttempt(attempt);

          const history = await quizService.getTopicAttemptHistory(
            selectedTopicId,
            token,
          );

          setAttempts(history);
        }}
        onCancel={() => setIsTakingQuiz(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 px-8 py-12">
      {/* Header Card */}
      <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700">
        <h1 className="text-3xl font-semibold">Mastery Assessments</h1>

        {error && (
          <div className="mt-4 p-3 bg-red-900/30 text-red-400 rounded-xl text-sm border border-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-4 mt-6">
          <select
            value={selectedTopicId}
            onChange={handleTopicChange}
            className="px-4 py-3 rounded-xl bg-[#0f172a] border border-slate-700 w-full"
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
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      </div>

      {/* Start Quiz */}
      {currentQuiz && (
        <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700 mt-8">
          <button
            onClick={() => setIsTakingQuiz(true)}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold"
          >
            Start Attempt
          </button>
        </div>
      )}

      {/* Attempt History */}
      {attempts.length > 0 && (
        <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700 mt-8">
          <h2 className="text-lg font-semibold mb-6">Attempt History</h2>

          {attempts.map((a) => (
            <div
              key={a.id}
              className="p-4 rounded-xl border border-slate-700 mb-4 flex justify-between items-center bg-[#0f172a]"
            >
              <div
                className="cursor-pointer"
                onClick={() =>
                  setLastAttempt((prev) => (prev?.id === a.id ? null : a))
                }
              >
                Attempt #{a.attempt_number} —{" "}
                <span className="text-indigo-400 font-semibold">
                  {a.score.toFixed(0)}%
                </span>
              </div>

              {a.score >= 20 && (
                <button
                  onClick={() => handleClaimCert(a.quiz_id)}
                  disabled={certLoading === a.quiz_id}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm"
                >
                  Claim Certificate
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detailed Review */}
      {lastAttempt && (
        <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700 mt-8">
          <h2 className="text-lg font-semibold mb-6">
            Detailed Review – Attempt #{lastAttempt.attempt_number}
          </h2>

          {lastAttempt.question_results.map((q, index) => (
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
                        : "bg-[#0f172a] border-slate-700"
                  }`}
                >
                  {opt}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizPage;
