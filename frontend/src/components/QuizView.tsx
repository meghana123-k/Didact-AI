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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Knowledge Check</h2>

          <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold">
            Question {currentIndex + 1} / {questions.length}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-md">
          <h3 className="text-xl font-semibold mb-10 text-gray-800">
            {currentQuestion.question}
          </h3>

          <div className="space-y-4">
            {currentQuestion.options.map((option, idx) => {
              const isCorrect = idx === currentQuestion.correctAnswer;
              const isSelected = idx === selectedOption;

              let style =
                "border-gray-200 hover:border-indigo-500 bg-white text-gray-700";

              if (showResult) {
                if (isCorrect)
                  style = "border-emerald-400 bg-emerald-50 text-emerald-700";
                else if (isSelected)
                  style = "border-red-400 bg-red-50 text-red-700";
              } else if (isSelected)
                style = "border-indigo-500 bg-indigo-50 text-indigo-700";

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  className={`w-full p-5 text-left rounded-xl border-2 transition-all ${style}`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{option}</span>

                    {showResult && isCorrect && (
                      <span className="text-emerald-500">✓</span>
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <span className="text-red-500">✕</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={handleNext}
              disabled={selectedOption === null}
              className="flex-[2] py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40"
            >
              {currentIndex === questions.length - 1
                ? "Finish Quiz"
                : "Next Question"}
            </button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          Score So Far: {score} / {questions.length}
        </div>
      </div>
    </div>
  );
};

export default QuizView;
