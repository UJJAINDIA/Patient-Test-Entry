window.addEventListener('load', function() {
    // Set default date-time to current Indian time
    const now = new Date();
    const indianTime = now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
    const indianDate = new Date(indianTime);
    
    // Format date-time for datetime-local input
    const year = indianDate.getFullYear();
    const month = String(indianDate.getMonth() + 1).padStart(2, '0');
    const day = String(indianDate.getDate()).padStart(2, '0');
    const hours = String(indianDate.getHours()).padStart(2, '0');
    const minutes = String(indianDate.getMinutes()).padStart(2, '0');
    
    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById('date').value = formattedDateTime;

    // Initialize amount paid input state
    document.getElementById('amountPaid').disabled = true;
    
    // Initialize test selection handlers
    initializeTestSelection();

    // Load saved records from localStorage
    const savedRecords = localStorage.getItem('patientRecords');
    if (savedRecords) {
        patientRecords = JSON.parse(savedRecords);
    }

    loadDoctorsAndTests();
});

let patientRecords = [];

function initializeTestSelection() {
    const testList = document.getElementById('testList');
    if (!testList) return;

    // Add change event listener to the test list container
    testList.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            calculateTotal();
        }
    });

    // Initial calculation
    calculateTotal();
}

function calculateTotal() {
    const checkboxes = document.querySelectorAll('#testList input[type="checkbox"]:checked');
    let total = 0;
    
    checkboxes.forEach(checkbox => {
        const price = parseInt(checkbox.dataset.price) || 0;
        total += price;
    });
    
    const totalElement = document.getElementById('totalAmount');
    totalElement.textContent = `₹${total}`;
    
    // Update max amount paid if payment status is 'done'
    const amountPaidInput = document.getElementById('amountPaid');
    if (amountPaidInput && !amountPaidInput.disabled) {
        amountPaidInput.max = total;
    }
}

document.querySelectorAll('#testList input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', calculateTotal);
});

// Add event listeners for all payment status radio buttons
document.querySelectorAll('input[name="paymentStatus"]').forEach(radio => {
    radio.addEventListener('change', function(e) {
        const amountPaidInput = document.getElementById('amountPaid');
        if (e.target.value === 'done') {
            amountPaidInput.required = true;
            const total = parseInt(document.getElementById('totalAmount').textContent.replace('₹', '')) || 0;
            amountPaidInput.max = total;
            amountPaidInput.disabled = false;
        } else {
            amountPaidInput.required = false;
            amountPaidInput.value = '';
            amountPaidInput.disabled = true;
        }
    });
});

// Add amount paid input validation
document.getElementById('amountPaid').addEventListener('input', function(e) {
    const total = parseInt(document.getElementById('totalAmount').textContent.replace('₹', '')) || 0;
    const paid = parseInt(e.target.value) || 0;
    
    if (paid > total) {
        alert('Amount paid cannot be greater than total amount');
        e.target.value = total;
    }
});

function saveToExcel(data) {
    const doctors = JSON.parse(localStorage.getItem('doctors') || '[]');
    const doctor = doctors.find(d => d.id === data.referringDoctor);
    
    const formattedData = {
        'Entry Date': new Date().toLocaleString('en-IN'),
        'Patient Name': data.name,
        'Age': data.age,
        'Gender': data.gender,
        'Referring Doctor': doctor ? doctor.name : data.referringDoctor,
        'Test Date': new Date(data.date).toLocaleString('en-IN'),
        'Tests': data.tests.map(t => t.name).join(', '),
        'Total Amount': `₹${data.totalAmount}`,
        'Payment Status': data.paymentStatus,
        'Amount Paid': `₹${data.amountPaid}`
    };

    // Add to records array
    patientRecords.push(formattedData);
    
    // Save to localStorage
    localStorage.setItem('patientRecords', JSON.stringify(patientRecords));
}

