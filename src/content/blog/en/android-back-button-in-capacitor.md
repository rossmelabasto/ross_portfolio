---
title: 'The Android back button in a Capacitor app'
description: 'In a web app packaged with Capacitor, the Android back button does not close the open sheet: it closes the app. This is how I solved it in GenogramApp with a layer stack tied to the history.'
date: 2026-10-26
tags: ['android', 'capacitor', 'react', 'frontend']
project: 'genogramapp'
lang: 'en'
translationOf: 'boton-atras-de-android-en-capacitor'
---

GenogramApp is a web app (React + Vite) packaged for Android with Capacitor. Almost everything works the same as in the browser, except one detail you notice right away on Android: ==the back button==.

On a phone, "back" is a reflex. If a sheet is open, you expect it to close. If you are on a person's card, you expect to return to the genogram. And only when there is nothing left should the app go to the background.

In the first version none of that happened.

## Why it did not work

The app has no routes. The screens (case list, genogram, a person's card) and the sheets that slide up from the bottom (add person, AI, export) are React state. For the WebView it is all a single page: there is no history to go back to.

And the Android back button is not the browser's. Capacitor delivers it as a native event, and if nothing is listening and the WebView has nowhere to go back to, the app closes. The result: you opened someone's card, pressed back and lost the whole app.

The obvious fix would be adding a router. But with sheets on top of screens on top of other sheets, what I needed was not a URL per screen, but something simpler: knowing what sits on top of what, and ((closing it in order)).

## A layer stack

Everything that can be closed with back is a layer. When one opens, its close function is pushed onto a stack and a history entry is added with the stack's depth:

```ts
const stack: (() => void)[] = []

export function openLayer(onClose: () => void) {
  stack.push(onClose)
  history.pushState({ depth: stack.length }, '')
}
```

When the history goes back, the browser fires `popstate`. That is where, instead of closing "one layer", it closes every layer left over according to the depth of the entry it returned to:

```ts
window.addEventListener('popstate', (e) => {
  const depth = e.state?.depth ?? 0
  while (stack.length > depth) stack.pop()!()
})
```

It looks like a detail, but it is what makes everything robust. If the user presses back three times very fast, or the app calls `history.go(-2)`, the stack always ends up the right size. No event counting needed.

And the Android button only has to be translated into history:

```ts
App.addListener('backButton', () => {
  if (stack.length) history.back()
  else App.minimizeApp()
})
```

When no layers are left, the app is minimized instead of closed. That way, if you open it again, it is where you left it, like any Android app.

## A single source of truth

The rule that took me longest to learn: the UI buttons ==do not close anything== directly either. "Done", "Delete" or the back arrow do not call the close function; they ask the history to go back:

```ts
export function closeLayer(n = 1) {
  const k = Math.min(n, stack.length)
  if (k) history.go(-k)
}
```

The actual closing always goes through `popstate`. If a button closed the sheet on its own, the history entry would stay there, and the next back would do nothing visible. With a single way out, the history and the stack never drift apart.

The `n` parameter closes several layers at once. The welcome guide, for example, ends with `closeLayer(2)`.

## The edge cases

With that it worked, until the odd cases showed up.

**The double tap.** `history.go()` is asynchronous: `popstate` arrives a moment later. If someone tapped "Done" twice quickly, the second call went back again and also closed the screen underneath. The fix was a "closing" flag: while the browser is processing a back requested by the app, other closes are ignored. The flag is cleared when `popstate` arrives or, in case the browser never reports it, after 800 ms.

**Back and forward in a row.** The hardest bug to find: calling `history.back()` and right after that `pushState()`. Since going back is asynchronous, the `pushState` runs first, and when the back finally lands it undoes the wrong entry. The rule is now written in the code: never go back and push in the same step.

**Replacing instead of pushing.** The "New case" sheet, once saved, turns into the case screen. Closing one layer and opening another makes no sense (it would be exactly the previous problem), so there is a function that changes what the top layer does when closed, without touching the history.

**Reloading the page.** On the web, after a reload the browser keeps the current entry's `state` (say, depth 2), but the app starts at home with an empty stack. So on load, the current entry is rewritten with depth 0.

## A bonus: Esc on the web

Since everything goes through the history, the web version got the same behavior for free: the browser's back button closes sheets. I also made Esc close the top layer, unless you are typing in a field with text, so a reflex does not wipe what you wrote.

## What I learned

- In Capacitor, Android conventions do not come for free: you have to implement them. The back button is the most visible one.
- Storing the depth in every history entry, instead of counting events, makes the system correct itself.
- Every way of closing has to go through the same door. Two exit paths end up out of sync.
- You have to test it on a real phone, pressing back the way someone in a hurry would.
