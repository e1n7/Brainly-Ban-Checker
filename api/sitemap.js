<<<<<<< HEAD
export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/xml');
  res.write(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://brainly-ban-checker.vercel.app/</loc>
    <lastmod>2026-05-18</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
  res.end();
=======
export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/xml');
  res.write(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://brainly-ban-checker.vercel.app/</loc>
    <lastmod>2026-05-18</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
  res.end();
>>>>>>> d9b0d16e232579cbabbbf2da6df3cc1cbc038ed0
}