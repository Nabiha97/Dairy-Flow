// Global Variables
let isEditMode = false;
let currentDate = 'ALL';
let dataHistory = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        dataHistory = await loadDataFromStorage();  // Load directly here
        await initializeApp();  // Now safe
    } catch (error) {
        console.error('Init failed:', error);
        dataHistory = { [currentDate]: { date: currentDate, amSales: [], pmSales: [] } };  // Failsafe
    }
    setupEventListeners();
    renderTables();
    updateSummaryCards();
});
async function saveSaleToBackend(sale, type) {
    try {
        const response = await fetch('http://localhost:5000/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
    customer_name: sale.name,
    rpl: sale.rpl,
    am_quantity: Number(sale.amQuantity) || 0,
    pm_quantity: Number(sale.pmQuantity) || 0,
    amountDue: ((Number(sale.amQuantity) || 0) + (Number(sale.pmQuantity) || 0)) * (Number(sale.rpl) || 0),
    table_type: type,
    date: sale.date
})
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const savedSale = await response.json();

        // 🔥 Sync backend ID
        sale.id = savedSale.id;

        console.log("✅ Sale saved with ID:", sale.id);

    } catch (error) {
        console.error("❌ Backend save failed:", error);
    }
}
async function updateSaleInBackend(sale, type) {
    try {
        await fetch(`http://localhost:5000/api/sales/${sale.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name: sale.name,
                liters_purchased: sale.litersPurchased,
                rpl: sale.rpl,
                quantity: (sale.amQuantity || 0) + (sale.pmQuantity || 0),
                amount_due: sale.litersPurchased * sale.rpl,
                table_type: type,
                date: sale.date
            })
        });

        console.log("✏️ Updated in DB");

    } catch (error) {
        console.error("❌ Update failed:", error);
    }
}
// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
// API Functions
async function fetchSales() {
    try {
        const response = await fetch('http://localhost:5000/api/sales');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}
async function deleteSaleFromBackend(id) {
    try {
        await fetch(`http://localhost:5000/api/sales/${id}`, {
            method: 'DELETE'
        });
        console.log("🗑 Deleted from PostgreSQL");
    } catch (error) {
        console.error("Delete failed:", error);
    }
}
// async function saveSales(currentData) {
//     try {
//         const allSales = [
//             ...currentData.amSales.map(s => ({ ...s, table_type: 'AM' })),
//             ...currentData.pmSales.map(s => ({ ...s, table_type: 'PM' }))
//         ];

//         for (let sale of allSales) {
//             await fetch('http://localhost:5000/api/sales', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     customer_name: sale.name,
//                     liters_purchased: sale.litersPurchased,
//                     rpl: sale.rpl,
//                     quantity: (sale.amQuantity || 0) + (sale.pmQuantity || 0),
//                     amount_due: sale.litersPurchased * sale.rpl,
//                     amount_paid: 0,
//                     table_type: sale.table_type,
//                     date: sale.date
//                 })
//             });
//         }

//         console.log("✅ Saved to PostgreSQL");

//     } catch (error) {
//         console.error("❌ Backend save failed:", error);
//     }
// }

async function loadDataFromStorage() {
    try {
        const apiData = await fetchSales();

        if (apiData && apiData.length > 0) {
            const grouped = {};

            // ✅ Group by actual date from DB
            apiData.forEach(sale => {
                const dateKey = sale.date;

                if (!grouped[dateKey]) {
                    grouped[dateKey] = {
                        date: dateKey,
                        amSales: [],
                        pmSales: []
                    };
                }

                const formattedSale = {
                id: sale.id,
                date: sale.date,
                name: sale.customer_name,
                litersPurchased: sale.liters_purchased || 0,
                rpl: sale.rpl || 0,
                amQuantity: sale.am_quantity || 0,
                pmQuantity: sale.pm_quantity || 0,
                totalAmount: sale.total_amount || 0,
                paidAmount: sale.paid_amount || 0,
                balance: sale.balance || 0
};
if ((sale.table_type || '').toUpperCase() === 'AM') {
    formattedSale.amQuantity = sale.am_quantity || 0;
    formattedSale.pmQuantity = 0;
    grouped[dateKey].amSales.push(formattedSale);
} else if ((sale.table_type || '').toUpperCase() === 'PM') {
    formattedSale.amQuantity = 0;
    formattedSale.pmQuantity = sale.pm_quantity || 0;
    grouped[dateKey].pmSales.push(formattedSale);
}
            });

            return grouped;
        }
    } catch (error) {
        console.warn("⚠️ API failed:", error);
    }

    const stored = localStorage.getItem('salesDairyFlowData');
    return stored ? JSON.parse(stored) : {};
}


    // Default data
    // const today = getTodayDate();
    // return {
    //     [today]: {
    //         date: today,
    //         amSales: [
    //             { id: 1, date: today, name: 'raju', litersPurchased: 3.00, rpl: 20.00, amQuantity: 20.00, pmQuantity: 0.00, amountDue: 400.00 },
    //             { id: 2, date: today, name: 'somya', litersPurchased: 4.00, rpl: 45.00, amQuantity: 20.00, pmQuantity: 0.00, amountDue: 900.00 }
    //         ],
    //         pmSales: [
    //             { id: 1, date: today, name: 'Amit Patel', litersPurchased: 60.00, rpl: 46.00, amQuantity: 30.00, pmQuantity: 30.00, amountDue: 2760.00 },
    //             { id: 2, date: today, name: 'raju', litersPurchased: 3.00, rpl: 20.00, amQuantity: 20.00, pmQuantity: 0.00, amountDue: 400.00 },
    //             { id: 3, date: today, name: 'somya', litersPurchased: 4.00, rpl: 45.00, amQuantity: 20.00, pmQuantity: 0.00, amountDue: 900.00 }
    //         ]
    //     }
    // };


