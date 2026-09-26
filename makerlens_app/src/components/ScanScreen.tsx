import React, { useRef, useState } from 'react';
import { ManufacturingObject, ComplexityLevel } from '../types';
import { MOCK_OBJECTS } from '../data/mockObjects';
import { ComplexityToggle } from './ComplexityToggle';
import { Camera, Upload, ArrowRight, Leaf, Recycle, Clock, Layers, Sparkles, Image as ImageIcon, AlertTriangle, X } from 'lucide-react';

interface ScanScreenProps {
  selectedObject: ManufacturingObject;
  selectedLevel: ComplexityLevel;
  onSelectLevel: (level: ComplexityLevel) => void;
  onSelectObject: (obj: ManufacturingObject) => void;
  onCustomImageUpload: (base64: string) => void;
  onStartExploration: () => void;
  isAnalyzing: boolean;
  errorMessage?: string | null;
  onDismissError?: () => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  selectedObject,
  selectedLevel,
  onSelectLevel,
  onSelectObject,
  onCustomImageUpload,
  onStartExploration,
  isAnalyzing,
  errorMessage,
  onDismissError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onCustomImageUpload(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="scan-screen animate-fade-in">
      {/* Alert banner if error occurred during VLM analysis */}
      {errorMessage && (
        <div className="error-banner animate-fade-in">
          <AlertTriangle size={20} className="error-icon" />
          <div className="error-text">
            <strong>Échec de l'analyse IA</strong>
            <p>{errorMessage}</p>
          </div>
          {onDismissError && (
            <button className="dismiss-btn" onClick={onDismissError}>
              <X size={16} />
            </button>
          )}
        </div>
      )}
      {/* Zone de scan / Upload de photo */}
      <div className="hero-section">
        <div className="image-card">
          <img
            src={selectedObject.image_url}
            alt={selectedObject.object_name}
            className="scanned-image"
          />
          <div className="image-overlay-badge">
            <span className="live-dot"></span>
            <span>Objet Détecté</span>
          </div>

          <button
            className="upload-fab"
            onClick={() => fileInputRef.current?.click()}
            title="Prendre en photo ou uploader une image"
          >
            <Camera size={20} color="#FFFFFF" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />

          {isAnalyzing && (
            <div className="analyzing-overlay">
              <div className="spinner-red"></div>
              <p>Analyse VLM par IA en cours...</p>
              <span>Décomposition des matériaux & machines</span>
            </div>
          )}
        </div>
      </div>

      {/* Galerie d'exemples pré-chargés */}
      <div className="presets-container">
        <p className="presets-title">Ou choisissez un exemple :</p>
        <div className="presets-scroll">
          {MOCK_OBJECTS.map((obj) => (
            <button
              key={obj.id}
              className={`preset-chip ${selectedObject.id === obj.id ? 'active' : ''}`}
              onClick={() => onSelectObject(obj)}
            >
              <img src={obj.image_url} alt={obj.object_name} className="chip-thumb" />
              <span>{obj.object_name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fiche Titre & Sélecteur de Niveau */}
      <div className="object-details-card">
        <div className="object-header">
          <span className="category-pill">{selectedObject.category}</span>
          <h2 className="object-name">{selectedObject.object_name}</h2>
        </div>

        {/* Sélecteur de Niveau de complexité à 3 modes */}
        <div className="toggle-section">
          <p className="section-label">NIVEAU DE COMPLEXITÉ</p>
          <ComplexityToggle
            selectedLevel={selectedLevel}
            onSelectLevel={onSelectLevel}
          />
        </div>

        {/* Grille de métadonnées */}
        <div className="meta-grid">
          <div className="meta-item">
            <div className="meta-icon">
              <Layers size={16} color="#D90429" />
            </div>
            <div>
              <span className="meta-val">{selectedObject.steps.length} Étapes</span>
              <span className="meta-lbl">Chaîne complète</span>
            </div>
          </div>

          {selectedObject.carbon_score && (
            <div className="meta-item">
              <div className="meta-icon">
                <Leaf size={16} color="#16A34A" />
              </div>
              <div>
                <span className="meta-val">{selectedObject.carbon_score}</span>
                <span className="meta-lbl">Empreinte CO2</span>
              </div>
            </div>
          )}

          {selectedObject.production_time && (
            <div className="meta-item">
              <div className="meta-icon">
                <Clock size={16} color="#2563EB" />
              </div>
              <div>
                <span className="meta-val">{selectedObject.production_time}</span>
                <span className="meta-lbl">Temps estimé</span>
              </div>
            </div>
          )}
        </div>

        {/* Matériaux détectés */}
        <div className="materials-box">
          <p className="section-label">MATÉRIAUX COMPOSANTS</p>
          <div className="materials-tags">
            {selectedObject.materials.map((mat, i) => (
              <span key={i} className="mat-tag">
                {mat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Principal Noir & Rouge */}
      <div className="cta-container">
        <button className="btn-black cta-btn" onClick={onStartExploration}>
          <span>Explorer la fabrication ({selectedObject.steps.length} étapes)</span>
          <ArrowRight size={18} />
        </button>
      </div>

      <style>{`
        .error-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          background-color: #FEF2F2;
          border: 1.5px solid #FCA5A5;
          box-shadow: 0 4px 12px rgba(217, 4, 41, 0.08);
        }

        .error-icon {
          color: var(--accent-scarlet);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .error-text {
          flex: 1;
          font-size: 12.5px;
          color: #991B1B;
          line-height: 1.4;
        }

        .error-text strong {
          display: block;
          font-family: var(--font-heading);
          font-size: 13.5px;
          font-weight: 700;
          color: var(--accent-scarlet);
          margin-bottom: 2px;
        }

        .dismiss-btn {
          border: none;
          background: transparent;
          color: #991B1B;
          cursor: pointer;
          padding: 2px;
        }

        .scan-screen {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-bottom: 30px;
        }

        .hero-section {
          width: 100%;
        }

        .image-card {
          position: relative;
          width: 100%;
          height: 230px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border-light);
          background-color: #EFECE6;
        }

        .scanned-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-overlay-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(17, 17, 17, 0.75);
          backdrop-filter: blur(8px);
          color: #FFFFFF;
          padding: 5px 12px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: var(--accent-scarlet);
          box-shadow: 0 0 8px var(--accent-scarlet);
        }

        .upload-fab {
          position: absolute;
          bottom: 12px;
          right: 12px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: var(--btn-black);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s ease;
        }

        .upload-fab:hover {
          transform: scale(1.1);
        }

        .analyzing-overlay {
          position: absolute;
          inset: 0;
          background: rgba(245, 244, 240, 0.92);
          backdrop-filter: blur(4px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 20px;
          text-align: center;
        }

        .spinner-red {
          width: 36px;
          height: 36px;
          border: 3px solid var(--border-light);
          border-top-color: var(--accent-scarlet);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .presets-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .presets-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .presets-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .preset-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px 6px 6px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-light);
          background-color: var(--bg-card);
          cursor: pointer;
          font-family: var(--font-heading);
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-main);
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .preset-chip.active {
          border-color: var(--btn-black);
          background-color: var(--btn-black);
          color: #FFFFFF;
        }

        .chip-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
        }

        .object-details-card {
          background-color: var(--bg-card);
          border-radius: var(--radius-lg);
          padding: 20px;
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .category-pill {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--accent-scarlet);
          background: var(--accent-scarlet-light);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          margin-bottom: 4px;
        }

        .object-name {
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
        }

        .section-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 10px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          border-radius: var(--radius-md);
          background-color: var(--bg-app);
        }

        .meta-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .meta-val {
          display: block;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.2;
        }

        .meta-lbl {
          display: block;
          font-size: 10px;
          color: var(--text-muted);
        }

        .materials-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .mat-tag {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          background-color: var(--bg-app);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          font-weight: 500;
        }

        .cta-container {
          margin-top: 4px;
        }

        .cta-btn {
          width: 100%;
          padding: 16px;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};
