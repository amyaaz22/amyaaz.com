import fs from 'node:fs';
import path from 'node:path';
import { ORIGIN } from '../../lib/content';

export const metadata = {
  title: 'Half time | Amyaaz Aumeer',
  description: 'A short penalty game by Amyaaz Aumeer.',
  alternates: { canonical: ORIGIN + '/half-time/' },
  robots: { index: false, follow: true },
};

export default function HalfTime() {
  const html = fs.readFileSync(path.join(process.cwd(), 'content/half-time.html'), 'utf8');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
