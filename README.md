# Ruphak Varmaa S — portfolio

The personal site of Ruphak Varmaa S, a Computer Science undergraduate in India. It is one page that reads as one continuous scroll: hero, about, a short facts section, skills, projects, experience and contact.

It is hand-built with plain HTML, CSS and JavaScript. There is **no build step and there are no dependencies**: no framework, no npm, no CDN, no web fonts and no external requests. Open `index.html` in a browser and it works, even from `file://`.

Live (once GitHub Pages is on): https://ruphakvarmaa.github.io/ruphak-portfolio/

## Structure

```
index.html                  the whole page (content, meta tags, JSON-LD)
assets/css/tokens.css       design tokens: colours (light + dark), type, spacing, motion
assets/css/main.css         layout, components, motion and the reduced-motion rules
assets/js/main.js           small deferred script: scroll effects, menu, reveals, copy email
assets/img/favicon.svg      RV monogram favicon (adapts to dark mode)
assets/img/apple-touch-icon.png   180×180 home-screen icon
assets/img/og.png           1200×630 link-preview image
robots.txt, sitemap.xml     for search engines
.nojekyll                   tells GitHub Pages to serve the files as they are
```

The page works without JavaScript; every section is visible. Scroll effects switch off when the visitor's system asks for reduced motion, and the site follows the system light or dark setting automatically.

## Add a profile photo

1. Save a square photo (at least 800×800) as `assets/img/profile.jpg`. Use that exact name and folder.
2. Commit and push. The hero swaps the "RV" monogram for your photo with a short fade. Nothing else needs to change.

Until that file exists, the monogram is shown. The browser console shows one harmless 404 for `profile.jpg`, which is expected.

## Change project links

Each project card in `index.html` has a link like this:

```html
<a class="card-link" href="https://github.com/RuphakVarmaa" target="_blank" rel="noopener">View on GitHub…</a>
```

Every project currently points to the GitHub profile. To link a project to its repository or live demo, change that card's `href` to the new URL. The card's title, one-liner, bullet points and stack line sit just above the link in the same `<article class="card">`.

## Deploy on GitHub Pages

1. Push this repository to GitHub, with the site on the `main` branch.
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **`main`** and folder **`/ (root)`**, then click **Save**.
5. After a minute the site is live at `https://<your-username>.github.io/ruphak-portfolio/`.

The canonical URL, Open Graph tags, JSON-LD, `robots.txt` and `sitemap.xml` assume `https://ruphakvarmaa.github.io/ruphak-portfolio/`. If the address is different (another username, or a custom domain with a `CNAME` file), search for `ruphakvarmaa.github.io` and replace it. All other paths are relative, so nothing else changes.

## Edit content

All text lives in `index.html`. Colours, type sizes and spacing live in `assets/css/tokens.css`. To preview locally, open `index.html` directly, or serve the folder with any static server (for example `python3 -m http.server`) and visit `http://localhost:8000`.