function saveDataToStorage() {
    localStorage.setItem('salesDairyFlowData', JSON.stringify(dataHistory));
}

// Initialize the app
async function initializeApp() {
    document.getElementById('currentDateValue').textContent = 'All Records';

    const currentYear = new Date().getFullYear();
    const searchYearInput = document.getElementById('searchYear');
    searchYearInput.min = currentYear - 5;
    searchYearInput.max = currentYear;
}
document.getElementById('resetBtn').addEventListener('click', async () => {
    currentDate = 'ALL';
    dataHistory = await loadDataFromStorage();
    document.getElementById('currentDateValue').textContent = 'All Records';
    renderTables();
    updateSummaryCards();
});
// Setup event listeners
function setupEventListeners() {
    // Edit Mode Button
    document.getElementById('editModeBtn').addEventListener('click', toggleEditMode);
    
    // Add Customer Button
    document.getElementById('addCustomerBtn').addEventListener('click', openAddCustomerModal);
    
    // Export Buttons
    document.getElementById('excelBtn').addEventListener('click', exportToExcel);
    document.getElementById('pdfBtn').addEventListener('click', exportToPDF);
    document.getElementById('printBtn').addEventListener('click', handlePrint);
    
    // Search Modal
    document.getElementById('searchDataBtn').addEventListener('click', openSearchModal);
    document.getElementById('cancelSearchBtn').addEventListener('click', closeSearchModal);
    document.getElementById('confirmSearchBtn').addEventListener('click', handleSearch);
    
    // Add Customer Modal
    document.getElementById('cancelAddCustomerBtn').addEventListener('click', closeAddCustomerModal);
    document.getElementById('confirmAddCustomerBtn').addEventListener('click', handleAddCustomer);
    
    // Close modals on overlay click
    document.getElementById('searchModal').addEventListener('click', function(e) {
        if (e.target === this) closeSearchModal();
    });
    document.getElementById('addCustomerModal').addEventListener('click', function(e) {
        if (e.target === this) closeAddCustomerModal();
    });
}

// Toggle Edit Mode
function toggleEditMode() {
    isEditMode = !isEditMode;
    const editBtn = document.getElementById('editModeBtn');
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    
    if (isEditMode) {
        editBtn.classList.add('active');
        addCustomerBtn.style.display = 'flex';
    } else {
        editBtn.classList.remove('active');
        addCustomerBtn.style.display = 'none';
    }
    
    renderTables();
}

// Get current sales data
function getCurrentData() {
    if (!dataHistory) dataHistory = {};

    // ✅ If no search active, merge ALL dates into one view
    if (currentDate === 'ALL') {
        const merged = { date: 'ALL', amSales: [], pmSales: [] };
        Object.values(dataHistory).forEach(dayData => {
            merged.amSales.push(...(dayData.amSales || []));
            merged.pmSales.push(...(dayData.pmSales || []));
        });
        return merged;
    }

    if (!dataHistory[currentDate]) {
        dataHistory[currentDate] = { date: currentDate, amSales: [], pmSales: [] };
    }
    return dataHistory[currentDate];
}

// Format date for display (DD/MM/YYYY)
function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Calculate amount due
function calculateAmountDue(quantity, rpl) {
    return (parseFloat(quantity) || 0) * (parseFloat(rpl) || 0);
}

