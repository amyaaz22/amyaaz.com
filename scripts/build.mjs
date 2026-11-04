// Builds the static site in site/ from content/.
//   node scripts/build.mjs
// Generates: site/index.html, site/articles/index.html, site/articles/<slug>/index.html,
// site/404.html and site/sitemap.xml. No dependencies; Node 18+.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const ORIGIN = 'https://amyaaz.com';
const TODAY = new Date().toISOString().slice(0, 10);
const VERSION = Date.now().toString(36); // cache-busts css/js on every build

const site = JSON.parse(readFileSync(join(ROOT, 'content/site.json'), 'utf8'));
const articles = JSON.parse(readFileSync(join(ROOT, 'content/articles.json'), 'utf8'));
const homeBody = readFileSync(join(ROOT, 'content/home.html'), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const write = (rel, html) => { const p = join(SITE, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, html); };
const monthName = (iso) => new Date(iso + '-01T00:00:00Z').toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

const MARK = `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path class="mark-stroke" d="M9 39 L24 9 L39 39" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path class="mark-stroke" d="M15.5 30 H20.2 M27.8 30 H32.5" stroke-width="4.5" stroke-linecap="round"/><circle class="mark-node" cx="24" cy="30" r="3.6"/></svg>`;
const BALL = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#f4f4f8" stroke="#1a1a22" stroke-width="1.5"/><path d="M12 7.2l4.6 3.3-1.8 5.4H9.2l-1.8-5.4z" fill="#1a1a22"/></svg>`;

function head({ title, description, path, type = 'website', image = '/assets/img/og-image.jpg', jsonld = [], extra = '' }) {
  const url = ORIGIN + path;
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
${extra}<meta name="author" content="Amyaaz Aumeer" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<link rel="canonical" href="${url}" />
<meta property="og:site_name" content="Amyaaz Aumeer" />
<meta property="og:locale" content="en_GB" />
<meta property="og:type" content="${type}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${ORIGIN}${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Amyaaz Aumeer, Digital Solutions Architect and Zoho Developer in Mauritius" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${ORIGIN}${image}" />
<meta name="theme-color" content="#08080c" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
${site.googleSiteVerification ? `<meta name="google-site-verification" content="${esc(site.googleSiteVerification)}" />\n` : ''}${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
<script>
  (function () {
    var t = null;
    try { t = localStorage.getItem('theme'); } catch (e) {}
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  })();
</script>
${site.gaMeasurementId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(site.gaMeasurementId)}"></script>
<script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${esc(site.gaMeasurementId)}');</script>
` : ''}<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700&display=swap" />
<link rel="stylesheet" href="/assets/css/site.css?v=${VERSION}" />
<script src="/assets/js/site.js?v=${VERSION}" defer></script>
</head>`;
}

function nav(home) {
  const h = home ? '' : '/';
  const links = [['services', 'Services'], ['work', 'Work'], ['articles', 'Writing'], ['about', 'About'], ['contact', 'Contact']];
  return `<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="nav">
  <div class="wrap nav-inner">
    <a class="brand" href="/" aria-label="Amyaaz Aumeer — home">${MARK}<span class="brand-name">amyaaz<b>.com</b></span></a>
    <nav aria-label="Primary"><ul class="nav-links">
${links.map(([id, l]) => `      <li><a href="${h}#${id}">${l}</a></li>`).join('\n')}
    </ul></nav>
    <div class="nav-actions">
      <button type="button" class="icon-btn theme-toggle" aria-label="Switch to light mode">
        <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      </button>
      <a class="btn btn-primary nav-cta magnetic" href="${h}#contact">Let's talk</a>
      <button type="button" class="icon-btn menu-btn" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu"><span class="menu-btn-inner"><span></span><span></span></span></button>
    </div>
  </div>
  <div class="progress" aria-hidden="true"><div class="progress-line"></div><div class="progress-ball">${BALL}</div></div>
</header>
<div class="mobile-menu" id="mobile-menu">
  <ul>
${links.map(([id, l], i) => `    <li><a href="${h}#${id}">${l}<span>0${i + 1}</span></a></li>`).join('\n')}
  </ul>
  <div class="meta">
    <a href="mailto:${site.email}">${site.email}</a>
    <span>Port Louis, Mauritius</span>
  </div>
</div>`;
}

function footer(home) {
  const h = home ? '' : '/';
  return `<footer>
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="brand" href="/" aria-label="Amyaaz Aumeer — home">${MARK}<span class="brand-name">amyaaz<b>.com</b></span></a>
        <p>Digital Solutions Architect and Zoho Developer in Mauritius. Custom Zoho Creator apps, Deluge, Flow, Catalyst and the systems around them.</p>
      </div>
      <div class="foot-links">
        <div><span>Site</span><a href="${h}#services">Services</a><a href="${h}#work">Work</a><a href="/articles/">Articles</a><a href="${h}#about">About</a></div>
        <div><span>Elsewhere</span><a href="${site.linkedin}" target="_blank" rel="noopener me">LinkedIn</a><a href="${site.github}" target="_blank" rel="noopener me">GitHub</a><a href="${site.youtube}" target="_blank" rel="noopener me">YouTube</a>${site.writingUrl ? `<a href="${site.writingUrl}" target="_blank" rel="noopener">Writing</a>` : ''}</div>
        <div><span>Contact</span><a href="mailto:${site.email}">Email</a><a href="${h}#contact">Project enquiry</a></div>
      </div>
    </div>
    <div class="foot-big" aria-hidden="true">amyaaz.com</div>
    <div class="foot-bottom">
      <span class="avail">Available for projects · Port Louis, Mauritius</span>
      <span>© ${new Date().getFullYear()} Amyaaz Aumeer</span>
    </div>
  </div>
</footer>
</body>
</html>
`;
}

// ---------- Structured data ----------
const person = {
  '@type': 'Person', '@id': ORIGIN + '/#person',
  name: 'Amyaaz Aumeer', url: ORIGIN + '/', email: 'mailto:' + site.email,
  image: ORIGIN + '/assets/img/amyaaz-aumeer-headshot.jpg',
  jobTitle: 'Digital Solutions Architect',
  description: 'Digital Solutions Architect and Zoho Creator Certified Developer specialising in Zoho Creator, Deluge, Flow and Catalyst in Mauritius.',
  worksFor: { '@type': 'Organization', name: 'MetaBox Technology', url: 'https://www.metabox.mu/' },
  address: { '@type': 'PostalAddress', addressLocality: 'Port Louis', addressCountry: 'MU' },
  hasCredential: { '@type': 'EducationalOccupationalCredential', name: 'Zoho Creator Certified Developer - Associate', credentialCategory: 'certification', recognizedBy: { '@type': 'Organization', name: 'Zoho' } },
  sameAs: [site.linkedin, site.github, site.youtube],
  knowsAbout: ['Zoho Creator', 'Deluge scripting', 'Zoho Flow', 'Zoho Catalyst', 'Zoho CRM', 'Zoho Books', 'Digital Solution Architecture', 'Low-code development', 'Digital Transformation', 'MRA e-invoicing'],
};
const website = { '@type': 'WebSite', '@id': ORIGIN + '/#website', url: ORIGIN + '/', name: 'Amyaaz Aumeer', publisher: { '@id': ORIGIN + '/#person' }, inLanguage: 'en' };

// ---------- Article cards ----------
function row(a, i, hidden) {
  return `<a class="arow${hidden ? ' hide' : ''}" href="/articles/${a.slug}/" data-reveal style="--i:${i % 4}">
        <span class="pill ${a.color}">${esc(a.tag)}</span>
        <div><h3>${esc(a.title)}</h3><p>${esc(a.excerpt)}</p></div>
        <span class="meta"><time datetime="${a.isoDate}">${esc(a.date)}</time><br/>${esc(a.readTime)}</span>
        <span class="go" aria-hidden="true">→</span>
      </a>`;
}

// ---------- Home ----------
{
  const rows = articles.map((a, i) => row(a, i, i >= 5)).join('\n      ');
  const body = homeBody
    .replace('{{ARTICLE_ROWS}}', rows)
    .replace('{{MORE_ARTICLES}}', articles.length > 5 ? `<div class="center"><button type="button" class="btn btn-ghost magnetic" id="more-articles">Show all ${articles.length} articles</button></div>` : '')
    .replaceAll('{{EMAIL}}', site.email).replaceAll('{{LINKEDIN}}', site.linkedin).replaceAll('{{GITHUB}}', site.github)
    .replaceAll('{{YOUTUBE}}', site.youtube).replaceAll('{{PRESS_URL}}', site.pressUrl).replaceAll('{{CERT_URL}}', site.certUrl);
  const html = head({
    title: 'Amyaaz Aumeer | Digital Solutions Architect and Zoho Developer in Mauritius',
    description: 'Amyaaz Aumeer is a Digital Solutions Architect based in Mauritius with deep Zoho platform expertise. Specialising in Zoho Creator, Deluge scripting, Zoho Flow, and Catalyst. The go-to Zoho developer in Mauritius for custom business application development and digital transformation.',
    path: '/',
    extra: '<meta name="keywords" content="Zoho developer Mauritius, Zoho Creator developer, Deluge scripting, digital solutions architect Mauritius, Zoho technical developer, Zoho Flow automation, Zoho Catalyst, Mauritius software developer, custom Zoho development, Zoho partner Mauritius, MetaBox Technology, amyaaz aumeer, digital transformation Mauritius, MRA e-invoicing Zoho" />\n',
    jsonld: [{ '@context': 'https://schema.org', '@graph': [person, website, { '@type': 'ProfilePage', '@id': ORIGIN + '/#profile', url: ORIGIN + '/', name: 'Amyaaz Aumeer | Digital Solutions Architect and Zoho Developer in Mauritius', mainEntity: { '@id': ORIGIN + '/#person' }, isPartOf: { '@id': ORIGIN + '/#website' } }] }],
  }) + '\n' + nav(true) + '\n' + body + '\n' + footer(true);
  write('index.html', html);
}

// ---------- Article pages ----------
articles.forEach((a, i) => {
  const prev = articles[i - 1], next = articles[i + 1];
  const path = `/articles/${a.slug}/`;
  const jsonld = [{
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'BlogPosting', headline: a.title, description: a.excerpt, datePublished: a.isoDate, dateModified: a.isoDate, author: { '@id': ORIGIN + '/#person' }, publisher: { '@id': ORIGIN + '/#person' }, mainEntityOfPage: ORIGIN + path, image: ORIGIN + '/assets/img/og-image.jpg', keywords: ['Zoho', a.tag, 'Mauritius'], inLanguage: 'en' },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' },
        { '@type': 'ListItem', position: 2, name: 'Articles', item: ORIGIN + '/articles/' },
        { '@type': 'ListItem', position: 3, name: a.title, item: ORIGIN + path }] },
      { ...person, sameAs: person.sameAs },
    ],
  }];
  const html = head({ title: `${a.title} | Amyaaz Aumeer`, description: a.excerpt, path, type: 'article', jsonld,
    extra: `<meta property="article:published_time" content="${a.isoDate}" />\n<meta property="article:author" content="Amyaaz Aumeer" />\n` }) + '\n' + nav(false) + `
<main id="main" class="article-page">
  <article class="wrap narrow">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/articles/">Articles</a><span>/</span><span>${esc(a.tag)}</span></nav>
    <span class="pill ${a.color}">${esc(a.tag)}</span>
    <h1>${a.heading}</h1>
    <div class="byline">
      <img src="/assets/img/amyaaz-aumeer-headshot.webp" alt="" width="40" height="40" />
      <div><b>Amyaaz Aumeer</b><time datetime="${a.isoDate}">${monthName(a.isoDate)}</time> · ${esc(a.readTime)}</div>
    </div>
    <div class="prose">
${a.body.split('\n').map((l) => '      ' + l).join('\n')}
    </div>
    <aside class="card article-cta">
      <div><h2>Need this built for your business?</h2><p>I design and build Zoho solutions for companies in Mauritius and beyond.</p></div>
      <a class="btn btn-primary magnetic" href="/#contact">Start a project <span class="arrow">→</span></a>
    </aside>
    <nav class="pager" aria-label="More articles">
      ${prev ? `<a class="card" href="/articles/${prev.slug}/"><span>← Newer</span><b>${esc(prev.title)}</b></a>` : '<span></span>'}
      ${next ? `<a class="card next" href="/articles/${next.slug}/"><span>Older →</span><b>${esc(next.title)}</b></a>` : '<span></span>'}
    </nav>
  </article>
</main>
` + footer(false);
  write(`articles/${a.slug}/index.html`, html);
});

