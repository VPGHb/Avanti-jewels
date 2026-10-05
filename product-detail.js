// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
// Preserve old duplicate-product links while showing the retained product.
const requestedProductId = parseInt(urlParams.get('id')) || 1;
const productId = requestedProductId === 136 ? 132 : requestedProductId;

// Global variables
let currentProduct = null;
let currentImageIndex = 0;
let zoomScale = 1;
let isDraggingImage = false;
let dragStartX = 0;
let dragStartY = 0;
let dragScrollLeft = 0;
let dragScrollTop = 0;
let viewerReturnFocus = null;

// Function to get all products from products.js
function getAllProducts() {
    const allItems = [];
    
    if (typeof productsData !== 'undefined') {
        const categories = ['bundles', 'necklaces', 'bracelets', 'anklets', 'earrings', 'rings', 'bangles', 'kamarband', 'mang-tikka', 'pendants'];
        
        categories.forEach(category => {
            if (productsData[category]) {
                productsData[category].forEach(product => {
                    allItems.push(product);
                });
            }
        });
    } else {
        console.error('productsData is not defined. Make sure products.js is loaded before product-detail.js');
    }
    
    return allItems;
}

// SIMPLIFIED: Just return the path as-is
function fixImagePath(imgPath) {
    return imgPath || '';
}

function escapeProductText(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

// Load product data
function loadProductData() {
    const allProducts = getAllProducts();
    
    if (allProducts.length === 0) {
        console.error('No products found. Redirecting to home page.');
        window.location.replace('404.html');
        return;
    }
    
    currentProduct = allProducts.find(p => p.id === productId);
    
    if (!currentProduct) {
        console.error('Product not found. Redirecting to home page.');
        window.location.replace('404.html');
        return;
    }
    
    displayProductDetails();
    displayRelatedProducts();
}

// Display product details
function displayProductDetails() {
    document.title = `${currentProduct.name} · No. ${currentProduct.id} | Avanti Jewels`;
    const plainDescription = currentProduct.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.content = `${currentProduct.name}. ${plainDescription} One-of-a-kind Indian jewelry. Contact Avanti Jewels for pricing and availability.`;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = `https://avantijewels.com/product.html?id=${currentProduct.id}`;
    const description = metaDescription?.content || plainDescription;
    const shareImage = new URL(currentProduct.images[0], 'https://avantijewels.com/').href;
    for (const [selector, value] of [
        ['meta[property="og:title"]', document.title],
        ['meta[property="og:description"]', description],
        ['meta[property="og:url"]', canonical.href],
        ['meta[property="og:image"]', shareImage],
        ['meta[property="og:image:alt"]', `${currentProduct.name}, product ${currentProduct.id}`],
        ['meta[name="twitter:title"]', document.title],
        ['meta[name="twitter:description"]', description],
        ['meta[name="twitter:image"]', shareImage]
    ]) document.querySelector(selector)?.setAttribute('content', value);

    const productSchema = document.createElement('script');
    productSchema.type = 'application/ld+json';
    productSchema.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: currentProduct.name,
        description: plainDescription,
        url: canonical.href,
        image: currentProduct.images.map(image => new URL(image, 'https://avantijewels.com/').href),
        sku: String(currentProduct.id),
        brand: { '@type': 'Brand', name: 'Avanti Jewels' },
        additionalProperty: { '@type': 'PropertyValue', name: 'Edition size', value: 1 }
    });
    document.head.appendChild(productSchema);
    document.getElementById('product-title').textContent = currentProduct.name;
    document.getElementById('product-price').textContent = currentProduct.status === 'in-stock'
        ? 'Pricing by personal inquiry' : 'This one-of-a-kind piece has sold';
    document.getElementById('product-description').textContent = currentProduct.description.replace(/<\/?br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
    document.getElementById('product-number').textContent = currentProduct.id;
    document.getElementById('product-category').textContent = currentProduct.category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    document.getElementById('product-inquire').href = `contact.html?product=${currentProduct.id}`;
    document.querySelector('.main-image-trigger').setAttribute('aria-label', `Open image viewer for ${currentProduct.name}`);
    
    const statusBadge = document.getElementById('product-status');
    statusBadge.textContent = currentProduct.status === 'in-stock'
        ? 'One of one / Available'
        : 'Sold';
    statusBadge.className = `status-badge ${currentProduct.status}`;
    
    loadProductImages();
}

