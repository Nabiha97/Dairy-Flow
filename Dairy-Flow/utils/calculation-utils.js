// Automatic Calculation Utilities

/**
 * Calculate amount due from quantity and rate per liter
 * @param {number} quantity - Quantity in liters
 * @param {number} rpl - Rate per liter
 * @returns {number} Amount due
 */
function calculateAmountDue(quantity, rpl) {
    return (parseFloat(quantity) || 0) * (parseFloat(rpl) || 0);
}

/**
 * Calculate total from quantity and price per unit
 * @param {number} quantity - Quantity
 * @param {number} pricePerUnit - Price per unit
 * @returns {number} Total amount
 */
function calculateTotal(quantity, pricePerUnit) {
    return (parseFloat(quantity) || 0) * (parseFloat(pricePerUnit) || 0);
}

/**
 * Calculate grand total from total and MTD
 * @param {number} total - Total amount
 * @param {number} mtd - Month-to-date amount
 * @returns {number} Grand total
 */
function calculateGrandTotal(total, mtd) {
    return (parseFloat(total) || 0) + (parseFloat(mtd) || 0);
}

/**
 * Calculate balance from total and paid amount
 * @param {number} total - Total amount
 * @param {number} paid - Paid amount
 * @returns {number} Balance
 */
function calculateBalance(total, paid) {
    return (parseFloat(total) || 0) - (parseFloat(paid) || 0);
}

/**
 * Calculate net profit from sales, expenses, purchases, and salaries
 * @param {number} sales - Total sales
 * @param {number} expenses - Total expenses
 * @param {number} purchases - Total purchases
 * @param {number} salaries - Total salaries
 * @returns {number} Net profit
 */
function calculateNetProfit(sales, expenses, purchases, salaries) {
    return (parseFloat(sales) || 0) - 
           (parseFloat(expenses) || 0) - 
           (parseFloat(purchases) || 0) - 
           (parseFloat(salaries) || 0);
}

/**
 * Calculate total liters from AM and PM liters
 * @param {number} amLiters - AM liters
 * @param {number} pmLiters - PM liters
 * @returns {number} Total liters
 */
function calculateTotalLiters(amLiters, pmLiters) {
    return (parseFloat(amLiters) || 0) + (parseFloat(pmLiters) || 0);
}

/**
 * Auto-calculate and update a field when inputs change
 * @param {Object} config - Configuration object
 */
function setupAutoCalculation(config) {
    const {
        inputSelectors, // Array of input selectors to watch
        calculateFn, // Function to calculate the result
        outputSelector, // Selector for output field
        formatFn = (val) => val.toFixed(2), // Format function
        onUpdate = null // Callback when value updates
    } = config;
    
    inputSelectors.forEach(selector => {
        const input = document.querySelector(selector);
        if (input) {
            input.addEventListener('input', () => {
                const values = inputSelectors.map(sel => {
                    const inp = document.querySelector(sel);
                    return inp ? parseFloat(inp.value) || 0 : 0;
                });
                
                const result = calculateFn(...values);
                const output = document.querySelector(outputSelector);
                
                if (output) {
                    output.value = formatFn(result);
                    
                    // Trigger input event for other listeners
                    output.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    if (onUpdate) {
                        onUpdate(result);
                    }
                }
            });
        }
    });
}

/**
 * Calculate MTD (Month-to-Date) cumulative values
 * @param {Array} rows - Array of row data objects
 * @param {string} valueField - Field name for the value to accumulate
 * @returns {Array} Rows with MTD values added
 */
function calculateMTD(rows, valueField = 'total') {
    let cumulative = 0;
    return rows.map(row => {
        cumulative += parseFloat(row[valueField]) || 0;
        return {
            ...row,
            mtd: cumulative
        };
    });
}

// Export functions
window.calculateAmountDue = calculateAmountDue;
window.calculateTotal = calculateTotal;
window.calculateGrandTotal = calculateGrandTotal;
window.calculateBalance = calculateBalance;
window.calculateNetProfit = calculateNetProfit;
window.calculateTotalLiters = calculateTotalLiters;
window.setupAutoCalculation = setupAutoCalculation;
window.calculateMTD = calculateMTD;
