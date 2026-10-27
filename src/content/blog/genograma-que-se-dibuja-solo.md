---
title: 'Un genograma que se dibuja solo'
description: 'Cómo GenogramApp convierte personas, parejas y hogares en un dibujo ordenado por generaciones: el modelo de datos, el acomodo tipo Sugiyama y lo que todavía no resuelve.'
date: 2026-10-26
tags: ['react', 'typescript', 'algoritmos', 'svg']
project: 'genogramapp'
lang: 'es'
---

Un genograma es el mapa de una familia que se usa en psicología: cuadrados para los hombres, círculos para las mujeres, una línea para cada pareja, los hijos colgando debajo y, encima de todo eso, líneas de colores para las relaciones (cercana, hostil, distante…). La notación más usada es la de McGoldrick y Gerson.

Una estudiante de Psicología me contó cómo los hacía: a mano, en una hoja o en un programa de dibujo. El problema aparece cuando el caso avanza. Un hermano que nadie había mencionado, un segundo matrimonio del padre, una abuela que en realidad era la del otro lado. Cada dato nuevo obliga a rehacer medio dibujo.

Por eso GenogramApp parte de una regla: ==datos primero==, el dibujo después. Nadie arrastra símbolos. Se editan personas y parejas, y el genograma se vuelve a calcular entero cada vez.

![Un genograma de 17 personas en el teléfono: tres generaciones, varias parejas del padre, hogares y relaciones](/blog/genogramapp/genograma-movil.webp)

Todas las familias de este artículo son inventadas.

## El modelo de datos

Un caso tiene cuatro listas:

- **Personas**: sexo, edad o año de nacimiento, si falleció, ocupación, condiciones de salud, consumo de sustancias, y un tipo: persona, mascota, embarazo, aborto espontáneo, aborto inducido o muerte al nacer.
- **Uniones**: dos personas (o una, si el otro progenitor no se conoce), el tipo de pareja (matrimonio, convivencia, compromiso, separación, divorcio, viudez, amorío), los años y los hijos, cada uno con su vínculo: biológico, adoptado, de acogida o mascota.
- **Relaciones**: entre dos personas, con 34 tipos posibles y más de una a la vez.
- **Hogares**: quiénes viven juntos, con nombre y color.

La decisión más importante es que los hijos no cuelgan de una persona sino ==de una unión==. Así salen solos los medio hermanos: los hijos de Roberto con Marta y los de Roberto con Paola son dos uniones distintas que comparten a Roberto. Y "hermanos" no es un dato que se guarde: son quienes cuelgan de la misma unión.

## Paso 1: en qué fila va cada uno

Lo primero es la generación. Empiezo por el paciente índice (la persona por la que se arma el caso) y recorro la familia a lo ancho: una pareja queda en la misma fila, un hijo una fila más abajo y un padre una más arriba. Al final se corre todo para que la fila más alta sea la 0.

Suena trivial hasta que los datos se contradicen. Si alguien cargó por error que un tío y su sobrina son pareja, no hay fila que deje contentos a los dos. En vez de romperse, el dibujo los deja en sus filas y los une con una línea quebrada. Se ve raro a propósito: es una pista de que algo en los datos está mal.

## Paso 2: bloques de parejas

Dentro de cada fila, las personas unidas por pareja forman un bloque que se mueve junto. Los armo con union-find y después los pongo en línea:

- Dos personas: el hombre a la izquierda, como en la notación.
- Una persona con varias parejas: la primera pareja a la izquierda y las siguientes a la derecha, por fecha.
- Una cadena (A con B, B con C…): un recorrido desde el extremo con la unión más antigua.

Cuando alguien tiene varias parejas, cada línea de pareja va a una altura distinta, para que no se pisen. En la captura de arriba se ve con Roberto: un divorcio con Marta y una convivencia con Paola.

## Paso 3: el orden dentro de cada fila

Esta es la parte difícil. El orden inicial sale de recorrer los antepasados del paciente índice, primero el lado del padre. Así el lado paterno empieza a la izquierda y el materno a la derecha, que es como se lee un genograma.

