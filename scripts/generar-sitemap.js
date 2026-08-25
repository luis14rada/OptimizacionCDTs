/**
 * Genera public/sitemap.xml a partir de src/rutas.js -- la misma fuente de
 * verdad que usa App.jsx para las URLs de cada pestaña. Corre antes del
 * build (ver "prebuild" en package.json), así que agregar una pestaña nueva
 * a rutas.js alcanza para que el sitemap la incluya, sin mantener una lista
 * separada a mano que se pueda desactualizar.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { RUTAS, rutaDe } from '../src/rutas.js';

const URL_BASE = 'https://optimizacioncdts.vercel.app';
const HOY = new Date().toISOString().slice(0, 10);

const urls = RUTAS.map(tab => `  <url>
    <loc>${URL_BASE}${rutaDe(tab)}</loc>
    <lastmod>${HOY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${tab.slug === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const destino = fileURLToPath(new URL('../public/sitemap.xml', import.meta.url));
writeFileSync(destino, xml);
console.log(`sitemap.xml generado con ${RUTAS.length} URLs -> ${destino}`);
