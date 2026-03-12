// Global Variables
let isEditMode = false;
let currentDate = getTodayDate();
let dataHistory = {};

function getTodayDate() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
}

// ── API ──────────────────────────────────────────────
async function fetchSummaries(date = null) {
    try {
        const url = date
            ? `http://localhost:5000/api/summaries?date=${date}`
            : 'http://localhost:5000/api/summaries';
        const res = await fetch(url);
        return await res.json();
    } catch (e) {
        console.error('Error fetching summaries:', e);
        return null;
    }
}

async function saveManualRow(row) {
    try {
        const res = await fetch('http://localhost:5000/api/summaries/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(row)
        });
        return await res.json();
    } catch (e) {
        console.error('Error saving manual row:', e);
        return null;
    }
}

async function updateManualRow(id, row) {
    try {
        await fetch(`http://localhost:5000/api/summaries/manual/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(row)
        });
    } catch (e) {
        console.error('Error updating manual row:', e);
    }
}

async function deleteManualRow(id) {
    try {
        await fetch(`http://localhost:5000/api/summaries/manual/${id}`, { method: 'DELETE' });
    } catch (e) {
        console.error('Error deleting manual row:', e);
    }
}

// ── Storage ──────────────────────────────────────────
function saveToLocalStorage() {
    localStorage.setItem('summaryDairyFlowData', JSON.stringify(dataHistory));
}

// ✅ FIXED: properly maps backend response into dataHistory keyed by date
async function loadDataFromStorage(date = null) {
    const apiData = await fetchSummaries(date);

    if (apiData && apiData.length > 0) {
        const result = {};
        apiData.forEach(summary => {
            // backend returns { date, rows: [...] }
            const d = String(summary.date).substring(0, 10);
            result[d] = {
                date: d,
                rows: (summary.rows || []).map(row => ({
                    id:          row.id,
                    date:        String(row.date).substring(0, 10),
                    description: row.description,
                    amount:      parseFloat(row.amount || 0),
                    readonly:    row.readonly === true
                }))
            };
        });
        saveToLocalStorage();
        return result;
    }

    // Fallback to localStorage if API fails
    const stored = localStorage.getItem('summaryDairyFlowData');
    return stored ? JSON.parse(stored) : {};
}

// ── Init ─────────────────────────────────────────────
async function initializeApp() {
    dataHistory = await loadDataFromStorage();

    // ✅ If today has no data, try to find the most recent date with data
    if (!dataHistory[currentDate]) {
        const dates = Object.keys(dataHistory).sort().reverse();
        if (dates.length > 0) {
            currentDate = dates[0]; // use most recent date that has data
        }
    }

    document.getElementById('currentDateValue').textContent = formatDateForDisplay(currentDate);

    const currentYear = new Date().getFullYear();
    const searchYearInput = document.getElementById('searchYear');
    if (searchYearInput) {
        searchYearInput.min = currentYear - 5;
        searchYearInput.max = currentYear;
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    await initializeApp();
    setupEventListeners();
    renderTable();
    updateGrandTotal();
});

// ── Current Data ─────────────────────────────────────
function getCurrentData() {
    if (!dataHistory[currentDate]) {
        dataHistory[currentDate] = { date: currentDate, rows: [] };
    }
    return dataHistory[currentDate];
}

function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

// ── Grand Total ───────────────────────────────────────
function updateGrandTotal() {
    const data = getCurrentData();
    const total = data.rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    document.getElementById('grandTotalValue').textContent = '₹' + total.toFixed(2);
}

// ── Render ────────────────────────────────────────────
function renderTable() {
    const tbody = document.getElementById('summaryTableBody');
    const data = getCurrentData();
    tbody.innerHTML = '';

    if (!data.rows || data.rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#888;">No data found for ${formatDateForDisplay(currentDate)}</td></tr>`;
        updateGrandTotal();
        return;
    }

    data.rows.forEach(row => {
        const tr = document.createElement('tr');
        const isReadOnly = row.readonly === true;
        const displayDate = formatDateForDisplay(row.date || currentDate);

        if (isReadOnly) {
            tr.innerHTML = `
                <td><span style="color:#555">${row.description}</span></td>
                <td>${displayDate}</td>
                <td class="text-right" style="color:${row.amount < 0 ? '#e53e3e' : '#2d6a2d'}">
                    ₹${Math.abs(row.amount).toFixed(2)}${row.amount < 0 ? ' (-)' : ''}
                </td>
                <td></td>`;
        } else {
            tr.innerHTML = `
                <td>${renderCell(row, 'description', row.description, 'text')}</td>
                <td>${renderDateCell(row, 'date', displayDate)}</td>
                <td class="text-right">${renderCell(row, 'amount', '₹' + row.amount.toFixed(2), 'amount')}</td>
                <td>${isEditMode ? `<button class="btn btn-delete" onclick="handleDelete(${row.id})">Delete</button>` : ''}</td>`;

            if (isEditMode) {
                tr.querySelectorAll('input').forEach(input => {
                    input.addEventListener('change', function () {
                        updateRow(row.id, input.dataset.field, this.value);
                    });
                });
            }
        }

        tbody.appendChild(tr);
    });

    updateGrandTotal();
}

function renderDateCell(row, field, displayValue) {
    if (isEditMode) {
        return `<input type="date" value="${row.date || currentDate}" data-field="${field}" class="editable-input">`;
    }
    return displayValue;
}

function renderCell(row, field, value, type) {
    if (isEditMode) {
        if (type === 'text') {
            return `<input type="text" value="${value}" data-field="${field}" class="editable-input description-input">`;
        } else if (type === 'amount') {
            const num = parseFloat(String(value).replace('₹', '')) || 0;
            return `<input type="number" value="${num}" data-field="${field}" class="editable-input amount-input" step="0.01">`;
        }
    }
    return value;
}

// ── Edit Mode ─────────────────────────────────────────
function setupEventListeners() {
    document.getElementById('editModeBtn').addEventListener('click', toggleEditMode);
    document.getElementById('addRowBtn').addEventListener('click', openAddRowModal);
    document.getElementById('excelBtn').addEventListener('click', exportToExcel);
    document.getElementById('pdfBtn').addEventListener('click', exportToPDF);
    document.getElementById('printBtn').addEventListener('click', handlePrint);
    document.getElementById('searchDataBtn').addEventListener('click', openSearchModal);
    document.getElementById('cancelSearchBtn').addEventListener('click', closeSearchModal);
    document.getElementById('confirmSearchBtn').addEventListener('click', handleSearch);
    document.getElementById('cancelAddRowBtn').addEventListener('click', closeAddRowModal);
    document.getElementById('confirmAddRowBtn').addEventListener('click', handleAddRow);

    document.getElementById('searchModal').addEventListener('click', function (e) { if (e.target === this) closeSearchModal(); });
    document.getElementById('addRowModal').addEventListener('click', function (e) { if (e.target === this) closeAddRowModal(); });
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    document.getElementById('editModeBtn').classList.toggle('active', isEditMode);
    document.getElementById('addRowBtn').style.display = isEditMode ? 'flex' : 'none';
    renderTable();
}

// ── CRUD (manual rows only) ───────────────────────────
async function updateRow(id, field, value) {
    const data = getCurrentData();
    const row = data.rows.find(r => r.id === id && !r.readonly);
    if (!row) return;

    if (field === 'description') row.description = value;
    else if (field === 'amount') row.amount = parseFloat(value) || 0;
    else if (field === 'date') row.date = value;

    await updateManualRow(id, { description: row.description, amount: row.amount, date: row.date });
    saveToLocalStorage();
    renderTable();
}

async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this row?')) return;

    const data = getCurrentData();
    const index = data.rows.findIndex(r => r.id === id && !r.readonly);
    if (index === -1) return;

    data.rows.splice(index, 1);
    await deleteManualRow(id);
    saveToLocalStorage();
    renderTable();
}

