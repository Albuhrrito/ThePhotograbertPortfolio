# The Photograbert — photography portfolio

Personal photography portfolio for **Albert "The Photograbert" Youssef**, built as a single-page Angular 19 application with SSR prerendering and a custom Python image-optimization pipeline.

**Live site:** <https://photograbert.com>

---

## What this repo is

An editorial-minimalist photography portfolio with seven galleries (Portraits, Modeling, Sports, Street, Products, Graduation, Aesthetics), a Ken-Burns hero slideshow, a progressive-loading lightbox with zoom/pan/pinch/EXIF metadata, and a full light/dark theme.

The front end is Angular 19 (standalone components, signals, SSR prerender, View Transitions). Every image goes through a Python pipeline that produces four responsive size tiers in WebP + JPEG, a tiny LQIP blur placeholder for progressive loading, and a JSON manifest per category with embedded EXIF. The site never ships a single full-resolution JPEG to first paint — thumbs (~30–60 KB) load for the grid, medium (~200 KB) for lightbox open, large (~900 KB) when the user clicks an image, full (~3 MB) only if they zoom past 2×.

## Tech

| Layer | Choice |
| --- | --- |
| Framework | Angular 19 standalone + signals |
| Rendering | SSR + route prerender → static hosting |
| Routing | Angular Router with View Transitions + component input binding |
| Styling | Hand-rolled CSS tokens (no UI framework), Cormorant Garamond / Inter / JetBrains Mono |
| Image pipeline | Python 3.11 + Pillow |
| Contact form | EmailJS |
| Hosting | GitHub Pages via GitHub Actions |

---

## Quick start (local development)

Prerequisites: **Node 20+**, **Python 3.11+**, **Pillow** (`pip install Pillow`).

```bash
# 1. Install front-end dependencies
cd angular-app
npm install

# 2. Start the dev server on http://localhost:4200
npm start
```

That's it for code changes. The `npm start` script runs `ng serve` with hot-module reload — edit any component and the browser updates instantly.

### Working on images

Source originals are never committed (too large). They live locally under `incoming/<category>/` — see [Image pipeline](#image-pipeline) below.

```bash
# From the repo root, rebuild all image tiers + manifests
python scripts/build_image_pipeline.py

# Rebuild a single category
python scripts/build_image_pipeline.py --only=portraits

# Force a full rebuild
python scripts/build_image_pipeline.py --force
```

---

## Project structure

```
.
├── angular-app/                    # Angular 19 application (the site itself)
│   ├── public/                     # Static assets copied verbatim (favicon, etc.)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── about/          # About page
│   │   │   │   ├── contact/        # EmailJS form
│   │   │   │   ├── footer/
│   │   │   │   ├── gallery-page/   # One component serves all 7 categories
│   │   │   │   ├── home/           # Ken Burns hero + category grid
│   │   │   │   ├── lightbox/       # Progressive loader + zoom/pan/pinch
│   │   │   │   ├── masonry-gallery/# CSS-columns masonry + reveal
│   │   │   │   ├── nav/            # Sticky auto-hide nav + mobile overlay
│   │   │   │   ├── photo/          # LQIP blur-up <picture> component
│   │   │   │   └── viewfinder-cursor/  # Desktop-only crosshair reticle
│   │   │   ├── manifests/          # Image manifests (generated — do not edit)
│   │   │   ├── services/
│   │   │   │   ├── lightbox.service.ts
│   │   │   │   ├── manifest.service.ts
│   │   │   │   └── theme.service.ts
│   │   │   └── shared/
│   │   │       ├── image-url.ts    # URL builder
│   │   │       └── manifest.model.ts  # Types + CATEGORIES metadata
│   │   ├── assets/                 # Generated image tiers (thumb/medium/large/full)
│   │   ├── index.html
│   │   ├── main.ts
│   │   ├── main.server.ts
│   │   ├── server.ts
│   │   └── styles.css              # Global tokens + utilities
│   ├── angular.json
│   └── package.json
├── scripts/
│   └── build_image_pipeline.py     # Image optimizer + manifest generator
├── incoming/                       # Source originals (gitignored, local-only)
│   ├── portrait/                   #   Drop your original JPEGs here, one folder
│   ├── modeling/                   #   per category (singular names).
│   ├── sports/
│   ├── street/
│   ├── product/
│   ├── graduation/
│   ├── hero/                       #   6–10 images for the home slideshow
│   └── about/                      #   1 self-portrait
├── .github/workflows/deploy.yml    # Builds + deploys to GitHub Pages on push
└── README.md
```

---

## Image pipeline

Source originals sit in `incoming/<category>/*.jpg` (or `.png`). The pipeline script reads each image and produces:

| Output | Purpose | Typical size |
| --- | --- | --- |
| `thumb/` — 600 px wide | Masonry grid thumbnails | 30–60 KB |
| `medium/` — 1400 px wide | First paint in the lightbox | 150–300 KB |
| `large/` — 2400 px wide | Crisp lightbox + zoom up to 2× | 500–900 KB |
| `full/` — 4000 px wide | Deep-zoom fallback | 2–4 MB |

Each tier ships as both **WebP** (primary, 20–30 % smaller) and **JPEG** (fallback). A 24-px base64 LQIP is embedded in the manifest for the blur-up placeholder, and EXIF (camera, lens, aperture, shutter, ISO, focal length, date) is extracted automatically and displayed in the lightbox footer.

Outputs go to:

- `angular-app/src/assets/<category>/{thumb,medium,large,full}/*.{webp,jpg}` — served as static files
- `angular-app/src/app/manifests/<category>.json` — imported directly by the bundle

The pipeline is idempotent: re-running skips any image whose sized output is newer than the source. Use `--force` to rebuild everything or `--only=<slug>` to rebuild one category.

### Adding or replacing images

1. Drop originals into `incoming/<singular-slug>/` (e.g. `incoming/portrait/`, `incoming/modeling/`).
2. Run `python scripts/build_image_pipeline.py`.
3. Commit the generated files in `angular-app/src/assets/` and `angular-app/src/app/manifests/`.

### Setting the home-page featured tile per category

Each category's home-page thumbnail is chosen by `heroImageId` on its entry in [`CATEGORIES`](angular-app/src/app/shared/manifest.model.ts). Set it to the file stem (without extension) — e.g. `heroImageId: 'DSCF2098'`. If omitted or not found, the first image in the manifest is used.

---

## Deployment

The `main` branch auto-deploys to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The workflow installs dependencies, runs `ng build --base-href "/ThePhotograbertPortfolio/"`, and publishes `dist/angular-app/browser/` using `actions/deploy-pages`.

One-time setup in the repo's GitHub settings:

**Settings → Pages → Build and deployment → Source: `GitHub Actions`**

After that, every push to `main` rebuilds and redeploys in ~2 minutes.

---

## Scripts reference

| Command | Where | Purpose |
| --- | --- | --- |
| `npm start` | `angular-app/` | Dev server with HMR on `localhost:4200` |
| `npm run build` | `angular-app/` | Production build (SSR + prerender) |
| `npm run watch` | `angular-app/` | Development build, keep rebuilding on change |
| `npm test` | `angular-app/` | Karma unit tests |
| `python scripts/build_image_pipeline.py` | repo root | Rebuild image tiers + manifests |

---

## License

[MIT](LICENSE)
