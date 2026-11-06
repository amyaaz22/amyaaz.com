import ArticleCard from '../../components/ArticleCard';
import { articles, ORIGIN } from '../../lib/content';

const title = 'Articles on Zoho Creator, Deluge, Flow and Catalyst | Amyaaz Aumeer';
const description =
  'Technical articles by Amyaaz Aumeer on building with the Zoho stack: Creator workflows, Deluge scripting, Zoho Flow, Catalyst and MRA e-invoicing in Mauritius.';

export const metadata = {
  title,
  description,
  alternates: { canonical: ORIGIN + '/articles/' },
  openGraph: { title, description, url: ORIGIN + '/articles/', type: 'website' },
};

export default function ArticlesIndex() {
  return (
    <main id="main" className="article-page">
      <div className="wrap" style={{ maxWidth: 'var(--maxw)' }}>
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <span>Articles</span>
        </nav>
        <div className="label">Technical writing</div>
        <h1 className="title">
          Articles on building
          <br />
          with the <em>Zoho</em> stack.
        </h1>
        <p className="lead" style={{ marginBottom: '3rem' }}>
          Notes from real implementations: Creator architecture, Deluge behaviour, Flow orchestration, Catalyst, and Mauritius compliance.
        </p>
        <div className="articles">
          {articles.map((a, i) => (
            <ArticleCard key={a.slug} a={a} i={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