function downloadAllRecords() {
    if (patientRecords.length === 0) {
        alert('No records to download');
        return;
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(patientRecords);
    
    // Add column widths
    const colWidths = [
        {wch: 20}, // Entry Date
        {wch: 20}, // Patient Name
        {wch: 5},  // Age
        {wch: 15}, // Doctor
        {wch: 20}, // Test Date
        {wch: 30}, // Tests
        {wch: 12}, // Total Amount
        {wch: 12}, // Status
        {wch: 12}  // Amount Paid
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patient Records');
    XLSX.writeFile(workbook, 'all_patient_records.xlsx');
}

// Add event listener for download button
document.getElementById('downloadRecords').addEventListener('click', downloadAllRecords);

// Update the form submit handler
document.getElementById('dataEntryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const selectedTests = Array.from(document.querySelectorAll('#testList input[type="checkbox"]:checked'))
        .map(checkbox => ({
            name: checkbox.value,
            price: checkbox.dataset.price
        }));
    
    const formData = {
        name: document.getElementById('name').value,
        age: document.getElementById('age').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        referringDoctor: document.getElementById('referringDoctor').value,
        date: document.getElementById('date').value,
        tests: selectedTests,
        totalAmount: document.getElementById('totalAmount').textContent,
        paymentStatus: document.querySelector('input[name="paymentStatus"]:checked').value,
        amountPaid: document.getElementById('amountPaid').value || 0
    };

    if (!validateForm(formData)) {
        return;
    }

    try {
        saveToExcel(formData);
        console.log('Patient Test Data:', formData);
        alert('Test data saved successfully!');
        resetForm();
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data. Please try again.');
    }
});

function validateForm(data) {
    if (!data.name || data.name.length < 2) {
        alert('Please enter a valid patient name');
        return false;
    }

    if (!data.age || data.age < 0 || data.age > 150) {
        alert('Please enter a valid age');
        return false;
    }

    // Convert date to Indian timezone for validation
    try {
        const testDate = new Date(data.date);
        const now = new Date();
        if (testDate > now) {
            alert('Test date cannot be in the future');
            return false;
        }
    } catch (e) {
        alert('Please enter a valid date and time');
        return false;
    }

    if (!data.tests || data.tests.length === 0) {
        alert('Please select at least one test');
        return false;
    }

    if (!data.referringDoctor) {
        alert('Please select a referring doctor');
        return false;
    }

    const totalAmount = parseInt(data.totalAmount.replace('₹', '')) || 0;
    const amountPaid = parseInt(data.amountPaid) || 0;

    if (data.paymentStatus === 'done') {
        if (amountPaid <= 0) {
            alert('Amount paid must be greater than 0');
            return false;
        }
        if (amountPaid > totalAmount) {
            alert('Amount paid cannot be greater than total amount');
            return false;
        }
    }

    // Validate doctor exists
    const doctors = JSON.parse(localStorage.getItem('doctors') || '[]');
    if (!doctors.some(d => d.id === data.referringDoctor)) {
        alert('Please select a valid referring doctor');
        return false;
    }

    // Validate tests exist
    const selectedTests = data.tests.map(t => t.name);
    const availableTests = JSON.parse(localStorage.getItem('tests') || '[]')
        .map(t => t.name);
    
    const invalidTests = selectedTests.filter(t => !availableTests.includes(t));
    if (invalidTests.length > 0) {
        alert('Some selected tests are no longer available');
        return false;
    }

    return true;
}

document.getElementById('searchBtn').addEventListener('click', searchTests);
document.getElementById('testSearch').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchTests();
    }
});

