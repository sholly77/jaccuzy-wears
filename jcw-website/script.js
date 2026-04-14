// API Base URL - Change this to your XAMPP server path
const API_URL = 'http://localhost/jcw-website/api';

// Format currency to Naira
function formatNaira(amount) {
    return '₦' + parseFloat(amount).toLocaleString('en-NG');
}

// Cart State
let cart = [];
let products = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    createFloatingElements();
    setupScrollAnimations();
    setupNavbar();
    loadCartFromStorage();
});

// Load Products from Database
async function loadProducts(category = 'all') {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '<div class="loading">Loading products...</div>';
    
    try {
        const url = category === 'all' ? `${API_URL}/products.php` : `${API_URL}/products.php?category=${category}`;
        const response = await fetch(url);
        products = await response.json();
        
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = '<div class="error">Failed to load products. Please try again.</div>';
    }
}

// Render Products
function renderProducts() {
    const grid = document.getElementById('productGrid');
    
    if (products.length === 0) {
        grid.innerHTML = '<div class="no-products">No products found.</div>';
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="product-card reveal" data-category="${product.category}">
            <div class="product-image">
                <img src="images/products/${product.image}" alt="${product.name}" onerror="this.src='images/products/default.jpg'">
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                ${product.stock < 10 ? `<span class="product-badge" style="background: #FF3B30; top: 3rem;">Low Stock</span>` : ''}
                <button class="quick-add" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled style="background: #666; cursor: not-allowed;"' : ''}>
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

// Filter Products
function filterProducts(category) {
    // Update active tab
    document.querySelectorAll('.filter-tabs li').forEach(tab => {
        tab.classList.remove('active');
        if(tab.textContent.toLowerCase().includes(category) || (category === 'all' && tab.textContent === 'All')) {
            tab.classList.add('active');
        }
    });
    
    loadProducts(category);
}

// Cart Functions
function addToCart(productId) {
    const product = products.find(p => p.id == productId);
    if (!product || product.stock === 0) return;
    
    const existingItem = cart.find(item => item.id == productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            alert('Maximum stock reached!');
            return;
        }
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCartToStorage();
    updateCart();
    toggleCart();
    
    // Visual feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Added!';
    btn.style.background = '#00C853';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 1000);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id != productId);
    saveCartToStorage();
    updateCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id == productId);
    const product = products.find(p => p.id == productId);
    
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else if (item.quantity > product.stock) {
            alert('Maximum stock reached!');
            item.quantity = product.stock;
        } else {
            saveCartToStorage();
            updateCart();
        }
    }
}

function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartCount.textContent = totalItems;
    cartTotal.textContent = formatNaira(totalPrice);
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 3rem;">Your cart is empty</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="images/products/${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${formatNaira(item.price)}</div>
                    <div class="quantity-control">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button class="close-cart" onclick="removeFromCart(${item.id})" style="font-size: 1.2rem;">×</button>
            </div>
        `).join('');
    }
}

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
    document.body.style.overflow = document.getElementById('cartSidebar').classList.contains('active') ? 'hidden' : '';
}

// Checkout Functions
function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    toggleCart();
    document.getElementById('checkoutModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderCheckoutItems();
}

function closeCheckout(e) {
    if (!e || e.target === document.getElementById('checkoutModal')) {
        document.getElementById('checkoutModal').classList.remove('active');
        document.body.style.overflow = '';
    }
}

function renderCheckoutItems() {
    const container = document.getElementById('checkoutItems');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    container.innerHTML = cart.map(item => `
        <div class="summary-item">
            <span>${item.name} x${item.quantity}</span>
            <span>${formatNaira(item.price * item.quantity)}</span>
        </div>
    `).join('');
    
    document.getElementById('checkoutTotal').textContent = formatNaira(total);
}

async function placeOrder(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderData = {
        customer: {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address')
        },
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        })),
        total: total
    };
    
    try {
        const response = await fetch(`${API_URL}/orders.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`Order placed successfully!\nOrder ID: ${result.order_id}\nTotal: ${formatNaira(total)}\n\nYou will receive a confirmation email shortly.`);
            
            // Clear cart
            cart = [];
            saveCartToStorage();
            updateCart();
            closeCheckout();
            e.target.reset();
            
            // Reload products to update stock
            loadProducts();
        } else {
            alert('Failed to place order. Please try again.');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Network error. Please check your connection and try again.');
    }
}

