// Progressive enhancement only: keep real anchors, browser history and new tabs.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let selectedImage = null;
  const warmedImages = new Set();
  const handoffKey = 'avanti-photo-navigation';
  function storeHandoff(value) {
    if (window.avantiPrivacy && !window.avantiPrivacy.memoryAllowed()) return;
    try {
      if (value) sessionStorage.setItem(handoffKey, JSON.stringify(value));
      else sessionStorage.removeItem(handoffKey);
    } catch { /* Storage can be disabled; page crossfades still work. */ }
  }
  function takeHandoff() {
    if (window.avantiPrivacy && !window.avantiPrivacy.memoryAllowed()) return null;
    try {
      const value = JSON.parse(sessionStorage.getItem(handoffKey) || 'null');
      storeHandoff(null);
      if (!value || value.destination !== location.href || Date.now() - value.time > 15000) return null;
      const source = new URL(value.src, location.href);
      return source.origin === location.origin ? value : null;
    } catch { return null; }
  }

  // Warm only the image the visitor points at, not the whole inventory.
  // The detail page uses this same responsive request at its larger size.
  function warmDetailImage(event) {
    const link = event.target.closest?.('a.shop-product');
    const image = link?.querySelector('.shop-product-image img');
    const source = image?.dataset.original;
    if (!source || warmedImages.has(source) || typeof responsiveImageData !== 'function') return;
    warmedImages.add(source);
    const data = responsiveImageData(source, '(max-width: 760px) 92vw, 50vw');
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'image';
    preload.href = data.src;
    preload.imageSrcset = data.srcset;
    preload.imageSizes = data.sizes;
    document.head.appendChild(preload);
  }
  document.addEventListener('pointerover', warmDetailImage, { passive: true });
  document.addEventListener('pointerdown', warmDetailImage, { passive: true });

  function clearSelection() {
    if (selectedImage) selectedImage.style.removeProperty('view-transition-name');
    selectedImage = null;
  }

  document.addEventListener('click', event => {
    clearSelection();
    storeHandoff(null);
    const link = event.target.closest?.('a.shop-product');
    if (!link || event.defaultPrevented || event.button !== 0 || event.detail === 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.target === '_blank' || reduceMotion.matches) return;
    const image = link.querySelector('.shop-product-image img');
    if (!image?.complete || !image.naturalWidth) return;
    selectedImage = image;
    selectedImage.style.viewTransitionName = 'product-photo';
    storeHandoff({ destination: link.href, src: image.currentSrc || image.src, time: Date.now() });
  });

  window.addEventListener('pageswap', event => {
    if (!event.viewTransition) return;
    // Non-product links and browser Back retain the site-wide crossfade.
    if (reduceMotion.matches) event.viewTransition.skipTransition();
    event.viewTransition.finished.then(clearSelection, clearSelection);
  });

  window.addEventListener('pagereveal', event => {
    if (!event.viewTransition) return;
    const root = document.documentElement;
    const handoff = takeHandoff();
    const image = document.getElementById('main-product-image');
    if (reduceMotion.matches) {
      event.viewTransition.skipTransition();
      return;
    }
    let restoreImage = () => {};
    // Native shared-element snapshots do not require browser storage. The
    // optional handoff only reuses the card's smaller cached image candidate.
    // Without it, match the main photograph using its current responsive source.
    if (image && !handoff) {
      image.style.viewTransitionName = 'product-photo';
      if (event.viewTransition.waitUntil && image.decode) {
        event.viewTransition.waitUntil(image.decode().catch(() => {}));
      }
      restoreImage = () => image.style.removeProperty('view-transition-name');
    }
    if (image && handoff) {
      // Reuse the exact, cached photograph that was visible on the card.
      // Do not wait for a larger responsive candidate to start the morph.
      const original = { src: image.src, srcset: image.srcset, sizes: image.sizes };
      image.removeAttribute('srcset');
      image.src = handoff.src;
      image.style.viewTransitionName = 'product-photo';
      root.dataset.pageMotion = 'photo';
      // Decode before releasing the captured image when the browser supports it.
      if (event.viewTransition.waitUntil && image.decode) {
        event.viewTransition.waitUntil(image.decode().catch(() => {}));
      }
      restoreImage = async () => {
        image.style.removeProperty('view-transition-name');
        delete root.dataset.pageMotion;
        // Upgrade only after decoding, without changing the displayed design.
        const larger = new Image();
        larger.sizes = original.sizes;
        larger.srcset = original.srcset;
        larger.src = original.src;
        try { await larger.decode(); } catch { return; }
        if (image.src !== handoff.src || image.srcset) return;
        image.sizes = original.sizes;
        image.srcset = original.srcset;
        image.src = original.src;
      };
    } else {
      delete root.dataset.pageMotion;
    }
    // DOM diagnostic for verifying enhancement without altering visible content.
    event.viewTransition.ready.then(() => {
      root.dataset.productTransition = 'running';
      // Record whether a real shared-image group was created, not just a fade.
      if (document.getAnimations) root.dataset.productMorph = document.getAnimations().some(animation =>
        animation.effect?.pseudoElement === '::view-transition-group(product-photo)') ? 'matched' : 'none';
      event.viewTransition.finished.then(() => { root.dataset.productTransition = 'complete'; }, () => { root.dataset.productTransition = 'skipped'; });
    }, () => { root.dataset.productTransition = 'skipped'; });
    event.viewTransition.finished.then(restoreImage, restoreImage);
  });

  // A cached catalog must never keep a stale shared-element name.
  window.addEventListener('pageshow', clearSelection);
})();
