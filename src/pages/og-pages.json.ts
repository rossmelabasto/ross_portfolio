import { visibleProjects, type Lang } from '../data/profile';
import { getPosts, postUrl } from '../data/blog';
import { paths, t } from '../data/i18n';
import { sketchPaths, stripMarks } from '../data/sketches';

/**
 * Datos para las imágenes de compartir por página (proyectos y artículos). Lo lee
 * `scripts/build-og.mjs` desde dist/ después del build; no lo usa el sitio.
 */
const DEFAULT_ACCENT = '#c8ff2e';

export async function GET() {
  const pages = [];
  for (const lang of ['es', 'en'] as Lang[]) {
    const s = t(lang);
    for (const p of visibleProjects) {
      pages.push({
        path: paths.project(lang, p.slug),
        kicker: `${p.kind[lang]} · ${p.year}`,
        title: p.name,
        subtitle: stripMarks(p.tagline[lang]),
        accent: p.accent,
        doodle: p.doodle ? sketchPaths(p.doodle, 5) : null,
      });
    }
    for (const post of await getPosts(lang)) {
      const proj = visibleProjects.find((p) => p.slug === post.data.project);
      pages.push({
        path: postUrl(post),
        kicker: `${s.blog.kicker} · ${post.data.date.toISOString().slice(0, 10)}`,
        title: stripMarks(post.data.title),
        subtitle: '',
        accent: proj?.accent ?? DEFAULT_ACCENT,
        doodle: sketchPaths(proj?.doodle ?? 'pencil', 5),
      });
    }
  }
  return new Response(JSON.stringify(pages), { headers: { 'Content-Type': 'application/json' } });
}
