import { ManufacturingObject } from '../types';
import { MOCK_OBJECTS } from '../data/mockObjects';

/**
 * Service orchestrant l'analyse VLM via l'API Gemini ou fallback simulé
 */
export async function analyzeImageWithVLM(
  base64Image: string,
  apiKey?: string
): Promise<ManufacturingObject> {
  if (!apiKey) {
    // Mode Démo Simulée : sélectionne un objet réaliste ou crée une analyse simulée dynamique
    await new Promise((resolve) => setTimeout(resolve, 2200)); // Simule le temps d'analyse IA
    const randomObject = MOCK_OBJECTS[Math.floor(Math.random() * MOCK_OBJECTS.length)];
    return {
      ...randomObject,
      id: 'custom-scanned-' + Date.now(),
      image_url: base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`
    };
  }

  try {
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const systemPrompt = `
Tu es un ingénieur industriel expert et vulgarisateur scientifique.
Analyse cette image d'un objet et génère sa chaîne de fabrication industrielle détaillée en respectant STRICTEMENT le format JSON suivant :

{
  "object_name": "Nom de l'objet identifié",
  "category": "Catégorie industrielle",
  "materials": ["Matériau 1", "Matériau 2"],
  "carbon_score": "ex: 120g CO2e / unité",
  "recyclability": "ex: Recyclable à 80%",
  "production_time": "ex: 12 minutes",
  "quiz": {
    "question": "Question fermée captivante sur la fabrication",
    "options": ["Option A", "Option B", "Option C"],
    "correct_answer": 1,
    "explanation": "Explication vivante de la réponse"
  },
  "steps": [
    {
      "step_number": 1,
      "title": "Nom de l'étape",
      "explanations": {
        "kids": "Explication simple avec métaphores ludiques pour enfants",
        "general": "Explication claire et structurée grand public",
        "expert": "Explication technique poussée (températures °C, pressions, alliages, tolérances)"
      },
      "details": {
        "machinery": "Nom de la machine industrielle",
        "temperature": "ex: 240°C (optionnel)",
        "pressure": "ex: 40 bars (optionnel)",
        "duration": "ex: 12 secondes (optionnel)",
        "tolerance": "ex: ±0.05mm (optionnel)"
      }
    }
  ]
}
Renvoie UNIQUEMENT le JSON valide, sans texte additionnel ni blocs markdown.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: cleanBase64
                  }
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur API Gemini (${response.status})`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedJson);

    return {
      id: 'gemini-' + Date.now(),
      image_url: base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`,
      ...parsedData
    };
  } catch (error) {
    console.warn("Échec de l'analyse Gemini, utilisation du fallback simulé:", error);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      ...MOCK_OBJECTS[0],
      id: 'fallback-' + Date.now(),
      image_url: base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`
    };
  }
}
