const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const context = vm.createContext({});
vm.runInContext(read('products.js').split('// ===== GLOBAL STATE =====')[0] + '\n' + read('image-manifest.js') + '\n' + read('image-utils.js'), context);

test('all product photos have valid smaller responsive assets', () => {
  const products = vm.runInContext('Object.values(productsData).flat()', context);
  const manifest = vm.runInContext('productImageManifest', context);
  let original = 0, optimized = 0;
  for (const product of products) {
    for (const source of product.images) {
      const entry = manifest[source];
      assert.ok(entry, source);
      assert.equal(entry.bytes, fs.statSync(path.join(root, source)).size);
      assert.ok(entry.width > 0 && entry.height > 0);
      assert.equal(entry.variants.length, 3);
      for (const variant of entry.variants) {
        const bytes = fs.readFileSync(path.join(root, variant.src));
        assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
        assert.equal(bytes.length, variant.bytes);
        assert.ok(variant.width <= entry.width);
      }
    }
    original += manifest[product.images[0]].bytes;
    optimized += manifest[product.images[0]].variants[1].bytes;
  }
  assert.ok(optimized < original * 0.1, '640px catalog must reduce image bytes by at least 90%');
});

test('responsive helper supports unknown new photos and safe original fallback', () => {
  assert.equal(vm.runInContext("responsiveImageData('new-photo.png', '50vw').src", context), 'new-photo.png');
  const markup = vm.runInContext("imageAttributes('Bundle/1/Mainimage.png', '46vw')", context);
  assert.match(markup, /320w, .*640w, .*960w/);
  assert.match(markup, /decoding="async"/);
  assert.match(markup, /data-original="Bundle\/1\/Mainimage.png"/);
  const image = { removeAttribute(name) { delete this[name]; } };
  context.sampleImage = image;
  vm.runInContext("setResponsiveImage(sampleImage, 'Bundle/1/Mainimage.png', '92vw')", context);
  assert.match(image.src, /\.webp$/);
  image.onerror();
  assert.equal(image.src, 'Bundle/1/Mainimage.png');
  assert.equal(image.onerror, null);
  assert.equal(image.srcset, undefined);
});

test('pages load responsive helpers before consumers; lightbox keeps originals on demand', () => {
  for (const [page, script] of [['shop.html','shop.js'],['product.html','product-detail.js'],['contact.html','contact.js']]) {
    const html = read(page);
    assert.ok(html.indexOf('image-manifest.js') < html.indexOf('image-utils.js'));
    assert.ok(html.indexOf('image-utils.js') < html.indexOf(`src="${script}`));
  }
  assert.match(read('shop.js'), /loading="lazy"/);
  assert.match(read('product-detail.js'), /lightboxImage.src = currentProduct.images\[index\]/);
  assert.match(read('product-detail.js'), /mainImage.fetchPriority = 'high'/);
});

test('redesigned pages do not initialize legacy gallery listeners or replace viewer globals', () => {
  const viewer = () => 'new viewer';
  const page = vm.createContext({
    document: { getElementById: () => null, addEventListener: () => { throw new Error('Legacy listener registered'); } },
    window: { closeLightbox: viewer, changeLightboxImage: viewer }
  });
  vm.runInContext(read('products.js'), page);
  assert.equal(page.window.closeLightbox, viewer);
  assert.equal(page.window.changeLightboxImage, viewer);
});
