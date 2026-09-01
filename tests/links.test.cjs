const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function exactPath(relative) {
  let current = root;
  for (const segment of relative.replaceAll('\\', '/').split('/')) {
    const match = fs.readdirSync(current).find(name => name === segment);
    if (!match) return false;
    current = path.join(current, match);
  }
  return fs.existsSync(current);
}

test('HTML local links and assets exist with production-safe casing', () => {
  for (const file of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
      const target = match[1];
      if (!target || /^(?:https?:|mailto:|tel:|data:)/.test(target)) continue;
      const clean = decodeURIComponent(target.split('?')[0]);
      assert.ok(exactPath(clean), `${file}: ${target}`);
    }
  }
});

test('every product image exists with production-safe casing', () => {
  const source = fs.readFileSync(path.join(root, 'products.js'), 'utf8');
  const products = vm.runInNewContext(source.split('// ===== GLOBAL STATE =====')[0] + ';Object.values(productsData).flat()');
  for (const product of products) for (const image of product.images) assert.ok(exactPath(image), `Product ${product.id}: ${image}`);
});

test('GitHub Pages production files and canonical domain are present', () => {
  assert.equal(fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim(), 'avantijewels.com');
  assert.ok(fs.existsSync(path.join(root, '.nojekyll')));
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'static.yml'), 'utf8');
  assert.match(workflow, /branches: \["main"\]/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  for (const page of ['shop.html','about.html','contact.html','terms.html','privacy.html']) assert.match(fs.readFileSync(path.join(root, page), 'utf8'), /https:\/\/avantijewels\.com\//);
});
