import React, { useState, useEffect } from 'react';
import { ManufacturingObject, ComplexityLevel, AIConfig } from './types';
import { MOCK_OBJECTS } from './data/mockObjects';
import { Header } from './components/Header';
import { ScanScreen } from './components/ScanScreen';
import { ExplorationScreen } from './components/ExplorationScreen';
import { analyzeImage } from './services/openSourceAiService';

const DEFAULT_CONFIG: AIConfig = {
  provider: 'openrouter',
  openRouterKey: '',
  openRouterModel: 'meta-llama/llama-3.2-11b-vision-instruct:free',
  huggingFaceKey: '',
  huggingFaceModel: 'meta-llama/Llama-3.1-8B-Instruct',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llava',
  geminiKey: ''
};

export const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<'scan' | 'exploration'>('scan');
  const [selectedObject, setSelectedObject] = useState<ManufacturingObject>(MOCK_OBJECTS[0]);
  const [selectedLevel, setSelectedLevel] = useState<ComplexityLevel>('general');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem('makerlens_ai_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('makerlens_ai_config', JSON.stringify(aiConfig));
  }, [aiConfig]);

  const handleCustomImageUpload = async (base64Image: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const result = await analyzeImage(base64Image, aiConfig);
      setSelectedObject(result);
    } catch (err: any) {
      console.error("Erreur d'analyse d'image :", err);
      setErrorMessage(err.message || "Une erreur est survenue lors de l'analyse IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="app-container">
      <Header
        config={aiConfig}
        onUpdateConfig={setAiConfig}
        onResetToHome={() => setActiveScreen('scan')}
      />

      <main className="main-content">
        {activeScreen === 'scan' ? (
          <ScanScreen
            selectedObject={selectedObject}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
            onSelectObject={setSelectedObject}
            onCustomImageUpload={handleCustomImageUpload}
            onStartExploration={() => setActiveScreen('exploration')}
            isAnalyzing={isAnalyzing}
            errorMessage={errorMessage}
            onDismissError={() => setErrorMessage(null)}
          />
        ) : (
          <ExplorationScreen
            objectData={selectedObject}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
            onBackToScan={() => setActiveScreen('scan')}
          />
        )}
      </main>

      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100%;
        }

        .main-content {
          flex: 1;
        }
      `}</style>
    </div>
  );
};

export default App;
