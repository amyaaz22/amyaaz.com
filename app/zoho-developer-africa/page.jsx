import { ORIGIN } from '../../lib/content';

const title = 'Zoho Developer in Africa | Remote Zoho Creator, Deluge and Flow | Amyaaz Aumeer';
const description =
  'Remote Zoho developer serving businesses across Africa from Mauritius. Zoho Creator apps, Deluge scripting, Zoho Flow automation and Catalyst backends, delivered remotely.';

export const metadata = {
  title,
  description,
  keywords:
    'Zoho developer Africa, Zoho Creator developer Africa, remote Zoho developer Africa, Zoho partner Africa, Deluge developer Africa, Zoho Flow Africa, Zoho Catalyst Africa, Zoho consultant Africa',
  alternates: { canonical: ORIGIN + '/zoho-developer-africa/' },
  openGraph: { title, description, url: ORIGIN + '/zoho-developer-africa/', type: 'website' },
};

const services = [
  { name: 'Zoho Creator apps', blurb: 'Custom business applications for operations, approvals, inventory, HR and client management.' },
  { name: 'Deluge scripting', blurb: 'Business logic, API integrations and scheduled tasks written and tested in Deluge.' },
  { name: 'Zoho Flow automation', blurb: 'Workflows that connect Zoho apps to the email, accounting and payment tools you already use.' },
  { name: 'Zoho Catalyst backends', blurb: 'Serverless functions and data services for apps that outgrow low-code alone.' },
];

const jsonld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      name: 'Remote Zoho development for businesses in Africa',
      serviceType: 'Zoho Creator, Deluge, Zoho Flow and Catalyst development',
      provider: { '@id': ORIGIN + '/#person' },
      areaServed: [{ '@type': 'Place', name: 'Africa' }],
      url: ORIGIN + '/zoho-developer-africa/',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' },
        { '@type': 'ListItem', position: 2, name: 'Zoho developer Africa', item: ORIGIN + '/zoho-developer-africa/' },
      ],
    },
  ],
};

export default function ZohoDeveloperAfrica() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <main id="main" className="article-page">
        <div className="wrap" style={{ maxWidth: 'var(--maxw)' }}>
          <nav className="crumbs" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <span>Zoho developer Africa</span>
          </nav>
          <div className="label">Remote delivery</div>
          <h1 className="title">
            Zoho developer for businesses <em>across Africa</em>.
          </h1>
          <p className="lead" style={{ marginBottom: '3rem' }}>
            I build custom Zoho applications for companies across Africa, delivered remotely from Mauritius. Mauritius
            runs on UTC+4, so working hours overlap with East and Southern Africa and with the start of the European day.
          </p>

          <div className="articles">
            {services.map((s, i) => (
              <div key={s.name} className="card article-card" data-reveal style={{ '--i': i }}>
                <h3>{s.name}</h3>
                <p>{s.blurb}</p>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: '3rem', padding: '2rem' }}>
            <h2 className="title" style={{ fontSize: '1.6rem' }}>How remote work runs</h2>
            <ul style={{ lineHeight: 1.8, color: 'var(--muted)', paddingLeft: '1.2rem' }}>
              <li>A scoping call first, then a written plan with fixed milestones and prices.</li>
              <li>Every build goes to a staging environment you test before anything goes live.</li>
              <li>Handover includes documentation and the source, so your team is never locked in.</li>
              <li>
                Tax and compliance rules differ by country. I build the integration; a local adviser confirms the rules
                for your country.
              </li>
            </ul>
          </div>

          <div className="center" style={{ marginTop: '3rem' }}>
            <a className="btn btn-primary magnetic" href="/#contact">
              Start a project <span className="arrow">→</span>
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
