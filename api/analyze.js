module.exports = async function handler(req, res) {
  // Solo aceptar POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, useMock } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // MODO DEBUG: Solo en preview y development, nunca en production
    const isProduction = process.env.VERCEL_ENV === 'production';
    if (!isProduction && useMock) {
      console.log('DEBUG MODE: Returning mock data (non-production environment)');

      // Mock data para testing visual
      const mockData = {
        content: [{
          type: 'text',
          text: JSON.stringify({
            bio: "Fanática del cine con criterio cuestionable pero divertido. Mezclas Wes Anderson con Marvel sin vergüenza. Tu Letterboxd es un mood board de personalidad: 50% pretentious, 50% guilty pleasures, 100% entretenido.",
            greenFlags: [
              "Aprecias tanto el slow cinema como las explosiones de Michael Bay",
              "Das 5 estrellas a películas que técnicamente son malas pero te hacen feliz",
              "Tu sección de favoritas tiene más diversidad que un festival de cine"
            ],
            redFlags: [
              "Tienes la audacia de poner una película de Nolan en favoritas (qué original)",
              "Viste 3 películas de A24 y ya te consideras cinéfila",
              "Le diste 4 estrellas a una película solo porque el protagonista es guapo"
            ],
            firstDateReactions: [
              {
                user: "@coffeesnob",
                comment: "Explicó la diferencia entre 35mm y digital por 15 minutos. Pretencioso pero de forma adorable.",
                rating: "⭐⭐⭐⭐"
              },
              {
                user: "@normalviewer",
                comment: "Lloró con Paddington 2. Sin ironía. Genuinas lágrimas. Definitivamente keeper material.",
                rating: "⭐⭐⭐⭐⭐"
              },
              {
                user: "@filmcritichottie",
                comment: "Dijo que Nolan es 'mid' en el primer date. Marry me challenge.",
                rating: "⭐⭐⭐⭐½"
              }
            ],
            compatibility: {
              type: "Alguien que respete tu caos cinematográfico pero te desafíe",
              description: "Necesitas a alguien que no te juzgue por llorar con Toy Story 3, pero que te haga ver películas fuera de tu zona de confort. Alguien que traiga palomitas a la proyección de 3 horas en blanco y negro que insistes en ver."
            }
          })
        }]
      };

      return res.status(200).json(mockData);
    }

    // PRODUCTION: Siempre usa la API real
    if (isProduction && useMock) {
      console.log('Mock mode requested in production - ignoring and using real API');
    }

    // PASO 1: Usar Haiku para parsear la información de la imagen
    console.log('Step 1: Parsing image with Haiku...');
    const parseResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
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
              text: `Analiza esta imagen de un perfil de Letterboxd y extrae la información de las películas.

IMPORTANTE: Responde SOLO con un objeto JSON, sin markdown, sin explicaciones, sin backticks.

Extrae:
1. Las 4 películas favoritas (si están visibles)
2. Las películas vistas recientemente (si están visibles)
3. Cualquier rating o información adicional relevante

Formato JSON:
{
  "favorites": ["película 1", "película 2", "película 3", "película 4"],
  "recent": ["película 1", "película 2", "película 3", "película 4"],
  "stats": "cualquier otra información relevante del perfil"
}

Si no puedes ver alguna sección, deja el array vacío. SOLO JSON, sin formato markdown.`
            }
          ]
        }]
      })
    });

    if (!parseResponse.ok) {
      const errorData = await parseResponse.json();
      console.error('Haiku parsing error:', errorData);
      return res.status(parseResponse.status).json({
        error: 'Error parsing image with Haiku',
        details: errorData
      });
    }

    const parseData = await parseResponse.json();
    let parsedText = parseData.content.find(item => item.type === 'text')?.text || '';
    parsedText = parsedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsedInfo = JSON.parse(parsedText);

    console.log('Parsed info:', parsedInfo);

    // PASO 2: Usar Sonnet para generar el perfil creativo basado en la info parseada
    console.log('Step 2: Generating profile with Sonnet...');
    const profileResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Basándote en este perfil de Letterboxd, genera un perfil de dating chistoso y específico:

Películas favoritas: ${parsedInfo.favorites.join(', ')}
Películas vistas recientemente: ${parsedInfo.recent.join(', ')}
Stats adicionales: ${parsedInfo.stats || 'N/A'}

