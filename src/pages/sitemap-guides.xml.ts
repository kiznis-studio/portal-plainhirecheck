import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const base = 'https://plainhirecheck.com';
  const guides = [
    'how-to-verify-a-contractor-license',
    'red-flags-when-hiring-a-contractor',
    'what-to-do-when-contractor-does-bad-work',
    'understanding-contractor-bonds-and-insurance',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${guides.map(g => `  <url>
    <loc>${base}/guides/${g}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>2026-01-15</lastmod>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
