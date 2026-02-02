// Check if user is logged in
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
  window.location.href = '/login/index.html';
}

// API Configuration with Authorization
const API_URL = 'http://localhost:5000/api/employees';

const employeeTableBody = document.querySelector('#employeeTable tbody');
const emptyMessage = document.getElementById('emptyMessage');
const searchBtn = document.getElementById('searchBtn');
const addBtn = document.getElementById('addBtn');
const searchInput = document.getElementById('employeeId');
const searchMessage = document.getElementById('searchMessage');

const formSection = document.getElementById('formSection');
const formCloseBtn = document.getElementById('formCloseBtn');
const cancelBtn = document.getElementById('cancelBtn');
const entryForm = document.getElementById('entryForm');
const formTitle = document.getElementById('formTitle');

const viewSection = document.getElementById('viewSection');
const viewCloseBtn = document.getElementById('viewCloseBtn');

const v_employeeId = document.getElementById('v_employeeId');
const v_mobile = document.getElementById('v_mobile');
const v_companyEmail = document.getElementById('v_companyEmail');
const v_personalEmail = document.getElementById('v_personalEmail');
const v_clientId = document.getElementById('v_clientId');
const v_emergencyContact = document.getElementById('v_emergencyContact');
const v_vop = document.getElementById('v_vop');
const v_communicated = document.getElementById('v_communicated');
const v_beginDate = document.getElementById('v_beginDate');
const v_endDate = document.getElementById('v_endDate');

let employees = [];
let editingId = null;

// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login/index.html';
}

// Validation helpers
function validateMobile(number) {
  const mobileRegex = /^[0-9]{10}$/;
  return mobileRegex.test(number);
}

function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// API calls with Authorization
async function fetchEmployees() {
  try {
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401) {
      logout();
      return;
    }
    
    const result = await response.json();
    
    if (result.success) {
      employees = result.data;
      renderTable();
    }
  } catch (error) {
    console.error('Error fetching employees:', error);
    alert('Failed to load employees. Please check if the server is running.');
  }
}

async function createEmployee(data) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    
    if (response.status === 401) {
      logout();
      return false;
    }
    
    const result = await response.json();
    
    if (result.success) {
      await fetchEmployees();
      return true;
    } else {
      alert(result.message || 'Failed to create employee');
      return false;
    }
  } catch (error) {
    console.error('Error creating employee:', error);
    alert('Failed to create employee. Please try again.');
    return false;
  }
}

async function updateEmployee(id, data) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    
    if (response.status === 401) {
      logout();
      return false;
    }
    
    const result = await response.json();
    
    if (result.success) {
      await fetchEmployees();
      return true;
    } else {
      alert(result.message || 'Failed to update employee');
      return false;
    }
  } catch (error) {
    console.error('Error updating employee:', error);
    alert('Failed to update employee. Please try again.');
    return false;
  }
}

async function deleteEmployee(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401) {
      logout();
      return false;
    }
    
    const result = await response.json();
    
    if (result.success) {
      await fetchEmployees();
      return true;
    } else {
      alert(result.message || 'Failed to delete employee');
      return false;
    }
  } catch (error) {
    console.error('Error deleting employee:', error);
    alert('Failed to delete employee. Please try again.');
    return false;
  }
}