IMPORTANTE: Responde SOLO con un objeto JSON, sin markdown, sin explicaciones, sin backticks. El JSON debe tener esta estructura exacta:

{
  "bio": "Una descripción del usuario basada en sus películas (180-220 caracteres). Captura su personalidad cinematográfica con humor y especificidad.",
  "greenFlags": [
    "Green flag 1 (70-90 caracteres, específica y detallada)",
    "Green flag 2 (70-90 caracteres, específica y detallada)",
    "Green flag 3 (70-90 caracteres, específica y detallada)"
  ],
  "redFlags": [
    "Red flag 1 (70-90 caracteres, específica y detallada)",
    "Red flag 2 (70-90 caracteres, específica y detallada)",
    "Red flag 3 (70-90 caracteres, específica y detallada)"
  ],
  "firstDateReactions": [
    {
      "user": "@usuario1",
      "comment": "Comentario divertido sobre el date (80-110 caracteres)",
      "rating": "⭐⭐⭐⭐"
    },
    {
      "user": "@usuario2",
      "comment": "Comentario divertido sobre el date (80-110 caracteres)",
      "rating": "⭐⭐⭐⭐⭐"
    },
    {
      "user": "@usuario3",
      "comment": "Comentario divertido sobre el date (80-110 caracteres)",
      "rating": "⭐⭐⭐⭐½"
    }
  ],
  "compatibility": {
    "type": "Tipo de persona que haría match (60-70 caracteres)",
    "description": "Por qué harían match (180-220 caracteres). Enfócate en complementación, no solo gustos idénticos. Piensa en cómo sus diferencias los harían interesantes juntos."
  }
}

GUÍA DE TONO Y CONTENIDO:
- Tono: Sarcástico, Gen Z, chistoso pero no cruel. Insightful y específico, no genérico.
- Sé ESPECÍFICO con las películas mencionadas. Usa nombres, directores, géneros concretos.
- Busca patterns interesantes: géneros, directores, épocas, temas recurrentes.
- Señala contradicciones o ironías entre favoritas y recientes.
- Hot takes basados en las películas específicas del usuario.

BIO:
- Debe capturar la esencia cinematográfica del usuario.
- Menciona patterns específicos que notaste en su perfil.
- Hazlo personal y único, no genérico.

GREEN FLAGS:
- Resalta aspectos positivos de su gusto cinematográfico.
- Sé específico: menciona géneros, directores, o tipos de películas concretas.
- Pueden ser sinceros o irónicos, pero siempre con fundamento.

RED FLAGS:
- Señala contradicciones, pretentiousness, o aspectos cuestionables con humor.
- Deben ser observations reales basadas en las películas, no insultos genéricos.
- El humor debe venir de la especificidad.

FIRST DATE REACTIONS:
- Son reviews de "dates ficticias previas" con este usuario.
- 3 reviews de diferentes personas (@usuario puede ser cualquier username creativo).
- Cada review debe:
  * Mencionar algo específico que pasó en el "date" relacionado con películas
  * Tener personalidad propia (diferentes perspectivas)
  * Ser divertida pero honesta
  * Usar ratings de estrellas (⭐) - varía entre 3-5 estrellas, puede usar ½
- Ejemplos de buenos comments:
  * "Explained the Kuleshov effect on date 1. Pretencioso pero hot somehow."
  * "Cried during Paddington 2. No ironía, genuinas lágrimas. Keeper."
  * "Said their comfort movie was Synecdoche New York. Red flag or green flag? Still deciding."
- Los @usernames pueden ser creativos: @filmsnob420, @normalviewer, @a24stan, etc.

COMPATIBILIDAD:
- NO digas "alguien que también ame X" (muy obvio y aburrido).
- PIENSA EN COMPLEMENTACIÓN: ¿Qué tipo de persona los complementaría?
- Considera: alguien que balance sus gustos, que traiga algo nuevo, que entienda su vibe pero lo desafíe.
- Ejemplo: Si solo ven películas tristes → alguien que los convenza de ver una comedia ocasional.

RECUERDA: Solo JSON, sin formato markdown. Mobile-responsive: todo debe ser legible en celular.`
        }]
      })
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.error('Sonnet generation error:', errorData);
      return res.status(profileResponse.status).json({
        error: 'Error generating profile with Sonnet',
        details: errorData
      });
    }

    const profileData = await profileResponse.json();
    return res.status(200).json(profileData);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
