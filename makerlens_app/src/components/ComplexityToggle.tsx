import React from 'react';
import { ComplexityLevel } from '../types';
import { Baby, Users, Cpu } from 'lucide-react';

interface ComplexityToggleProps {
  selectedLevel: ComplexityLevel;
  onSelectLevel: (level: ComplexityLevel) => void;
}

export const ComplexityToggle: React.FC<ComplexityToggleProps> = ({
  selectedLevel,
  onSelectLevel
}) => {
  const levels: { id: ComplexityLevel; label: string; icon: React.ReactNode; tooltip: string }[] = [
    {
      id: 'kids',
      label: 'Enfant',
      icon: <Baby size={16} />,
      tooltip: 'Métaphores & ton ludique'
    },
    {
      id: 'general',
      label: 'Grand Public',
      icon: <Users size={16} />,
      tooltip: 'Machines & étapes clés'
    },
    {
      id: 'expert',
      label: 'Expert',
      icon: <Cpu size={16} />,
      tooltip: 'Températures, bars & normes'
    }
  ];

  return (
    <div className="toggle-wrapper">
      <div className="toggle-container">
        {levels.map((level) => {
          const isActive = selectedLevel === level.id;
          return (
            <button
              key={level.id}
              onClick={() => onSelectLevel(level.id)}
              className={`toggle-btn ${isActive ? 'active' : ''}`}
            >
              {level.icon}
              <span>{level.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mode-hint">
        <span className="dot-scarlet"></span>
        {selectedLevel === 'kids' && "Mode Vulgarisé : explications simples avec métaphores amusantes"}
        {selectedLevel === 'general' && "Mode Grand Public : processus clair avec noms des machines"}
        {selectedLevel === 'expert' && "Mode Ingénieur : températures (°C), pressions (bars) & tolérances"}
      </div>

      <style>{`
        .toggle-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .toggle-container {
          display: flex;
          background-color: #ECEAE4;
          padding: 4px;
          border-radius: var(--radius-full);
          width: 100%;
          border: 1px solid var(--border-light);
        }

        .toggle-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 12px;
          border-radius: var(--radius-full);
          border: none;
          background: transparent;
          font-family: var(--font-heading);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
        }

        .toggle-btn:hover {
          color: var(--text-main);
        }

        .toggle-btn.active {
          background-color: var(--btn-black);
          color: var(--btn-black-text);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
        }

        .mode-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .dot-scarlet {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--accent-scarlet);
          display: inline-block;
        }
      `}</style>
    </div>
  );
};
