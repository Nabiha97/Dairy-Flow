// Product Data
const products = [
    {
        id: '1',
        name: 'Fresh Whole Milk',
        price: 60,
        unit: '1 Liter',
        image: 'https://images.unsplash.com/photo-1569696074196-402ff5882e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        category: 'Milk'
    },
    {
        id: '2',
        name: 'Toned Milk',
        price: 50,
        unit: '1 Liter',
        image: 'https://images.unsplash.com/photo-1569696074196-402ff5882e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        category: 'Milk'
    },
    {
        id: '3',
        name: 'Fresh Curd',
        price: 45,
        unit: '500g',
        image: 'https://images.unsplash.com/photo-1633383718081-22ac93e3db65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        category: 'Dairy'
    },
    {
        id: '4',
        name: 'Fresh Paneer',
        price: 120,
        unit: '250g',
        image: 'https://images.unsplash.com/photo-1701579231378-3726490a407b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        category: 'Dairy'
    },
    {
        id: '5',
        name: 'Fresh Butter',
        price: 85,
        unit: '200g',
        image: 'https://images.unsplash.com/photo-1660798670183-333ac43c3c4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        category: 'Dairy'
    },
    {
        id: '6',
        name: 'Buttermilk',
        price: 30,
        unit: '500ml',
        image: 'https://images.unsplash.com/photo-1569696074196-402ff5882e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        category: 'Beverages'
    },
    {
        id: '7',
        name: 'Pure Ghee',
        price: 550,
        unit: '500g',
        image: 'https://images.unsplash.com/photo-1573812461383-e5f8b759d12e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        category: 'Dairy'
    },
    {
        id: '8',
        name: 'Vanilla Ice Cream',
        price: 180,
        unit: '500ml',
        image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        category: 'Ice Cream'
    },
    {
        id: '9',
        name: 'Chocolate Ice Cream',
        price: 180,
        unit: '500ml',
        image: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        category: 'Ice Cream'
    },
    {
        id: '10',
        name: 'Strawberry Milk',
        price: 40,
        unit: '200ml',
        image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        category: 'Beverages'
    },
    {
        id: '11',
        name: 'Chocolate Milk',
        price: 40,
        unit: '200ml',
        image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        category: 'Beverages'
    },
    {
        id: '12',
        name: 'Gulab Jamun',
        price: 150,
        unit: '1kg',
        image: 'https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        category: 'Sweets'
    },
    {
        id: '13',
        name: 'Cheese Namkeen',
        price: 95,
        unit: '250g',
        image: 'https://images.unsplash.com/photo-1764315975176-a0281c4b4f08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        category: 'Snacks'
    }
];

// Application State
let currentUser = null;
let cart = [];
let isSignUp = false;
let searchQuery = '';

// DOM Elements
const loginPage = document.getElementById('loginPage');
const mainApp = document.getElementById('mainApp');
const authForm = document.getElementById('authForm');
const toggleAuthBtn = document.getElementById('toggleAuthBtn');
const togglePassword = document.getElementById('togglePassword');
const searchInput = document.getElementById('searchInput');
const productsGrid = document.getElementById('productsGrid');
const cartItems = document.getElementById('cartItems');
const cartBadge = document.getElementById('cartBadge');
const totalAmount = document.getElementById('totalAmount');
const cartFooter = document.getElementById('cartFooter');
const logoutBtn = document.getElementById('logoutBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutModal = document.getElementById('checkoutModal');
const closeModal = document.getElementById('closeModal');
const successModal = document.getElementById('successModal');
const continueShoppingBtn = document.getElementById('continueShoppingBtn');
const checkoutForm = document.getElementById('checkoutForm');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    renderProducts(products);
});

// Event Listeners
function setupEventListeners() {
    // Auth Form
    authForm.addEventListener('submit', handleAuth);
    toggleAuthBtn.addEventListener('click', toggleAuthMode);
    togglePassword.addEventListener('click', togglePasswordVisibility);
    
    // Main App
    searchInput.addEventListener('input', handleSearch);
    logoutBtn.addEventListener('click', handleLogout);
    checkoutBtn.addEventListener('click', openCheckoutModal);
    closeModal.addEventListener('click', closeCheckoutModal);
    continueShoppingBtn.addEventListener('click', closeSuccessModal);
    checkoutForm.addEventListener('submit', handlePlaceOrder);
    
    // Close modals on outside click
    window.addEventListener('click', function(e) {
        if (e.target === checkoutModal) {
            closeCheckoutModal();
        }
        if (e.target === successModal) {
            closeSuccessModal();
        }
    });
}

// Authentication Functions
function handleAuth(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Clear previous errors
    clearErrors();
    
    // Validate
    let hasError = false;
    
    if (isSignUp && !name.trim()) {
        showError('nameError', 'Name is required');
        hasError = true;
    }
    
    if (!email.trim()) {
        showError('emailError', 'Email is required');
        hasError = true;
    } else if (!isValidEmail(email)) {
        showError('emailError', 'Email is invalid');
        hasError = true;
    }
    
    if (!password) {
        showError('passwordError', 'Password is required');
        hasError = true;
    } else if (password.length < 6) {
        showError('passwordError', 'Password must be at least 6 characters');
        hasError = true;
    }
    
    if (isSignUp && password !== confirmPassword) {
        showError('confirmPasswordError', 'Passwords do not match');
        hasError = true;
    }
    
    if (hasError) return;
    
    // Login successful
    currentUser = {
        name: name || email.split('@')[0],
        email: email
    };
    
    showMainApp();
}

