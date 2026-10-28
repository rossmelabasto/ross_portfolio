# CLAUDE.md — ross_portfolio

Portafolio + CV de Rossmel Abasto. Idioma de trabajo: **español** (el sitio es ES/EN).
**Para retomar el proyecto: `docs/CONTINUAR.md`** (guía de traspaso). `README.md` = referencia completa.

## Comandos
- `npm run dev` — desarrollo (http://localhost:4321)
- `npm run build` — build estático a `dist/`
- `npm run cv:pdf` — PDFs del CV (después de `build`); usa Chromium del sistema o `$CHROMIUM_PATH`
- `npm run check` — tipos
- `npm run verify` — tras el build: TODAS las páginas del sitemap a 1440 y 360 px (desborde, marcas sin procesar, errores JS) y CV ≤ 2 páginas; `-- --quick` = muestra de 14 páginas

Antes de dar algo por terminado: `npm run build`, `npm run check` y `npm run verify` sin errores, y si cambió contenido del CV,
`npm run cv:pdf` y commitear los PDF de `public/cv/`.

## Reglas
- **Contenido solo en `src/data/profile.ts`** (textos `{ es, en }`). Nunca hardcodear textos de
  contenido en componentes. Textos de interfaz → `src/data/i18n.ts`.
- Cualquier dato no confirmado por Rossmel va con `// TODO(confirmar)`. No inventar métricas,
  fechas ni logros: preguntar.
- Nunca poner en el sitio información personal/familiar ni secretos (ver repos privados con cuidado:
  los proyectos de clientes se marcan `confidential: true` y no se enlaza código).
- Animaciones: usar los atributos `data-*` de `src/scripts/animations.ts`; respetar
  `prefers-reduced-motion`. Nuevos efectos → añadirlos allí y documentarlos en README.
- El CV (`Resume.astro`) debe seguir siendo ATS-friendly: una columna, sin tablas/íconos/imágenes,
  encabezados estándar, fuente estándar.
- Estilo: tokens de color en `src/styles/global.css` (`--bg`, `--fg`, `--accent`…) → clases
  Tailwind `bg-bg`, `text-fg`, `text-accent`, etc.
- Mantener README.md al día (sección "Estado actual y pendientes" e "Historial de decisiones").
- Artículos nuevos del blog: escribir las dos versiones (ES en `src/content/blog/`, EN en `src/content/blog/en/` con `translationOf`).

## Estado (actualizar al terminar cada sesión)
- v3.3 (sept. 2026): PUBLICADO en portfolio.rossmel.com y cv.rossmel.com. Contenido confirmado (sin TODOs).
- v3.4: foto, menú móvil, sitemap, 404, formulario (/api/contact con Resend + Turnstile).
- v3.5: terminal de arranque, terminal de envío del formulario, arreglos de foto/título/inglés.
- Formulario de contacto y Search Console: configurados y funcionando (sept. 2026).
- v3.6: blog (/blog, Markdown en src/content/blog), 'Lo que aprendí' por proyecto, CTAs y fondo de respaldo en el hero.
- v3.7: correcciones de la revisión de Claude local (móvil 360 px, LCP, blog EN, contraste, validación).
- v3.8: énfasis en programar sin IA (sobre mí, CV, línea de tiempo en Cómo trabajo); blog con buscador, etiquetas, índice, relacionados y 11 artículos (incluye cómo montar un media center con Jellyfin, enlazado desde la tarjeta de Selflix); sección "En vivo" = proyectos con campo `live` (notebook, rubik, selflix, cada uno con su caso de estudio; el resto de subdominios NO va).
- v3.9: blog bilingüe (EN en src/content/blog/en/, `translationOf`), orden (recientes/antiguos/A-Z/Z-A/corta), compartir, giscus opcional (variables PUBLIC_GISCUS_*), SEO reforzado. Siempre "WANT", nunca "la agencia". Ítems de stack traducibles.
- v3.10: foto del Sobre mí en 3 capas con parallax (scripts/build-photo-layers.py; `data-layers` en animations.ts).
- v3.11: Sobre mí resumido + página /sobre-mi/ con la historia (desde mediados de 2020: Derecho en la UMSS, Platzi, Linux/Arch, WANT, IA, hoy); "días programando"; Cómo trabajo = flujo general.
- v3.12: dibujos fine line a mano (src/data/sketches.ts + <Sketch>, anotaciones ==…== y ((…)) en profile.ts).
- v3.13: botón "volver arriba" (ToTop.astro, anillo de progreso) y marcas ==…==/((…)) también en el blog (plugin remark en src/lib/remark-marks.ts, requiere @astrojs/markdown-remark).
- Traspaso: docs/CONTINUAR.md + npm run verify (sept. 2026).
- v3.14: `doodle` por proyecto (galería, lista, En vivo, hero del caso) y <SketchFlight> (estela + dibujo con scroll) en varias secciones; CV con más proyectos (sigue en 2 páginas).
- v3.15: titular del hero nuevo, íconos en CV y ES/EN, botón volver arriba no tapa el footer.
- Flujo de publicación: Claude web sube a su rama y abre un PR a main; Rossmel lo aprueba en GitHub → Cloudflare publica. Antes de avisar, verificar que el PR siga ABIERTO: si ya se fusionó, abrir uno nuevo (los commits posteriores a un merge no aparecen solos).
- v3.16: botón de reducir movimiento en el header (junto al de tema; se guarda y recarga), arreglo del
  nombre del hero "trabado" en hard reload (se escondía hasta que animations.ts corría), y clamp() en
  los títulos con vw (hero, proyectos, contacto, 404) para que no se vean gigantes en monitores anchos
  (1920 px+): el tamaño no cambia hasta 1440 px, de ahí topa en el valor que ya tenía a 1440 px.
- v3.17: proyectos destacados accesibles sin el efecto de scroll fijo (reduced-motion o sin JS):
  `[data-track]` en Projects.astro pasa a `overflow-x-auto` + scroll-snap + `role="region"`/
  `tabindex="0"` por defecto en CSS; `initHorizontal()` solo le pone `overflow-x: hidden` mientras
  el pin de GSAP está activo.
- v3.18: dos bugs reales en el scroll de Proyectos con movimiento completo (el scroll se quedaba
  pegado al llegar a la sección, o quedaba en negro a mitad de camino). Causas y arreglo:
  (1) Lenis nunca se enteraba de que GSAP agrega miles de píxeles de alto con el pin-spacer →
  `ScrollTrigger.addEventListener('refresh', () => lenis.resize())` en `initLenis()`.
  (2) el `overflow-x-auto` de v3.17 estaba en `[data-track]`, el elemento que GSAP transforma — eso
  le impide crecer a su ancho de contenido real, así que el transform movía una caja angosta en vez
  de revelar las tarjetas. El scroll nativo accesible ahora va en la `<section data-horizontal>`
  (el track no lleva overflow). Probado con scroll real (rueda) en las 6 tarjetas, ida y vuelta,
  en ambos modos de movimiento.
- v3.19: tarjetas de Proyectos con `md:min-h-[3rem]` en la descripción (una con 2 líneas ya no
  "levanta" su imagen respecto a las vecinas, por el `md:items-center` de la fila); `min-w-0` en el
  bloque de texto para que ajuste línea en vez de desbordar. Las 4 tarjetas de Stack (`#stack`) usan
  el mismo efecto de invertir colores al hover que Workflow (`hover:bg-accent hover:text-accent-ink`
  + `group-hover` en ícono/pills), y las pills individuales suman su propio hover (lift + borde).
  Footer sin mencionar GSAP ("Hecho con Astro y mucho café."). Corregida una contradicción en "Mi
  historia": la home decía "mi propia versión" de rOS (ambiguo, sonaba a distro ya terminada) → ahora
  dice "mi propio flavor de Arch", igual que en rOS y en /sobre-mi (que ya aclaraba bien que todavía
  NO es una distro). También se sacó la frase repetida del hero ("cursos, documentación, prueba y
  error...") del párrafo "Cómo empezó" de /sobre-mi, reemplazada por una variante propia.
  Responsividad en tablet (768–1024px) revisada con capturas reales (Playwright): el diseño fluido
  basado en `vw`/`clamp()` ya se adapta bien ahí, incluido el scroll horizontal de Proyectos; no hizo
  falta ningún breakpoint nuevo.
- v3.20: 6ª sección "Fuera del código" en Mi historia (resultado de la entrevista de hobbies): cubos
  de Rubik (canal de Cuby, timer en rubik.rossmel.com), fútbol (divisiones menores de Wilstermann) y
  música/podcasts (José Madero, PXNDX, The Wild Project, con enlaces de búsqueda de Spotify — no existe
  embed genérico de "perfil"/stats en Spotify, solo track/álbum/artista/playlist/podcast puntuales).
  `Marked.astro` soporta `[texto](url)` como enlace real. Nuevo doodle compuesto `hobbies` (cubo +
  pelota + nota musical) en `sketches.ts`, mismo patrón que `linux` (Tux + logo de Arch).
- v3.21: `/sobre-mi/` rehecha (pedido de Rossmel): foto solo en la cabecera (ya no sticky); capítulos
  intercalados izq./der. que entran desde su costado (nuevo `data-slide` en animations.ts, el `main`
  lleva `overflow-x-clip`); cada capítulo tiene `doodles` en profile.ts (principal + 3 secundarios con
  parallax) y número grande de fondo; flechas `hook` entre capítulos. Se quitó "Mi camino" (`journey`).
  "Fuera del código" → 3 capítulos: Cubos de Rubik, Fútbol, Música y podcasts. Dibujos nuevos: timer,
  ball, goal, headphones, note, mic (se quitó el compuesto `hobbies`). La intro ya no dice "mi propia
  distro": rOS es "mi propio flavor de Arch" en todo el sitio.
- v3.22: selección de texto con tokens propios del tema (`--selection`), porque las páginas de proyecto
  pisan `--accent` (AdvAI = lima → ilegible en modo claro). Formulario de contacto: campo opcional
  WhatsApp/teléfono (validado; enlace wa.me, +591 si es celular boliviano sin prefijo) y aviso por
  Telegram (`TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`, bot propio, NO el de Clawdio): basta con que
  llegue por un canal para responder OK. Ver README → Formulario de contacto.
- v3.23: selector de país en el teléfono del formulario (Bolivia por defecto, `libphonenumber-js` solo en
  el build). `TELEGRAM_CHAT_ID` ya está en Pages (Production); falta que Rossmel pegue
  `TELEGRAM_BOT_TOKEN` (bot @rossmel_and_claude_bot) y redesplegar.
- v3.24: Notebook v3 + open source: ficha `notebook` reescrita (textos de `docs/HANDOFF-NOTEBOOK.md`, que no se commitea), enlace a GitHub, `featured: true`; artículo `notebook-apuntes-con-memoria` / `en/notebook-notes-with-memory` con capturas de la demo (datos ficticios) en `public/blog/notebook/` (primer artículo con imágenes: van en `public/blog/<tema>/` y se enlazan con Markdown). Homelab sin "gestión del hogar" (Grocy se eliminó). Tarjetas de Proyectos: `md:min-h-[4.5rem]` en la descripción (aguanta 3 líneas sin desalinear).
- v3.25: Proyectos destacados en celular = lista `[data-stack]` en Projects.astro (las tarjetas grandes son solo `md:`). `initStack()` en animations.ts la fija con ScrollTrigger (`pinSpacing: true` obligatorio: el padre es flex y GSAP no reserva el espacio por defecto) y activa un ítem por tramo de 18 % de pantalla con snap; CSS con `.is-live` / `[data-active]` (expande con `grid-template-rows`). Sin JS o con movimiento reducido: filas con descripción.
- v3.26: la lista fija móvil se generalizó: `initStack()` recorre todos los `[data-stack]` (Proyectos, Experiencia, Stack, Cómo trabajo) y **no fija** si con algún ítem abierto la lista supera `innerHeight - 96` (queda abierta en el flujo). No poner márgenes en el elemento `[data-stack]` (el pin los pierde): van en un contenedor. `initFocus()` = `[data-focus-item]` (scale/opacity con scrub, solo celular). En celular Experiencia no muestra las viñetas: cargo, resumen, tecnologías y enlace "Ver el detalle en mi CV".
- v3.27: ficha `manga` (textos de `docs/HANDOFF-MANGA.md`, sin commitear): nombre "Manga", dibujo nuevo `manga` en sketches.ts, acento `#ff7eb3`, `live: manga.rossmel.com` (sumado a la lista de subdominios visibles de CONTINUAR.md), `featured`/`cv` en false. "En vivo" pasa a `xl:grid-cols-4`. Homelab y Mi historia: 10 servicios públicos / una decena (verificado en el túnel el 2026-10-09: chat, admin, mcu, notebook, rubik, selflix, waitlist, spotify, perceptron, manga). Sin capturas: las sube Rossmel (nada de portadas comerciales ni URLs con clave de API).
- v3.29: ficha `transcribe` (CLI open source de transcripción local con faster-whisper, repo `ross_transcribe`, MIT): dibujo `mic`, acento `#cba6f7` (Catppuccin Mocha, el de la herramienta), `featured`/`cv` en false, sin `live`. Artículo `transcribe-transcripcion-local-en-la-terminal` / `en/transcribe-local-transcription-in-the-terminal` con los GIF de la demo en `public/blog/transcribe/` (audios de dominio público). Sin datos familiares: el origen se cuenta como "una nota de voz".
- v3.29: sin artículos fijados: se quitó `pinned` del esquema, de `blog.ts` y de "Programar antes y después de la IA" (ES/EN); el blog, la portada y el RSS van siempre por fecha.
- v3.30: artículo `mangas-13-gb-a-2-7-gb` / `en/manga-13-gb-to-2-7-gb` con la comparación real de formatos (sale de `herramientas/aligerar_cbz.py` del repo kavita-ros y de la medición de esa sesión). Sin nombres de series. El motivo de WebP sobre AVIF no quedó escrito en la sesión original: el artículo da los argumentos generales (soporte, decodificación, ~700 MB de diferencia); Rossmel puede corregirlo.
- v3.31: SGPG es repo privado desde 2026-10-11: ficha con `confidential: true`, sin `links`; README del perfil de GitHub (y su copia en `docs/github-profile/`) sin enlace.
- v3.32: ficha `genogramapp` (textos de `~/code/genograma-app/docs/03-portafolio.md`): proyecto a medida para una estudiante de Psicología, **sin nombrarla**, sin enlace a su web ni al repo (`confidential: true`), dibujo `genogram`, acento `#ffb6d5`, `featured`/`cv` en false. Capturas (familias inventadas) en el repo de la app (`docs/portafolio/`), para usar en los artículos.
- v3.33: tres artículos de GenogramApp (`genograma-que-se-dibuja-solo`, `ia-que-no-inventa-familias`, `boton-atras-de-android-en-capacitor` + EN), con capturas de `docs/portafolio/` del proyecto (solo familias inventadas) en `public/blog/genogramapp/`. Marcas ==…==/((…)) cortas (2–4 palabras): son `whitespace-nowrap` y una frase larga desborda en móvil (`npm run verify` no revisa todos los artículos).
- v3.34: destacados solo `advai`, `carx`, `sgpg` y `agua-potable`; `homelab`, `notebook` y `ros` con `featured: false` (pedido de Rossmel: el scroll se hacía largo).
- v3.35: `sketchPaths`/`trailPaths` recortan las coordenadas de rough.js a 1 decimal (`trim` en sketches.ts; −60 % de HTML en la portada). verify recorre todo el sitemap. `.prose a` y el código en línea usan `overflow-wrap: anywhere`. Regla: marcas ==…==/((…)) de 2–4 palabras, también en profile.ts (una larga en un `grid` ensancha toda la columna en celular).
- v3.36: campos `group` ('want' | 'clients' | 'own', obligatorio) y `short` (etiqueta corta para celular) en cada proyecto. Lista de no destacados en `ProjectRow.astro` (prop `nested` = fila dentro del `<details data-want>`, sin `data-reveal`/`data-focus-item` porque está oculta). Todo `<details>` hace `ScrollTrigger.refresh()` al abrirse/cerrarse (animations.ts). "En vivo" en celular = tira `overflow-x-auto` con snap (tarjetas al 80 %); desde `md:` grilla.
- Siguiente: capturas y video de AdvAI (Rossmel); GitHub/LinkedIn (docs/).
- Analítica: inyección automática de Cloudflare, sin token.
- Preguntas abiertas para Rossmel y decisiones por proyecto: `docs/PROYECTOS-CANDIDATOS.md`.
- Despliegue: Cloudflare Pages, proyecto `rossmel-portfolio` conectado a este repo (rama `main`). Ver README → Despliegue.
- Los PDF del CV se commitean (Cloudflare no los genera): tras cambiar contenido, `npm run build && npm run cv:pdf`.
- Este repo es PÚBLICO: no commitear detalles de la infraestructura (hosts, puertos, IPs, túneles).
