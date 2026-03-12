// ✅ FULLY FIXED BACKEND INTEGRATED CODE
let customers = [];
let allCustomers = [];
let selectedDate = '';
let editMode = false;

// API Functions
async function fetchCustomers() {
    try {
        const response = await fetch('http://localhost:5000/api/balance-sheet')
        if (!response.ok) throw new Error('Failed to fetch');
        return await response.json();
    } catch (error) {
        console.error('Error fetching customers:', error);
        return null; // null = API failed, don't override localStorage
    }
}

async function saveCustomers(data) {
    try {
        const formatted = data.map(c => ({
            customerName: c.name,
            date: c.date,
            litres: { mtd: c.litres.mtd, today: c.litres.today },
            sales: { mtd: c.sales.mtd, today: c.sales.today },
            paidCash: { mtd: c.paid.mtd, today: c.paid.today },  // ✅ paid → paidCash
            credit: { today: c.credit.today, mtd: c.credit.mtd }
        }));

        await fetch('http://localhost:5000/api/balance-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customers: formatted })  // ✅ wrap in { customers: [] }
        });
    } catch (error) {
        console.error('Error saving customers:', error);
    }
}

async function loadDataFromStorage() {
    const apiData = await fetchCustomers();

    // ✅ FIX 1: null check instead of length check — empty array [] is still valid API data
    if (apiData !== null) {
        customers = apiData;
        allCustomers = [...apiData];
        return apiData;
    }

    const stored = localStorage.getItem('dairyCustomersData');
    if (stored) {
        const data = JSON.parse(stored);
        customers = data;
        allCustomers = [...data];
        return data;
    }

    return [];
}

async function saveDataToStorage() {
    localStorage.setItem('dairyCustomersData', JSON.stringify(allCustomers));
    await saveCustomers(allCustomers);
}

// Calculate grand total for a specific field and category
function calculateGrandTotal(field, category) {
    return customers.reduce((sum, customer) => {
        return sum + (customer[category][field] || 0);
    }, 0);
}

// Filter customers by date
function filterByDate() {
    const dateInput = document.getElementById('dateSearch');
    selectedDate = dateInput.value;

    if (selectedDate) {
        customers = allCustomers.filter(customer => customer.date === selectedDate);
    } else {
        customers = [...allCustomers];
    }

    renderTable();
}

// Clear date filter
function clearDateFilter() {
    document.getElementById('dateSearch').value = '';
    selectedDate = '';
    customers = [...allCustomers];
    renderTable();
}

// ✅ FIX 2: formatDate — timezone-safe parsing to avoid off-by-one date issues
function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day); // local time, not UTC
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Make cell editable (for numbers)
function makeEditable(event, customerId, field, category) {
    if (!editMode) return;

    const cell = event.target;
    const customer = customers.find(c => c.id === customerId);
    const allCustomer = allCustomers.find(c => c.id === customerId);
    if (!customer || !allCustomer) return;

    const currentValue = customer[category][field];
    const input = document.createElement('input');
    input.type = 'number';
    input.value = currentValue;
    input.step = '0.01';
    input.style.width = '100%';
    input.style.padding = '0.25rem';
    input.style.border = '2px solid #3b82f6';
    input.style.borderRadius = '4px';
    input.style.textAlign = 'center';

    input.onblur = async function () {
        const newValue = parseFloat(input.value) || 0;
        customer[category][field] = newValue;
        allCustomer[category][field] = newValue;

        // Recalculate totals
        if (field !== 'total') {
            if (category === 'litres') {
                customer.litres.total = customer.litres.mtd + customer.litres.today;
                allCustomer.litres.total = allCustomer.litres.mtd + allCustomer.litres.today;
            } else if (category === 'sales') {
                customer.sales.total = customer.sales.mtd + customer.sales.today;
                allCustomer.sales.total = allCustomer.sales.mtd + allCustomer.sales.today;
            } else if (category === 'paid') {
                customer.paid.total = customer.paid.mtd + customer.paid.today;
                allCustomer.paid.total = allCustomer.paid.mtd + allCustomer.paid.today;
            } else if (category === 'credit') {
                customer.credit.total = customer.credit.mtd + customer.credit.today;
                allCustomer.credit.total = allCustomer.credit.mtd + allCustomer.credit.today;
            }
        }

        await saveDataToStorage();
        renderTable();
    };

    input.onkeypress = function (e) {
        if (e.key === 'Enter') input.blur();
    };

    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    input.select();
}

