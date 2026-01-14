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
  "ratings": {
    "favorites": ["rating/5", "rating/5", "rating/5", "rating/5"],
    "recent": ["rating/5", "rating/5", "rating/5", "rating/5"]
  },
  "stats": "cualquier otra información relevante del perfil"
}

IMPORTANTE sobre ratings:
- Extrae el rating que el usuario dio a cada película (las estrellitas)
- Si no hay rating visible, usa "N/A"
- Formato: "5/5", "4.5/5", "3/5", etc.

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
Ratings favoritas: ${parsedInfo.ratings?.favorites?.join(', ') || 'N/A'}
Películas vistas recientemente: ${parsedInfo.recent.join(', ')}
Ratings recientes: ${parsedInfo.ratings?.recent?.join(', ') || 'N/A'}
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

ANÁLISIS CRUCIAL - FAVORITAS VS RECIENTES (ESPECTRO):
Este es el análisis MÁS IMPORTANTE. La relación entre favoritas y recientes revela mucho sobre la persona.

NO es binario (consonante vs disonante). Es un ESPECTRO:

1. PERFECTAMENTE ALINEADAS (Consistencia extrema):
   - Favoritas y recientes son del mismo tipo
   - Personalidad: Seguros de sí mismos, saben lo que les gusta, potencialmente inflexibles
   - Ejemplo: Favoritas = Tarkovsky, Bergman | Recientes = Tarkovsky, Bergman
   - Rasgo: "No necesita validación externa, confía en su gusto"

2. MAYORMENTE ALINEADAS (Consistencia con exploración):
   - 70-80% similar, con algunas desviaciones
   - Personalidad: Tienen identidad clara pero open-minded
   - Ejemplo: Favoritas = Indies dramáticos | Recientes = Más indies dramáticos + 1 comedia
   - Rasgo: "Sabe quién es pero no se toma demasiado en serio"

3. PARCIALMENTE ALINEADAS (Balance genuino):
   - 50-60% overlap, mix de géneros/estilos
   - Personalidad: Emocionalmente complejo, multifacético
   - Ejemplo: Favoritas = Mix de drama/comedia | Recientes = Mix parecido
   - Rasgo: "Emocionalmente versátil, se adapta a diferentes moods"

4. POCO ALINEADAS (Exploración activa):
   - 30-40% similar, experimentando nuevos géneros
   - Personalidad: En proceso de autodescubrimiento, curioso
   - Ejemplo: Favoritas = Dramas serios | Recientes = Comedias románticas
   - Rasgo: "Está expandiendo horizontes, saliendo de su zona de confort"

5. COMPLETAMENTE DESALINEADAS (Disonancia total):
   - 0-20% overlap, polos opuestos
   - Personalidad: Podría estar en crisis existencial O curando persona falsa
   - Ejemplo: Favoritas = Bergman, Tarkovsky | Recientes = Marvel, Fast & Furious
   - Rasgo: "Las favoritas son aspiracionales, las recientes son honestas" O "Está pasando por algo"

USA ESTE ESPECTRO para inferir:
- Autenticidad vs. performatividad
- Seguridad en identidad vs. búsqueda
- Flexibilidad emocional vs. rigidez
- Coherencia interna vs. contradicción

ANÁLISIS DE RATINGS (CRÍTICO):
Los ratings revelan la psicología del usuario. Analiza PATRONES:

1. INFLADOR (ratings altos consistentes):
   - Todas favoritas con 5/5 o 4.5/5+
   - Personalidad: Optimista, generoso, posiblemente evita crítica
   - O: Es fácil de impresionar, tiene estándares bajos
   - Rasgo: "Ve lo bueno en todo" O "No muy crítico con nada"

2. CRÍTICO SEVERO (ratings bajos/medios):
   - Favoritas con 3/5, 3.5/5
   - Personalidad: Estándares altos, difícil de impresionar, posiblemente pretencioso
   - Rasgo: "Difícil de complacer" O "Estándares inalcanzables"

3. POLARIZADO (solo 5/5 o 1/5, nada en medio):
   - Todo es perfecto o terrible
   - Personalidad: Pensamiento blanco/negro, emocional extremo
   - Rasgo: "No hay grises, todo es intenso"

4. RACIONAL (distribución normal de ratings):
   - Mix de 2/5, 3/5, 4/5, 5/5
   - Personalidad: Equilibrado, criterioso, puede articular matices
   - Rasgo: "Sabe diferenciar calidad de disfrute personal"

5. CONTRADICTOR (ratings inconsistentes con calidad):
   - Película "mala" con 5/5 O película "obra maestra" con 3/5
   - Personalidad: Valora disfrute sobre calidad, o es contrarian
   - Rasgo: "Le importa más cómo lo hace sentir que si es 'objetivamente buena'"

ANALIZA TAMBIÉN:
- Ratings recientes vs favoritas: ¿Es más crítico con películas nuevas?
- Cambio de criterio: ¿Favoritas tienen mejor rating que recientes?
- Generosidad selectiva: ¿A qué tipo de película le da ratings altos?

