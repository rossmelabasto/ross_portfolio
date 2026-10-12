---
title: 'Notebook: mis apuntes como un chat conmigo mismo, y ahora open source'
description: 'Empezó en dos días como un experimento para no perder los apuntes de la U. Dos meses después lo rehíce midiendo todo, lo dejé corriendo gratis y publiqué el código con licencia MIT.'
date: 2026-10-07
tags: ['ia', 'rag', 'open-source', 'node']
project: 'notebook'
lang: 'es'
---

Mis apuntes de la universidad vivían en cinco lugares a la vez: el cuaderno, fotos del pizarrón en la galería, notas de voz, el grupo de WhatsApp del curso y algún que otro archivo suelto. Antes de un parcial, encontrar "eso que dijo el profe sobre la mitosis" era más difícil que estudiarlo.

Lo que sí hacía bien era escribirme a mí mismo por WhatsApp: rápido, sin pensar en formato. Así nació **Notebook**: apuntes como un chat contigo mismo, pero con memoria. Escribes, pegas una foto o grabas un audio, y después le preguntas a tus apuntes en lenguaje normal.

![Un apunte en Notebook: mensajes, una foto del pizarrón transcrita y un mensaje destacado](/blog/notebook/desktop-dark.webp)

Esta es la historia de cómo pasó de experimento de fin de semana a un proyecto open source.

## La primera versión: dos días de agosto

La v1 la hice el 9 y 10 de agosto de 2026. Tenía lo justo:

- Cada apunte era un hilo de mensajes, organizado por materia.
- Las fotos del pizarrón se transcribían con un modelo de visión, así que su texto también se podía buscar.
- Un importador de chats de WhatsApp: cada mensaje con su hora original.
- Un primer RAG: los apuntes se partían en fragmentos, se convertían en embeddings y se buscaban con **sqlite-vec**, dentro del mismo archivo SQLite. Sin base vectorial aparte.

Lo hice liviano a propósito: Node.js con Express, un frontend sin framework y un servicio de systemd en vez de Docker, porque mi servidor casero tiene muy poca RAM. Funcionaba, la usaba a diario y otras personas empezaron a usarla también.

## Lo que no funcionaba (y no lo sabía)

Dos meses después me tocó mirarlo en serio y encontré varios problemas a la vez:

- **El chat estaba roto.** El proveedor que usaba se había quedado sin saldo y devolvía error. Y antes de eso, las respuestas tampoco ayudaban: las 3 respuestas guardadas que revisé decían "no tengo información sobre eso".
- **El corte de relevancia era un número copiado.** Había usado un valor "recomendado" en vez de uno medido con mis datos, y descartaba resultados buenos.
- **Los fragmentos partían los mensajes por la mitad.** Una pregunta podía encontrar el final de un mensaje sin su comienzo, y la respuesta salía sin sentido.

La lección fue directa: si no mides, no sabes si funciona.

## Rehacerlo midiendo primero

Antes de cambiar nada armé una evaluación automática: genera preguntas a partir de los propios apuntes y comprueba si la búsqueda encuentra el fragmento correcto. Solo imprime números, nunca el contenido de los apuntes.

Con eso como guía, el 7 de octubre rehíce el núcleo:

- **Fragmentos que respetan los mensajes completos**, con su fecha y quién lo escribió.
- **Búsqueda híbrida**: por significado (vectores con sqlite-vec) y por palabras exactas (FTS5 de SQLite), y las dos listas se combinan con *Reciprocal Rank Fusion*. Si alguien pregunta por una sigla o un nombre propio, la búsqueda por palabras lo encuentra aunque los vectores no.
- **Indexado incremental**: al agregar un mensaje solo se vuelve a procesar el último fragmento, no el apunte entero.
- **Corte de relevancia calibrado**: los resultados relevantes tenían similitud de 0,38 o más y los que no tenían relación, 0,37 o menos, así que el corte quedó en 0,30.

El resultado, medido con 30 preguntas sobre datos reales: el fragmento correcto aparece primero el 73 % de las veces y está entre los 6 primeros el ==93 % de las veces== (MRR de 0,80).