// Make name editable
function makeEditableName(event, customerId) {
    if (!editMode) return;

    const cell = event.target;
    const customer = customers.find(c => c.id === customerId);
    const allCustomer = allCustomers.find(c => c.id === customerId);
    if (!customer || !allCustomer) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = customer.name;
    input.style.width = '100%';
    input.style.padding = '0.25rem';
    input.style.border = '2px solid #3b82f6';
    input.style.borderRadius = '4px';

    input.onblur = async function () {
        customer.name = input.value || 'Enter customer name';
        allCustomer.name = input.value || 'Enter customer name';
        await saveDataToStorage();
        renderTable();
    };

    input.onkeypress = function (e) {
        if (e.key === 'Enter') input.blur();
    };

    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    input.select();
}

// Make date editable
function makeEditableDate(event, customerId) {
    if (!editMode) return;

    const cell = event.target;
    const customer = customers.find(c => c.id === customerId);
    const allCustomer = allCustomers.find(c => c.id === customerId);
    if (!customer || !allCustomer) return;

    const input = document.createElement('input');
    input.type = 'date';
    input.value = customer.date;
    input.style.width = '100%';
    input.style.padding = '0.25rem';
    input.style.border = '2px solid #3b82f6';
    input.style.borderRadius = '4px';

    input.onblur = async function () {
        customer.date = input.value || customer.date;
        allCustomer.date = input.value || allCustomer.date;
        await saveDataToStorage();
        renderTable();
    };

    input.onchange = async function () {
        customer.date = input.value || customer.date;
        allCustomer.date = input.value || allCustomer.date;
        await saveDataToStorage();
        renderTable();
    };

    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
}

// Render table
function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    const editableClass = editMode ? 'editable' : '';
    const cursorStyle = editMode ? 'cursor: pointer;' : '';

    customers.forEach((customer) => {
        const row = document.createElement('tr');

        const cell0 = document.createElement('td');
        cell0.textContent = customer.id;
        row.appendChild(cell0);

        const cell1 = document.createElement('td');
        cell1.textContent = customer.name;
        cell1.className = editableClass;
        cell1.style.cssText = cursorStyle;
        cell1.addEventListener('click', (e) => makeEditableName(e, customer.id));
        row.appendChild(cell1);

        const cell2 = document.createElement('td');
        cell2.textContent = formatDate(customer.date);
        cell2.className = editableClass;
        cell2.style.cssText = cursorStyle;
        cell2.addEventListener('click', (e) => makeEditableDate(e, customer.id));
        row.appendChild(cell2);

        const cell3 = document.createElement('td');
        cell3.textContent = customer.litres.mtd;
        cell3.className = editableClass;
        cell3.style.cssText = cursorStyle;
        cell3.addEventListener('click', (e) => makeEditable(e, customer.id, 'mtd', 'litres'));
        row.appendChild(cell3);

        const cell4 = document.createElement('td');
        cell4.textContent = customer.litres.today;
        cell4.className = editableClass;
        cell4.style.cssText = cursorStyle;
        cell4.addEventListener('click', (e) => makeEditable(e, customer.id, 'today', 'litres'));
        row.appendChild(cell4);

        const cell5 = document.createElement('td');
        cell5.textContent = customer.litres.total.toFixed(2);
        cell5.className = 'value-total';
        row.appendChild(cell5);

        const cell6 = document.createElement('td');
        cell6.textContent = customer.sales.mtd;
        cell6.className = editableClass;
        cell6.style.cssText = cursorStyle;
        cell6.addEventListener('click', (e) => makeEditable(e, customer.id, 'mtd', 'sales'));
        row.appendChild(cell6);

        const cell7 = document.createElement('td');
        cell7.textContent = customer.sales.today;
        cell7.className = editableClass;
        cell7.style.cssText = cursorStyle;
        cell7.addEventListener('click', (e) => makeEditable(e, customer.id, 'today', 'sales'));
        row.appendChild(cell7);

        const cell8 = document.createElement('td');
        cell8.textContent = '₹' + customer.sales.total.toFixed(2);
        cell8.className = 'value-total';
        row.appendChild(cell8);

        const cell9 = document.createElement('td');
        cell9.textContent = customer.paid.mtd;
        cell9.className = editableClass;
        cell9.style.cssText = cursorStyle;
        cell9.addEventListener('click', (e) => makeEditable(e, customer.id, 'mtd', 'paid'));
        row.appendChild(cell9);

        const cell10 = document.createElement('td');
        cell10.textContent = customer.paid.today;
        cell10.className = editableClass;
        cell10.style.cssText = cursorStyle;
        cell10.addEventListener('click', (e) => makeEditable(e, customer.id, 'today', 'paid'));
        row.appendChild(cell10);

        const cell11 = document.createElement('td');
        cell11.textContent = '₹' + customer.paid.total.toFixed(2);
        cell11.className = 'value-total';
        row.appendChild(cell11);

        const cell12 = document.createElement('td');
        cell12.textContent = customer.credit.today;
        cell12.className = editableClass;
        cell12.style.cssText = cursorStyle;
        cell12.addEventListener('click', (e) => makeEditable(e, customer.id, 'today', 'credit'));
        row.appendChild(cell12);

        const cell13 = document.createElement('td');
        cell13.textContent = customer.credit.mtd;
        cell13.className = editableClass;
        cell13.style.cssText = cursorStyle;
        cell13.addEventListener('click', (e) => makeEditable(e, customer.id, 'mtd', 'credit'));
        row.appendChild(cell13);

        const cell14 = document.createElement('td');
        cell14.textContent = '₹' + customer.credit.total.toFixed(2);
        cell14.className = 'value-total';
        row.appendChild(cell14);

        const cell15 = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
        deleteBtn.addEventListener('click', () => deleteCustomer(customer.id));
        cell15.appendChild(deleteBtn);
        row.appendChild(cell15);

        tbody.appendChild(row);
    });

    // Grand total row
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    totalRow.innerHTML = `
        <td colspan="3">GRAND TOTAL</td>
        <td>${calculateGrandTotal('mtd', 'litres').toFixed(2)}</td>
        <td>${calculateGrandTotal('today', 'litres').toFixed(2)}</td>
        <td>${calculateGrandTotal('total', 'litres').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('mtd', 'sales').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('today', 'sales').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('total', 'sales').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('mtd', 'paid').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('today', 'paid').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('total', 'paid').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('today', 'credit').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('mtd', 'credit').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('total', 'credit').toFixed(2)}</td>
        <td></td>
    `;
    tbody.appendChild(totalRow);

    lucide.createIcons();
    updateSummary();
}

