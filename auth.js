// Simple "auth" simulation using localStorage

const usersKey = 'twistly-users';
const sessionKey = 'twistly-session';

// Get users from localStorage or empty array
function getUsers() {
  const usersStr = localStorage.getItem(usersKey);
  return usersStr ? JSON.parse(usersStr) : [];
}

// Save users array back to localStorage
function saveUsers(users) {
  localStorage.setItem(usersKey, JSON.stringify(users));
}

// Get current logged user object or null
function getCurrentUser() {
  const session = localStorage.getItem(sessionKey);
  if (!session) return null;
  const users = getUsers();
  return users.find(u => u.email === session) || null;
}

// Set current logged in user by email
function setCurrentUser(email) {
  localStorage.setItem(sessionKey, email);
}

// Clear session
function clearSession() {
  localStorage.removeItem(sessionKey);
}

// Create new user
function createUser(email, password, username, bio = '', pfp = '') {
  const users = getUsers();
  if (users.some(u => u.email === email)) {
    return { success: false, message: 'Email already in use' };
  }
  const newUser = {
    email,
    password,
    username,
    bio,
    pfp,
    createdAt: Date.now(),
  };
  users.push(newUser);
  saveUsers(users);
  setCurrentUser(email);
  return { success: true };
}

// Validate login credentials
function loginUser(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    setCurrentUser(email);
    return { success: true };
  } else {
    return { success: false, message: 'Invalid email or password' };
  }
}

// Guest login: anonymous session with temporary id, no saved users
function guestLogin() {
  const guestId = 'guest_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  localStorage.setItem(sessionKey, guestId);
  sessionStorage.setItem('twistly-guest', 'true'); // mark as guest for session
}

// Check if current session is guest
function isGuest() {
  return sessionStorage.getItem('twistly-guest') === 'true';
}

// Logout handler
function logout() {
  clearSession();
  sessionStorage.removeItem('twistly-guest');
  window.location.href = 'index.html';
}

// -- PAGE SPECIFIC --

document.addEventListener('DOMContentLoaded', () => {
  // On login page
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = loginForm['login-email'].value.trim();
      const password = loginForm['login-password'].value.trim();
      const result = loginUser(email, password);
      if (result.success) {
        window.location.href = 'feed.html';
      } else {
        alert(result.message);
      }
    });
  }

  // On signup page
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = signupForm['signup-email'].value.trim();
      const password = signupForm['signup-password'].value.trim();
      const username = signupForm['signup-username'].value.trim();
      const bio = signupForm['signup-bio'].value.trim();
      const pfp = signupForm['signup-pfp'].value.trim() || 'https://i.pravatar.cc/150?u=' + encodeURIComponent(email);
      const result = createUser(email, password, username, bio, pfp);
      if (result.success) {
        window.location.href = 'feed.html';
      } else {
        alert(result.message);
      }
    });
  }

  // On guest page - create guest session
  if (window.location.pathname.endsWith('guest.html')) {
    if (!getCurrentUser()) {
      guestLogin();
    }
  }

  // On feed, upload, messages, profile pages - logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', e => {
      e.preventDefault();
      logout();
    });
  }

  // Redirect to login if no user/session and page requires login (feed, upload, messages, profile)
  const requiresAuthPages = ['feed.html', 'upload.html', 'messages.html', 'profile.html'];
  if (requiresAuthPages.some(p => window.location.pathname.endsWith(p))) {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = 'index.html';
    }
  }
});
