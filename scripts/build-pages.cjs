// Stage only public files; preserve local draft photos, backups and internal notes.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function buildPages() {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'avanti-pages-'));
  const files = new Set(['.nojekyll','CNAME','robots.txt','sitemap.xml','llms.txt',
    'shop.css','products.js','image-manifest.js','image-utils.js','shop.js',
    'product-detail.js','contact.js','navigation-motion.js','catalog-memory.js','site-support.js']);
  for (const file of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
    files.add(file);
    const html = fs.readFileSync(path.join(root,file),'utf8');
    for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
      if (/^(?:https?:|mailto:|tel:|data:)/.test(match[1])) continue;
      files.add(decodeURIComponent(match[1].split(/[?#]/)[0]).replace(/^\//, ''));
    }
    for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
      for (const candidate of match[1].split(',')) files.add(candidate.trim().split(/\s+/)[0]);
    }
  }
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root,'products.js'),'utf8').split('// ===== GLOBAL STATE =====')[0] +
    '\n' + fs.readFileSync(path.join(root,'image-manifest.js'),'utf8'),context);
  const products = vm.runInContext('Object.values(productsData).flat()',context);
  const manifest = vm.runInContext('productImageManifest',context);
  for (const product of products) for (const image of product.images) {
    files.add(image);
    for (const variant of manifest[image]?.variants || []) files.add(variant.src);
  }
  for (const file of files) {
    const source = path.resolve(root,file);
    const relative = path.relative(root,source);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || !fs.statSync(source).isFile()) throw new Error(`Invalid public asset: ${file}`);
    const destination = path.join(output,relative);
    fs.mkdirSync(path.dirname(destination),{recursive:true});
    fs.copyFileSync(source,destination);
  }
  return output;
}
module.exports = { buildPages };
if (require.main === module) process.stdout.write(buildPages());