// Update summary cards
function updateSummary() {
    document.getElementById('totalCustomers').textContent = customers.length;
    document.getElementById('totalLitres').textContent = calculateGrandTotal('total', 'litres').toFixed(2) + ' L';
    document.getElementById('totalSales').textContent = '₹' + calculateGrandTotal('total', 'sales').toFixed(2);
    document.getElementById('totalCredit').textContent = '₹' + calculateGrandTotal('total', 'credit').toFixed(2);
}

// ✅ FIX 3: addCustomer — use length+1 for clean sequential IDs
async function addCustomer() {
    const newId = allCustomers.length > 0 ? allCustomers.length + 1 : 1;
    const today = new Date().toISOString().split('T')[0];
    const newCustomer = {
        id: newId,
        name: 'Enter customer name',
        date: today,
        litres: { mtd: 0, today: 0, total: 0 },
        sales: { mtd: 0, today: 0, total: 0 },
        paid: { mtd: 0, today: 0, total: 0 },
        credit: { today: 0, mtd: 0, total: 0 }
    };

    allCustomers.push(newCustomer);

    if (selectedDate) {
        if (newCustomer.date === selectedDate) {
            customers.push(newCustomer);
        }
    } else {
        customers.push(newCustomer);
    }

    await saveDataToStorage();

    if (!editMode) {
        editMode = true;
        const btn = document.querySelector('.btn-edit');
        btn.style.backgroundColor = '#2ECC71';
        btn.innerHTML = '<i data-lucide="check-circle" class="icon-medium"></i> Edit Mode ON';
    }

    renderTable();
}

// ✅ FIX 4: deleteCustomer — re-index IDs after deletion to prevent gaps
async function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        allCustomers = allCustomers.filter(customer => customer.id !== id);
        allCustomers = allCustomers.map((c, i) => ({ ...c, id: i + 1 })); // re-index

        customers = customers.filter(customer => customer.id !== id);
        customers = customers.map((c, i) => ({ ...c, id: i + 1 })); // re-index

        await saveDataToStorage();
        renderTable();
    }
}

