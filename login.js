// ============================================
// CROWN CHEMICAL - COMPLETE AUTH SYSTEM
// Features: Registration, Login, Password Reset, Dashboard
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("🔐 Crown Chemical Auth System Loaded");

  // ============================================
  // CONFIGURATION
  // ============================================
  
  const CONFIG = {
    passwordMinLength: 8,
    sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
    rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    otpExpiryTime: 300, // 5 minutes in seconds
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  // Hash password (simple hash for demo - use bcrypt in production)
  function hashPassword(password) {
    // Simple hash for demo - in production, backend handles this with bcrypt
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  // Validate email
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Validate password strength
  function validatePassword(password) {
    const minLength = password.length >= CONFIG.passwordMinLength;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    
    return {
      valid: minLength && hasNumber && hasLetter,
      minLength,
      hasNumber,
      hasLetter,
      strength: calculatePasswordStrength(password)
    };
  }

  // Calculate password strength
  function calculatePasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(100, strength);
  }

  // Generate OTP
  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Show notification
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `auth-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button class="close-notification">&times;</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);

    notification.querySelector('.close-notification').addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    });

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // ============================================
  // DATA MANAGEMENT
  // ============================================

  // Get all users
  function getUsers() {
    return JSON.parse(localStorage.getItem('crown_users')) || [];
  }

  // Save users
  function saveUsers(users) {
    localStorage.setItem('crown_users', JSON.stringify(users));
  }

  // Get current session
  function getCurrentSession() {
    const session = localStorage.getItem('crown_session');
    if (!session) return null;
    
    const sessionData = JSON.parse(session);
    const now = Date.now();
    
    // Check if session expired
    if (now > sessionData.expiresAt) {
      localStorage.removeItem('crown_session');
      return null;
    }
    
    return sessionData;
  }

  // Create session
  function createSession(user, rememberMe = false) {
    const duration = rememberMe ? CONFIG.rememberMeDuration : CONFIG.sessionDuration;
    const session = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      companyName: user.companyName,
      businessType: user.businessType,
      createdAt: Date.now(),
      expiresAt: Date.now() + duration,
      rememberMe
    };
    
    localStorage.setItem('crown_session', JSON.stringify(session));
    return session;
  }

  // Logout
  function logout() {
    localStorage.removeItem('crown_session');
    window.location.href = 'auth.html';
  }

  // ============================================
  // REGISTRATION
  // ============================================

  function registerUser(userData) {
    const users = getUsers();
    
    // Check if email already exists
    if (users.find(u => u.email === userData.email)) {
      return { success: false, message: 'Email already registered' };
    }
    
    // Check if phone already exists
    if (users.find(u => u.phone === userData.phone)) {
      return { success: false, message: 'Phone number already registered' };
    }
    
    // Create new user
    const newUser = {
      id: 'USER_' + Date.now(),
      ...userData,
      password: hashPassword(userData.password),
      createdAt: Date.now(),
      verified: false, // Email verification pending
      orders: [],
      addresses: userData.address ? [userData.address] : [],
      favorites: [],
      creditTerms: null
    };
    
    users.push(newUser);
    saveUsers(users);
    
    return { success: true, user: newUser };
  }

  // ============================================
  // LOGIN
  // ============================================

  function loginUser(email, password, rememberMe = false) {
    const users = getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return { success: false, message: 'Email not found' };
    }
    
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return { success: false, message: 'Incorrect password' };
    }
    
    // Create session
    const session = createSession(user, rememberMe);
    
    return { success: true, user, session };
  }

  // ============================================
  // PASSWORD RESET
  // ============================================

  function requestPasswordReset(email) {
    const users = getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return { success: false, message: 'Email not found' };
    }
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + (CONFIG.otpExpiryTime * 1000);
    
    // Save OTP
    const resetData = {
      email,
      otp,
      expiresAt
    };
    localStorage.setItem('password_reset', JSON.stringify(resetData));
    
    // In production, send OTP via email
    console.log('📧 Password Reset OTP:', otp);
    alert(`Password Reset OTP: ${otp}\n\n(In production, this will be sent to your email)`);
    
    return { success: true, otp }; // Don't return OTP in production!
  }

  function verifyResetOTP(email, otp) {
    const resetData = JSON.parse(localStorage.getItem('password_reset'));
    
    if (!resetData) {
      return { success: false, message: 'No reset request found' };
    }
    
    if (resetData.email !== email) {
      return { success: false, message: 'Email mismatch' };
    }
    
    if (Date.now() > resetData.expiresAt) {
      localStorage.removeItem('password_reset');
      return { success: false, message: 'OTP expired' };
    }
    
    if (resetData.otp !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }
    
    return { success: true };
  }

  function resetPassword(email, newPassword) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) {
      return { success: false, message: 'User not found' };
    }
    
    // Update password
    users[userIndex].password = hashPassword(newPassword);
    saveUsers(users);
    
    // Clear reset data
    localStorage.removeItem('password_reset');
    
    return { success: true };
  }

  // ============================================
  // CUSTOMER DASHBOARD FUNCTIONS
  // ============================================

  function getUserOrders(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    return user ? user.orders : [];
  }

  function addOrder(userId, orderData) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return false;
    
    const order = {
      id: 'ORDER_' + Date.now(),
      ...orderData,
      createdAt: Date.now(),
      status: 'pending'
    };
    
    users[userIndex].orders.push(order);
    saveUsers(users);
    
    return order;
  }

  function toggleFavorite(userId, productId) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return false;
    
    const favorites = users[userIndex].favorites || [];
    const index = favorites.indexOf(productId);
    
    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(productId);
    }
    
    users[userIndex].favorites = favorites;
    saveUsers(users);
    
    return favorites;
  }

  function updateUserProfile(userId, updates) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return false;
    
    // Don't allow email or password updates here
    delete updates.email;
    delete updates.password;
    delete updates.id;
    
    users[userIndex] = { ...users[userIndex], ...updates };
    saveUsers(users);
    
    return users[userIndex];
  }

  // ============================================
  // PAGE-SPECIFIC HANDLERS
  // ============================================

  // Check if on auth page
  const authPage = document.querySelector('.auth-page');
  const dashboardPage = document.querySelector('.dashboard-page');

  // ============================================
  // REGISTRATION FORM HANDLER
  // ============================================

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    const passwordInput = registerForm.querySelector('input[name="password"]');
    const confirmPasswordInput = registerForm.querySelector('input[name="confirmPassword"]');
    const strengthMeter = document.querySelector('.password-strength-meter');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');

    // Password strength indicator
    if (passwordInput && strengthMeter) {
      passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const validation = validatePassword(password);
        
        strengthBar.style.width = validation.strength + '%';
        
        if (validation.strength < 40) {
          strengthBar.className = 'strength-bar weak';
          strengthText.textContent = 'Weak';
        } else if (validation.strength < 70) {
          strengthBar.className = 'strength-bar medium';
          strengthText.textContent = 'Medium';
        } else {
          strengthBar.className = 'strength-bar strong';
          strengthText.textContent = 'Strong';
        }
        
        strengthMeter.style.display = password ? 'block' : 'none';
      });
    }

    // Form submission
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(registerForm);
      const userData = {
        email: formData.get('email').trim().toLowerCase(),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        fullName: formData.get('fullName').trim(),
        phone: formData.get('phone').trim(),
        companyName: formData.get('companyName')?.trim() || null,
        businessType: formData.get('businessType'),
        address: formData.get('address')?.trim() || null
      };

      // Validation
      if (!isValidEmail(userData.email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
      }

      const passwordValidation = validatePassword(userData.password);
      if (!passwordValidation.valid) {
        showNotification('Password must be at least 8 characters and include letters and numbers', 'error');
        return;
      }

      if (userData.password !== userData.confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
      }

      if (!userData.fullName || userData.fullName.length < 3) {
        showNotification('Please enter your full name', 'error');
        return;
      }

      if (!userData.phone || userData.phone.length < 10) {
        showNotification('Please enter a valid phone number', 'error');
        return;
      }

      // Register user
      const result = registerUser(userData);
      
      if (result.success) {
        showNotification('Account created successfully! Please login.', 'success');
        
        // Switch to login form after 2 seconds
        setTimeout(() => {
          const loginTab = document.querySelector('[data-tab="login"]');
          if (loginTab) loginTab.click();
        }, 2000);
        
        registerForm.reset();
      } else {
        showNotification(result.message, 'error');
      }
    });
  }

  // ============================================
  // LOGIN FORM HANDLER
  // ============================================

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = loginForm.querySelector('input[name="email"]').value.trim().toLowerCase();
      const password = loginForm.querySelector('input[name="password"]').value;
      const rememberMe = loginForm.querySelector('input[name="rememberMe"]')?.checked || false;

      if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
      }

      const result = loginUser(email, password, rememberMe);
      
      if (result.success) {
        showNotification('Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } else {
        showNotification(result.message, 'error');
      }
    });
  }

  // ============================================
  // PASSWORD RESET HANDLERS
  // ============================================

  const forgotPasswordForm = document.getElementById('forgot-password-form');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = forgotPasswordForm.querySelector('input[name="email"]').value.trim().toLowerCase();
      
      if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
      }

      const result = requestPasswordReset(email);
      
      if (result.success) {
        showNotification('OTP sent! Check your email.', 'success');
        
        // Show OTP verification form
        document.getElementById('forgot-password-step').style.display = 'none';
        document.getElementById('verify-otp-step').style.display = 'block';
        
        // Store email for next step
        sessionStorage.setItem('reset_email', email);
      } else {
        showNotification(result.message, 'error');
      }
    });
  }

  const verifyOTPForm = document.getElementById('verify-otp-form');
  if (verifyOTPForm) {
    verifyOTPForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const otp = verifyOTPForm.querySelector('input[name="otp"]').value.trim();
      const email = sessionStorage.getItem('reset_email');
      
      if (!otp || otp.length !== 6) {
        showNotification('Please enter a valid 6-digit OTP', 'error');
        return;
      }

      const result = verifyResetOTP(email, otp);
      
      if (result.success) {
        showNotification('OTP verified! Set your new password.', 'success');
        
        // Show new password form
        document.getElementById('verify-otp-step').style.display = 'none';
        document.getElementById('new-password-step').style.display = 'block';
      } else {
        showNotification(result.message, 'error');
      }
    });
  }

  const newPasswordForm = document.getElementById('new-password-form');
  if (newPasswordForm) {
    newPasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const newPassword = newPasswordForm.querySelector('input[name="newPassword"]').value;
      const confirmPassword = newPasswordForm.querySelector('input[name="confirmPassword"]').value;
      const email = sessionStorage.getItem('reset_email');
      
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        showNotification('Password must be at least 8 characters and include letters and numbers', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
      }

      const result = resetPassword(email, newPassword);
      
      if (result.success) {
        showNotification('Password reset successful! Please login.', 'success');
        sessionStorage.removeItem('reset_email');
        
        setTimeout(() => {
          window.location.href = 'auth.html';
        }, 2000);
      } else {
        showNotification(result.message, 'error');
      }
    });
  }

  // ============================================
  // DASHBOARD HANDLERS
  // ============================================

  if (dashboardPage) {
    const session = getCurrentSession();
    
    if (!session) {
      window.location.href = 'auth.html';
      return;
    }

    // Load user data
    const users = getUsers();
    const currentUser = users.find(u => u.id === session.userId);
    
    if (!currentUser) {
      logout();
      return;
    }

    // Update dashboard UI
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => el.textContent = currentUser.fullName);

    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(el => el.textContent = currentUser.email);

    // Load orders
    const ordersContainer = document.querySelector('.orders-list');
    if (ordersContainer && currentUser.orders.length > 0) {
      ordersContainer.innerHTML = currentUser.orders.map(order => `
        <div class="order-card">
          <div class="order-header">
            <span class="order-id">#${order.id}</span>
            <span class="order-status status-${order.status}">${order.status}</span>
          </div>
          <div class="order-details">
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Total:</strong> ₦${order.total?.toLocaleString()}</p>
            <p><strong>Items:</strong> ${order.items?.length || 0}</p>
          </div>
          <button class="btn-reorder" data-order-id="${order.id}">Reorder</button>
        </div>
      `).join('');
    }

    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
  }

  // ============================================
  // GUEST CHECKOUT
  // ============================================

  const guestCheckoutBtn = document.querySelector('.guest-checkout-btn');
  if (guestCheckoutBtn) {
    guestCheckoutBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  // ============================================
  // TAB SWITCHING (Login/Register)
  // ============================================

  const tabButtons = document.querySelectorAll('[data-tab]');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      
      // Remove active class from all tabs and contents
      document.querySelectorAll('[data-tab]').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      button.classList.add('active');
      document.getElementById(targetTab + '-tab').classList.add('active');
    });
  });

  // ============================================
  // EXPOSE FUNCTIONS FOR DASHBOARD USE
  // ============================================

  window.CrownAuth = {
    getCurrentSession,
    logout,
    getUsers,
    getUserOrders,
    addOrder,
    toggleFavorite,
    updateUserProfile
  };

});


// ============================================
// NAVIGATION SESSION HANDLER
// Add this to auth-system.js or at the end of script.js
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  
  // Check if user is logged in
  function checkLoginStatus() {
    const session = localStorage.getItem('crown_session');
    
    if (!session) {
      // Not logged in
      showLoggedOutState();
      return null;
    }
    
    const sessionData = JSON.parse(session);
    const now = Date.now();
    
    // Check if session expired
    if (now > sessionData.expiresAt) {
      // Session expired
      localStorage.removeItem('crown_session');
      showLoggedOutState();
      return null;
    }
    
    // User is logged in
    showLoggedInState(sessionData);
    return sessionData;
  }

  // Show UI when user is NOT logged in
  function showLoggedOutState() {
    const loginLink = document.querySelector('.login');
    const accountIcon = document.querySelector('.account-icon');
    const userDropdown = document.querySelector('.user-dropdown');
    
    // Show login link
    if (loginLink) {
      loginLink.style.display = 'inline-block';
      loginLink.href = 'auth.html';
      loginLink.textContent = 'Login';
    }
    
    // Account icon goes to login
    if (accountIcon) {
      accountIcon.href = 'auth.html';
      accountIcon.title = 'Login / Register';
    }
    
    // Hide user dropdown if exists
    if (userDropdown) {
      userDropdown.style.display = 'none';
    }
  }

  // Show UI when user IS logged in
  function showLoggedInState(session) {
    const loginLink = document.querySelector('.login');
    const accountIcon = document.querySelector('.account-icon');
    
    // Hide the "Login" link
    if (loginLink) {
      loginLink.style.display = 'none';
    }
    
    // Create user dropdown if it doesn't exist
    let userDropdown = document.querySelector('.user-dropdown');
    if (!userDropdown) {
      userDropdown = createUserDropdown(session);
      
      // Insert after currency group or before login link
      const leftNav = document.querySelector('.left-nav');
      const currencyGroup = document.querySelector('.currency-group');
      
      if (currencyGroup) {
        currencyGroup.insertAdjacentElement('afterend', userDropdown);
      } else if (loginLink) {
        loginLink.insertAdjacentElement('beforebegin', userDropdown);
      } else if (leftNav) {
        leftNav.insertBefore(userDropdown, leftNav.firstChild);
      }
    } else {
      // Update existing dropdown with user info
      const userName = userDropdown.querySelector('.user-dropdown-name');
      if (userName) {
        const firstName = session.fullName.split(' ')[0];
        userName.textContent = firstName;
      }
      userDropdown.style.display = 'inline-flex';
    }
    
    // Account icon goes to dashboard
    if (accountIcon) {
      accountIcon.href = 'dashboard.html';
      accountIcon.title = 'My Dashboard';
      accountIcon.style.display = 'flex';
    }
  }

  // Create user dropdown menu
  function createUserDropdown(session) {
    const firstName = session.fullName.split(' ')[0];
    
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `
      <button class="user-dropdown-trigger">
        <span>Hello, <strong class="user-dropdown-name">${firstName}</strong></span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="user-dropdown-menu">
        <a href="dashboard.html" class="dropdown-item">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13.3333 14V12.6667C13.3333 11.9594 13.0524 11.2811 12.5523 10.781C12.0522 10.281 11.3739 10 10.6667 10H5.33333C4.62609 10 3.94781 10.281 3.44772 10.781C2.94762 11.2811 2.66667 11.9594 2.66667 12.6667V14M10.6667 4.66667C10.6667 6.13943 9.47276 7.33333 8 7.33333C6.52724 7.33333 5.33333 6.13943 5.33333 4.66667C5.33333 3.19391 6.52724 2 8 2C9.47276 2 10.6667 3.19391 10.6667 4.66667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Dashboard
        </a>
        <a href="dashboard.html#orders" class="dropdown-item">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 1.33334V4.00001M12 1.33334V4.00001M1.33334 6.66668H14.6667M2.66667 2.66668H13.3333C14.0697 2.66668 14.6667 3.26363 14.6667 4.00001V13.3333C14.6667 14.0697 14.0697 14.6667 13.3333 14.6667H2.66667C1.93029 14.6667 1.33334 14.0697 1.33334 13.3333V4.00001C1.33334 3.26363 1.93029 2.66668 2.66667 2.66668Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          My Orders
        </a>
        <button class="dropdown-item dropdown-logout">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6M10.6667 11.3333L14 8M14 8L10.6667 4.66667M14 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Logout
        </button>
      </div>
    `;
    
    // Toggle dropdown on click
    const trigger = dropdown.querySelector('.user-dropdown-trigger');
    const menu = dropdown.querySelector('.user-dropdown-menu');
    
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      menu.classList.remove('show');
    });
    
    // Logout button
    const logoutBtn = dropdown.querySelector('.dropdown-logout');
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('crown_session');
      window.location.href = 'index.html';
    });
    
    return dropdown;
  }

  // Initialize on page load
  checkLoginStatus();

  // Make account icon functional on all pages
  const accountIcon = document.querySelector('.account-icon');
  if (accountIcon) {
    accountIcon.addEventListener('click', (e) => {
      const session = localStorage.getItem('crown_session');
      if (session) {
        e.preventDefault();
        window.location.href = 'dashboard.html';
      }
      // If not logged in, default href to auth.html works
    });
  }

});