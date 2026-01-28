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
    <div className="max-w-2xl mx-auto mt-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Knowledge Check</h2>
        <div className="px-3 py-1 bg-slate-100 rounded-lg text-sm text-slate-500">
          Question {currentIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-8">
          {currentQuestion.question}
        </h3>

        <div className="space-y-4">
          {currentQuestion.options.map((option, idx) => {
            const isCorrect = idx === currentQuestion.correctAnswer;
            const isSelected = idx === selectedOption;

            let bgClass = "bg-slate-50 border-slate-100 hover:border-blue-200";
            if (showResult) {
              if (isCorrect)
                bgClass = "bg-emerald-50 border-emerald-500 text-emerald-700";
              else if (isSelected)
                bgClass = "bg-red-50 border-red-500 text-red-700";
            } else if (isSelected) {
              bgClass = "bg-blue-50 border-blue-500 text-blue-700";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className={`w-full p-4 text-left rounded-2xl border-2 transition-all ${bgClass} flex items-center justify-between group`}
              >
                <span>{option}</span>
                {showResult && isCorrect && (
                  <i className="fas fa-check-circle text-emerald-500"></i>
                )}
                {showResult && isSelected && !isCorrect && (
                  <i className="fas fa-times-circle text-red-500"></i>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            disabled={selectedOption === null}
            className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {currentIndex === questions.length - 1
              ? "Finish Quiz"
              : "Next Question"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizView;
