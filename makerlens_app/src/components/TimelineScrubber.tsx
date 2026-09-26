import React from 'react';
import { ChevronLeft, ChevronRight, Play, Check } from 'lucide-react';

interface TimelineScrubberProps {
  currentStepIndex: number;
  totalSteps: number;
  onSelectStep: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onOpenQuiz?: () => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentStepIndex,
  totalSteps,
  onSelectStep,
  onNext,
  onPrev,
  onOpenQuiz
}) => {
  const progressPercent = ((currentStepIndex) / (totalSteps - 1)) * 100;
  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <div className="scrubber-container">
      {/* Barre de navigation Timeline Scrubbable */}
      <div className="timeline-track-wrapper">
        <div className="timeline-line-bg">
          <div
            className="timeline-line-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="nodes-container">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const isActive = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;

            return (
              <button
                key={idx}
                className={`node-btn ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => onSelectStep(idx)}
                title={`Étape ${idx + 1}`}
              >
                {isCompleted ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Précédent / Suivant / Quiz */}
      <div className="scrubber-controls">
        <button
          className="btn-outline nav-btn"
          onClick={onPrev}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft size={18} /> Précédent
        </button>

        <span className="step-counter">
          Étape <strong className="accent-red">{currentStepIndex + 1}</strong> sur {totalSteps}
        </span>

        {isLastStep ? (
          <button className="btn-scarlet nav-btn" onClick={onOpenQuiz}>
            <Play size={16} fill="#FFFFFF" /> Quiz Final !
          </button>
        ) : (
          <button className="btn-black nav-btn" onClick={onNext}>
            Suivant <ChevronRight size={18} />
          </button>
        )}
      </div>

      <style>{`
        .scrubber-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          background: var(--bg-card);
          border-top: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.04);
        }

        .timeline-track-wrapper {
          position: relative;
          padding: 10px 14px;
        }

        .timeline-line-bg {
          position: absolute;
          top: 50%;
          left: 30px;
          right: 30px;
          height: 4px;
          background-color: var(--border-light);
          transform: translateY(-50%);
          z-index: 1;
          border-radius: 4px;
        }

        .timeline-line-fill {
          height: 100%;
          background-color: var(--accent-scarlet);
          border-radius: 4px;
          transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nodes-container {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .node-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid var(--border-light);
          background-color: var(--bg-card);
          color: var(--text-muted);
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }

        .node-btn:hover {
          border-color: var(--btn-black);
          color: var(--text-main);
          transform: scale(1.1);
        }

        .node-btn.completed {
          background-color: var(--btn-black);
          border-color: var(--btn-black);
          color: #FFFFFF;
        }

        .node-btn.active {
          background-color: var(--accent-scarlet);
          border-color: var(--accent-scarlet);
          color: #FFFFFF;
          transform: scale(1.25);
          box-shadow: var(--shadow-scarlet);
        }

        .scrubber-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .nav-btn {
          padding: 10px 16px;
          font-size: 13.5px;
        }

        .nav-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          transform: none !important;
        }

        .step-counter {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-main);
        }
      `}</style>
    </div>
  );
};
