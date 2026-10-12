---
title: 'From 13 GB to 2.7 GB: choosing format and resolution for scanned manga'
description: 'A series of scanned manga weighed 800 MB per volume. I compared JPEG, WebP and AVIF on real pages, found the point where the screentone breaks down and brought it to a fifth of the size.'
date: 2026-10-10
tags: ['homelab', 'python', 'performance']
project: 'manga'
lang: 'en'
translationOf: 'mangas-13-gb-a-2-7-gb'
---

On my home server I run [Manga](/en/projects/manga/), my own manga reader: a library with covers, per-person reading progress and a phone app. Almost everything I uploaded went in without trouble, except one series: scanned PNGs of **about 800 MB per volume**, more than 3 MB per page.

On a computer you don't notice. On a phone, over mobile data, every page took a while to show up and a full volume ate a real chunk of the plan. It had to get lighter without anyone noticing while reading.

## What was in those files

Before touching anything I looked at what I had:

- **Grayscale** pages, from 1840×3200 to 2400×4164 pixels.
- Saved as **PNG**, a lossless format meant for graphics, not for photos of scanned paper.
- About 200 pages per volume, 16 volumes: **13 GB** in total.

My first idea was to recompress the PNGs without changing anything (losslessly). I tried it and it only saved between 26 % and 53 %: better than nothing, but still huge for reading on a phone.

## The comparison, on real pages

Instead of picking a format "because it's the modern one", I wrote a script that took real pages from the series and converted them to three formats at three resolutions (maximum height), measuring the size and time of each:

| Format and height | Size per page | Versus the original |
|---|---|---|
| Original (PNG) | 3273 KB | 100 % |
| JPEG 3200 px | 1633 KB | 50 % |
| JPEG 2400 px | 1010 KB | 31 % |
| **WebP 2400 px** | **686 KB** | **21 %** |
| AVIF 2400 px | 508 KB | 16 % |
| JPEG 2000 px | 732 KB | 22 % |
| WebP 2000 px | 503 KB | 15 % |
| AVIF 2000 px | 378 KB | 12 % |

Looking only at the table, the answer seemed obvious: AVIF at 2000 px, almost nine times lighter. But a number doesn't tell you how it looks.

## The deciding detail: screentone

Printed manga doesn't have real grays. Shadows and backgrounds are made with **screentone**: a grid of tiny black dots that the eye blends into gray from a distance. It's part of the drawing, and it's the first thing to suffer when you shrink an image.

I opened the same pages on a phone and zoomed in:

- At **2000 px**, the screentone was no longer dots: it had turned into a **blurry gray**. Reading straight through you barely notice, but with zoom (which you do all the time on a phone) it looked washed out.
- At **2400 px**, the dots were still there. And since that height already more than covers any phone screen, more resolution added nothing visible.

So the resolution was set at **2400 px**: the lowest point where the screentone survives.

## WebP instead of AVIF

At 2400 px, AVIF was 26 % lighter than WebP. I still chose **WebP at quality 85**, for a few reasons:

- WebP has been supported for years in browsers, readers and comic apps; AVIF is newer and its support is still more uneven.
- AVIF is more expensive to decode, and that shows when flipping pages quickly on a mid-range phone.
- It was also somewhat slower to encode in my tests.
- Across the whole series, the estimated difference was about 700 MB. A reader that runs smoothly everywhere was worth more than that last bit of savings.

## The script

The conversion is done by a Python script with Pillow, running in parallel to use every core:

- It keeps the page in **grayscale** if it already was: saving it in color would mean paying for channels it doesn't use.
- If the page is taller than 2400 px, it scales it down with a high-quality filter (Lanczos), keeping the aspect ratio.
- If the WebP version is heavier than the original (it happens with nearly blank pages), it **keeps the original**.
- It writes a new CBZ and never touches the original.

Then a second script compares every volume with its original: same number of pages, and every one of them opens. It checked all **3,280 pages** without a single error.

## The result

The series went from **13 GB to 2.7 GB (−79 %)**, about 840 KB per page. Reading on a phone I can't tell it apart from the original, and pages show up instantly. The originals are still stored separately in case I ever need them.

The rest of the library didn't need recompressing: the PDFs I had were, inside, one image per page, so the upload script extracts those images as they are, without re-encoding them. The 72 volumes that came as PDFs were converted with no quality loss at all.

## What I'm taking away

1. **Measure with real data, not internet examples.** "WebP is X % smaller" figures don't help if your images are grayscale scans full of screentone.
2. **The smallest number doesn't always win.** AVIF at 2000 px won on the table and lost where it matters: while reading.
3. **Look for the threshold, not the extreme.** What helped was finding the exact point where quality breaks (between 2000 and 2400 px) and staying just above it.
4. **Never recompress without a way back.** Keeping the originals and an automatic check made the change safe.
