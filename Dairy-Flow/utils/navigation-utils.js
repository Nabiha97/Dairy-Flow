// Arrow Key Navigation Utility for Form Inputs

/**
 * Enable arrow key navigation between input fields
 * @param {HTMLElement} container - Container element containing inputs
 * @param {Object} options - Configuration options
 */
function enableArrowKeyNavigation(container, options = {}) {
    const {
        selector = 'input, textarea, select',
        rowSelector = 'tr',
        allowVertical = true,
        allowHorizontal = true,
        wrapAround = false
    } = options;
    
    if (!container) return;
    
    container.addEventListener('keydown', function(e) {
        // Only handle arrow keys
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            return;
        }
        
        const inputs = Array.from(container.querySelectorAll(selector));
        const currentInput = document.activeElement;
        
        // Check if current element is an input
        if (!inputs.includes(currentInput)) {
            return;
        }
        
        const currentIndex = inputs.indexOf(currentInput);
        let nextIndex = -1;
        
        // Determine next input based on arrow key
        if (e.key === 'ArrowRight' && allowHorizontal) {
            nextIndex = currentIndex + 1;
            if (nextIndex >= inputs.length) {
                nextIndex = wrapAround ? 0 : -1;
            }
        } else if (e.key === 'ArrowLeft' && allowHorizontal) {
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
                nextIndex = wrapAround ? inputs.length - 1 : -1;
            }
        } else if (e.key === 'ArrowDown' && allowVertical) {
            // Find inputs in the same column (if in table)
            const currentRow = currentInput.closest(rowSelector);
            if (currentRow) {
                const cellIndex = Array.from(currentRow.cells || currentRow.children).indexOf(currentInput.closest('td, th'));
                const rows = Array.from(container.querySelectorAll(rowSelector));
                const currentRowIndex = rows.indexOf(currentRow);
                
                // Find next row with input in same column
                for (let i = currentRowIndex + 1; i < rows.length; i++) {
                    const cell = rows[i].children[cellIndex];
                    if (cell) {
                        const input = cell.querySelector(selector);
                        if (input) {
                            nextIndex = inputs.indexOf(input);
                            break;
                        }
                    }
                }
            } else {
                // Fallback to next input
                nextIndex = currentIndex + 1;
                if (nextIndex >= inputs.length) {
                    nextIndex = wrapAround ? 0 : -1;
                }
            }
        } else if (e.key === 'ArrowUp' && allowVertical) {
            // Find inputs in the same column (if in table)
            const currentRow = currentInput.closest(rowSelector);
            if (currentRow) {
                const cellIndex = Array.from(currentRow.cells || currentRow.children).indexOf(currentInput.closest('td, th'));
                const rows = Array.from(container.querySelectorAll(rowSelector));
                const currentRowIndex = rows.indexOf(currentRow);
                
                // Find previous row with input in same column
                for (let i = currentRowIndex - 1; i >= 0; i--) {
                    const cell = rows[i].children[cellIndex];
                    if (cell) {
                        const input = cell.querySelector(selector);
                        if (input) {
                            nextIndex = inputs.indexOf(input);
                            break;
                        }
                    }
                }
            } else {
                // Fallback to previous input
                nextIndex = currentIndex - 1;
                if (nextIndex < 0) {
                    nextIndex = wrapAround ? inputs.length - 1 : -1;
                }
            }
        }
        
        // Focus next input if found
        if (nextIndex >= 0 && nextIndex < inputs.length) {
            e.preventDefault();
            inputs[nextIndex].focus();
            // Select text if it's a text input
            if (inputs[nextIndex].type === 'text' || inputs[nextIndex].type === 'number') {
                inputs[nextIndex].select();
            }
        }
    });
}

/**
 * Initialize arrow key navigation for a page
 * @param {Object} options - Configuration options
 */
function initArrowKeyNavigation(options = {}) {
    const {
        containerSelector = 'body',
        inputSelector = 'input, textarea, select',
        rowSelector = 'tr',
        allowVertical = true,
        allowHorizontal = true,
        wrapAround = false
    } = options;
    
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.querySelector(containerSelector);
        if (container) {
            enableArrowKeyNavigation(container, {
                selector: inputSelector,
                rowSelector: rowSelector,
                allowVertical: allowVertical,
                allowHorizontal: allowHorizontal,
                wrapAround: wrapAround
            });
        }
    });
}

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initArrowKeyNavigation();
    });
} else {
    initArrowKeyNavigation();
}

// Export functions
window.enableArrowKeyNavigation = enableArrowKeyNavigation;
window.initArrowKeyNavigation = initArrowKeyNavigation;
