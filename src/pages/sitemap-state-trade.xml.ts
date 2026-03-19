import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  const base = 'https://plainhirecheck.com';

  // Get all state×trade combinations where required=1
  const r = await db.prepare(
    'SELECT lr.state, lr.trade_slug FROM licensing_requirements lr WHERE lr.required = 1 ORDER BY lr.state, lr.trade_slug'
  ).all<{ state: string; trade_slug: string }>();

  const urls = r.results;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${base}/state/${u.state.toLowerCase()}/${u.trade_slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
