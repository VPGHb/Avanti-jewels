# Avanti Jewels

Static catalog and inquiry website for Avanti Jewels, deployed to GitHub Pages at
[https://avantijewels.com/](https://avantijewels.com/).

## Current storefront

- One searchable catalog containing 96 products across nine categories.
- Dedicated product URLs with current price and availability.
- Appearance-based product descriptions that avoid unverified material claims.
- Responsive product photography with original-resolution zoom viewing.
- Written sold-out indicators, availability filtering and sorting.
- Direct phone, email and WhatsApp inquiry workflow.
- Local pickup or delivery arranged directly; cash and Venmo accepted.
- Terms of Service, Privacy Policy, sitemap, robots and `llms.txt` discovery files.
- Mobile layouts tested from 320px through desktop widths.

The site is intentionally a catalog rather than an online checkout. Do not add
analytics, advertising pixels, accounts, marketing signup, shipping or online
payments without reviewing the customer terms and privacy disclosures.

## Main files

- `shop.html`, `shop.css`, `shop.js` — unified catalog.
- `product.html`, `product-detail.js` — product view and zoom viewer.
- `products.js` — authoritative product data, prices and availability.
- `contact.html`, `contact.js` — direct inquiry details.
- `about.html`, `terms.html`, `privacy.html` — informational and policy pages.
- `image-manifest.js`, `image-utils.js`, `images/optimized/` — responsive images.
- `tests/` — inventory, image, link and deployment checks.

## Local preview

From the repository root:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173/shop.html`.

## Product updates

Edit price and availability in `products.js`. Supported unavailable values are
`sold-out` and `out-of-stock`; status values are normalized for the storefront.
After adding or replacing product photos, regenerate optimized copies:

```powershell
node scripts/image-input.cjs | python scripts/optimize-images.py
node scripts/generate-sitemap.cjs
node --test tests/*.test.cjs
```

Original photographs are preserved and used by the zoom viewer. Generated WebP
copies are for fast catalog browsing.

## Deployment

`.github/workflows/static.yml` deploys pushes to `main` to GitHub Pages. The
`CNAME` file preserves the `avantijewels.com` custom domain. Work on another
branch, verify locally, then merge approved changes into `main`.
