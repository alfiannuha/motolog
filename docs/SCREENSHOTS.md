# Screenshots & Demo Assets

README.md Section 8 references three screenshots that do not exist yet. Add them
here before publishing/deploying the docs.

## Required files

Place these files in `public/screenshots/` with these exact names:

| File | Route to capture | Suggested viewport |
| --- | --- | --- |
| `dashboard.png` | `/` (vehicle list + health summary) | 390 × 844 (mobile) |
| `pre-service-brief.png` | `/vehicles/<id>/prep` (Persiapan tab) | 390 × 844 (mobile) |
| `analytics-report.png` | `/vehicles/<id>/analytics` lalu print/save report | A4 portrait |

## How to capture

1. Run the app: `npm run dev` and open `http://localhost:3000`.
2. Use browser DevTools device toolbar, pick a phone preset (e.g. iPhone 12).
3. Take a full-page screenshot of each route.
4. For the analytics report, open the analytics page and use "Print / Simpan PDF"
   from the prep/analytics view, then export the page as PNG.
5. Save into `public/screenshots/` using the filenames above.

## Markdown used in README.md

```md
| Dashboard Kendaraan | Mode Siap ke Bengkel | Ringkasan Analitik PDF |
| --- | --- | --- |
| ![Dashboard Kendaraan](/screenshots/dashboard.png) | ![Mode Siap ke Bengkel](/screenshots/pre-service-brief.png) | ![Ringkasan Analitik](/screenshots/analytics-report.png) |
```

Note: with Next.js the `public/` folder is served from the site root, so the path
is `/screenshots/dashboard.png`, not `/public/screenshots/dashboard.png`.

## Logo / icons (already present)

Existing assets are SVG and live in `public/icons/`:

- `icon-192.svg`, `icon-512.svg` — PWA "any" icons
- `maskable-icon-192.svg`, `maskable-icon-512.svg` — PWA maskable icons

If you want a raster logo for the README header, export the SVG to PNG and add
`public/screenshots/logo.png`.
