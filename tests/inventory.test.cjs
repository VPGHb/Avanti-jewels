const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

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
  const fixture = dataSource.replaceAll('status: "sold-out"', `status: "${status}"`);
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
      assert.match(card, /class="availability sold-out">Sold out/);
      assert.match(card, /Currently sold out/);
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

test('normalization preserves prices and available inventory', () => {
  const context = loadCatalog('Out-of-stock ');
  assert.equal(vm.runInContext('productsData.bundles.find(p => p.id === 818).price', context), 70);
  assert.equal(vm.runInContext('productsData.kamarband.find(p => p.id === 703).status', context), 'in-stock');
});

test('every listed product has concise appearance copy and retains its product ID', () => {
  const context = loadCatalog();
  const products = vm.runInContext('catalogProducts', context);
  assert.equal(products.length, 96);
  for (const product of products) {
    const [appearance, contents] = product.description.split('<br><br>');
    assert.ok(appearance.length > 30 && appearance.length < 200, `Description for ${product.id}`);
    assert.match(contents, new RegExp(`Product ID: ${product.id}$`));
    assert.doesNotMatch(appearance, /\b(diamond|ruby|emerald|sapphire|pearl|plated|karat|handmade|hypoallergenic|genuine)\b/i);
    assert.doesNotMatch(appearance, /\b(?:gold|silver)\b(?!-tone)/i);
  }
});

test('catalog cards display appearance copy and search can find visible features', () => {
  const context = loadCatalog();
  const card = vm.runInContext('productCard(catalogProducts.find(p => p.id === 905))', context);
  assert.match(card, /butterfly shapes/);
  assert.doesNotMatch(card, /Includes:/);
  vm.runInContext("state.query = 'butterfly'", context);
  assert.ok(vm.runInContext('getFilteredProducts().some(p => p.id === 905)', context));
});
