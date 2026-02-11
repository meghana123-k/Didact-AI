import React, { useState } from "react";
import { QuizQuestion } from "../types";

interface QuizViewProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
  onCancel: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({
  questions,
  onComplete,
  onCancel,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      onComplete(
        score + (selectedOption === currentQuestion.correctAnswer ? 1 : 0),
      );
    }
  };

  const handleOptionSelect = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
    setShowResult(true);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Knowledge Check
          </h2>

          <div className="px-4 py-2 bg-[#1e293b] border border-slate-700 rounded-xl text-sm text-slate-400">
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-10 shadow-sm">
          <h3 className="text-xl font-semibold mb-10 leading-relaxed">
            {currentQuestion.question}
          </h3>

          <div className="space-y-4">
            {currentQuestion.options.map((option, idx) => {
              const isCorrect = idx === currentQuestion.correctAnswer;
              const isSelected = idx === selectedOption;

              let style =
                "bg-[#0f172a] border-slate-700 hover:border-indigo-500 text-slate-300";

              if (showResult) {
                if (isCorrect) {
                  style =
                    "bg-emerald-900/30 border-emerald-500 text-emerald-300";
                } else if (isSelected) {
                  style = "bg-red-900/30 border-red-500 text-red-300";
                }
              } else if (isSelected) {
                style = "bg-indigo-900/30 border-indigo-500 text-indigo-300";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  className={`w-full p-5 text-left rounded-2xl border-2 transition-all ${style}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>

                    {showResult && isCorrect && (
                      <span className="text-emerald-400 text-sm">✓</span>
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <span className="text-red-400 text-sm">✕</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Buttons */}
          <div className="mt-10 flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleNext}
              disabled={selectedOption === null}
              className="flex-[2] py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold disabled:opacity-40"
            >
              {currentIndex === questions.length - 1
                ? "Finish Quiz"
                : "Next Question"}
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="text-center text-sm text-slate-500">
          Score So Far: {score} / {questions.length}
        </div>
      </div>
    </div>
  );
};

export default QuizView;
