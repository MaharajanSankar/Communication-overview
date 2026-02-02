const API_URL = 'http://localhost:5000/api/auth';

// --- Form elements ---
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

// --- Switch between login and register ---
showRegisterLink.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
  document.getElementById('loginMessage').innerHTML = '';
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
  document.getElementById('registerMessage').innerHTML = '';
});

// --- Check profile completion and redirect accordingly ---
async function redirectAfterLogin(token, user) {
  try {
    const response = await fetch('http://localhost:5000/api/details/check', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();

    if (result.hasCompleted) {
      // Profile completed, go to employee directory
      window.location.href = '/employee-directory/index.html';
    } else {
      // Profile not completed, go to personal details
      window.location.href = '/personal-details/index.html';
    }
  } catch (error) {
    // If check fails, redirect to personal details to be safe
    window.location.href = '/personal-details/index.html';
  }
}

// --- Login form submission with OTP ---
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const messageEl = document.getElementById('loginMessage');
  const loginText = document.getElementById('loginText');
  const loginLoader = document.getElementById('loginLoader');
  const submitBtn = loginForm.querySelector('button[type="submit"]');

  submitBtn.disabled = true;
  loginText.style.display = 'none';
  loginLoader.style.display = 'inline';
  messageEl.innerHTML = '';

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.requiresOtp) {
      // --- OTP flow ---
      loginForm.style.display = 'none';
      document.getElementById('otpSection').style.display = 'block';
      document.getElementById('otpMessage').innerHTML = '';

      // OTP input handling
      document.querySelector('.otp-input').focus();
      document.querySelectorAll('.otp-input').forEach((input, index) => {
        input.addEventListener('input', () => {
          if (input.value.length === 1 && index < 3) {
            document.querySelectorAll('.otp-input')[index + 1].focus();
          }
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && input.value === '' && index > 0) {
            document.querySelectorAll('.otp-input')[index - 1].focus();
          }
        });
      });

      document.getElementById('verifyOtpBtn').onclick = async () => {
        const otpInputs = document.querySelectorAll('.otp-input');
        const otp = Array.from(otpInputs).map(input => input.value).join('');

        if (otp.length !== 4 || isNaN(otp)) {
          document.getElementById('otpMessage').innerHTML = '<div class="error">Please enter a valid 4-digit OTP</div>';
          return;
        }

        document.getElementById('verifyOtpBtn').disabled = true;
        document.getElementById('verifyOtpBtn').textContent = 'Verifying...';

        try {
          const verifyRes = await fetch(`${API_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: result.userId, otp }),
          });

          const verifyResult = await verifyRes.json();

          if (verifyResult.success) {
            localStorage.setItem('token', verifyResult.token);
            localStorage.setItem('user', JSON.stringify(verifyResult.user));
            document.getElementById('otpMessage').innerHTML = '<div class="success">OTP Verified! Redirecting...</div>';
            
            // Check profile completion before redirecting
            setTimeout(() => {
              redirectAfterLogin(verifyResult.token, verifyResult.user);
            }, 1000);
          } else {
            document.getElementById('otpMessage').innerHTML = `<div class="error">${verifyResult.message || 'Invalid OTP'}</div>`;
            document.getElementById('verifyOtpBtn').disabled = false;
            document.getElementById('verifyOtpBtn').textContent = 'Verify OTP';
          }
        } catch (error) {
          document.getElementById('otpMessage').innerHTML = '<div class="error">Verification failed. Try again.</div>';
          document.getElementById('verifyOtpBtn').disabled = false;
          document.getElementById('verifyOtpBtn').textContent = 'Verify OTP';
        }
      };
    } else if (result.success) {
      // --- Direct login fallback ---
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      messageEl.innerHTML = '<div class="success">Login successful! Redirecting...</div>';
      
      // Check profile completion before redirecting
      setTimeout(() => {
        redirectAfterLogin(result.token, result.user);
      }, 1000);
    } else {
      messageEl.innerHTML = `<div class="error">${result.message}</div>`;
    }
  } catch (error) {
    console.error('Login error:', error);
    messageEl.innerHTML = '<div class="error">Login failed. Check connection.</div>';
  } finally {
    submitBtn.disabled = false;
    loginText.style.display = 'inline';
    loginLoader.style.display = 'none';
  }
});

// --- Register form submission ---
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  const messageEl = document.getElementById('registerMessage');
  const registerText = document.getElementById('registerText');
  const registerLoader = document.getElementById('registerLoader');
  const submitBtn = registerForm.querySelector('button[type="submit"]');

  if (password !== confirmPassword) {
    messageEl.innerHTML = '<div class="error">Passwords do not match</div>';
    return;
  }

  submitBtn.disabled = true;
  registerText.style.display = 'none';
  registerLoader.style.display = 'inline';
  messageEl.innerHTML = '';

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const result = await response.json();

    if (result.success) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      messageEl.innerHTML = '<div class="success">Registration successful! Redirecting...</div>';
      
      // New users always go to personal details first
      setTimeout(() => {
        window.location.href = '/personal-details/index.html';
      }, 1000);
    } else {
      messageEl.innerHTML = `<div class="error">${result.message}</div>`;
    }
  } catch (error) {
    messageEl.innerHTML = '<div class="error">Registration failed. Try again.</div>';
  } finally {
    submitBtn.disabled = false;
    registerText.style.display = 'inline';
    registerLoader.style.display = 'none';
  }
});

// Check if user is already logged in
if (localStorage.getItem('token')) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  redirectAfterLogin(token, user);
}