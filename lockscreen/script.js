const BASE_URL = "https://dairy-flow-1.onrender.com";
const WHATSAPP_NUMBER = "916302860355"; // ← replace with your boss's number

// Fetch license status from backend
async function checkLicense() {
    try {
        const res = await fetch(`${BASE_URL}/api/check-license`);
        const data = await res.json();

        if (data.active) {
            // App is active, redirect to main app
            window.location.href = "/";
        } else {
            // App is locked, update UI with real data
            updateLockScreen(data.expiry, data.balance);
        }
    } catch (err) {
        console.error('License check failed:', err);
    }
}

// Update lock screen with real data from Neon
function updateLockScreen(expiryDate, balance) {
    // Update balance
    const balanceEl = document.querySelector('.balance-amount');
    if (balanceEl) {
        balanceEl.textContent = `₹${parseFloat(balance).toFixed(2)}`;
    }

    // Update expiry date if element exists
    const expiryEl = document.querySelector('.expiry-date');
    if (expiryEl) {
        expiryEl.textContent = `Expired on: ${expiryDate}`;
    }
}

// Recharge Now button → opens WhatsApp
function handleRecharge() {
    const msg = encodeURIComponent("Hello, I want to recharge my Dairy Flow subscription.");
    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
    window.open(whatsappLink, '_blank');
}

// Need Help? Contact Support → calls number
function handleSupport() {
    window.location.href = `tel:+${WHATSAPP_NUMBER}`;
}

// Prevent back button navigation
function preventBackNavigation() {
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = function () {
        window.history.pushState(null, '', window.location.href);
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    checkLicense();
    preventBackNavigation();
});

// Keyboard accessibility
document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.classList.contains('recharge-btn')) {
            handleRecharge();
        } else if (activeElement.classList.contains('support-link')) {
            handleSupport();
        }
    }
});