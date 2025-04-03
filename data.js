window.addEventListener('load', function() {
    displayHistory();
    
    // Add enter key support for name search
    document.getElementById('nameSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Add scroll button handlers
    document.getElementById('scrollLeft').addEventListener('click', () => {
        const container = document.getElementById('historyList');
        container.scrollBy({ left: -400, behavior: 'smooth' });
    });
    
    document.getElementById('scrollRight').addEventListener('click', () => {
        const container = document.getElementById('historyList');
        container.scrollBy({ left: 400, behavior: 'smooth' });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Initialize search functionality
    initializeSearch();
});

function initializeSearch() {
    const nameInput = document.getElementById('nameSearch');
    const dateInput = document.getElementById('dateSearch');
    const searchBtn = document.getElementById('searchRecords');
    const clearBtn = document.getElementById('clearSearch');

    // Add input event listeners with debouncing
    nameInput.addEventListener('input', debounceSearch);
    dateInput.addEventListener('input', debounceSearch);

    // Add enter key support
    nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchRecords();
        }
    });

    dateInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchRecords();
        }
    });

    // Button click handlers
    searchBtn.addEventListener('click', searchRecords);
    clearBtn.addEventListener('click', clearSearch);
}

function debounceSearch() {
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(searchRecords, 300);
}

function searchRecords() {
    const nameFilter = document.getElementById('nameSearch').value.trim();
    const dateFilter = document.getElementById('dateSearch').value;
    
    displayHistory({
        name: nameFilter,
        date: dateFilter
    });
}

function clearSearch() {
    document.getElementById('nameSearch').value = '';
    document.getElementById('dateSearch').value = '';
    displayHistory();
}

