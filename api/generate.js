// api/generate.js
// Función serverless de Vercel — proxy seguro hacia la API de Google Gemini
// Modelo principal: gemini-2.5-flash (tier gratuito: 500 req/día)
// Modelo fallback: gemini-2.0-flash-lite (tier gratuito, menos demanda)
// Obtén tu key gratuita en: aistudio.google.com → "Get API key"

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
];

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

  // Intentar con cada modelo en orden — si uno falla con 503, pasa al siguiente
  let lastError = null;

  for (const model of MODELS) {
    try {
      const response = await callGemini(apiKey, model, geminiBody);

      // Si no es 503, procesar la respuesta (sea éxito o error distinto)
      if (response.status !== 503) {
        if (!response.ok) {
          const errorData = await response.json();
          return res.status(response.status).json({
            error: 'Error de la API de Gemini',
            detail: errorData,
          });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta.';

        return res.status(200).json({
          content: [{ type: 'text', text }],
          model_used: model, // útil para debug
        });
      }

      // Es 503 — guardar el error y probar con el siguiente modelo
      const errorData = await response.json();
      lastError = errorData;
      continue;

    } catch (error) {
      lastError = { message: error.message };
      continue;
    }
  }

  // Si llegamos aquí, todos los modelos fallaron con 503
  return res.status(503).json({
    error: 'Todos los modelos están temporalmente saturados. Intenta en unos minutos.',
    detail: lastError,
  });
}
