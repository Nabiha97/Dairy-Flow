// Shared utility functions for PDF and Excel export
// This file should be included in all pages that need export functionality

const API_BASE_URL = 'http://localhost:5000/api';

// Export to Excel using CSV format (works with Excel)
async function exportToExcelCSV(tableId, filename, apiEndpoint = null) {
    try {
        let exportData = [];
        let headers = [];
        
        // Try to fetch from API if endpoint provided
        if (apiEndpoint) {
            try {
                const response = await fetch(`${API_BASE_URL}${apiEndpoint}`);
                if (response.ok) {
                    const dbData = await response.json();
                    if (dbData && dbData.length > 0) {
                        // Transform API data to export format
                        exportData = dbData;
                        return exportDataToCSV(exportData, filename);
                    }
                }
            } catch (error) {
                console.log('API not available, using table data');
            }
        }
        
        // Get data from table
        const table = document.getElementById(tableId) || document.querySelector(`table`);
        if (!table) {
            alert('Table not found');
            return;
        }
        
        // Get headers
        const headerRow = table.querySelectorAll('thead th');
        headerRow.forEach(th => {
            const text = th.textContent.trim();
            if (text !== 'Action' && text !== 'Actions') {
                headers.push(text);
            }
        });
        
        // Get table rows
        const rows = [];
        const tableRows = table.querySelectorAll('tbody tr');
        
        tableRows.forEach(tr => {
            const cells = tr.querySelectorAll('td');
            if (cells.length > 0 && !tr.classList.contains('total-row')) {
                const rowData = [];
                let hasData = false;
                
                cells.forEach((cell, index) => {
                    // Skip Actions column (usually last)
                    if (index < cells.length - 1 || !cell.querySelector('button')) {
                        const cellText = cell.textContent.trim();
                        if (cellText && cellText !== 'Enter name' && cellText !== '₹' && cellText !== '0' && cellText !== '0.00') {
                            hasData = true;
                        }
                        rowData.push(cellText);
                    }
                });
                
                if (hasData) {
                    rows.push(rowData);
                }
            }
        });
        
        // Create CSV
        let csvContent = '\ufeff'; // BOM for Excel UTF-8 support
        csvContent += headers.join(',') + '\n';
        
        rows.forEach(row => {
            const escapedRow = row.map(cell => {
                const cellStr = String(cell || '');
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return '"' + cellStr.replace(/"/g, '""') + '"';
                }
                return cellStr;
            });
            csvContent += escapedRow.join(',') + '\n';
        });
        
        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const finalFilename = `${filename}_${dateStr}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', finalFilename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert(`Data exported successfully!\n\nFile: ${finalFilename}\nRecords: ${rows.length}`);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Error exporting to Excel: ' + error.message);
    }
}

// Export data array to CSV
function exportDataToCSV(data, filename) {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    let csvContent = '\ufeff'; // BOM for Excel UTF-8 support
    csvContent += headers.join(',') + '\n';
    
    // Add rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            const cellStr = String(value);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return '"' + cellStr.replace(/"/g, '""') + '"';
            }
            return cellStr;
        });
        csvContent += values.join(',') + '\n';
    });
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const finalFilename = `${filename}_${dateStr}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert(`Data exported successfully!\n\nFile: ${finalFilename}\nRecords: ${data.length}`);
}

// Export to PDF using jsPDF (requires jsPDF library)
async function exportToPDF(tableId, title, apiEndpoint = null) {
    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
        // Fallback to print if jsPDF not available
        alert('PDF export requires jsPDF library. Using print instead.');
        window.print();
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf || window;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(18);
        doc.text(title, 14, 15);
        
        // Get table data
        const table = document.getElementById(tableId) || document.querySelector('table');
        if (!table) {
            alert('Table not found');
            return;
        }
        
        // Get headers
        const headers = [];
        const headerRow = table.querySelectorAll('thead th');
        headerRow.forEach(th => {
            const text = th.textContent.trim();
            if (text !== 'Action' && text !== 'Actions') {
                headers.push(text);
            }
        });
        
        // Get table rows
        const rows = [];
        const tableRows = table.querySelectorAll('tbody tr');
        
        tableRows.forEach(tr => {
            if (!tr.classList.contains('total-row')) {
                const cells = tr.querySelectorAll('td');
                const rowData = [];
                cells.forEach((cell, index) => {
                    if (index < cells.length - 1 || !cell.querySelector('button')) {
                        rowData.push(cell.textContent.trim());
                    }
                });
                if (rowData.length > 0) {
                    rows.push(rowData);
                }
            }
        });
        
        // Create table in PDF
        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 25,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 139, 202] }
        });
        
        // Save PDF
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const filename = `${title.replace(/\s+/g, '_')}_${dateStr}.pdf`;
        doc.save(filename);
        
        alert(`PDF exported successfully!\n\nFile: ${filename}`);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        // Fallback to print
        window.print();
    }
}

// Simple print function
function printTable() {
    window.print();
}
