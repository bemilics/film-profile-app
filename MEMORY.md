# Film Profile App - Bitácora del Proyecto

## Descripción del Proyecto
Aplicación web que toma un screenshot del perfil de Letterboxd y genera un dating profile compartible.

## Configuración Inicial
- **Fecha de inicio**: 2026-01-13
- **Ubicación**: `/home/branko/Proyectos/GitHub/film-profile-app`
- **Control de versiones**: Manejado por el desarrollador usando GitKraken
  - Claude Code NO debe manejar branches, commits, pushes, pulls, etc. a menos que se solicite explícitamente

## Bitácora de Desarrollo

### 2026-01-13 - Setup Inicial y Desarrollo Completo

#### Setup del Proyecto
- Creación del documento de memoria
- Configuración del ejecutable de lanzamiento en el escritorio (`film-profile-app.sh`)
- Importación de código base desde Claude Artifacts

#### Configuración de Vercel y Backend
- Creado `vercel.json` para deployment en Vercel
- Implementado backend serverless en `/api/analyze.js`:
  - **Paso 1**: Haiku parsea la imagen y extrae películas + ratings
  - **Paso 2**: Sonnet genera el perfil basado en la data estructurada
- Configuración de variables de entorno: `ANTHROPIC_API_KEY`
- Protección de API key mediante funciones serverless

#### Modo Debug
- Implementado modo debug con mock data
- Solo disponible en entornos de desarrollo/preview (localhost, 127.0.0.1, deployments con `-git-`)
- Nunca visible en production
- Permite testing visual sin gastar créditos de API

#### Estructura del Perfil Generado

**NOTA:** Desde 2026-01-19, la app usa sistema de slides. Ver sección "2026-01-19 - Rediseño Mayor" para detalles completos.

**Estructura original (2026-01-13):**
- Card única con todas las secciones
- Bio, Green/Red Flags, First Date Reactions, Compatibility

**Estructura actual (2026-01-19):**
- 5 slides navegables con swipe
- Arquetipo + Bio → First Date Reactions → Love Languages → Best/Worst Matches → Veredicto Final

#### Filosofía de Análisis

**Principio fundamental:** "USA LAS PELÍCULAS COMO VENTANA A LA PERSONALIDAD, no como el tema principal"

**Análisis de Espectro Favoritas/Recientes:**
- No es binario (consonante vs disonante)
- Es un espectro de 5 niveles:
  1. Perfectamente alineadas → Consistencia extrema, seguros de sí mismos
  2. Mayormente alineadas → Identidad clara pero open-minded
  3. Parcialmente alineadas → Emocionalmente complejo, multifacético
  4. Poco alineadas → Explorando, saliendo de zona de confort
  5. Completamente desalineadas → Crisis existencial O performatividad

**Análisis de Ratings:**
- Inflador (todo 5/5) → Optimista o poco crítico
- Crítico severo (todo 3/5 o menos) → Estándares altos
- Polarizado (solo 5/5 o 1/5) → Pensamiento blanco/negro
- Racional (mix de ratings) → Equilibrado, criterioso
- Contradictor (ratings inconsistentes) → Valora disfrute sobre "calidad"

**Contenido de cada sección (actualizado 2026-01-19):**

- **Arquetipo**: Título único basado en películas específicas del usuario + descripción de personalidad
- **First Date Reactions**: Comportamientos en cita basados en personalidad inferida
- **Love Languages**: Cómo expresa afecto en citas (romántico) y en general (amistades/familia)
- **Best/Worst Matches**: Arquetipos con los que matchea/no matchea, con facetas de dating + personalidad
- **Veredicto Final**: Prosa fluida mezclando facetas relacionales y personales (2 párrafos)

#### Paleta de Colores

**Estilo:** Letterboxd oscuro + highlights de dating app

**Colores base:**
- Fondo principal: `#0f1419` (negro azulado)
- Cards: `#14181c` (gris muy oscuro)
- Elementos internos: `#2c3440` (gris medio oscuro)
- Bordes: `#445566` (gris medio)

**Highlights:**
- Fucsia principal: `#ff006e` (título, botones, compatibility)
- Amarillo: `#ffd93d` (títulos de secciones, usernames)
- Verde neón: `#00d9a3` (green flags)
- Rojo coral: `#ff4757` (red flags)

**Diseño:**
- Sin gradientes (solo colores sólidos)
- Fondo oscuro estilo Letterboxd
- Highlights vibrantes de dating app
- Mobile-responsive first (9:16 aspect ratio)

#### Decisiones de Tono

**Lenguaje:**
- Español con spanglish memético mínimo (solo lo necesario: "tbh", "random", "playlist")
- Evitar anglicismos innecesarios
- Tono: Sarcástico, Gen Z, chistoso pero no cruel, perceptivo

---

### 2026-01-19 - Rediseño Mayor: Sistema de Slides y Persistencia

#### Sistema de Slides Completo