// Update summary cards
function updateSummaryCards() {
    const data = getCurrentData();
    const allSales = [...data.amSales, ...data.pmSales];
    
    // Count unique customers
    const uniqueCustomers = new Set();
    allSales.forEach(sale => uniqueCustomers.add((sale.name || '').toLowerCase()));
    
    let totalAmountDue = 0;
    let totalAMSales = 0;
    let totalPMSales = 0;
    
data.amSales.forEach(sale => {
    const amount = calculateAmountDue(sale.litersPurchased || 0, sale.rpl || 0);
    totalAmountDue += amount;
    totalAMSales += amount;
});

    
data.pmSales.forEach(sale => {
    const amount = calculateAmountDue(sale.litersPurchased || 0, sale.rpl || 0);
    totalAmountDue += amount;
    totalPMSales += amount;
});

    
    document.getElementById('totalCustomers').textContent = uniqueCustomers.size;
    document.getElementById('totalAmountDue').textContent = '₹' + totalAmountDue.toFixed(2);
    document.getElementById('totalAMSales').textContent = '₹' + totalAMSales.toFixed(2);
    document.getElementById('totalPMSales').textContent = '₹' + totalPMSales.toFixed(2);
}

// Render tables
function renderTables() {
    renderAMTable();
    renderPMTable();
    updateSummaryCards();
}

// Render AM Sales Table
function renderAMTable() {
    const tbody = document.getElementById('amSalesBody');
    const data = getCurrentData();
    
    tbody.innerHTML = '';
    
    data.amSales.forEach((sale, index) => {
        const row = document.createElement('tr');
        const amountDue = calculateAmountDue(sale.amQuantity, sale.rpl);
        const displayDate = formatDateForDisplay(sale.date || currentDate);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${renderDateCell(sale, 'date', displayDate, 'AM')}</td>
            <td>${renderCell(sale, 'name', sale.name, 'AM', 'text')}</td>
            <td>${renderCell(sale, 'litersPurchased', sale.litersPurchased.toFixed(2), 'AM')}</td>
            <td>${renderCell(sale, 'rpl', sale.rpl.toFixed(2), 'AM')}</td>
            <td>${renderCell(sale, 'amQuantity', sale.amQuantity.toFixed(2), 'AM')}</td>
            <td>${renderCell(sale, 'pmQuantity', sale.pmQuantity.toFixed(2), 'AM')}</td>
            <td class="amount-due">${amountDue.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-pay" onclick="handlePay('AM', ${sale.id})">Pay</button>
                    ${isEditMode ? `<button class="btn btn-delete" onclick="handleDelete('AM', ${sale.id})">Delete</button>` : ''}
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // Add event listeners for editable inputs
        if (isEditMode) {
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
                const field = input.dataset.field;
                input.addEventListener('change', function() {
                    updateSale('AM', sale.id, field, this.value);
                });
            });
        }
    });
}

// Render PM Sales Table
function renderPMTable() {
    const tbody = document.getElementById('pmSalesBody');
    const data = getCurrentData();
    
    tbody.innerHTML = '';
    
    data.pmSales.forEach((sale, index) => {
        const row = document.createElement('tr');
        const amountDue = calculateAmountDue(sale.pmQuantity, sale.rpl);
        const displayDate = formatDateForDisplay(sale.date || currentDate);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${renderDateCell(sale, 'date', displayDate, 'PM')}</td>
            <td>${renderCell(sale, 'name', sale.name, 'PM', 'text')}</td>
            <td>${renderCell(sale, 'litersPurchased', sale.litersPurchased.toFixed(2), 'PM')}</td>
            <td>${renderCell(sale, 'rpl', sale.rpl.toFixed(2), 'PM')}</td>
            <td>${renderCell(sale, 'amQuantity', sale.amQuantity.toFixed(2), 'PM')}</td>
            <td>${renderCell(sale, 'pmQuantity', sale.pmQuantity.toFixed(2), 'PM')}</td>
            <td class="amount-due">${amountDue.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-pay" onclick="handlePay('PM', ${sale.id})">Pay</button>
                    ${isEditMode ? `<button class="btn btn-delete" onclick="handleDelete('PM', ${sale.id})">Delete</button>` : ''}
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // Add event listeners for editable inputs
        if (isEditMode) {
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
                const field = input.dataset.field;
                input.addEventListener('change', function() {
                    updateSale('PM', sale.id, field, this.value);
                });
            });
        }
    });
}

// Render date cell
function renderDateCell(sale, field, displayValue, type) {
    if (isEditMode) {
        const dateValue = sale.date || currentDate;
        return `<input type="date" value="${dateValue}" data-field="${field}" class="editable-input" style="text-align: center;">`;
    }
    return displayValue;
}

