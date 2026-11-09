import { homeHtml, person, website, ORIGIN } from '../lib/content';

const title = 'Amyaaz Aumeer | Digital Solutions Architect and Zoho Developer in Mauritius';
const description =
  'Amyaaz Aumeer is a Digital Solutions Architect based in Mauritius with deep Zoho platform expertise. Specialising in Zoho Creator, Deluge scripting, Zoho Flow, and Catalyst. The go-to Zoho developer in Mauritius for custom business application development and digital transformation.';

export const metadata = {
  title,
  description,
  keywords:
    'Zoho developer Mauritius, Zoho developer Middle East and Africa, Zoho developer Middle East, Zoho Creator developer, Zoho Creator developer Middle East and Africa, remote Zoho developer Middle East and Africa, Deluge scripting, digital solutions architect Mauritius, Zoho technical developer, Zoho Flow automation, Zoho Catalyst, Mauritius software developer, custom Zoho development, Zoho partner Mauritius, MetaBox Technology, amyaaz aumeer, digital transformation Mauritius, MRA e-invoicing Zoho',
  alternates: { canonical: ORIGIN + '/' },
  openGraph: {
    title,
    description,
    url: ORIGIN + '/',
    type: 'website',
    images: [
      {
        url: ORIGIN + '/assets/img/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Amyaaz Aumeer, Digital Solutions Architect and Zoho Developer in Mauritius',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [ORIGIN + '/assets/img/og-image.jpg'],
  },
};

export default function Home() {
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      person,
      website,
      {
        '@type': 'ProfessionalService',
        '@id': ORIGIN + '/#service',
        name: 'Amyaaz Aumeer, Zoho development',
        url: ORIGIN + '/',
        provider: { '@id': ORIGIN + '/#person' },
        areaServed: [
          { '@type': 'Country', name: 'Mauritius' },
          { '@type': 'Place', name: 'Middle East' },
          { '@type': 'Place', name: 'Africa' },
        ],
        serviceType: ['Zoho Creator development', 'Deluge scripting', 'Zoho Flow automation', 'Zoho Catalyst'],
      },
      {
        '@type': 'ProfilePage',
        '@id': ORIGIN + '/#profile',
        url: ORIGIN + '/',
        name: title,
        mainEntity: { '@id': ORIGIN + '/#person' },
        isPartOf: { '@id': ORIGIN + '/#website' },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      {/* Home body comes from content/home.html, same as the HTML build. */}
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: homeHtml() }} />
    </>
  );
}
