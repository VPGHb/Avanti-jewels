// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = parseInt(urlParams.get('id')) || 1;

// Global variables
let currentProduct = null;
let currentImageIndex = 0;

// Function to get all products from products.js
function getAllProducts() {
    const allItems = [];
    
    if (typeof productsData !== 'undefined') {
        const categories = ['bundles', 'necklaces', 'bracelets', 'earrings', 'rings', 'bangles', 'kamarband', 'mang-tikka', 'pendants'];
        
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

// Load product data
function loadProductData() {
    const allProducts = getAllProducts();
    
    if (allProducts.length === 0) {
        console.error('No products found. Redirecting to home page.');
        window.location.href = 'index.html';
        return;
    }
    
    currentProduct = allProducts.find(p => p.id === productId);
    
    if (!currentProduct) {
        console.error('Product not found. Redirecting to home page.');
        window.location.href = 'index.html';
        return;
    }
    
    displayProductDetails();
    displayRelatedProducts();
}

// Display product details
function displayProductDetails() {
    document.title = `${currentProduct.name} - Avanti Jewels`;
    document.getElementById('product-title').textContent = currentProduct.name;
    document.getElementById('product-price').textContent = `$${currentProduct.price.toFixed(2)}`;
    document.getElementById('product-description').innerHTML = currentProduct.description;
    
    const statusBadge = document.getElementById('product-status');
    statusBadge.textContent = currentProduct.status === 'in-stock' ? 'In Stock' : 'Sold Out';
    statusBadge.className = `status-badge ${currentProduct.status}`;
    
    loadProductImages();
}

// SIMPLIFIED: Load product images
function loadProductImages() {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    
    if (currentProduct.images && currentProduct.images.length > 0) {
        // Set main image
        mainImage.src = currentProduct.images[0];
        
        // Clear thumbnails
        thumbnailContainer.innerHTML = '';
        
        // Create thumbnails
        currentProduct.images.forEach((imgSrc, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            
            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = `${currentProduct.name} view ${index + 1}`;
            
            // Add error handling
            img.onerror = function() {
                console.log(`Failed to load image: ${imgSrc}`);
                this.src = 'https://via.placeholder.com/300x400/EEE1C6/666?text=Image+Not+Available';
            };
            
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
    
    mainImage.src = currentProduct.images[index];
    currentImageIndex = index;
    
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
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
        currentImageIndex = index;
        currentIndexSpan.textContent = index + 1;
        totalImagesSpan.textContent = currentProduct.images.length;
        
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function changeLightboxImage(direction) {
    const newIndex = currentImageIndex + direction;
    
    if (newIndex >= 0 && newIndex < currentProduct.images.length) {
        currentImageIndex = newIndex;
        document.getElementById('lightbox-image').src = currentProduct.images[currentImageIndex];
        document.getElementById('current-index').textContent = currentImageIndex + 1;
    }
}

function displayRelatedProducts() {
    const relatedContainer = document.getElementById('related-products');
    const allProducts = getAllProducts();
    
    // Get 3 products from same category
    const sameCategory = allProducts.filter(p => 
        p.category === currentProduct.category && p.id !== productId
    );
    
    const related = sameCategory.slice(0, 3);
    const categoryLink = `${currentProduct.category}.html`;
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
        <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'">
            <div class="product-image">
                <img src="${image}" alt="${product.name}" 
                     onerror="this.src='https://via.placeholder.com/300x400/EEE1C6/666?text=${product.name}'">
                <span class="status-badge ${product.status}">
                    ${product.status === 'in-stock' ? 'In Stock' : 'Sold Out'}
                </span>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
            </div>
        </div>
        `;
    });
    
    productsHTML += `</div>`;
    
    // Add See More button
    productsHTML += `
    <div class="see-more-container">
        <a href="${categoryLink}" class="see-more-btn">
            View All ${categoryName} <i class="fas fa-arrow-right"></i>
        </a>
    </div>
    `;
    
    relatedContainer.innerHTML = productsHTML;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadProductData();
    
    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('lightbox');
        
        if (lightbox.classList.contains('active')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') changeLightboxImage(-1);
            if (e.key === 'ArrowRight') changeLightboxImage(1);
        }
    });
});