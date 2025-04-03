// Initialize storage
function initializeStorage() {
    if (!localStorage.getItem('doctors')) {
        localStorage.setItem('doctors', JSON.stringify([]));
    }
    if (!localStorage.getItem('tests')) {
        localStorage.setItem('tests', JSON.stringify([]));
    }
}

// Load data on page load
window.addEventListener('load', function() {
    initializeStorage();
    displayDoctors();
    displayTests();
    document.getElementById('uploadBackup').addEventListener('change', handleBackupUpload);
});

// Doctors Management
function addDoctor() {
    const name = document.getElementById('doctorName').value.trim();
    const id = document.getElementById('doctorId').value.trim();
    
    if (!name || !id) {
        alert('Please fill in all fields');
        return;
    }
    
    const doctors = JSON.parse(localStorage.getItem('doctors'));
    
    // Check for duplicate ID
    if (doctors.some(doc => doc.id === id)) {
        alert('Doctor ID already exists');
        return;
    }

    doctors.push({ id, name });
    // Sort doctors by name
    doctors.sort((a, b) => a.name.localeCompare(b.name));
    
    localStorage.setItem('doctors', JSON.stringify(doctors));
    document.getElementById('doctorName').value = '';
    document.getElementById('doctorId').value = '';
    displayDoctors();
}

function displayDoctors() {
    const doctors = JSON.parse(localStorage.getItem('doctors'));
    const list = document.getElementById('doctorsList');
    
    list.innerHTML = doctors.map((doctor, index) => `
        <div class="data-item">
            <div class="data-item-content">
                <div class="data-item-title">${doctor.name}</div>
                <div class="data-item-subtitle">ID: ${doctor.id}</div>
            </div>
            <button onclick="deleteDoctor(${index})" class="delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function deleteDoctor(index) {
    if (confirm('Are you sure you want to delete this doctor?')) {
        const doctors = JSON.parse(localStorage.getItem('doctors'));
        doctors.splice(index, 1);
        localStorage.setItem('doctors', JSON.stringify(doctors));
        displayDoctors();
    }
}

// Tests Management
function addTest() {
    const name = document.getElementById('testName').value.trim();
    const price = document.getElementById('testPrice').value;
    
    if (!name || !price) {
        alert('Please fill in all fields');
        return;
    }
    
    const tests = JSON.parse(localStorage.getItem('tests'));
    
    // Check for duplicate test name
    if (tests.some(test => test.name.toLowerCase() === name.toLowerCase())) {
        alert('Test already exists');
        return;
    }

    tests.push({ name, price: parseFloat(price) });
    // Sort tests by name
    tests.sort((a, b) => a.name.localeCompare(b.name));
    
    localStorage.setItem('tests', JSON.stringify(tests));
    document.getElementById('testName').value = '';
    document.getElementById('testPrice').value = '';
    displayTests();
}

function displayTests() {
    const tests = JSON.parse(localStorage.getItem('tests'));
    const list = document.getElementById('testsList');
    
    list.innerHTML = tests.map((test, index) => `
        <div class="data-item">
            <div class="data-item-content">
                <div class="data-item-title">${test.name}</div>
                <div class="data-item-subtitle">Price: ₹${test.price}</div>
            </div>
            <button onclick="deleteTest(${index})" class="delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function deleteTest(index) {
    if (confirm('Are you sure you want to delete this test?')) {
        const tests = JSON.parse(localStorage.getItem('tests'));
        tests.splice(index, 1);
        localStorage.setItem('tests', JSON.stringify(tests));
        displayTests();
    }
}

function backupDatabase() {
    const backup = {
        doctors: JSON.parse(localStorage.getItem('doctors') || '[]'),
        tests: JSON.parse(localStorage.getItem('tests') || '[]'),
        patientRecords: JSON.parse(localStorage.getItem('patientRecords') || '[]'),
        timestamp: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic_backup_${formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function handleBackupUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            // Validate backup format
            if (!backup.version || !backup.timestamp || !backup.doctors || !backup.tests) {
                throw new Error('Invalid backup file format');
            }

            // Ask for confirmation
            if (confirm('This will replace all existing data. Are you sure you want to continue?')) {
                // Restore data
                localStorage.setItem('doctors', JSON.stringify(backup.doctors));
                localStorage.setItem('tests', JSON.stringify(backup.tests));
                if (backup.patientRecords) {
                    localStorage.setItem('patientRecords', JSON.stringify(backup.patientRecords));
                }

                // Refresh displays
                displayDoctors();
                displayTests();
                alert('Backup restored successfully!');
            }
        } catch (error) {
            alert('Error loading backup file: ' + error.message);
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}
