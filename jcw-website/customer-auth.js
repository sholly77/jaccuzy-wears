// Customer Authentication System
const CUSTOMER_API_URL = 'http://localhost/jcw-website/api';

// Check if customer is logged in
function isCustomerLoggedIn() {
    return localStorage.getItem('jcw_customer') !== null;
}

// Get current customer data
function getCurrentCustomer() {
    const customer = localStorage.getItem('jcw_customer');
    return customer ? JSON.parse(customer) : null;
}

// Show Login Modal
function showLoginModal() {
    document.getElementById('authModal').classList.add('active');
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.body.style.overflow = 'hidden';
}

// Show Signup Modal
function showSignupModal() {
    document.getElementById('authModal').classList.add('active');
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close Auth Modal
function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Switch between login and signup
function switchAuthMode(mode) {
    if (mode === 'login') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    } else {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    }
}

// Handle Customer Signup
async function handleCustomerSignup(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const customerData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        address: formData.get('address')
    };
    
    // Validation
    if (customerData.password !== formData.get('confirm_password')) {
        alert('Passwords do not match!');
        return;
    }
    
    if (customerData.password.length < 6) {
        alert('Password must be at least 6 characters!');
        return;
    }
    
    try {
        const response = await fetch(`${CUSTOMER_API_URL}/customers.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const customerToSave = {
                id: result.customer_id || Date.now(),
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone,
                address: customerData.address
            };
            localStorage.setItem('jcw_customer', JSON.stringify(customerToSave));
            saveCustomerToLocalList(customerToSave);
            
            alert('Account created successfully! Welcome to JCW.');
            closeAuthModal();
            updateCustomerUI();
        } else {
            throw new Error(result.error || 'Failed to create account');
        }
    } catch (error) {
        console.error('Signup error:', error);
        
        const customerToSave = {
            id: 'CUST-' + Date.now(),
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            address: customerData.address,
            password: customerData.password
        };
        
        localStorage.setItem('jcw_customer', JSON.stringify(customerToSave));
        saveCustomerToLocalList(customerToSave);
        
        alert('Account created successfully! Welcome to JCW.');
        closeAuthModal();
        updateCustomerUI();
    }
}

// Handle Customer Login
async function handleCustomerLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
        const response = await fetch(`${CUSTOMER_API_URL}/customers.php?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('jcw_customer', JSON.stringify(result.customer));
            alert('Welcome back, ' + result.customer.name + '!');
            closeAuthModal();
            updateCustomerUI();
        } else {
            throw new Error(result.error || 'Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        
        const customers = JSON.parse(localStorage.getItem('jcw_customers_list') || '[]');
        const customer = customers.find(c => c.email === email && c.password === password);
        
        if (customer) {
            const customerToSave = { ...customer };
            delete customerToSave.password;
            localStorage.setItem('jcw_customer', JSON.stringify(customerToSave));
            alert('Welcome back, ' + customer.name + '!');
            closeAuthModal();
            updateCustomerUI();
        } else {
            alert('Invalid email or password!');
        }
    }
}

// Save customer to local list (for admin view)
function saveCustomerToLocalList(customer) {
    const customers = JSON.parse(localStorage.getItem('jcw_customers_list') || '[]');
    const existingIndex = customers.findIndex(c => c.email === customer.email);
    
    if (existingIndex >= 0) {
        customers[existingIndex] = { ...customers[existingIndex], ...customer };
    } else {
        customers.push(customer);
    }
    
    localStorage.setItem('jcw_customers_list', JSON.stringify(customers));
}

// Customer Logout
function customerLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('jcw_customer');
        localStorage.removeItem('jcw_cart');
        updateCustomerUI();
        alert('You have been logged out.');
    }
}

// Update UI based on login status
function updateCustomerUI() {
    const customer = getCurrentCustomer();
    const authButton = document.getElementById('customerAuthBtn');
    
    if (customer) {
        if (authButton) {
            authButton.innerHTML = `
                <div class="customer-menu" style="position: relative;">
                    <button onclick="toggleCustomerMenu()" style="display: flex; align-items: center; gap: 0.5rem; background: none; border: none; color: white; cursor: pointer;">
                        <span style="width: 32px; height: 32px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600;">
                            ${customer.name.charAt(0).toUpperCase()}
                        </span>
                    </button>
                    <div id="customerDropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; min-width: 200px; z-index: 1001;">
                        <div style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <div style="font-weight: 600;">${customer.name}</div>
                            <div style="font-size: 0.85rem; color: var(--gray);">${customer.email}</div>
                        </div>
                        <a href="#" onclick="showOrderHistory(); return false;" style="display: block; padding: 0.75rem 1rem; color: white; text-decoration: none; transition: background 0.3s;">📦 My Orders</a>
                        <a href="#" onclick="showProfile(); return false;" style="display: block; padding: 0.75rem 1rem; color: white; text-decoration: none; transition: background 0.3s;">👤 Profile</a>
                        <a href="#" onclick="customerLogout(); return false;" style="display: block; padding: 0.75rem 1rem; color: #FF3B30; text-decoration: none; transition: background 0.3s; border-top: 1px solid rgba(255,255,255,0.1);">🚪 Logout</a>
                    </div>
                </div>
            `;
        }
        
        // Pre-fill checkout form
        const checkoutForm = document.getElementById('checkoutForm');
        if (checkoutForm) {
            checkoutForm.querySelector('[name="name"]').value = customer.name || '';
            checkoutForm.querySelector('[name="email"]').value = customer.email || '';
            checkoutForm.querySelector('[name="phone"]').value = customer.phone || '';
            checkoutForm.querySelector('[name="address"]').value = customer.address || '';
        }
    } else {
        if (authButton) {
            authButton.innerHTML = `<button onclick="showLoginModal()" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;">👤</button>`;
        }
    }
}

// Toggle customer dropdown menu
function toggleCustomerMenu() {
    const dropdown = document.getElementById('customerDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// Show order history
function showOrderHistory() {
    const customer = getCurrentCustomer();
    if (!customer) return;
    
    const orders = JSON.parse(localStorage.getItem('jcw_orders') || '[]');
    const customerOrders = orders.filter(o => o.customer?.email === customer.email);
    
    if (customerOrders.length === 0) {
        alert('You have no orders yet.');
        return;
    }
    
    let orderList = 'Your Orders:\n\n';
    customerOrders.forEach(order => {
        orderList += `Order: ${order.id || order.order_id}\n`;
        orderList += `Total: ₦${(parseFloat(order.total) || 0).toLocaleString('en-NG')}\n`;
        orderList += `Status: ${order.status || 'pending'}\n`;
        orderList += `Date: ${new Date(order.date).toLocaleDateString()}\n\n`;
    });
    
    alert(orderList);
}

// Show profile
function showProfile() {
    const customer = getCurrentCustomer();
    if (!customer) return;
    
    alert(`Profile:\n\nName: ${customer.name}\nEmail: ${customer.email}\nPhone: ${customer.phone || 'N/A'}\nAddress: ${customer.address || 'N/A'}`);
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const customerMenu = document.querySelector('.customer-menu');
    if (customerMenu && !customerMenu.contains(e.target)) {
        const dropdown = document.getElementById('customerDropdown');
        if (dropdown) dropdown.style.display = 'none';
    }
});

// Initialize customer UI on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCustomerUI();
});