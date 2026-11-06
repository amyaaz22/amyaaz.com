export const metadata = {
  title: 'Page not found | Amyaaz Aumeer',
  description: 'This page could not be found.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main id="main" className="notfound">
      <div>
        <div className="label">Error 404</div>
        <h1>
          Off <em>target</em>.
        </h1>
        <p>That page went wide of the post. Let&apos;s get you back in play.</p>
        <a className="btn btn-primary magnetic" href="/">
          Back to home <span className="arrow">→</span>
        </a>
      </div>
    </main>
  );
}
