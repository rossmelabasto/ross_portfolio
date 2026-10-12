---
title: 'De 13 GB a 2,7 GB: cómo elegí formato y resolución para mangas escaneados'
description: 'Una serie de mangas escaneados pesaba 800 MB por tomo. Comparé JPEG, WebP y AVIF con páginas reales, encontré el límite donde la trama de puntos se arruina y la dejé en una quinta parte del tamaño.'
date: 2026-10-10
tags: ['homelab', 'python', 'rendimiento']
project: 'manga'
lang: 'es'
---

En mi servidor casero tengo [Manga](/proyectos/manga/), mi propio lector de mangas: una biblioteca con portadas, progreso de lectura por persona y app en el celular. Casi todo lo que subí entró sin problema, pero una serie no: eran escaneos en PNG de **unos 800 MB por tomo**, más de 3 MB por página.

En la computadora eso no se nota. En el celular, con datos móviles, cada página tardaba en aparecer y un tomo entero se comía una parte importante del plan. Había que aligerarla sin que se notara al leer.

## Qué había en esos archivos

Antes de tocar nada miré qué tenía entre manos:

- Páginas en **escala de grises**, de 1840×3200 a 2400×4164 píxeles.
- Guardadas como **PNG**, un formato sin pérdida pensado para gráficos, no para fotos de papel escaneado.
- Unas 200 páginas por tomo, 16 tomos: **13 GB** en total.

La primera idea fue recomprimir los PNG sin cambiar nada (sin pérdida). Lo probé y ahorraba solo entre 26 % y 53 %: mejor que nada, pero seguía siendo enorme para leer en el celular.

## La comparación, con páginas reales

En vez de elegir un formato "porque es el moderno", armé un script que tomaba páginas reales de la serie y las convertía a tres formatos y tres resoluciones (alto máximo), midiendo el peso y el tiempo de cada una:

| Formato y alto | Peso por página | Respecto del original |
|---|---|---|
| Original (PNG) | 3273 KB | 100 % |
| JPEG 3200 px | 1633 KB | 50 % |
| JPEG 2400 px | 1010 KB | 31 % |
| **WebP 2400 px** | **686 KB** | **21 %** |
| AVIF 2400 px | 508 KB | 16 % |
| JPEG 2000 px | 732 KB | 22 % |
| WebP 2000 px | 503 KB | 15 % |
| AVIF 2000 px | 378 KB | 12 % |

Con solo mirar la tabla, la respuesta parecía obvia: AVIF a 2000 px, casi nueve veces más liviano. Pero un número no te dice cómo se ve.

## El detalle que decide: la trama de puntos

Los mangas impresos no tienen grises de verdad. Las sombras y los fondos se hacen con **trama**: una grilla de puntos negros diminutos que, de lejos, el ojo mezcla como gris. Es parte del dibujo, y es lo primero que sufre al achicar una imagen.

Abrí las mismas páginas en el celular y les hice zoom:

- A **2000 px**, la trama ya no eran puntos: se había vuelto un **gris borroso**. Al leer de corrido casi no se nota, pero con zoom (que en el celular se hace todo el tiempo) se veía lavado.
- A **2400 px**, los puntos seguían ahí. Y como ese alto ya cubre de sobra la pantalla de cualquier celular, más resolución no aportaba nada visible.

Así que la resolución quedó en **2400 px**: el punto más bajo en el que la trama sobrevive.

## WebP en vez de AVIF

A 2400 px, AVIF pesaba un 26 % menos que WebP. Aun así elegí **WebP con calidad 85**, por varias razones:

- WebP lleva muchos años con soporte en navegadores, lectores y apps de cómics; AVIF es más nuevo y su soporte todavía es más desparejo.
- Decodificar AVIF cuesta más, y eso se nota al pasar páginas rápido en un celular de gama media.
- Codificarlo también fue algo más lento en mis pruebas.
- En la serie completa, la diferencia estimada era de unos 700 MB. Un lector que va fluido en cualquier lado valía más que ese último ahorro.

## El script

La conversión la hace un script en Python con Pillow, en paralelo para aprovechar todos los núcleos:

- Mantiene la página en **escala de grises** si ya lo era: guardarla en color sería pagar por canales que no usa.
- Si la página mide más de 2400 px de alto, la reduce con un filtro de buena calidad (Lanczos), sin cambiar la proporción.
- Si la versión WebP pesa más que el original (pasa con páginas casi en blanco), **deja el original**.
- Escribe un CBZ nuevo, sin tocar el original.

Después, otro script compara cada tomo con su original: mismo número de páginas y todas se pueden abrir. Revisó las **3280 páginas** sin un solo error.

## El resultado

La serie pasó de **13 GB a 2,7 GB (−79 %)**, unos 840 KB por página. Al leer en el celular no noto diferencia con el original, y las páginas aparecen al instante. Los originales siguen guardados aparte por si algún día los necesito.

Para el resto de la biblioteca no hizo falta recomprimir: los PDF que tenía eran, por dentro, una imagen por página, así que el script de subida extrae esas imágenes tal cual, sin volver a comprimirlas. Los 72 tomos que venían en PDF quedaron convertidos sin perder nada de calidad.

## Lo que me llevo

1. **Medir con datos reales, no con ejemplos de internet.** Los porcentajes de "WebP pesa X % menos" no sirven si tus imágenes son escaneos en gris con trama.
2. **El número más chico no siempre gana.** AVIF a 2000 px ganaba en la tabla y perdía donde importa: al leer.
3. **Buscar el umbral, no el extremo.** Lo útil fue encontrar el punto exacto en el que la calidad se rompe (entre 2000 y 2400 px) y quedarme justo arriba.
4. **Nunca recomprimir sin poder volver atrás.** Originales guardados y una verificación automática hicieron que el cambio fuera seguro.
