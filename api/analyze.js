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
            archetype: {
              emoji: "🌪️",
              title: "LA PARADOJA KAUFMAN-GERWIG",
              subtitle: "The Kaufman-Gerwig Paradox",
              description: "Tienes a Charlie Kaufman y Greta Gerwig en tus favoritas. Esa dualidad entre cerebral-depresivo y wholesome-optimista define tu personalidad. Tus recientes están 70% alineadas con tus favoritas - sabes quién eres pero te das espacio para explorar. Eres profundo sin ser pretencioso, emocional sin hacerlo drama.",
              rarity: "13% de usuarios"
            },
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
            loveLanguages: {
              dating: "Te gusta crear momentos. Vas a planear la movie night perfecta con snacks específicos y ambiente. Tu forma de coquetear es recomendarles películas como si fueran cartas de amor.",
              general: "Expresas afecto a través de experiencias compartidas. No dices 'te quiero' seguido, pero te aprendes los comfort movies de la gente que te importa. Ese es tu love language."
            },
            bestMatches: [
              {
                emoji: "☕",
                type: "El Indie Softboy",
                percentage: "87%",
                dating: "Van a llorar juntos viendo A24 y después ir por café de especialidad.",
                general: "Ambos son intensos con sus feelings pero lo disfrazan de ironía. Se entienden."
              },
              {
                emoji: "🎨",
                type: "La Maximalist Chaotic",
                percentage: "73%",
                dating: "Va a llevarte a ver 3 películas random en un día. Exhausting pero nunca aburrido.",
                general: "Te complementa. Tú analizas, ella siente. Balance perfecto entre cerebro y caos."
              }
            ],
            worstMatches: [
              {
                emoji: "📺",
                type: "El Comfort Re-Watcher",
                percentage: "11%",
                dating: "Quiere maratonear Friends por 6ta vez. Tú necesitas novelty. No va a funcionar.",
                general: "Uno busca escape familiar, otro busca confrontación existencial. Incompatibles."
              },
              {
                emoji: "🎬",
                type: "El Snob Involuntario",
                percentage: "7%",
                dating: "Te va a juzgar por no haber visto la filmografía completa de Tarkovsky. Tóxico.",
                general: "Van a competir por quién es más culto. Es agotador, no romántico."
              }
            ],
            verdict: [
              "Eres emocionalmente complejo de formas que la mayoría no nota a primera vista. Te enamoras de cómo alguien interpreta una escena, no de su Instagram, y buscas conexión intelectual antes que química superficial. Tienes opiniones fuertes pero escuchas, intensidad emocional pero con autocontrol.",
              "Tu match ideal no es alguien idéntico a ti, es alguien tan apasionado pero en dirección distinta. Que te rete sin invalidarte, que pueda ver películas en silencio contigo y después hablar hasta las 3am. Das lealtad genuina y conversaciones que van de lo superficial a lo existencial en 3 minutos."
            ]
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
        max_tokens: 2500,
        messages: [{
          role: 'user',
          content: `Basándote en este perfil de Letterboxd, genera un perfil de dating chistoso y específico en formato de SLIDES:

Películas favoritas: ${parsedInfo.favorites.join(', ')}
Ratings favoritas: ${parsedInfo.ratings?.favorites?.join(', ') || 'N/A'}
Películas vistas recientemente: ${parsedInfo.recent.join(', ')}
Ratings recientes: ${parsedInfo.ratings?.recent?.join(', ') || 'N/A'}
Stats adicionales: ${parsedInfo.stats || 'N/A'}

IMPORTANTE: Responde SOLO con un objeto JSON, sin markdown, sin explicaciones, sin backticks. El JSON debe tener esta estructura exacta:

{
  "archetype": {
    "emoji": "🎭",
    "title": "EL CAOS ROMÁNTICO",
    "subtitle": "The Romantic Chaos",
    "description": "Descripción de 2-3 frases que mezcle su personalidad cinematográfica con quién es como persona. Usa el espectro favoritas/recientes y ratings como base. Primera frase: su relación con el cine. Segunda frase: cómo es como persona en general.",
    "rarity": "12% de usuarios"
  },
  "firstDateReactions": [
    {
      "user": "@usuario1",
      "comment": "Comentario sobre COMPORTAMIENTO en la cita, no sobre películas (80-110 caracteres)",
      "rating": "⭐⭐⭐⭐"
    },
    {
      "user": "@usuario2",
      "comment": "Comentario sobre COMPORTAMIENTO en la cita, no sobre películas (80-110 caracteres)",
      "rating": "⭐⭐⭐⭐⭐"
    },
    {
      "user": "@usuario3",
      "comment": "Comentario sobre COMPORTAMIENTO en la cita, no sobre películas (80-110 caracteres)",
      "rating": "⭐⭐⭐⭐½"
    }
  ],
  "loveLanguages": {
    "dating": "Texto de 2-3 frases sobre cómo se comporta en CITAS específicamente. Qué hace, cómo coquetea, qué tipo de dates planea.",
    "general": "Texto de 2-3 frases sobre cómo expresa afecto EN GENERAL (amigos, familia, relaciones). Qué valora, cómo cuida a la gente."
  },
  "bestMatches": [
    {
      "emoji": "🎭",
      "type": "El Indie Softboy",
      "percentage": "89%",
      "dating": "Comportamiento/dinámica en contexto romántico (70-90 caracteres)",
      "general": "Compatibilidad de personalidad general (70-90 caracteres)"
    },
    {
      "emoji": "🔥",
      "type": "El Mainstream Apologist",
      "percentage": "76%",
      "dating": "Comportamiento/dinámica en contexto romántico (70-90 caracteres)",
      "general": "Compatibilidad de personalidad general (70-90 caracteres)"
    }
  ],
  "worstMatches": [
    {
      "emoji": "🎪",
      "type": "El Comfort Watcher",
      "percentage": "9%",
      "dating": "Por qué no funciona en contexto romántico (70-90 caracteres)",
      "general": "Incompatibilidad de personalidad (70-90 caracteres)"
    },
    {
      "emoji": "📚",
      "type": "El Film Bro Clásico",
      "percentage": "12%",
      "dating": "Por qué no funciona en contexto romántico (70-90 caracteres)",
      "general": "Incompatibilidad de personalidad (70-90 caracteres)"
    }
  ],
  "verdict": [
    "Párrafo 1: Mezcla frases sobre RELACIONES y PERSONALIDAD de manera fluida. Habla de cómo se enamora, qué busca en pareja, mezclado con rasgos generales de carácter. Usa el análisis de favoritas/recientes y ratings. (200-250 caracteres)",
    "Párrafo 2: Continúa mezclando facetas relacionales y personales. Qué tipo de pareja necesita, cómo es como persona, qué ofrece en una relación. Narrativa cohesiva, no lista de puntos. (200-250 caracteres)"
  ]
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

ARCHETYPE (Slide 1) - CRÍTICO: Debe ser ULTRA ESPECÍFICO y ÚNICO:

EVITA CLICHÉS. NO uses arquetipos genéricos como:
- ❌ "El Cinéfilo Apasionado"
- ❌ "El Amante del Cine Indie"
- ❌ "El Crítico Exigente"
- ❌ "El Romántico Empedernido"

EN CAMBIO, crea arquetipos HÍPER ESPECÍFICOS basados en:
1. Las películas EXACTAS que vieron (usa títulos y directores)
2. La contradicción o coherencia entre favoritas/recientes
3. Patterns de rating únicos
4. Combinaciones inesperadas de géneros

EJEMPLOS DE ARQUETIPOS BUENOS (específicos, memorables):
- ✅ "LA CONTRADICCIÓN BERGMAN-BARBIE" (si tiene cine arte + mainstream)
- ✅ "EL OPTIMISTA EXISTENCIAL" (si tiene Tarkovsky con ratings altos)
- ✅ "LA PARADOJA DEL CRÍTICO GENEROSO" (ratings altos en todo pero películas difíciles)
- ✅ "EL ROMÁNTICO POST-APOCALÍPTICO" (si mezcla romance con distopias)
- ✅ "LA DUALIDAD MIYAZAKI-LYNCH" (wholesome + perturbador)

FÓRMULA PARA EL TITLE:
- Usa COMBINACIONES inesperadas que reflejen su dualidad real
- Menciona directores/películas específicas si es apropiado
- Captura la CONTRADICCIÓN o ESENCIA única de su perfil
- Debe sonar como algo que NADIE MÁS tendría

DESCRIPTION (2-3 frases):
- Primera frase: Menciona películas/directores ESPECÍFICOS de su lista
  * Ejemplo: "Tienes a Wes Anderson y Lars von Trier en tus favoritas. Esa dualidad between whimsy y trauma es tu brand."
- Segunda frase: Qué dice esto de su personalidad usando análisis del espectro
  * Ejemplo: "Tus recientes y favoritas están 80% alineadas - sabes quién eres pero no eres rígido."
- Tercera frase: Cómo son como PERSONA en general
  * Ejemplo: "Eres profundo sin ser pretencioso, emocional sin ser dramático."

RARITY: 7%-23% (números impares son más creíbles: 9%, 13%, 17%, 21%)

LOVE LANGUAGES (Slide 3):
- DATING: 2-3 frases sobre comportamiento específico en CITAS
  * Qué tipo de dates planea
  * Cómo coquetea
  * Red flags o green flags en modo romántico
  * Ejemplo: "Te gusta crear momentos. Vas a planear la movie night perfecta con snacks específicos. Tu forma de coquetear es 'esta peli me recordó a ti'."
- GENERAL: 2-3 frases sobre cómo expresa afecto en TODO tipo de relaciones
  * Con amigos, familia, pareja estable
  * Qué valora, cómo cuida
  * Ejemplo: "No dices 'te quiero' seguido, pero te aprendes los comfort movies de la gente que te importa. Ese es tu love language real."

BEST/WORST MATCHES (Slide 4) - DEBEN SER ESPECÍFICOS Y VISUALES:

CRÍTICO: Los arquetipos de match NO deben ser genéricos.

EVITA:
- ❌ "El Cinéfilo Intelectual"
- ❌ "El Fan del Mainstream"
- ❌ "El Amante del Cine Clásico"

USA ARQUETIPOS RECONOCIBLES Y VISUALES que la gente puede imaginar:
- ✅ "El Indie Softboy" (aesthetic, llora con A24, café de especialidad)
- ✅ "La Film Bro Reformada" (antes era insoportable, ahora solo pretenciosa)
- ✅ "El Comfort Re-Watcher" (ve The Office 8 veces al año)
- ✅ "El Maximalist Chaotic" (ve 5 géneros diferentes en un día)
- ✅ "La Criterion Completionist" (tiene Excel de películas pendientes)
- ✅ "El Marvel Apologist" (sabe que es meh pero igual disfruta)
- ✅ "El Nostálgico de los 90s" (top 4 son todas de 1995-2002)
- ✅ "La Sad Girl Autumn" (solo ve películas depre de octubre a febrero)
- ✅ "El Optimista Incorregible" (todo es 5/5, hasta las malas)
- ✅ "El Snob Involuntario" (no es pretencioso a propósito pero lo es)

CADA MATCH necesita:
- EMOJI: Específico al arquetipo (no 🎭 para todo)
- TYPE: Nombre memorable y visual (piensa en personas reales que conoces)
- PERCENTAGE: Varía los números (89%, 76%, 12%, 7% - no siempre 90% o 10%)
- DATING: Comportamiento ESPECÍFICO en contexto romántico (70-90 caracteres)
  * Ejemplo: "Van a competir por quién vio más películas obscuras. Es tóxico pero divertido."
- GENERAL: Compatibilidad de personalidad REAL (70-90 caracteres)
  * Ejemplo: "Ambos son intensos con sus hobbies. Se entienden sin explicarse."

USA EL ANÁLISIS DEL USUARIO:
- Si tiene ratings críticos → best match: "El Optimista Incorregible" (balance)
- Si favoritas = recientes → best match: "El Explorador Curioso" (complemento)
- Si tiene películas pretenciosas → worst match: "El Snob Involuntario" (competencia tóxica)
- Si tiene comfort movies → worst match: "El Comfort Re-Watcher" (demasiado similar, aburrido)

Haz que los matches se sientan como PERSONAS REALES con quirks específicos.

VERDICT (Slide 5):
- Array de exactamente 2 PÁRRAFOS
- Cada párrafo: 200-250 caracteres
- CRUCIAL: Los párrafos NO están divididos por "EN RELACIONES" y "COMO PERSONA"
- En cambio, cada párrafo MEZCLA ambas facetas de manera fluida, como PROSA narrativa
- Párrafo 1: Empieza con personalidad general, luego relaciones, luego vuelve a personalidad
  * Ejemplo: "Eres emocionalmente complejo de formas que la mayoría no nota. Te enamoras de cómo alguien interpreta una escena, no de su Instagram. Tienes opiniones fuertes pero escuchas."
- Párrafo 2: Continúa la narrativa, mezclando qué tipo de pareja necesitas con qué ofreces como persona
  * Ejemplo: "Necesitas alguien que te rete sin invalidarte, que vea películas en silencio contigo y después hablen hasta las 3am. Das lealtad genuina y conversaciones que van de lo superficial a lo existencial en 3 minutos."
- El resultado debe leerse como un RETRATO COMPLETO, no como dos bloques separados

FIRST DATE REACTIONS (Slide 2):
- Describe COMPORTAMIENTOS EN LA CITA basados en personalidad inferida del ESPECTRO y RATINGS.
- ¿Cómo actuaría alguien con estos patrones en una primera cita?
- USA LOS INSIGHTS: Si ratings son críticos → comportamiento crítico; Si favoritas/recientes desalineadas → contradicción en comportamiento
- NO digas "Habló de X película" - muestra cómo se comportan.
- Ejemplos con INSIGHTS del espectro/ratings:
  * BIEN: "Criticó sutilmente el menú del restaurante. Esos ratings de 3/5 no mienten."
  * BIEN: "Dijo que odiaba las rom-coms pero se emocionó hablando de su película favorita... que es una rom-com."
  * BIEN: "Le gustó todo - el restaurante, la conversación, hasta el clima. Da vibes de dar 5 estrellas a todo."
- Los @usernames pueden ser creativos y específicos: @coffeedate23, @normalviewer, @emotionallydamaged, @film_bro_survivor, @just_vibing, etc.

RECUERDA GENERAL:
- El cine es la VENTANA a la personalidad, no el tema principal
- Usa el ESPECTRO FAVORITAS/RECIENTES como herramienta principal de análisis
- Usa RATINGS para entender su psicología (crítico, generoso, polarizado, racional)
- 70% personalidad, 30% gustos de cine en TODO
- Tono: Sarcástico, Gen Z, chistoso pero no cruel, perceptivo
- SOLO JSON limpio, sin markdown, sin backticks, sin explicaciones

Genera el JSON ahora:`
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
