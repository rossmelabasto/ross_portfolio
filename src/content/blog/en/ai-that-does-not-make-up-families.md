---
title: 'AI that does not make up families'
description: 'In GenogramApp the AI reads a case and proposes the genogram, but nothing goes in without a preview of what changes. The prompt, the two passes and the real mistakes it made along the way.'
date: 2026-10-26
tags: ['ai', 'llm', 'ux', 'typescript']
project: 'genogramapp'
lang: 'en'
translationOf: 'ia-que-no-inventa-familias'
---

GenogramApp has a button called "AI, do your thing". You type the case, dictate it or take photos of the pages, and the AI builds the genogram: people, couples, children, households, relationships and events.

It sounds like magic, and that is exactly the risk. A genogram is used to understand a family. If the AI puts an uncle where a brother should be, the drawing still looks neat and the mistake slips by. That is why the app's rule is that the AI proposes and ==the person decides==.

The examples in this article are made-up families.

## What I ask the AI for

The AI does not draw anything. It returns JSON with people, unions, relationships, households and events, and the app merges it into the case. The drawing is done by the usual layout engine (I wrote about it in [A genogram that draws itself](/en/blog/a-genogram-that-draws-itself/)).

The prompt starts with general rules that piled up as mistakes appeared:

- Never duplicate people. Existing ones are referenced by their exact id; new ones get references like "n1", "n2".
- Do not invent data: whatever the text does not say is left out.
- If the text comes from photos, ignore headers, teachers' names, the university and the bibliography. Only the family in the case.
- Every new person gets a name: their own, or a descriptive one like "Brother 1 of Jhonny" or "Paternal grandmother".

And one that looks small but helped a lot: before building the unions, ((write down the relationship)) of each person to the patient: "mother", "paternal grandfather", "father's current partner". It is a cheap way to make the model think about who is who before deciding which couple each child belongs to.

## Two passes instead of one

A class case can run several pages. Asking for everything at once mixed things up: the model focused on emotional relationships and left the structure half done, or the other way around.

Now a long text goes in two passes:

1. **Structure**: people, couples, children and households.
2. **Relationships, events and details**: with the people already created, using their ids.

The second pass receives the genogram the first one left, so it does not have to guess who "her sister" refers to. If the text is very long it is split into chunks, and each chunk does its two passes, knowing the earlier parts are already in the genogram.

Short texts (under 700 characters) go in a single pass. They are almost always corrections: "Carlos is not his father", "they are not actually distant". For that the JSON has a `remove` section with what to take out, besides what to add.

## The preview: what changes, not what is there

What the AI returns is never applied directly. The app computes the difference between the current genogram and the one that would result, and shows a sheet titled "Here is what I understood", split into sections:

- New people, with their age, occupation and conditions.
- Changes to people: only the fields that change.
- Couples, relationships, households and events being added or removed.
- And separately, in its own section, what is being removed from the genogram.

At the bottom there are two buttons: "Add to genogram" and "Back to editing". If the AI understood nothing useful, the add button is not even enabled.

Showing the difference instead of the full result was key. With 20 people on screen nobody checks all 20; with "3 new people, 1 change, 1 relationship removed" you review everything in seconds. And when something is about to be deleted, you see it.

## The real mistakes

These are mistakes I saw while testing with real cases, and what changed for each one.

### Brothers who were uncles

At first I used an open model on Groq. With sentences like "she lives with her mother and her 3 older brothers", it sometimes decided the brothers belonged to the mother, which makes them the patient's uncles. Grammatically you can read it that way; for a genogram it is a disaster.

I moved to Gemini as the main model, which in my tests got relationships right more often, and added an explicit rule about possessives: decide whose relative each person is from the patient's point of view. With that and the relationship rule, the full test I describe below got the whole family right.

### Age turning into a birth date

If the text says "Juan, 46", the model sometimes filled in the birth year by subtracting. It looks helpful, but it is made-up data: Juan could have been born in two different years, and the case may be old. In a genogram a birth year reads as a fact.

The prompt now forbids it, and the code does not trust it either: if the incoming birth year matches "current year minus age" (within one year), it is dropped. A rule in the prompt is a suggestion; a rule in the code is ==a guarantee==.

### Couples with odd types

Another recurring mistake: grandparents who had abandoned their children ended up marked as an "affair". The model mixed what happened in the family with the kind of couple. I did not fully fix it with the prompt; what makes it harmless is the preview, where each couple's type shows up before applying.

### When the quota runs out

Gemini's free tier gives about 20 requests per day per model. So the server tries a chain: two good models, then two "lite" models and finally Groq. If a model is overloaded or out of quota, it moves on to the next.

One day my own tests used up the good models and the case was built by a lite model. The people were right, but the children hung from the wrong couple. The interesting part is that it was fixed by typing a short correction, without redoing anything: that is what the single pass with `remove` is for.

## How it looks in practice

The most complete test used two photos of a class handout: OCR took 23 seconds, the AI 26, and the result was 18 people, 18 relationships and 2 households, all correct. On the phone, with fallbacks involved, the whole case took about a minute, and a typed correction about 6 seconds.

## Privacy

This is sensitive data about real families. In the first versions the AI key traveled inside the APK; I moved it to my server, which is the only thing that talks to Gemini or Groq. The phone only talks to the server.

## What I learned

- With LLMs, the interface matters as much as the prompt. A good preview makes mistakes bearable that no prompt fully removes.
- Every real mistake became a concrete rule. Generic rules ("be precise") change nothing.
- What is non-negotiable goes in the code, not in the prompt.
- Splitting the task into passes with accumulated context works better than one giant request.
