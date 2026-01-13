module.exports = async function handler(req, res) {
  // Solo aceptar POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Llamar a la API de Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageData
              }
            },
            {
              type: 'text',
              text: `Analiza este perfil de Letterboxd y genera un perfil de dating chistoso.

IMPORTANTE: Responde SOLO con un objeto JSON, sin markdown, sin explicaciones, sin backticks. El JSON debe tener esta estructura exacta:

{
  "mainCharacter": {
    "name": "Nombre del personaje de película",
    "description": "Por qué eres este personaje (máx 120 caracteres)"
  },
  "greenFlags": [
    "Green flag 1 (máx 60 caracteres)",
    "Green flag 2 (máx 60 caracteres)"
  ],
  "redFlags": [
    "Red flag 1 (máx 60 caracteres)",
    "Red flag 2 (máx 60 caracteres)",
    "Red flag 3 (máx 60 caracteres)"
  ],
  "compatibility": {
    "type": "Tipo de persona que haría match (máx 50 caracteres)",
    "description": "Por qué harían match (máx 100 caracteres)"
  }
}

Tono: Sarcástico, Gen Z, chistoso pero no cruel. Enfócate en:
- Patterns en géneros/directores/años
- Contradicciones entre favoritas y recientes
- Hot takes en los ratings
- Referencias a "film bro", pretentiousness, etc.

Personajes comunes a asignar: Tyler Durden, Patrick Bateman, Manic Pixie Dream Girl, Andy Sachs, Llewyn Davis, cualquier protagonista de A24, etc.

RECUERDA: Solo JSON, sin formato markdown.`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(response.status).json({
        error: 'Error calling Anthropic API',
        details: errorData
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