// Render cell
function renderCell(sale, field, value, type, inputType = 'number') {
    if (isEditMode) {
        const step = inputType === 'number' ? '0.01' : '';
        const className = inputType === 'text' ? 'editable-input name-input' : 'editable-input';
        return `<input type="${inputType}" value="${value}" data-field="${field}" class="${className}" step="${step}">`;
    }
    return value;
}

// Update sale
function updateSale(type, id, field, value) {
    // Find which date this sale belongs to
    let salesArray = null;
    let saleDateKey = null;

    for (const dateKey of Object.keys(dataHistory)) {
        const arr = type === 'AM' ? dataHistory[dateKey].amSales : dataHistory[dateKey].pmSales;
        if (arr.find(s => s.id === id)) {
            salesArray = arr;
            saleDateKey = dateKey;
            break;
        }
    }

    if (!salesArray) return;

    const sale = salesArray.find(s => s.id === id);

    if (sale) {
        if (field === 'name') {
            sale[field] = value;
        } else {
            sale[field] = parseFloat(value) || 0;
        }

        saveDataToStorage();
        updateSaleInBackend(sale, type);  // 🔥 ADD THIS
        renderTables();
    }
}

// Handle Pay
function handlePay(type, id) {
    const data = getCurrentData();
    const salesArray = type === 'AM' ? data.amSales : data.pmSales;
    const sale = salesArray.find(s => s.id === id);
    
    if (sale) {
        alert(`Payment processed for ${sale.name}\nAmount: ₹${calculateAmountDue(sale.litersPurchased, sale.rpl).toFixed(2)}`);
    }
}

// Handle Delete
function handleDelete(type, id) {
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }
    
    const data = getCurrentData();
    const salesArray = type === 'AM' ? data.amSales : data.pmSales;
    const index = salesArray.findIndex(s => s.id === id);
    
    if (index > -1) {
        const deletedSale = salesArray[index];

        salesArray.splice(index, 1);
        
        saveDataToStorage();
        
        deleteSaleFromBackend(deletedSale.id);
        
        renderTables();
    }
}

// Open Add Customer Modal
function openAddCustomerModal() {
    document.getElementById('addCustomerModal').style.display = 'flex';
}

// Close Add Customer Modal
function closeAddCustomerModal() {
    document.getElementById('addCustomerModal').style.display = 'none';
    // Clear form
    document.getElementById('customerName').value = '';
    document.getElementById('litersPurchased').value = '';
    document.getElementById('ratePerLiter').value = '';
    document.getElementById('amQuantity').value = '';
    document.getElementById('pmQuantity').value = '';
    document.getElementById('saleType').value = 'AM';
    document.getElementById('saleDate').value = '';
}

// Handle Add Customer
function handleAddCustomer() {
    const name = document.getElementById('customerName').value.trim();
    const litersPurchased = parseFloat(document.getElementById('litersPurchased').value) || 0;
    const rpl = parseFloat(document.getElementById('ratePerLiter').value) || 0;
    const amQuantity = parseFloat(document.getElementById('amQuantity').value) || 0;
    const pmQuantity = parseFloat(document.getElementById('pmQuantity').value) || 0;
    const saleType = document.getElementById('saleType').value;
    
    if (!name) {
        alert('Please enter customer name');
        return;
    }
    
    const data = getCurrentData();
    const salesArray = saleType === 'AM' ? data.amSales : data.pmSales;
    
        const newSale = {
        id: salesArray.length > 0 ? Math.max(...salesArray.map(s => s.id)) + 1 : 1,
        date: document.getElementById('saleDate').value || getTodayDate(), 
        name: name,
        litersPurchased: litersPurchased,
        rpl: rpl,
        amQuantity: amQuantity,
        pmQuantity: pmQuantity,
        amountDue: saleType === 'AM' 
    ? amQuantity * rpl 
    : pmQuantity * rpl
    };
    
    salesArray.push(newSale);

    saveDataToStorage(); // localStorage
    
    saveSaleToBackend(newSale, saleType); // backend only once
    
    renderTables();
    closeAddCustomerModal();
}

