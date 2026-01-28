import React, { useState, useEffect, useCallback } from "react";
import { Quiz, QuizQuestionDeep, QuizAttempt, User } from "../types";
import { quizService } from "../services/quizService";

interface QuizAttemptSessionProps {
  quiz: Quiz;
  user: User;
  onComplete: (attempt: QuizAttempt) => void;
  onCancel: () => void;
}

const QuizAttemptSession: React.FC<QuizAttemptSessionProps> = ({
  quiz,
  user,
  onComplete,
  onCancel,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [startTime] = useState(Date.now());
  const [integrityFlags, setIntegrityFlags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes

  const token = localStorage.getItem("token") || "";

  const logIntegrity = useCallback(
    async (type: string) => {
      try {
        await fetch("http://127.0.0.1:5001/api/integrity/log", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event: type,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.warn("Integrity log failed", e);
      }
    },
    [token],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const handleVisibility = () => {
      if (document.hidden) {
        setIntegrityFlags((prev) => [...prev, "tab_switch"]);
        logIntegrity("tab_switch");
      }
    };

    const handleBlur = () => {
      setIntegrityFlags((prev) => [...prev, "window_blur"]);
      logIntegrity("window_blur");
    };

    const handleFocus = () => {
      logIntegrity("window_focus");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [logIntegrity]);

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = (optIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optIdx;
    setAnswers(newAnswers);
  };

  const handleNext = () =>
    currentIndex < questions.length - 1 && setCurrentIndex(currentIndex + 1);
  const handlePrev = () =>
    currentIndex > 0 && setCurrentIndex(currentIndex - 1);

  const handleSubmit = async () => {
    if (
      answers.length < questions.length ||
      answers.includes(undefined as any)
    ) {
      if (!confirm("You haven't answered all questions. Submit anyway?"))
        return;
    }

    setLoading(true);
    setError("");
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    try {
      const attempt = await quizService.submitAttempt(
        quiz.id,
        answers,
        timeTaken,
        integrityFlags,
        token,
      );
      onComplete(attempt);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const violationCount = integrityFlags.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between sticky top-20 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <i className="fas fa-times text-slate-400"></i>
          </button>
          <div>
            <h3 className="font-bold text-slate-800">Mastery Exam</h3>
            <p className="text-xs text-slate-400">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {violationCount > 0 && (
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold ${violationCount > 3 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}
            >
              <i className="fas fa-exclamation-triangle"></i>
              {violationCount}{" "}
              {violationCount === 1 ? "Violation" : "Violations"}
            </div>
          )}
          <div
            className={`flex items-center gap-3 px-4 py-2 rounded-xl font-mono font-bold ${timeLeft < 300 ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-50 text-slate-700"}`}
          >
            <i className="fas fa-clock"></i>
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 min-h-[400px]">
        <div className="flex items-center gap-2 mb-6">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              currentQuestion?.difficulty === "easy"
                ? "bg-emerald-100 text-emerald-700"
                : currentQuestion?.difficulty === "medium"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {currentQuestion?.difficulty}
          </span>
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase">
            {currentQuestion?.concept_tag}
          </span>
        </div>

        <h4 className="text-2xl font-bold text-slate-800 mb-10 leading-snug">
          {currentQuestion?.text}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion?.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionSelect(idx)}
              className={`p-5 text-left rounded-2xl border-2 transition-all ${
                answers[currentIndex] === idx
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-100 hover:border-slate-300 bg-slate-50 text-slate-600"
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    answers[currentIndex] === idx
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="font-medium">{opt}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30"
          >
            Next
          </button>
        </div>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            {loading ? (
              <i className="fas fa-circle-notch fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
            Submit Final Exam
          </button>
        ) : (
          <div className="text-slate-400 text-sm font-medium">
            Progress:{" "}
            {Math.round(
              (answers.filter((a) => a !== undefined).length /
                (questions.length || 1)) *
                100,
            )}
            %
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizAttemptSession;
