// Per-tab browsing context only; real anchors and browser Back stay native.
(() => {
  const key = 'avanti-catalog-position';
  const pendingKey = 'avanti-catalog-return';
  const catalogPath = new URL('shop.html', location.href).pathname;
  const isCatalog = location.pathname === catalogPath;
  const read = () => {
    if (window.avantiPrivacy && !window.avantiPrivacy.memoryAllowed()) return null;
    try {
      const value = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (!value || !Number.isFinite(value.y) || value.y < 0) return null;
      const url = new URL(value.url, location.href);
      return url.origin === location.origin && url.pathname === catalogPath ? value : null;
    } catch { return null; }
  };
  function save() {
    if (!isCatalog) return;
    if (window.avantiPrivacy && !window.avantiPrivacy.memoryAllowed()) return;
    try { sessionStorage.setItem(key, JSON.stringify({ url: location.href, y: window.scrollY })); } catch {}
  }
  let returnPosition = null;
  function restore() {
    if (returnPosition !== null) window.scrollTo({ top: returnPosition, left: 0, behavior: 'instant' });
  }
  document.addEventListener('DOMContentLoaded', () => {
    const saved = read();
    if (isCatalog) {
      try {
        if (saved && sessionStorage.getItem(pendingKey) === location.href) returnPosition = saved.y;
        sessionStorage.removeItem(pendingKey);
      } catch {}
      // The catalog has rendered, but the incoming transition hasn't captured it yet.
      restore();
    } else if (saved) {
      document.querySelectorAll('a[href]').forEach(link => {
        const url = new URL(link.href, location.href);
        // Explicit category links remain category links; general return links resume browsing.
        if (url.origin === location.origin && url.pathname === catalogPath && !url.search && !url.hash) {
          link.dataset.catalogResume = link.href;
          link.href = saved.url;
        }
      });
    }
  });
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    save();
    if (isCatalog) return;
    const saved = read();
    if (saved && link.href === saved.url) {
      try { sessionStorage.setItem(pendingKey, saved.url); } catch {}
    }
  });
  window.addEventListener('pagehide', save);
  window.addEventListener('pagereveal', restore);
  // BFCache/history restores its own scroll position; don't override it.
  window.addEventListener('pageshow', event => {
    if (event.persisted) returnPosition = null;
    else restore();
  });
})();
