// Main app controller (ES Module)
// Using NRDCommon from CDN (loaded in index.html)
const logger = window.logger || console;

import { initializePortal } from './views/portal/portal.js';

// Initialize app using NRD Data Access
// Note: AuthService handles showing/hiding app-screen, we just setup portal content
logger.info('app.js loaded, waiting for NRD to be available');

// Wait for window.nrd and NRDCommon to be available (they're initialized in index.html)
function waitForNRDAndInitialize() {
  const maxWait = 10000; // 10 seconds
  const startTime = Date.now();
  const checkInterval = 100; // Check every 100ms
  
  const checkNRD = setInterval(() => {
    const nrd = window.nrd;
    const NRDCommon = window.NRDCommon;
    
    if (nrd && nrd.auth && NRDCommon) {
      clearInterval(checkNRD);
      logger.info('NRD, auth, and NRDCommon available, setting up onAuthStateChanged');
      
      // Also listen to the current auth state immediately
      const currentUser = nrd.auth.getCurrentUser();
      if (currentUser) {
        logger.info('Current user found, initializing immediately', { uid: currentUser.uid, email: currentUser.email });
        initializeAppForUser(currentUser);
      }
      
      nrd.auth.onAuthStateChanged((user) => {
        logger.info('Auth state changed', { hasUser: !!user, uid: user?.uid, email: user?.email });
        if (user) {
          initializeAppForUser(user);
        } else {
          logger.debug('User not authenticated, app initialization skipped');
        }
      });
    } else if (Date.now() - startTime >= maxWait) {
      clearInterval(checkNRD);
      logger.error('NRD, auth, or NRDCommon not available after timeout', { 
        hasNrd: !!nrd, 
        hasAuth: !!(nrd && nrd.auth),
        hasNRDCommon: !!NRDCommon
      });
    }
  }, checkInterval);
}

// Start waiting for NRD and NRDCommon
waitForNRDAndInitialize();

function initializeAppForUser(user) {
  logger.info('Initializing app for user', { uid: user.uid, email: user.email });
  
  // Ensure app-screen is visible (AuthService should have done this, but double-check)
  const appScreen = document.getElementById('app-screen');
  const loginScreen = document.getElementById('login-screen');
  const redirectingScreen = document.getElementById('redirecting-screen');
  
  if (appScreen) {
    appScreen.classList.remove('hidden');
    logger.info('App screen shown');
  }
  if (loginScreen) {
    loginScreen.classList.add('hidden');
  }
  if (redirectingScreen) {
    redirectingScreen.classList.add('hidden');
  }
  
  // Wait a bit for DOM to be ready, then initialize portal view
  setTimeout(() => {
    initializePortal();
    
    // Double-check that app-screen is visible
    const appScreenCheck = document.getElementById('app-screen');
    if (appScreenCheck && appScreenCheck.classList.contains('hidden')) {
      logger.warn('App screen was hidden, showing it now');
      appScreenCheck.classList.remove('hidden');
    }
  }, 300);
}

// AuthService is now initialized in index.html after NRDCommon loads
// This ensures it handles the redirecting screen immediately
// We don't need to initialize it here since it's already done in index.html
