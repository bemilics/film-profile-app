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
            bio: "El tipo de persona que tiene opiniones fuertes sobre cosas random. Probablemente cancela planes para quedarse en casa, pero cuando sale es la persona más interesante de la conversación. Definitivamente tiene un playlist de Spotify para cada momento existencial.",
            greenFlags: [
              "Emocionalmente disponible y no le da miedo sentir cosas intensas",
              "Tiene paciencia para las cosas buenas y aprecia los detalles sutiles de la vida",
              "Mente abierta y dispuesto a probar cosas nuevas sin juzgar inmediatamente"
            ],
            redFlags: [
              "Probablemente romanticiza su propia complejidad emocional un poco demasiado",
              "Tiene tendencia a explicar cosas que nadie preguntó (síndrome de 'actually...')",
              "Evita confrontación directa y prefiere procesar todo internamente primero"
            ],
            firstDateReactions: [
              {
                user: "@datenight_chronicles",
                comment: "Hizo contacto visual intenso toda la noche y preguntó sobre mi relación con mis papás. Profundo pero real.",
                rating: "⭐⭐⭐⭐½"
              },
              {
                user: "@just_vibing",
                comment: "Ordenó por nosotros dos sin preguntar pero acertó perfecto. Confianza nivel 100.",
                rating: "⭐⭐⭐⭐"
              },
              {
                user: "@overthinker_supreme",
                comment: "Se emocionó hablando de su niñez y casi llora. La vulnerabilidad es atractiva tbh.",
                rating: "⭐⭐⭐⭐⭐"
              }
            ],
            compatibility: {
              type: "Alguien que te aterrice cuando estás pensando de más",
              description: "Necesitas a alguien que entienda tu necesidad de introspección pero que también te recuerde que la vida pasa afuera de tu cabeza. Alguien paciente que no te apure pero tampoco te deje atascado pensando demasiado."
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

GUÍA GENERAL:
- Tono: Sarcástico, Gen Z, chistoso pero no cruel. Perceptivo y específico, no genérico.
- USA LAS PELÍCULAS COMO VENTANA A LA PERSONALIDAD, no como el tema principal.
- El cine revela rasgos de personalidad: alguien que ve películas tristes todo el tiempo probablemente es introspectivo, alguien que solo ve blockbusters tal vez evita la profundidad emocional, etc.
- Infiere personalidad, hábitos, valores, comportamientos basándote en sus elecciones cinematográficas.

BIO:
- ENFÓCATE EN PERSONALIDAD, NO EN GUSTOS DE CINE.
- Pregúntate: ¿Qué tipo de persona es basándote en lo que ve?
- ¿Qué le gusta hacer fuera del cine? (infiere: ¿es social? ¿introspectivo? ¿aventurero? ¿más de casa?)
- ¿Cómo es en relaciones? ¿En el día a día? ¿Qué valora?
- Puedes mencionar el cine LEVEMENTE como justificación, pero el foco es la persona.
- Ejemplos de lo que NO queremos: "Fanática del cine indie con buen gusto en directores"
- Ejemplos de lo que SÍ queremos: "Probablemente tiene un diario donde escribe pensamientos profundos a las 2am. El tipo de persona que prefiere conversaciones intensas sobre charlas superficiales. Definitivamente cancela planes para quedarse en pijama viendo películas."

GREEN FLAGS (Rasgos de personalidad POSITIVOS):
- Identifica RASGOS DE CARÁCTER positivos inferidos de sus películas.
- ¿Es empático? ¿De mente abierta? ¿Emocionalmente inteligente? ¿Aventurero? ¿Leal?
- Usa el cine como JUSTIFICACIÓN, pero habla del rasgo de personalidad.
- Ejemplos:
  * MAL: "Aprecia el cine europeo" (muy obvio, solo habla de gustos)
  * BIEN: "Tiene paciencia para el ritmo lento y aprecia las cosas sutiles (probablemente por ver tanto Linklater)"
  * MAL: "Le gustan las películas de A24"
  * BIEN: "No tiene miedo de sentir cosas intensas y procesar emociones (esas películas indies no mienten)"

RED FLAGS (Rasgos de personalidad PROBLEMÁTICOS):
- Identifica PROBLEMAS DE PERSONALIDAD o patrones cuestionables.
- ¿Es emocionalmente cerrado? ¿Pretencioso? ¿Tiene problemas de compromiso? ¿Evita la vulnerabilidad?
- De nuevo, usa el cine como evidencia, pero habla del problema real.
- Ejemplos:
  * MAL: "Solo ve películas de Nolan" (solo habla de gustos)
  * BIEN: "Probablemente explica cosas que no le preguntaron y dice 'actually' demasiado (síndrome Nolan fan)"
  * MAL: "Le gustan las películas tristes"
  * BIEN: "Romanticiza su propia tristeza y probablemente dice 'nadie me entiende' sin ironía"

FIRST DATE REACTIONS:
- Describe COMPORTAMIENTOS EN LA CITA, no las películas que mencionaron.
- ¿Cómo actuaría alguien con estos gustos en una primera cita?
- NO digas "Habló de X película" - muestra cómo se comportan basándote en su personalidad cinematográfica.
- Ejemplos:
  * MAL: "Mencionó que le encanta Wes Anderson"
  * BIEN: "Ordenó su café de forma súper específica y tomó foto antes de tomar. Muy su estilo."
  * MAL: "Dijo que vio todas las de Bergman"
  * BIEN: "Hizo contacto visual intenso y preguntó cosas existenciales. Intimidante pero intrigante."
  * BIEN: "Lloró en medio de la conversación hablando de su niñez. Emocionalmente disponible, sin duda."
- Los @usernames pueden ser creativos: @coffeedate23, @normalviewer, @emotionallydamaged, etc.

COMPATIBILIDAD:
- 70% rasgos de personalidad, 30% gustos de cine.
- NO digas "alguien que también ame X película"
- Habla de QUÉ TIPO DE PERSONA los complementaría basándote en su personalidad inferida.
- Considera: balance emocional, niveles de energía, profundidad vs. ligereza, introversión vs. extroversión.
- Ejemplos:
  * MAL: "Alguien que también ame el cine indie"
  * BIEN: "Alguien que entienda tu necesidad de procesar emociones en silencio, pero que también te saque a hacer cosas cuando estás pensando de más"

RECUERDA: El cine es la excusa. La personalidad es el punto. Solo JSON, sin formato markdown.`
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
