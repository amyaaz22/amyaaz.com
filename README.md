# amyaaz.com

Portfolio site for Amyaaz Aumeer, Digital Solutions Architect and Zoho Developer in Mauritius. It's a static site with no frameworks, hosted on Netlify.

```
content/            <- edit these
  site.json         links, email, Google Analytics ID, Search Console token
  home.html         home page sections
  articles.json     articles (title, excerpt, HTML body)
scripts/build.mjs   generates site/ from content/ (no dependencies)
site/               the published website (generated pages + assets)
  assets/css, assets/js, assets/img
docs/               private working files, never deployed
netlify.toml        publish folder, build command, headers, redirects
```

## Editing

1. Change something in `content/`.
2. Run `node scripts/build.mjs`. Netlify also runs this on every deploy.
3. Preview it with `npx serve site`.

**To add an article:** add an entry to `content/articles.json` (newest first). The build creates `/articles/<slug>/`, adds a card to the home page and updates the sitemap.

## Deploys

Netlify is linked to `main`. Every push to `main` goes live, and every pull request gets a preview URL.

## Contact form

The form uses Netlify Forms (form name `contact`). Submissions appear under **Forms**. To get them by email, go to **Forms → Form notifications → Email**.

## Google Search Console

1. In Search Console, add a **Domain** property for `amyaaz.com` and copy its TXT record.
2. In Netlify, go to **Domain management → amyaaz.com → DNS panel** and add a TXT record with name `@` and that value.
3. Click **Verify**, submit `https://amyaaz.com/sitemap.xml`, then use **URL inspection** to request indexing of `/` and `/articles/`.

If you use the "HTML tag" method instead, put the token in `googleSiteVerification` in `content/site.json`.

## Google Analytics 4

Put the Measurement ID (`G-…`) in `gaMeasurementId` in `content/site.json`. While it's empty, no analytics script is loaded. The site sends two events: `generate_lead` when the contact form is submitted, and `penalty_goal` when a visitor scores in the mini-game.
