// Preview-only page for the logo directions generated in Canva.
// Not linked from the navigation and marked noindex, so it stays out of search.
export const metadata = {
  title: 'Logo concepts (preview) | Amyaaz Aumeer',
  description: 'Preview-only logo directions for review.',
  robots: { index: false, follow: false },
};

const concepts = [
  {
    name: 'Wordmark',
    tag: 'Name-led',
    blurb:
      'A heavy custom wordmark for AMYAAZ AUMEER with one considered detail. Works in one colour on signage, invoices, favicon and LinkedIn.',
    href: 'https://canva.link/eju2objpl5xxigp',
  },
  {
    name: 'Symbol',
    tag: 'Mark-led',
    blurb:
      'A premium symbol with a strong silhouette and negative-space detail suggesting connected systems. Reads at favicon size and stays strong in one colour.',
    href: 'https://canva.link/0efk8a1ac3tjohm',
  },
  {
    name: 'Monogram',
    tag: 'AA lockup',
    blurb:
      'A custom double-A monogram with editorial contrast and a tracked uppercase name. Authoritative and suited to enterprise-facing work.',
    href: 'https://canva.link/8e3nzvcgs1p1x2v',
  },
];

export default function LogoConcepts() {
  return (
    <main id="main" className="article-page">
      <div className="wrap" style={{ maxWidth: 'var(--maxw)' }}>
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <span>Logo concepts</span>
        </nav>
        <div className="label">Preview only · not live</div>
        <h1 className="title">
          Three logo <em>directions</em>.
        </h1>
        <p className="lead" style={{ marginBottom: '3rem' }}>
          Generated in Canva from written briefs. Open each design to review it at full size. Nothing here replaces the
          live site until a direction is chosen.
        </p>
        <div className="articles">
          {concepts.map((c, i) => (
            <a key={c.name} className="card article-card" href={c.href} target="_blank" rel="noopener" data-reveal style={{ '--i': i }}>
              <div className="article-meta">
                <span className="pill">{c.tag}</span>
              </div>
              <h3>{c.name}</h3>
              <p>{c.blurb}</p>
              <div className="foot">
                <span>Open in Canva</span>
                <b>View →</b>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
