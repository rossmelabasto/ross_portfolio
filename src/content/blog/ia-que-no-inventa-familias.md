---
title: 'IA que no inventa familias'
description: 'En GenogramApp la IA lee el relato de un caso y propone el genograma, pero nada entra sin pasar por una vista previa con lo que cambia. El prompt, las dos pasadas y los errores reales que fue cometiendo.'
date: 2026-10-26
tags: ['ia', 'llm', 'ux', 'typescript']
project: 'genogramapp'
lang: 'es'
---

En GenogramApp hay un botón que se llama "IA haz lo tuyo". Se escribe el caso, se dicta o se le sacan fotos a las hojas, y la IA arma el genograma: personas, parejas, hijos, hogares, relaciones y sucesos.

Suena a magia, y justo ahí está el riesgo. Un genograma se usa para entender a una familia. Si la IA pone a un tío donde iba un hermano, el dibujo sigue viéndose prolijo y el error pasa de largo. Por eso la regla de la app es que la IA propone y ==la persona decide==.

Los ejemplos de este artículo son familias inventadas.

## Qué le pido a la IA

La IA no dibuja nada. Devuelve un JSON con personas, uniones, relaciones, hogares y sucesos, y la app lo mezcla con el caso. El dibujo lo hace el motor de layout de siempre (lo conté en [Un genograma que se dibuja solo](/blog/genograma-que-se-dibuja-solo/)).

El prompt empieza con reglas generales que se fueron sumando a medida que aparecían errores:

- Nunca duplicar personas. Las que ya existen se nombran con su id exacto; las nuevas llevan referencias como "n1", "n2".
- No inventar datos: lo que el texto no dice, se omite.
- Si el texto viene de fotos, ignorar encabezados, nombres de docentes, la universidad y la bibliografía. Solo la familia del caso.
- Toda persona nueva lleva nombre: el propio, o uno descriptivo como "Hermano 1 de Jhonny" o "Abuela paterna".

Y una que parece pequeña pero ayudó mucho: antes de armar las uniones, ((escribir el parentesco)) de cada persona con el paciente: "madre", "abuelo paterno", "pareja actual del padre". Es una forma barata de obligar al modelo a pensar en quién es quién antes de decidir quién es hijo de qué pareja.

## Dos pasadas en vez de una

Un caso de clase puede ser de varias páginas. Pedir todo de una vez mezclaba las cosas: el modelo se concentraba en las relaciones emocionales y dejaba a medias la estructura, o al revés.

Ahora un texto largo va en dos pasadas:

1. **Estructura**: personas, parejas, hijos y hogares.
2. **Relaciones, sucesos y detalles**: con las personas ya creadas, usando sus ids.

La segunda pasada recibe el genograma que dejó la primera, así que no tiene que adivinar a quién se refiere "su hermana". Si el texto es muy largo se parte en trozos y cada trozo hace sus dos pasadas, sabiendo que lo anterior ya está en el genograma.

Los textos cortos (menos de 700 caracteres) van en una sola pasada. Son casi siempre correcciones: "Carlos no es su padre", "en realidad no son distantes". Para eso el JSON tiene una sección `remove` con lo que hay que quitar, además de lo que hay que agregar.

## La vista previa: lo que cambia, no lo que hay

Lo que devuelve la IA nunca se aplica directo. La app calcula la diferencia entre el genograma actual y el que quedaría, y muestra una hoja titulada "Esto entendí", dividida en secciones:

- Personas nuevas, con su edad, ocupación y condiciones.
- Cambios en personas: solo los campos que cambian.
- Parejas, relaciones, hogares y sucesos que se agregan o se quitan.
- Y aparte, en su propia sección, lo que se quita del genograma.

Abajo hay dos botones: "Agregar al genograma" y "Volver a editar". Si la IA no entendió nada útil, el botón de agregar ni se activa.

Mostrar la diferencia en vez del resultado completo fue clave. Con 20 personas en pantalla nadie revisa las 20; con "3 personas nuevas, 1 cambio, se quita 1 relación" se revisa todo en segundos. Y cuando algo se va a borrar, se ve.

## Los errores reales

Estos son errores que vi en pruebas con casos de verdad, y lo que cambió por cada uno.

### Hermanos que eran tíos

Al principio usaba un modelo abierto en Groq. Con frases como "vive con su madre y sus 3 hermanos mayores", a veces decidía que los hermanos eran de la madre, o sea tíos del paciente. Gramaticalmente se puede leer así; para un genograma es un desastre.

Pasé a Gemini como modelo principal, que en mis pruebas armaba mejor los parentescos, y agregué una regla explícita sobre posesivos: decidir de quién es cada pariente pensando en el paciente. Con eso y la regla del parentesco, la prueba completa que cuento más abajo sacó bien a toda la familia.

### La edad que se volvía fecha de nacimiento

Si el texto dice "Juan, de 46 años", el modelo a veces completaba el año de nacimiento restando. Parece útil, pero es un dato inventado: Juan pudo nacer en dos años distintos, y el caso puede ser de hace tiempo. En un genograma un año de nacimiento se lee como un hecho.

El prompt ahora lo prohíbe, y además el código no confía: si el año de nacimiento que llega coincide (con un margen de un año) con "año actual menos edad", se descarta. Una regla en el prompt es una sugerencia; una regla en el código es ==una garantía==.

### Parejas con tipos raros

Otro error recurrente: unos abuelos que habían abandonado a sus hijos terminaban marcados como "amorío". El modelo mezclaba lo que pasó en la familia con el tipo de pareja. No lo resolví del todo con el prompt; lo que lo hace inofensivo es la vista previa, donde el tipo de cada pareja aparece antes de aplicar.

### Cuando se acaba la cuota

La capa gratis de Gemini da unas 20 consultas por día por modelo. Así que el servidor prueba una cadena: dos modelos buenos, después dos modelos "lite" y al final Groq. Si un modelo está saturado o sin cuota, pasa al siguiente.

Un día mis pruebas agotaron los modelos buenos y el caso lo armó un modelo lite. Las personas estaban bien, pero los hijos colgaban de la pareja equivocada. Lo interesante es que se arregló escribiéndole una corrección corta, sin rehacer nada: para eso sirve la pasada única con `remove`.

## Cómo se ve funcionando

La prueba más completa fue con dos fotos de una hoja de clase: el OCR tardó 23 segundos, la IA 26, y el resultado fueron 18 personas, 18 relaciones y 2 hogares, todos correctos. En el teléfono, con respaldos de por medio, el caso completo tardó alrededor de un minuto, y una corrección escrita, unos 6 segundos.

## Privacidad

Son datos sensibles de familias reales. En las primeras versiones la clave de la IA viajaba dentro del APK; la saqué a mi servidor, que es el único que habla con Gemini o Groq. El teléfono solo habla con el servidor.

## Lo que aprendí

- Con LLMs, la interfaz importa tanto como el prompt. Una buena vista previa vuelve tolerables errores que ningún prompt elimina del todo.
- Cada error real se convirtió en una regla concreta. Las reglas genéricas ("sé preciso") no cambian nada.
- Lo que no se puede negociar va en el código, no en el prompt.
- Dividir la tarea en pasadas con contexto acumulado funciona mejor que un único pedido gigante.
