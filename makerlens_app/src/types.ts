export type AIProvider = 'demo' | 'openrouter' | 'huggingface' | 'ollama' | 'gemini';

export interface AIConfig {
  provider: AIProvider;
  openRouterKey: string;
  openRouterModel: string;
  huggingFaceKey: string;
  huggingFaceModel: string;
  ollamaUrl: string;
  ollamaModel: string;
  geminiKey: string;
}

export interface StepExplanation {
  kids: string;
  general: string;
  expert: string;
}

export interface TechnicalDetails {
  machinery: string;
  temperature?: string;
  pressure?: string;
  duration?: string;
  tolerance?: string;
}

export interface ManufacturingStep {
  step_number: number;
  title: string;
  explanations: StepExplanation;
  details: TechnicalDetails;
  image_url?: string;
}

export interface QuizData {
  question: string;
  options: string[];
  correct_answer: number; // 0-based index
  explanation: string;
}

export interface ManufacturingObject {
  id: string;
  object_name: string;
  category: string;
  image_url: string;
  materials: string[];
  carbon_score?: string;
  recyclability?: string;
  production_time?: string;
  steps: ManufacturingStep[];
  quiz: QuizData;
}
