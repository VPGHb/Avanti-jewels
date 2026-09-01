# Shop Page Overrides

> **Project:** Avanti Jewels  
> **Page:** Unified product catalog  
> **Updated:** 2026-08-25

These rules override the generated master system for `shop.html` and the dedicated product template.

## Direction

- Indian heritage editorial luxury, grounded in bridal and occasion jewelry rather than a generic western boutique.
- Ivory background, dark rosewood text, bridal maroon actions, and restrained antique-gold borders.
- Sharp corners throughout. Buttons, filters, cards, and image frames follow the same shape rule.
- Real client product photography is the primary visual material.
- Design dials: variance 6/10, motion 4/10, density 5/10.
- The opening frame balances a concise retail message with one strong product image; the catalog controls should remain visible near the fold on common desktop screens.
- Product imagery uses a compact near-square proportion so the original square photography remains legible and the catalog reads as merchandise, not a lookbook.

## Information architecture

1. Compact announcement and brand navigation.
2. Editorial introduction with search intent explained.
3. Sticky search, availability, and sorting controls.
4. Horizontally scrollable category filters.
5. Category sections containing all matching product cards.
6. Shopping and pickup guidance.
7. Footer with conspicuous legal-policy links.

## Interaction rules

- Native search input and select controls with visible labels.
- Category buttons use `aria-pressed` and remain at least 44px tall.
- Search updates after a 120ms debounce and does not require Enter.
- Search, category, availability, and sort state is reflected in the URL.
- Results count uses an `aria-live` region.
- Empty state explains the outcome and offers one-click reset.
- Each product is a real anchor to `product.html?id={id}`.
- Product imagery uses native lazy loading, asynchronous decoding, and responsive WebP copies; the hero is prioritized.

## Responsive behavior

- Four product columns on wide desktop, three on tablet, and two on mobile.
- On phones, search spans the row and availability/sort remain in two compact columns with 16px form text and 44px controls.
- Category controls scroll horizontally without forcing page overflow.
- Category scrollbars are hidden while native scrolling and keyboard focus remain available.
- Long names wrap safely; prices and product numbers remain visible.
- Product cards contain the full photo without cropping. Original files remain available in the product zoom viewer.

## Accessibility and motion

- Minimum text contrast follows WCAG AA.
- Visible keyboard focus uses the garnet accent.
- No meaning is conveyed only by color; availability is always written as text.
- Sold-out products use a written center banner, a status badge, and a subdued image treatment.
- Hover effects are supplemental and all product actions work without hover.
- `prefers-reduced-motion` disables nonessential transitions and loading animation.

## Legal surface

- Terms and Privacy links appear in the unified shop and all existing site footers.
- Public policies describe only the current catalog, inquiry, and local-pickup workflow.
- Any checkout, shipping, analytics, advertising, account, newsletter, or SMS feature requires policy review before enablement.
