import React, { useState } from 'react';
import { AIConfig, AIProvider } from '../types';
import { Sparkles, Cpu, Server, Key, Check, ChevronDown, ShieldCheck, Globe } from 'lucide-react';

interface HeaderProps {
  config: AIConfig;
  onUpdateConfig: (newConfig: AIConfig) => void;
  onResetToHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ config, onUpdateConfig, onResetToHome }) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempConfig, setTempConfig] = useState<AIConfig>(config);

  const handleSave = () => {
    onUpdateConfig(tempConfig);
    setShowConfigModal(false);
  };

  const getProviderLabel = () => {
    switch (config.provider) {
      case 'openrouter':
        return '🌐 OpenRouter VLM';
      case 'huggingface':
        return '🤗 Hugging Face';
      case 'ollama':
        return '🦙 Ollama Local';
      case 'gemini':
        return '✨ Gemini API';
      case 'demo':
      default:
        return '⚡ Mode Démo';
    }
  };

  return (
    <>
      <header className="header-container">
        <div className="header-brand" onClick={onResetToHome} style={{ cursor: 'pointer' }}>
          <div className="logo-badge">
            <Sparkles size={18} color="#FFFFFF" />
          </div>
          <div>
            <h1 className="header-title">MakerLens<span className="accent-red">.AI</span></h1>
            <p className="header-subtitle">Exploration de fabrication</p>
          </div>
        </div>

        <button
          className={`provider-chip ${config.provider !== 'demo' ? 'active' : ''}`}
          onClick={() => setShowConfigModal(true)}
          title="Configurer le modèle d'IA VLM (OpenRouter, Hugging Face, Ollama, Gemini)"
        >
          <span>{getProviderLabel()}</span>
          <ChevronDown size={14} />
        </button>
      </header>

      {/* Modale de Configuration des IA Open-Source */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <Cpu size={22} className="accent-red" />
              <div>
                <h3>Moteur d'IA VLM</h3>
                <p className="modal-subtitle">Choisissez votre modèle d'analyse d'image</p>
              </div>
            </div>

            {/* Onglets de sélection du fournisseur */}
            <div className="providers-grid">
              <button
                className={`provider-card ${tempConfig.provider === 'openrouter' ? 'selected' : ''}`}
                onClick={() => setTempConfig({ ...tempConfig, provider: 'openrouter' })}
              >
                <div className="card-top">
                  <Globe size={18} />
                  <span className="badge-os">Open-Source</span>
                </div>
                <strong className="p-title">OpenRouter VLM</strong>
                <span className="p-desc">Modèles Vision Open-Source Gratuits (Llama 3.2 Vision)</span>
              </button>

              <button
                className={`provider-card ${tempConfig.provider === 'huggingface' ? 'selected' : ''}`}
                onClick={() => setTempConfig({ ...tempConfig, provider: 'huggingface' })}
              >
                <div className="card-top">
                  <Cpu size={18} />
                  <span className="badge-os">Open-Source</span>
                </div>
                <strong className="p-title">Hugging Face</strong>
                <span className="p-desc">Chaîne Vision + LLM Serverless (BLIP-2 & Llama 3.1)</span>
              </button>

              <button
                className={`provider-card ${tempConfig.provider === 'ollama' ? 'selected' : ''}`}
                onClick={() => setTempConfig({ ...tempConfig, provider: 'ollama' })}
              >
                <div className="card-top">
                  <Server size={18} />
                  <span className="badge-os">Local</span>
                </div>
                <strong className="p-title">Ollama Local</strong>
                <span className="p-desc">100% hors-ligne sur votre machine (Llava, Qwen2-VL)</span>
              </button>

              <button
                className={`provider-card ${tempConfig.provider === 'demo' ? 'selected' : ''}`}
                onClick={() => setTempConfig({ ...tempConfig, provider: 'demo' })}
              >
                <div className="card-top">
                  <ShieldCheck size={18} />
                  <span className="badge-demo">Instantané</span>
                </div>
                <strong className="p-title">Mode Démo</strong>
                <span className="p-desc">Génération simulée pour objets scannés</span>
              </button>
            </div>

            {/* Champs de configuration spécifique */}
            <div className="config-fields-box">
              {tempConfig.provider === 'openrouter' && (
                <>
                  <div className="info-box-yellow">
                    <p className="info-box-title">🌐 OpenRouter VLM (Recommandé)</p>
                    <p className="info-box-desc">
                      Héberge des modèles VLM Open-Source (Llama 3.2 Vision, Qwen2-VL) avec analyse visuelle directe d'image.
                    </p>
                  </div>

                  <label className="field-label">Clé API OpenRouter (Optionnelle) :</label>
                  <input
                    type="password"
                    className="form-input"
                    value={tempConfig.openRouterKey || ''}
                    onChange={(e) => setTempConfig({ ...tempConfig, openRouterKey: e.target.value })}
                    placeholder="sk-or-v1-..."
                  />

                  <label className="field-label">Modèle Vision Open-Source :</label>
                  <select
                    className="form-input"
                    value={tempConfig.openRouterModel || 'meta-llama/llama-3.2-11b-vision-instruct:free'}
                    onChange={(e) => setTempConfig({ ...tempConfig, openRouterModel: e.target.value })}
                  >
                    <option value="meta-llama/llama-3.2-11b-vision-instruct:free">Meta Llama 3.2 11B Vision (Gratuit)</option>
                    <option value="qwen/qwen-2-vl-7b-instruct:free">Qwen 2 VL 7B Instruct (Gratuit)</option>
                    <option value="google/gemma-2-9b-it:free">Google Gemma 2 9B (Gratuit)</option>
                  </select>
                </>
              )}

              {tempConfig.provider === 'huggingface' && (
                <>
                  <div className="hf-token-guide">
                    <p className="guide-title">🔑 Configuration Jeton Hugging Face :</p>
                    <ol className="guide-steps">
                      <li>Sur <strong>huggingface.co/settings/tokens</strong>, créez un jeton</li>
                      <li>Cochez la permission : <strong>"Make calls to Inference Providers"</strong></li>
                    </ol>
                    <a
                      href="https://huggingface.co/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-hf-link"
                    >
                      👉 Gérer mes jetons Hugging Face
                    </a>
                  </div>

                  <label className="field-label">Jeton API Hugging Face (HF Token) :</label>
                  <input
                    type="password"
                    className="form-input"
                    value={tempConfig.huggingFaceKey}
                    onChange={(e) => setTempConfig({ ...tempConfig, huggingFaceKey: e.target.value })}
                    placeholder="hf_..."
                  />
                </>
              )}

              {tempConfig.provider === 'ollama' && (
                <>
                  <div className="info-box-yellow">
                    <p className="info-box-title">⚡ Ollama Local (100% Hors-ligne)</p>
                    <p className="info-box-desc">
                      Si Ollama n'est pas lancé, l'application bascule intelligemment sur le moteur d'analyse personnalisé.
                    </p>
                  </div>

                  <label className="field-label">URL du serveur Ollama Local :</label>
                  <input
                    type="text"
                    className="form-input"
                    value={tempConfig.ollamaUrl}
                    onChange={(e) => setTempConfig({ ...tempConfig, ollamaUrl: e.target.value })}
                    placeholder="http://localhost:11434"
                  />
                </>
              )}

              {tempConfig.provider === 'demo' && (
                <p className="field-info">
                  Le mode démo génère des chaînes de fabrication ultra-détaillées sans nécessiter d'API ni d'installation d'IA locale.
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowConfigModal(false)}>
                Fermer
              </button>
              <button className="btn-black" onClick={handleSave}>
                <Check size={16} /> Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background-color: var(--bg-card);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo-badge {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background-color: var(--btn-black);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-title {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }

        .accent-red {
          color: var(--accent-scarlet);
        }

        .header-subtitle {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .provider-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: var(--radius-full);
          font-family: var(--font-heading);
          font-size: 12px;
          font-weight: 600;
          border: 1px solid var(--border-light);
          background-color: var(--bg-app);
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .provider-chip.active {
          border-color: var(--btn-black);
          background-color: var(--btn-black);
          color: #FFFFFF;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(17, 17, 17, 0.45);
          backdrop-filter: blur(5px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .modal-content {
          background: var(--bg-card);
          padding: 22px;
          border-radius: var(--radius-lg);
          max-width: 440px;
          width: 100%;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-light);
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .modal-subtitle {
          font-size: 12px;
          color: var(--text-muted);
        }

        .providers-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 16px;
        }

        .provider-card {
          padding: 12px;
          border-radius: var(--radius-md);
          border: 1.5px solid var(--border-light);
          background-color: var(--bg-app);
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: all 0.2s ease;
        }

        .provider-card:hover {
          border-color: var(--text-main);
        }

        .provider-card.selected {
          border-color: var(--accent-scarlet);
          background-color: var(--accent-scarlet-light);
        }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .badge-os {
          font-size: 9px;
          font-weight: 700;
          background-color: var(--btn-black);
          color: #FFFFFF;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .badge-demo {
          font-size: 9px;
          font-weight: 700;
          background-color: #059669;
          color: #FFFFFF;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .p-title {
          font-family: var(--font-heading);
          font-size: 13px;
          font-weight: 700;
        }

        .p-desc {
          font-size: 10.5px;
          color: var(--text-muted);
          line-height: 1.3;
        }

        .config-fields-box {
          background-color: var(--bg-app);
          padding: 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          margin-bottom: 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
        }

        .form-input {
          width: 100%;
          padding: 10px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-light);
          font-size: 13px;
          outline: none;
          background-color: #FFFFFF;
        }

        .form-input:focus {
          border-color: var(--btn-black);
        }

        .field-info {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .info-box-yellow {
          background-color: #FEF3C7;
          border: 1px solid #FDE68A;
          padding: 10px;
          border-radius: var(--radius-sm);
          margin-bottom: 6px;
        }

        .info-box-title {
          font-family: var(--font-heading);
          font-size: 12px;
          font-weight: 700;
          color: #92400E;
          margin-bottom: 2px;
        }

        .info-box-desc {
          font-size: 11px;
          color: #78350F;
          line-height: 1.4;
        }

        .hf-token-guide {
          background-color: var(--accent-scarlet-light);
          border: 1px solid rgba(217, 4, 41, 0.2);
          padding: 10px;
          border-radius: var(--radius-sm);
          margin-bottom: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .guide-title {
          font-family: var(--font-heading);
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-scarlet);
        }

        .guide-steps {
          font-size: 11px;
          color: var(--text-main);
          padding-left: 16px;
          line-height: 1.3;
        }

        .btn-hf-link {
          display: inline-block;
          margin-top: 4px;
          padding: 5px 9px;
          background-color: var(--btn-black);
          color: #FFFFFF;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
          text-align: center;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
      `}</style>
    </>
  );
};
