# FeatherLaunch website

The product site, docs and changelog for FeatherLaunch, served by GitHub Pages at
https://featherlaunch.mahmoudalnakeeb.com/. Plain HTML, CSS and JavaScript, with no framework and no
build step: edit a page and push.

## Layout

| Path | What it is |
|---|---|
| `index.html` | Home page, with the download section |
| `docs/` | Docs home, and one folder per guide |
| `changelog/` | Release notes, from the launcher's `CHANGELOG.md` |
| `privacy.html` | Privacy policy. Keep this address: the Microsoft app registration may point to it |
| `404.html` | Not found page |
| `assets/css/` | `site.css` for every page, `docs.css` for `/docs` |
| `assets/js/` | `site.js` for every page, `docs.js` for `/docs` |
| `assets/img/app/` | Launcher screenshots as WebP, 1484 and 760 px wide |
| `assets/img/social-<hash>.jpg` | Link preview image, 1200×630. The name holds the first 10 characters of its SHA-256 |
| `social.jpg`, `assets/img/social.jpg` | Copies at older addresses, so cached pages never show a broken preview. Keep them |
| `assets/brand/` | Logos, icons and social images, made by `assets/make-brand.ps1` |
| `sitemap.xml`, `robots.txt`, `site.webmanifest`, `llms.txt` | Search engines and browsers |

The header and footer are repeated in each page, so change them everywhere at once. Docs search needs
no index: `docs.js` reads the pages linked in the sidebar, so a new guide only has to be linked there.
Add a new page to `sitemap.xml` and `llms.txt` too.

## After a release

1. In `index.html`, update the version, both file sizes in decimal MB (bytes / 1,000,000), both
   SHA-256 hashes and both VirusTotal links. Update `softwareVersion` and `fileSize` in its JSON-LD.
2. Check that the VirusTotal note in the Windows download card is still true for the new file. Do
   the same in `docs/fixing-problems/`.
3. Add the version's notes to the top of `changelog/index.html`, and move the Known issues list up
   to it.
4. Update `lastmod` in `sitemap.xml` for the pages you changed.
5. If the link preview image changes, save it under a new `social-<hash>.jpg` name, update the
   `og:image` and `twitter:image` tags and the JSON-LD in every page, and replace both older copies.
   Link previews cache by address and some ignore `?v=`, so the file name is what forces a new image.
