const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildPages } = require('../scripts/build-pages.cjs');
test('public deployment includes storefront assets but excludes drafts and backups', () => {
  const output = buildPages();
  for (const file of ['shop.html','product.html','privacy.html','catalog-memory.js','Bangle/18/Mainimage.png','Bangle/18/Manakin.png','images/favicon-48.png','CNAME']) assert.ok(fs.existsSync(path.join(output,file)),file);
  for (const file of ['photo-previews','PROJECT-HANDOFF.md','PRODUCT-PHOTO-AUDIT.md','design-system','scripts','tests','.git','Bangle/18/Mainimage-before-approved-redo.png']) assert.equal(fs.existsSync(path.join(output,file)),false,file);
  assert.equal(path.dirname(output),require('node:os').tmpdir());
  assert.ok(path.basename(output).startsWith('avanti-pages-'));
  fs.rmSync(output,{recursive:true});
});
