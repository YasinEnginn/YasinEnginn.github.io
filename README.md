# Yasin Engin Portfolio

Personal portfolio and technical hub focused on Network Automation, Software-Defined Networking, NDN/ICN, LEO/NTN systems, Go backend systems, distributed systems, and future network architectures.

## Live Site

https://yasinenginn.github.io/

## Purpose

This site presents my engineering projects, case studies, technical notes, research reading list, Netreka Academy content, CV, and contact information. It is designed as a professional portfolio system rather than a single static landing page.

## Brand Positioning

Primary identity:

```text
Yasin Engin - Computer Engineering Student | Network Automation, Future Networks & Go Distributed Systems
```

Short profile line:

```text
I build reproducible network automation labs, future-network research experiments, and Go-based distributed systems.
```

## Main Focus Areas

- Network Automation
- Software-Defined Networking
- Named Data Networking / Information-Centric Networking
- LEO Satellite Networking / NTN
- Go Backend Systems
- Distributed Systems
- CCNA / CCNP Labs
- Containerlab / Ansible / gNMI / YANG
- Future Network Architectures

## Featured Sections

- Projects
- Case Studies
- Research Library
- Engineering Notes
- Politecnico di Torino Diaries
- Torino Erasmus Map
- Netreka Academy
- CV
- Contact

## Technical Stack

- HTML5
- Modular CSS architecture
- Modular vanilla JavaScript
- GitHub Pages
- JSON-LD structured data
- Open Graph / Twitter metadata
- Sitemap / RSS / robots.txt
- Performance-aware lightweight mode
- External JSON translation data

## Local Development

```bash
git clone https://github.com/YasinEnginn/YasinEnginn.github.io.git
cd YasinEnginn.github.io
npm run serve
```

Then open:

```text
http://localhost:8000
```

Generate the Torino diary collection before previewing content changes:

```bash
npm run build:diary
```

Diary entries live in `content/torino-diary/` as Markdown. The generator creates clean post URLs, tag and category archives, a search index, RSS, JSON-LD metadata, and a dedicated sitemap without adding a runtime framework or database. Drafts live in `content/torino-diary/_drafts/` and can be previewed with:

```bash
node scripts/build_torino_diary.mjs --drafts
```

You can also run the server directly:

```bash
python -m http.server 8000
```

## CSS Build

The generated stylesheet at `assets/css/app.css` is built from the CSS partials in `assets/css/01-tokens.css` through `assets/css/08-responsive.css`.

```bash
npm run build:css
```

Run this command after editing the CSS partials.

## JavaScript Architecture

The portfolio JavaScript is split by responsibility under `assets/js/`:

- `performance.js` sets adaptive device and rendering profiles.
- `i18n.js` loads `assets/data/translations.json` and applies UI translations.
- `theme.js` manages time-aware theme state.
- `contact.js` owns email copy and contact form behavior.
- `library.js` powers the reading-library filters and search.
- `command-palette.js` handles the Ctrl+K command palette.
- `projects.js` handles project/video tracking helpers.
- `main.js` coordinates page initialization and shared UI behavior.

## Quality Checks

```bash
npm run check:js
npm run check:sitemap
npm run check:site
npm run check
```

`check:js` verifies JavaScript syntax and JSON data files. `check:sitemap` verifies that every page URL listed through the sitemap index maps to an existing local file. `check:site` verifies local HTML links, anchors, assets, and CSS `url()` references. `check` runs the CSS build, JS/data check, sitemap check, JSON-LD parse check, and site integrity check together.

## Performance-Aware Design

The site uses adaptive performance profiles instead of a single visual mode:

- `desktop-full`: rich canvas, terminal, command palette, and cinematic effects
- `desktop-balanced`: reduced effects with a lower-cost canvas profile
- `tablet-balanced`: low-FPS canvas, reduced shadows/blur, no terminal
- `mobile-lite`: no canvas or terminal, minimal animation, shorter first project list

The site automatically reduces visual effects on:

- mobile screens
- tablet screens
- low-memory devices
- low-CPU devices
- slow connections
- data-saver mode
- reduced-motion preference

Manual overrides:

- `?lite=1` or `?performance=lite` forces the lightweight version.
- `?lite=0` or `?performance=full` forces the full visual version.

## SEO Features

