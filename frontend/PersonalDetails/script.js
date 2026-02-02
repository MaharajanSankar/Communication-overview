// Check if user is logged in
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login/index.html';
}

const API_URL = 'http://localhost:5000/api';

let fileURL = "";

function enableView() {
  const file = document.getElementById("fileInput").files[0];
  if (file) {
    fileURL = URL.createObjectURL(file);
    document.getElementById("viewBtn").disabled = false;
  }
}

function viewFile() {
  if (fileURL) window.open(fileURL, "_blank");
}

function viewMarksheet() {
  const file = document.getElementById("marksheet").files[0];
  if (file) {
    window.open(URL.createObjectURL(file), "_blank");
  } else {
    alert("Please select a file to view");
  }
}

// Form submission
document.getElementById('regForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const submitBtn = document.querySelector('.submit-btn');
  const originalText = submitBtn.innerHTML;

  submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
  submitBtn.disabled = true;

  const formData = new FormData(this);

  try {
    const response = await fetch(`${API_URL}/details/save`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      // Show success state
      submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
      submitBtn.style.background = '#10b981';

      // Store user info
      localStorage.setItem('userFullName', result.fullName);
      localStorage.setItem('hasCompletedProfile', 'true');

      setTimeout(() => {
        window.location.href = '/employee-directory/index.html';
      }, 1000);
    } else {
      alert('Error: ' + (result.error || result.message));
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  } catch (error) {
    console.error('Submission error:', error);
    alert('Submission failed: ' + error.message);
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

// Check if user has already completed profile
async function checkProfileCompletion() {
  try {
    const response = await fetch(`${API_URL}/details/check`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();

    if (result.hasCompleted) {
      // User already completed, redirect to employee directory
      window.location.href = '/employee-directory/index.html';
    }
  } catch (error) {
    console.error('Profile check error:', error);
  }
}

// Run on page load
checkProfileCompletion();