function toggleAuthMode() {
    isSignUp = !isSignUp;
    
    const nameGroup = document.getElementById('nameGroup');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const forgotPassword = document.getElementById('forgotPassword');
    const formTitle = document.getElementById('formTitle');
    const formDescription = document.getElementById('formDescription');
    const submitBtn = document.getElementById('submitBtn');
    const toggleText = document.getElementById('toggleText');
    const loginSubtitle = document.getElementById('loginSubtitle');
    
    if (isSignUp) {
        nameGroup.style.display = 'block';
        confirmPasswordGroup.style.display = 'block';
        forgotPassword.style.display = 'none';
        formTitle.textContent = 'Sign Up';
        formDescription.textContent = 'Join us to order fresh dairy products';
        submitBtn.textContent = 'Create Account';
        toggleText.textContent = 'Already have an account?';
        toggleAuthBtn.textContent = 'Sign In';
        loginSubtitle.textContent = 'Create your account';
    } else {
        nameGroup.style.display = 'none';
        confirmPasswordGroup.style.display = 'none';
        forgotPassword.style.display = 'block';
        formTitle.textContent = 'Sign In';
        formDescription.textContent = 'Sign in to continue shopping';
        submitBtn.textContent = 'Sign In';
        toggleText.textContent = "Don't have an account?";
        toggleAuthBtn.textContent = 'Sign Up';
        loginSubtitle.textContent = 'Welcome back!';
    }
    
    clearErrors();
    authForm.reset();
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const icon = togglePassword.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    
    const inputId = elementId.replace('Error', '');
    const input = document.getElementById(inputId);
    if (input) {
        input.classList.add('error');
    }
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => el.textContent = '');
    
    const inputs = document.querySelectorAll('.input-wrapper input');
    inputs.forEach(input => input.classList.remove('error'));
}

function isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
}

function showMainApp() {
    loginPage.style.display = 'none';
    mainApp.style.display = 'block';
    document.getElementById('userName').textContent = currentUser.name;
}

function handleLogout() {
    currentUser = null;
    cart = [];
    searchQuery = '';
    
    loginPage.style.display = 'flex';
    mainApp.style.display = 'none';
    
    authForm.reset();
    searchInput.value = '';
    updateCart();
}

// Product Functions
function renderProducts(productsToRender) {
    productsGrid.innerHTML = '';
    
    if (productsToRender.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #6b7280; padding: 2rem;">No products found</p>';
        return;
    }
    
    productsToRender.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <div class="product-category">${product.category}</div>
            <h3 class="product-name">${product.name}</h3>
            <div class="product-details">
                <span class="product-price">₹${product.price}</span>
                <span class="product-unit">${product.unit}</span>
            </div>
            <div class="product-actions">
                <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
                <button class="buy-now-btn" onclick="buyNow('${product.id}')">
                    Buy Now
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function handleSearch(e) {
    searchQuery = e.target.value;
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    renderProducts(filteredProducts);
    
    const searchResults = document.getElementById('searchResults');
    if (searchQuery) {
        searchResults.textContent = `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found for "${searchQuery}"`;
    } else {
        searchResults.textContent = '';
    }
}

// Cart Functions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCart();
    
    // Visual feedback
    showNotification(`${product.name} added to cart!`);
}

function buyNow(productId) {
    addToCart(productId);
    setTimeout(() => {
        openCheckoutModal();
    }, 500);
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        cart = cart.filter(item => item.id !== productId);
    }
    
    updateCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

function updateCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update badge
    cartBadge.textContent = totalItems;
    
    // Update total
    totalAmount.textContent = `₹${total}`;
    
    // Render cart items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <span>Add products to get started</span>
            </div>
        `;
        cartFooter.style.display = 'none';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-unit">${item.unit}</div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                        <span class="cart-item-price">₹${item.price * item.quantity}</span>
                    </div>
                </div>
                <div class="cart-item-remove">
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        cartFooter.style.display = 'block';
    }
}

// Checkout Functions
function openCheckoutModal() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Populate checkout items
    const checkoutItems = document.getElementById('checkoutItems');
    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <div class="checkout-item-info">
                <span>${item.name} × ${item.quantity}</span>
            </div>
            <span class="checkout-item-price">₹${item.price * item.quantity}</span>
        </div>
    `).join('');
    
    // Update total
    document.getElementById('checkoutTotal').textContent = `₹${total}`;
    
    // Pre-fill user details
    document.getElementById('deliveryName').value = currentUser.name;
    
    checkoutModal.classList.add('show');
}

function closeCheckoutModal() {
    checkoutModal.classList.remove('show');
    checkoutForm.reset();
}

function handlePlaceOrder(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('deliveryName').value,
        phone: document.getElementById('deliveryPhone').value,
        address: document.getElementById('deliveryAddress').value,
        city: document.getElementById('deliveryCity').value,
        pincode: document.getElementById('deliveryPincode').value,
        payment: document.querySelector('input[name="payment"]:checked').value
    };
    
    // Simulate order placement
    console.log('Order placed:', { cart, customer: formData });
    
    // Close checkout modal
    closeCheckoutModal();
    
    // Show success modal
    successModal.classList.add('show');
    
    // Clear cart
    cart = [];
    updateCart();
}

function closeSuccessModal() {
    successModal.classList.remove('show');
}

// Notification Function
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 5rem;
        right: 1rem;
        background: #16a34a;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