// Export to Excel
function exportToExcel() {
    const data = getCurrentData();
    
    const amData = data.amSales.map((sale, index) => ({
        'SL NO.': index + 1,
        'DATE': formatDateForDisplay(sale.date || currentDate),
        'CUSTOMER NAME': sale.name,
        'LITERS PURCHASED': sale.litersPurchased,
        'RPL (₹)': sale.rpl,
        'AM QUANTITY (L)': sale.amQuantity,
        'PM QUANTITY (L)': sale.pmQuantity,
        'AMOUNT DUE (₹)': calculateAmountDue(sale.litersPurchased, sale.rpl).toFixed(2)
    }));
    
    const pmData = data.pmSales.map((sale, index) => ({
        'SL NO.': index + 1,
        'DATE': formatDateForDisplay(sale.date || currentDate),
        'CUSTOMER NAME': sale.name,
        'LITERS PURCHASED': sale.litersPurchased,
        'RPL (₹)': sale.rpl,
        'AM QUANTITY (L)': sale.amQuantity,
        'PM QUANTITY (L)': sale.pmQuantity,
        'AMOUNT DUE (₹)': calculateAmountDue(sale.litersPurchased, sale.rpl).toFixed(2)
    }));
    
    const workbook = XLSX.utils.book_new();
    const amSheet = XLSX.utils.json_to_sheet(amData);
    const pmSheet = XLSX.utils.json_to_sheet(pmData);
    
    XLSX.utils.book_append_sheet(workbook, amSheet, 'AM Sales');
    XLSX.utils.book_append_sheet(workbook, pmSheet, 'PM Sales');
    
    XLSX.writeFile(workbook, `Sales_Dairy_Flow_${currentDate}.xlsx`);
}

// Export to PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Add title
    doc.setFontSize(18);
    doc.text('SALES - Dairy Flow', 14, 15);
    doc.setFontSize(11);
    doc.text(`Date: ${formatDateForDisplay(currentDate)}`, 14, 22);
    
    const data = getCurrentData();
    
    // AM Sales Table
    doc.setFontSize(14);
    doc.text('AM (Morning) Sales', 14, 32);
    
    const amTableData = data.amSales.map((sale, index) => [
        index + 1,
        formatDateForDisplay(sale.date || currentDate),
        sale.name,
        sale.litersPurchased.toFixed(2),
        sale.rpl.toFixed(2),
        sale.amQuantity.toFixed(2),
        sale.pmQuantity.toFixed(2),
        calculateAmountDue(sale.litersPurchased, sale.rpl).toFixed(2)
    ]);
    
    doc.autoTable({
        head: [['SL NO.', 'DATE', 'CUSTOMER NAME', 'LITERS', 'RPL', 'AM QTY', 'PM QTY', 'AMOUNT DUE']],
        body: amTableData,
        startY: 38,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 9 }
    });
    
    // PM Sales Table
    const pmStartY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('PM (Evening) Sales', 14, pmStartY);
    
    const pmTableData = data.pmSales.map((sale, index) => [
        index + 1,
        formatDateForDisplay(sale.date || currentDate),
        sale.name,
        sale.litersPurchased.toFixed(2),
        sale.rpl.toFixed(2),
        sale.amQuantity.toFixed(2),
        sale.pmQuantity.toFixed(2),
        calculateAmountDue(sale.litersPurchased, sale.rpl).toFixed(2)
    ]);
    
    doc.autoTable({
        head: [['SL NO.', 'DATE', 'CUSTOMER NAME', 'LITERS', 'RPL (₹)', 'AM QTY', 'PM QTY', 'AMOUNT DUE']],
        body: pmTableData,
        startY: pmStartY + 6,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 9 }
    });
    
    doc.save(`Sales_Dairy_Flow_${currentDate}.pdf`);
}

// Print function
function handlePrint() {
    window.print();
}

// Open search modal
function openSearchModal() {
    document.getElementById('searchModal').style.display = 'flex';
}

// Close search modal
function closeSearchModal() {
    document.getElementById('searchModal').style.display = 'none';
    document.getElementById('searchDate').value = '';
    document.getElementById('searchMonth').value = '';
    document.getElementById('searchYear').value = '';
}

// Handle search
async function handleSearch() {
    const searchDate = document.getElementById('searchDate').value;
    const searchMonth = document.getElementById('searchMonth').value;
    const searchYear = document.getElementById('searchYear').value;

    if (!searchDate || !searchMonth || !searchYear) {
        alert('Please fill in all date fields');
        return;
    }

    const searchDateStr = `${searchYear}-${searchMonth.padStart(2, '0')}-${searchDate.padStart(2, '0')}`;
    currentDate = searchDateStr;

    dataHistory = await loadDataFromStorage();

    if (!dataHistory[searchDateStr]) {
        dataHistory[searchDateStr] = { date: searchDateStr, amSales: [], pmSales: [] };
    }

    document.getElementById('currentDateValue').textContent = formatDateForDisplay(currentDate);
    closeSearchModal();
    renderTables();
    updateSummaryCards();
}

