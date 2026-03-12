// Global Variables
let isEditMode = false;
let currentDate = getTodayDate();
let dataHistory = {};
let isSearchActive = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await initializeApp();
    setupEventListeners();
    renderTable();
    updateEmployeeCount();
});

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ==================== API FUNCTIONS ====================

async function fetchSalaries() {
    try {
        const response = await fetch('http://localhost:5000/api/salaries');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching salaries:', error);
        return null;
    }
}

// ==================== STORAGE FUNCTIONS ====================

async function loadDataFromStorage() {
    const apiData = await fetchSalaries();
    if (apiData && apiData.length > 0) {
        const history = {};
        apiData.forEach(salary => {
            // ✅ Force clean YYYY-MM-DD regardless of API format
            const rawDate = salary.date || getTodayDate();
            const date = String(rawDate).substring(0, 10);

            if (!history[date]) {
                history[date] = { date: date, employees: [] };
            }
            history[date].employees.push({
                id:     salary.id,
                date:   date,
                name:   salary.employee_name,
                amount: parseFloat(salary.total_amount || 0),
                paid:   parseFloat(salary.paid_amount || 0)
            });
        });
        // ✅ Sync to localStorage
        localStorage.setItem('employeeSalariesData', JSON.stringify(history));
        return history;
    }

    const stored = localStorage.getItem('employeeSalariesData');
    if (stored) return JSON.parse(stored);
    return {};

}

async function saveDataToStorage() {
    localStorage.setItem('employeeSalariesData', JSON.stringify(dataHistory));
}

// ==================== INITIALIZE ====================

async function initializeApp() {
    dataHistory = await loadDataFromStorage();
    document.getElementById('currentDateValue').textContent = formatDateForDisplay(currentDate);
    const currentYear = new Date().getFullYear();
    const searchYearInput = document.getElementById('searchYear');
    searchYearInput.min = currentYear - 5;
    searchYearInput.max = currentYear;
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    document.getElementById('editModeBtn').addEventListener('click', toggleEditMode);
    document.getElementById('addEmployeeBtn').addEventListener('click', handleAddEmployee);
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

// ==================== EDIT MODE ====================

function toggleEditMode() {
    isEditMode = !isEditMode;
    const editBtn = document.getElementById('editModeBtn');
    const addEmployeeSection = document.getElementById('addEmployeeSection');

    if (isEditMode) {
        editBtn.classList.add('active');
        addEmployeeSection.style.display = 'block';
    } else {
        editBtn.classList.remove('active');
        addEmployeeSection.style.display = 'none';
    }

    renderTable();
}

// ==================== DATA HELPERS ====================

function getCurrentData() {
    if (isSearchActive) {
        if (!dataHistory[currentDate]) {
            dataHistory[currentDate] = { date: currentDate, employees: [] };
        }
        return dataHistory[currentDate];
    }
    const allEmployees = [];
    Object.values(dataHistory).forEach(dateGroup => {
        allEmployees.push(...dateGroup.employees);
    });
    return { date: null, employees: allEmployees };
}

function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function calculateBalance(amount, paid) {
    return (parseFloat(amount) || 0) - (parseFloat(paid) || 0);
}

function updateEmployeeCount() {
    const data = getCurrentData();
    document.getElementById('employeeCount').textContent = `${data.employees.length} employees`;
}

// ==================== RENDER TABLE ====================

function renderTable() {
    const tbody = document.getElementById('employeeTableBody');
    const data = getCurrentData();

    tbody.innerHTML = '';

    data.employees.forEach((employee, index) => {
        const row = document.createElement('tr');
        const balance = calculateBalance(employee.amount, employee.paid);
        const displayDate = formatDateForDisplay(employee.date || currentDate);

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${renderDateCell(employee, 'date', displayDate)}</td>
            <td>${renderCell(employee, 'name', employee.name, 'text')}</td>
            <td>${renderCell(employee, 'amount', employee.amount.toFixed(2), 'number')}</td>
            <td>${renderCell(employee, 'paid', employee.paid.toFixed(2), 'number')}</td>
            <td>${balance.toFixed(2)}</td>
            <td>
                ${isEditMode ? `<button class="btn btn-delete" onclick="handleDelete(${employee.id})">Delete</button>` : ''}
            </td>
        `;

        tbody.appendChild(row);

        if (isEditMode) {
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
                const field = input.dataset.field;
                input.addEventListener('change', function() {
                    updateEmployee(employee.id, field, this.value);
                });
            });
        }
    });

    updateEmployeeCount();
}

function renderDateCell(employee, field, displayValue) {
    if (isEditMode) {
        const dateValue = employee.date || currentDate;
        return `<input type="date" value="${dateValue}" data-field="${field}" class="editable-input">`;
    }
    return displayValue;
}

function renderCell(employee, field, value, type) {
    if (isEditMode) {
        if (type === 'text') {
            return `<input type="text" value="${value}" data-field="${field}" class="editable-input name-input">`;
        } else if (type === 'number') {
            return `<input type="number" value="${value}" data-field="${field}" class="editable-input amount-input" step="0.01">`;
        }
    }
    return value;
}

// ==================== ADD EMPLOYEE ====================

async function handleAddEmployee() {
    const name   = document.getElementById('employeeName').value.trim();
    const amount = parseFloat(document.getElementById('employeeAmount').value) || 0;
    const paid   = parseFloat(document.getElementById('employeePaid').value) || 0;

    if (!name) {
        alert('Please enter employee name');
        return;
    }

    try {
        // ✅ Save to backend FIRST
        const response = await fetch('http://localhost:5000/api/salaries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
    employees: [{ name, amount, paid, date: getTodayDate() }]
})
        });

        const result = await response.json();
        if (!response.ok) {
            alert(`Failed to save: ${result.error}`);
            return;
        }

        console.log('✅ Employee saved to DB:', result);

        // ✅ Add to local state after successful DB save
        const data = getCurrentData();
data.employees.push({
    id:     Date.now(),
    date:   getTodayDate(),
    name:   name,
    amount: amount,
    paid:   paid
});

        await saveDataToStorage();
        renderTable();

        // Clear form
        document.getElementById('employeeName').value   = '';
        document.getElementById('employeeAmount').value = '';
        document.getElementById('employeePaid').value   = '';

    } catch (error) {
        console.error('❌ Error adding employee:', error);
        alert('Failed to save. Please try again.');
    }
}

// ==================== UPDATE EMPLOYEE ====================

async function updateEmployee(id, field, value) {
    const data = getCurrentData();
    const employee = data.employees.find(e => e.id === id);

    if (employee) {
        if (field === 'name' || field === 'date') {
            employee[field] = value;
        } else {
            employee[field] = parseFloat(value) || 0;
        }

        // ✅ Update in backend
        try {
            await fetch(`http://localhost:5000/api/salaries/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeName: employee.name,
                    totalAmount:  employee.amount,
                    paidAmount:   employee.paid,
                    date:         employee.date || currentDate
                })
            });
        } catch (error) {
            console.error('❌ Update error:', error);
        }

        await saveDataToStorage();
        renderTable();
    }
}

