// Authentication management for NRD Portal

let nrd = null;

// Initialize NRD Data Access
function initAuth() {
  logger.debug('Initializing NRD Data Access');
  if (typeof NRDDataAccess === 'undefined') {
    logger.error('NRDDataAccess not available. Verify that the library has loaded correctly.');
    document.body.innerHTML = '<div class="min-h-screen flex items-center justify-center bg-red-50"><div class="text-center"><h1 class="text-2xl font-bold text-red-600 mb-2">Error</h1><p class="text-gray-700">No se pudo cargar la librería NRD Data Access</p></div></div>';
    return null;
  }
  
  nrd = new NRDDataAccess();
  // Expose nrd globally for other modules
  window.nrd = nrd;
  logger.info('NRD Data Access initialized successfully');
  return nrd;
}

// Sign in
async function signIn(email, password) {
  logger.info('Attempting user login', { email });
  if (!nrd) {
    logger.error('NRD Data Access not initialized');
    throw new Error('NRD Data Access no está inicializado');
  }
  try {
    const userCredential = await nrd.auth.signIn(email, password);
    const user = userCredential.user;
    logger.audit('USER_LOGIN', { email, uid: user.uid, timestamp: Date.now() });
    logger.info('User login successful', { uid: user.uid, email });
    return userCredential;
  } catch (error) {
    logger.error('Login failed', error);
    throw error;
  }
}

// Sign out
async function signOut() {
  const user = getCurrentUser();
  logger.info('Attempting user logout', { uid: user?.uid, email: user?.email });
  if (!nrd) {
    logger.error('NRD Data Access not initialized');
    throw new Error('NRD Data Access no está inicializado');
  }
  try {
    await nrd.auth.signOut();
    logger.audit('USER_LOGOUT', { uid: user?.uid, email: user?.email, timestamp: Date.now() });
    logger.info('User logout successful');
  } catch (error) {
    logger.error('Logout failed', error);
    throw error;
  }
}

// Get current user
function getCurrentUser() {
  if (!nrd) {
    return null;
  }
  return nrd.auth.getCurrentUser();
}

// On auth state changed
function onAuthStateChanged(callback) {
  if (!nrd) {
    return () => {};
  }
  return nrd.auth.onAuthStateChanged(callback);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show profile modal
function showProfileModal() {
  logger.debug('Showing profile modal');
  const modal = document.getElementById('profile-modal');
  const content = document.getElementById('profile-modal-content');
  
  if (!modal || !content) {
    logger.warn('Profile modal elements not found');
    return;
  }
  
  const user = getCurrentUser();
  if (!user) {
    logger.warn('No user found when showing profile modal');
    return;
  }
  
  logger.debug('Displaying user profile data', { uid: user.uid, email: user.email });
  
  // Display user data
  let userDataHtml = `
    <div class="space-y-3 sm:space-y-4">
      <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
        <span class="text-gray-600 font-light text-sm sm:text-base">Email:</span>
        <span class="font-light text-sm sm:text-base">${escapeHtml(user.email || 'N/A')}</span>
      </div>
      ${user.displayName ? `
      <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
        <span class="text-gray-600 font-light text-sm sm:text-base">Nombre:</span>
        <span class="font-light text-sm sm:text-base">${escapeHtml(user.displayName)}</span>
      </div>
      ` : ''}
    </div>
  `;
  
  content.innerHTML = userDataHtml;
  modal.classList.remove('hidden');
  logger.debug('Profile modal shown');
}

// Close profile modal
function closeProfileModal() {
  logger.debug('Closing profile modal');
  const modal = document.getElementById('profile-modal');
  if (modal) {
    modal.classList.add('hidden');
    logger.debug('Profile modal closed');
  }
}

// Setup profile modal event listeners
let profileModalListenersSetup = false;
function setupProfileModalListeners() {
  logger.debug('Setting up profile modal event listeners');
  
  // Profile button handler
  const profileBtn = document.getElementById('profile-btn');
  if (profileBtn && !profileBtn.hasAttribute('data-listener-attached')) {
    profileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logger.debug('Profile button clicked');
      showProfileModal();
    });
    profileBtn.setAttribute('data-listener-attached', 'true');
    logger.debug('Profile button listener attached');
  } else if (!profileBtn) {
    logger.warn('Profile button not found');
  }

  // Close profile modal button
  const closeProfileModalBtn = document.getElementById('close-profile-modal');
  if (closeProfileModalBtn && !closeProfileModalBtn.hasAttribute('data-listener-attached')) {
    closeProfileModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logger.debug('Close profile modal button clicked');
      closeProfileModal();
    });
    closeProfileModalBtn.setAttribute('data-listener-attached', 'true');
    logger.debug('Close profile modal button listener attached');
  } else if (!closeProfileModalBtn) {
    logger.warn('Close profile modal button not found');
  }

  // Logout handler (from profile modal)
  const profileLogoutBtn = document.getElementById('profile-logout-btn');
  if (profileLogoutBtn && !profileLogoutBtn.hasAttribute('data-listener-attached')) {
    profileLogoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        logger.debug('Profile logout button clicked');
        closeProfileModal();
        await signOut();
      } catch (error) {
        logger.error('Error during logout', error);
        alert('Error al cerrar sesión: ' + error.message);
      }
    });
    profileLogoutBtn.setAttribute('data-listener-attached', 'true');
    logger.debug('Profile logout button listener attached');
  } else if (!profileLogoutBtn) {
    logger.warn('Profile logout button not found');
  }
  
  // Also handle click on modal background to close
  const profileModal = document.getElementById('profile-modal');
  if (profileModal && !profileModal.hasAttribute('data-listener-attached')) {
    profileModal.addEventListener('click', (e) => {
      if (e.target === profileModal) {
        logger.debug('Profile modal background clicked');
        closeProfileModal();
      }
    });
    profileModal.setAttribute('data-listener-attached', 'true');
    logger.debug('Profile modal background click listener attached');
  }
  
  profileModalListenersSetup = true;
  logger.debug('Profile modal listeners setup completed');
}

// Initialize profile modal listeners when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupProfileModalListeners, 100);
  });
} else {
  // DOM is already ready, but wait a bit to ensure all elements are available
  setTimeout(setupProfileModalListeners, 100);
}

