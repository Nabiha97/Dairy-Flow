// Enhanced Search Utility with Highlighting and Auto-scroll

/**
 * Highlight matching dates in search results and auto-scroll to first match
 * @param {string} searchDate - The date to search for (YYYY-MM-DD format)
 * @param {string} tableSelector - CSS selector for the table body
 * @param {string} dateColumnIndex - Index of the date column (0-based)
 */
function highlightAndScrollToDate(searchDate, tableSelector, dateColumnIndex = 1) {
    if (!searchDate) return;
    
    const tableBody = document.querySelector(tableSelector);
    if (!tableBody) return;
    
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    let firstMatch = null;
    
    // Format search date for comparison
    const searchDateObj = new Date(searchDate);
    const searchDay = searchDateObj.getDate();
    const searchMonth = searchDateObj.getMonth() + 1;
    const searchYear = searchDateObj.getFullYear();
    
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length > dateColumnIndex) {
            const dateCell = cells[dateColumnIndex];
            const dateText = dateCell.textContent.trim();
            
            // Try to parse the date from various formats
            let rowDate = null;
            try {
                // Try DD/MM/YYYY format
                const parts = dateText.split('/');
                if (parts.length === 3) {
                    rowDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                } else {
                    // Try other formats
                    rowDate = new Date(dateText);
                }
            } catch (e) {
                // Skip if date parsing fails
            }
            
            if (rowDate && !isNaN(rowDate.getTime())) {
                const rowDay = rowDate.getDate();
                const rowMonth = rowDate.getMonth() + 1;
                const rowYear = rowDate.getFullYear();
                
                // Check if dates match
                const matches = (searchDay && rowDay === searchDay) ||
                               (searchMonth && rowMonth === searchMonth) ||
                               (searchYear && rowYear === searchYear) ||
                               (rowDay === searchDay && rowMonth === searchMonth && rowYear === searchYear);
                
                if (matches) {
                    // Remove previous highlight
                    row.classList.remove('search-highlight');
                    
                    // Add highlight class
                    row.classList.add('search-highlight');
                    
                    // Store first match for scrolling
                    if (!firstMatch) {
                        firstMatch = row;
                    }
                    
                    // Remove highlight after 3 seconds
                    setTimeout(() => {
                        row.classList.remove('search-highlight');
                    }, 3000);
                } else {
                    row.classList.remove('search-highlight');
                }
            }
        }
    });
    
    // Scroll to first match
    if (firstMatch) {
        setTimeout(() => {
            firstMatch.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
            
            // Add pulse animation
            firstMatch.style.animation = 'pulse 1s ease-in-out';
            setTimeout(() => {
                firstMatch.style.animation = '';
            }, 1000);
        }, 100);
    }
}

/**
 * Search and filter table data by date components
 * @param {Object} filters - Object with year, month, date properties
 * @param {Array} data - Array of data objects with date property
 * @returns {Array} Filtered data
 */
function filterByDate(filters, data) {
    return data.filter(record => {
        if (!record.date) return false;
        
        const recordDate = new Date(record.date);
        if (isNaN(recordDate.getTime())) return false;
        
        const recordDay = recordDate.getDate();
        const recordMonth = recordDate.getMonth() + 1;
        const recordYear = recordDate.getFullYear();
        
        if (filters.year && recordYear !== parseInt(filters.year)) {
            return false;
        }
        
        if (filters.month && recordMonth !== parseInt(filters.month)) {
            return false;
        }
        
        if (filters.date && recordDay !== parseInt(filters.date)) {
            return false;
        }
        
        return true;
    });
}

// Add CSS for search highlight
if (!document.getElementById('search-highlight-styles')) {
    const style = document.createElement('style');
    style.id = 'search-highlight-styles';
    style.textContent = `
        .search-highlight {
            background-color: #fef3c7 !important;
            border-left: 4px solid #f59e0b !important;
            animation: highlight-flash 0.5s ease-in-out;
        }
        
        @keyframes highlight-flash {
            0%, 100% { background-color: #fef3c7; }
            50% { background-color: #fde68a; }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
    `;
    document.head.appendChild(style);
}

// Export functions
window.highlightAndScrollToDate = highlightAndScrollToDate;
window.filterByDate = filterByDate;
