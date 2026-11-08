// Preview-only page for logo directions under review.
// Not linked from the navigation and marked noindex, so it stays out of search.
export const metadata = {
  title: 'Logo concepts (preview) | Amyaaz Aumeer',
  description: 'Preview-only logo directions for review.',
  robots: { index: false, follow: false },
};

const generated = [
  {
    name: 'Bold A',
    blurb: 'A heavy mint A with a notch cut into the counter. Strong at any size and the most ownable of the set.',
    png: '/assets/img/logo-concepts/concept-a.png',
    svg: '/assets/img/logo-concepts/traced-a.svg',
  },
  {
    name: 'Arch and node',
    blurb: 'An arch built from two solid forms with a connection node. Reads as a crafted mark with a systems idea behind it.',
    png: '/assets/img/logo-concepts/concept-arch.png',
    svg: '/assets/img/logo-concepts/traced-arch.svg',
  },
];

const canvaDesigns = [
  { name: 'Wordmark (Canva)', href: 'https://canva.link/eju2objpl5xxigp' },
  { name: 'Symbol (Canva)', href: 'https://canva.link/0efk8a1ac3tjohm' },
  { name: 'Monogram (Canva)', href: 'https://canva.link/8e3nzvcgs1p1x2v' },
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
          Logo <em>directions</em>.
        </h1>
        <p className="lead" style={{ marginBottom: '3rem' }}>
          Generated with an image model, then traced to vector. Nothing here replaces the live site until a direction is
          chosen.
        </p>

        <div className="articles">
          {generated.map((c, i) => (
            <article key={c.name} className="card article-card" data-reveal style={{ '--i': i }}>
              <img src={c.png} alt={`${c.name} logo concept`} width="200" height="200" style={{ width: '100%', height: 'auto', borderRadius: 12 }} />
              <h3>{c.name}</h3>
              <p>{c.blurb}</p>
              <div className="foot">
                <a href={c.svg}>Traced SVG</a>
                <a href={c.png}>PNG</a>
              </div>
            </article>
          ))}
        </div>

        <h2 className="title" style={{ fontSize: '1.6rem', marginTop: '4rem' }}>
          Earlier Canva <em>drafts</em>
        </h2>
        <div className="articles">
          {canvaDesigns.map((c, i) => (
            <a key={c.name} className="card article-card" href={c.href} target="_blank" rel="noopener" data-reveal style={{ '--i': i }}>
              <h3>{c.name}</h3>
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
