# ross_portfolio · v3

Portafolio y CV de **Rossmel Abasto**.

- Portafolio → `portfolio.rossmel.com` (animado, ES/EN)
- CV → `cv.rossmel.com` (compatible con ATS, HTML + PDF, ES/EN)

> La v1 (Angular 13, 2022) está en la rama `master`. Esta v3 se construyó desde cero.

---

## Índice

1. [Arranque rápido](#arranque-rápido)
2. [Stack y por qué](#stack-y-por-qué)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Cómo editar el contenido](#cómo-editar-el-contenido)
5. [Animaciones: cómo funcionan](#animaciones-cómo-funcionan)
6. [El CV (ATS)](#el-cv-ats)
7. [Idiomas (ES/EN)](#idiomas-esen)
8. [Despliegue en rossmel.com](#despliegue-en-rossmeltop)
9. [Estado actual y pendientes](#estado-actual-y-pendientes)
10. [Continuar con Claude Code local](#continuar-con-claude-code-local)
11. [Historial de decisiones](#historial-de-decisiones)

---

## Arranque rápido

Requisitos: **Node.js ≥ 22.12** y Chromium (solo para generar el PDF del CV).

```bash
npm install
npm run dev          # http://localhost:4321  (recarga en vivo)
npm run build        # genera el sitio estático en dist/
npm run cv:pdf       # genera los PDF del CV (requiere build previo)
npm run check        # verificación de tipos de Astro/TS
npm run verify       # tras el build: desborde móvil, marcas sin procesar, errores JS, CV ≤ 2 págs (-- --shots = capturas)
npm run og           # (tras build) public/og.png + una imagen por proyecto/artículo en public/og/ (-- --all rehace todas)
npm run icons        # regenera los íconos PNG desde public/favicon.svg
```

Flujo típico para publicar: `npm run build && npm run cv:pdf` → subir `dist/`.

En Arch: `sudo pacman -S nodejs npm chromium`. Si Chromium está en otra ruta:
`CHROMIUM_PATH=/ruta/a/chrome npm run cv:pdf`.

---

## Stack y por qué

| Pieza | Elección | Motivo |
|---|---|---|
| Framework | **Astro 7** | Genera HTML estático: carga rapidísima, buen SEO, cero JS salvo donde hace falta |
| Estilos | **Tailwind CSS v4** (vía `@tailwindcss/vite`) | Tokens en CSS (`src/styles/global.css`), sin archivo de config |
| Animación | **GSAP 3** (ScrollTrigger + SplitText) | El estándar para animaciones al scroll; ahora es 100% gratis, plugins incluidos |
| Smooth scroll | **Lenis** | Scroll suave sincronizado con ScrollTrigger |
| Hero | **Shader WebGL propio** (`src/scripts/shader.ts`) | Efecto "tinta líquida" que sigue el mouse sin cargar three.js |
| Fuentes | Space Grotesk (display), Inter (texto), JetBrains Mono (detalles) | Autoalojadas con `@fontsource` (sin Google Fonts en runtime) |
| Transiciones | View Transitions API (CSS `@view-transition`) | Transición entre páginas sin JS extra |
| PDF del CV | **playwright-core** + Chromium | Imprime la página `/cv` → PDF con texto real (lo leen los ATS) |

No hay React/Vue: todo es Astro + TypeScript. Si algún día se necesita una isla interactiva compleja,
se puede añadir `@astrojs/react`.

---

## Estructura del proyecto

```
src/
  data/
    profile.ts        ← TODO EL CONTENIDO (experiencia, proyectos, skills, historia…) en ES/EN
    i18n.ts           ← textos de la interfaz, rutas por idioma, formato de fechas
    blog.ts           ← helpers del blog (posts por idioma, traducciones, relacionados, búsqueda)
    sketches.ts       ← dibujos a mano (rough.js en el build) + marcas ==…== / ((…))
  lib/remark-marks.ts ← plugin de Markdown para las marcas en el blog
  content/blog/       ← artículos (ES) · content/blog/en/ ← versiones EN
  styles/global.css   ← tokens de diseño (colores, fuentes), grano, cursor, marquee, .prose
  layouts/Base.astro  ← <head>, SEO, JSON-LD, tema, carga de animaciones, botón volver arriba
  components/
    Home.astro        ← compone la home (/ y /en/)
    Nav, Preloader, Hero, About, Experience, Projects, LiveSites, Stack, Workflow, BlogTeaser, Contact
    ProjectPage.astro ← caso de estudio · AboutPage.astro ← /sobre-mi/ · BlogIndex/BlogPost ← blog
    Resume.astro      ← el CV (ATS)
    Sketch, SketchFlight, Marked, ToTop, PhotoLayers, ContactForm, Comments, ShareLinks, Logo
  scripts/
    animations.ts     ← GSAP + Lenis; se activa con atributos data-*
    shader.ts         ← fondo WebGL del hero
  pages/              ← rutas ES (/, /proyectos, /sobre-mi, /blog, /cv) y EN (/en/…)
functions/            ← Cloudflare Pages Functions (middleware de cv., /api/contact)
public/cv/            ← PDFs del CV (versionados; los genera npm run cv:pdf)
scripts/              ← build-cv-pdf, verify, build-og, build-icons, build-photo-layers.py, serve-dist
docs/
  CONTINUAR.md        ← guía de traspaso para seguir con Claude local (empezar por aquí)
  PROYECTOS-CANDIDATOS.md, LINKEDIN.md, github-profile/, REVISION.md, ORDENES-CLAUDE-LOCAL.md
CLAUDE.md             ← instrucciones cortas para Claude Code (local o nube)
```

### Rutas generadas

| Ruta | Qué es |
|---|---|
| `/` · `/en/` | Portafolio |
| `/proyectos/<slug>/` · `/en/projects/<slug>/` | Caso de estudio de cada proyecto |
| `/cv/` · `/en/cv/` | CV en HTML (imprimible) |
| `/blog/` · `/en/blog/` · `/blog/<slug>/` · `/blog/rss.xml` | Blog (portada ES/EN; artículos en su idioma) |
| `/404.html` | Página de error propia (ES+EN) |
| `/api/contact` | Formulario de contacto (Pages Function) |
| `/cv/Rossmel-Abasto-CV-ES.pdf` · `…-EN.pdf` | CV en PDF |

---

## Cómo editar el contenido

**Todo está en `src/data/profile.ts`.** No hace falta tocar componentes para cambiar textos.

- Cada texto traducible es `{ es: '…', en: '…' }`.
- **Experiencia** → array `experience`. `cv: true` = aparece en el CV.
- **Proyectos** → array `projects`:
  - `featured: true` → tarjeta grande en la galería horizontal. `false` → lista de abajo, agrupada por `group`:
    `'clients'` ("Para clientes"), `'own'` ("Propios y open source") y `'want'` (las apps de WANT, juntas en una
    fila `<details>` desplegable dentro de "Para clientes"). En celular la fila muestra `short` (o "En vivo" si
    tiene `live`, con un punto del color del proyecto) en vez del `kind` completo.
  - `cv: true` → aparece en el CV (mantener 3–5 para que quepa en 2 páginas).
  - `confidential: true` → muestra "Código privado".
  - `accent` → color del caso de estudio y de la tarjeta.
  - `links` → demo, repo, Play Store… (opcional).
  - `draft: true` → oculto en todo el sitio y el CV (pendiente de confirmar). Vale también para
    `experience` y `education`. En componentes usar `visibleProjects`, nunca `projects` directo.
- **Habilidades** → `skills` (agrupadas; el CV las lista igual → buenas palabras clave para ATS).
- `// TODO(confirmar)` marca datos que Rossmel aún debe confirmar. Buscar con:
  `grep -rn "TODO" src/data`. Regla: el TODO va en un **comentario**, nunca dentro del texto visible
  (tras `npm run build`, `grep -rl TODO dist` debe salir vacío).

Para agregar un proyecto: copia un objeto del array `projects`, cambia `slug` (único, en minúsculas,
se usa en la URL) y los textos. La página del caso de estudio se genera sola.

### Imágenes de proyectos (pendiente)
Las tarjetas usan degradados del color `accent`. Para usar capturas reales: agregar un campo
`image` al tipo `Project`, poner los archivos en `src/assets/projects/` y usar `<Image />` de
`astro:assets` dentro de `[data-card-media]` en `Projects.astro` (el zoom al hacer scroll ya
está aplicado a ese elemento).

---

## Animaciones: cómo funcionan

`src/scripts/animations.ts` se carga en todas las páginas (salvo el CV) y activa efectos según
atributos HTML. Para animar algo nuevo, basta con añadir el atributo (ojo: estos nombres están
reservados; `data-count` sin valor anima a 0, por eso el contador del blog usa `data-results`).

Orden de arranque: primero la entrada del nombre (hero); el resto de animaciones se prepara **después**
(al terminar la entrada, al primer scroll/toque o a los 1,6 s) y **en pedazos de ~8 ms** (`runChunked`).
Prepararlas todas juntas congelaba el hero ~300–400 ms en celulares (se veía "a trompicones"):

| Atributo | Efecto |
|---|---|
| `data-split` | Título que entra línea por línea (SplitText + máscara) |
| `data-reveal` (+ `data-reveal-delay="0.2"`) | Sube y aparece al entrar en pantalla |
| `data-stack` (+ `data-stack-item`, `-name`, `-body`) | Lista en celular que queda fija y el scroll abre un ítem a la vez (encaja en cada uno): Proyectos, Experiencia, Stack y Cómo trabajo. Si con algún ítem abierto no cabe en la pantalla, no se fija. Sin JS/reduced-motion: todo abierto. Estilos en `global.css` |
| `data-focus-item` | En celular el elemento crece y se ilumina al pasar por el centro de la pantalla (otros proyectos, En vivo, Blog). Solo transform: no cambia el alto |
| `data-slide="left"` / `"right"` | Entra desde ese costado con un leve giro (acepta `data-reveal-delay`); el contenedor necesita `overflow-x-clip` |
| `data-draw` (lo pone `<Sketch>`) | Dibujo fine line a mano que se traza solo al entrar en pantalla |
| `data-layers` (+ hijos `data-layer="0.5"`, `data-layer-outline`) | Foto en capas: parallax por profundidad al hacer scroll, el contorno aparece y crece, inclinación con el mouse |
| `data-words` | Párrafo cuyas palabras se "encienden" según el scroll |
| `data-horizontal` + `data-track` | Sección fijada con scroll horizontal (solo ≥768px, con movimiento permitido) |
| `data-card` + `data-card-media` | Zoom del fondo de la tarjeta dentro del scroll horizontal |
| `data-timeline` + `data-progress` | Barra de progreso vertical de la experiencia |
| `data-parallax="0.3"` | Parallax |
| `data-count="42"` (+ `data-suffix="+"`) | Contador numérico |
| `data-magnetic` | Botón magnético (sigue al cursor) |
| `data-hover` | Agranda el cursor personalizado |

Otros detalles:
- **Arranque tipo terminal** (`Preloader.astro` + `initPreloader()`): escribe `./portfolio --start` y
  cuatro líneas `[ ok ]` (textos en `i18n.ts → boot`); ~2 s, se salta con clic/tecla, solo la primera
  visita de la sesión (`sessionStorage`; la clase `booted` en `<html>` evita que parpadee después).
- **Envío del formulario como script**: un `<dialog>` tipo terminal muestra los pasos reales del envío
  (validación → antispam+envío → respuesta HTTP real del servidor). Textos en `i18n.ts → contact.term`.
- **Nav** se oculta al bajar y reaparece al subir.
- **Cursor** personalizado solo con mouse (no en táctil).
- **`prefers-reduced-motion`**: se desactivan Lenis, preloader y animaciones; el contenido se
  ve completo y estático. Respetar esto siempre al añadir efectos.
- **Botón de movimiento** (header, junto al de tema): fuerza el modo reducido aunque el sistema no
  lo pida. Guarda `localStorage.motion` (`'reduced'` | `'auto'`) y **recarga la página** al hacer
  clic — el estado real (`prefers-reduced-motion` del sistema, salvo que el botón lo fuerce) se
  calcula una sola vez en el script inline de `Base.astro` y queda en `document.documentElement
  .dataset.motion`; `animations.ts`, `shader.ts` y `ContactForm.astro` leen ese dato en vez de
  `matchMedia` directo. `global.css` repite el bloque de `@media (prefers-reduced-motion: reduce)`
  bajo `html[data-motion='reduced']` para que el CSS puro (marquee, etc.) también se detenga.
- **Nombre del hero sin "salto" en hard reload**: el mismo script inline agrega `hero-pending` a
  `<html>` antes de pintar (si no hay movimiento reducido); eso esconde `[data-hero-title]` y
  `[data-hero-fade]` por CSS hasta que `heroIntro()` la quita, en el mismo tick en que arma el
  `SplitText` y arranca el tween. Sin esto, con fuentes lentas (hard reload) el nombre se veía
  posado y estático un instante antes de que la animación lo "forzara" a re-aparecer. Tiene un
  `setTimeout` de 3 s por si `animations.ts` no llega a correr, y el `<noscript>` la revela también.
- **Proyectos destacados sin JS o con movimiento reducido**: la `<section id="work">` (no el
  `[data-track]` de adentro) es `overflow-x: auto` con scroll-snap y `role="region"`/`tabindex="0"`
  por defecto en CSS — se puede recorrer con touch, rueda o teclado (Tab enfoca una tarjeta fuera
  de vista y el navegador la desplaza solo) sin depender de JS. **Importante:** el scroll nativo va
  en la sección, no en el track — el track tiene que poder crecer libre a su ancho de contenido real
  para que el `transform: translateX()` de GSAP funcione; si el track también clipa con overflow, su
  propia caja se encoge al ancho del viewport y el transform mueve esa caja angosta en vez de revelar
  el resto de las tarjetas (pantalla en negro a mitad de scroll). `initHorizontal()` le pone
  `overflow-x: hidden` a la SECCIÓN solo mientras el efecto "fijo" de GSAP está activo (para no pelear
  con el scroll nativo), y lo devuelve a `auto` si la media query deja de matchear. Con
  `reduced-motion` esa función nunca corre, así que el scroll nativo queda como única forma de ver
  las tarjetas — y es plenamente accesible.
- **Lenis + ScrollTrigger**: `ScrollTrigger.addEventListener('refresh', () => lenis.resize())` es
  obligatorio. Lenis mide el alto scrolleable de la página una sola vez y su `ResizeObserver` no
  detecta que creció cuando GSAP agrega el pin-spacer del scroll horizontal (ese spacer agrega
  miles de píxeles de alto). Sin este listener, el scroll se queda pegado justo al llegar a la
  sección de Proyectos — el usuario nunca avanza más allá de la primera tarjeta.
- Tema oscuro por defecto; botón ◐ cambia a claro y se guarda en `localStorage`.
- **Títulos con `vw`** (hero, "Trabajo seleccionado", nombre de proyecto en la tarjeta y en su
  página, "¿Construimos algo juntos?", 404): usan `clamp(mínimo, Xvw, tope)` en vez de `Xvw` a
  secas. El mínimo es el tamaño a 768px y el tope es el tamaño a 1440px, así no cambia nada hasta
  1440px y deja de crecer sin control en monitores más anchos (antes se veía gigante a 1920px+).

---

## El CV (ATS)

`src/components/Resume.astro` sigue las reglas que usan los lectores automáticos (ATS):

- una sola columna y orden de lectura lineal
- encabezados estándar: Resumen profesional, Habilidades técnicas, Experiencia laboral, Proyectos,
  Educación, Idiomas
- sin tablas, íconos, imágenes, columnas ni texto dentro de gráficos
- fuente estándar (Arial/Helvetica), texto seleccionable; el PDF sale de Chromium con capa de texto
- fechas homogéneas "mes año – mes año"
- flechas y símbolos raros se reemplazan automáticamente (`clean()` en `Resume.astro`)

Regenerar PDFs tras cualquier cambio de contenido: `npm run build && npm run cv:pdf`
(los PDF se guardan en `public/cv/` —se versionan— y en `dist/cv/`).

Consejos de contenido: bullets con **verbo + qué + resultado (con número)**; adaptar el resumen
y el orden de skills a cada oferta; máximo 2 páginas.

---

## Idiomas (ES/EN)

- Español es el idioma por defecto (sin prefijo); inglés vive en `/en/…`.
- Cada página enlaza su versión en el otro idioma (`hreflang` + botón ES/EN).
- Rutas centralizadas en `paths` de `src/data/i18n.ts`.

---

## Despliegue en rossmel.com

El sitio es **100% estático** (`dist/`). Objetivo:

| Subdominio | Sirve |
|---|---|
| `portfolio.rossmel.com` | `dist/` completo |
| `cv.rossmel.com` | la ruta `/cv/` (o redirección a `portfolio.rossmel.com/cv/`) |

Contexto conocido (sept. 2026): el DNS de `rossmel.com` está en **Cloudflare** (registrador:
Spaceship) y el certificado comodín `*.rossmel.com` ya lo emite Cloudflare. El servidor casero está
detrás de **CGNAT** (no se pueden abrir puertos) y publica servicios con un **Cloudflare Tunnel**.
(Detalles de la infraestructura: NO se documentan aquí porque este repo es público.)

✅ **Decisión: Cloudflare Pages** (sept. 2026). Un **solo** proyecto de Pages conectado a este repo,
con los dos dominios. (Se descartaron el servidor casero —CGNAT, poca RAM, cortes de luz— y el repo
aparte `rossmel-web`, que duplicaba el sitio.)

| Ajuste | Valor |
|---|---|
| Proyecto | `rossmel-portfolio` (Workers & Pages → Create → Pages → **Connect to Git**; nunca "Direct Upload": no se puede pasar a Git después) |
| Repo / rama de producción | `rossmelabasto/ross_portfolio` · `main` |
| Framework preset | Astro (o None) |
| Build command | `npm run build` |
| Output directory | `dist` |
| Root directory | *(vacío)* |
| Variable de entorno | `NODE_VERSION=22` (también hay `.nvmrc`; Astro 7 pide ≥ 22.12) |
| Custom domains | `portfolio.rossmel.com` y `cv.rossmel.com` (añadirlos desde Pages; **no** crear CNAME a mano) |

Piezas del repo que lo hacen funcionar:
- `functions/_middleware.js` — en `cv.rossmel.com/` sirve `/cv/` sin redirigir.
- `public/_routes.json` — la función solo corre en `/` (no gasta invocaciones en assets).
- `public/_headers` — cabeceras de seguridad y caché larga para `/_astro/*`.
- `public/cv/*.pdf` — los PDF del CV van versionados (el build de Cloudflare no tiene Chromium):
  **siempre** correr `npm run cv:pdf` y commitear los PDF cuando cambie el contenido del CV.
- El enlace "Ver portafolio" del CV es absoluto (`portfolio.rossmel.com`) porque en `cv.` la raíz es el CV.

Analítica: Cloudflare Web Analytics (sin cookies) con **inyección automática** de la zona: ya funciona
en portfolio. y cv. (Cloudflare solo inyecta el script a navegadores reales, no a `curl`).
Respaldo: si algún día se apaga la inyección automática, definir la variable de build
`PUBLIC_CF_BEACON_TOKEN` y `Base.astro` añade el script. **No** usar ambas a la vez (contaría doble).

### Formulario de contacto

`functions/api/contact.js` (Pages Function en `/api/contact`) envía el mensaje con **Resend** y usa
**Turnstile** (antispam de Cloudflare, sin captchas molestos) + un campo trampa (honeypot).
El formulario **solo aparece** si en el build existe `PUBLIC_TURNSTILE_SITE_KEY`; sin eso, la sección
de contacto muestra solo los botones de correo/CV. Configuración (una vez):

1. **Turnstile**: Cloudflare → Turnstile → Add widget → dominios `portfolio.rossmel.com`
   (y `rossmel-portfolio.pages.dev` para las vistas previas), modo *Managed*.
   Copia la *site key* (pública) y la *secret key*.
2. **Resend** (gratis hasta 3.000 correos/mes): crear cuenta → Domains → añadir `rossmel.com` →
   copiar sus registros DNS (SPF/DKIM) en Cloudflare DNS → esperar "Verified" → API Keys → crear
   una con permiso *Sending access*.
3. **Pages → rossmel-portfolio → Settings → Variables and Secrets** (Production y Preview):
   - `PUBLIC_TURNSTILE_SITE_KEY` = site key (texto normal; se usa en el build)
   - `TURNSTILE_SECRET_KEY` = secret key (**Secret**)
   - `RESEND_API_KEY` = API key de Resend (**Secret**)
   - opcionales: `CONTACT_TO` (destino, por defecto abastorossmel@gmail.com),
     `CONTACT_FROM` (por defecto `Portafolio <contacto@rossmel.com>`)
   - opcionales, aviso por Telegram: `TELEGRAM_BOT_TOKEN` (**Secret**) y `TELEGRAM_CHAT_ID`
4. Redesplegar (Deployments → Retry) y probar el formulario en producción.

**Aviso por Telegram (opcional, recomendado):** cada mensaje llega también a un bot propio, con
notificación push, por si Gmail no avisa o el correo que dejó la persona está mal escrito. Si el correo
falla pero Telegram llega, el formulario responde OK. Configuración: en Telegram, @BotFather →
`/newbot` → copiar el token; escribirle cualquier cosa al bot nuevo; abrir
`https://api.telegram.org/bot<TOKEN>/getUpdates` y copiar `message.chat.id`. Usar un bot **solo para
esto** (no el de Clawdio). Sin estas dos variables, el formulario funciona igual que antes (solo correo).

**Campo WhatsApp/teléfono (opcional):** con selector de país (Bolivia por defecto; lista y prefijos de
`libphonenumber-js`, nombres con `Intl.DisplayNames`, todo en el build: no se envía JS extra). El
`<select>` es nativo y transparente encima del prefijo visible, así sigue siendo accesible. Llega en el
correo y en Telegram como `+591 7…` con enlace `wa.me`; si la persona escribe el número con `+`, se
respeta tal cual.

Respuestas de la API: `200 {ok:true}`, `400 invalid|captcha`, `502 send_failed` (fallaron todos los
canales), `503 not_configured` (falta Turnstile o no hay ningún canal).

### Blog

- Artículos en `src/content/blog/<slug>.md` (Markdown, español) → `/blog/<slug>/`.
- **Versión en inglés**: `src/content/blog/en/<slug-en>.md` con `lang: 'en'` y `translationOf: '<slug ES>'`
  → `/en/blog/<slug-en>/`. Las dos versiones se enlazan solas (hreflang, switch ES/EN, "Read this post
  in English") y comparten el hilo de comentarios. Etiquetas en inglés en los EN (`ai`, `privacy`,
  `performance`, `security`, `career`…). Cada idioma tiene su portada, RSS (`/blog/rss.xml`,
  `/en/blog/rss.xml`) e índice de búsqueda.
- Frontmatter: `title`, `description` (1–2 frases, sale en Google y al compartir), `date`,
  `tags`, `lang` (`es`/`en`, por defecto `es`), `draft: true` para no publicar,
  `project: '<slug>'` para enlazarlo con su caso de estudio (el caso lista sus artículos y el
  artículo muestra una tarjeta al proyecto). El orden es siempre por fecha (ya no hay artículos fijados).
- Etiquetas: reusar las existentes (`ia`, `llm`, `python`, `frontend`, `react`, `linux`,
  `rendimiento`…). Las que tienen un solo artículo se agrupan tras el botón "+N más".
- Portada con **buscador** (texto completo: el índice `search.json` se descarga solo al
  empezar a buscar; tecla `/` para enfocar), **filtro por etiqueta** y **orden** (recientes, antiguos,
  A→Z, Z→A, lectura más corta); todo queda en la URL (`/blog/?q=sqlite&tag=llm&sort=az`), así se puede
  compartir. Sin JS se ve la lista completa.
- Cada artículo: botones para compartir (LinkedIn, X, WhatsApp) y copiar enlace, datos estructurados
  `BlogPosting` + `BreadcrumbList`, `article:published_time` y fecha en el sitemap (`lastmod`).

#### Comentarios (giscus, opcional)
Los comentarios usan **giscus**: se guardan como GitHub Discussions del repo (gratis, sin base de datos,
se comenta con cuenta de GitHub). No aparecen hasta configurar estas variables:
1. GitHub → `rossmelabasto/ross_portfolio` → Settings → General → Features → activar **Discussions**.
2. Instalar la app https://github.com/apps/giscus solo en ese repo.
3. En Discussions, crear la categoría **Comentarios** (tipo *Announcement*: solo giscus crea hilos).
4. Entrar a https://giscus.app, poner el repo y la categoría → copiar `data-repo-id` y `data-category-id`.
5. Cloudflare Pages → `rossmel-portfolio` → Settings → Variables and Secrets (Production), como texto:
   `PUBLIC_GISCUS_REPO=rossmelabasto/ross_portfolio`, `PUBLIC_GISCUS_REPO_ID=…`,
   `PUBLIC_GISCUS_CATEGORY=Comentarios`, `PUBLIC_GISCUS_CATEGORY_ID=…` → Deployments → Retry.
   (No son secretos: son IDs públicos.)
El formulario de contacto al final de cada artículo sigue funcionando igual.
- Cada artículo: índice lateral con la sección actual resaltada (en móvil, desplegable),
  botón "Copiar enlace", tarjeta al caso de estudio y "Sigue leyendo" (mismo proyecto o etiquetas).
- Estilo de los artículos: problema real → decisión clave → código simplificado del repo →
  "Lo que aprendí". Nada de datos de clientes ni detalles de infraestructura (hosts, puertos, IPs).
- Cada artículo termina con el formulario de contacto (`ContactForm` con `context` = título):
  el correo llega con el asunto "Blog: comentario de … sobre …".
- RSS en `/blog/rss.xml`; aparece en el sitemap; la home muestra los 3 últimos ("Del blog").
- `blog.rossmel.com` → Redirect Rule 301 a `https://portfolio.rossmel.com/blog/` (mismo dominio =
  mejor posicionamiento que un subdominio aparte).
- Código con resaltado (Shiki, tema `vitesse-dark`); estilos del texto en `.prose` (global.css).

### Analítica (visitas)
- **Cloudflare Web Analytics** ya está activo (inyección automática, sin cookies). Para verlo:
  dash.cloudflare.com → tu cuenta → **Analytics & Logs → Web Analytics** → `portfolio.rossmel.com`:
  visitas, páginas vistas, páginas más vistas, de dónde llegan (referrers), países, dispositivos y
  Core Web Vitals. También: Workers & Pages → `rossmel-portfolio` → *Metrics*.
- **Google Search Console** (search.google.com/search-console, propiedad `rossmel.com`) → *Rendimiento*:
  qué buscó la gente para llegar (p. ej. "rossmel abasto"), impresiones, clics y posición.
  *Inspección de URLs* → pedir indexación de páginas nuevas (los artículos EN, por ejemplo).
- No se usa Google Analytics a propósito: pesa más, usa cookies y pediría banner de consentimiento.

### Dibujos a mano (fine line)
- `src/data/sketches.ts`: cada dibujo es un viewBox + formas de **rough.js**, generadas **en el build**
  (al navegador solo llegan `<path>`; semilla fija = mismo trazo siempre). Se usan con
  `<Sketch name="…" />` y heredan el color del texto (lima/violeta con `text-accent`).
- Anotaciones en textos de `profile.ts`: `==texto==` subrayado a mano, `((texto))` círculo a mano
  (componente `Marked`; marcas cortas, no se parten en dos líneas).
- Modos de `<Sketch draw=…>`: `true` se traza al entrar en pantalla, `"scrub"` se traza al ritmo del
  scroll (estela del avión, subrayado de "Cómo trabajo"); un ancestro con `data-draw-host` hace que se
  vuelva a trazar al pasar el mouse (tarjetas de Stack y Cómo trabajo).
- Dónde están: flecha "yo" a la foto, círculo en "días programando", subrayado/círculo en el Sobre mí,
  "hoy" en Experiencia, garabato + "sigue bajando" en Proyectos, íconos de Stack y Cómo trabajo, ondas
  en "En vivo", avión de papel y "¡escríbeme!" en Contacto, tacita en el footer, varios dibujos por
  capítulo en `/sobre-mi/` (campo `doodles` de `story`, el primero es el principal), estrella/foco en "Lo destacado"/"Lo que aprendí" de cada proyecto, lápiz y garabato
  en el blog, garabato bajo el título de cada artículo. En el CV no (el CV quita las marcas con
  `stripMarks`; también la meta description, el JSON-LD y el índice del buscador).
  Criterio: acompañar palabras clave, no decorar.
- **Marcas en el blog:** los `.md` también aceptan `==texto==` y `((texto))` (plugin
  `src/lib/remark-marks.ts`, registrado en `astro.config.mjs`). Ojo: en Astro 7 `remarkPlugins`
  necesita el paquete `@astrojs/markdown-remark` (el procesador por defecto es Sätteri). No usar marcas
  dentro de títulos (`##`) ni bloques de código; 1–2 por artículo, frases cortas.
- **Un dibujo por proyecto:** campo `doodle` en `profile.ts` (balanza, auto, birrete, gota, cuaderno,
  cubo de Rubik, tele, megáfono…). Aparece en la tarjeta de la galería, en la lista de otros proyectos,
  en las tarjetas de "En vivo" y grande en el hero de cada caso de estudio.
- **Dibujos "en vuelo"** (`SketchFlight.astro`): estela punteada que cruza el texto y termina en un
  dibujo, trazada con el scroll (como el avión de Contacto). Están en Experiencia (laptop), En vivo
  (servidor), Cómo trabajo (cohete), Del blog (lápiz), /blog/ (foco) y el hero de
  cada proyecto. `variant` 0–2 cambia la forma de la estela.
- **Botón "volver arriba"** (`ToTop.astro`): aparece tras bajar ~una pantalla, con un anillo dibujado a
  mano que se completa según el progreso del scroll; usa Lenis (`window.__lenis`) si está activo. Al llegar al `<footer>` sube (variable CSS `--lift`) para no tapar los enlaces.
- Letra manuscrita solo para etiquetas (`font-hand`, Caveat).

### Foto en capas ("Sobre mí")
La foto se arma con 3 capas: fondo negro (CSS), contorno (`src/assets/rossmel-outline.png` usado como
máscara y pintado con `--accent`: lima en oscuro, violeta en claro) y la persona recortada
(`src/assets/rossmel-person.png`, 28 % más alta que el cuadro: debajo va la polera real de la foto
original, así el parallax nunca muestra un corte). Se generan con:

```bash
pip install pillow numpy scipy
python3 scripts/build-photo-layers.py --white foto-fondo-blanco.jpg --original foto-original.jpg
```

- `--white`: la foto editada con fondo blanco (recorte fino del pelo). `--original`: la foto del celular
  (aporta la polera). Las fuentes **no se suben al repo** (la original muestra la casa): las tiene Rossmel.
- El script alinea solo la original con la editada (tarda ~5 min) e imprime `--align "a,tx,ty"`; pasarlo
  en las siguientes corridas las hace instantáneas. Último valor: `--align "3.064896,-2.350,214.282"`.
- La animación está en `animations.ts` → `initLayers()`; sin JS o con reduced-motion las capas quedan
  alineadas. `rossmel.jpg` (la versión con contorno) sigue siendo la imagen del JSON-LD.

### SEO
- `@astrojs/sitemap` genera `sitemap-index.xml` (ES/EN con hreflang); `robots.txt` lo declara.
- Dar de alta `https://portfolio.rossmel.com` en **Google Search Console** (verificación por DNS,
  que ya está en Cloudflare) y enviar `sitemap-index.xml`.
- `404.html` propia (bilingüe).
- En cada página: canonical, hreflang ES/EN + `x-default`, Open Graph completo (`og:locale`, imagen
  1200×630, `og:site_name`), Twitter card y JSON-LD `Person` (con foto, `sameAs` a GitHub/LinkedIn/GitLab,
  universidad y temas); en la home además `WebSite`. Esto ayuda a que buscar "Rossmel Abasto" muestre
  el portafolio y un panel con tus perfiles.
- Para posicionar tu nombre, lo que más pesa fuera del código: que **LinkedIn, GitHub (perfil y README),
  GitLab y cualquier perfil público enlacen a `https://portfolio.rossmel.com`**; volver a enviar el
  sitemap en Search Console tras cada tanda de artículos; opcional, publicar copias en dev.to/Hashnode con
  *canonical URL* apuntando al artículo original (traen lectores sin robar posicionamiento).

Extras en Cloudflare (Rules → Redirect Rules):
- `rossmel.com` y `www.rossmel.com` → 301 a `https://portfolio.rossmel.com` (preservar ruta).

Flujo diario: push a `main` = producción; push a otra rama / PR = URL de vista previa `*.pages.dev`.

`site` en `astro.config.mjs` define el dominio canónico (SEO, OG, sitemap). Cambiarlo si cambia el dominio.

---

## Estado actual y pendientes

✅ Hecho (v3.0, sept. 2026)
- Proyecto nuevo en Astro 7 + Tailwind 4 + GSAP + Lenis
- Home con preloader, hero con shader, sobre mí, timeline de experiencia, galería horizontal de
  proyectos, stack con marquee, "cómo trabajo" (IA), contacto
- Casos de estudio por proyecto, ES/EN, modo claro/oscuro, SEO + JSON-LD
- CV ATS en HTML + PDF (ES/EN) generado desde los mismos datos
- v3.1: contenido real con el informe de Claude local (commits de WANT, métricas de AdvAI, SGPG,
  Link'u, homelab, rOS); campo `draft` para ocultar lo no confirmado

⏳ Pendiente
- [x] Todos los datos confirmados (sin `TODO(confirmar)` pendientes)
- [x] Imagen para compartir (`public/og.png`, 1200×630, `npm run og`) y una propia por proyecto y artículo (`public/og/`)
- [ ] Capturas reales de proyectos (las sube Rossmel más adelante; ver "Imágenes de proyectos")
- [x] Publicado en Cloudflare Pages: portfolio.rossmel.com y cv.rossmel.com (sept. 2026)
- [x] Formulario de contacto funcionando en producción (Resend verificado con SPF/DKIM/DMARC, Turnstile activo; prueba real llegó a la bandeja de entrada)
- [ ] (Opcional) Copiar las 3 variables del formulario también al entorno *Preview* de Pages
- [x] Foto en "Sobre mí" (`src/assets/rossmel.jpg`, optimizada a WebP por Astro)
- [x] Menú móvil, sitemap, 404 propia, auditoría Lighthouse (local: perf 87–94, a11y 95–96, BP/SEO 100; CV 100 en todo)
- [x] Google Search Console verificado (propiedad de dominio `rossmel.com`) y sitemap enviado
- [ ] Video corto de AdvAI + capturas (Rossmel)
- [x] Revisión exhaustiva con Claude local (`docs/REVISION.md`) — correcciones aplicadas en v3.7
- [ ] Perfil de GitHub (`docs/github-profile/`, ver INSTRUCCIONES.md) y LinkedIn (`docs/LINKEDIN.md`)
- [ ] Probar Lighthouse (meta ≥95) y accesibilidad con teclado
- [ ] (Opcional) Activar comentarios con giscus (README → Blog → Comentarios)
- [ ] Pedir indexación de los artículos EN en Search Console y reenviar el sitemap
- [x] v3.8: énfasis en programar sin IA (sobre mí, CV, línea de tiempo "antes y después de la IA"),
  blog con buscador/etiquetas/índice/relacionados y 11 artículos (uno o más por proyecto con código visible, más Jellyfin)
- [x] "En vivo": notebook, rubik y selflix son **proyectos** con caso de estudio propio (campo `live` en profile.ts);
  la tarjeta abre el caso y ahí está el botón "Ver en vivo". Textos armados desde la memoria del agente: Rossmel los revisa

---

## Continuar con Claude Code local

**Guía completa: [`docs/CONTINUAR.md`](docs/CONTINUAR.md)** (mapa del código, recetas, preferencias de
Rossmel, pendientes y trampas conocidas).

1. `git clone git@github.com:rossmelabasto/ross_portfolio.git && cd ross_portfolio && npm install`
2. Abrir `claude` en la carpeta: lee `CLAUDE.md` automáticamente.
3. Primer mensaje sugerido: *"Lee docs/CONTINUAR.md, CLAUDE.md y README.md. Corre build, check y
   verify para confirmar que todo está bien y dime qué pendientes ves."*

Ramas:
- `master` → v1 (Angular, 2022), solo como archivo histórico.
- `main` → rama por defecto.
- `claude/…` → ramas de trabajo creadas desde sesiones de Claude Code en la nube; se fusionan a `main`.

---

## Historial de decisiones

| Fecha | Decisión |
|---|---|
| 2026-09 | Reescritura total: Angular 13 → Astro 7. Una sola página con scroll narrativo en vez de rutas por sección. |
| 2026-09 | Astro en lugar de Next.js: sitio estático, más liviano, ideal para servirlo desde el servidor propio. |
| 2026-09 | Contenido centralizado en `profile.ts` para que portafolio y CV nunca se desincronicen. |
| 2026-09 | Shader WebGL propio en vez de three.js (≈4 KB vs ≈600 KB). |
| 2026-09 | Dominio propio `rossmel.com` en vez de Vercel. |
| 2026-09 | Estética dark + acento lima aprobada por Rossmel ("me encanta"). |
| 2026-09 | Proyectos de clientes de WANT sin código ni enlaces (`confidential`); métricas de commits como evidencia. |
| 2026-09 | CV limitado a 2 páginas: SGPG y Link'u solo en la experiencia "Independiente"; diseño gráfico solo en el portafolio. |
| 2026-09 | v3.7 tras la revisión: header a 360 px, CSS en línea + precarga de fuentes (LCP), blog con portada EN, og:type article, validación del formulario en el idioma de la página, contraste en modo claro y en el código. |
| 2026-09 | Texto en JetBrains Mono (Space Grotesk en titulares; Inter solo en artículos largos). Pedido de Rossmel. |
| 2026-09 | Blog en `/blog` (no subdominio aparte, por SEO); `blog.rossmel.com` redirige. Primer artículo: AdvAI. |
| 2026-09 | Hero: fondo CSS de respaldo si el navegador no tiene WebGL; botones Ver proyectos / Descargar CV. |
| 2026-09 | Identidad: monograma de Rossmel (`src/assets/logo.svg`, componente `Logo.astro`) en nav, footer, favicon, íconos PWA y og.png. |
| 2026-09 | Contador del preloader → terminal de arranque; envío del formulario mostrado como script (idea de Rossmel). |
| 2026-09 | Formulario: Pages Function + Resend + Turnstile (gratis, sin backend propio). |
| 2026-09 | Fondo WebGL limitado a 30 fps y menor resolución en móvil (rendimiento). |
| 2026-09 | Despliegue en Cloudflare Pages (un proyecto, dos dominios, middleware para `cv.`). |
| 2026-09 | v3.8: "programador primero". Sobre mí, CV y la sección Cómo trabajo cuentan que programó años sin IA (en WANT la IA llegó recién el último año) y qué herramientas usa hoy. |
| 2026-09 | Blog "en condiciones": buscador de texto completo sin dependencias (índice JSON bajo demanda), etiquetas, índice por artículo, relacionados y enlaces artículo ↔ caso de estudio. Artículos en español. |
| 2026-09 | Sección "En vivo": notebook, rubik y selflix. Fuera: music, mcu, waitlist, stream, chat, admin, admin-music, ssh, ori, class, s, test (y los del propio portafolio). |
| 2026-09 | Dibujos fine line a mano (rough.js en el build): anotaciones, íconos de Cómo trabajo y dibujos de la historia. Pocos y con significado; nada en hero/CV/stack. |
| 2026-09 | "Sobre mí" corto en la home + página `/sobre-mi/` (`/en/about/`) con la historia completa (`story`, `journey` en profile.ts); cifra "días programando" desde `codingSince` (mediados de 2020); "Cómo trabajo" = flujo completo (5 pasos + entorno), la IA como una parte. Empezó a programar en 2020 (no 2019). |
| 2026-09 | Foto del "Sobre mí" en 3 capas (fondo, contorno, persona) con parallax y tilt; capas generadas por script desde la foto original. |
| 2026-09 | Blog bilingüe (artículos EN en `src/content/blog/en/`, pareados con `translationOf`), orden en la portada, fechas repartidas, compartir, giscus opcional, SEO (JSON-LD Person/WebSite/BlogPosting/Breadcrumb, og:locale, x-default, lastmod). Stack traducible (`SkillItem`). "La agencia" → WANT. |
| 2026-09 | Los servicios en vivo pasan a ser proyectos con página de detalle (qué es, cómo funciona, lo que aprendí) en vez de enlaces directos; se elimina `liveSites`. Pedido de Rossmel. |
| 2026-09 | Entrada del nombre fluida en móvil: las demás animaciones se preparan después del intro y en pedazos (antes, un bloqueo de ~380 ms con CPU de gama media). |
| 2026-09 | Tono: transmitir que entiende lo que genera la IA, sin frases absolutas ni "no soy vibe coder" (pedido de Rossmel). |
| 2026-09 | v3.13: botón "volver arriba" con anillo de progreso y más dibujos a mano (subrayados/círculos en hero, experiencia, proyectos, historia y los 22 artículos). Pedido de Rossmel. |
| 2026-09 | v3.15: nuevo titular del hero ("Construyo interfaces rápidas, cuidadas y listas para producción. Programo desde 2020…"), íconos en los botones CV y ES/EN (nav y barra del CV) y el botón "volver arriba" sube al llegar al footer para no tapar sus enlaces. Pedido de Rossmel. |
| 2026-09 | Traspaso a Claude local: guía `docs/CONTINUAR.md` y `npm run verify` (chequeo automático tras el build). |
| 2026-10 | Ficha nueva **GenogramApp** (app de genogramas a medida para una estudiante de Psicología, Android + web, IA con revisión humana): "Código privado", sin enlace a la web ni nombre de la usuaria, dibujo nuevo `genogram`, acento `#ffb6d5` (el de la app). Pedido de Rossmel. |
| 2026-10 | Tres artículos de GenogramApp (ES + EN): cómo se dibuja solo el genograma (modelo de datos y acomodo por generaciones), la IA con vista previa de cambios y sus errores reales, y el botón atrás de Android en Capacitor. Capturas de familias inventadas en `public/blog/genogramapp/`. |
| 2026-10 | SGPG pasa a repo **privado** (lo usa la universidad con datos reales): la ficha queda `confidential: true` ("Código privado") y sin enlace a GitHub; también sin enlace en el README del perfil de GitHub. Pedido de Rossmel. |
| 2026-10 | Artículo "De 13 GB a 2,7 GB: cómo elegí formato y resolución para mangas escaneados" (ES/EN, `project: manga`): comparación medida JPEG/WebP/AVIF a 2000/2400/3200 px, por qué 2400 px (trama de puntos) y por qué WebP. Primer artículo con tabla. Pedido de Rossmel. |
| 2026-10 | Blog: se quitó el "fijado" (`pinned`). "Programar antes y después de la IA" salía siempre primero aunque es de septiembre, y el orden "Más recientes" no era real. Ahora todo va por fecha (blog, portada y RSS). Pedido de Rossmel. |
| 2026-10 | Ficha nueva **transcribe** (CLI open source de transcripción local: selector interactivo, marcas de tiempo, subtítulos .srt, ES/EN; repo `ross_transcribe`, MIT), con dibujo `mic` y acento `#cba6f7`, no destacada; artículo "transcribe: de una nota de voz a una herramienta open source para la terminal" (ES/EN) con GIF de la demo en `public/blog/transcribe/`. Pedido de Rossmel. |
| 2026-10 | Ficha nueva **Manga** (manga.rossmel.com, lector de mangas con Kavita + marca rOS, subida automática y optimización medida 13 GB → 2,7 GB), con dibujo `manga` (libro abierto), acento `#ff7eb3` y tarjeta en "En vivo" (4 en fila desde `xl`). Homelab: 10 servicios públicos (antes decía 12). Pedido de Rossmel. |
| 2026-10 | Celular: Experiencia, Stack y Cómo trabajo usan la misma lista fija que Proyectos (Experiencia muestra cargo, resumen y tecnologías, con enlace al CV para el detalle); otros proyectos, En vivo y Blog crecen al pasar por el centro (`data-focus-item`); menos espacio vertical entre secciones. La home pasó de ~21 a ~14,8 pantallas de celular. Escritorio sin cambios. Pedido de Rossmel. |
| 2026-10 | Proyectos destacados en celular: en vez de 7 tarjetas grandes (~4 pantallas de scroll), una lista fija donde el scroll abre un proyecto a la vez (`data-stack`, ~2,4 pantallas; ~1,8 sin animaciones). Escritorio sin cambios. Pedido de Rossmel. |
| 2026-10 | Notebook v3 y open source (MIT): ficha reescrita (búsqueda híbrida sqlite-vec + FTS5, Recall@6 93 %, modo estudio, IA en planes gratuitos, enlace a GitHub), pasa a destacado; artículo "Notebook: mis apuntes como un chat conmigo mismo" (ES/EN) con capturas de la demo en `public/blog/notebook/`. Homelab ya no menciona Grocy (eliminado). Descripción de las tarjetas de Proyectos con alto mínimo de 3 líneas. Pedido de Rossmel. |
| 2026-10 | Formulario: campo opcional de WhatsApp/teléfono y aviso por Telegram además del correo (un mensaje llegó con un correo mal escrito que rebotó, y Gmail no avisó a tiempo). Pedido de Rossmel. |
| 2026-10 | `/sobre-mi/` rehecha: foto solo arriba (ya no sticky), capítulos intercalados izquierda/derecha que entran desde su costado (`data-slide`), cada uno con un dibujo principal + 3 secundarios con parallax y un número grande de fondo; flechas a mano entre capítulos. Se quitó "Mi camino" (`journey`). "Fuera del código" se dividió en Cubos de Rubik / Fútbol / Música y podcasts. Pedido de Rossmel. |
| 2026-10 | Menos proyectos destacados para acortar el scroll: Homelab, Notebook y rOS pasan a la lista normal; quedan AdvAI, CarX, SGPG y Link'u. |
| 2026-10 | Fase 1 del plan de mejora: dibujos con 1 decimal (portada de 167 a 68 KB comprimida), `npm run verify` revisa las 83 páginas del sitemap a 1440 y 360 px (`--quick` para la muestra), URL y código largos del blog se parten, marcas largas acortadas en transcribe. |
| 2026-10 | Fase 2 del plan de mejora: lista de proyectos agrupada (Para clientes / Propios y open source), las 6 apps de WANT en una fila desplegable, etiquetas cortas y punto "en vivo" en celular; "En vivo" en celular es una tira deslizable. Portada en celular: de 12.265 a 11.162 px. |
| 2026-10 | Fase 3 del plan de mejora: portada más corta en celular (de ~14,5 a ~12 pantallas con las fases 2 y 3): márgenes de sección más chicos en celular, titular del Sobre mí más chico, foto un poco menor, el párrafo de Platzi solo en /sobre-mi, "Mi entorno" solo en escritorio y las listas fijas avanzan cada 14 % de pantalla (antes 18 %). |
| 2026-10 | Fase 4 del plan de mejora: capturas en las fichas (`gallery`: Notebook, Rubik, transcribe, GenogramApp) e imagen para compartir propia por proyecto y artículo (74, en `public/og/`, con el color y el dibujo de cada proyecto; se generan con `npm run og` y se commitean). |
| 2026-09 | v3.14: dibujo por proyecto y dibujos "en vuelo" en más secciones; CV con "WANT Digital Agency" completo y más proyectos (Homelab, Notebook, Rubik, rOS). Pedido de Rossmel. |
| 2026-09 | Fuera del sitio: watcher-backend, prototipos v0 (salvo SGPG), proyectos descartados, proyectos personales/regalos. |
