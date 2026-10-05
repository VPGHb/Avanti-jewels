const categoryLabels = productCategoryLabels;

const categoryOrder = ['bundles', 'necklaces', 'earrings', 'bangles', 'bracelets', 'watches', 'anklets', 'rings', 'pendants', 'mang-tikka', 'kamarband', 'kandora'];
const catalogProducts = categoryOrder.flatMap(category => (productsData[category] || []).map(product => ({ ...product, category })));
const state = { query: '', category: 'all', availability: 'all', sort: 'featured' };

const searchInput = document.querySelector('#catalog-search');
const clearSearch = document.querySelector('#clear-search');
const availabilitySelect = document.querySelector('#availability-filter');
const sortSelect = document.querySelector('#sort-products');
const categoryFilter = document.querySelector('#category-filter');
const catalogSections = document.querySelector('#catalog-sections');
const resultsSummary = document.querySelector('#results-summary');
const resetButton = document.querySelector('#reset-filters');
const emptyState = document.querySelector('#catalog-empty');

function plainText(value = '') {
  const element = document.createElement('div');
  element.innerHTML = value;
  return (element.textContent || '').replace(/\s+/g, ' ').trim();
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function formatPrice(value) {
  return 'Price available by inquiry';
}

function buildCategoryButtons() {
  const buttons = [{ key: 'all', label: 'All jewelry', count: catalogProducts.length }, ...categoryOrder.map(key => ({ key, label: categoryLabels[key], count: (productsData[key] || []).length }))];
  categoryFilter.innerHTML = buttons.map(item => `<button type="button" data-category="${item.key}" aria-pressed="${item.key === state.category}"><span>${item.label}</span><small>${item.count}</small></button>`).join('');
}

function productCard(product) {
  const image = product.images?.[0] || '';
  // Browsing is photo-led; names and descriptions remain on the detail page.
  const soldOut = product.status === 'sold-out';
  return `<a class="shop-product${soldOut ? ' is-sold-out' : ''}" href="product.html?id=${product.id}" aria-label="View ${escapeHTML(product.name)}, product ${product.id}${soldOut ? ', sold' : ''}">
    <div class="shop-product-image">
      <img ${imageAttributes(image, '(max-width: 760px) 46vw, (max-width: 1024px) 30vw, (max-width: 1560px) 23vw, 345px')} alt="${escapeHTML(product.name)} from Avanti Jewels" loading="lazy">
      <span class="product-id-overlay">No. ${product.id}</span>
      <span class="availability ${product.status}">${soldOut ? 'Sold' : 'Available'}</span>
      ${soldOut ? '<span class="sold-out-banner" aria-hidden="true">Sold</span>' : ''}
    </div>
  </a>`;
}

function getFilteredProducts() {
  const query = state.query.toLowerCase();
  const filtered = catalogProducts.filter(product => {
    const searchValue = `${product.name} ${plainText(product.description)} ${product.id} ${categoryLabels[product.category]}`.toLowerCase();
    return (!query || searchValue.includes(query)) &&
      (state.category === 'all' || product.category === state.category) &&
      (state.availability === 'all' || product.status === state.availability);
  });

  if (state.sort === 'id') filtered.sort((a, b) => a.id - b.id);
  if (state.sort === 'featured') filtered.sort((a, b) => Number(a.status === 'sold-out') - Number(b.status === 'sold-out'));
  if (state.sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
  return filtered;
}

function updateURL() {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.category !== 'all') params.set('category', state.category);
  if (state.availability !== 'all') params.set('availability', state.availability);
  if (state.sort !== 'featured') params.set('sort', state.sort);
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}`);
}

function render() {
  const products = getFilteredProducts();
  const groups = categoryOrder.map(category => ({ category, products: products.filter(product => product.category === category) })).filter(group => group.products.length);
  catalogSections.innerHTML = groups.map(group => `<section class="product-section" aria-labelledby="section-${group.category}">
    <div class="product-section-heading"><h2 id="section-${group.category}">${categoryLabels[group.category]}</h2><span>${group.products.length} ${group.products.length === 1 ? 'piece' : 'pieces'}</span></div>
    <div class="shop-product-grid">${group.products.map(productCard).join('')}</div>
  </section>`).join('');
  catalogSections.setAttribute('aria-busy', 'false');
  catalogSections.hidden = products.length === 0;
  emptyState.hidden = products.length !== 0;
  resultsSummary.textContent = `${products.length} ${products.length === 1 ? 'piece' : 'pieces'} shown`;
  const hasFilters = Boolean(state.query) || state.category !== 'all' || state.availability !== 'all' || state.sort !== 'featured';
  resetButton.hidden = !hasFilters;
  clearSearch.hidden = !state.query;
  categoryFilter.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === state.category)));
  document.querySelector('#toggle-collections').textContent = `${state.category === 'all' ? 'All jewelry' : categoryLabels[state.category]} / Change collection`;
  updateURL();
  if (document.documentElement?.dataset.input === 'pointer' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    catalogSections.getAnimations().forEach(animation => animation.cancel());
    catalogSections.animate([{ opacity: .65, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 180, easing: 'cubic-bezier(.23,1,.32,1)' });
  }
}

function resetFilters() {
  Object.assign(state, { query: '', category: 'all', availability: 'all', sort: 'featured' });
  searchInput.value = '';
  availabilitySelect.value = 'all';
  sortSelect.value = 'featured';
  render();
  searchInput.focus();
}

function hydrateFromURL() {
  const params = new URLSearchParams(location.search);
  state.query = params.get('q') || '';
  state.category = categoryLabels[params.get('category')] ? params.get('category') : 'all';
  const availability = normalizeProductStatus(params.get('availability'));
  state.availability = ['in-stock', 'sold-out'].includes(availability) ? availability : 'all';
  state.sort = ['id', 'name'].includes(params.get('sort')) ? params.get('sort') : 'featured';
  searchInput.value = state.query;
  availabilitySelect.value = state.availability;
  sortSelect.value = state.sort;
}

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.query = searchInput.value.trim(); render(); }, 120);
});
clearSearch.addEventListener('click', () => { searchInput.value = ''; state.query = ''; render(); searchInput.focus(); });
availabilitySelect.addEventListener('change', () => { state.availability = availabilitySelect.value; render(); });
sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; render(); });
categoryFilter.addEventListener('click', event => {
  const button = event.target.closest('button[data-category]');
  if (!button) return;
  state.category = button.dataset.category;
  render();
  setCollectionsOpen(false);
  if (mobileCollections.matches) collectionToggle.focus({ preventScroll: true });
  scrollToCategoryStart();
});
const collectionToggle = document.querySelector('#toggle-collections');
const collectionPanel = document.querySelector('#collections-panel');
const mobileCollections = window.matchMedia('(max-width: 760px)');
let categoryScrollRequest = 0;
async function scrollToCategoryStart() {
  const request = ++categoryScrollRequest;
  // Measure the destination only after the mobile menu has finished collapsing.
  if (mobileCollections.matches) {
    await Promise.all(collectionPanel.getAnimations().map(animation => animation.finished.catch(() => {})));
  }
  if (request !== categoryScrollRequest) return;
  const start = catalogSections.querySelector('.product-section-heading') || emptyState;
  const smooth = document.documentElement.dataset.input === 'pointer' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  start.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'instant' });
}
function setCollectionsOpen(open) {
  collectionToggle.setAttribute('aria-expanded', String(open));
  document.querySelector('.catalog-sidebar').classList.toggle('is-open', open);
  collectionPanel.inert = mobileCollections.matches && !open;
  collectionPanel.style.height = mobileCollections.matches ? (open ? `${categoryFilter.scrollHeight}px` : '0px') : '';
}
collectionToggle.addEventListener('click', () => {
  setCollectionsOpen(collectionToggle.getAttribute('aria-expanded') !== 'true');
});
collectionPanel.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobileCollections.matches) {
    setCollectionsOpen(false);
    collectionToggle.focus({ preventScroll: true });
  }
});
window.addEventListener('resize', () => setCollectionsOpen(collectionToggle.getAttribute('aria-expanded') === 'true'));
document.addEventListener('pointerdown', () => { document.documentElement.dataset.input = 'pointer'; }, { passive: true });
document.addEventListener('keydown', () => { document.documentElement.dataset.input = 'keyboard'; });
resetButton.addEventListener('click', resetFilters);
document.querySelector('#empty-reset').addEventListener('click', resetFilters);

hydrateFromURL();
buildCategoryButtons();
render();
setCollectionsOpen(false);