function displayHistory(filters = {}) {
    const historyList = document.getElementById('historyList');
    let patientRecords = JSON.parse(localStorage.getItem('patientRecords') || '[]');
    
    // Apply filters
    if (filters.name || filters.date) {
        patientRecords = patientRecords.filter(record => {
            let matchName = true;
            let matchDate = true;
            
            if (filters.name) {
                const patientName = record['Patient Name'].toLowerCase();
                const searchName = filters.name.toLowerCase();
                matchName = patientName.includes(searchName);
            }
            
            if (filters.date) {
                const recordDate = new Date(record['Test Date']).toISOString().split('T')[0];
                matchDate = recordDate === filters.date;
            }
            
            return matchName && matchDate;
        });
    }

    // Create table structure
    historyList.innerHTML = `
        <table class="patient-table">
            <thead>
                <tr>
                    <th style="width: 25%">Patient Info</th>
                    <th style="width: 15%">Doctor</th>
                    <th style="width: 25%">Tests</th>
                    <th style="width: 15%">Date</th>
                    <th style="width: 15%">Payment Info</th>
                    <th style="width: 5%">Action</th>
                </tr>
            </thead>
            <tbody id="patientTableBody"></tbody>
        </table>
    `;

    const tableBody = document.getElementById('patientTableBody');
    
    if (patientRecords.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-records">No records found</td>
            </tr>
        `;
        return;
    }

    patientRecords.slice().reverse().forEach((record, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="patient-name">
                    <i class="fas ${record['Gender'] === 'male' ? 'fa-male' : 'fa-female'}" 
                       style="color: ${record['Gender'] === 'male' ? '#3b82f6' : '#ec4899'}">
                    </i>
                    <div>
                        <div>${record['Patient Name']}</div>
                        <small>
                            ${record['Age']} years 
                            <span class="gender-tag ${record['Gender']}">
                                ${record['Gender'].charAt(0).toUpperCase() + record['Gender'].slice(1)}
                            </span>
                        </small>
                    </div>
                </div>
            </td>
            <td>
                <div class="detail-item">
                    <i class="fas fa-user-md" style="color: #3b82f6"></i>
                    <span>${record['Referring Doctor']}</span>
                </div>
            </td>
            <td>
                <div class="table-test-tags">
                    ${record['Tests'].split(',').map(test => 
                        `<span class="test-tag">${test.trim()}</span>`
                    ).join('')}
                </div>
            </td>
            <td>
                <div class="detail-item">
                    <i class="far fa-calendar-alt" style="color: #3b82f6"></i>
                    <span>${record['Test Date']}</span>
                </div>
            </td>
            <td>
                <div>
                    <div class="status-badge ${record['Payment Status']}">
                        <i class="fas ${record['Payment Status'] === 'done' ? 'fa-check-circle' : 'fa-clock'}"></i>
                        ${record['Payment Status'].toUpperCase()}
                    </div>
                    <div class="payment-info">
                        <small style="color: #64748b;">Total: ${record['Total Amount']}</small>
                        <small style="color: ${record['Payment Status'] === 'done' ? '#166534' : '#854d0e'}">
                            Paid: ${record['Amount Paid']}
                        </small>
                    </div>
                </div>
            </td>
            <td>
                <div class="table-actions">
                    <button class="action-btn edit-action" onclick="editRecord(${patientRecords.length - 1 - index})">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="action-btn print-action" onclick="printInvoice(${patientRecords.length - 1 - index})">
                        <i class="fas fa-print"></i>
                        Print
                    </button>
                    <button class="action-btn delete-action" data-index="${patientRecords.length - 1 - index}">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });

    // Update delete button listeners
    document.querySelectorAll('.delete-action').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const record = patientRecords[index];
            showDeleteConfirmation(index, record['Patient Name']);
        });
    });
}

function showDeleteConfirmation(index, patientName) {
    // Create confirmation dialog
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete the record for <strong>${patientName}</strong>?</p>
        <p>This action cannot be undone.</p>
        <div class="dialog-buttons">
            <button class="action-btn" onclick="hideDeleteConfirmation()">Cancel</button>
            <button class="action-btn delete-action" onclick="confirmDelete(${index})">Delete</button>
        </div>
    `;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    // Add to document
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    // Show dialog and overlay
    overlay.style.display = 'block';
    dialog.style.display = 'block';
}

function hideDeleteConfirmation() {
    const dialog = document.querySelector('.confirm-dialog');
    const overlay = document.querySelector('.dialog-overlay');
    
    if (dialog) dialog.remove();
    if (overlay) overlay.remove();
}

function confirmDelete(index) {
    const records = JSON.parse(localStorage.getItem('patientRecords') || '[]');
    records.splice(index, 1);
    localStorage.setItem('patientRecords', JSON.stringify(records));
    hideDeleteConfirmation();
    displayHistory();
}

function deleteRecord(index) {
    if (confirm('Are you sure you want to delete this record?')) {
        const records = JSON.parse(localStorage.getItem('patientRecords') || '[]');
        records.splice(index, 1);
        localStorage.setItem('patientRecords', JSON.stringify(records));
        displayHistory();
    }
}

function deleteAllRecords() {
    if (confirm('Are you sure you want to delete all records? This cannot be undone.')) {
        localStorage.removeItem('patientRecords');
        displayHistory();
    }
}

document.getElementById('downloadRecords').addEventListener('click', function() {
    const patientRecords = JSON.parse(localStorage.getItem('patientRecords') || '[]');
    if (patientRecords.length === 0) {
        alert('No records to download');
        return;
    }
    downloadAllRecords(patientRecords);
});

document.getElementById('deleteAll').addEventListener('click', deleteAllRecords);

function downloadAllRecords(records) {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(records);
    
    worksheet['!cols'] = [
        {wch: 20}, {wch: 20}, {wch: 5}, {wch: 15},
        {wch: 20}, {wch: 30}, {wch: 12}, {wch: 12}, {wch: 12}
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patient Records');
    XLSX.writeFile(workbook, 'all_patient_records.xlsx');
}

function editRecord(index) {
    const records = JSON.parse(localStorage.getItem('patientRecords') || '[]');
    const record = records[index];
    
    // Create edit dialog
    const dialog = document.createElement('div');
    dialog.className = 'edit-dialog';
    dialog.innerHTML = `
        <h3>Edit Record</h3>
        <form id="editForm" class="edit-form">
            <div class="form-group">
                <label>Patient Name:</label>
                <input type="text" id="editName" value="${record['Patient Name']}" required>
            </div>
            <div class="form-group">
                <label>Age:</label>
                <input type="number" id="editAge" value="${record['Age']}" required>
            </div>
            <div class="form-group">
                <label>Payment Status:</label>
                <select id="editPaymentStatus">
                    <option value="pending" ${record['Payment Status'] === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="done" ${record['Payment Status'] === 'done' ? 'selected' : ''}>Done</option>
                </select>
            </div>
            <div class="form-group">
                <label>Amount Paid:</label>
                <input type="number" id="editAmountPaid" value="${record['Amount Paid'].replace('₹', '')}" 
                       ${record['Payment Status'] === 'pending' ? 'disabled' : ''}>
            </div>
            <div class="dialog-buttons">
                <button type="button" class="action-btn" onclick="hideEditDialog()">Cancel</button>
                <button type="submit" class="action-btn save-btn">Save Changes</button>
            </div>
        </form>
    `;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    // Add form submit handler
    document.getElementById('editForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveEditedRecord(index);
    });
    
    // Add payment status change handler
    document.getElementById('editPaymentStatus').addEventListener('change', (e) => {
        const amountInput = document.getElementById('editAmountPaid');
        amountInput.disabled = e.target.value === 'pending';
        if (e.target.value === 'pending') {
            amountInput.value = '0';
        }
    });
}

function saveEditedRecord(index) {
    const records = JSON.parse(localStorage.getItem('patientRecords') || '[]');
    const record = records[index];
    
    // Update record with new values
    record['Patient Name'] = document.getElementById('editName').value;
    record['Age'] = document.getElementById('editAge').value;
    record['Payment Status'] = document.getElementById('editPaymentStatus').value;
    record['Amount Paid'] = `₹${document.getElementById('editAmountPaid').value}`;
    
    localStorage.setItem('patientRecords', JSON.stringify(records));
    hideEditDialog();
    displayHistory();
}

function hideEditDialog() {
    const dialog = document.querySelector('.edit-dialog');
    const overlay = document.querySelector('.dialog-overlay');
    
    if (dialog) dialog.remove();
    if (overlay) overlay.remove();
}

function printInvoice(index) {
    try {
        const records = JSON.parse(localStorage.getItem('patientRecords') || '[]');
        const record = records[index];
        if (!record) throw new Error('Record not found');

        const invoiceContent = document.getElementById('invoiceTemplate').cloneNode(true);
        invoiceContent.style.display = 'block';
        
        // Format date for invoice
        const invoiceDate = new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
        
        // Populate invoice body with enhanced formatting
        const invoiceBody = invoiceContent.querySelector('.invoice-body');
        invoiceBody.innerHTML = `
            <div class="invoice-details">
                <div class="patient-details">
                    <h3>Patient Information</h3>
                    <table>
                        <tr><td><strong>Name:</strong></td><td>${record['Patient Name']}</td></tr>
                        <tr><td><strong>Age/Gender:</strong></td><td>${record['Age']} years / ${record['Gender']}</td></tr>
                        <tr><td><strong>Date:</strong></td><td>${new Date(record['Test Date']).toLocaleDateString('en-IN')}</td></tr>
                        <tr><td><strong>Doctor:</strong></td><td>${record['Referring Doctor']}</td></tr>
                    </table>
                </div>
                <div class="invoice-info">
                    <table>
                        <tr><td><strong>Invoice No:</strong></td><td>${invoiceNumber}</td></tr>
                        <tr><td><strong>Date:</strong></td><td>${invoiceDate}</td></tr>
                    </table>
                </div>
            </div>
            // ...rest of the invoice body...
        `;

        // Create print window with error handling
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            throw new Error('Pop-up blocked. Please allow pop-ups for printing.');
        }

        // Add error handling for print window
        printWindow.onerror = function(msg, url, lineNo, columnNo, error) {
            console.error('Print window error:', error);
            alert('Error generating invoice. Please try again.');
            printWindow.close();
        };

        // Add print window content
        printWindow.document.write(`
            <html>
                <head>
                    <title>Medical Test Invoice</title>
                    <style>
                        /* Add print-specific styles */
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .invoice-container { max-width: 800px; margin: 0 auto; }
                        .invoice-header { text-align: center; margin-bottom: 30px; }
                        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
                        .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        .invoice-table th, .invoice-table td { padding: 10px; border: 1px solid #ddd; }
                        .invoice-table th { background: #f5f5f5; }
                        .status-badge { padding: 5px 10px; border-radius: 4px; }
                        .status-badge.pending { background: #ffd700; color: #000; }
                        .status-badge.done { background: #4CAF50; color: white; }
                        @media print {
                            .no-print { display: none; }
                            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    ${invoiceContent.innerHTML}
                    <div class="no-print" style="text-align: center; margin-top: 20px;">
                        <button onclick="window.print()">Print Invoice</button>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();

    } catch (error) {
        console.error('Print error:', error);
        alert('Error generating invoice: ' + error.message);
    }
}

function getTestPrice(testName) {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const test = tests.find(t => t.name === testName);
    return test ? test.price : 0;
}

function calculateBalance(total, paid) {
    const totalAmount = parseInt(total.replace('₹', '')) || 0;
    const paidAmount = parseInt(paid.replace('₹', '')) || 0;
    return totalAmount - paidAmount;
}

// Add debounce to search function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
