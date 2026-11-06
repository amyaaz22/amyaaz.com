// Server-side content loader. Reads the same files the HTML build used:
// content/site.json, content/articles.json and content/home.html.
import fs from 'node:fs';
import path from 'node:path';

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

export const site = JSON.parse(read('content/site.json'));
export const articles = JSON.parse(read('content/articles.json'));
const homeBody = read('content/home.html');

export const ORIGIN = 'https://amyaaz.com';

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function monthName(iso) {
  return new Date(iso + '-01T00:00:00Z').toLocaleString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// Card markup used inside the home page body (content/home.html has a {{ARTICLE_CARDS}} slot).
function cardHtml(a, i, hidden) {
  return `<a class="card article-card${hidden ? ' hide' : ''}" href="/articles/${a.slug}/" data-reveal style="--i:${i % 3}">
        <div class="article-meta"><span class="pill ${a.color}">${esc(a.tag)}</span><time datetime="${a.isoDate}">${esc(a.date)}</time></div>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.excerpt)}</p>
        <div class="foot"><span>${esc(a.readTime)}</span><b>Read →</b></div>
      </a>`;
}

export function homeHtml() {
  const cards = articles.map((a, i) => cardHtml(a, i, i >= 6)).join('\n      ');
  return homeBody
    .replace('{{ARTICLE_CARDS}}', cards)
    .replace(
      '{{MORE_ARTICLES}}',
      articles.length > 6
        ? `<div class="center"><button type="button" class="btn btn-ghost magnetic" id="more-articles">Show all ${articles.length} articles</button></div>`
        : ''
    )
    .replaceAll('{{EMAIL}}', site.email)
    .replaceAll('{{LINKEDIN}}', site.linkedin)
    .replaceAll('{{GITHUB}}', site.github)
    .replaceAll('{{YOUTUBE}}', site.youtube)
    .replaceAll('{{PRESS_URL}}', site.pressUrl)
    .replaceAll('{{CERT_URL}}', site.certUrl);
}

export const person = {
  '@type': 'Person',
  '@id': ORIGIN + '/#person',
  name: 'Amyaaz Aumeer',
  url: ORIGIN + '/',
  email: 'mailto:' + site.email,
  image: ORIGIN + '/assets/img/amyaaz-aumeer-headshot.jpg',
  jobTitle: 'Digital Solutions Architect',
  description:
    'Digital Solutions Architect and Zoho Creator Certified Developer specialising in Zoho Creator, Deluge, Flow and Catalyst in Mauritius.',
  worksFor: { '@type': 'Organization', name: 'MetaBox Technology', url: 'https://www.metabox.mu/' },
  address: { '@type': 'PostalAddress', addressLocality: 'Port Louis', addressCountry: 'MU' },
  sameAs: [site.linkedin, site.github, site.youtube],
  knowsAbout: [
    'Zoho Creator',
    'Deluge scripting',
    'Zoho Flow',
    'Zoho Catalyst',
    'Zoho CRM',
    'Zoho Books',
    'Digital Solution Architecture',
    'Low-code development',
    'Digital Transformation',
    'MRA e-invoicing',
  ],
};

export const website = {
  '@type': 'WebSite',
  '@id': ORIGIN + '/#website',
  url: ORIGIN + '/',
  name: 'Amyaaz Aumeer',
  publisher: { '@id': ORIGIN + '/#person' },
  inLanguage: 'en',
};
