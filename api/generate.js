// api/generate.js
// Función serverless de Vercel — proxy seguro hacia la API de Google Gemini
// Modelos en orden de preferencia (todos con tier gratuito):
//   1. gemini-2.5-flash      — mejor calidad, 20 RPM
//   2. gemini-2.0-flash-lite — fallback, límites más relajados
// Obtén tu key gratuita en: aistudio.google.com → "Get API key"

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
];

// Códigos que disparan el fallback al siguiente modelo
const FALLBACK_CODES = [429, 503];

async function callGemini(apiKey, model, body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response;
}

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { system, messages } = req.body;

  if (!system || !messages) {
    return res.status(400).json({ error: 'Faltan parámetros: system y messages son requeridos' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key de Gemini no configurada en el servidor' });
  }

  const userMessage = messages[messages.length - 1]?.content || '';

  const geminiBody = {
    system_instruction: {
      parts: [{ text: system }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
    }
  };

  let lastError = null;

  for (const model of MODELS) {
    try {
      const response = await callGemini(apiKey, model, geminiBody);

      // Si es un código de fallback, intentar con el siguiente modelo
      if (FALLBACK_CODES.includes(response.status)) {
        const errorData = await response.json();
        lastError = errorData;
        continue;
      }

      // Cualquier otro error no recuperable — devolver directo
      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json({
          error: 'Error de la API de Gemini',
          detail: errorData,
        });
      }

      // Éxito
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta.';

      return res.status(200).json({
        content: [{ type: 'text', text }],
        model_used: model,
      });

    } catch (error) {
      lastError = { message: error.message };
      continue;
    }
  }

  // Todos los modelos fallaron
  return res.status(429).json({
    error: 'Límite de uso alcanzado en todos los modelos. Intenta en unos minutos.',
    detail: lastError,
  });
}
