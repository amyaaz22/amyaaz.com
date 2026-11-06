import { articles, monthName, ORIGIN, person } from '../../../lib/content';

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = articles.find((x) => x.slug === slug);
  const title = `${a.title} | Amyaaz Aumeer`;
  return {
    title,
    description: a.excerpt,
    alternates: { canonical: `${ORIGIN}/articles/${slug}/` },
    openGraph: {
      title,
      description: a.excerpt,
      url: `${ORIGIN}/articles/${slug}/`,
      type: 'article',
      publishedTime: a.isoDate,
      images: [{ url: ORIGIN + '/assets/img/og-image.jpg', width: 1200, height: 630 }],
    },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const i = articles.findIndex((x) => x.slug === slug);
  const a = articles[i];
  const prev = articles[i - 1];
  const next = articles[i + 1];
  const path = `/articles/${a.slug}/`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: a.title,
        description: a.excerpt,
        datePublished: a.isoDate,
        dateModified: a.isoDate,
        author: { '@id': ORIGIN + '/#person' },
        publisher: { '@id': ORIGIN + '/#person' },
        mainEntityOfPage: ORIGIN + path,
        image: ORIGIN + '/assets/img/og-image.jpg',
        keywords: ['Zoho', a.tag, 'Mauritius'],
        inLanguage: 'en',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' },
          { '@type': 'ListItem', position: 2, name: 'Articles', item: ORIGIN + '/articles/' },
          { '@type': 'ListItem', position: 3, name: a.title, item: ORIGIN + path },
        ],
      },
      person,
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <main id="main" className="article-page">
        <article className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <a href="/articles/">Articles</a>
            <span>/</span>
            <span>{a.tag}</span>
          </nav>
          <span className={`pill ${a.color}`}>{a.tag}</span>
          <h1 dangerouslySetInnerHTML={{ __html: a.heading }} />
          <div className="byline">
            <img src="/assets/img/amyaaz-aumeer-headshot.webp" alt="" width="40" height="40" />
            <div>
              <b>Amyaaz Aumeer</b>
              <time dateTime={a.isoDate}>{monthName(a.isoDate)}</time> · {a.readTime}
            </div>
          </div>
          <div className="prose" dangerouslySetInnerHTML={{ __html: a.body }} />
          <aside className="card article-cta">
            <div>
              <h2>Need this built for your business?</h2>
              <p>I design and build Zoho solutions for companies in Mauritius and beyond.</p>
            </div>
            <a className="btn btn-primary magnetic" href="/#contact">
              Start a project <span className="arrow">→</span>
            </a>
          </aside>
          <nav className="pager" aria-label="More articles">
            {prev ? (
              <a className="card" href={`/articles/${prev.slug}/`}>
                <span>← Newer</span>
                <b>{prev.title}</b>
              </a>
            ) : (
              <span />
            )}
            {next ? (
              <a className="card next" href={`/articles/${next.slug}/`}>
                <span>Older →</span>
                <b>{next.title}</b>
              </a>
            ) : (
              <span />
            )}
          </nav>
        </article>
      </main>
    </>
  );
}
