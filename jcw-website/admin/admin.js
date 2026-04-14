// Check if logged in
if (window.location.pathname.includes('dashboard') && !sessionStorage.getItem('jcw_admin')) {
    window.location.href = 'index.html';
}

// API Base URL
const API_URL = 'http://localhost/jcw-website/api';

// Login Handler
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'admin123') {
        sessionStorage.setItem('jcw_admin', 'true');
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid credentials!');
    }
}

function logout() {
    sessionStorage.removeItem('jcw_admin');
    window.location.href = 'index.html';
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    
    const titles = {
        'dashboard': 'Dashboard',
        'orders': 'Orders',
        'products': 'Products',
        'customers': 'Customers',
        'subscribers': 'Subscribers',
        'settings': 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId];
    
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });
    event.target.closest('a').classList.add('active');
    
    if (sectionId === 'dashboard') loadDashboard();
    if (sectionId === 'orders') loadOrders();
    if (sectionId === 'products') loadProducts();
    if (sectionId === 'customers') loadCustomers();
    if (sectionId === 'subscribers') loadSubscribers();
}

// Load Dashboard Stats
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/orders.php`);
        const orders = await response.json();
        
        const subResponse = await fetch(`${API_URL}/subscribers.php`);
        const subscribers = await subResponse.json();
        
        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
        const uniqueCustomers = [...new Set(orders.map(o => o.customer_email))].length;
        
        document.getElementById('totalOrders').textContent = orders.length;
        document.getElementById('totalRevenue').textContent = '₦' + totalRevenue.toLocaleString('en-NG');
        document.getElementById('totalCustomers').textContent = uniqueCustomers;
        document.getElementById('totalSubscribers').textContent = subscribers.length;
        document.getElementById('orderBadge').textContent = orders.filter(o => o.status === 'pending').length;
        
        const recentTable = document.getElementById('recentOrdersTable');
        const recentOrders = orders.slice(0, 5);
        
        if (recentOrders.length === 0) {
            recentTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888;">No orders yet</td></tr>';
        } else {
            recentTable.innerHTML = recentOrders.map(order => `
                <tr>
                    <td>${order.order_id}</td>
                    <td>${order.customer_name}</td>
                    <td>${order.items ? order.items.length : 0} items</td>
                    <td>₦${parseFloat(order.total_amount).toLocaleString('en-NG')}</td>
                    <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                    <td>${new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        loadDashboardFromStorage();
    }
}

function loadDashboardFromStorage() {
    const orders = JSON.parse(localStorage.getItem('jcw_orders') || '[]');
    const subscribers = JSON.parse(localStorage.getItem('jcw_subscribers') || '[]');
    
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
    const uniqueCustomers = [...new Set(orders.map(o => o.customer?.email).filter(Boolean))].length;
    
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('totalRevenue').textContent = '₦' + totalRevenue.toLocaleString('en-NG');
    document.getElementById('totalCustomers').textContent = uniqueCustomers;
    document.getElementById('totalSubscribers').textContent = subscribers.length;
    document.getElementById('orderBadge').textContent = orders.filter(o => o.status === 'pending').length;
    
    const recentTable = document.getElementById('recentOrdersTable');
    const recentOrders = orders.slice(-5).reverse();
    
    if (recentOrders.length === 0) {
        recentTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888;">No orders yet</td></tr>';
    } else {
        recentTable.innerHTML = recentOrders.map(order => `
            <tr>
                <td>${order.id || 'N/A'}</td>
                <td>${order.customer?.name || 'N/A'}</td>
                <td>${order.items?.length || 0} items</td>
                <td>₦${(parseFloat(order.total) || 0).toLocaleString('en-NG')}</td>
                <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
                <td>${order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}</td>
            </tr>
        `).join('');
    }
}

