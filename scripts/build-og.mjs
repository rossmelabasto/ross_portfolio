/**
 * Genera las imágenes que se ven al compartir un link (1200×630):
 *   - public/og.png: la general (portada, blog, sobre mí…). Sus textos están aquí.
 *   - public/og/<ruta>.jpg: una por proyecto y por artículo, con su color y su dibujo. Los datos
 *     salen de dist/og-pages.json (src/pages/og-pages.json.ts), así que corre después de `npm run build`.
 *     Solo crea las que faltan; `npm run og -- --all` las rehace todas (p. ej. si cambió un título).
 * Uso: npm run build && npm run og   (usa el mismo Chromium que cv:pdf). Las imágenes se commitean.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { chromium } from 'playwright-core';

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const pw = '/opt/pw-browsers';
  if (existsSync(pw)) for (const d of readdirSync(pw)) {
    const p = `${pw}/${d}/chrome-linux/chrome`;
    if (existsSync(p)) return p;
  }
  for (const bin of ['chromium', 'chromium-browser', 'google-chrome-stable', 'google-chrome']) {
    try { return execSync(`command -v ${bin}`).toString().trim(); } catch {}
  }
  throw new Error('No encontré Chromium. Define CHROMIUM_PATH.');
}

// Fuentes incrustadas en base64 (setContent no puede leer file://).
const font = (pkg, file) => `data:font/woff2;base64,${readFileSync(`node_modules/${pkg}/files/${file}`).toString('base64')}`;
const html = `<!doctype html><html><head><style>
@font-face { font-family: SG; src: url(${font('@fontsource-variable/space-grotesk', 'space-grotesk-latin-wght-normal.woff2')}); font-weight: 300 700; }
@font-face { font-family: JB; src: url(${font('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff2')}); }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #0a0a0b; color: #ededea; font-family: SG; position: relative; overflow: hidden; }
.glow { position: absolute; inset: 0; background:
  radial-gradient(60% 80% at 85% 10%, rgba(200,255,46,.35), transparent 60%),
  radial-gradient(50% 60% at 100% 100%, rgba(200,255,46,.12), transparent 70%); }
.wrap { position: absolute; inset: 64px; display: flex; flex-direction: column; justify-content: space-between; }
.k { font-family: JB; font-size: 22px; letter-spacing: .08em; text-transform: uppercase; color: #8a8a86; display: flex; align-items: center; gap: 14px; }
.dot { width: 14px; height: 14px; border-radius: 50%; background: #c8ff2e; }
h1 { font-size: 150px; line-height: .88; letter-spacing: -.045em; font-weight: 700; text-transform: uppercase; }
.row { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(237,237,234,.15); padding-top: 24px; }
.role { font-size: 34px; } .role b { color: #c8ff2e; font-weight: 600; }
.url { font-family: JB; font-size: 22px; color: #8a8a86; }
.logo { position: absolute; top: 64px; right: 64px; width: 150px; height: 150px; color: #c8ff2e; }
</style></head><body><div class="glow"></div>${readFileSync('src/assets/logo.svg', 'utf8').replace('<svg ', '<svg class="logo" ')}<div class="wrap">
<div class="k"><span class="dot"></span>Portfolio · Cochabamba, Bolivia</div>
<h1>Rossmel<br>Abasto</h1>
<div class="row"><div class="role">Frontend <b>→</b> Fullstack · IA</div><div class="url">portfolio.rossmel.com</div></div>
</div></body></html>`;

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og.png' });
console.log('✓ public/og.png');

// ---------- Una imagen por proyecto y por artículo ----------
const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const pageHtml = (d) => `<!doctype html><html><head><style>
@font-face { font-family: SG; src: url(${font('@fontsource-variable/space-grotesk', 'space-grotesk-latin-wght-normal.woff2')}); font-weight: 300 700; }
@font-face { font-family: JB; src: url(${font('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff2')}); }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #0a0a0b; color: #ededea; font-family: SG; position: relative; overflow: hidden; }
.glow { position: absolute; inset: 0; background:
  radial-gradient(60% 80% at 85% 10%, color-mix(in oklab, ${d.accent} 40%, transparent), transparent 60%),
  radial-gradient(50% 60% at 100% 100%, color-mix(in oklab, ${d.accent} 14%, transparent), transparent 70%); }
.wrap { position: absolute; inset: 64px; display: flex; flex-direction: column; justify-content: space-between; }
.k { font-family: JB; font-size: 22px; letter-spacing: .08em; text-transform: uppercase; color: #8a8a86; display: flex; align-items: center; gap: 14px; max-width: 760px; }
.dot { width: 14px; height: 14px; border-radius: 50%; background: ${d.accent}; flex: none; }
h1 { font-weight: 700; letter-spacing: -.04em; line-height: .95; max-width: 780px; }
.sub { margin-top: 22px; font-size: 30px; line-height: 1.25; color: #b9b9b4; max-width: 760px; }
.row { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(237,237,234,.15); padding-top: 24px; }
.who { font-size: 30px; display: flex; align-items: center; gap: 14px; } .who svg { width: 40px; height: 40px; color: #c8ff2e; }
.url { font-family: JB; font-size: 22px; color: #8a8a86; }
.doodle { position: absolute; right: 70px; top: 110px; width: 300px; height: 300px; color: ${d.accent}; transform: rotate(-6deg); }
</style></head><body><div class="glow"></div>
${d.doodle ? `<svg class="doodle" viewBox="${d.doodle.viewBox}" fill="none">${d.doodle.paths.map((p) => `<path d="${p}" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`).join('')}</svg>` : ''}
<div class="wrap">
<div class="k"><span class="dot"></span>${esc(d.kicker)}</div>
<div><h1>${esc(d.title)}</h1>${d.subtitle ? `<p class="sub">${esc(d.subtitle)}</p>` : ''}</div>
<div class="row"><div class="who">${readFileSync('src/assets/logo.svg', 'utf8')}Rossmel Abasto</div><div class="url">portfolio.rossmel.com</div></div>
</div></body></html>`;

if (!existsSync('dist/og-pages.json')) {
  console.log('· Falta dist/og-pages.json: corre `npm run build` antes para generar las imágenes por página');
} else {
  const all = process.argv.includes('--all');
  const pages = JSON.parse(readFileSync('dist/og-pages.json', 'utf8'));
  let made = 0;
  for (const d of pages) {
    const out = `public/og${d.path.replace(/\/$/, '')}.jpg`;
    if (!all && existsSync(out)) continue;
    await page.setContent(pageHtml(d), { waitUntil: 'load' });
    // Título lo más grande posible que quepa en su espacio (los de proyecto son cortos, los de artículos no)
    await page.evaluate(async () => {
      await document.fonts.ready;
      const h = document.querySelector('h1');
      const sub = document.querySelector('.sub');
      const max = sub ? 230 : 330;
      for (let size = sub ? 132 : 96; size >= 40; size -= 4) {
        h.style.fontSize = size + 'px';
        if (h.scrollHeight <= max && h.scrollWidth <= h.clientWidth) break;
      }
    });
    mkdirSync(dirname(out), { recursive: true });
    await page.screenshot({ path: out, type: 'jpeg', quality: 82 });
    made++;
  }
  console.log(`✓ public/og/: ${made} imágenes nuevas (${pages.length} páginas en total)`);
}
await browser.close();
