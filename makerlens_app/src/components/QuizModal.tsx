import React, { useState } from 'react';
import { QuizData } from '../types';
import { HelpCircle, CheckCircle2, XCircle, Award, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizModalProps {
  quiz: QuizData;
  objectName: string;
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ quiz, objectName, onClose }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelectOption = (index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
    setIsSubmitted(true);

    if (index === quiz.correct_answer) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const isCorrect = selectedOption === quiz.correct_answer;

  return (
    <div className="quiz-overlay" onClick={onClose}>
      <div className="quiz-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="quiz-badge">
          <HelpCircle size={18} className="accent-red" />
          <span>LE SAVIEZ-VOUS ?</span>
        </div>

        <h3 className="quiz-title">{quiz.question}</h3>
        <p className="quiz-subtitle">Testez votre attention sur la fabrication du <strong className="text-black">{objectName}</strong></p>

        <div className="options-list">
          {quiz.options.map((optionText, idx) => {
            let optionState = 'default';
            if (isSubmitted) {
              if (idx === quiz.correct_answer) optionState = 'correct';
              else if (idx === selectedOption) optionState = 'wrong';
            }

            return (
              <button
                key={idx}
                className={`option-btn ${optionState}`}
                onClick={() => handleSelectOption(idx)}
                disabled={isSubmitted}
              >
                <span className="opt-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="opt-text">{optionText}</span>
                {optionState === 'correct' && <CheckCircle2 size={18} className="icon-correct" />}
                {optionState === 'wrong' && <XCircle size={18} className="icon-wrong" />}
              </button>
            );
          })}
        </div>

        {isSubmitted && (
          <div className={`explanation-box ${isCorrect ? 'box-correct' : 'box-wrong'}`}>
            <div className="exp-header">
              {isCorrect ? (
                <>
                  <Award size={20} color="#16A34A" />
                  <span className="txt-correct">Excellente réponse !</span>
                </>
              ) : (
                <>
                  <XCircle size={20} color="#D90429" />
                  <span className="txt-wrong">Oups, mauvaise réponse !</span>
                </>
              )}
            </div>
            <p className="exp-body">{quiz.explanation}</p>
          </div>
        )}

        <div className="quiz-footer">
          {isSubmitted ? (
            <button className="btn-black btn-full" onClick={onClose}>
              Continuer l'exploration
            </button>
          ) : (
            <button className="btn-outline btn-full" onClick={onClose}>
              Passer le quiz
            </button>
          )}
        </div>
      </div>

      <style>{`
        .quiz-overlay {
          position: fixed;
          inset: 0;
          background: rgba(17, 17, 17, 0.5);
          backdrop-filter: blur(6px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .quiz-card {
          background-color: var(--bg-card);
          border-radius: var(--radius-lg);
          padding: 24px;
          max-width: 440px;
          width: 100%;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-light);
        }

        .quiz-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          background-color: var(--accent-scarlet-light);
          font-family: var(--font-heading);
          font-size: 11px;
          font-weight: 800;
          color: var(--accent-scarlet);
          margin-bottom: 12px;
        }

        .quiz-title {
          font-size: 17px;
          font-weight: 700;
          line-height: 1.35;
          margin-bottom: 6px;
        }

        .quiz-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 18px;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .option-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          border: 1.5px solid var(--border-light);
          background-color: var(--bg-app);
          text-align: left;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text-main);
          transition: all 0.2s ease;
        }

        .option-btn:hover:not(:disabled) {
          border-color: var(--btn-black);
          background-color: #FFFFFF;
        }

        .option-btn.correct {
          border-color: #16A34A;
          background-color: #F0FDF4;
          color: #15803D;
        }

        .option-btn.wrong {
          border-color: var(--accent-scarlet);
          background-color: var(--accent-scarlet-light);
          color: var(--accent-scarlet);
        }

        .opt-letter {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #E5E3DC;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 12px;
          flex-shrink: 0;
        }

        .opt-text {
          flex: 1;
        }

        .icon-correct {
          color: #16A34A;
        }

        .icon-wrong {
          color: var(--accent-scarlet);
        }

        .explanation-box {
          padding: 14px;
          border-radius: var(--radius-md);
          margin-bottom: 20px;
          animation: fadeIn 0.3s ease;
        }

        .box-correct {
          background-color: #F0FDF4;
          border: 1px solid #BBF7D0;
        }

        .box-wrong {
          background-color: #FEF2F2;
          border: 1px solid #FECACA;
        }

        .exp-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 13.5px;
          margin-bottom: 4px;
        }

        .txt-correct { color: #15803D; }
        .txt-wrong { color: var(--accent-scarlet); }

        .exp-body {
          font-size: 12.5px;
          color: var(--text-main);
          line-height: 1.4;
        }

        .quiz-footer {
          display: flex;
        }

        .btn-full {
          width: 100%;
        }
      `}</style>
    </div>
  );
};
