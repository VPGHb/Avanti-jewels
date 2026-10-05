const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'products.js'), 'utf8');
const dataSource = source.slice(0, source.indexOf('// ===== GLOBAL STATE ====='));
const shopSource = fs.readFileSync(path.join(root, 'shop.js'), 'utf8').split('let searchTimer;')[0];
const imageSource = fs.readFileSync(path.join(root, 'image-utils.js'), 'utf8');

function loadCatalog(status = 'sold-out', query = '') {
  const context = vm.createContext({
    URLSearchParams,
    location: { pathname: '/shop.html', search: query },
    document: {
      querySelector: () => ({}),
      createElement: () => ({
        innerHTML: '',
        get textContent() { return this.innerHTML.replace(/<[^>]*>/g, ''); }
      })
    }
  });
  // Test editing inventory values without changing the real product data.
  const fixture = dataSource.replace(/("?status"?\s*:\s*)"sold-out"/g, `$1"${status}"`);
  vm.runInContext(fixture + '\n' + imageSource + '\n' + shopSource, context, { timeout: 1000 });
  return context;
}

for (const status of ['sold-out', 'out-of-stock', 'Out-of-stock ', ' OUT-OF-STOCK ', 'out of stock', 'out_of_stock']) {
  test(`${JSON.stringify(status)} displays and filters as sold out`, () => {
    const context = loadCatalog(status);
    const result = vm.runInContext(`
      state.availability = 'sold-out';
      ({ ids: getFilteredProducts().map(p => p.id).sort((a,b) => a-b),
         cards: getFilteredProducts().map(productCard) })
    `, context);
    assert.deepEqual(Array.from(result.ids), [103, 104, 106, 107, 115, 613, 701, 702, 704, 801, 809, 818]);
    for (const card of result.cards) {
      assert.match(card, /class="shop-product is-sold-out"/);
      assert.match(card, /class="availability sold-out">Sold/);
      assert.doesNotMatch(card, /Out of stock|sold out/i);
      assert.match(card, /class="sold-out-banner"/);
      assert.doesNotMatch(card, />Available</);
    }
    vm.runInContext("state.availability = 'in-stock'", context);
    assert.equal(vm.runInContext("getFilteredProducts().some(p => p.status !== 'in-stock')", context), false);
  });
}

test('out-of-stock query links select the sold-out filter', () => {
  const context = loadCatalog('Out-of-stock ', '?availability=out-of-stock');
  vm.runInContext('hydrateFromURL()', context);
  assert.equal(vm.runInContext('state.availability', context), 'sold-out');
});

test('normalization preserves inquiry-only pricing and available inventory', () => {
  const context = loadCatalog('Out-of-stock ');
  assert.equal(vm.runInContext('productsData.bundles.find(p => p.id === 818).price', context), null);
  assert.equal(vm.runInContext('productsData.kamarband.find(p => p.id === 703).status', context), 'in-stock');
});

test('every public listing is one of one and contains no numeric price', () => {
  const context = loadCatalog();
  const products = Array.from(vm.runInContext('catalogProducts', context));
  for (const product of products) {
    assert.equal(product.price, null, `Do not publish a numeric price for ${product.id}`);
    assert.equal(product.oneOfOne, true);
    assert.equal(product.quantity, 1);
    assert.doesNotMatch(vm.runInContext(`productCard(catalogProducts.find(p => p.id === ${product.id}))`, context), /\$\d/);
  }
  const detail = fs.readFileSync(path.join(root, 'product-detail.js'), 'utf8');
  const contact = fs.readFileSync(path.join(root, 'contact.js'), 'utf8');
  assert.doesNotMatch(detail, /priceCurrency|currentProduct\.price|product\.price/);
  assert.doesNotMatch(contact, /inquiryProduct\.price/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'product.html'), 'utf8'), /\$\d/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'shop.html'), 'utf8'), /value="price-/);
});

test('legacy price-sort URLs fall back to curated order', () => {
  const context = loadCatalog('sold-out', '?sort=price-high&category=bangles');
  vm.runInContext('hydrateFromURL()', context);
  assert.equal(vm.runInContext('state.sort', context), 'featured');
  assert.equal(vm.runInContext('state.category', context), 'bangles');
});

