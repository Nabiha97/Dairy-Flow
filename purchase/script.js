// Global Variables
let isEditMode = false;
let currentDate = getTodayDate();
let dataHistory = {};
let viewingAllDates = true; // ✅ Show all dates by default

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        dataHistory = await loadDataFromAPI();

        if (!dataHistory[currentDate]) {
            dataHistory[currentDate] = { date: currentDate, purchases: [] };
        }

        initializeApp();
        setupEventListeners();
        renderAllDates(); // ✅ Show ALL dates on load

        console.log("✅ App initialized successfully with data from API");

    } catch (err) {
        console.error("❌ Failed to initialize app:", err);
        dataHistory = { [currentDate]: { date: currentDate, purchases: [] } };
        initializeApp();
        setupEventListeners();
        renderAllDates();
    }
});

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ===================== API FUNCTIONS =====================

async function fetchPurchases() {
    try {
        const response = await fetch('/api/purchases');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching purchases:', error);
        return null;
    }
}

async function loadDataFromAPI() {
    try {
        const apiData = await fetchPurchases();
        const formattedData = {};

        if (apiData && apiData.length > 0) {
            apiData.forEach(p => {
                const date = p.date ? String(p.date).split('T')[0] : getTodayDate();
                if (!formattedData[date]) formattedData[date] = { date, purchases: [] };
                formattedData[date].purchases.push({
                    id: p.id,
                    dbId: p.id, // ✅ mark as already saved in DB
                    date: date,
                    name: p.supplier_name || 'Enter name',
                    quantity: parseFloat(p.quantity) || 0,
                    perUnitPrice: parseFloat(p.price) || 0,
                    total: parseFloat(p.total_amount) || 0,
                    mtd: parseFloat(p.mtd_amount) || 0,
                    totalAmountPaid: parseFloat(p.paid_amount) || 0
                });
            });
            localStorage.setItem('purchaseData', JSON.stringify(formattedData));
            console.log("✅ Loaded from DB:", Object.keys(formattedData).length, "dates");
            return formattedData;
        }

        // DB empty — try localStorage
        console.log("📭 DB is empty, checking localStorage...");
        const stored = localStorage.getItem('purchaseData');
        if (stored) {
            console.log("💾 Loaded from localStorage");
            return JSON.parse(stored);
        }

        return {};

    } catch (err) {
        console.warn('⚠️ API failed, loading from localStorage');
        try {
            const stored = localStorage.getItem('purchaseData');
            if (stored) return JSON.parse(stored);
        } catch(e) {}
        return {};
    }
}

async function saveDataToStorage() {
    try {
        const currentData = dataHistory[currentDate];
        if (!currentData || !currentData.purchases) return;

        // 1️⃣ Always save to localStorage first
        localStorage.setItem('purchaseData', JSON.stringify(dataHistory));
        console.log("💾 Saved to localStorage");

        // 2️⃣ Filter only valid purchases (skip empty placeholders)
        const validPurchases = currentData.purchases.filter(
            p => p.name && p.name !== 'Enter name'
        );

        // 3️⃣ Save to DB
        if (validPurchases.length > 0) {
            await savePurchases(validPurchases);
        }

    } catch (err) {
        console.error("❌ Failed to save:", err);
    }
}