function openAddRowModal() { document.getElementById('addRowModal').style.display = 'flex'; }
function closeAddRowModal() {
    document.getElementById('addRowModal').style.display = 'none';
    document.getElementById('rowDescription').value = '';
    document.getElementById('rowAmount').value = '';
}

async function handleAddRow() {
    const description = document.getElementById('rowDescription').value.trim();
    const amount = parseFloat(document.getElementById('rowAmount').value) || 0;
    if (!description) { alert('Please enter a description'); return; }

    const saved = await saveManualRow({ date: currentDate, description, amount });
    if (!saved || !saved.id) { alert('Failed to save. Please try again.'); return; }

    const data = getCurrentData();
    data.rows.push({ id: saved.id, date: currentDate, description, amount, readonly: false });

    saveToLocalStorage();
    renderTable();
    closeAddRowModal();
}

// ── Search ────────────────────────────────────────────
function openSearchModal() { document.getElementById('searchModal').style.display = 'flex'; }
function closeSearchModal() {
    document.getElementById('searchModal').style.display = 'none';
    document.getElementById('searchDate').value = '';
    document.getElementById('searchMonth').value = '';
    document.getElementById('searchYear').value = '';
}

async function handleSearch() {
    const d = document.getElementById('searchDate').value;
    const m = document.getElementById('searchMonth').value;
    const y = document.getElementById('searchYear').value;

    if (!d || !m || !y) { alert('Please fill in all date fields'); return; }

    const yearNum = parseInt(y);
    const currentYear = new Date().getFullYear();
    if (yearNum < currentYear - 5 || yearNum > currentYear) {
        alert('You can only search data from the last 5 years'); return;
    }

    currentDate = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    document.getElementById('currentDateValue').textContent = formatDateForDisplay(currentDate);

    // ✅ Fetch fresh from API filtered by searched date
    dataHistory = await loadDataFromStorage(currentDate);

    if (!dataHistory[currentDate]) {
        dataHistory[currentDate] = { date: currentDate, rows: [] };
    }

    closeSearchModal();
    renderTable();
}

