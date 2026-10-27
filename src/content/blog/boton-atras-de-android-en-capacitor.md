---
title: 'El botón atrás de Android en una app con Capacitor'
description: 'En una app web empaquetada con Capacitor, el botón atrás de Android no cierra la hoja abierta: cierra la app. Así lo resolví en GenogramApp con una pila de capas atada al historial.'
date: 2026-10-26
tags: ['android', 'capacitor', 'react', 'frontend']
project: 'genogramapp'
lang: 'es'
---

GenogramApp es una app web (React + Vite) que se empaqueta para Android con Capacitor. Casi todo funciona igual que en el navegador, salvo un detalle que en Android se nota enseguida: ==el botón atrás==.

En un teléfono, "atrás" es un reflejo. Si hay una hoja abierta, se espera que se cierre. Si estás en la ficha de una persona, que vuelvas al genograma. Y solo cuando ya no queda nada, que la app se vaya al fondo.

En la primera versión no pasaba nada de eso.

## Por qué no funcionaba

La app no tiene rutas. Las pantallas (lista de casos, genograma, ficha de una persona) y las hojas que suben desde abajo (agregar persona, IA, exportar) son estado de React. Para el WebView, todo es una sola página: no hay historial al que volver.

Y el botón atrás de Android no es el del navegador. Capacitor lo entrega como un evento nativo, y si no hay nada escuchándolo y el WebView no tiene a dónde volver, la app se cierra. Resultado: abrías la ficha de alguien, apretabas atrás y perdías la app entera.

La solución obvia sería meter un router. Pero con hojas encima de pantallas, encima de otras hojas, lo que necesitaba no era una URL por pantalla, sino algo más simple: saber qué está encima de qué y ((cerrarlo en orden)).

## Una pila de capas

Cada cosa que se puede cerrar con atrás es una capa. Cuando se abre una, se apila su función para cerrarla y se agrega una entrada al historial con la profundidad de la pila:

```ts
const stack: (() => void)[] = []

export function openLayer(onClose: () => void) {
  stack.push(onClose)
  history.pushState({ depth: stack.length }, '')
}
```

Cuando el historial retrocede, el navegador avisa con `popstate`. Ahí no se cierra "una capa", sino todas las que sobran según la profundidad de la entrada a la que se volvió:

```ts
window.addEventListener('popstate', (e) => {
  const depth = e.state?.depth ?? 0
  while (stack.length > depth) stack.pop()!()
})
```

Esto parece un detalle, pero es lo que hace que todo sea robusto. Si el usuario aprieta atrás tres veces muy rápido, o si la app hace `history.go(-2)`, la pila siempre termina del tamaño correcto. No hay que contar eventos.

Y el botón de Android solo tiene que traducirse a historial:

```ts
App.addListener('backButton', () => {
  if (stack.length) history.back()
  else App.minimizeApp()
})
```

Cuando ya no quedan capas, la app se minimiza en vez de cerrarse. Así, si vuelves a abrirla, sigue donde estaba, como cualquier app de Android.

## Una sola fuente de verdad

La regla que más me costó aprender: los botones de la interfaz ==tampoco cierran nada== directamente. "Listo", "Eliminar" o la flecha de volver no llaman a la función de cierre; piden retroceder en el historial:

```ts
export function closeLayer(n = 1) {
  const k = Math.min(n, stack.length)
  if (k) history.go(-k)
}
```

El cierre real siempre pasa por `popstate`. Si un botón cerrara la hoja por su cuenta, la entrada del historial quedaría ahí, y el siguiente atrás no haría nada visible. Con una sola puerta de salida, el historial y la pila nunca se desincronizan.

El parámetro `n` sirve para cerrar varias capas de una vez. La guía de bienvenida, por ejemplo, termina con `closeLayer(2)`.

## Los bordes

Con eso funcionaba, hasta que aparecieron los casos raros.

**El doble toque.** `history.go()` es asíncrono: el `popstate` llega un momento después. Si alguien tocaba "Listo" dos veces rápido, la segunda llamada retrocedía otra vez y cerraba también la pantalla de abajo. La solución fue una marca de "cerrando": mientras el navegador procesa un retroceso pedido por la app, los demás cierres se ignoran. La marca se limpia al llegar el `popstate` o, por si el navegador nunca avisa, a los 800 ms.

**Atrás y adelante seguidos.** El error más difícil de encontrar: hacer `history.back()` y justo después `pushState()`. Como el retroceso es asíncrono, el `pushState` se ejecuta antes, y cuando por fin llega el retroceso deshace la entrada equivocada. La regla quedó escrita en el código: nunca retroceder y apilar en el mismo paso.

**Reemplazar en vez de apilar.** La hoja "Nuevo caso", al guardarse, se convierte en la pantalla del caso. No tiene sentido cerrar una capa y abrir otra (sería justo el problema anterior), así que hay una función que cambia qué hace la capa de arriba al cerrarse, sin tocar el historial.

**Recargar la página.** En la web, al recargar, el navegador conserva el `state` de la entrada actual (por ejemplo, profundidad 2), pero la app arranca en el inicio con la pila vacía. Por eso, al cargar, la entrada actual se reescribe con profundidad 0.

## De regalo: Esc en la web

Como todo pasa por el historial, la versión web obtuvo el mismo comportamiento gratis: el botón atrás del navegador cierra hojas. Y agregué que Esc cierre la capa de arriba, salvo que estés escribiendo en un campo con texto, para no perder lo escrito por un reflejo.

## Lo que aprendí

- En Capacitor, las convenciones de Android no vienen solas: hay que implementarlas. El botón atrás es la más visible.
- Guardar la profundidad en cada entrada del historial, en vez de contar eventos, hace que el sistema se corrija solo.
- Toda forma de cerrar tiene que pasar por la misma puerta. Dos caminos de salida terminan desincronizados.
- Hay que probarlo en un teléfono de verdad, apretando atrás como lo haría alguien apurado.
