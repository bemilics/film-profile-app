const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, crush, useMock } = req.body;

    if (!user || !crush) {
      return res.status(400).json({ error: 'Both user and crush data required' });
    }

    // MODO DEBUG: Solo en preview y development
    const isProduction = process.env.VERCEL_ENV === 'production';
    if (!isProduction && useMock) {
      console.log('DEBUG MODE: Returning mock compatibility data');

      const mockData = {
        content: [{
          type: 'text',
          text: JSON.stringify({
            compatibility_percentage: 73,
            relationship_archetype: {
              emoji: "🎭",
              title: "LA COMEDIA ROMÁNTICA QUE SE CONVIRTIÓ EN A24",
              subtitle: "The Rom-Com That Became Art House",
              description: "Ustedes empezarían dulce y optimista pero inevitablemente se pondrían oscuros y existenciales. Uno tiene Paddington, el otro tiene Requiem for a Dream. Esa contradicción es exactamente por qué funcionaría. Se complementan sin saberse."
            },
            first_date_scenario: {
              narrative: "Ustedes irían a ver una película indie que ninguno eligió realmente - fue el único horario que les funcionó. Después pasarían 2 horas en un café debatiendo si estuvo sobrevalorada. Ninguno convence al otro, pero ambos disfrutan la conversación. Piden postre solo para quedarse más tiempo."
            },
            dynamics: {
              green_flags: [
                { emoji: "🎬", text: "Ambos toman el cine en serio sin ser pretenciosos" },
                { emoji: "💬", text: "Las conversaciones van de lo superficial a lo profundo naturalmente" }
              ],
              red_flags: [
                { emoji: "📊", text: "Podrían competir por quién tiene mejor taste" },
                { emoji: "🤔", text: "Uno sobreanaliza, el otro siente demasiado - pueden frustrarse" }
              ]
            },
            verdict: {
              category: "Partner Material 💍",
              reasoning: "Tienen suficiente en común para conectar pero suficiente diferencia para mantenerse interesantes. Ninguno es perfecto, pero ambos están dispuestos a discutir, escuchar, y crecer. Eso es literalmente todo lo que importa.",
              timeline_prediction: "Esto es de 8 meses intensos que se convierten en 3 años estables, o implosiona espectacularmente en 6 semanas. No hay punto medio."
            },
            action_plan: {
              movies_to_watch: [
                { title: "Eternal Sunshine of the Spotless Mind", reason: "Para procesar sus feelings juntos sin admitirlo" },
                { title: "Before Sunrise", reason: "Van a proyectarse durísimo en estos personajes" },
                { title: "The Worst Person in the World", reason: "Es como un espejo de su dinámica y lo van a odiar (cariñosamente)" }
              ],
              final_advice: "No forcen la compatibilidad perfecta. Las mejores relaciones son 70% alineadas, 30% caos."
            }
          })
        }]
      };

      return res.status(200).json(mockData);
    }

    // CASO 1 & 2: Obtener perfil de usuario
    let userProfile;
    if (user.type === 'code') {
      const userData = await kv.get(`profile:${user.value.toUpperCase()}`);
      if (!userData) {
        return res.status(404).json({ error: 'User profile code not found' });
      }
      const parsedUserData = typeof userData === 'string' ? JSON.parse(userData) : userData;
      userProfile = parsedUserData.profile;
    } else if (user.type === 'screenshot') {
      // Analizar screenshot del usuario con Haiku
      console.log('Analyzing user screenshot with Haiku...');
      const userParsed = await analyzeScreenshot(user.value);

      // Generar perfil standard del usuario con Sonnet
      console.log('Generating user profile with Sonnet...');
      userProfile = await generateStandardProfile(userParsed);
    } else {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // CASO 1 & 3: Obtener perfil de crush
    let crushProfile;
    if (crush.type === 'code') {
      const crushData = await kv.get(`profile:${crush.value.toUpperCase()}`);
      if (!crushData) {
        return res.status(404).json({ error: 'Crush profile code not found' });
      }
      const parsedCrushData = typeof crushData === 'string' ? JSON.parse(crushData) : crushData;
      crushProfile = parsedCrushData.profile;
    } else if (crush.type === 'screenshot') {
      // Analizar screenshot del crush con Haiku
      console.log('Analyzing crush screenshot with Haiku...');
      const crushParsed = await analyzeScreenshot(crush.value);

      // Generar perfil standard del crush con Sonnet
      console.log('Generating crush profile with Sonnet...');
      crushProfile = await generateStandardProfile(crushParsed);
    } else {
      return res.status(400).json({ error: 'Invalid crush type' });
    }

    // PASO FINAL: Generar análisis de compatibilidad con ambos perfiles
    console.log('Generating compatibility analysis...');
    const compatibility = await generateCompatibilityAnalysis(userProfile, crushProfile);

    return res.status(200).json(compatibility);

  } catch (error) {
    console.error('Error in compatibility analysis:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Helper: Analizar screenshot con Haiku
async function analyzeScreenshot(base64Data) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
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
              data: base64Data
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
  "ratings": {
    "favorites": ["rating/5", "rating/5", "rating/5", "rating/5"],
    "recent": ["rating/5", "rating/5", "rating/5", "rating/5"]
  },
  "stats": "cualquier otra información relevante del perfil"
}

Si no puedes ver alguna sección, deja el array vacío. SOLO JSON, sin formato markdown.`
          }
        ]
      }]
    })
  });

  if (!response.ok) {
    throw new Error('Failed to analyze screenshot');
  }

  const data = await response.json();
  let parsedText = data.content.find(item => item.type === 'text')?.text || '';
  parsedText = parsedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(parsedText);
}

// Helper: Generar perfil standard con Sonnet (versión simplificada, solo necesitamos la data estructurada)
async function generateStandardProfile(parsedInfo) {
  // Para compatibilidad, solo necesitamos una representación estructurada del perfil
  // Usaremos el mismo prompt que en /api/analyze pero retornaremos el JSON parseado
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: `Basándote en este perfil de Letterboxd, genera un perfil de dating chistoso y específico en formato de SLIDES:

Películas favoritas: ${parsedInfo.favorites.join(', ')}
Ratings favoritas: ${parsedInfo.ratings?.favorites?.join(', ') || 'N/A'}
Películas vistas recientemente: ${parsedInfo.recent.join(', ')}
Ratings recientes: ${parsedInfo.ratings?.recent?.join(', ') || 'N/A'}

IMPORTANTE: Responde SOLO con un objeto JSON con la estructura del perfil standard.
Usa las mismas instrucciones que para el perfil standard pero en versión compacta.
SOLO JSON, sin markdown, sin explicaciones.`
      }]
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate standard profile');
  }

  const data = await response.json();
  let analysisText = data.content.find(item => item.type === 'text')?.text || '';
  analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(analysisText);
}

// Helper: Generar análisis de compatibilidad
async function generateCompatibilityAnalysis(userProfile, crushProfile) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: `Tienes dos perfiles cinematográficos de Letterboxd ya analizados:

PERFIL USUARIO:
${JSON.stringify(userProfile, null, 2)}

PERFIL CRUSH:
${JSON.stringify(crushProfile, null, 2)}

Analiza su compatibilidad ROMÁNTICA y genera un perfil de compatibilidad en 5 slides.

LINEAMIENTOS:
- Tono: Sarcástico, Gen Z, chistoso pero honesto
- Español con spanglish memético mínimo (solo: "tbh", "random", "vibe", "aesthetic")
- USA SUS PELÍCULAS/ARQUETIPOS ESPECÍFICOS como ventanas a la dinámica
- No seas genérico, menciona títulos/directores reales de ambos perfiles
- Sé honesto sobre red flags, pero no cruel

ESTRUCTURA JSON:

{
  "compatibility_percentage": 73,
  "relationship_archetype": {
    "emoji": "🎭",
    "title": "LA COMEDIA ROMÁNTICA QUE SE CONVIRTIÓ EN A24",
    "subtitle": "The Rom-Com That Became Art House",
    "description": "2-3 frases describiendo la DINÁMICA (cómo interactuarían, no solo compatibilidad)"
  },
  "first_date_scenario": {
    "narrative": "Narrativa en 2da persona plural (Ustedes...), 3-4 frases. Muy visual y cinematográfico."
  },
  "dynamics": {
    "green_flags": [
      { "emoji": "🎬", "text": "Descripción breve" },
      { "emoji": "💬", "text": "Descripción breve" }
    ],
    "red_flags": [
      { "emoji": "📊", "text": "Descripción breve" },
      { "emoji": "🤔", "text": "Descripción breve" }
    ]
  },
  "verdict": {
    "category": "Partner Material 💍",
    "reasoning": "2-3 frases explicando por qué",
    "timeline_prediction": "1 frase sobre cuánto duraría esto (puede ser chistosa)"
  },
  "action_plan": {
    "movies_to_watch": [
      { "title": "Título", "reason": "Razón breve" },
      { "title": "Título", "reason": "Razón breve" },
      { "title": "Título", "reason": "Razón breve" }
    ],
    "final_advice": "1 frase de cierre, medio en broma medio en serio"
  }
}

IMPORTANTE:
- compatibility_percentage: número entre 1-99 (impar, evita múltiplos de 5)
- category: "Partner Material 💍" | "Situationship Territory 🎭" | "It's Complicated 🤔" | "Run 🏃"
- USA películas/arquetipos ESPECÍFICOS de ambos perfiles
- Sé perceptivo sobre cómo sus diferencias/similitudes afectarían la dinámica

Devuelve SOLO el JSON, sin markdown ni explicaciones.`
      }]
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate compatibility analysis');
  }

  return await response.json();
}
