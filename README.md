# Avanti Jewels

Static catalog and inquiry website for Avanti Jewels, deployed to GitHub Pages at
[https://avantijewels.com/](https://avantijewels.com/).

## Current storefront

Deployment stages only storefront pages, runtime scripts, referenced product
originals and responsive copies via `scripts/build-pages.cjs`. Photo-review drafts,
backup images, internal notes and development scripts are not published. They
remain available locally. Run `node --test tests/*.test.cjs` before publishing.

- One searchable catalog containing 148 products across ten categories.
- Dedicated product URLs with availability and personal pricing inquiries.
- One of each design: every listing is a unique piece or set, with no duplicate stock.
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
- `products.js` — public product data and availability, without numeric prices.
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

Edit availability in `products.js`. Do not add numeric prices to public files.
Prices are retained in an external private local JSON record, not this repository
or the GitHub Pages deployment. Update that private record using the product ID;
`null` means the client has not confirmed a price. Back it up privately.
Previously published prices may still exist in Git history or older deployments;
this change does not erase historical copies.

Each listing has `oneOfOne: true` and `quantity: 1` for the unique sale unit;
`status` determines whether that unit is currently available.
Supported unavailable values are
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
