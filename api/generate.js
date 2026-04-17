// api/generate.js
// Función serverless de Vercel — proxy seguro hacia la API de Google Gemini
// Modelo: gemini-2.5-flash (tier gratuito: 500 requests/día)
// Obtén tu key gratuita en: aistudio.google.com → "Get API key"

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

  // gemini-2.5-flash: modelo gratuito actual (500 req/día)
  // - Soporta system_instruction nativamente
  // - Endpoint: v1beta
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

  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: 'Error de la API de Gemini',
        detail: errorData,
      });
    }

    const data = await response.json();

    // Normalizar al mismo formato que Anthropic para que el frontend no cambie
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta.';

    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Error interno del servidor',
      detail: error.message,
    });
  }
}
