const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('category selection scrolls to the first result after mobile collapse, respecting reduced motion', async () => {
  const source = read('shop.js');
  const start = source.indexOf('let categoryScrollRequest =');
  const end = source.indexOf('function setCollectionsOpen(', start);
  const calls = [];
  let finish;
  const collapse = new Promise(resolve => { finish = resolve; });
  const media = { matches: true };
  const root = { dataset: { input: 'pointer' } };
  let reduced = false;
  const target = { scrollIntoView: options => calls.push(options) };
  const context = vm.createContext({ collectionPanel: { getAnimations: () => [{ finished: collapse }] },
    mobileCollections: media, catalogSections: { querySelector: () => target }, emptyState: target,
    document: { documentElement: root }, window: { matchMedia: () => ({ matches: reduced }) } });
  vm.runInContext(source.slice(start, end), context);
  const pending = vm.runInContext('scrollToCategoryStart()', context);
  assert.equal(calls.length, 0);
  finish(); await pending;
  assert.equal(calls[0].block, 'start');
  assert.equal(calls[0].behavior, 'smooth');
  media.matches = false; reduced = true;
  await vm.runInContext('scrollToCategoryStart()', context);
  assert.equal(calls[1].behavior, 'instant');
  reduced = false; root.dataset.input = 'keyboard';
  await vm.runInContext('scrollToCategoryStart()', context);
  assert.equal(calls[2].behavior, 'instant');
  assert.match(source, /collectionToggle.focus\(\{ preventScroll: true \}\);\s*scrollToCategoryStart\(\)/);
});

test('mobile disclosure measures content, closes inertly, and restores desktop sizing', () => {
  const toggle = { attributes: {}, setAttribute(key, value) { this.attributes[key] = value; } };
  const panel = { style: {} };
  const media = { matches: true };
  const states = [];
  const source = read('shop.js');
  const start = source.indexOf('function setCollectionsOpen(');
  const end = source.indexOf('collectionToggle.addEventListener', start);
  const context = vm.createContext({ collectionToggle: toggle, collectionPanel: panel, mobileCollections: media,
    categoryFilter: { scrollHeight: 512 }, document: { querySelector: () => ({ classList: { toggle: (key, open) => states.push(open) } }) } });
  vm.runInContext(source.slice(start, end), context);
  vm.runInContext('setCollectionsOpen(true)', context);
  assert.equal(toggle.attributes['aria-expanded'], 'true');
  assert.equal(panel.style.height, '512px');
  assert.equal(panel.inert, false);
  vm.runInContext('setCollectionsOpen(false)', context);
  assert.equal(panel.style.height, '0px');
  assert.equal(panel.inert, true);
  media.matches = false;
  vm.runInContext('setCollectionsOpen(false)', context);
  assert.equal(panel.style.height, '');
  assert.equal(panel.inert, false);
});

test('controls preserve native selects, themed animations, reduced-motion and keyboard fallbacks', () => {
  const css = read('shop.css');
  assert.match(css, /--control-duration: 200ms/);
  assert.match(css, /appearance: base-select/);
  assert.match(css, /::picker\(select\)/);
  assert.match(css, /option:checked \{ color: var\(--white\); background: var\(--garnet\)/);
  assert.match(css, /data-input="keyboard".*collections-panel/);
  assert.match(read('shop.js'), /event.key === 'Escape'/);
  assert.match(read('shop.js'), /focus\(\{ preventScroll: true \}\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(read('shop.html'), /<select id="availability-filter">/);
});

test('public availability copy says Sold without changing inventory keys', () => {
  for (const file of ['shop.js', 'shop.html', 'product-detail.js', 'contact.js']) {
    assert.doesNotMatch(read(file), /Out of stock|Sold Out|Sold out|, sold out/);
    assert.match(read(file), /Sold/);
  }
  assert.match(read('shop.html'), /value="sold-out">Sold/);
});

test('viewer fades out without visibly resetting zoom and closed controls are inert', () => {
  const source = read('product-detail.js');
  const close = source.slice(source.indexOf('function closeLightbox()'), source.indexOf('function changeLightboxImage'));
  assert.doesNotMatch(close, /resetZoom\(\)/);
  assert.match(close, /lightbox.inert = true/);
  assert.match(source, /lightbox.inert = false/);
  assert.match(read('product.html'), /aria-hidden="true" inert/);
  assert.match(read('shop.css'), /display 220ms allow-discrete/);
});

test('product controls use local vector icons and expose selected gallery views', () => {
  assert.doesNotMatch(read('product.html'), /cdnjs|font-awesome|fas fa-/);
  assert.match(read('product.html'), /class="ui-icon"/);
  assert.match(read('product-detail.js'), /setAttribute\('aria-pressed', String\(i === index\)\)/);
});
