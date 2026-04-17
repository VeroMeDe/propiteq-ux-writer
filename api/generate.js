// api/generate.js
// Función serverless de Vercel — proxy seguro hacia la API de Google Gemini
// Modelo: gemini-1.5-flash-latest (tier gratuito: 1.500 requests/día)
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

  // gemini-1.5-flash-latest no soporta system_instruction
  // Se inyecta el system prompt como primer turno de conversación
  const geminiBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${system}\n\n---\n\n${userMessage}` }]
      }
    ],
    generationConfig: {
      maxOutputTokens: 1500,
      temperature: 0.7,
    }
  };

  const model = 'gemini-1.5-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

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
