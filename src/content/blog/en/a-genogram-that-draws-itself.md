---
title: 'A genogram that draws itself'
description: 'How GenogramApp turns people, couples and households into a tidy drawing by generations: the data model, the Sugiyama-style layout and what it still does not solve.'
date: 2026-10-26
tags: ['react', 'typescript', 'algorithms', 'svg']
project: 'genogramapp'
lang: 'en'
translationOf: 'genograma-que-se-dibuja-solo'
---

A genogram is the family map used in psychology: squares for men, circles for women, a line for each couple, children hanging below and, on top of all that, colored lines for relationships (close, hostile, distant…). The most widely used notation is McGoldrick and Gerson's.

A psychology student told me how they made them: by hand, on paper or in a drawing program. The problem shows up as the case moves forward. A brother nobody had mentioned, the father's second marriage, a grandmother who turned out to be on the other side. Every new fact means redrawing half the page.

That is why GenogramApp starts from one rule: ==data first==, drawing second. Nobody drags symbols around. You edit people and couples, and the whole genogram is recalculated every time.

![A 17-person genogram on the phone: three generations, several partners of the father, households and relationships](/blog/genogramapp/genograma-movil.webp)

Every family in this article is made up.

## The data model

A case has four lists:

- **People**: sex, age or birth year, whether they died, occupation, health conditions, substance use, and a kind: person, pet, pregnancy, miscarriage, abortion or stillbirth.
- **Unions**: two people (or one, if the other parent is unknown), the kind of couple (marriage, cohabitation, engagement, separation, divorce, widowhood, affair), the years and the children, each with its link: biological, adopted, foster or pet.
- **Relationships**: between two people, with 34 possible types and more than one at a time.
- **Households**: who lives together, with a name and a color.

The most important decision is that children do not hang from a person but ==from a union==. Half-siblings come for free: Roberto's children with Marta and Roberto's children with Paola are two different unions that share Roberto. And "siblings" is not stored anywhere: they are whoever hangs from the same union.

## Step 1: which row each person goes in

The first thing is the generation. I start from the index patient (the person the case is about) and walk the family breadth-first: a partner stays in the same row, a child goes one row down and a parent one row up. At the end everything is shifted so the top row is 0.

It sounds trivial until the data contradicts itself. If someone mistakenly entered an uncle and his niece as a couple, there is no row that works for both. Instead of breaking, the drawing leaves them in their rows and joins them with a bent line. It looks odd on purpose: it is a hint that something in the data is wrong.

## Step 2: blocks of couples

Inside each row, people joined as couples form a block that moves together. I build them with union-find and then lay them out in a line:

- Two people: the man on the left, as the notation says.
- One person with several partners: the first partner on the left and the next ones on the right, by date.
- A chain (A with B, B with C…): a walk from the end with the oldest union.

When someone has several partners, each couple line sits at a different height so they do not overlap. You can see it with Roberto in the screenshot above: a divorce from Marta and cohabitation with Paola.

## Step 3: the order inside each row

This is the hard part. The initial order comes from walking the index patient's ancestors, father's side first. That way the paternal side starts on the left and the maternal side on the right, which is how a genogram is read.

Then come the sweeps, in the style of Sugiyama's method for drawing layered graphs:

- **Downwards**: each family of children wants to be centered under its parents.
- **Upwards**: each couple wants to be centered over its children.

That is 20 rounds back and forth, plus a final one downwards. Within a family, siblings go from oldest to youngest and pets go last.

## Step 4: placing without overlapping

Each block has a desired position (centered under its parents, for example), but two blocks cannot share a spot and the order of the row is already decided. That is a classic problem: find increasing positions as close as possible to the desired ones. It is solved with isotonic regression, using the *pool adjacent violators* algorithm: walk the row and, whenever a block wants to be left of the previous one, merge them and place them at the average of what they wanted.

It is short (about 15 lines), exact and fast. Siblings end up slightly closer to each other than different families, so you can tell where one ends and the next begins.

## The details that make it readable

With that you already have a genogram, but not one you can read at a glance. The details took the most work:

- **Overlapping sibling bars**: when two neighboring families have their children's bar at the same height and they touch, one moves up a step. If a bar would cross another family's drop line, it goes lower instead.
- **Pets**: they hang after the children, a bit lower and with a dotted line, following Rodríguez Ceberio and Díaz Videla (2020).
- **Households**: a dotted outline around the people who live together, with its name.
- **Sheet with legend**: the view meant for handing in only draws the symbols that appear in that case, and exports to image or PDF.

![The sheet view: the genogram with two households, a pet and a legend with only the symbols in use](/blog/genogramapp/hoja-leyenda.webp)

## How I know it does not break

Real families always bring a case you did not imagine, so the tests generate random families: 320 of them, between 1 and 80 people, with multiple partners, children from other unions and strange crossings. For each one they check that the model is valid, that nobody sits on top of anybody, that the SVG has no broken numbers and that laying out 80 people takes under 200 ms.

That generator also found a bug that was not in the drawing: the function that connected a new person could leave someone as a child of their own union. The tests count how often that happened with the old version, and check that the new one never creates cycles.

On desktop, with more room, an extended family of 28 people fits without scrolling:

![The desktop web version with an extended family of 28 people across three generations](/blog/genogramapp/escritorio.webp)

## What is still tangled

There is one case I still do not solve well: a household with members ((in two generations)). If a grandmother lives with her daughter and her grandchildren, the outline has to cover people in different rows without swallowing the ones in between who do not live there. Today the outline is drawn, but in large families it gets tangled. The fix is probably to draw one shape per row joined by a bridge, instead of a single rectangle.

Twins, migration and manually reordering siblings when the birth date is unknown are also missing.

## What I learned

- Separating data from drawing makes corrections free: adding a forgotten brother costs one tap, not redrawing the page.
- Layered graph algorithms have existed for decades. I did not need to invent anything; I needed to adapt them to a genogram's rules (couples together, siblings from oldest to youngest, paternal side on the left).
- Tests with random data found more bugs than all the cases I built by hand.
