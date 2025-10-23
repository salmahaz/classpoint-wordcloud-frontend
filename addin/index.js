// Configuration
const API_BASE_URL = 'https://classpoint-wordcloud-backend.onrender.com/api';
const FRONTEND_URL = 'https://classpoint-wordcloud.vercel.app';

// State management
let currentUser = null;
let currentSession = null;

// DOM elements
const loading = document.getElementById('loading');
const loginSection = document.getElementById('loginSection');
const signupSection = document.getElementById('signupSection');
const taskpaneContent = document.getElementById('taskpaneContent');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginMessage = document.getElementById('loginMessage');
const signupMessage = document.getElementById('signupMessage');
const taskpaneMessage = document.getElementById('taskpaneMessage');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logoutBtn');

// Taskpane elements
const startBtn = document.getElementById('startBtn');
const insertBtn = document.getElementById('insertBtn');
const wordLimit = document.getElementById('wordLimit');
const status = document.getElementById('status');
const preview = document.getElementById('preview');

// Initialize the add-in
Office.onReady(() => {
  console.log('Office add-in initialized');
  initializeApp();
});

async function initializeApp() {
  try {
    showLoading(true);
    
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    const teacherId = localStorage.getItem('teacher_id');
    
    if (token && teacherId) {
      // Verify token is still valid
      const isValid = await verifyToken(token);
      if (isValid) {
        currentUser = { token, teacherId };
        showTaskpane();
        return;
      } else {
        // Token is invalid, clear storage
        clearAuth();
      }
    }
    
    // Show login form
    showLoginForm();
    
  } catch (error) {
    console.error('Initialization error:', error);
    showMessage(loginMessage, 'Failed to initialize. Please refresh and try again.', 'error');
    showLoginForm();
  } finally {
    showLoading(false);
  }
}

// Authentication functions
async function verifyToken(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/teacher/verify-token`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/teacher/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store authentication data
      localStorage.setItem('token', data.token);
      localStorage.setItem('teacher_id', data.teacher_id);
      localStorage.setItem('teacher_name', data.name);
      
      currentUser = {
        token: data.token,
        teacherId: data.teacher_id,
        name: data.name
      };
      
      showMessage(loginMessage, 'Login successful! Loading...', 'success');
      setTimeout(() => {
        showTaskpane();
      }, 1000);
      
      return true;
    } else {
      showMessage(loginMessage, data.error || 'Login failed', 'error');
      return false;
    }
  } catch (error) {
    console.error('Login error:', error);
    showMessage(loginMessage, 'Network error. Please try again.', 'error');
    return false;
  }
}

async function signup(fullName, email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/teacher/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        full_name: fullName, 
        email, 
        password 
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage(signupMessage, 'Account created successfully! Please sign in.', 'success');
      setTimeout(() => {
        showLoginForm();
      }, 1500);
      return true;
    } else {
      showMessage(signupMessage, data.error || 'Signup failed', 'error');
      return false;
    }
  } catch (error) {
    console.error('Signup error:', error);
    showMessage(signupMessage, 'Network error. Please try again.', 'error');
    return false;
  }
}

function logout() {
  clearAuth();
  showLoginForm();
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('teacher_id');
  localStorage.removeItem('teacher_name');
  currentUser = null;
  currentSession = null;
}

// UI functions
function showLoading(show) {
  loading.style.display = show ? 'block' : 'none';
}

function showLoginForm() {
  hideAllSections();
  loginSection.classList.add('active');
  clearMessages();
}

function showSignupForm() {
  hideAllSections();
  signupSection.classList.add('active');
  clearMessages();
}

function showTaskpane() {
  hideAllSections();
  taskpaneContent.classList.add('active');
  clearMessages();
}

function hideAllSections() {
  loginSection.classList.remove('active');
  signupSection.classList.remove('active');
  taskpaneContent.classList.remove('active');
}

function clearMessages() {
  loginMessage.style.display = 'none';
  signupMessage.style.display = 'none';
  taskpaneMessage.style.display = 'none';
}

function showMessage(element, message, type) {
  element.textContent = message;
  element.className = `message ${type}`;
  element.style.display = 'block';
}

// Taskpane functions
async function startSession() {
  if (!currentUser) {
    showMessage(taskpaneMessage, 'Please sign in first', 'error');
    return;
  }

  const wordLimitValue = parseInt(wordLimit.value, 10);
  status.textContent = 'Starting session...';
  showMessage(taskpaneMessage, '', 'success');

  try {
    const response = await fetch(`${API_BASE_URL}/teacher/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': currentUser.token
      },
      body: JSON.stringify({ word_limit: wordLimitValue })
    });

    const data = await response.json();
    
    if (data.success) {
      currentSession = { code: data.code, wordLimit: wordLimitValue };
      status.textContent = `Session started (limit: ${wordLimitValue} words) | Code: ${data.code}`;
      showMessage(taskpaneMessage, `Session Code: ${data.code}`, 'success');
    } else {
      status.textContent = data.error || 'Failed to start session';
      showMessage(taskpaneMessage, data.error || 'Failed to start session', 'error');
    }
  } catch (error) {
    console.error('Start session error:', error);
    status.textContent = 'Failed to start session (network error)';
    showMessage(taskpaneMessage, 'Network error. Please try again.', 'error');
  }
}

async function insertWordCloud() {
  if (!currentUser) {
    showMessage(taskpaneMessage, 'Please sign in first', 'error');
    return;
  }

  status.textContent = 'Loading cloud...';
  showMessage(taskpaneMessage, '', 'success');

  try {
    const response = await fetch(`${API_BASE_URL}/teacher/latest-cloud`, {
      headers: {
        'Authorization': currentUser.token
      }
    });
    
    const data = await response.json();

    if (!data.success || !data.image) {
      status.textContent = 'No cloud image found. Start a session first.';
      showMessage(taskpaneMessage, 'No cloud image found. Start a session first.', 'error');
      return;
    }

    const base64 = data.image;
    preview.src = 'data:image/png;base64,' + base64;
    preview.style.display = 'block';

    // Insert into PowerPoint
    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.add();
      slide.shapes.addImageFromBase64(base64, { 
        left: 50, 
        top: 50, 
        height: 400 
      });
      await context.sync();
    });

    status.textContent = 'Cloud inserted successfully!';
    showMessage(taskpaneMessage, 'Cloud slide inserted successfully!', 'success');
  } catch (error) {
    console.error('Insert cloud error:', error);
    status.textContent = 'Failed to insert image.';
    showMessage(taskpaneMessage, 'Failed to insert image.', 'error');
  }
}

// Event listeners
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  
  if (!email || !password) {
    showMessage(loginMessage, 'Please fill in all fields', 'error');
    return;
  }
  
  await login(email, password);
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fullName = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value.trim();
  
  if (!fullName || !email || !password) {
    showMessage(signupMessage, 'Please fill in all fields', 'error');
    return;
  }
  
  await signup(fullName, email, password);
});

showSignup.addEventListener('click', (e) => {
  e.preventDefault();
  showSignupForm();
});

showLogin.addEventListener('click', (e) => {
  e.preventDefault();
  showLoginForm();
});

logoutBtn.addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});

startBtn.addEventListener('click', startSession);
insertBtn.addEventListener('click', insertWordCloud);

// Export functions for Office.js
window.showTaskPane = function() {
  // This function is called by the manifest when the add-in is opened
  console.log('Task pane opened');
};