async function searchEmployeeById(employeeId) {
  try {
    const response = await fetch(`${API_URL}/search/${employeeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401) {
      logout();
      return null;
    }
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Error searching employee:', error);
    return null;
  }
}

function renderTable() {
  employeeTableBody.innerHTML = '';
  if (employees.length === 0) {
    emptyMessage.style.display = 'block';
    return;
  }
  emptyMessage.style.display = 'none';
  employees.forEach((e) => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', e._id);
    tr.innerHTML = `
      <td>${escapeHtml(e.employeeId)}</td>
      <td>${escapeHtml(e.mobile)}</td>
      <td>${escapeHtml(e.companyEmail)}</td>
      <td>${escapeHtml(e.personalEmail || '')}</td>
      <td>${escapeHtml(e.clientId || '')}</td>
      <td>${escapeHtml(e.emergencyContact || '')}</td>
      <td>${escapeHtml(e.vop || '')}</td>
      <td>${escapeHtml(e.communicated || '')}</td>
      <td>${escapeHtml(e.beginDate ? new Date(e.beginDate).toLocaleDateString() : '')}</td>
      <td>${escapeHtml(e.endDate ? new Date(e.endDate).toLocaleDateString() : '')}</td>
      <td class="actions">
        <button data-action="view" data-id="${e._id}" class="btn" style=" background: #28a745;
  color: white;padding=5px;" >View</button>
        <button data-action="edit" data-id="${e._id}" class="btn" style="background: #007bff;
  color: white;padding=5px;">Edit</button>
        <button data-action="delete" data-id="${e._id}" class="btn" style="background: #dc3545;
  color: white;padding=5px">Delete</button>
      </td>
    `;
    employeeTableBody.appendChild(tr);
  });
}

function escapeHtml(s = '') {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function openForm(mode = 'add', employee = null) {
  closeView();
  entryForm.reset();
  
  if (mode === 'add') {
    editingId = null;
    formTitle.textContent = 'Add Employee Entry';
    if (searchInput.value.trim()) {
      entryForm.elements['employeeId'].value = searchInput.value.trim();
    }
  } else {
    formTitle.textContent = 'Edit Employee Entry';
    editingId = employee._id;
    
    entryForm.elements['employeeId'].value = employee.employeeId || '';
    
    // Split mobile number
    if (employee.mobile) {
      const mobileParts = employee.mobile.split(' ');
      if (mobileParts.length === 2) {
        entryForm.elements['mobileCode'].value = mobileParts[0];
        entryForm.elements['mobile'].value = mobileParts[1];
      }
    }
    
    entryForm.elements['companyEmail'].value = employee.companyEmail || '';
    entryForm.elements['personalEmail'].value = employee.personalEmail || '';
    entryForm.elements['clientId'].value = employee.clientId || '';
    
    // Split emergency contact
    if (employee.emergencyContact) {
      const emergencyParts = employee.emergencyContact.split(' ');
      if (emergencyParts.length === 2) {
        entryForm.elements['emergencyCode'].value = emergencyParts[0];
        entryForm.elements['emergencyContact'].value = emergencyParts[1];
      }
    }
    
    entryForm.elements['vop'].value = employee.vop || '';
    entryForm.elements['communicated'].value = employee.communicated || '';
    entryForm.elements['beginDate'].value = employee.beginDate ? employee.beginDate.split('T')[0] : '';
    entryForm.elements['endDate'].value = employee.endDate ? employee.endDate.split('T')[0] : '';
  }
  
  formSection.classList.add('active');
  formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => entryForm.elements['employeeId'].focus(), 400);
}

function closeForm() {
  formSection.classList.remove('active');
  editingId = null;
}

function openView(employee) {
  closeForm();
  
  v_employeeId.textContent = employee.employeeId || '';
  v_mobile.textContent = employee.mobile || '';
  v_companyEmail.textContent = employee.companyEmail || '';
  v_personalEmail.textContent = employee.personalEmail || '';
  v_clientId.textContent = employee.clientId || '';
  v_emergencyContact.textContent = employee.emergencyContact || '';
  v_vop.textContent = employee.vop || '';
  v_communicated.textContent = employee.communicated || '';
  v_beginDate.textContent = employee.beginDate ? new Date(employee.beginDate).toLocaleDateString() : '';
  v_endDate.textContent = employee.endDate ? new Date(employee.endDate).toLocaleDateString() : '';

  viewSection.classList.add('active');
  viewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeView() {
  viewSection.classList.remove('active');
}

async function searchEmployee() {
  const id = searchInput.value.trim();
  searchMessage.textContent = '';
  document.querySelectorAll('#employeeTable tbody tr').forEach(tr => tr.classList.remove('row-highlight'));

  if (!id) {
    searchMessage.textContent = 'Please enter an Employee ID to search.';
    return;
  }

  const employee = await searchEmployeeById(id);
  
  if (!employee) {
    searchMessage.textContent = `No employee found with ID "${id}".`;
    return;
  }

  const row = document.querySelector(`tr[data-id="${employee._id}"]`);
  if (row) {
    row.classList.add('row-highlight');
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    searchMessage.textContent = `Found employee "${employee.employeeId}". You can edit using the Edit button.`;
  }
}

// Event handlers
searchBtn.addEventListener('click', (e) => {
  e.preventDefault();
  searchEmployee();
});

addBtn.addEventListener('click', (e) => {
  e.preventDefault();
  openForm('add');
});

formCloseBtn.addEventListener('click', closeForm);
cancelBtn.addEventListener('click', closeForm);
viewCloseBtn.addEventListener('click', closeView);

// Only allow numbers in mobile and emergency contact fields
document.getElementById('e_mobile').addEventListener('input', function(e) {
  this.value = this.value.replace(/[^0-9]/g, '');
});

document.getElementById('e_emergencyContact').addEventListener('input', function(e) {
  this.value = this.value.replace(/[^0-9]/g, '');
});

entryForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const form = ev.target;

  const mobileNumber = (form.elements['mobile'].value || '').trim();
  const mobileCode = form.elements['mobileCode'].value;
  const emergencyNumber = (form.elements['emergencyContact'].value || '').trim();
  const emergencyCode = form.elements['emergencyCode'].value;
  const companyEmail = (form.elements['companyEmail'].value || '').trim();
  const personalEmail = (form.elements['personalEmail'].value || '').trim();

  // Validate required fields
  if (!form.elements['employeeId'].value.trim() || !mobileNumber || !companyEmail) {
    alert('Please fill required fields: Employee ID, Mobile, and Company Email.');
    return;
  }

  // Validate mobile number
  if (!validateMobile(mobileNumber)) {
    alert('Mobile number must be exactly 10 digits.');
    return;
  }

  // Validate company email
  if (!validateEmail(companyEmail)) {
    alert('Company email must be valid and contain @ and a domain (e.g., .com).');
    return;
  }

  // Validate personal email if provided
  if (personalEmail && !validateEmail(personalEmail)) {
    alert('Personal email must be valid and contain @ and a domain (e.g., .com).');
    return;
  }

  // Validate emergency contact if provided
  if (emergencyNumber && !validateMobile(emergencyNumber)) {
    alert('Emergency contact must be exactly 10 digits.');
    return;
  }

  const data = {
    employeeId: form.elements['employeeId'].value.trim(),
    mobile: `${mobileCode} ${mobileNumber}`,
    companyEmail: companyEmail,
    personalEmail: personalEmail,
    clientId: (form.elements['clientId'].value || '').trim(),
    emergencyContact: emergencyNumber ? `${emergencyCode} ${emergencyNumber}` : '',
    vop: (form.elements['vop'].value || '').trim(),
    communicated: (form.elements['communicated'].value || '').trim(),
    beginDate: form.elements['beginDate'].value || null,
    endDate: form.elements['endDate'].value || null
  };

  if (data.beginDate && data.endDate && new Date(data.endDate) < new Date(data.beginDate)) {
    if (!confirm('End Date is before Begin Date. Do you want to continue?')) return;
  }

  let success;
  if (editingId) {
    success = await updateEmployee(editingId, data);
  } else {
    success = await createEmployee(data);
  }

  if (success) {
    closeForm();
  }
});

employeeTableBody.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('button');
  if (!btn) return;
  
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const employee = employees.find(e => e._id === id);
  
  if (!employee) return;
  
  if (action === 'edit') {
    openForm('edit', employee);
  } else if (action === 'delete') {
    if (confirm(`Delete entry for Employee ID "${employee.employeeId}"?`)) {
      await deleteEmployee(id);
    }
  } else if (action === 'view') {
    openView(employee);
  }
});

// Display user info in console
console.log('Logged in as:', user.username, '(' + user.email + ')');

// Load employees on page load
fetchEmployees();