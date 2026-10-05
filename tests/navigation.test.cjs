const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function fixture(reduced = false, memoryAllowed = true) {
  const events = {};
  const image = { complete: true, naturalWidth: 640, src: 'http://localhost/640.webp', currentSrc: 'http://localhost/640.webp', srcset: '640.webp 640w, 960.webp 960w', sizes: '50vw', decode: () => Promise.resolve(), removeAttribute(key) { this[key] = ''; }, style: { removeProperty() { delete this.viewTransitionName; } } };
  const link = { href: 'http://localhost/product.html?id=803', querySelector: () => image };
  const documentRoot = { dataset: {} };
  const preloads = [];
  const storage = new Map();
  vm.runInNewContext(read('navigation-motion.js'), {
    window: { avantiPrivacy: { memoryAllowed: () => memoryAllowed }, matchMedia: () => ({ matches: reduced }), addEventListener: (name, fn) => { events[name] = fn; } },
    location: { href: link.href, origin: 'http://localhost' }, URL,
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    Image: class { decode() { return Promise.resolve(); } },
    responsiveImageData: (source, sizes) => ({ src: source, srcset: 'small.webp 320w, large.webp 960w', sizes }),
    document: { documentElement: documentRoot, head: { appendChild: node => preloads.push(node) }, createElement: () => ({}), addEventListener: (name, fn) => { events[name] = fn; }, getElementById: () => image }
  });
  return { events, image, documentRoot, storage, preloads, intent: name => events[name]({ target: { closest: () => link } }), click: extra => events.click({ target: { closest: () => link }, button: 0, detail: 1, ...extra }) };
}

test('pointer navigation shares only the clicked image and never intercepts the anchor', () => {
  const f = fixture();
  f.click();
  assert.equal(f.image.style.viewTransitionName, 'product-photo');
  f.events.pageshow();
  assert.equal(f.image.style.viewTransitionName, undefined);
});

test('keyboard, modified clicks and reduced motion do not morph', () => {
  for (const extra of [{ detail: 0 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
    const f = fixture();
    f.click(extra);
    assert.equal(f.image.style.viewTransitionName, undefined);
  }
  const f = fixture(true);
  f.click();
  assert.equal(f.image.style.viewTransitionName, undefined);
});

test('incoming transition matches the image and cleans up after finishing', async () => {
  const f = fixture();
  f.click();
  f.events.pagereveal({ viewTransition: { ready: Promise.resolve(), finished: Promise.resolve() } });
  assert.equal(f.image.style.viewTransitionName, 'product-photo');
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(f.documentRoot.dataset.productTransition, 'complete');
  assert.equal(f.image.style.viewTransitionName, undefined);
});

test('unsupported browsers use unmodified navigation; CSS respects reduced motion', () => {
  const f = fixture();
  assert.doesNotThrow(() => f.events.pageswap({}));
  assert.doesNotThrow(() => f.events.pagereveal({}));
  assert.doesNotMatch(read('navigation-motion.js'), /preventDefault|setTimeout|localStorage/);
  for (const page of ['shop.html','product.html','about.html','contact.html','terms.html','privacy.html']) {
    assert.match(read(page), /<script src="navigation-motion\.js\?v=7"><\/script>/);
    assert.doesNotMatch(read(page), /navigation-motion\.js[^>]+(?:defer|async)/);
  }
  const css = read('shop.css');
  assert.match(css, /::view-transition \{ pointer-events: none;/);
  assert.match(css, /@view-transition\s*\{ navigation: auto;/);
  assert.match(css, /@view-transition\s*\{ navigation: none;/);
  assert.match(css, /--morph-duration: 500ms/);
  assert.match(css, /::view-transition-old\(product-photo\) \{ opacity: 1;/);
  assert.match(css, /:root\[data-page-motion="photo"\]::view-transition-new\(product-photo\) \{ display: none/);
});

test('rejecting optional storage does not disable native image morphing or write storage', async () => {
  const f = fixture(false, false);
  f.click();
  assert.equal(f.image.style.viewTransitionName, 'product-photo');
  assert.equal(f.storage.size, 0);
  f.events.pagereveal({ viewTransition: { ready: Promise.resolve(), finished: Promise.resolve() } });
  assert.equal(f.image.style.viewTransitionName, 'product-photo');
  assert.equal(f.documentRoot.dataset.pageMotion, undefined);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(f.image.style.viewTransitionName, undefined);
  assert.equal(f.documentRoot.dataset.productTransition, 'complete');
  assert.equal(f.storage.size, 0);
});

test('an unloaded larger destination reuses the loaded card image instead of skipping the morph', async () => {
  const f = fixture();
  f.click();
  f.image.complete = false;
  f.image.src = 'http://localhost/960.webp';
  let skipped = false;
  f.events.pagereveal({ viewTransition: { ready: Promise.resolve(), finished: Promise.resolve(), waitUntil() {}, skipTransition() { skipped = true; } } });
  assert.equal(skipped, false);
  assert.equal(f.image.src, 'http://localhost/640.webp');
  assert.equal(f.image.style.viewTransitionName, 'product-photo');
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.image.src, 'http://localhost/960.webp');
  assert.equal(f.storage.size, 0);
});

test('ordinary links and browser Back keep a page crossfade', async () => {
  const f = fixture();
  let skipped = false;
  const transition = { ready: Promise.resolve(), finished: Promise.resolve(), skipTransition() { skipped = true; } };
  f.events.pageswap({ viewTransition: transition });
  f.events.pagereveal({ viewTransition: transition });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(skipped, false);
  assert.equal(f.documentRoot.dataset.productTransition, 'complete');
});

test('pointer intent warms only the selected larger responsive image, once', () => {
  const f = fixture();
  f.image.dataset = { original: 'Bundle/3/Mainimage.png' };
  f.intent('pointerover');
  f.intent('pointerdown');
  assert.equal(f.preloads.length, 1);
  assert.equal(f.preloads[0].as, 'image');
  assert.equal(f.preloads[0].href, 'Bundle/3/Mainimage.png');
  assert.equal(f.preloads[0].imageSizes, '(max-width: 760px) 92vw, 50vw');
  assert.match(f.preloads[0].imageSrcset, /large.webp 960w/);
});