// SIMPLIFIED: Load product images
function loadProductImages() {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    
    if (currentProduct.images && currentProduct.images.length > 0) {
        // Set main image
        const status = document.getElementById('gallery-load-status');
        const finishLoading = () => { if (status) status.hidden = true; };
        mainImage.addEventListener('load', finishLoading);
        mainImage.loading = 'eager';
        mainImage.fetchPriority = 'high';
        setResponsiveImage(mainImage, currentProduct.images[0], '(max-width: 760px) 92vw, 50vw');
        mainImage.alt = `${currentProduct.name}, view 1`;
        if (mainImage.complete && mainImage.naturalWidth > 1) finishLoading();
        
        // Clear thumbnails
        thumbnailContainer.innerHTML = '';
        
        // Create thumbnails
        currentProduct.images.forEach((imgSrc, index) => {
            const thumbnail = document.createElement('button');
            thumbnail.type = 'button';
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.setAttribute('aria-label', `View image ${index + 1} of ${currentProduct.images.length}`);
            thumbnail.setAttribute('aria-pressed', String(index === 0));
            
            const img = document.createElement('img');
            img.loading = 'lazy';
            setResponsiveImage(img, imgSrc, '78px');
            img.alt = `${currentProduct.name} view ${index + 1}`;
            
            
            thumbnail.appendChild(img);
            thumbnail.addEventListener('click', () => {
                setMainImage(index);
            });
            
            thumbnailContainer.appendChild(thumbnail);
        });
    } else {
        // No images, show placeholder
        mainImage.src = 'https://via.placeholder.com/600x800/EEE1C6/666?text=No+Image+Available';
        mainImage.alt = 'No image available';
    }
}

// Set main image from thumbnail
function setMainImage(index) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    setResponsiveImage(mainImage, currentProduct.images[index], '(max-width: 760px) 92vw, 50vw');
    mainImage.alt = `${currentProduct.name}, view ${index + 1}`;
    currentImageIndex = index;
    
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
        thumb.setAttribute('aria-pressed', String(i === index));
    });
}

// Lightbox functionality
function openLightbox(index = currentImageIndex) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const currentIndexSpan = document.getElementById('current-index');
    const totalImagesSpan = document.getElementById('total-images');
    
    if (currentProduct.images && currentProduct.images.length > 0) {
        lightboxImage.src = currentProduct.images[index];
        lightboxImage.alt = `${currentProduct.name}, view ${index + 1}`;
        currentImageIndex = index;
        currentIndexSpan.textContent = index + 1;
        totalImagesSpan.textContent = currentProduct.images.length;
        updateLightboxNavigation();
        viewerReturnFocus = document.activeElement;
        lightbox.inert = false;
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        window.requestAnimationFrame(resetZoom);
        window.setTimeout(() => lightbox.querySelector('.close-lightbox')?.focus(), 0);
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    lightbox.inert = true;
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (viewerReturnFocus instanceof HTMLElement) viewerReturnFocus.focus({ preventScroll: true });
}

function changeLightboxImage(direction) {
    const newIndex = currentImageIndex + direction;
    
    if (newIndex >= 0 && newIndex < currentProduct.images.length) {
        currentImageIndex = newIndex;
        document.getElementById('lightbox-image').src = currentProduct.images[currentImageIndex];
        document.getElementById('lightbox-image').alt = `${currentProduct.name}, view ${currentImageIndex + 1}`;
        document.getElementById('current-index').textContent = currentImageIndex + 1;
        resetZoom();
        updateLightboxNavigation();
    }
}

function updateLightboxNavigation() {
    const previous = document.querySelector('.lightbox-nav.prev');
    const next = document.querySelector('.lightbox-nav.next');
    previous.disabled = currentImageIndex === 0;
    next.disabled = currentImageIndex === currentProduct.images.length - 1;
}

function updateZoomViewer() {
    const image = document.getElementById('lightbox-image');
    const canvas = document.querySelector('.lightbox-image-container');
    const zoomLevel = document.getElementById('zoom-level');
    const zoomOut = document.getElementById('zoom-out');
    const zoomIn = document.getElementById('zoom-in');

    if (!image.naturalWidth || !image.naturalHeight || !canvas.clientWidth || !canvas.clientHeight) return;

    const inset = window.innerWidth <= 760 ? 20 : 56;
    const availableWidth = Math.max(canvas.clientWidth - inset, 1);
    const availableHeight = Math.max(canvas.clientHeight - inset, 1);
    const fittedScale = Math.min(availableWidth / image.naturalWidth, availableHeight / image.naturalHeight);
    image.style.width = `${image.naturalWidth * fittedScale * zoomScale}px`;
    image.style.height = `${image.naturalHeight * fittedScale * zoomScale}px`;
    image.classList.toggle('is-zoomed', zoomScale > 1);
    zoomLevel.value = `${Math.round(zoomScale * 100)}%`;
    zoomLevel.textContent = `${Math.round(zoomScale * 100)}%`;
    zoomOut.disabled = zoomScale <= 1;
    zoomIn.disabled = zoomScale >= 3;

    window.requestAnimationFrame(() => {
        canvas.scrollLeft = Math.max(0, (canvas.scrollWidth - canvas.clientWidth) / 2);
        canvas.scrollTop = Math.max(0, (canvas.scrollHeight - canvas.clientHeight) / 2);
    });
}

function changeZoom(amount) {
    const nextScale = Math.min(3, Math.max(1, zoomScale + amount));
    zoomScale = nextScale;
    updateZoomViewer();
}

function resetZoom() {
    zoomScale = 1;
    const image = document.getElementById('lightbox-image');
    if (image) updateZoomViewer();
}

