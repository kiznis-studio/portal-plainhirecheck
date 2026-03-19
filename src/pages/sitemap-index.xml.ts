import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const base = 'https://plainhirecheck.com';
  const sitemaps = [
    `${base}/sitemap-pages.xml`,
    `${base}/sitemap-states.xml`,
    `${base}/sitemap-trades.xml`,
    `${base}/sitemap-state-trade.xml`,
    `${base}/sitemap-guides.xml`,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(loc => `  <sitemap><loc>${loc}</loc></sitemap>`).join('\n')}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