test('every listed product has concise appearance copy and retains its product ID', () => {
  const context = loadCatalog();
  const products = vm.runInContext('catalogProducts', context);
  assert.equal(products.length, 148);
  for (const product of products) {
    const [appearance, contents] = product.description.split('<br><br>');
    assert.ok(appearance.length > 30 && appearance.length < 200, `Description for ${product.id}`);
    assert.match(contents, new RegExp(`Product ID: ${product.id}$`));
    assert.doesNotMatch(appearance, /\b(diamond|ruby|emerald|sapphire|pearl|plated|karat|handmade|hypoallergenic|genuine)\b/i);
    assert.doesNotMatch(appearance, /\b(?:gold|silver)\b(?!-tone)/i);
  }
});

test('catalog cards are image-only while search still finds appearance details', () => {
  const context = loadCatalog();
  const card = vm.runInContext('productCard(catalogProducts.find(p => p.id === 905))', context);
  assert.doesNotMatch(card, /butterfly shapes|<h3|card-description|One of one|Price available by inquiry/);
  assert.match(card, /product-id-overlay">No. 905/);
  assert.match(card, /availability in-stock">Available/);
  assert.doesNotMatch(card, /Includes:/);
  vm.runInContext("state.query = 'butterfly'", context);
  assert.ok(vm.runInContext('getFilteredProducts().some(p => p.id === 905)', context));
});

test('new one-of-one arrivals remain available while prices are pending', () => {
  const context = loadCatalog();
  const newIds = [116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,137,205,206,207,208,209,614,615,616,617,618,710,711,712,713,714,715,820,821,822,823,824,825,826,827,912,913,1001,1002,1003,1004,1005];
  context.newIds = newIds;
  const products = vm.runInContext('catalogProducts.filter(product => newIds.includes(product.id))', context);
  assert.equal(products.length, newIds.length);
  for (const product of products) {
    assert.equal(product.status, 'in-stock');
    assert.equal(product.price, null);
    assert.equal(product.oneOfOne, true);
  }
  assert.equal(products.filter(product => [205, 206, 207, 208, 209].includes(product.id)).every(product => product.category === 'kamarband' && product.name === 'Kamarband'), true);
  const card = vm.runInContext('productCard(catalogProducts.find(product => product.id === 116))', context);
  assert.doesNotMatch(card, /Price available by inquiry|One of one/);
  assert.match(card, /product-id-overlay">No. 116/);
});

test('reviewed galleries retain unique IDs, confirmed categories and view ordering', () => {
  const context = loadCatalog();
  const products = Array.from(vm.runInContext('catalogProducts', context));
  assert.equal(new Set(products.map(p => p.id)).size, products.length);
  assert.equal(products.some(p => p.id === 136), false);
  for (const id of [116,117,118,119,120,121,122,124,125,126,127,128,129,130,131,132,133,134,137,614,615,616,617,618,710,711,712]) {
    const product = products.find(p => p.id === id);
    assert.equal(product.images.length, 2, `Gallery for ${id}`);
    assert.match(product.images[0], /Mainimage\.png$/);
    assert.match(product.images[1], /Manakin\.png$/);
    assert.equal(path.dirname(product.images[0]), path.dirname(product.images[1]));
  }
  for (const id of [710,711,712,713,714,715,912,913]) {
    const product = products.find(p => p.id === id);
    assert.equal(product.category, 'kamarband');
    assert.ok(product.images.every(image => image.startsWith('Kamarband/')));
  }
  for (const id of [912,913]) assert.equal(products.find(p => p.id === id).images.length, 1);
  for (let id = 820; id <= 827; id++) {
    const product = products.find(p => p.id === id);
    assert.equal(product.category, 'bundles');
    assert.equal(product.images.length, 2);
  }
  const selected = products.find(p => p.id === 137).images[1];
  // Fingerprint of the client-approved image #73; review drafts stay unpublished.
  const selectedHash = createHash('sha256').update(fs.readFileSync(path.join(root, selected))).digest('hex');
  assert.equal(selectedHash, '8f205968d1c67605cb42c842cc1bfcbc50bb0caee5a65e3932ec157737789454');
});
