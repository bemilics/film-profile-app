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

**Orden de secciones (top → bottom):**
1. Header (CINEMATCH)
2. Bio
3. Flags (Green + Red en grid 2 columnas)
4. First Date Reactions
5. Swipe Compatibility
6. Footer

**Cambios importantes:**
- Eliminado "YOU ARE: [Personaje]" por ser muy predecible
- Reemplazado con **"FIRST DATE REACTIONS"**: 3 reviews ficticias de dates previas con el usuario
  - Formato: @username, comentario, rating con estrellas
  - Enfoque en comportamientos, no en menciones directas de películas

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

**Contenido de cada sección:**

- **Bio**: Personalidad inferida (no gustos de cine), usando espectro y ratings
- **Green Flags**: Rasgos positivos con evidencia del espectro/ratings
- **Red Flags**: Problemas de personalidad inferidos de patrones
- **First Date Reactions**: Comportamientos en cita basados en personalidad inferida
- **Compatibility**: 70% personalidad, 30% cine. Enfoque en complementación

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

1. Usuario sube screenshot de Letterboxd
2. Frontend envía imagen (base64) a `/api/analyze`
3. Backend (serverless function):
   - Paso 1: Haiku extrae películas favoritas, recientes, y ratings
   - Paso 2: Sonnet analiza data y genera perfil de personalidad
4. Frontend recibe JSON con perfil completo
5. Renderiza card visual (540x960px, 9:16)
6. Usuario puede descargar como imagen para stories

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