// Edit mode toggle
function handleEditMode() {
    editMode = !editMode;
    const btn = document.querySelector('.btn-edit');

    if (editMode) {
        btn.style.backgroundColor = '#2ECC71';
        btn.innerHTML = '<i data-lucide="check-circle" class="icon-medium"></i> Edit Mode ON';
    } else {
        btn.style.backgroundColor = '#6B7A8F';
        btn.innerHTML = '<i data-lucide="file-text" class="icon-medium"></i> Edit Mode';
    }

    lucide.createIcons();
    renderTable();
}

// Excel Export
function handleExcel() {
    try {
        const excelData = [];
        excelData.push(['Dairy Farm Balance Sheet']);
        excelData.push(['Customer Transaction Records']);
        if (selectedDate) {
            excelData.push(['Filtered by Date: ' + formatDate(selectedDate)]);
        }
        excelData.push([]);

        excelData.push([
            'S.No', 'Customer Name', 'Date', 'Litres MTD', 'Litres Today', 'Litres Total',
            'Sales MTD (₹)', 'Sales Today (₹)', 'Sales Total (₹)', 'Paid MTD (₹)', 'Paid Today (₹)',
            'Paid Total (₹)', 'Credit Today (₹)', 'Credit MTD (₹)', 'Credit Total (₹)'
        ]);

        customers.forEach(customer => {
            excelData.push([
                customer.id, customer.name, customer.date,
                customer.litres.mtd, customer.litres.today, customer.litres.total,
                customer.sales.mtd, customer.sales.today, customer.sales.total,
                customer.paid.mtd, customer.paid.today, customer.paid.total,
                customer.credit.today, customer.credit.mtd, customer.credit.total
            ]);
        });

        excelData.push([
            'GRAND TOTAL', '', '',
            calculateGrandTotal('mtd', 'litres').toFixed(2),
            calculateGrandTotal('today', 'litres').toFixed(2),
            calculateGrandTotal('total', 'litres').toFixed(2),
            calculateGrandTotal('mtd', 'sales').toFixed(2),
            calculateGrandTotal('today', 'sales').toFixed(2),
            calculateGrandTotal('total', 'sales').toFixed(2),
            calculateGrandTotal('mtd', 'paid').toFixed(2),
            calculateGrandTotal('today', 'paid').toFixed(2),
            calculateGrandTotal('total', 'paid').toFixed(2),
            calculateGrandTotal('today', 'credit').toFixed(2),
            calculateGrandTotal('mtd', 'credit').toFixed(2),
            calculateGrandTotal('total', 'credit').toFixed(2)
        ]);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!cols'] = [
            { wch: 8 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Balance Sheet');
        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Dairy_Farm_Balance_Sheet_${date}.xlsx`);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Error exporting to Excel. Please try again.');
    }
}

// ✅ FIX 5: PDF Export — restore UI in .finally() so buttons always come back
function handlePDF() {
    try {
        const { jsPDF } = window.jspdf;
        const actionButtons = document.querySelector('.action-buttons');
        const searchBar = document.querySelector('.search-bar');
        const deleteButtons = document.querySelectorAll('.btn-delete');
        const addButton = document.querySelector('.btn-add');

        actionButtons.style.display = 'none';
        searchBar.style.display = 'none';
        deleteButtons.forEach(btn => btn.style.visibility = 'hidden');
        addButton.style.visibility = 'hidden';

        const element = document.querySelector('.card');
        html2canvas(element, { scale: 2, useCORS: true, logging: false })
            .then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgWidth = 210;
                const pageHeight = 297;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }

                const date = new Date().toISOString().split('T')[0];
                pdf.save(`Dairy_Farm_Balance_Sheet_${date}.pdf`);
            })
            .catch(error => {
                console.error('Error generating PDF canvas:', error);
                alert('Error generating PDF. Please try again.');
            })
            .finally(() => {
                // ✅ Always restore UI whether PDF succeeds or fails
                actionButtons.style.display = 'flex';
                searchBar.style.display = 'flex';
                deleteButtons.forEach(btn => btn.style.visibility = 'visible');
                addButton.style.visibility = 'visible';
            });
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
}

function handlePrint() {
    window.print();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function () {
    await loadDataFromStorage();
    renderTable();
});