function displayRelatedProducts() {
    const relatedContainer = document.getElementById('related-products');
    const allProducts = getAllProducts();
    
    // Get 3 products from same category
    const sameCategory = allProducts.filter(p => 
        p.category === currentProduct.category && p.id !== productId
    );
    
    const related = sameCategory.slice(0, 3);
    const categoryLink = `shop.html?category=${encodeURIComponent(currentProduct.category)}`;
    const categoryName = currentProduct.category.charAt(0).toUpperCase() + 
                        currentProduct.category.slice(1).replace('-', ' ');
    
    if (related.length === 0) {
        relatedContainer.innerHTML = `
            <p style="text-align: center; color: #666; padding: 40px;">
                No related products found.<br>
                <a href="${categoryLink}" class="see-more-btn" style="margin-top: 20px; display: inline-block;">
                    View All ${categoryName}
                </a>
            </p>
        `;
        return;
    }
    
    // Build products HTML
    let productsHTML = `<div class="product-grid">`;
    
    related.forEach(product => {
        const image = product.images?.[0] || 
                     `https://via.placeholder.com/300x400/EEE1C6/666?text=${product.name}`;
        
        productsHTML += `
        <a class="product-card" href="product.html?id=${product.id}">
            <div class="product-image">
                <img ${imageAttributes(image, '(max-width: 760px) 46vw, 30vw')} alt="${escapeProductText(product.name)}" loading="lazy">
                <span class="status-badge ${product.status}">
                    ${product.status === 'in-stock' ? 'Available' : 'Sold'}
                </span>
            </div>
            <div class="product-info">
                <h3>${escapeProductText(product.name)}</h3>
                <p class="price">No. ${product.id} / One of one</p>
            </div>
        </a>
        `;
    });
    
    productsHTML += `</div>`;
    
    // Add See More button
    productsHTML += `
    <div class="see-more-container">
        <a href="${categoryLink}" class="see-more-btn">
            View All ${categoryName} <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="m12 5 7 7-7 7M5 12h14"/></svg>
        </a>
    </div>
    `;
    
    relatedContainer.innerHTML = productsHTML;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadProductData();
    document.querySelector('.main-image-trigger').addEventListener('click', () => openLightbox());
    document.querySelector('.enlarge-btn').addEventListener('click', () => openLightbox());
    document.querySelector('.close-lightbox').addEventListener('click', closeLightbox);
    document.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);
    document.querySelector('.lightbox-nav.prev').addEventListener('click', () => changeLightboxImage(-1));
    document.querySelector('.lightbox-nav.next').addEventListener('click', () => changeLightboxImage(1));
    document.getElementById('zoom-out').addEventListener('click', () => changeZoom(-0.25));
    document.getElementById('zoom-in').addEventListener('click', () => changeZoom(0.25));
    document.getElementById('zoom-reset').addEventListener('click', resetZoom);

    const viewer = document.getElementById('lightbox');
    const viewerImage = document.getElementById('lightbox-image');
    const viewerCanvas = document.querySelector('.lightbox-image-container');

    viewerImage.addEventListener('dblclick', () => {
        zoomScale = zoomScale > 1 ? 1 : 2;
        updateZoomViewer();
    });

    viewerImage.addEventListener('load', resetZoom);

    viewerCanvas.addEventListener('wheel', event => {
        if (!viewer.classList.contains('active')) return;
        event.preventDefault();
        changeZoom(event.deltaY < 0 ? 0.25 : -0.25);
    }, { passive: false });

    viewerCanvas.addEventListener('pointerdown', event => {
        if (zoomScale <= 1) return;
        isDraggingImage = true;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        dragScrollLeft = viewerCanvas.scrollLeft;
        dragScrollTop = viewerCanvas.scrollTop;
        viewerCanvas.setPointerCapture(event.pointerId);
        viewerCanvas.classList.add('is-dragging');
    });

    viewerCanvas.addEventListener('pointermove', event => {
        if (!isDraggingImage) return;
        viewerCanvas.scrollLeft = dragScrollLeft - (event.clientX - dragStartX);
        viewerCanvas.scrollTop = dragScrollTop - (event.clientY - dragStartY);
    });

    const stopDragging = event => {
        if (!isDraggingImage) return;
        isDraggingImage = false;
        viewerCanvas.classList.remove('is-dragging');
        if (viewerCanvas.hasPointerCapture(event.pointerId)) viewerCanvas.releasePointerCapture(event.pointerId);
    };
    viewerCanvas.addEventListener('pointerup', stopDragging);
    viewerCanvas.addEventListener('pointercancel', stopDragging);

    window.addEventListener('resize', () => {
        if (viewer.classList.contains('active')) updateZoomViewer();
    });

    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('lightbox');

        if (lightbox.classList.contains('active')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') changeLightboxImage(-1);
            if (e.key === 'ArrowRight') changeLightboxImage(1);
            if (e.key === '+' || e.key === '=') changeZoom(0.25);
            if (e.key === '-' || e.key === '_') changeZoom(-0.25);
            if (e.key === '0') resetZoom();
            if (e.key === 'Tab') {
                const focusable = [...lightbox.querySelectorAll('button:not(:disabled)')];
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    });
});
