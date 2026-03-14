// Password Protection Functions
let isAuthenticated = false;

// Check if user is authenticated (with session)
function checkAuthentication() {
    const sessionAuth = sessionStorage.getItem('isAuthenticated');
    const storedPassword = localStorage.getItem('userPassword');
    
    // Check if we have a valid session and password is set
    if (sessionAuth === 'true' && storedPassword) {
        return true;
    }
    return false;
}

// Set authentication session
function setAuthSession() {
    sessionStorage.setItem('isAuthenticated', 'true');
    isAuthenticated = true;
}

// Clear authentication session
function clearAuthSession() {
    sessionStorage.removeItem('isAuthenticated');
    isAuthenticated = false;
}

// Initialize password protection
function initPasswordProtection() {
    const passwordModal = document.getElementById('passwordModal');
    
    // Hide modal initially - will show when hamburger is clicked
    if (passwordModal) passwordModal.classList.add('hidden');
    
    // Setup form event listeners
    setupPasswordEventListeners();
}

// Show password modal when hamburger is clicked
function showPasswordModal() {
    const passwordModal = document.getElementById('passwordModal');
    const storedPassword = localStorage.getItem('userPassword');
    
    if (!passwordModal) return;
    
    // Show the modal
    passwordModal.classList.remove('hidden');
    
    // Show appropriate screen
    if (storedPassword) {
        // Password is set, show login screen
        showPasswordScreen('loginScreen');
        // Focus on password input
        setTimeout(() => {
            const loginPassword = document.getElementById('loginPassword');
            if (loginPassword) loginPassword.focus();
        }, 100);
    } else {
        // No password set, show setup screen
        showPasswordScreen('setupScreen');
        // Focus on password input
        setTimeout(() => {
            const password = document.getElementById('password');
            if (password) password.focus();
        }, 100);
    }
}

// Show password screen
function showPasswordScreen(screenId) {
    const setupScreen = document.getElementById('setupScreen');
    const loginScreen = document.getElementById('loginScreen');
    
    if (screenId === 'setupScreen') {
        setupScreen.classList.remove('hidden');
        loginScreen.classList.add('hidden');
    } else {
        setupScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    }
}

// Setup password form event listeners
function setupPasswordEventListeners() {
    // Setup form submission
    const setupForm = document.getElementById('setupForm');
    if (setupForm) {
        setupForm.addEventListener('submit', handlePasswordSetup);
    }
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handlePasswordLogin);
    }
}

// Handle password setup
function handlePasswordSetup(e) {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('setupError');
    
    // Clear previous errors
    hidePasswordError(errorDiv);
    
    // Validate password length
    if (password.length < 6) {
        showPasswordError(errorDiv, 'Password must be at least 6 characters long');
        return;
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showPasswordError(errorDiv, 'Passwords do not match');
        return;
    }
    
    // Store password
    localStorage.setItem('userPassword', password);
    
    // Clear form
    document.getElementById('password').value = '';
    document.getElementById('confirmPassword').value = '';
    
    // Automatically authenticate and unlock access
    unlockAccess();
}

// Handle password login
function handlePasswordLogin(e) {
    e.preventDefault();
    
    const inputPassword = document.getElementById('loginPassword').value;
    const storedPassword = localStorage.getItem('userPassword');
    const errorDiv = document.getElementById('loginError');
    
    // Clear previous errors
    hidePasswordError(errorDiv);
    
    // Check password
    if (inputPassword === storedPassword) {
        // Correct password - unlock access
        isAuthenticated = true;
        document.getElementById('loginPassword').value = '';
        unlockAccess();
    } else {
        // Incorrect password
        showPasswordError(errorDiv, 'Incorrect password');
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
    }
}

// Unlock access to hamburger menu and database
function unlockAccess() {
    const passwordModal = document.getElementById('passwordModal');
    
    // Set authentication for this menu session only
    isAuthenticated = true;
    
    // Hide password modal
    if (passwordModal) passwordModal.classList.add('hidden');
    
    // Enable database access
    console.log('Access granted to database and menu');
    
    // Now open the sidebar menu
    openMenuAfterAuth();
}

