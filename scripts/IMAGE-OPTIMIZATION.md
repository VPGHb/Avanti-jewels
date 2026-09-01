# Product image copies

Original photography and inventory remain in their existing folders and `products.js`.
The catalog, detail image, thumbnails, and inquiry preview use responsive WebP copies
at 320, 640, or 960 pixels wide. The zoom viewer requests the original on opening.
Catalog and secondary images are lazy-loaded; the main detail image and shop hero
are prioritized. Image dimensions reserve layout space while loading.

After adding or replacing photos, from the repository root run:

```powershell
node scripts/image-input.cjs | python scripts/optimize-images.py
node --test tests/inventory.test.cjs tests/images.test.cjs
```

Python needs Pillow. Use the full Python executable path if it is not on PATH.
The generator preserves aspect ratio, does not crop, and never overwrites originals.
Generated filenames include a content hash. New photos without a manifest entry
still work via their original path. Missing optimized files fall back to originals.
Commit `images/optimized/` and `image-manifest.js` with the site when approved.
No runtime image service, API key, or deployment workflow change is required.

The shop and about hero images have explicit responsive markup in their HTML.
If replacing those photos, update their HTML paths from the generated manifest too.
Increment the `image-manifest.js` query version in HTML when regenerating it.