// ── Export ────────────────────────────────────────────
function exportToExcel() {
    const data = getCurrentData();
    const excelData = data.rows.map(row => ({
        'Description': row.description,
        'Date': formatDateForDisplay(row.date || currentDate),
        'Amount (₹)': row.amount.toFixed(2)
    }));
    const total = data.rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    excelData.push({ 'Description': 'Grand Total', 'Date': '', 'Amount (₹)': total.toFixed(2) });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
    XLSX.writeFile(wb, `Summary_Dairy_Flow_${currentDate}.xlsx`);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(37, 99, 235);
    doc.text('SUMMARY - Dairy Flow', 14, 20);
    doc.setFontSize(11); doc.setTextColor(0, 0, 0);
    doc.text(`Date: ${formatDateForDisplay(currentDate)}`, 14, 28);

    const data = getCurrentData();
    const tableData = data.rows.map(row => [
        row.description,
        formatDateForDisplay(row.date || currentDate),
        '₹' + row.amount.toFixed(2)
    ]);
    const total = data.rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

    doc.autoTable({
        head: [['Total Summary', 'Date', 'Total INR']],
        body: tableData, startY: 35, theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: [255,255,255], fontStyle: 'bold', fontSize: 11 },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 50 }, 2: { cellWidth: 50, halign: 'right' } }
    });

    const finalY = doc.lastAutoTable.finalY;
    doc.setFillColor(37, 99, 235);
    doc.rect(14, finalY, doc.internal.pageSize.width - 28, 10, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(12); doc.setFont(undefined, 'bold');
    doc.text('Grand Total', 16, finalY + 7);
    doc.text('₹' + total.toFixed(2), doc.internal.pageSize.width - 16, finalY + 7, { align: 'right' });
    doc.save(`Summary_Dairy_Flow_${currentDate}.pdf`);
}

function handlePrint() { window.print(); }