// Open menu after authentication
function openMenuAfterAuth() {
    const sidebarMenu = document.getElementById('sidebarMenu');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (sidebarMenu && sidebarOverlay) {
        sidebarMenu.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Reset password
function resetPassword() {
    const confirmed = confirm('Are you sure you want to reset your password? This will require setting a new password.');
    
    if (confirmed) {
        // Remove stored password
        localStorage.removeItem('userPassword');
        
        // Clear all forms
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const loginPasswordInput = document.getElementById('loginPassword');
        
        if (passwordInput) passwordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
        if (loginPasswordInput) loginPasswordInput.value = '';
        
        // Hide all errors
        const setupError = document.getElementById('setupError');
        const loginError = document.getElementById('loginError');
        if (setupError) hidePasswordError(setupError);
        if (loginError) hidePasswordError(loginError);
        
        // Lock access
        isAuthenticated = false;
        clearAuthSession();
        
        // Close sidebar if open
        const sidebarMenu = document.getElementById('sidebarMenu');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (sidebarMenu) sidebarMenu.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Show setup screen
        showPasswordScreen('setupScreen');
    }
}

// Lock access
function lockAccess() {
    const sidebarMenu = document.getElementById('sidebarMenu');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    // Clear authentication session
    clearAuthSession();
    
    // Close menu if open
    if (sidebarMenu) sidebarMenu.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        if (input.type === 'password') {
            input.type = 'text';
        } else {
            input.type = 'password';
        }
    }
}

// Show error message
function showPasswordError(errorDiv, message) {
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

// Hide error message
function hidePasswordError(errorDiv) {
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.classList.add('hidden');
    }
}

// Make functions globally available
window.togglePassword = togglePassword;
window.resetPassword = resetPassword;

// Hamburger Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize password protection first
    initPasswordProtection();
    
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeBtn = document.getElementById('closeBtn');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const orderBtn = document.getElementById('orderBtn');
    const navButtons = document.querySelectorAll('.nav-button');
    const contactForm = document.getElementById('contactForm');

    // Open sidebar menu (always require password)
    function openMenu() {
        // Always show password modal when hamburger is clicked
        showPasswordModal();
    }

    // Close sidebar menu
    function closeMenu() {
        sidebarMenu.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
        // Reset authentication so password is required again next time
        isAuthenticated = false;
    }

    // Event listeners for menu
    hamburgerBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openMenu();
    });
    closeBtn.addEventListener('click', closeMenu);
    sidebarOverlay.addEventListener('click', closeMenu);

    // Navigate to page when clicking a sidebar link
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pagePath = this.getAttribute('data-page');
            if (pagePath) {
                closeMenu();
                // Navigate to the page
                window.location.href = pagePath;
            }
        });
    });

    // Smooth scroll function
    function scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    // Navigation buttons smooth scroll
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-scroll');
            scrollToSection(targetId);
        });
    });

    // Order Online button navigation
    orderBtn.addEventListener('click', function() {
        // Add clicked class for animation
        this.classList.add('clicked');
        
        // Get the page path from data attribute
        const pagePath = this.getAttribute('data-page');
        
        // Remove class after animation, then navigate
        setTimeout(() => {
            this.classList.remove('clicked');
            if (pagePath) {
                window.location.href = pagePath;
            }
        }, 300);
    });

    // Contact form submission
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const formData = new FormData(this);
        const name = this.querySelector('input[type="text"]').value;
        const email = this.querySelector('input[type="email"]').value;
        const message = this.querySelector('textarea').value;
        
        // Here you would normally send the data to a server
        console.log('Form submitted:', { name, email, message });
        
        // Show success message (you can customize this)
        alert('Thank you for your message! We will get back to you soon.');
        
        // Reset form
        this.reset();
    });

    // Add scroll effect to header
    let lastScroll = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        // Add shadow when scrolled
        if (currentScroll > 0) {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });

    // Active navigation highlighting
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNavigation() {
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                // Highlight corresponding nav button
                navButtons.forEach(btn => {
                    if (btn.getAttribute('data-scroll') === sectionId) {
                        btn.style.color = '#ffd700';
                    } else {
                        btn.style.color = 'white';
                    }
                });
                
                // Highlight corresponding sidebar link
                sidebarLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.style.color = '#ffd700';
                    } else {
                        link.style.color = 'white';
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavigation);
    
    // Initialize on load
    highlightNavigation();

    // Keyboard navigation for accessibility
    document.addEventListener('keydown', function(e) {
        // Close menu with Escape key
        if (e.key === 'Escape' && sidebarMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    // Trap focus within sidebar when open
    const focusableElements = sidebarMenu.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        sidebarMenu.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
    }

    // Animation on scroll for cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe practice cards and value items
    const animatedElements = document.querySelectorAll('.practice-card, .value-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Console log for debugging
    console.log('Dairy-Flow website loaded successfully!');
});
