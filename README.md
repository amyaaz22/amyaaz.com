# amyaaz.com

Portfolio site for Amyaaz Aumeer, Digital Solutions Architect (Zoho). It's a single static page with no build step, hosted on Netlify.

```
site/          <- the only folder Netlify publishes (the public website)
  index.html
  robots.txt
  sitemap.xml
docs/          <- private working files, never deployed
netlify.toml   <- Netlify config: publish folder, headers, redirects
```

## Deploys (Netlify + GitHub)

Do this once in the Netlify dashboard:

1. Open the **melodic-daffodil-f0d054** site, then go to **Site configuration → Build & deploy → Continuous deployment → Link repository**.
2. Choose GitHub, then **amyaaz22/amyaaz.com**, with branch `main`.
3. Leave the build command empty. The publish directory (`site`) is read from `netlify.toml`.

After that, every push to `main` deploys to amyaaz.com, and every pull request gets a preview URL.

## Contact form

The form uses **Netlify Forms**, so you don't need a backend. After the first deploy from Git:

- Submissions show up under **Forms → contact** in Netlify.
- To get them by email, go to **Forms → Form notifications → Add notification → Email** and enter `aumeeramyaaz@gmail.com`.
- The form has a honeypot field for spam, and Netlify's spam filter is also on.

## Google Search Console

The recommended setup is a **Domain property**, verified through DNS:

1. In https://search.google.com/search-console, click **Add property → Domain** and enter `amyaaz.com`.
2. Copy the `google-site-verification=...` TXT record that Google gives you.
3. In Netlify, go to **Domains → amyaaz.com → DNS settings → Add record**. Choose type `TXT`, set the name to `@`, and paste the value.
4. Back in Search Console, click **Verify**. Then go to **Sitemaps** and submit `https://amyaaz.com/sitemap.xml`.
5. Use **URL inspection → Request indexing** on `https://amyaaz.com/`.

If you'd rather use the "HTML tag" method instead, paste the token into the commented-out `google-site-verification` meta tag near the top of `site/index.html`, uncomment it, and deploy.

## Google Analytics 4

1. At https://analytics.google.com, create a GA4 property and a Web data stream for `https://amyaaz.com`.
2. Copy the Measurement ID (`G-XXXXXXXXXX`) into `window.GA_MEASUREMENT_ID = '';` in `site/index.html`.
3. In Search Console, go to **Settings → Associations** and link the GA4 property.

While the ID is empty, no analytics script is loaded. Each successful contact form submission is sent to GA as a `generate_lead` event.

## Theme

Dark is the default. The toggle in the nav switches to light mode, and the visitor's choice is saved in their browser. The colors for both themes are defined as CSS variables at the top of `site/index.html`.

## Local preview

```bash
npx serve site
```
