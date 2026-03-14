// ✅ COMPLETE PRODUCTION TRACKING WITH PEAK ALERTS - ALL ERRORS FIXED
// Global Variables
let isEditMode = false;
let currentDate = getTodayDate();
let dataHistory = {};
let isViewingAll = false;

function getPeakProduction(buffaloId) {
    let peak = 0;
    Object.values(dataHistory).forEach(dayData => {
        dayData.buffaloes?.forEach(buffalo => {
            if (buffalo.id === buffaloId) {
                const total = calculateTotal(buffalo.am, buffalo.pm);
                peak = Math.max(peak, total);
            }
        });
    });
    return peak;
}

function isProductionDecreased(buffaloId, currentTotal) {
    const peak = getPeakProduction(buffaloId);
    return currentTotal < peak * 0.9;
}

document.addEventListener('DOMContentLoaded', async function() {
    dataHistory = await loadDataFromAPI();
    initializeApp();
    setupEventListeners();
    renderTable();
    updateSummaryCards();
});
function toggleViewAll() {
    isViewingAll = !isViewingAll;
    const btn = document.getElementById('viewAllBtn');
    if (isViewingAll) {
        btn.textContent = '📅 View by Date';
        document.getElementById('currentDateValue').textContent = 'All Dates';
        renderAllTable();
    } else {
        btn.textContent = '📋 View All';
        document.getElementById('currentDateValue').textContent = formatDateForDisplay(currentDate);
        renderTable();
    }
    updateSummaryCards();
}

function renderAllTable() {
    const tbody = document.getElementById('productionTableBody');
    tbody.innerHTML = '';

    // Collect all buffaloes across all dates, sorted by date desc
    const allBuffaloes = [];
    Object.keys(dataHistory).sort().reverse().forEach(date => {
        (dataHistory[date].buffaloes || []).forEach(buffalo => {
            allBuffaloes.push({ ...buffalo, date });
        });
    });

    allBuffaloes.forEach((buffalo, index) => {
        const total = calculateTotal(buffalo.am, buffalo.pm);
        const row = document.createElement('tr');
row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formatDateForDisplay(buffalo.date)}</td>
            <td>${buffalo.name}</td>
            <td>${buffalo.am.toFixed(2)}</td>
            <td>${buffalo.pm.toFixed(2)}</td>
            <td>${total.toFixed(2)}</td>
            <td>${isEditMode ? `<button class="btn-delete" onclick="deleteBuffalo(${buffalo.id})">Delete</button>` : ''}</td>
        `;
        tbody.appendChild(row);
    });

    // Update summary for all data
    let totalAM = 0, totalPM = 0;
    allBuffaloes.forEach(b => {
        totalAM += parseFloat(b.am) || 0;
        totalPM += parseFloat(b.pm) || 0;
    });
    document.getElementById('totalAMProduction').textContent = totalAM.toFixed(2) + ' Liters';
    document.getElementById('totalPMProduction').textContent = totalPM.toFixed(2) + ' Liters';
    document.getElementById('grandTotal').textContent = (totalAM + totalPM).toFixed(2) + ' Liters';
    document.getElementById('buffaloCount').textContent = allBuffaloes.length + ' buffaloes';
    document.getElementById('footerTotalAM').textContent = totalAM.toFixed(2);
    document.getElementById('footerTotalPM').textContent = totalPM.toFixed(2);
    document.getElementById('footerGrandTotal').textContent = (totalAM + totalPM).toFixed(2);
}
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function fetchProduction() {
    const response = await fetch('/api/production');
    if (!response.ok) throw new Error("Failed to fetch production data");
    return await response.json();
}

async function saveProduction(data) {
    const response = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to save production data");
    return await response.json();
}

// ✅ THE KEY FIX IS HERE - loadDataFromAPI now sets currentDate to most recent date with data
async function loadDataFromAPI() {
    try {
        const apiData = await fetchProduction();

        if (apiData && apiData.length > 0) {
            const formattedData = {};

            apiData.forEach(row => {
                // Strip timestamp, keep only YYYY-MM-DD
                const dateKey = new Date(row.date).toISOString().split('T')[0];

                if (!formattedData[dateKey]) {
                    formattedData[dateKey] = { date: dateKey, buffaloes: [] };
                }
                formattedData[dateKey].buffaloes.push({
                    id: row.id,
                    date: dateKey,
                    name: row.buffalo_name,
                    am: parseFloat(row.am_liters) || 0,
                    pm: parseFloat(row.pm_liters) || 0
                });
            });

            // ✅ CRITICAL FIX: Set currentDate to most recent date that has records
            const availableDates = Object.keys(formattedData).sort();
            const today = getTodayDate();

            if (formattedData[today]) {
                currentDate = today; // today has data
            } else {
                currentDate = availableDates[availableDates.length - 1]; // use most recent
            }

            localStorage.setItem('productionData', JSON.stringify(formattedData));
            return formattedData;
        }

        throw new Error("No API data");

    } catch (error) {
        console.warn("⚠️ Loading from localStorage due to API failure");
        const stored = localStorage.getItem('productionData');
        if (stored) return JSON.parse(stored);

        const today = getTodayDate();
        return { [today]: { date: today, buffaloes: [] } };
    }
}

async function saveDataToAPI() {
    try {
        const currentData = dataHistory[currentDate];
        if (!currentData || !currentData.buffaloes) return;

        for (const b of currentData.buffaloes) {
            if (b.id && typeof b.id === 'number' && b.id > 0 && !b.isNew) {
                // UPDATE existing record
                await fetch(`/api/production/${b.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        buffalo_name: b.name,
                        am: b.am,
                        pm: b.pm,
                        date: b.date || currentDate
                    })
                });
            } else {
                // INSERT new record
                await fetch('/api/production', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: currentDate,
                        buffaloes: [{
                            buffalo_name: b.name,
                            am_liters: b.am,
                            pm_liters: b.pm
                        }]
                    })
                });
                b.isNew = false;
            }
        }

        localStorage.setItem('productionData', JSON.stringify(dataHistory));
        console.log("✅ Data saved to database and localStorage");

    } catch (error) {
        console.error("Error saving to database:", error);
        alert("❌ Failed to save data. Please check your server connection.");
    }
}

