// Initialize Lucide icons & load data - FIXED ✅
document.addEventListener('DOMContentLoaded', async function() {
    lucide.createIcons();
    expenses = await loadDataFromStorage();
    renderTable();         
    updateSummaryCards();  

document.getElementById('addExpenseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const date = document.getElementById('newDate').value;
    const expenseName = document.getElementById('newExpense').value;
    const total = parseFloat(document.getElementById('newTotal').value);
    const mtd = parseFloat(document.getElementById('newMTD').value);

    if (!date || !expenseName || isNaN(total) || isNaN(mtd)) {
        alert('Please fill all fields correctly');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: expenseName,
                total:       total,
                mtd:         mtd,
                grand_total: total + mtd,
                amount:      total,
                date:        date
            })
        });

        const result = await response.json();
        console.log('✅ Saved to DB:', result);

        if (!response.ok) {
            alert(`Failed to save: ${result.error}`);
            return;
        }

        const newExpense = {
            id:         result.id,
            date:       convertDateToDisplay(date),
            expenses:   expenseName,
            total:      total,
            mtd:        mtd,
            grandTotal: total + mtd
        };

        expenses.push(newExpense);
        localStorage.setItem('dairyExpensesData', JSON.stringify(expenses));
        closeAddModal();
        renderTable();
        updateSummaryCards();

    } catch (error) {
        console.error('❌ Error adding expense:', error);
        alert('Failed to save expense. Please try again.');
    }
});
});

// ✅ NO HARDCODED DATA - loads from backend/API

// State
let isEditMode = false;
let editingId = null;
let searchQuery = '';
let dateFilter = '';
let highlightedDate = '';

// ✅ API Functions - FIXED position
async function fetchExpenses() {
    try {
        const response = await fetch('http://localhost:5000/api/expenses');
        if (!response.ok) throw new Error('Failed to fetch');
        return await response.json();
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return null;
    }
}

async function saveExpenses(data) {
    try {
        const isEdit = data.id && data.id <= (await fetchExpenses().then(r => r?.length ?? 0));
        const method = 'PUT';  // saveExpenses is only called for edits now
        const url = `http://localhost:5000/api/expenses/${data.id}`;

        const payload = {
            description: data.expenses,
            total:       data.total,
            mtd:         data.mtd,
            grand_total: data.grandTotal,
            amount:      data.total,
            date:        convertDateToBackend(data.date)  // ✅ must be YYYY-MM-DD
        };

        console.log('📤 Sending to backend:', payload);  // ✅ debug

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('📥 Backend response:', result);  // ✅ debug

        if (!response.ok) {
            console.error('❌ Backend error:', result.error);
            alert(`Save failed: ${result.error}`);
        }
    } catch (error) {
        console.error('Error saving expenses:', error);
    }
}
function convertDateToBackend(displayDate) {
    // converts "15-01-2024" → "2024-01-15"
    if (!displayDate) return new Date().toISOString().split('T')[0];
    const [day, month, year] = displayDate.split('-');
    return `${year}-${month}-${day}`;
}
// ✅ Storage Functions - MISSING BEFORE
async function loadDataFromStorage() {
    const apiData = await fetchExpenses();
    if (apiData && apiData.length > 0) {
        return apiData.map(item => ({
            id: item.id,
            date: convertDateToDisplay(item.date),   // backend: "2024-01-15" → "15-01-2024"
            expenses: item.description,               // ✅ map field
            total: parseFloat(item.total || item.amount || 0),
            mtd: parseFloat(item.mtd || 0),
            grandTotal: parseFloat(item.grand_total || 0)
        }));
    }
    const stored = localStorage.getItem('dairyExpensesData');
    if (stored) return JSON.parse(stored);
    return [];
}

async function saveDataToStorage(changedExpense = null) {
    localStorage.setItem('dairyExpensesData', JSON.stringify(expenses));
    if (changedExpense) {
        await saveExpenses(changedExpense);  // ✅ only send the changed record
    }
}

// Modal Functions
function openAddModal() {
    document.getElementById('addModal').classList.add('active');
    document.getElementById('addExpenseForm').reset();
}

function closeAddModal() {
    document.getElementById('addModal').classList.remove('active');
}

// Calendar Functions
function toggleCalendar() {
    const dropdown = document.getElementById('calendarDropdown');
    dropdown.classList.toggle('active');
    lucide.createIcons();
}

// Date Functions
function convertDateToDisplay(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);           // handles both "2026-03-07" and "2026-03-07T00:00:00.000Z"
    const day   = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year  = d.getUTCFullYear();
    return `${day}-${month}-${year}`;      // → "07-03-2026"
}

