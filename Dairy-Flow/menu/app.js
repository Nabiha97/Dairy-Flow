// Close button functionality
document.querySelector('.close-btn').addEventListener('click', function() {
    // You can add navigation logic here, e.g., closing the menu or navigating back
    console.log('Menu closed');
});

// Menu item click handlers
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        const itemText = this.textContent.trim();
        if (itemText.includes('Back')) {
            console.log('Navigate back');
            // Add your back navigation logic here
        } else {
            console.log('Selected:', itemText);
            // Add your menu item selection logic here
        }
    });
});

