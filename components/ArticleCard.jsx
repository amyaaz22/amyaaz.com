export default function ArticleCard({ a, i, hidden = false }) {
  return (
    <a
      className={`card article-card${hidden ? ' hide' : ''}`}
      href={`/articles/${a.slug}/`}
      data-reveal
      style={{ '--i': i % 3 }}
    >
      <div className="article-meta">
        <span className={`pill ${a.color}`}>{a.tag}</span>
        <time dateTime={a.isoDate}>{a.date}</time>
      </div>
      <h3>{a.title}</h3>
      <p>{a.excerpt}</p>
      <div className="foot">
        <span>{a.readTime}</span>
        <b>Read →</b>
      </div>
    </a>
  );
}