// ---------- Articles index ----------
{
  const html = head({
    title: 'Articles on Zoho Creator, Deluge, Flow and Catalyst | Amyaaz Aumeer',
    description: 'Technical articles by Amyaaz Aumeer on building with the Zoho stack: Creator workflows, Deluge scripting, Zoho Flow, Catalyst and MRA e-invoicing in Mauritius.',
    path: '/articles/',
    jsonld: [{ '@context': 'https://schema.org', '@type': 'Blog', name: 'Articles by Amyaaz Aumeer', url: ORIGIN + '/articles/', author: { '@type': 'Person', name: 'Amyaaz Aumeer', url: ORIGIN + '/' },
      blogPost: articles.map((a) => ({ '@type': 'BlogPosting', headline: a.title, url: `${ORIGIN}/articles/${a.slug}/`, datePublished: a.isoDate })) }],
  }) + '\n' + nav(false) + `
<main id="main" class="article-page">
  <div class="wrap" style="max-width: var(--maxw)">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Articles</span></nav>
    <div class="sec-index"><b>06</b> Writing</div>
    <h1 class="display" style="font-size: clamp(2.4rem, 6vw, 4.6rem); margin: 1.2rem 0">Articles on building<br/>with the <em>Zoho</em> stack.</h1>
    <p class="lead" style="margin-bottom: 3rem">Notes from real implementations: Creator architecture, Deluge behaviour, Flow orchestration, Catalyst, and Mauritius compliance.</p>
    <div class="alist">
      ${articles.map((a, i) => row(a, i, false)).join('\n      ')}
    </div>
  </div>
</main>
` + footer(false);
  write('articles/index.html', html);
}

// ---------- 404 ----------
write('404.html', head({ title: 'Page not found | Amyaaz Aumeer', description: 'This page could not be found.', path: '/404.html', extra: '' }).replace('index, follow, max-image-preview:large', 'noindex') + '\n' + nav(false) + `
<main id="main" class="notfound">
  <div>
    <div class="sec-index" style="justify-content:center"><b>404</b> Off target</div>
    <h1>Off <em>target</em>.</h1>
    <p>That page went wide of the post. Let's get you back in play.</p>
    <a class="btn btn-primary magnetic" href="/">Back to home <span class="arrow">→</span></a>
  </div>
</main>
` + footer(false));

// ---------- Sitemap ----------
{
  const urls = [
    { loc: '/', lastmod: TODAY, freq: 'monthly', pr: '1.0' },
    { loc: '/articles/', lastmod: TODAY, freq: 'monthly', pr: '0.8' },
    ...articles.map((a) => ({ loc: `/articles/${a.slug}/`, lastmod: TODAY, freq: 'yearly', pr: '0.7' })),
  ];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${ORIGIN}${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.pr}</priority>\n  </url>`).join('\n')}
</urlset>
`);
}

console.log(`Built home, ${articles.length} articles, articles index, 404, sitemap.`);
