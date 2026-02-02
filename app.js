// Main app controller (ES Module)
// Using NRDCommon from CDN (loaded in index.html)
const logger = window.logger || console;

import { initializeInicio, initializeCalculadoras } from './views/portal/portal.js';

// Navigation configuration
const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', view: 'inicio' },
  { id: 'calculadoras', label: 'Calculadoras', view: 'calculadoras' }
];

const VIEW_INITIALIZERS = {
  'inicio': initializeInicio,
  'calculadoras': initializeCalculadoras
};

function initializeNavigation() {
  const navContainer = document.getElementById('app-nav-container');
  if (!navContainer) return;

  const navHTML = NAV_ITEMS.map((item, index) => {
    const isActive = index === 0 ? 'border-red-600 text-red-600 bg-red-50 font-medium' : 'border-transparent text-gray-600';
    return `
      <button class="nav-btn flex-1 px-3 sm:px-4 py-3 sm:py-3.5 border-b-2 ${isActive} hover:text-red-600 transition-colors uppercase tracking-wider text-xs sm:text-sm font-light min-w-0"
              data-view="${item.view}">
        ${item.label}
      </button>
    `;
  }).join('');

  navContainer.innerHTML = navHTML;

  navContainer.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const viewName = btn.dataset.view;
      if (viewName) switchView(viewName);
    });
  });
}

function switchView(viewName) {
  document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));

  const selectedView = document.getElementById(`${viewName}-view`);
  if (selectedView) selectedView.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('border-red-600', 'text-red-600', 'bg-red-50', 'font-medium');
    btn.classList.add('border-transparent', 'text-gray-600');
  });

  const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
  if (activeBtn) {
    activeBtn.classList.remove('border-transparent', 'text-gray-600');
    activeBtn.classList.add('border-red-600', 'text-red-600', 'bg-red-50', 'font-medium');
  }

  const initializer = VIEW_INITIALIZERS[viewName];
  if (initializer && typeof initializer === 'function') {
    try {
      initializer();
    } catch (error) {
      logger.error('Error initializing view', { viewName, error });
    }
  }
}

logger.info('app.js loaded, waiting for NRD to be available');

function waitForNRDAndInitialize() {
  const maxWait = 10000;
  const startTime = Date.now();

  const checkNRD = setInterval(() => {
    const nrd = window.nrd;
    const NRDCommon = window.NRDCommon;

    if (nrd && nrd.auth && NRDCommon) {
      clearInterval(checkNRD);
      logger.info('NRD, auth, and NRDCommon available, setting up onAuthStateChanged');

      const currentUser = nrd.auth.getCurrentUser();
      if (currentUser) {
        logger.info('Current user found, initializing immediately', { uid: currentUser.uid, email: currentUser.email });
        initializeAppForUser(currentUser);
      }

      nrd.auth.onAuthStateChanged((user) => {
        logger.info('Auth state changed', { hasUser: !!user, uid: user?.uid, email: user?.email });
        if (user) initializeAppForUser(user);
        else logger.debug('User not authenticated, app initialization skipped');
      });
    } else if (Date.now() - startTime >= maxWait) {
      clearInterval(checkNRD);
      logger.error('NRD, auth, or NRDCommon not available after timeout');
    }
  }, 100);
}

waitForNRDAndInitialize();

function initializeAppForUser(user) {
  logger.info('Initializing app for user', { uid: user.uid, email: user.email });

  const appScreen = document.getElementById('app-screen');
  const loginScreen = document.getElementById('login-screen');
  const redirectingScreen = document.getElementById('redirecting-screen');

  if (appScreen) appScreen.classList.remove('hidden');
  if (loginScreen) loginScreen.classList.add('hidden');
  if (redirectingScreen) redirectingScreen.classList.add('hidden');

  setTimeout(() => {
    initializeNavigation();
    switchView('inicio');

    const appScreenCheck = document.getElementById('app-screen');
    if (appScreenCheck && appScreenCheck.classList.contains('hidden')) {
      appScreenCheck.classList.remove('hidden');
    }
  }, 300);
}

// AuthService is now initialized in index.html after NRDCommon loads
// This ensures it handles the redirecting screen immediately
// We don't need to initialize it here since it's already done in index.html