![Pregunta con la respuesta en vivo y sus fuentes: cada cita lleva al mensaje exacto](/blog/notebook/ask-dark.webp)

Encima de esa base vinieron las funciones que se notan al usarlo:

- **Respuestas en vivo** con Markdown y **citas que se pueden tocar**: llevan al mensaje exacto y resaltan la frase que usó la IA. El primer texto aparece en ~1,4 s y la respuesta completa en ~2 s.
- **Conversaciones con contexto**: una pregunta de seguimiento ("¿y la segunda fase?") se reescribe como pregunta completa antes de buscar.
- **Notas de voz** grabadas en la app o audios de WhatsApp, transcritos y buscables.
- **Búsqueda global con Ctrl+K**, sin importar tildes, también dentro de fotos y audios.

## Que estudiar sea parte de la app

Tener los apuntes ordenados está bien, pero lo que de verdad ayuda antes de un examen es repasarlos. Por eso agregué el **modo Estudiar**: a partir de un apunte o de una materia entera genera resúmenes, flashcards (voltear, mezclar, "me la sé") y quizzes de opción múltiple con la explicación de cada respuesta. Todo sale de lo que tú escribiste, no de internet.

![Un quiz generado a partir de los apuntes, con la explicación de la respuesta](/blog/notebook/study-light.webp)

## Gratis y fluido

Quería que correrlo no costara nada, así que toda la IA usa planes gratuitos:

- **Groq** (`gpt-oss-120b`) para el chat, y **Groq Whisper** para la voz.
- **Gemini** para los embeddings, para leer imágenes y como respaldo del chat.

Los planes gratuitos tienen límites, así que la app los respeta: va a un ritmo de unos 90 textos por minuto al indexar y reintenta según lo que pide cada API.

La otra obsesión fue que **escribir se sienta instantáneo**. Los mensajes aparecen apenas presionas Enter y se envían en orden en segundo plano, aunque la red sea lenta. El campo de texto nunca pierde el foco, los borradores sobreviven a recargar la página y, si se corta la conexión, los envíos se reintentan solos al volver. Ninguna animación mejoró tanto la experiencia como esa cola de envío.

También le di un diseño nuevo, tema claro y oscuro (con el mismo lima y violeta de este portafolio), interfaz en español e inglés, y una versión para celular con navegación abajo.

## Por qué abrir el código

Notebook resuelve un problema que tiene cualquier estudiante, y se puede instalar en una computadora vieja o una Raspberry Pi. Tenía sentido publicarlo. Pero abrirlo obliga a ordenar la casa:

- **Historial limpio**: el repositorio público empieza desde cero, sin datos personales ni rastros de mi infraestructura.
- **30 tests automáticos** con proveedores de IA falsos (corren sin internet) y CI en GitHub Actions.
- **Una revisión de seguridad**: corregí un acceso indebido a datos de otro usuario, agregué protección CSRF y una CSP estricta, las sesiones se guardan solo como hash, los archivos subidos se validan por su firma real y se sirven aislados, y el servidor solo escucha en localhost.
- **Documentación** para instalarlo en pocos comandos, en inglés y en español.

Lo publiqué con licencia **MIT** el 7 de octubre de 2026. Cuando no tienes sesión, [notebook.rossmel.com](https://notebook.rossmel.com) muestra una página con lo que hace, y el código está en [github.com/rossmelabasto/ross_notebook](https://github.com/rossmelabasto/ross_notebook).

## Lo que me llevo

1. **Medir antes de ajustar.** Sin la evaluación habría seguido "mejorando" a ciegas. Con ella, cada cambio tuvo un número detrás.
2. **La fluidez es arquitectura, no estilo.** La sensación de rapidez vino de una cola de envío y de no robar el foco, no del CSS.
3. **Elegir el stack según el hardware.** Descartar Docker y frameworks pesados hizo que todo quepa en un servidor chico sin sacrificar funciones.
4. **Abrir el código mejora el código.** Tests, seguridad y documentación que "algún día" iba a hacer, los hice porque otros iban a leerlo.

Si lo pruebas o te animas a instalarlo, me encantaría saber qué te parece.