**Implementación:**
- Migración de card única a sistema de 5 slides navegables
- Navegación por swipe gestures (mobile) y auto-slide
- Progress indicators en la parte superior
- Animaciones suaves entre transiciones (slideIn: 0.4s ease-out)

**Secciones Rediseñadas (5 slides):**

1. **Slide 1 - Arquetipo + Bio Fusionada**
   - Emoji representativo del arquetipo
   - Título único y específico (ej: "LA PARADOJA KAUFMAN-GERWIG")
   - Subtitle en inglés (aesthetic)
   - Descripción de 2-3 frases (personalidad cinematográfica + general)
   - Porcentaje de rareza (7-23%, números impares)

2. **Slide 2 - First Date Reactions**
   - 3 reviews ficticias de dates
   - Mantiene formato: @username, comment, rating
   - Enfoque en comportamientos observables

3. **Slide 3 - Love Languages (Dual Facet)**
   - **EN CITAS**: Comportamiento romántico específico
   - **EN GENERAL**: Expresión de afecto con amigos/familia
   - 2-3 frases por faceta

4. **Slide 4 - Best/Worst Matches**
   - 2 Best Matches con % de compatibilidad
   - 2 Worst Matches con % de incompatibilidad
   - Cada match incluye:
     * Emoji único
     * Nombre del arquetipo (visual y reconocible)
     * Línea de dinámica romántica
     * Línea de compatibilidad de personalidad general

5. **Slide 5 - Veredicto Final**
   - 2 párrafos de prosa fluida (200-250 caracteres cada uno)
   - Mezcla facetas relacionales y personales
   - Sin división explícita de bloques

**Tiempos de Auto-Slide:**
- Slide 1: 15 segundos
- Slide 2: 20 segundos
- Slide 3: 18 segundos
- Slide 4: 25 segundos
- Slide 5: 25 segundos

#### Sistema de Navegación

**Coach Marks Rediseñadas:**
- Eliminado modal intrusivo de onboarding
- Implementado "nudge" visual: slide se mueve sutilmente hacia la izquierda
- Animación de 3 repeticiones (1.5s cada una, 10px de movimiento)
- Aparece 5 segundos antes del auto-slide (mínimo después de 3s de lectura)
- **NO aparece en la última slide** (no hay siguiente)

**Controles:**
- Navegación principal por swipe en mobile
- Flechas de navegación eliminadas (solo swipe + auto-slide)
- Auto-slide se desactiva cuando:
  * Usuario hace swipe manual
  * Usuario retrocede a slide anterior
  * Se completa el ciclo (llega al final)

**Auto-Scroll:**
- Al generar resultados, scroll automático suave a centro de pantalla
- Soluciona problema de resultados fuera de vista después de subir imagen
- Solo ocurre una vez al mostrar resultados

**Indicadores Flotantes (Position Fixed):**

*Problema identificado:*
- Los indicadores de slides se perdían al hacer scroll
- Usuario necesitaba verlos constantemente para saber en qué slide estaba

*Primer intento (fallido):*
- Usar `position: sticky` dentro del contenedor de resultados
- No funcionó: el indicador seguía perdiéndose al scrollear

*Solución final implementada:*
- Indicadores movidos fuera del contenedor de resultados
- `position: fixed` con `top: 0` (siempre visible en toda la página)
- Centrados con `left: 50%; transform: translateX(-50%)`
- `max-width: 540px` para alinearse con el ancho de la card
- `z-index: 100` para estar siempre sobre todo el contenido
- Eliminadas las barras de progreso tipo Instagram Stories (estaban bugueadas)
- Solo quedan dots (w-3 h-3) y contador de slides (ej: "1/5", "2/5")

*Detalles técnicos:*
- Background: `linear-gradient` de negro semi-transparente que se desvanece
- `backdrop-filter: blur(8px)` para efecto glassmorphism
- `pointer-events: none` en el contenedor, `pointer-events: auto` en los hijos (permite clicks)
- Slide content tiene `pt-16` para evitar que el texto quede oculto bajo los indicadores
- Indicadores son clickeables para saltar a cualquier slide

*UX resultante:*
- Indicadores siempre visibles sin importar scroll
- Usuario siempre sabe en qué slide está y cuántas quedan
- Navegación más intuitiva al poder clickear cualquier dot

#### Persistencia con LocalStorage

**Funcionalidad:**
- Guardado automático al generar resultados
- Incluye: resultado JSON + imagen original + timestamp
- Carga automática al abrir la app
- Expiración: 7 días (datos más viejos se borran automáticamente)
- Storage key: `cinematch_results`

**UX:**
- Banner amarillo indica cuando resultados fueron restaurados
- "✨ Tus resultados fueron restaurados"
- Limpieza al hacer "Hacer Otro"
- Permite a usuarios volver días después y ver sus resultados

#### Mejoras en Prompts y Generación

