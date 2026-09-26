import React, { useState } from 'react';
import { ManufacturingObject, ComplexityLevel } from '../types';
import { ComplexityToggle } from './ComplexityToggle';
import { TimelineScrubber } from './TimelineScrubber';
import { QuizModal } from './QuizModal';
import { ArrowLeft, Cpu, Thermometer, Gauge, Clock, ShieldCheck, HelpCircle, Sparkles } from 'lucide-react';

interface ExplorationScreenProps {
  objectData: ManufacturingObject;
  selectedLevel: ComplexityLevel;
  onSelectLevel: (level: ComplexityLevel) => void;
  onBackToScan: () => void;
}

export const ExplorationScreen: React.FC<ExplorationScreenProps> = ({
  objectData,
  selectedLevel,
  onSelectLevel,
  onBackToScan
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);

  const currentStep = objectData.steps[currentStepIndex];
  const totalSteps = objectData.steps.length;

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setShowQuiz(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <div className="exploration-screen animate-fade-in">
      {/* Barre supérieure de navigation */}
      <div className="explor-header">
        <button className="back-btn" onClick={onBackToScan}>
          <ArrowLeft size={18} />
          <span>Retour</span>
        </button>

        <span className="object-badge-title">{objectData.object_name}</span>

        <button className="quiz-shortcut-btn" onClick={() => setShowQuiz(true)}>
          <HelpCircle size={18} className="accent-red" />
        </button>
      </div>

      {/* Sélecteur de niveau compact */}
      <div className="toggle-wrapper-compact">
        <ComplexityToggle
          selectedLevel={selectedLevel}
          onSelectLevel={onSelectLevel}
        />
      </div>

      {/* Zone d'illustration visuelle de l'étape */}
      <div className="step-media-container">
        <img
          key={currentStep.step_number}
          src={currentStep.image_url || objectData.image_url}
          alt={currentStep.title}
          className="step-image animate-fade-in"
        />
        <div className="step-number-tag">
          Étape {currentStep.step_number} / {totalSteps}
        </div>
      </div>

      {/* Carte d'explication dynamique selon le mode */}
      <div className="step-card animate-fade-in" key={`${currentStepIndex}-${selectedLevel}`}>
        <h3 className="step-title">{currentStep.title}</h3>

        <p className="step-explanation">
          {currentStep.explanations[selectedLevel]}
        </p>

        {/* Détails techniques & machines */}
        <div className="specs-container">
          <div className="spec-badge">
            <Cpu size={15} className="accent-red" />
            <span className="spec-label">Machine :</span>
            <span className="spec-value">{currentStep.details.machinery}</span>
          </div>

          {currentStep.details.temperature && (
            <div className="spec-badge">
              <Thermometer size={15} color="#D90429" />
              <span className="spec-label">Température :</span>
              <span className="spec-value">{currentStep.details.temperature}</span>
            </div>
          )}

          {currentStep.details.pressure && (
            <div className="spec-badge">
              <Gauge size={15} color="#2563EB" />
              <span className="spec-label">Pression :</span>
              <span className="spec-value">{currentStep.details.pressure}</span>
            </div>
          )}

          {currentStep.details.duration && (
            <div className="spec-badge">
              <Clock size={15} color="#059669" />
              <span className="spec-label">Durée :</span>
              <span className="spec-value">{currentStep.details.duration}</span>
            </div>
          )}

          {currentStep.details.tolerance && (
            <div className="spec-badge">
              <ShieldCheck size={15} color="#7C3AED" />
              <span className="spec-label">Tolérance :</span>
              <span className="spec-value">{currentStep.details.tolerance}</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Scrubbable interactive */}
      <div className="scrubber-fixed-bottom">
        <TimelineScrubber
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          onSelectStep={(idx) => setCurrentStepIndex(idx)}
          onNext={handleNext}
          onPrev={handlePrev}
          onOpenQuiz={() => setShowQuiz(true)}
        />
      </div>

      {/* Quiz Pop-up Modal */}
      {showQuiz && (
        <QuizModal
          quiz={objectData.quiz}
          objectName={objectData.object_name}
          onClose={() => setShowQuiz(false)}
        />
      )}

      <style>{`
        .exploration-screen {
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 65px);
          background-color: var(--bg-app);
          padding-bottom: 120px;
        }

        .explor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-subtle);
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          font-family: var(--font-heading);
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text-main);
          cursor: pointer;
        }

        .object-badge-title {
          font-family: var(--font-heading);
          font-size: 14px;
          font-weight: 700;
          color: var(--text-main);
          max-width: 180px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .quiz-shortcut-btn {
          background: var(--bg-app);
          border: 1px solid var(--border-light);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .toggle-wrapper-compact {
          padding: 10px 16px;
          background-color: var(--bg-app);
        }

        .step-media-container {
          position: relative;
          width: calc(100% - 32px);
          margin: 0 16px;
          height: 200px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border-light);
          background-color: #EAE8E1;
        }

        .step-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .step-number-tag {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(17, 17, 17, 0.8);
          backdrop-filter: blur(6px);
          color: #FFFFFF;
          font-family: var(--font-heading);
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: var(--radius-full);
        }

        .step-card {
          margin: 14px 16px;
          background-color: var(--bg-card);
          border-radius: var(--radius-lg);
          padding: 20px;
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .step-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1.25;
        }

        .step-explanation {
          font-size: 14px;
          color: #2D2D2D;
          line-height: 1.55;
          font-weight: 400;
        }

        .specs-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
        }

        .spec-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: var(--bg-app);
          border: 1px solid var(--border-subtle);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 12px;
        }

        .spec-label {
          color: var(--text-muted);
          font-weight: 500;
        }

        .spec-value {
          color: var(--text-main);
          font-weight: 700;
        }

        .scrubber-fixed-bottom {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          z-index: 40;
        }
      `}</style>
    </div>
  );
};
