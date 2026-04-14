// Product Detail View
function showProductDetail(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;
    
    const modal = document.getElementById('productDetailModal');
    const content = document.getElementById('productDetailContent');
    
    content.innerHTML = `
        <div class="product-detail-grid">
            <div class="product-detail-image">
                <img src="images/products/${product.image}" alt="${product.name}" onerror="this.src='images/products/default.jpg'">
                ${product.badge ? `<span class="product-badge" style="position: absolute; top: 1rem; left: 1rem;">${product.badge}</span>` : ''}
            </div>
            <div class="product-detail-info">
                <div class="product-detail-category">${product.category}</div>
                <h2 class="product-detail-name">${product.name}</h2>
                <div class="product-detail-price">
                    ${formatNaira(product.price)}
                    ${product.original_price ? `<span class="original">${formatNaira(product.original_price)}</span>` : ''}
                </div>
                <p class="product-detail-description">${product.description || 'No description available.'}</p>
                
                <div class="product-detail-meta">
                    <div class="meta-item">
                        <span class="meta-label">Availability:</span>
                        <span class="meta-value" style="color: ${product.stock > 0 ? '#00C853' : '#FF3B30'}">
                            ${product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
                        </span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">SKU:</span>
                        <span class="meta-value">JCW-${product.id.toString().padStart(4, '0')}</span>
                    </div>
                </div>
                
                <div class="product-detail-actions">
                    <div class="quantity-selector">
                        <button onclick="adjustDetailQuantity(-1)">-</button>
                        <input type="number" id="detailQuantity" value="1" min="1" max="${product.stock}" readonly>
                        <button onclick="adjustDetailQuantity(1)">+</button>
                    </div>
                    <button class="btn btn-primary add-to-cart-btn" onclick="addToCartFromDetail(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                        ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
                
                <div class="product-detail-features">
                    <div class="feature-item">🚚 Free shipping over ₦50,000</div>
                    <div class="feature-item">↻ 7-day return policy</div>
                    <div class="feature-item">🔒 Secure checkout</div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductDetail() {
    document.getElementById('productDetailModal').classList.remove('active');
    document.body.style.overflow = '';
}

function adjustDetailQuantity(change) {
    const input = document.getElementById('detailQuantity');
    let newValue = parseInt(input.value) + change;
    const max = parseInt(input.max);
    
    if (newValue < 1) newValue = 1;
    if (newValue > max) newValue = max;
    
    input.value = newValue;
}

function addToCartFromDetail(productId) {
    const quantity = parseInt(document.getElementById('detailQuantity').value);
    const product = products.find(p => p.id == productId);
    
    if (!product || product.stock === 0) return;
    
    for (let i = 0; i < quantity; i++) {
        const existingItem = cart.find(item => item.id == productId);
        
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity++;
            } else {
                alert('Maximum stock reached!');
                break;
            }
        } else {
            cart.push({ ...product, quantity: 1 });
        }
    }
    
    saveCartToStorage();
    updateCart();
    closeProductDetail();
    toggleCart();
}

// Update renderProducts to make cards clickable
function renderProducts() {
    const grid = document.getElementById('productGrid');
    
    if (products.length === 0) {
        grid.innerHTML = '<div class="no-products">No products found.</div>';
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="product-card reveal" data-category="${product.category}" onclick="showProductDetail(${product.id})">
            <div class="product-image">
                <img src="images/products/${product.image}" alt="${product.name}" onerror="this.src='images/products/default.jpg'">
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                ${product.stock < 10 ? `<span class="product-badge" style="background: #FF3B30; top: 3rem;">Low Stock</span>` : ''}
                <button class="quick-add" onclick="event.stopPropagation(); addToCart(${product.id})" ${product.stock === 0 ? 'disabled style="background: #666; cursor: not-allowed;"' : ''}>
                    ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    ${formatNaira(product.price)}
                    ${product.original_price ? `<span class="original">${formatNaira(product.original_price)}</span>` : ''}
                </div>
                <small style="color: var(--gray);">${product.stock} in stock</small>
            </div>
        </div>
    `).join('');
    
    setTimeout(setupScrollAnimations, 100);
}