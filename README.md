# Yasin Engin Portfolio

Personal portfolio and technical hub focused on Network Automation, Software-Defined Networking, Named Data Networking, Go backend systems, distributed systems, and future network architectures.

## Live Site

https://yasinenginn.github.io/

## Purpose

This site presents my engineering projects, case studies, technical notes, research reading list, Netreka Academy content, CV, and contact information. It is designed as a professional portfolio system rather than a single static landing page.

## Main Focus Areas

- Network Automation
- Software-Defined Networking
- Named Data Networking / Information-Centric Networking
- Go Backend Systems
- Distributed Systems
- CCNA / CCNP Labs
- Containerlab / Ansible / gNMI / YANG
- Future Network Architectures

## Featured Sections

- Projects
- Case Studies
- Engineering Notes
- Research Library
- Netreka Academy
- CV
- Contact

## Technical Stack

- HTML5
- Modular CSS architecture
- Vanilla JavaScript
- GitHub Pages
- JSON-LD structured data
- Open Graph / Twitter metadata
- Sitemap / RSS / robots.txt
- Performance-aware lightweight mode

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

## Quality Checks

```bash
npm run check:sitemap
npm run check:site
npm run check
```

`check:sitemap` verifies that every page URL listed through the sitemap index maps to an existing local file. `check:site` verifies local HTML links, anchors, assets, and CSS `url()` references. `check` runs the CSS build, sitemap check, JSON-LD parse check, and site integrity check together.

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
- Sitemap
- robots.txt
- RSS feed
- Open Graph metadata
- Twitter card metadata
- JSON-LD Person / ProfilePage / WebSite / VideoObject / ItemList data
- Page-level TechArticle / SoftwareSourceCode / BreadcrumbList data
- Image and video sitemap files
- IndexNow submission script
- llms.txt AI-readable profile index
- humans.txt

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
