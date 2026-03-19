import type { APIRoute } from 'astro';
import { getAllTrades } from '../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  const base = 'https://plainhirecheck.com';

  const trades = await getAllTrades(db);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${trades.map(t => `  <url>
    <loc>${base}/trade/${t.trade_slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