Después vienen los barridos, a la manera del método de Sugiyama para dibujar grafos por capas:

- **Hacia abajo**: cada familia de hijos quiere quedar centrada debajo de sus padres.
- **Hacia arriba**: cada pareja quiere quedar centrada encima de sus hijos.

Son 20 vueltas de ida y vuelta, y una última hacia abajo. Dentro de una familia, los hermanos van de mayor a menor y las mascotas al final.

## Paso 4: colocar sin encimar

Cada bloque tiene una posición deseada (centrado bajo sus padres, por ejemplo), pero dos bloques no pueden ocupar el mismo lugar y el orden de la fila ya está decidido. Eso es un problema clásico: encontrar posiciones en orden creciente lo más cerca posible de las deseadas. Se resuelve con regresión isotónica, con el algoritmo *pool adjacent violators*: se recorre la fila y, cuando un bloque quiere estar a la izquierda del anterior, se fusionan y van al promedio de lo que querían.

Es corto (unas 15 líneas), exacto y rápido. Los hermanos quedan un poco más juntos entre sí que las familias distintas, para que se note dónde termina una y empieza la otra.

## Los detalles que hacen que se lea bien

Con eso ya hay un genograma, pero no uno que se lea a la primera. Lo que más trabajo dio fueron los detalles:

- **Barras de hermanos encimadas**: cuando dos familias vecinas tienen la barra de hijos a la misma altura y se tocan, una sube un escalón. Si una barra cruzaría la línea de bajada de otra familia, va más abajo.
- **Mascotas**: cuelgan después de los hijos, un poco más abajo y con línea de puntos, siguiendo a Rodríguez Ceberio y Díaz Videla (2020).
- **Hogares**: un contorno de puntos alrededor de quienes viven juntos, con su nombre.
- **Hoja con leyenda**: la vista para entregar dibuja solo los símbolos que aparecen en ese caso, y se exporta a imagen o PDF.

![La vista de hoja: el genograma con dos hogares, una mascota y una leyenda con solo los símbolos usados](/blog/genogramapp/hoja-leyenda.webp)

## Cómo sé que no se rompe

Con familias de verdad siempre aparece un caso que no imaginaste, así que las pruebas generan familias al azar: 320 de entre 1 y 80 personas, con parejas múltiples, hijos de otra unión y cruces raros. Para cada una se comprueba que el modelo sea válido, que nadie quede encima de nadie, que el SVG no tenga números rotos y que el acomodo de 80 personas tarde menos de 200 ms.

Ese generador también encontró un bug que no era del dibujo: la función que conectaba a una persona nueva podía dejar a alguien como hijo de su propia unión. Las pruebas cuentan cuántas veces pasaba con la versión vieja, y comprueban que la nueva nunca crea ciclos.

En escritorio, con más espacio, entra una familia extensa de 28 personas sin desplazarse:

![La versión web de escritorio con una familia extensa de 28 personas en tres generaciones](/blog/genogramapp/escritorio.webp)

## Lo que sigue enredado

Hay un caso que todavía no resuelvo bien: un hogar con miembros ((en dos generaciones)). Si la abuela vive con su hija y sus nietos, el contorno tiene que abarcar personas de filas distintas sin tragarse a los que no viven ahí, que están en medio. Hoy el contorno sale, pero en familias grandes se enreda. Probablemente la solución es dibujarlo como una forma por fila unida con un puente, en vez de un solo rectángulo.

También faltan gemelos, migración y poder reordenar hermanos a mano cuando la fecha de nacimiento no se conoce.

## Lo que aprendí

- Separar los datos del dibujo hace que corregir sea gratis: agregar un hermano olvidado cuesta un toque, no rehacer la hoja.
- Los algoritmos de grafos por capas existen hace décadas. No hizo falta inventar nada: hizo falta adaptarlos a las reglas de un genograma (parejas juntas, hijos de mayor a menor, lado paterno a la izquierda).
- Las pruebas con datos al azar encontraron más errores que todos los casos que armé a mano.