function initializeApp() {
    // ✅ This now uses the updated currentDate from loadDataFromAPI
    document.getElementById('currentDateValue').textContent = formatDateForDisplay(currentDate);
    const currentYear = new Date().getFullYear();
    const searchYearInput = document.getElementById('searchYear');
    searchYearInput.min = currentYear - 5;
    searchYearInput.max = currentYear;
}

function setupEventListeners() {
    document.getElementById('editModeBtn').addEventListener('click', toggleEditMode);
    document.getElementById('addProductionBtn').addEventListener('click', addProduction);
    document.getElementById('addNewBuffaloBtn').addEventListener('click', clearInputs);
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
    const addBuffaloSection = document.getElementById('addBuffaloSection');

    if (isEditMode) {
        editBtn.classList.add('active');
        addBuffaloSection.style.display = 'grid';
    } else {
        editBtn.classList.remove('active');
        addBuffaloSection.style.display = 'none';
    }
    renderTable();
}

function getCurrentBuffaloes() {
    if (!dataHistory[currentDate]) {
        dataHistory[currentDate] = { date: currentDate, buffaloes: [] };
    }
    return dataHistory[currentDate].buffaloes;
}

function clearInputs() {
    document.getElementById('buffaloNameInput').value = '';
    document.getElementById('amLitersInput').value = '';
    document.getElementById('pmLitersInput').value = '';
}

async function addProduction() {
    const name = document.getElementById('buffaloNameInput').value.trim();
    const am = parseFloat(document.getElementById('amLitersInput').value) || 0;
    const pm = parseFloat(document.getElementById('pmLitersInput').value) || 0;

    if (!name) {
        alert('Please enter a buffalo name');
        return;
    }

    const allIds = Object.values(dataHistory)
        .flatMap(day => day.buffaloes || [])
        .map(b => b.id);

    const newId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;
    const buffaloes = getCurrentBuffaloes();

    const newBuffalo = {
        id: newId,
        date: currentDate,
        name: name,
        am: am,
        pm: pm,
        isNew: true
    };

    buffaloes.push(newBuffalo);
    await saveDataToAPI();
    clearInputs();
    renderTable();
    updateSummaryCards();
}

async function deleteBuffalo(id) {
    if (!confirm('Are you sure you want to delete this buffalo?')) return;

    try {
        await fetch(`/api/production/${id}`, { method: 'DELETE' });
    } catch (e) {
        console.warn('Could not delete from DB:', e);
    }

    const buffaloes = getCurrentBuffaloes();
    const index = buffaloes.findIndex(b => b.id === id);
    if (index > -1) {
        buffaloes.splice(index, 1);
        localStorage.setItem('productionData', JSON.stringify(dataHistory));
        renderTable();
        updateSummaryCards();
    }
}