function handleDateSearch() {
    const selectedDate = document.getElementById('searchDate').value;
    if (selectedDate) {
        const formattedDate = convertDateToDisplay(selectedDate);
        highlightedDate = formattedDate;
        dateFilter = selectedDate;
        toggleCalendar();
        document.getElementById('clearFilterBtn').style.display = 'flex';
        renderTable();
        
        setTimeout(() => {
            const matchingRow = document.querySelector(`[data-date="${formattedDate}"]`);
            if (matchingRow) {
                matchingRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
}

function clearFilter() {
    dateFilter = '';
    highlightedDate = '';
    document.getElementById('searchDate').value = '';
    document.getElementById('clearFilterBtn').style.display = 'none';
    renderTable();
}

// Filter Functions
function filterExpenses() {
    searchQuery = document.getElementById('searchInput').value;
    renderTable();
}

function getFilteredExpenses() {
    return expenses.filter(exp => {
        const matchesSearch = exp.expenses.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDate = !dateFilter || exp.date === convertDateToDisplay(dateFilter);
        return matchesSearch && matchesDate;
    });
}

// Edit Mode Functions - FIXED ✅
function toggleEditMode() {
    isEditMode = !isEditMode;  // ✅ Fixed variable name
    const btn = document.getElementById('editModeBtn');
    if (isEditMode) {
        btn.classList.add('active');
        btn.innerHTML = '<i data-lucide="edit-3"></i> Edit Mode';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i data-lucide="edit-3"></i> Edit Mode';
        if (editingId !== null) {
            cancelEdit();
        }
    }
    lucide.createIcons();
    renderTable();
}

function startEdit(id) {
    isEditMode = true;
    editingId = id;
    renderTable();
}

async function saveEdit(id) {
    const dateInput  = document.getElementById(`edit-date-${id}`).value;
    const expenseInput = document.getElementById(`edit-expense-${id}`).value;
    const totalInput = parseFloat(document.getElementById(`edit-total-${id}`).value) || 0;
    const mtdInput   = parseFloat(document.getElementById(`edit-mtd-${id}`).value) || 0;

    try {
        // ✅ PUT to real DB id
        const response = await fetch(`http://localhost:5000/api/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: expenseInput,
                total:       totalInput,
                mtd:         mtdInput,
                grand_total: totalInput + mtdInput,
                amount:      totalInput,
                date:        convertDateToBackend(dateInput)  // ✅ DD-MM-YYYY → YYYY-MM-DD
            })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(`Update failed: ${result.error}`);
            return;
        }

        // ✅ Update localStorage after successful DB update
        const expenseIndex = expenses.findIndex(exp => exp.id === id);
        if (expenseIndex !== -1) {
            expenses[expenseIndex] = {
                id:         id,
                date:       dateInput,
                expenses:   expenseInput,
                total:      totalInput,
                mtd:        mtdInput,
                grandTotal: totalInput + mtdInput
            };
            localStorage.setItem('dairyExpensesData', JSON.stringify(expenses));
        }

    } catch (error) {
        console.error('❌ Edit error:', error);
        alert('Failed to update. Please try again.');
    }

    editingId = null;
    isEditMode = false; 
    renderTable();
    updateSummaryCards();
}





function cancelEdit() {
    editingId = null;
    isEditMode = false;
    renderTable();
}

async function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        try {
            await fetch(`http://localhost:5000/api/expenses/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error deleting:', error);
        }
        expenses = expenses.filter(exp => exp.id !== id);
        localStorage.setItem('dairyExpensesData', JSON.stringify(expenses));
        renderTable();
        updateSummaryCards();
    }
}

// Render Table - FIXED ✅
function renderTable() {
    const tbody = document.getElementById('expenseTableBody');
    const filteredExpenses = getFilteredExpenses();
    
    document.getElementById('recordsCount').textContent = `${filteredExpenses.length} expenses`;
    
    let html = '';
    
    filteredExpenses.forEach((expense, index) => {
        const isHighlighted = highlightedDate && expense.date === highlightedDate;
        const isEditing = editingId === expense.id;
        const rowClass = isHighlighted ? 'highlighted' : '';
        
        html += `<tr class="${rowClass}" data-date="${expense.date}">`;
        html += `<td>${index + 1}</td>`;
        
        if (isEditing) {
            html += `<td><input type="text" id="edit-date-${expense.id}" class="edit-input" value="${expense.date}"></td>`;
        } else {
            html += `<td>${expense.date}</td>`;
        }
        
        if (isEditing) {
            html += `<td><input type="text" id="edit-expense-${expense.id}" class="edit-input" value="${expense.expenses}"></td>`;
        } else {
            html += `<td>${expense.expenses}</td>`;
        }
        
        if (isEditing) {
            html += `<td><input type="number" step="0.01" id="edit-total-${expense.id}" class="edit-input" value="${expense.total}" onchange="updateGrandTotal(${expense.id})"></td>`;
        } else {
            html += `<td>${expense.total.toFixed(2)}</td>`;
        }
        
        if (isEditing) {
            html += `<td><input type="number" step="0.01" id="edit-mtd-${expense.id}" class="edit-input" value="${expense.mtd}" onchange="updateGrandTotal(${expense.id})"></td>`;
        } else {
            html += `<td>${expense.mtd.toFixed(2)}</td>`;
        }
        
        if (isEditing) {
            html += `<td><span id="edit-grandtotal-${expense.id}" class="font-semibold">${expense.grandTotal.toFixed(2)}</span></td>`;
        } else {
            html += `<td>${expense.grandTotal.toFixed(2)}</td>`;
        }
        
        html += `<td class="no-print"><div class="action-buttons-cell">`;
        if (isEditing) {
            html += `<button class="btn btn-small btn-green" onclick="saveEdit(${expense.id})">
                        <i data-lucide="save"></i> Save
                     </button>`;
            html += `<button class="btn btn-small btn-gray" onclick="cancelEdit()">Cancel</button>`;
        } else {
            html += `<button class="btn btn-small btn-yellow" onclick="startEdit(${expense.id})">Edit</button>`;
            html += `<button class="btn btn-small btn-red"    onclick="deleteExpense(${expense.id})">Delete</button>`;
        }                              
        html += `</div></td></tr>`;  
    });     
    
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.total, 0);
    const totalMTD = filteredExpenses.reduce((sum, exp) => sum + exp.mtd, 0);
    const totalGrandTotal = filteredExpenses.reduce((sum, exp) => sum + exp.grandTotal, 0);
    
    html += `<tr class="total-row">
        <td colspan="3">Total</td>
        <td class="total-value">₹${totalExpenses.toFixed(2)}</td>
        <td class="total-value">₹${totalMTD.toFixed(2)}</td>
        <td class="total-value">₹${totalGrandTotal.toFixed(2)}</td>
        <td class="no-print"></td>
    </tr>`;
    
    tbody.innerHTML = html;
    lucide.createIcons();
}

function updateGrandTotal(id) {
    const total = parseFloat(document.getElementById(`edit-total-${id}`).value) || 0;
    const mtd = parseFloat(document.getElementById(`edit-mtd-${id}`).value) || 0;
    document.getElementById(`edit-grandtotal-${id}`).textContent = (total + mtd).toFixed(2);
}

function updateSummaryCards() {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.total, 0);
    const totalMTD = expenses.reduce((sum, exp) => sum + exp.mtd, 0);
    const totalGrandTotal = expenses.reduce((sum, exp) => sum + exp.grandTotal, 0);
    
    document.getElementById('totalExpenses').textContent = `₹${totalExpenses.toFixed(2)}`;
    document.getElementById('totalMTD').textContent = `₹${totalMTD.toFixed(2)}`;
    document.getElementById('grandTotal').textContent = `₹${totalGrandTotal.toFixed(2)}`;
}

// Export functions (unchanged)
function exportToExcel() {
    const filteredExpenses = getFilteredExpenses();
    const headers = ['S.No', 'Date', 'Expenses', 'Total (₹)', 'MTD (₹)', 'Grand Total (₹)'];
    const rows = filteredExpenses.map((exp, index) => [
        index + 1, exp.date, exp.expenses, exp.total.toFixed(2), exp.mtd.toFixed(2), exp.grandTotal.toFixed(2)
    ]);
    
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.total, 0);
    const totalMTD = filteredExpenses.reduce((sum, exp) => sum + exp.mtd, 0);
    const totalGrandTotal = filteredExpenses.reduce((sum, exp) => sum + exp.grandTotal, 0);
    
    rows.push(['', '', 'Total', totalExpenses.toFixed(2), totalMTD.toFixed(2), totalGrandTotal.toFixed(2)]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const filteredExpenses = getFilteredExpenses();
    
    doc.setFontSize(18);
    doc.text('Expenses - Dairy Flow', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableData = filteredExpenses.map((exp, index) => [
        index + 1, exp.date, exp.expenses,
        `₹${exp.total.toFixed(2)}`, `₹${exp.mtd.toFixed(2)}`, `₹${exp.grandTotal.toFixed(2)}`
    ]);
    
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.total, 0);
    const totalMTD = filteredExpenses.reduce((sum, exp) => sum + exp.mtd, 0);
    const totalGrandTotal = filteredExpenses.reduce((sum, exp) => sum + exp.grandTotal, 0);
    
    tableData.push(['', '', 'Total', `₹${totalExpenses.toFixed(2)}`, `₹${totalMTD.toFixed(2)}`, `₹${totalGrandTotal.toFixed(2)}`]);
    
    doc.autoTable({
        head: [['S.No', 'Date', 'Expenses', 'Total (₹)', 'MTD (₹)', 'Grand Total (₹)']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        footStyles: { fillColor: [219, 234, 254], textColor: [30, 64, 175], fontStyle: 'bold' },
    });
    
    doc.save(`expenses_${new Date().toISOString().split('T')[0]}.pdf`);
}

function handlePrint() {
    window.print();
}

window.onclick = function(event) {
    const modal = document.getElementById('addModal');
    if (event.target === modal) {
        closeAddModal();
    }
};
