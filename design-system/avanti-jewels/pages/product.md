# Product Page Overrides

> **Project:** Avanti Jewels  
> **Page:** Dedicated product detail and image viewer  
> **Updated:** 2026-08-27

## Navigation

- Use the unified shop header only. Do not load the legacy sidebar, theme toggle, category navigation or `style.css`.
- Provide a visible `Back to all jewelry` link before product content.
- Related-product collection links return to the filtered unified catalog.

## Product gallery

- The full main image is a keyboard-accessible button that opens the viewer.
- Keep a separate `View and zoom` control visible as a clear affordance.
- Thumbnails are native buttons with accessible labels and a visible active border.
- Preserve the original product photography and use `object-fit: contain` for the main image.
- Use responsive WebP copies for the main gallery and thumbnails, with the full original requested only when the viewer opens.
- Legacy category-page scripts must not initialize on the redesigned pages or replace the gallery controls.

## Image viewer

- Viewer opens at 100% with the complete photograph fitted inside the viewport, never cropped.
- Zoom range is 100%-300% in 25% steps.
- Enlarged images expand a scrollable stage so every part remains reachable. Support mouse wheel zoom, double-click zoom, native scroll, and drag-to-pan.
- Keyboard support: Escape closes, arrow keys change images, plus/minus zoom, and 0 resets.
- Opening the viewer moves focus to Close. Closing returns focus to the original image control.
- Minimum interactive target is 44px and reduced-motion preferences remain respected.