- Canonical URL
- Sitemap index plus page, project, note, image, and video sitemaps
- robots.txt
- RSS feed
- Dedicated Torino diary RSS feed and generated search index
- Page-level Open Graph metadata
- Page-level Twitter/X card metadata
- Dedicated 1200x630 social preview images under `assets/img/social/`
- Matching social metadata on legacy convenience redirect URLs
- JSON-LD Person / ProfilePage / WebSite / VideoObject / ItemList data
- Page-level TechArticle / SoftwareSourceCode / BreadcrumbList data
- Image and video sitemap files
- IndexNow submission script for page, project, note, and video URLs
- llms.txt AI-readable profile index
- humans.txt

## Search Engine Submission

After deploying to GitHub Pages, submit these sitemap URLs manually in Google Search Console, Bing Webmaster Tools, and Yandex Webmaster:

```text
https://yasinenginn.github.io/sitemap.xml
https://yasinenginn.github.io/sitemap-pages.xml
https://yasinenginn.github.io/sitemap-projects.xml
https://yasinenginn.github.io/sitemap-notes.xml
https://yasinenginn.github.io/sitemap-torino-diary.xml
```

The image and video sitemaps are linked from `sitemap.xml` and `robots.txt` for crawler discovery.

Priority URLs to inspect/request indexing:

```text
https://yasinenginn.github.io/
https://yasinenginn.github.io/cv.html
https://yasinenginn.github.io/projects/
https://yasinenginn.github.io/projects.html
https://yasinenginn.github.io/notes/
https://yasinenginn.github.io/videos/
https://yasinenginn.github.io/videos.html
https://yasinenginn.github.io/research-library/
https://yasinenginn.github.io/library.html
https://yasinenginn.github.io/projects/tolerex/
https://yasinenginn.github.io/projects/tolerex.html
https://yasinenginn.github.io/projects/rehydrator/
https://yasinenginn.github.io/projects/rehydrator.html
https://yasinenginn.github.io/projects/network-automation-labs/
https://yasinenginn.github.io/projects/network-automation-labs.html
```

Legacy convenience URLs redirect to the canonical directory-style pages and carry matching Open Graph / Twitter card metadata for share previews.

## Social Preview QA

After deployment, test the live URLs in LinkedIn Post Inspector and Meta Sharing Debugger:

```text
https://yasinenginn.github.io/
https://yasinenginn.github.io/cv.html
https://yasinenginn.github.io/projects/
https://yasinenginn.github.io/projects.html
https://yasinenginn.github.io/notes/
https://yasinenginn.github.io/videos/
https://yasinenginn.github.io/videos.html
https://yasinenginn.github.io/research-library/
https://yasinenginn.github.io/library.html
https://yasinenginn.github.io/projects/tolerex.html
https://yasinenginn.github.io/projects/rehydrator.html
https://yasinenginn.github.io/projects/network-automation-labs.html
```

Check that each preview uses the expected title, description, canonical URL, and `assets/img/social/` image.

## External Profile Copy

GitHub profile README:

```text
# Yasin Engin

Yasin Engin - Computer Engineering Student | Network Automation, Future Networks & Go Distributed Systems

I build reproducible network automation labs, future-network research experiments, and Go-based distributed systems.

Portfolio: https://yasinenginn.github.io/
Netreka Academy: https://www.youtube.com/@Netreka_Akademi
Current Focus: Satellite Networks, NDN, Network Automation
```

LinkedIn headline:

```text
Computer Engineering Student | Network Automation & Future Networks | SDN, NDN, Go, CCNA/CCNP Labs
```

YouTube channel/about snippet:

```text
Personal portfolio and technical notes:
https://yasinenginn.github.io/
```

Suggested future custom domain:

```text
yasinengin.dev
```

## IndexNow

After deploying changes to GitHub Pages, notify IndexNow-supported search engines with:

```bash
npm run indexnow
```

The script reads `sitemap-pages.xml`, uses the hosted key file at `/6f8d2a9b4c1e7f5038a0d6c9b2e4f1a7.txt`, and submits the current page URLs.

## GitHub Repository Metadata

Suggested repository description:

```text
Personal portfolio and technical hub focused on Network Automation, SDN, NDN, Go backend systems, and future network architectures.
```

Suggested website:

```text
https://yasinenginn.github.io/
```

Suggested topics:

```text
portfolio, network-automation, sdn, ndn, golang, grpc, distributed-systems, ccna, ccnp, ansible, containerlab, gns3, ndnsim, network-engineering, future-networks, github-pages
```

## License

MIT
