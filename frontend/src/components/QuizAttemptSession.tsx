import React, { useState, useEffect, useCallback } from "react";
import { Quiz, QuizAttempt, User } from "../types";
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
  const questions = quiz.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>(
    Array(questions.length).fill(undefined),
  );
  const [startTime] = useState(Date.now());
  const [integrityFlags, setIntegrityFlags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(1800);
  const [submitted, setSubmitted] = useState(false);

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

  // Timer + Integrity listeners
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

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [logIntegrity]);

  // Auto-submit once when time reaches 0
  useEffect(() => {
    if (timeLeft === 0 && !submitted) {
      handleSubmit(true);
    }
  }, [timeLeft]);

  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = (optIdx: number) => {
    const updated = [...answers];
    updated[currentIndex] = optIdx;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async (auto = false) => {
    if (submitted) return;

    if (!auto && answers.includes(undefined)) {
      if (!window.confirm("You haven't answered all questions. Submit anyway?"))
        return;
    }

    setSubmitted(true);
    setLoading(true);
    setError("");

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    try {
      const attempt = await quizService.submitAttempt(
        quiz.id,
        answers as number[],
        timeTaken,
        integrityFlags,
        token,
      );

      onComplete(attempt);
    } catch (err: any) {
      setSubmitted(false);
      setError(err.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const violationCount = integrityFlags.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* HEADER */}
      <div className="bg-[#1e293b] p-6 rounded-3xl border border-slate-700 shadow-lg">
        <div className="flex items-center justify-between gap-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-[#0f172a] text-slate-200 border border-slate-600 text-sm font-medium"
          >
            ← Back to Quiz Page
          </button>

          <div>
            <h3 className="font-bold text-slate-100">Mastery Exam</h3>
            <p className="text-xs text-slate-400">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4">
          {violationCount > 0 && (
            <div className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-600">
              {violationCount} Violation(s)
            </div>
          )}

          <div className="px-4 py-2 rounded-xl font-mono font-bold bg-[#0f172a] text-slate-200">
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </div>
        </div>
      </div>

      {/* QUESTION */}
      {currentQuestion && (
        <div className="bg-[#1e293b] p-10 rounded-3xl border border-slate-700">
          <h4 className="text-2xl font-bold mb-8">{currentQuestion.text}</h4>

          <div className="grid gap-4">
            {currentQuestion.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className={`p-5 text-left rounded-2xl border-2 transition ${
                  answers[currentIndex] === idx
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-700 bg-[#0f172a] text-slate-300"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="flex justify-between">
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-6 py-3 bg-slate-700 rounded-xl disabled:opacity-30"
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="px-6 py-3 bg-slate-700 rounded-xl disabled:opacity-30"
          >
            Next
          </button>
        </div>

        {currentIndex === questions.length - 1 && (
          <button
            onClick={() => handleSubmit()}
            disabled={loading}
            className="px-8 py-3 bg-indigo-600 rounded-xl font-bold"
          >
            {loading ? "Submitting..." : "Submit Final Exam"}
          </button>
        )}
      </div>

      {error && <div className="text-red-400 text-sm mt-4">{error}</div>}
    </div>
  );
};

export default QuizAttemptSession;
