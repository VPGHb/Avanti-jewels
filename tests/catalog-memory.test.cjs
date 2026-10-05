const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../catalog-memory.js'), 'utf8');
function page(url, storage, links = [], y = 0) {
  const events = {}, scrolls = [];
  vm.runInNewContext(source, {
    URL, location: new URL(url),
    sessionStorage: { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) },
    window: { scrollY: y, scrollTo: value => scrolls.push(value.top), addEventListener: (n,f) => events[n] = f },
    document: { addEventListener: (n,f) => events[n] = f, querySelectorAll: () => links }
  });
  return { events, scrolls, ready: () => events.DOMContentLoaded(), click: link => events.click({ button:0, target:{closest:()=>link} }) };
}
test('return links restore the catalog URL, filters, and scroll before reveal', () => {
  const storage = new Map();
  const catalogURL = 'http://localhost/shop.html?category=bangles&sort=id';
  const catalog = page(catalogURL, storage, [], 1450);
  catalog.events.pagehide();
  const home = { href:'http://localhost/shop.html', dataset:{}, hasAttribute:()=>false };
  const category = { href:'http://localhost/shop.html?category=bracelets' };
  const detail = page('http://localhost/product.html?id=618', storage, [home, category]);
  detail.ready();
  assert.equal(home.href, catalogURL);
  assert.equal(category.href, 'http://localhost/shop.html?category=bracelets');
  detail.click(home);
  const returned = page(home.href, storage);
  returned.ready();
  returned.events.pagereveal();
  assert.deepEqual(returned.scrolls, [1450,1450]);
  assert.equal(storage.has('avanti-catalog-return'), false);
  returned.events.pageshow({persisted:true});
  returned.events.pagereveal();
  assert.deepEqual(returned.scrolls, [1450,1450]);
});
test('fresh catalog visits and untrusted saved URLs never restore scroll', () => {
  for (const url of ['http://localhost/shop.html', 'https://other.example/shop.html', 'http://localhost/contact.html']) {
    const storage = new Map([['avanti-catalog-position', JSON.stringify({url,y:1000})]]);
    const catalog = page('http://localhost/shop.html', storage);
    catalog.ready();
    assert.deepEqual(catalog.scrolls, []);
  }
});
