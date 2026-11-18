import React, { useState } from 'react';
import { CheckCircle2, XCircle, Award, RotateCcw, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';

export const QuizPlayer = ({ quiz, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (option) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsCompleted(false);
  };

  if (isCompleted) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm shadow-indigo-100">
          <Award className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quiz Completed!</h2>
          <p className="text-xs text-slate-500 mt-1">Here is how you performed on this study set:</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <div className="text-4xl font-extrabold text-indigo-600">
            {score} / {questions.length}
          </div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            {percent >= 80 ? '🎉 Excellent Comprehension!' : percent >= 60 ? '👍 Good Effort!' : '📖 Review Notes and Retry'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Back to Quizzes
          </button>
          <button
            onClick={handleRetake}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-100"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Quiz</span>
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <button
          onClick={onBack}
          className="text-indigo-600 hover:underline font-semibold"
        >
          &larr; Back to Quizzes
        </button>
        <span className="font-medium bg-slate-100 px-2.5 py-0.5 rounded-full text-slate-700">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 h-full transition-all duration-300"
          style={{ width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div>
          {currentQuestion.sourceReference && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-2.5 inline-block">
              {currentQuestion.sourceReference}
            </span>
          )}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {currentQuestion.question}
          </h3>
        </div>

        {/* 4 Answer Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx); // A, B, C, D
            const isSelected = selectedOption === option;
            const isCorrect = option === currentQuestion.correctAnswer;

            let buttonStyles = 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20';

            if (isAnswerSubmitted) {
              if (isCorrect) {
                buttonStyles = 'border-emerald-300 bg-emerald-50 text-emerald-900 font-medium';
              } else if (isSelected && !isCorrect) {
                buttonStyles = 'border-rose-300 bg-rose-50 text-rose-900 line-through';
              } else {
                buttonStyles = 'border-slate-200 opacity-50';
              }
            } else if (isSelected) {
              buttonStyles = 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/20';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                disabled={isAnswerSubmitted}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs sm:text-sm ${buttonStyles}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {letter}
                  </span>
                  <span>{option}</span>
                </div>

                {isAnswerSubmitted && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isAnswerSubmitted && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Card upon submission */}
        {isAnswerSubmitted && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 animate-fade-in">
            <span className="font-semibold text-slate-700 block">Explanation:</span>
            <p className="text-slate-600 leading-relaxed">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedOption}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm shadow-indigo-100"
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-indigo-100"
            >
              <span>{currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

