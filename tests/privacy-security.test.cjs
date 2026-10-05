const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname,'..',file),'utf8');
test('optional memory is off by default; Allow enables it and Reject clears it', () => {
  const events = {}, local = new Map(), session = new Map(['avanti-catalog-position','avanti-catalog-return','avanti-photo-navigation'].map(k=>[k,'value']));
  const element = () => ({dataset:{},setAttribute(){},appendChild(){},querySelector(){return {focus(){}};}});
  const window = {};
  vm.runInNewContext(read('site-support.js'),{
    window, HTMLImageElement:class {},
    localStorage:{getItem:k=>local.get(k),setItem:(k,v)=>local.set(k,v)},
    sessionStorage:{removeItem:k=>session.delete(k)},
    document:{addEventListener:(n,f)=>events[n]=f,createElement:element,body:{appendChild(){}},head:{appendChild(){}},querySelector:()=>null,querySelectorAll:()=>[]}
  });
  assert.equal(window.avantiPrivacy.memoryAllowed(),false);
  events.DOMContentLoaded();
  const choose = value => events.click({target:{closest:s=>s==='[data-memory]'?{dataset:{memory:value}}:null}});
  choose('yes');
  assert.equal(window.avantiPrivacy.memoryAllowed(),true);
  assert.equal(JSON.parse(local.get('avanti-privacy-choice-v1')).memory,true);
  choose('no');
  assert.equal(window.avantiPrivacy.memoryAllowed(),false);
  assert.equal(session.size,0);
});
test('storefront CSP blocks external scripts, embeds and network submissions without inline handlers', () => {
  for (const file of ['shop.html','product.html','about.html','contact.html','terms.html','privacy.html','cookies.html','accessibility.html','404.html']) {
    const html = read(file);
    assert.match(html,/Content-Security-Policy/);
    assert.match(html,/script-src 'self';/);
    assert.match(html,/connect-src 'none'/);
    assert.match(html,/frame-src 'none'/);
    assert.doesNotMatch(html, /\son(?:click|error|load)\s*=|<iframe|<form|<script[^>]+src="https?:/i);
  }
  assert.doesNotMatch(read('image-utils.js'),/onerror=/);
  assert.match(read('product-detail.js'),/getElementById\('product-description'\)\.textContent/);
  assert.match(read('product-detail.js'),/escapeProductText\(product.name\)/);
});
test('policy and error pages use honest defaults and crawl rules', () => {
  assert.match(read('cookies.html'),/off until you choose/);
  assert.match(read('404.html'),/name="robots" content="noindex"/);
  assert.doesNotMatch(read('sitemap.xml'),/404.html/);
  assert.match(read('sitemap.xml'),/cookies.html/);
  assert.match(read('sitemap.xml'),/accessibility.html/);
});
test('primary text colors meet WCAG AA against the ivory surface', () => {
  const css = read('shop.css');
  const color = token => css.match(new RegExp('--'+token+': #([a-f0-9]{6})'))[1];
  const lum = hex => { const rgb=hex.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722; };
  for(const token of ['ink','muted','garnet','gold']) {
    const a=lum(color(token)),b=lum(color('paper'));
    assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,token);
  }
});