async function savePurchases(payload) {
    try {
        const purchases = payload.purchases || payload;
        const savedIds = [];

        for (let i = 0; i < purchases.length; i++) {
            const p = purchases[i];

            // Skip if already has a DB id
            // Skip if already saved to DB (has dbId flag)
if (p.dbId) {
    console.log(`Already in DB, skipping ID: ${p.dbId}`);
    continue;
}

            const purchaseData = {
                supplier_name: p.name || 'Unknown',
                quantity: parseFloat(p.quantity) || 0,
                price: parseFloat(p.perUnitPrice) || 0,
                total_amount: parseFloat(p.total) || 0,
                mtd_amount: parseFloat(p.mtd) || 0,
                paid_amount: parseFloat(p.totalAmountPaid) || 0,
                date: p.date || payload.date || getTodayDate()
            };

            console.log(`📤 Saving purchase ${i+1}:`, purchaseData);

            const res = await fetch('/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purchaseData)
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Purchase ${i+1} failed: ${res.status} - ${text}`);
            }

const result = await res.json();
p.id = result.id;
p.dbId = result.id; // ✅ mark as saved so it won't be re-saved
savedIds.push(result.id);
            console.log(`✅ Saved to DB with ID: ${result.id}`);
        }

        localStorage.setItem('purchaseData', JSON.stringify(dataHistory));
        console.log('Both DB and localStorage updated');
        return savedIds;

    } catch (error) {
        console.error('❌ Error saving:', error);
        localStorage.setItem('purchaseData', JSON.stringify(dataHistory));
        return [];
    }
}

// ===================== RENDER FUNCTIONS =====================

// ✅ Show ALL dates from DB + localStorage
function renderAllDates() {
    viewingAllDates = true;
    const tbody = document.getElementById('purchaseTableBody');
    tbody.innerHTML = '';

    // Sort dates newest first
    const allDates = Object.keys(dataHistory).sort((a, b) => b.localeCompare(a));

    if (allDates.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:#888;">No data found</td></tr>`;
        document.getElementById('currentDateValue').textContent = 'All Dates';
        return;
    }

    let siNo = 1;
    allDates.forEach(date => {
        const purchases = dataHistory[date]?.purchases || [];
        if (purchases.length === 0) return;

        // Date separator row
        const separatorRow = document.createElement('tr');
        separatorRow.innerHTML = `
            <td colspan="9" style="background:#e8f4f8; font-weight:bold; 
                text-align:center; padding:8px; color:#1a6b8a; font-size:14px;">
                 ${formatDateForDisplay(date)}
            </td>
        `;
        tbody.appendChild(separatorRow);

        purchases.forEach(purchase => {
            const row = document.createElement('tr');
            const isPlaceholder = purchase.name === 'Enter name' && purchase.quantity === 0;
            const mtdDisplay = purchase.mtd === 0 ? '₹' : '₹' + purchase.mtd;
            const totalAmountDisplay = purchase.totalAmountPaid === 0 ? '₹' : '₹' + purchase.totalAmountPaid;

            row.innerHTML = `
                <td>${siNo++}</td>
                <td>${formatDateForDisplay(purchase.date || date)}</td>
                <td class="${isPlaceholder ? 'text-placeholder' : ''}">${purchase.name}</td>
                <td>${purchase.quantity}</td>
                <td>${parseFloat(purchase.perUnitPrice).toFixed(2)}</td>
                <td>${purchase.total}</td>
                <td class="${purchase.mtd > 0 ? 'text-red' : ''}">${mtdDisplay}</td>
                <td class="${purchase.totalAmountPaid > 0 ? 'text-green' : ''}">${totalAmountDisplay}</td>
                <td>
                    ${isEditMode ? `<button class="btn-delete" onclick="handleDelete(${purchase.id})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    });

    document.getElementById('currentDateValue').textContent = 'All Dates';
}

// ✅ Show only a specific date (used by search)
function renderTable() {
    viewingAllDates = false;
    const tbody = document.getElementById('purchaseTableBody');
    const purchases = getCurrentPurchases();
    tbody.innerHTML = '';

    if (purchases.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:#888;">No data for this date</td></tr>`;
        return;
    }

    purchases.forEach((purchase, index) => {
        const row = document.createElement('tr');
        const isPlaceholder = purchase.name === 'Enter name' && purchase.quantity === 0;
        const mtdDisplay = purchase.mtd === 0 ? '₹' : '₹' + purchase.mtd;
        const totalAmountDisplay = purchase.totalAmountPaid === 0 ? '₹' : '₹' + purchase.totalAmountPaid;
        const displayDate = formatDateForDisplay(purchase.date || currentDate);

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${renderDateCell(purchase, 'date', displayDate)}</td>
            <td class="${isPlaceholder ? 'text-placeholder' : ''}">${renderCell(purchase, 'name', purchase.name, 'name')}</td>
            <td>${renderCell(purchase, 'quantity', purchase.quantity)}</td>
            <td>${renderCell(purchase, 'perUnitPrice', parseFloat(purchase.perUnitPrice).toFixed(2))}</td>
            <td>${purchase.total}</td>
            <td class="${purchase.mtd > 0 ? 'text-red' : ''}">${renderCellStatic(mtdDisplay)}</td>
            <td class="${purchase.totalAmountPaid > 0 ? 'text-green' : ''}">${renderCellStatic(totalAmountDisplay)}</td>
            <td>
                ${isEditMode ? `<button class="btn-delete" onclick="handleDelete(${purchase.id})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>` : ''}
            </td>
        `;

        tbody.appendChild(row);

        if (isEditMode) {
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
                const field = input.dataset.field;
                input.addEventListener('change', async function() {
                    await updatePurchase(purchase.id, field, this.value);
                });
            });
        }
    });
}

// ===================== CRUD FUNCTIONS =====================

function getCurrentPurchases() {
    if (!dataHistory[currentDate]) {
        dataHistory[currentDate] = { date: currentDate, purchases: [] };
    }
    return dataHistory[currentDate].purchases;
}

async function addRow() {
    const purchases = getCurrentPurchases();
    const newId = purchases.length > 0 ? Math.max(...purchases.map(p => p.id)) + 1 : 1;

    const newPurchase = {
        id: newId,
        date: currentDate,
        name: 'Enter name',
        quantity: 0,
        perUnitPrice: 0,
        total: 0,
        mtd: 0,
        totalAmountPaid: 0
        // ✅ No dbId — not saved to DB yet
    };

    purchases.push(newPurchase);
    localStorage.setItem('purchaseData', JSON.stringify(dataHistory)); // localStorage only
    currentDate = getTodayDate(); // ensure adding to today
    document.getElementById('currentDateValue').textContent = formatDateForDisplay(currentDate);
    renderTable(); // show single date view when adding
}

async function deleteRow(id) {
    if (!confirm('Are you sure you want to delete this row?')) return;

    const purchases = getCurrentPurchases();
    const purchase = purchases.find(p => p.id === id);

    // If saved in DB, delete from DB too
    if (purchase && purchase.dbId) {
        try {
            await fetch(`/api/purchases/${purchase.dbId}`, {
                method: 'DELETE'
            });
            console.log(`🗑️ Deleted from DB: ${purchase.dbId}`);
        } catch(e) {
            console.error('DB delete failed:', e);
        }
    }

    const index = purchases.findIndex(p => p.id === id);
    if (index > -1) {
        purchases.splice(index, 1);
        localStorage.setItem('purchaseData', JSON.stringify(dataHistory));
        viewingAllDates ? renderAllDates() : renderTable();
    }
}

async function handleDelete(id) {
    await deleteRow(id);
}

async function updatePurchase(id, field, value) {
    const purchases = getCurrentPurchases();
    const purchase = purchases.find(p => p.id === id);
    if (purchase) {
        purchase[field] = field === 'name' ? value : parseFloat(value) || 0;

        // Auto-calculate total = quantity × perUnitPrice
        if (field === 'quantity' || field === 'perUnitPrice') {
            purchase.total = purchase.quantity * purchase.perUnitPrice;
        }

        // Recalculate total amount paid
        purchase.totalAmountPaid = purchase.total - purchase.mtd;

        // ✅ Always save to localStorage immediately
        localStorage.setItem('purchaseData', JSON.stringify(dataHistory));

        // ✅ Only save to DB if ALL fields are filled
        const isComplete = purchase.name && 
                           purchase.name !== 'Enter name' && 
                           purchase.quantity > 0 && 
                           purchase.perUnitPrice > 0;

        if (isComplete) {
            // Remove old DB record first if it exists, then re-save with correct values
            if (purchase.dbId) {
                try {
                    await fetch(`/api/purchases/${purchase.dbId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            supplier_name: purchase.name,
                            quantity: purchase.quantity,
                            price: purchase.perUnitPrice,
                            total_amount: purchase.total,
                            mtd_amount: purchase.mtd,
                            paid_amount: purchase.totalAmountPaid,
                            date: purchase.date || currentDate
                        })
                    });
                    console.log(`✅ Updated in DB: ${purchase.dbId}`);
                } catch(e) {
                    console.error('DB update failed:', e);
                }
            } else {
                await saveDataToStorage();
            }
        }

        renderTable();
    }
}
// ===================== UI FUNCTIONS =====================

function initializeApp() {
    document.getElementById('currentDateValue').textContent = 'All Dates';
    const currentYear = new Date().getFullYear();
    const searchYearInput = document.getElementById('searchYear');
    searchYearInput.min = currentYear - 5;
    searchYearInput.max = currentYear;
}

function setupEventListeners() {
    document.getElementById('editModeBtn').addEventListener('click', toggleEditMode);
    document.getElementById('addRowBtn').addEventListener('click', async () => await addRow());
    document.getElementById('excelBtn').addEventListener('click', exportToExcel);
    document.getElementById('pdfBtn').addEventListener('click', exportToPDF);
    document.getElementById('printBtn').addEventListener('click', handlePrint);
    document.getElementById('searchDataBtn').addEventListener('click', openSearchModal);
    document.getElementById('cancelSearchBtn').addEventListener('click', closeSearchModal);
    document.getElementById('confirmSearchBtn').addEventListener('click', handleSearch);

    document.getElementById('searchModal').addEventListener('click', function(e) {
        if (e.target === this) closeSearchModal();
    });
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    const editBtn = document.getElementById('editModeBtn');
    const addRowBtn = document.getElementById('addRowBtn');

    if (isEditMode) {
        editBtn.classList.add('active');
        addRowBtn.style.display = 'flex';
        // Switch to today's date view for editing
        currentDate = getTodayDate();
        document.getElementById('currentDateValue').textContent = formatDateForDisplay(currentDate);
        renderTable();
    } else {
        editBtn.classList.remove('active');
        addRowBtn.style.display = 'none';
        renderAllDates(); // ✅ Back to all dates view
    }
}

function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function renderDateCell(purchase, field, displayValue) {
    if (isEditMode) {
        const dateValue = purchase.date || currentDate;
        return `<input type="date" value="${dateValue}" data-field="${field}" class="editable-input" style="text-align: center;">`;
    }
    return displayValue;
}

function renderCell(purchase, field, value, type = 'number') {
    if (isEditMode) {
        const inputType = type === 'name' ? 'text' : 'number';
        const step = field === 'perUnitPrice' ? '0.01' : '1';
        const className = type === 'name' ? 'editable-input name-input' : 'editable-input';
        return `<input type="${inputType}" value="${value}" data-field="${field}" class="${className}" step="${step}">`;
    }
    return value;
}

function renderCellStatic(value) {
    return value;
}

// ===================== EXPORT FUNCTIONS =====================

function exportToExcel() {
    const allDates = Object.keys(dataHistory).sort((a, b) => b.localeCompare(a));
    const data = [];
    let siNo = 1;

    allDates.forEach(date => {
        const purchases = dataHistory[date]?.purchases || [];
        purchases.forEach(purchase => {
            data.push({
                'S.No': siNo++,
                'Date': formatDateForDisplay(purchase.date || date),
                'Purchasing': purchase.name,
                'Quantity': purchase.quantity,
                'Per Unit Price': purchase.perUnitPrice,
                'Total': purchase.total,
                'MTD': purchase.mtd === 0 ? '' : purchase.mtd,
                'Total Amount Paid (₹)': purchase.totalAmountPaid === 0 ? '' : purchase.totalAmountPaid
            });
        });
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Table');
    XLSX.writeFile(workbook, `Purchase_Table_All_Dates.xlsx`);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(18);
    doc.text('Purchase Table - All Dates', 14, 15);

    const allDates = Object.keys(dataHistory).sort((a, b) => b.localeCompare(a));
    const tableData = [];
    let siNo = 1;

    allDates.forEach(date => {
        const purchases = dataHistory[date]?.purchases || [];
        purchases.forEach(purchase => {
            tableData.push([
                siNo++,
                formatDateForDisplay(purchase.date || date),
                purchase.name,
                purchase.quantity,
                parseFloat(purchase.perUnitPrice).toFixed(2),
                purchase.total,
                purchase.mtd === 0 ? '' : purchase.mtd,
                purchase.totalAmountPaid === 0 ? '' : purchase.totalAmountPaid
            ]);
        });
    });

    doc.autoTable({
        head: [['S.No', 'Date', 'Purchasing', 'Quantity', 'Per Unit Price', 'Total', 'MTD', 'Total Amount Paid (₹)']],
        body: tableData,
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [23, 162, 184] },
        styles: { fontSize: 9 }
    });

    doc.save(`Purchase_Table_All_Dates.pdf`);
}

function handlePrint() {
    window.print();
}

// ===================== SEARCH FUNCTIONS =====================

function openSearchModal() {
    document.getElementById('searchModal').style.display = 'flex';
}

function closeSearchModal() {
    document.getElementById('searchModal').style.display = 'none';
    document.getElementById('searchDate').value = '';
    document.getElementById('searchMonth').value = '';
    document.getElementById('searchYear').value = '';
}

async function handleSearch() {
    const searchDate = document.getElementById('searchDate').value;
    const searchMonth = document.getElementById('searchMonth').value;
    const searchYear = document.getElementById('searchYear').value;

    if (!searchDate || !searchMonth || !searchYear) {
        alert('Please fill in all date fields');
        return;
    }

    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(searchYear);

    if (yearNum < currentYear - 5 || yearNum > currentYear) {
        alert('You can only search data from the last 5 years');
        return;
    }

    const searchDateStr = `${searchYear}-${searchMonth.padStart(2, '0')}-${searchDate.padStart(2, '0')}`;
    currentDate = searchDateStr;

    if (!dataHistory[searchDateStr]) {
        dataHistory[searchDateStr] = { date: searchDateStr, purchases: [] };
    }

    document.getElementById('currentDateValue').textContent = formatDateForDisplay(currentDate);
    closeSearchModal();
    renderTable(); // Show only searched date

    // Add "Show All" button dynamically
    showAllDatesButton();
}

function showAllDatesButton() {
    // Remove existing button if any
    const existing = document.getElementById('showAllBtn');
    if (existing) existing.remove();

    const btn = document.createElement('button');
    btn.id = 'showAllBtn';
    btn.textContent = '📋 Show All Dates';
    btn.style.cssText = 'margin-left:10px; padding:8px 16px; background:#1a6b8a; color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;';
    btn.onclick = () => {
        btn.remove();
        renderAllDates();
    };

    document.getElementById('currentDateValue').after(btn);
}