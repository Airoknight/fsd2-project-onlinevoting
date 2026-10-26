// Shared client-side authentication and API helper

// Global state
let currentUser = null;

// Check authentication
async function getCurrentUser() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const user = await res.json();
    return user;
  } catch (err) {
    return null;
  }
}

// Ensure protected routes
async function requireAuth(allowedRoles = []) {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
    return null;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') {
      window.location.href = '/admin.html';
    } else {
      window.location.href = '/vote.html';
    }
    return null;
  }
  return user;
}

// Setup common navbar
function renderNavbar(user) {
  const navUserElem = document.getElementById('navUser');
  const navLinksElem = document.getElementById('navLinks');
  if (!navUserElem) return;

  if (user) {
    navUserElem.innerHTML = `
      <span class="nav-badge"></span>
      <span>${user.name} (${user.studentId})</span>
    `;

    if (navLinksElem) {
      if (user.role === 'admin') {
        navLinksElem.innerHTML = `
          <a href="/admin.html" style="color: #cbd5e1; text-decoration:none; font-weight:600; font-size:0.9rem;">Dashboard</a>
          <a href="/results.html" style="color: #cbd5e1; text-decoration:none; font-weight:600; font-size:0.9rem;">Results</a>
        `;
      } else {
        navLinksElem.innerHTML = `
          <a href="/vote.html" style="color: #cbd5e1; text-decoration:none; font-weight:600; font-size:0.9rem;">Vote</a>
          <a href="/results.html" style="color: #cbd5e1; text-decoration:none; font-weight:600; font-size:0.9rem;">Results</a>
        `;
      }
    }
  }
}

// Logout handler
async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    console.error(err);
  } finally {
    window.location.href = '/login.html';
  }
}

// Alert notification banner helper
function showAlert(message, type = 'danger', containerId = 'alertContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="alert-box alert-${type}">
      <span>${type === 'danger' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
      <div>${message}</div>
    </div>
  `;
}

function clearAlert(containerId = 'alertContainer') {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';
}