// ==================== DELETE EMPLOYEE ====================

async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
        // ✅ Delete from backend
        await fetch(`http://localhost:5000/api/salaries/${id}`, {
            method: 'DELETE'
        });
        console.log('✅ Deleted from DB');
    } catch (error) {
        console.error('❌ Delete error:', error);
    }

    // ✅ Remove from local state
    const data = getCurrentData();
    const index = data.employees.findIndex(e => e.id === id);
    if (index > -1) {
        data.employees.splice(index, 1);
        await saveDataToStorage();
        renderTable();
    }
}

// ==================== EXPORT FUNCTIONS ====================

function exportToExcel() {
    const data = getCurrentData();
    const excelData = data.employees.map((employee, index) => ({
        '#': index + 1,
        'Date': formatDateForDisplay(employee.date || currentDate),
        'Name': employee.name,
        'Amount (₹)': employee.amount.toFixed(2),
        'Paid (₹)': employee.paid.toFixed(2),
        'Balance (₹)': calculateBalance(employee.amount, employee.paid).toFixed(2)
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Salaries');
    XLSX.writeFile(workbook, `Employee_Salaries_${currentDate}.xlsx`);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc  = new jsPDF();
    const data = getCurrentData();

    doc.setFontSize(20);
    doc.setTextColor(65, 105, 225);
    doc.text('Employee Salaries', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date: ${formatDateForDisplay(currentDate)}`, 14, 28);
    doc.text(`Total Employees: ${data.employees.length}`, 14, 35);

    const tableData = data.employees.map((employee, index) => [
        index + 1,
        formatDateForDisplay(employee.date || currentDate),
        employee.name,
        employee.amount.toFixed(2),
        employee.paid.toFixed(2),
        calculateBalance(employee.amount, employee.paid).toFixed(2)
    ]);

    doc.autoTable({
        head: [['#', 'Date', 'Name', 'Amount (₹)', 'Paid (₹)', 'Balance (₹)']],
        body: tableData,
        startY: 42,
        theme: 'grid',
        headStyles: { fillColor: [65, 105, 225], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
        styles: { fontSize: 9, cellPadding: 4 },
// Change columnStyles widths to fit page
columnStyles: {
    0: { halign: 'center', cellWidth: 10 },  // # 
    1: { halign: 'left',   cellWidth: 25 },  // Date
    2: { halign: 'left',   cellWidth: 60 },  // Name
    3: { halign: 'center', cellWidth: 25 },  // Amount
    4: { halign: 'center', cellWidth: 25 },  // Paid
    5: { halign: 'center', cellWidth: 25, textColor: [239, 68, 68] }  // Balance
}
    });

    doc.save(`Employee_Salaries_${currentDate}.pdf`);
}

function handlePrint() {
    window.print();
}

// ==================== SEARCH ====================

function openSearchModal() {
    document.getElementById('searchModal').style.display = 'flex';
}

function closeSearchModal() {
    document.getElementById('searchModal').style.display = 'none';
    document.getElementById('searchDate').value  = '';
    document.getElementById('searchMonth').value = '';
    document.getElementById('searchYear').value  = '';
}

async function handleSearch() {
    const searchDate  = document.getElementById('searchDate').value;
    const searchMonth = document.getElementById('searchMonth').value;
    const searchYear  = document.getElementById('searchYear').value;

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
    isSearchActive = true;

    document.getElementById('currentDateValue').textContent = formatDateForDisplay(currentDate);
    document.getElementById('clearSearchBtn').style.display = 'inline-flex';

    if (!dataHistory[searchDateStr]) {
        dataHistory[searchDateStr] = { date: searchDateStr, employees: [] };
        await saveDataToStorage();
    }

    closeSearchModal();
    renderTable();
}
function clearSearch() {
    isSearchActive = false;
    currentDate = getTodayDate();
    document.getElementById('currentDateValue').textContent = 'All Records';
    document.getElementById('clearSearchBtn').style.display = 'none';
    renderTable();
}