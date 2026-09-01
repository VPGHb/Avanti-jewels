const categoryLabels = {
  bundles: 'Complete Sets',
  necklaces: 'Necklaces',
  bracelets: 'Bracelets',
  earrings: 'Earrings',
  rings: 'Rings',
  bangles: 'Bangles',
  kamarband: 'Kamarband',
  'mang-tikka': 'Mang Tikka',
  pendants: 'Pendants'
};

const categoryOrder = ['bundles', 'necklaces', 'earrings', 'bangles', 'bracelets', 'rings', 'pendants', 'mang-tikka', 'kamarband'];
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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function buildCategoryButtons() {
  const buttons = [{ key: 'all', label: 'All jewelry', count: catalogProducts.length }, ...categoryOrder.map(key => ({ key, label: categoryLabels[key], count: (productsData[key] || []).length }))];
  categoryFilter.innerHTML = buttons.map(item => `<button type="button" data-category="${item.key}" aria-pressed="${item.key === state.category}"><span>${item.label}</span><small>${item.count}</small></button>`).join('');
}

function productCard(product) {
  const image = product.images?.[0] || '';
  // Keep cards concise; the detail page retains the contents and product ID below.
  const description = plainText(product.description.split(/<br\s*\/?>\s*<br\s*\/?>/i)[0]).replace(/Product ID:\s*\d+/i, '').trim();
  const soldOut = product.status === 'sold-out';
  return `<a class="shop-product${soldOut ? ' is-sold-out' : ''}" href="product.html?id=${product.id}" aria-label="View ${escapeHTML(product.name)}, product ${product.id}${soldOut ? ', sold out' : ''}">
    <div class="shop-product-image">
      <img ${imageAttributes(image, '(max-width: 760px) 46vw, (max-width: 1024px) 30vw, (max-width: 1560px) 23vw, 345px')} alt="${escapeHTML(product.name)} from Avanti Jewels" loading="lazy">
      <span class="availability ${product.status}">${product.status === 'in-stock' ? 'Available' : 'Sold out'}</span>
      ${soldOut ? '<span class="sold-out-banner" aria-hidden="true">Currently sold out</span>' : ''}
      <span class="product-arrow" aria-hidden="true">↗</span>
    </div>
    <div class="shop-product-copy">
      <div><h3>${escapeHTML(product.name)}</h3><p>${escapeHTML(description || categoryLabels[product.category])}</p></div>
      <div><strong>${formatPrice(product.price)}</strong><small>No. ${product.id}</small></div>
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

  if (state.sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
  if (state.sort === 'price-high') filtered.sort((a, b) => b.price - a.price);
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
    <div class="product-section-heading"><div><p>Collection</p><h2 id="section-${group.category}">${categoryLabels[group.category]}</h2></div><span>${group.products.length} ${group.products.length === 1 ? 'piece' : 'pieces'}</span></div>
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
  updateURL();
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
  state.sort = ['price-low', 'price-high', 'name'].includes(params.get('sort')) ? params.get('sort') : 'featured';
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
categoryFilter.addEventListener('click', event => { const button = event.target.closest('button[data-category]'); if (!button) return; state.category = button.dataset.category; render(); });
resetButton.addEventListener('click', resetFilters);
document.querySelector('#empty-reset').addEventListener('click', resetFilters);

hydrateFromURL();
buildCategoryButtons();
render();
