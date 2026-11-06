/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: same output shape as the HTML site (/articles/<slug>/index.html).
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