async function updateBuffalo(id, field, value) {
    const buffaloes = getCurrentBuffaloes();
    const buffalo = buffaloes.find(b => b.id === id);
    if (!buffalo) return;

    if (field === 'name') {
        buffalo.name = value;
    } else if (field === 'am' || field === 'pm') {
        buffalo[field] = parseFloat(value) || 0;
    } else if (field === 'date') {
        const oldDate = buffalo.date;
        const newDate = value;
        if (oldDate !== newDate) {
            dataHistory[oldDate].buffaloes = dataHistory[oldDate].buffaloes.filter(b => b.id !== id);
            if (!dataHistory[newDate]) {
                dataHistory[newDate] = { date: newDate, buffaloes: [] };
            }
            buffalo.date = newDate;
            dataHistory[newDate].buffaloes.push(buffalo);
            currentDate = newDate;
            document.getElementById('currentDateValue').textContent = formatDateForDisplay(currentDate);
        }
    }

    await saveDataToAPI();
    renderTable();
    updateSummaryCards();
}

function calculateTotal(am, pm) {
    return (parseFloat(am) || 0) + (parseFloat(pm) || 0);
}

function renderTable() {
    if (isViewingAll) { renderAllTable(); return; }
    const tbody = document.getElementById('productionTableBody');
    const buffaloes = getCurrentBuffaloes();
    tbody.innerHTML = '';

    buffaloes.forEach((buffalo, index) => {
        const total = calculateTotal(buffalo.am, buffalo.pm);
        const displayDate = formatDateForDisplay(buffalo.date || currentDate);
        const isDecreased = isProductionDecreased(buffalo.id, total);
        const peak = getPeakProduction(buffalo.id);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${renderDateCell(buffalo, 'date', displayDate)}</td>
            <td>${renderCell(buffalo, 'name', buffalo.name, 'name')}</td>
            <td>${renderCell(buffalo, 'am', buffalo.am.toFixed(2))}</td>
            <td>${renderCell(buffalo, 'pm', buffalo.pm.toFixed(2))}</td>
            <td class="total-cell ${isDecreased ? 'production-alert' : ''}"
                style="${isDecreased ? 'background-color: #fee2e2; color: #dc2626; font-weight: bold;' : ''}"
                title="${isDecreased ? `⚠️ Decreased from peak ${peak.toFixed(2)}L` : ''}">
                ${total.toFixed(2)}${isDecreased ? ' ⚠️' : ''}
            </td>
            <td>
                ${isEditMode ? `<button class="btn-delete" onclick="deleteBuffalo(${buffalo.id})">Delete</button>` : ''}
            </td>
        `;
        tbody.appendChild(row);

        if (isEditMode) {
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
                const field = input.dataset.field;
                input.addEventListener('change', async function() {
                    await updateBuffalo(buffalo.id, field, this.value);
                });
            });
        }
    });

    updateSummaryCards();
}

function renderDateCell(buffalo, field, displayValue) {
    if (isEditMode) {
        const dateValue = buffalo.date || currentDate;
        return `<input type="date" value="${dateValue}" data-field="${field}" class="editable-input" style="text-align: center;">`;
    }
    return displayValue;
}

function renderCell(buffalo, field, value, type = 'number') {
    if (isEditMode) {
        const inputType = type === 'name' ? 'text' : 'number';
        const step = type === 'number' ? '0.01' : '';
        const className = type === 'name' ? 'editable-input name-input' : 'editable-input';
        return `<input type="${inputType}" value="${value}" data-field="${field}" class="${className}" step="${step}">`;
    }
    return value;
}

// ✅ Replace your formatDateForDisplay function with this:
function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    // Handle full timestamp like "Mon, 09 Mar 2026 00:00:00 GMT"
    const date = new Date(dateStr);
    if (!isNaN(date)) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    // Fallback for YYYY-MM-DD
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function updateSummaryCards() {
    const buffaloes = getCurrentBuffaloes();
    let totalAM = 0;
    let totalPM = 0;

    buffaloes.forEach(buffalo => {
        totalAM += parseFloat(buffalo.am) || 0;
        totalPM += parseFloat(buffalo.pm) || 0;
    });

    const grandTotal = totalAM + totalPM;

    document.getElementById('totalAMProduction').textContent = totalAM.toFixed(2) + ' Liters';
    document.getElementById('totalPMProduction').textContent = totalPM.toFixed(2) + ' Liters';
    document.getElementById('grandTotal').textContent = grandTotal.toFixed(2) + ' Liters';
    document.getElementById('buffaloCount').textContent = buffaloes.length + ' buffaloes';
    document.getElementById('footerTotalAM').textContent = totalAM.toFixed(2);
    document.getElementById('footerTotalPM').textContent = totalPM.toFixed(2);
    document.getElementById('footerGrandTotal').textContent = grandTotal.toFixed(2);
}

function exportToExcel() {
    const buffaloes = getCurrentBuffaloes();
    const data = buffaloes.map((buffalo, index) => ({
        'Sl No.': index + 1,
        'Date': formatDateForDisplay(buffalo.date || currentDate),
        'Buffalo': buffalo.name,
        'AM (Liters)': buffalo.am,
        'PM (Liters)': buffalo.pm,
        'Total (Liters)': calculateTotal(buffalo.am, buffalo.pm).toFixed(2),
        'Peak (Liters)': getPeakProduction(buffalo.id).toFixed(2),
        'Status': isProductionDecreased(buffalo.id, calculateTotal(buffalo.am, buffalo.pm)) ? '⚠️ DECREASED' : '✅ NORMAL'
    }));

    let totalAM = 0;
    let totalPM = 0;
    buffaloes.forEach(b => {
        totalAM += parseFloat(b.am) || 0;
        totalPM += parseFloat(b.pm) || 0;
    });

    data.push({
        'Sl No.': '', 'Date': '', 'Buffalo': 'TOTAL:',
        'AM (Liters)': totalAM.toFixed(2),
        'PM (Liters)': totalPM.toFixed(2),
        'Total (Liters)': (totalAM + totalPM).toFixed(2),
        'Peak (Liters)': '', 'Status': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Production Records');
    XLSX.writeFile(workbook, `Production_Dairy_${currentDate}.xlsx`);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Production - Dairy Management', 14, 15);
    doc.setFontSize(11);
    doc.text(`Date: ${formatDateForDisplay(currentDate)}`, 14, 22);

    const buffaloes = getCurrentBuffaloes();
    let totalAM = 0;
    let totalPM = 0;

    const tableData = buffaloes.map((buffalo, index) => {
        totalAM += parseFloat(buffalo.am) || 0;
        totalPM += parseFloat(buffalo.pm) || 0;
        const total = calculateTotal(buffalo.am, buffalo.pm);
        return [
            index + 1,
            formatDateForDisplay(buffalo.date || currentDate),
            buffalo.name,
            buffalo.am.toFixed(2),
            buffalo.pm.toFixed(2),
            total.toFixed(2),
            isProductionDecreased(buffalo.id, total) ? '⚠️ DECREASED' : '✅ NORMAL'
        ];
    });

    tableData.push(['', '', 'TOTAL:', totalAM.toFixed(2), totalPM.toFixed(2), (totalAM + totalPM).toFixed(2), '']);

    window.jspdf.jsPDF.API.autoTable.call(doc, {
        head: [['Sl No.', 'Date', 'Buffalo', 'AM (Liters)', 'PM (Liters)', 'Total (Liters)', 'Status']],
        body: tableData,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [65, 105, 225] },
        styles: { fontSize: 10 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total AM Production: ${totalAM.toFixed(2)} Liters`, 14, finalY);
    doc.text(`Total PM Production: ${totalPM.toFixed(2)} Liters`, 14, finalY + 7);
    doc.text(`Grand Total: ${(totalAM + totalPM).toFixed(2)} Liters`, 14, finalY + 14);

    doc.save(`Production_Dairy_${currentDate}.pdf`);
}

function handlePrint() {
    window.print();
}

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

    // Fetch from DB for the searched date
    try {
        const response = await fetch(`/api/production?date=${searchDateStr}`);
        const apiData = await response.json();

        if (apiData && apiData.length > 0) {
            dataHistory[searchDateStr] = {
                date: searchDateStr,
                buffaloes: apiData.map(row => ({
                    id: row.id,
                    date: String(row.date).substring(0, 10),
                    name: row.buffalo_name,
                    am: parseFloat(row.am_liters) || 0,
                    pm: parseFloat(row.pm_liters) || 0
                }))
            };
        } else {
            // Date exists but no records — show empty
            dataHistory[searchDateStr] = { date: searchDateStr, buffaloes: [] };
        }
    } catch (e) {
        console.warn('Could not fetch searched date from API:', e);
        if (!dataHistory[searchDateStr]) {
            dataHistory[searchDateStr] = { date: searchDateStr, buffaloes: [] };
        }
    }

    currentDate = searchDateStr;
    document.getElementById('currentDateValue').textContent = formatDateForDisplay(currentDate);
    closeSearchModal();
    renderTable();
    updateSummaryCards();
}