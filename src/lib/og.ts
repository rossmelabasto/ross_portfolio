import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Imagen para compartir de una página: `public/og/<ruta>.jpg` si existe (la genera `npm run og`
 * y se commitea, como los PDF del CV), si no la general `/og.png`. Se decide en el build.
 */
export function ogImagePath(pathname: string): string {
  const own = `/og${pathname.replace(/\/$/, '') || '/index'}.jpg`;
  return existsSync(join(process.cwd(), 'public', own)) ? own : '/og.png';
}