BIO:
- ENFÓCATE EN PERSONALIDAD, NO EN GUSTOS DE CINE.
- USA EL ESPECTRO FAVORITAS/RECIENTES Y RATINGS como base del análisis.
- Pregúntate: ¿Qué tipo de persona es basándote en:
  * La relación entre sus favoritas y recientes (¿coherente? ¿explorando? ¿contradictorias?)
  * Sus patrones de rating (¿generoso? ¿crítico? ¿polarizado?)
  * Lo que todo esto revela sobre su personalidad
- ¿Qué le gusta hacer fuera del cine? (infiere: ¿es social? ¿introspectivo? ¿aventurero? ¿más de casa?)
- ¿Cómo es en relaciones? ¿En el día a día? ¿Qué valora?
- Puedes mencionar el cine LEVEMENTE como justificación, pero el foco es la persona.
- INCORPORA INSIGHTS del espectro: "Sus favoritas y recientes están alineadas" = seguro de sí mismo
- Ejemplos de lo que NO queremos: "Fanática del cine indie con buen gusto en directores"
- Ejemplos de lo que SÍ queremos: "Probablemente tiene un diario donde escribe pensamientos profundos a las 2am. El tipo de persona que prefiere conversaciones intensas sobre charlas superficiales. Sus favoritas y recientes son coherentes - sabe lo que quiere y no se disculpa por ello."

GREEN FLAGS (Rasgos de personalidad POSITIVOS):
- Identifica RASGOS DE CARÁCTER positivos inferidos del ESPECTRO y RATINGS.
- ¿Es empático? ¿De mente abierta? ¿Emocionalmente inteligente? ¿Aventurero? ¿Leal? ¿Auténtico?
- Usa el espectro favoritas/recientes y ratings como EVIDENCIA del rasgo.
- Ejemplos usando el ESPECTRO:
  * MAL: "Aprecia el cine europeo" (solo gustos)
  * BIEN: "Sus favoritas y recientes muestran exploración genuina - no tiene miedo de probar cosas nuevas"
  * BIEN: "Da ratings variados y honestos - puede diferenciar entre lo que disfruta y lo que es 'objetivamente bueno'"
  * BIEN: "Coherencia entre favoritas y recientes - sabe quién es y no lo performa para nadie"

RED FLAGS (Rasgos de personalidad PROBLEMÁTICOS):
- Identifica PROBLEMAS DE PERSONALIDAD usando el ESPECTRO y RATINGS como evidencia.
- ¿Es emocionalmente cerrado? ¿Pretencioso? ¿Inauténtico? ¿Crítico en exceso?
- Usa la data como evidencia, pero habla del problema real.
- Ejemplos usando RATINGS y ESPECTRO:
  * MAL: "Solo ve películas de Nolan" (solo gustos)
  * BIEN: "Le da 5/5 a todo - probablemente evita conflicto y no puede dar feedback honesto"
  * BIEN: "Sus favoritas son Tarkovsky pero sus recientes son Marvel - el performatividad es real"
  * BIEN: "Solo ratings de 3/5 o menos - probablemente es crítico con todo en la vida, no solo con películas"

FIRST DATE REACTIONS:
- Describe COMPORTAMIENTOS EN LA CITA basados en personalidad inferida del ESPECTRO y RATINGS.
- ¿Cómo actuaría alguien con estos patrones en una primera cita?
- USA LOS INSIGHTS: Si ratings son críticos → comportamiento crítico; Si favoritas/recientes desalineadas → contradicción en comportamiento
- NO digas "Habló de X película" - muestra cómo se comportan.
- Ejemplos con INSIGHTS del espectro/ratings:
  * BIEN: "Criticó sutilmente el menú del restaurante. Esos ratings de 3/5 no mienten."
  * BIEN: "Dijo que odiaba las rom-coms pero se emocionó hablando de su película favorita... que es una rom-com."
  * BIEN: "Le gustó todo - el restaurante, la conversación, hasta el clima. Da vibes de dar 5 estrellas a todo."
- Los @usernames pueden ser creativos: @coffeedate23, @normalviewer, @emotionallydamaged, etc.

COMPATIBILIDAD:
- 70% rasgos de personalidad, 30% gustos de cine.
- USA EL ESPECTRO para determinar compatibilidad:
  * Si es muy rígido (favoritas = recientes) → necesita alguien flexible
  * Si es muy explorador → necesita alguien que lo aterrice
  * Si es crítico (ratings bajos) → necesita alguien que no se ofenda fácil
  * Si es generoso (ratings altos) → necesita alguien genuino que valore eso
- NO digas "alguien que también ame X película"
- Habla de QUÉ TIPO DE PERSONA los complementaría.
- Ejemplos usando ESPECTRO/RATINGS:
  * MAL: "Alguien que también ame el cine indie"
  * BIEN: "Alguien que respete tu criterio exigente pero que te recuerde que está bien disfrutar cosas 'malas'"
  * BIEN: "Necesitas a alguien que valore tu autenticidad - tus recientes y favoritas cuentan la misma historia y eso es raro"

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