// Newsletter
async function handleSubscribe(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const input = e.target.querySelector('input');
    const email = input.value;
    
    try {
        const response = await fetch(`${API_URL}/subscribers.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        
        const result = await response.json();
        
        if (result.success) {
            btn.textContent = 'Subscribed!';
            btn.style.background = '#00C853';
            input.value = '';
            
            setTimeout(() => {
                btn.textContent = 'Subscribe';
                btn.style.background = '';
            }, 3000);
        } else {
            alert('Already subscribed or error occurred.');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

// Storage Functions
function saveCartToStorage() {
    localStorage.setItem('jcw_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const saved = localStorage.getItem('jcw_cart');
    if (saved) {
        cart = JSON.parse(saved);
        updateCart();
    }
}

// Floating Elements Animation
function createFloatingElements() {
    const container = document.getElementById('floatingElements');
    const texts = ['JCW', 'STREET', 'URBAN', 'BOLD', 'JACUZZY', 'NAIRA', 'LAGOS'];
    
    for (let i = 0; i < 15; i++) {
        const el = document.createElement('div');
        el.className = 'float-item';
        el.textContent = texts[Math.floor(Math.random() * texts.length)];
        el.style.left = Math.random() * 100 + '%';
        el.style.animationDelay = Math.random() * 20 + 's';
        el.style.animationDuration = (15 + Math.random() * 10) + 's';
        el.style.fontSize = (1 + Math.random() * 2) + 'rem';
        container.appendChild(el);
    }
}

// Scroll Animations
function setupScrollAnimations() {
    const reveals = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach(el => observer.observe(el));
}

// Navbar Scroll Effect
function setupNavbar() {
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.padding = '1rem 5%';
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        } else {
            navbar.style.padding = '1.5rem 5%';
            navbar.style.background = 'rgba(10, 10, 10, 0.8)';
        }
    });
}

// Mobile Menu
function toggleMobileMenu() {
    alert('Mobile menu would open here');
}

function toggleSearch() {
    const searchTerm = prompt('Search for products:');
    if (searchTerm) {
        // Filter products by search term
        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const grid = document.getElementById('productGrid');
        if (filtered.length === 0) {
            grid.innerHTML = '<div class="no-products">No products found matching your search.</div>';
        } else {
            // Temporarily replace products array for display
            const originalProducts = products;
            products = filtered;
            renderProducts();
            products = originalProducts;
        }
    }
}
function showPaymentInstructions(method, orderId, total) {
    let instructions = '';
    const bankDetails = getBankDetails();
    
    switch(method) {
        case 'transfer':
            if (bankDetails && bankDetails.bankName && bankDetails.accountNumber) {
                instructions = `
Order placed successfully!
Order ID: ${orderId}
Total: ${formatNaira(total)}

Payment Instructions:
Please transfer ${formatNaira(total)} to:
Bank: ${bankDetails.bankName}
Account: ${bankDetails.accountNumber}
Account Name: ${bankDetails.accountName}
${bankDetails.swift ? 'SWIFT: ' + bankDetails.swift : ''}

After payment, send proof to: payments@jcw.com
Include your Order ID: ${orderId}

You will receive a confirmation email shortly.`;
            } else {
                instructions = `
Order placed successfully!
Order ID: ${orderId}
Total: ${formatNaira(total)}

Payment Instructions:
Please complete your bank transfer.
Bank details will be sent to your email shortly.

After payment, send proof to: payments@jcw.com
Include your Order ID: ${orderId}

You will receive a confirmation email shortly.`;
            }
            break;
        case 'card':
            instructions = `
Order placed successfully!
Order ID: ${orderId}
Total: ${formatNaira(total)}

Note: Card payment processing will be integrated soon.
For now, please use bank transfer or pay on delivery.

You will receive a confirmation email shortly.`;
            break;
        case 'pod':
            instructions = `
Order placed successfully!
Order ID: ${orderId}
Total: ${formatNaira(total)}

You selected Pay on Delivery.
Please have ${formatNaira(total)} ready when your order arrives.

You will receive a confirmation email shortly.`;
            break;
        default:
            instructions = `Order placed successfully! Order ID: ${orderId}`;
    }
    
    alert(instructions);
}
// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});