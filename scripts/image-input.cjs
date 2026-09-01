const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'products.js'), 'utf8');
const products = vm.runInNewContext(source.split('// ===== GLOBAL STATE =====')[0] + ';Object.values(productsData).flat()');
process.stdout.write(JSON.stringify(products));