**Arquetipos Ultra Específicos:**
- Instrucciones para evitar clichés genéricos
- Uso de películas/directores EXACTOS del perfil del usuario
- Fórmula: capturar contradicciones o esencias únicas
- Ejemplos: "LA PARADOJA KAUFMAN-GERWIG", "EL OPTIMISTA EXISTENCIAL"
- Description debe mencionar títulos/directores reales de la lista

**Matches Visuales y Reconocibles:**
- Arquetipos específicos y memorables:
  * "El Indie Softboy", "La Maximalista Caótica"
  * "El Eterno Re-Visionador", "La Sad Girl de Otoño"
  * "El Snob Involuntario", "El Defensor del Mainstream"
- Cada match con emoji único y porcentajes variados
- Descripciones específicas de comportamiento y compatibilidad

**Reducción de Spanglish:**
- Guía explícita de anglicismos permitidos: "tbh", "random", "vibe", "aesthetic"
- Lista de conversiones (ej: "wholesome" → "genuino", "feelings" → "sentimientos")
- Regla: si existe palabra natural en español, úsala
- Mock data actualizado con español más natural

**Aumento de Tokens:**
- max_tokens: 1500 → 2500 (para respuestas más detalladas y específicas)

#### Decisiones de Diseño - Slides

**¿Por qué sistema de slides vs card única?**
- Más contenido sin abrumar visualmente
- Formato nativo de Instagram Stories (usuarios ya entrenados)
- Permite narrativa progresiva (hook → desarrollo → cierre)
- Cada slide es compartible individualmente

**¿Por qué nudge vs flechas/indicadores?**
- Menos intrusivo que overlays o modales
- Enseña por interacción, no por instrucciones
- Más elegante y menos "tutorial-y"
- No interrumpe lectura del contenido

**¿Por qué persistencia de 7 días?**
- Balance entre retención y frescura
- Suficiente para que usuarios vuelvan y compartan
- Evita acumulación de datos obsoletos
- Incentiva volver a usar la app

---

## Stack Tecnológico

### Frontend
- HTML + Vanilla JavaScript
- Tailwind CSS (vía CDN)
- html2canvas para generación de imagen

### Backend
- Vercel Serverless Functions (Node.js)
- Anthropic Claude API:
  - Haiku 3.5 para parseo de imagen
  - Sonnet 4 para generación de perfil

### Infraestructura
- Hosting: Vercel
- Variables de entorno: Vercel Environment Variables

---

## Arquitectura

### Flujo de la App

1. Usuario sube screenshot de Letterboxd (o carga resultados guardados de localStorage)
2. Frontend envía imagen (base64) a `/api/analyze`
3. Backend (serverless function):
   - Paso 1: Haiku extrae películas favoritas, recientes, y ratings
   - Paso 2: Sonnet analiza data y genera perfil de personalidad
4. Frontend recibe JSON con perfil completo
5. Guarda automáticamente en localStorage (expiración: 7 días)
6. Renderiza 5 slides navegables (540x960px, 9:16 cada una)
7. Auto-scroll centra resultados en pantalla
8. Usuario navega con swipe o espera auto-slide
9. Usuario puede descargar cualquier slide como imagen para stories

### Estructura de Archivos

```
/
├── index.html              # Frontend completo
├── vercel.json            # Config de Vercel
├── api/
│   └── analyze.js         # Función serverless (Haiku + Sonnet)
├── MEMORY.md              # Este archivo
├── README.md              # Descripción del proyecto
└── .env.example           # Template de variables de entorno
```

---

## Decisiones de Diseño

### ¿Por qué Haiku + Sonnet?
- **Haiku**: Rápido y barato para extracción de data estructurada
- **Sonnet**: Creativo y perceptivo para análisis de personalidad
- Optimiza costo y calidad

### ¿Por qué sin gradientes?
- Estética más limpia y profesional
- Inspirado en Letterboxd (referencia visual del usuario target)
- Mejor legibilidad en mobile

### ¿Por qué análisis de espectro?
- Evita análisis binarios y simplistas
- Permite insights más matizados y precisos
- Hace resultados menos predecibles y más interesantes

### ¿Por qué "First Date Reactions" vs "Personaje"?
- Personajes eran muy obvios y predecibles
- Reactions son más dinámicas y divertidas
- Permite mostrar comportamientos vs identidades estáticas
- Más dating-coded (objetivo de la app)

---

## Próximos Pasos Potenciales

- [ ] A/B testing de diferentes prompts
- [ ] Analytics de uso
- [ ] Opciones de customización visual
- [ ] Integración directa con Letterboxd API (si disponible)
- [ ] Más formatos de export (Twitter, TikTok, etc.)
- [ ] Versión en inglés

---

## Notas Importantes

- **NO tocar git** a menos que se solicite explícitamente
- **Modo debug** solo debe estar en dev/preview, nunca en production
- **Actualizar este documento** solo cuando el usuario lo solicite explícitamente
- La app es **mobile-first**: todo debe verse bien en 9:16
