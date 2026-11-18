import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Shuffle, CheckCircle, HelpCircle } from 'lucide-react';

export const FlashcardPlayer = ({ flashcardSet, onBack }) => {
  const [cards, setCards] = useState(flashcardSet.cards || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = cards[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
  };

  if (!currentCard) return null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <button
          onClick={onBack}
          className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
        >
          &larr; Back to Decks
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleShuffle}
            className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors"
            title="Shuffle Cards"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
          <span className="font-medium bg-slate-100 px-2.5 py-0.5 rounded-full text-slate-700">
            Card {currentIndex + 1} of {cards.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[300px] bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between select-none relative group"
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
            {isFlipped ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Answer</span>
              </>
            ) : (
              <>
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span className="text-indigo-700">Question</span>
              </>
            )}
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-slate-600">
            <RotateCw className="w-3 h-3" />
            <span>Click to flip</span>
          </span>
        </div>

        <div className="my-8 text-center px-4">
          <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed">
            {isFlipped ? currentCard.answer : currentCard.question}
          </p>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          {isFlipped ? 'Click card to see question' : 'Click card to reveal answer'}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-40 disabled:hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <span className="text-xs text-slate-400 font-medium">
          {progressPercent}% Complete
        </span>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors shadow-sm shadow-indigo-100"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