async function loadOrders() {
    try {
        const filter = document.getElementById('statusFilter').value;
        const url = filter === 'all' ? `${API_URL}/orders.php` : `${API_URL}/orders.php?status=${filter}`;
        
        const response = await fetch(url);
        const orders = await response.json();
        
        const table = document.getElementById('allOrdersTable');
        
        if (orders.length === 0) {
            table.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #888; padding: 2rem;">No orders found</td></tr>';
            return;
        }
        
        table.innerHTML = orders.map(order => `
            <tr>
                <td>${order.order_id}</td>
                <td>${order.customer_name}</td>
                <td>${order.customer_email}</td>
                <td>${order.items ? order.items.length : 0} items</td>
                <td>₦${parseFloat(order.total_amount).toLocaleString('en-NG')}</td>
                <td>
                    <select onchange="updateOrderStatus('${order.order_id}', this.value)" class="status-select" style="padding: 0.5rem; background: #1a1a1a; color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                </td>
                <td>
                    <button onclick="viewOrder('${order.order_id}')" class="btn-small btn-edit">View</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
        loadOrdersFromStorage();
    }
}

function loadOrdersFromStorage() {
    const orders = JSON.parse(localStorage.getItem('jcw_orders') || '[]');
    const table = document.getElementById('allOrdersTable');
    const filter = document.getElementById('statusFilter').value;
    
    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
    
    if (filtered.length === 0) {
        table.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #888; padding: 2rem;">No orders found</td></tr>';
        return;
    }
    
    table.innerHTML = filtered.map(order => `
        <tr>
            <td>${order.id || 'N/A'}</td>
            <td>${order.customer?.name || 'N/A'}</td>
            <td>${order.customer?.email || 'N/A'}</td>
            <td>${order.items?.length || 0} items</td>
            <td>₦${(parseFloat(order.total) || 0).toLocaleString('en-NG')}</td>
            <td>
                <select onchange="updateOrderStatus('${order.id}', this.value)" class="status-select" style="padding: 0.5rem; background: #1a1a1a; color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </td>
            <td>
                <button onclick="viewOrder('${order.id}')" class="btn-small btn-edit">View</button>
            </td>
        </tr>
    `).join('');
}

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`${API_URL}/orders.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `order_id=${encodeURIComponent(orderId)}&status=${encodeURIComponent(status)}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadDashboard();
        } else {
            throw new Error('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        const orders = JSON.parse(localStorage.getItem('jcw_orders') || '[]');
        const order = orders.find(o => o.id === orderId || o.order_id === orderId);
        if (order) {
            order.status = status;
            localStorage.setItem('jcw_orders', JSON.stringify(orders));
            loadDashboard();
        }
    }
}

async function viewOrder(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders.php`);
        const orders = await response.json();
        const order = orders.find(o => o.order_id === orderId);
        
        if (order) {
            document.getElementById('orderDetails').innerHTML = `
                <p><strong>Order ID:</strong> ${order.order_id}</p>
                <p><strong>Customer:</strong> ${order.customer_name}</p>
                <p><strong>Email:</strong> ${order.customer_email}</p>
                <p><strong>Phone:</strong> ${order.customer_phone}</p>
                <p><strong>Address:</strong> ${order.customer_address}</p>
                <hr style="margin: 1rem 0; border-color: rgba(255,255,255,0.1);">
                <h4>Items:</h4>
                ${order.items ? order.items.map(item => `
                    <p>${item.product_name} x${item.quantity} - ₦${(parseFloat(item.price) * item.quantity).toLocaleString('en-NG')}</p>
                `).join('') : '<p>No items</p>'}
                <hr style="margin: 1rem 0; border-color: rgba(255,255,255,0.1);">
                <p><strong>Total:</strong> ₦${parseFloat(order.total_amount).toLocaleString('en-NG')}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            `;
            document.getElementById('orderModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error viewing order:', error);
        viewOrderFromStorage(orderId);
    }
}

function viewOrderFromStorage(orderId) {
    const orders = JSON.parse(localStorage.getItem('jcw_orders') || '[]');
    const order = orders.find(o => o.id === orderId || o.order_id === orderId);
    
    if (order) {
        document.getElementById('orderDetails').innerHTML = `
            <p><strong>Order ID:</strong> ${order.id || order.order_id || 'N/A'}</p>
            <p><strong>Customer:</strong> ${order.customer?.name || 'N/A'}</p>
            <p><strong>Email:</strong> ${order.customer?.email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${order.customer?.phone || 'N/A'}</p>
            <p><strong>Address:</strong> ${order.customer?.address || 'N/A'}</p>
            <hr style="margin: 1rem 0; border-color: rgba(255,255,255,0.1);">
            <h4>Items:</h4>
            ${order.items ? order.items.map(item => `
                <p>${item.name} x${item.quantity} - ₦${(parseFloat(item.price) * item.quantity).toLocaleString('en-NG')}</p>
            `).join('') : '<p>No items</p>'}
            <hr style="margin: 1rem 0; border-color: rgba(255,255,255,0.1);">
            <p><strong>Total:</strong> ₦${(parseFloat(order.total) || 0).toLocaleString('en-NG')}</p>
            <p><strong>Status:</strong> ${order.status || 'pending'}</p>
            <p><strong>Date:</strong> ${order.date ? new Date(order.date).toLocaleString() : 'N/A'}</p>
        `;
        document.getElementById('orderModal').classList.add('active');
    }
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

function filterOrders() {
    loadOrders();
}

function exportOrders() {
    const orders = JSON.parse(localStorage.getItem('jcw_orders') || '[]');
    const csv = convertToCSV(orders);
    downloadFile(csv, 'orders.csv');
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products.php`);
        const products = await response.json();
        
        const grid = document.getElementById('adminProductsGrid');
        
        if (products.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #888; grid-column: 1/-1;">No products found. Add your first product!</p>';
            return;
        }
        
        grid.innerHTML = products.map(product => `
            <div class="admin-product-card">
                <h4>${product.name}</h4>
                <p>₦${parseFloat(product.price).toLocaleString('en-NG')} • ${product.stock} in stock</p>
                <div class="product-actions">
                    <button class="btn-small btn-edit" onclick="editProduct(${product.id})">Edit</button>
                    <button class="btn-small btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        loadStaticProducts();
    }
}

function loadStaticProducts() {
    const products = [
        { id: 1, name: "Velocity Hoodie", price: 129, stock: 15 },
        { id: 2, name: "Metro Oversized Tee", price: 59, stock: 32 },
        { id: 3, name: "Night Runner Jacket", price: 189, stock: 8 },
        { id: 4, name: "Essential Logo Tee", price: 49, stock: 45 },
        { id: 5, name: "Urban Tech Pants", price: 99, stock: 20 },
        { id: 6, name: "Street Cap", price: 39, stock: 50 },
    ];
    
    const grid = document.getElementById('adminProductsGrid');
    grid.innerHTML = products.map(product => `
        <div class="admin-product-card">
            <h4>${product.name}</h4>
            <p>₦${product.price.toLocaleString()} • ${product.stock} in stock</p>
            <div class="product-actions">
                <button class="btn-small btn-edit" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn-small btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// FIXED: Open Add Product Page
function addNewProduct() {
    window.location.href = 'product-manager.html';
}

async function editProduct(id) {
    alert('Edit product ' + id + ' - This would open an edit form');
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const response = await fetch(`${API_URL}/products.php?id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Product deleted successfully!');
            loadProducts();
        } else {
            throw new Error(result.error || 'Failed to delete');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product: ' + error.message);
    }
}

async function loadCustomers() {
    try {
        const response = await fetch(`${API_URL}/orders.php`);
        const orders = await response.json();
        
        const customers = {};
        orders.forEach(order => {
            const email = order.customer_email;
            if (!customers[email]) {
                customers[email] = {
                    name: order.customer_name,
                    email: email,
                    phone: order.customer_phone,
                    orders: 0,
                    spent: 0
                };
            }
            customers[email].orders++;
            customers[email].spent += parseFloat(order.total_amount);
        });
        
        const table = document.getElementById('customersTable');
        const customerList = Object.values(customers);
        
        if (customerList.length === 0) {
            table.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">No customers yet</td></tr>';
        } else {
            table.innerHTML = customerList.map(customer => `
                <tr>
                    <td>${customer.name}</td>
                    <td>${customer.email}</td>
                    <td>${customer.phone}</td>
                    <td>${customer.orders}</td>
                    <td>₦${customer.spent.toLocaleString('en-NG')}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        loadCustomersFromStorage();
    }
}

function loadCustomersFromStorage() {
    const orders = JSON.parse(localStorage.getItem('jcw_orders') || '[]');
    const customers = {};
    
    orders.forEach(order => {
        if (!order.customer) return;
        const email = order.customer.email;
        if (!customers[email]) {
            customers[email] = {
                name: order.customer.name,
                email: email,
                phone: order.customer.phone || 'N/A',
                orders: 0,
                spent: 0
            };
        }
        customers[email].orders++;
        customers[email].spent += parseFloat(order.total) || 0;
    });
    
    const table = document.getElementById('customersTable');
    const customerList = Object.values(customers);
    
    if (customerList.length === 0) {
        table.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">No customers yet</td></tr>';
    } else {
        table.innerHTML = customerList.map(customer => `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.phone}</td>
                <td>${customer.orders}</td>
                <td>₦${customer.spent.toLocaleString('en-NG')}</td>
            </tr>
        `).join('');
    }
}

async function loadSubscribers() {
    try {
        const response = await fetch(`${API_URL}/subscribers.php`);
        const subscribers = await response.json();
        
        const table = document.getElementById('subscribersTable');
        
        if (subscribers.length === 0) {
            table.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #888;">No subscribers yet</td></tr>';
        } else {
            table.innerHTML = subscribers.map(sub => `
                <tr>
                    <td>${sub.email}</td>
                    <td>${new Date(sub.subscribed_at || sub.date).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading subscribers:', error);
        loadSubscribersFromStorage();
    }
}

function loadSubscribersFromStorage() {
    const subscribers = JSON.parse(localStorage.getItem('jcw_subscribers') || '[]');
    const table = document.getElementById('subscribersTable');
    
    if (subscribers.length === 0) {
        table.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #888;">No subscribers yet</td></tr>';
    } else {
        table.innerHTML = subscribers.map(sub => `
            <tr>
                <td>${sub.email}</td>
                <td>${new Date(sub.date || sub.subscribed_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    }
}

function exportSubscribers() {
    const subscribers = JSON.parse(localStorage.getItem('jcw_subscribers') || '[]');
    const csv = convertToCSV(subscribers);
    downloadFile(csv, 'subscribers.csv');
}

function saveSettings() {
    const storeName = document.getElementById('storeName').value;
    const storeEmail = document.getElementById('storeEmail').value;
    const currency = document.getElementById('currency').value;
    
    localStorage.setItem('jcw_settings', JSON.stringify({
        storeName,
        storeEmail,
        currency
    }));
    
    alert('Settings saved!');
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(h => JSON.stringify(obj[h] || '')).join(','));
    return [headers.join(','), ...rows].join('\n');
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

if (window.location.pathname.includes('dashboard')) {
    document.addEventListener('DOMContentLoaded', () => {
        loadDashboard();
        
        const settings = JSON.parse(localStorage.getItem('jcw_settings') || '{}');
        if (settings.storeName) document.getElementById('storeName').value = settings.storeName;
        if (settings.storeEmail) document.getElementById('storeEmail').value = settings.storeEmail;
        if (settings.currency) document.getElementById('currency').value = settings.currency;
    });
}
// Edit Product Functionality
let currentEditProductId = null;

async function editProduct(id) {
    currentEditProductId = id;
    
    try {
        const response = await fetch(`${API_URL}/products.php?id=${id}`);
        const product = await response.json();
        
        if (product.error) {
            throw new Error(product.error);
        }
        
        showEditModal(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        alert('Could not load product details. Please try again.');
    }
}

function showEditModal(product) {
    // Create modal if doesn't exist
    let modal = document.getElementById('editProductModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'editProductModal';
        modal.className = 'modal';
        modal.style.zIndex = '4000';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3>Edit Product</h3>
                    <button onclick="closeEditModal()" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editProductForm" onsubmit="handleEditProduct(event)" enctype="multipart/form-data">
                        <input type="hidden" name="id">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Product Name *</label>
                                <input type="text" name="name" required>
                            </div>
                            <div class="form-group">
                                <label>Category *</label>
                                <select name="category" required>
                                    <option value="">Select Category</option>
                                    <option value="tees">T-Shirts</option>
                                    <option value="pants">Pants</option>
                                    <option value="hoodies">Hoodies</option>
                                    <option value="sets">Sets</option>
                                    <option value="accessories">Accessories</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Current Price (₦) *</label>
                                <input type="number" name="price" required min="0">
                            </div>
                            <div class="form-group">
                                <label>Original Price (₦)</label>
                                <input type="number" name="original_price" min="0" placeholder="For discount display">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Stock Quantity *</label>
                                <input type="number" name="stock" required min="0">
                            </div>
                            <div class="form-group">
                                <label>Badge</label>
                                <select name="badge">
                                    <option value="">No Badge</option>
                                    <option value="New">New</option>
                                    <option value="Best Seller">Best Seller</option>
                                    <option value="Limited">Limited</option>
                                    <option value="Sale">Sale</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Description</label>
                            <textarea name="description" rows="3" placeholder="Product description..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Product Image</label>
                            <div style="margin-bottom: 1rem;">
                                <img id="editImagePreview" style="max-width: 200px; max-height: 200px; border-radius: 8px; display: none; margin-bottom: 1rem;">
                            </div>
                            <input type="file" name="image" accept="image/*" onchange="previewEditImage(event)" style="padding: 0.5rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; width: 100%;">
                            <small style="color: var(--gray);">Leave empty to keep current image</small>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                            <button type="button" onclick="closeEditModal()" class="btn-secondary" style="flex: 1; padding: 1rem;">Cancel</button>
                            <button type="submit" class="btn-primary" style="flex: 1; padding: 1rem;">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Populate form
    const form = document.getElementById('editProductForm');
    form.querySelector('[name="id"]').value = product.id;
    form.querySelector('[name="name"]').value = product.name || '';
    form.querySelector('[name="category"]').value = product.category || '';
    form.querySelector('[name="price"]').value = product.price || '';
    form.querySelector('[name="original_price"]').value = product.original_price || '';
    form.querySelector('[name="stock"]').value = product.stock || '';
    form.querySelector('[name="badge"]').value = product.badge || '';
    form.querySelector('[name="description"]').value = product.description || '';
    
    const imagePreview = document.getElementById('editImagePreview');
    if (product.image && product.image !== 'default.jpg') {
        imagePreview.src = `../images/products/${product.image}`;
        imagePreview.style.display = 'block';
    } else {
        imagePreview.style.display = 'none';
    }
    
    modal.classList.add('active');
}

function closeEditModal() {
    const modal = document.getElementById('editProductModal');
    if (modal) modal.classList.remove('active');
    currentEditProductId = null;
}

async function handleEditProduct(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const productData = {
        id: parseInt(formData.get('id')),
        name: formData.get('name'),
        category: formData.get('category'),
        price: parseFloat(formData.get('price')),
        original_price: parseFloat(formData.get('original_price')) || null,
        stock: parseInt(formData.get('stock')),
        badge: formData.get('badge'),
        description: formData.get('description')
    };
    
    try {
        const imageFile = formData.get('image');
        
        if (imageFile && imageFile.size > 0) {
            const submitData = new FormData();
            submitData.append('id', productData.id);
            submitData.append('name', productData.name);
            submitData.append('category', productData.category);
            submitData.append('price', productData.price);
            submitData.append('original_price', productData.original_price || '');
            submitData.append('stock', productData.stock);
            submitData.append('badge', productData.badge);
            submitData.append('description', productData.description);
            submitData.append('image', imageFile);
            
            const response = await fetch(`${API_URL}/products.php`, {
                method: 'POST',
                body: submitData
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Product updated successfully!');
                closeEditModal();
                loadProducts();
            } else {
                throw new Error(result.error || 'Failed to update product');
            }
        } else {
            const response = await fetch(`${API_URL}/products.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(productData).toString()
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Product updated successfully!');
                closeEditModal();
                loadProducts();
            } else {
                throw new Error(result.error || 'Failed to update product');
            }
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Error updating product: ' + error.message);
    }
}

function previewEditImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('editImagePreview');
        preview.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Bank Details Management
function loadBankDetails() {
    const settings = JSON.parse(localStorage.getItem('jcw_settings') || '{}');
    
    if (settings.bankDetails) {
        document.getElementById('bankName').value = settings.bankDetails.bankName || '';
        document.getElementById('accountNumber').value = settings.bankDetails.accountNumber || '';
        document.getElementById('accountName').value = settings.bankDetails.accountName || '';
        document.getElementById('bankSwift').value = settings.bankDetails.swift || '';
    }
}

function saveBankDetails() {
    const bankDetails = {
        bankName: document.getElementById('bankName').value,
        accountNumber: document.getElementById('accountNumber').value,
        accountName: document.getElementById('accountName').value,
        swift: document.getElementById('bankSwift').value
    };
    
    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
        alert('Please fill in all required bank details!');
        return;
    }
    
    const settings = JSON.parse(localStorage.getItem('jcw_settings') || '{}');
    settings.bankDetails = bankDetails;
    localStorage.setItem('jcw_settings', JSON.stringify(settings));
    
    alert('Bank details saved successfully!');
}

function getBankDetails() {
    const settings = JSON.parse(localStorage.getItem('jcw_settings') || '{}');
    return settings.bankDetails || null;
}