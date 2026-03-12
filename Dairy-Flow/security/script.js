// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    setupEventListeners();
});

// Initialize the application
function initApp() {
    const storedPassword = localStorage.getItem('userPassword');
    
    // Hide loading screen
    document.getElementById('loading').classList.add('hidden');
    
    if (storedPassword) {
        // Password is set, show login screen
        showScreen('loginScreen');
    } else {
        // No password set, show setup screen
        showScreen('setupScreen');
    }
}

// Setup form event listeners
function setupEventListeners() {
    // Setup form submission
    document.getElementById('setupForm').addEventListener('submit', handleSetup);
    
    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// Handle password setup
function handleSetup(e) {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('setupError');
    
    // Clear previous errors
    hideError(errorDiv);
    
    // Validate password length
    if (password.length < 6) {
        showError(errorDiv, 'Password must be at least 6 characters long');
        return;
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showError(errorDiv, 'Passwords do not match');
        return;
    }
    
    // Store password
    localStorage.setItem('userPassword', password);
    
    // Clear form
    document.getElementById('password').value = '';
    document.getElementById('confirmPassword').value = '';
    
    // Show login screen
    showScreen('loginScreen');
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const inputPassword = document.getElementById('loginPassword').value;
    const storedPassword = localStorage.getItem('userPassword');
    const errorDiv = document.getElementById('loginError');
    
    // Clear previous errors
    hideError(errorDiv);
    
    // Check password
    if (inputPassword === storedPassword) {
        // Correct password
        document.getElementById('loginPassword').value = '';
        showScreen('contentScreen');
    } else {
        // Incorrect password
        showError(errorDiv, 'Incorrect password');
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
    }
}

// Reset password
function resetPassword() {
    const confirmed = confirm('Are you sure you want to reset your password? This will log you out.');
    
    if (confirmed) {
        // Remove stored password
        localStorage.removeItem('userPassword');
        
        // Clear all forms
        document.getElementById('password').value = '';
        document.getElementById('confirmPassword').value = '';
        document.getElementById('loginPassword').value = '';
        
        // Hide all errors
        hideError(document.getElementById('setupError'));
        hideError(document.getElementById('loginError'));
        
        // Show setup screen
        showScreen('setupScreen');
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

// Show a specific screen and hide others
function showScreen(screenId) {
    const screens = ['setupScreen', 'loginScreen', 'contentScreen', 'loading'];
    
    screens.forEach(screen => {
        if (screen === screenId) {
            document.getElementById(screen).classList.remove('hidden');
        } else {
            document.getElementById(screen).classList.add('hidden');
        }
    });
}

// Show error message
function showError(errorDiv, message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Hide error message
function hideError(errorDiv) {
    errorDiv.textContent = '';
    errorDiv.classList.add('hidden');
}