function searchTests() {
    const searchTerm = document.getElementById('testSearch').value.toLowerCase().trim();
    const testItems = document.querySelectorAll('.test-item');
    
    testItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (searchTerm === '' || text.includes(searchTerm)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

function resetForm() {
    const form = document.getElementById('dataEntryForm');
    form.reset();
    document.getElementById('totalAmount').textContent = '₹0';
    document.getElementById('amountPaid').value = '';
    document.getElementById('amountPaid').disabled = true;
    document.getElementById('pending').checked = true;
    document.querySelectorAll('#testList input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="gender"]').forEach(radio => radio.checked = false);
    
    // Reset date to current Indian time
    const now = new Date();
    const indianTime = now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
    const indianDate = new Date(indianTime);
    
    const year = indianDate.getFullYear();
    const month = String(indianDate.getMonth() + 1).padStart(2, '0');
    const day = String(indianDate.getDate()).padStart(2, '0');
    const hours = String(indianDate.getHours()).padStart(2, '0');
    const minutes = String(indianDate.getMinutes()).padStart(2, '0');
    
    document.getElementById('date').value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

function loadDoctorsAndTests() {
    loadDoctorsList();
    loadTestsList();
    setupTestSearch();
}

function loadDoctorsList() {
    const doctors = JSON.parse(localStorage.getItem('doctors') || '[]');
    const doctorSelect = document.getElementById('referringDoctor');
    
    if (!doctors.length) {
        doctorSelect.innerHTML = '<option value="">No doctors available</option>';
        return;
    }

    doctorSelect.innerHTML = `
        <option value="">Select Doctor</option>
        ${doctors.map(doctor => `
            <option value="${doctor.id}" data-name="${doctor.name}">
                ${doctor.name}
            </option>
        `).join('')}
    `;
}

function loadTestsList() {
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const testList = document.getElementById('testList');
    
    if (!tests.length) {
        testList.innerHTML = '<p>No tests available</p>';
        return;
    }

    testList.innerHTML = tests.map(test => `
        <div class="test-item">
            <input type="checkbox" 
                   id="test_${test.name.replace(/\s+/g, '_')}"
                   value="${test.name}"
                   data-price="${test.price}">
            <label for="test_${test.name.replace(/\s+/g, '_')}">
                ${test.name}
                <span class="test-price">₹${test.price}</span>
            </label>
        </div>
    `).join('');

    // Add change listeners for test selection
    testList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            calculateTotal();
            updateTestSummary();
        });
    });
}

function setupTestSearch() {
    const searchInput = document.getElementById('testSearch');
    const testItems = document.querySelectorAll('.test-item');

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        testItems.forEach(item => {
            const testName = item.querySelector('label').textContent.toLowerCase();
            item.classList.toggle('hidden', !testName.includes(searchTerm));
        });
    });
}

function updateTestSummary() {
    const selectedTests = document.querySelectorAll('#testList input[type="checkbox"]:checked');
    const totalTests = selectedTests.length;
    const totalAmount = calculateTotal();
    
    // Update UI to show selected tests count
    const summaryElement = document.querySelector('.test-summary') || 
                          document.createElement('div');
    summaryElement.className = 'test-summary';
    summaryElement.innerHTML = `
        <strong>${totalTests}</strong> test${totalTests !== 1 ? 's' : ''} selected
    `;
}

// Update form validation
function validateForm(data) {
    if (!data.name || data.name.length < 2) {
        alert('Please enter a valid patient name');
        return false;
    }

    if (!data.age || data.age < 0 || data.age > 150) {
        alert('Please enter a valid age');
        return false;
    }

    // Convert date to Indian timezone for validation
    try {
        const testDate = new Date(data.date);
        const now = new Date();
        if (testDate > now) {
            alert('Test date cannot be in the future');
            return false;
        }
    } catch (e) {
        alert('Please enter a valid date and time');
        return false;
    }

    if (!data.tests || data.tests.length === 0) {
        alert('Please select at least one test');
        return false;
    }

    if (!data.referringDoctor) {
        alert('Please select a referring doctor');
        return false;
    }

    const totalAmount = parseInt(data.totalAmount.replace('₹', '')) || 0;
    const amountPaid = parseInt(data.amountPaid) || 0;

    if (data.paymentStatus === 'done') {
        if (amountPaid <= 0) {
            alert('Amount paid must be greater than 0');
            return false;
        }
        if (amountPaid > totalAmount) {
            alert('Amount paid cannot be greater than total amount');
            return false;
        }
    }

    // Validate doctor exists
    const doctors = JSON.parse(localStorage.getItem('doctors') || '[]');
    if (!doctors.some(d => d.id === data.referringDoctor)) {
        alert('Please select a valid referring doctor');
        return false;
    }

    // Validate tests exist
    const selectedTests = data.tests.map(t => t.name);
    const availableTests = JSON.parse(localStorage.getItem('tests') || '[]')
        .map(t => t.name);
    
    const invalidTests = selectedTests.filter(t => !availableTests.includes(t));
    if (invalidTests.length > 0) {
        alert('Some selected tests are no longer available');
        return false;
    }

    return true;
}
