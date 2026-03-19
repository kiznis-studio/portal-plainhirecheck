import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const base = 'https://plainhirecheck.com';
  const pages = [
    { url: base, priority: '1.0', changefreq: 'weekly' },
    { url: `${base}/states`, priority: '0.9', changefreq: 'monthly' },
    { url: `${base}/trades`, priority: '0.9', changefreq: 'monthly' },
    { url: `${base}/rankings`, priority: '0.8', changefreq: 'monthly' },
    { url: `${base}/guides`, priority: '0.8', changefreq: 'monthly' },
    { url: `${base}/guides/how-to-verify-a-contractor-license`, priority: '0.7', changefreq: 'monthly' },
    { url: `${base}/guides/red-flags-when-hiring-a-contractor`, priority: '0.7', changefreq: 'monthly' },
    { url: `${base}/guides/what-to-do-when-contractor-does-bad-work`, priority: '0.7', changefreq: 'monthly' },
    { url: `${base}/guides/understanding-contractor-bonds-and-insurance`, priority: '0.7', changefreq: 'monthly' },
    { url: `${base}/about`, priority: '0.5', changefreq: 'yearly' },
    { url: `${base}/contact`, priority: '0.4', changefreq: 'yearly' },
    { url: `${base}/privacy`, priority: '0.3', changefreq: 'yearly' },
    { url: `${base}/terms`, priority: '0.3', changefreq: 'yearly' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
