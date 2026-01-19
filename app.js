// Main app controller for NRD Portal

// Apps disponibles
const APPS = [
  { name: "Pedidos", url: "https://yosbany.github.io/nrd-pedidos" },
  { name: "Gestión Operativa", url: "https://yosbany.github.io/nrd-gestion-operativa" },
  { name: "Flujo de Caja", url: "https://yosbany.github.io/nrd-flujo-caja" },
  { name: "Control de Cajas", url: "https://yosbany.github.io/nrd-control-cajas" },
  { name: "Costos", url: "https://yosbany.github.io/nrd-costos" },
  { name: "RRHH", url: "https://yosbany.github.io/nrd-rrhh" }
];

// Initialize app
function initApp() {
  logger.info('Initializing NRD Portal app');
  
  // Initialize auth
  const nrd = initAuth();
  if (!nrd) {
    logger.error('Failed to initialize app: NRD Data Access not available');
    return;
  }

  logger.debug('Getting DOM elements');
  // Get DOM elements
  const loginContainer = document.getElementById('login-container');
  const portalContainer = document.getElementById('portal-container');
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorMessage = document.getElementById('error-message');
  const appsGrid = document.getElementById('apps-grid');

  // Show/hide views
  function showLogin() {
    logger.debug('Showing login view');
    if (loginContainer) loginContainer.classList.remove('hidden');
    if (portalContainer) portalContainer.classList.add('hidden');
  }

  function showPortal() {
    logger.debug('Showing portal view');
    if (loginContainer) loginContainer.classList.add('hidden');
    if (portalContainer) portalContainer.classList.remove('hidden');
  }

  // Handle login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput?.value.trim();
      const password = passwordInput?.value;

      logger.debug('Login form submitted', { email });

      if (errorMessage) {
        errorMessage.textContent = '';
        errorMessage.classList.add('hidden');
      }

      try {
        await signIn(email, password);
        // El estado de autenticación se manejará en onAuthStateChanged
      } catch (error) {
        logger.error('Login form error', error);
        if (errorMessage) {
          errorMessage.textContent = error.message || 'Error al iniciar sesión';
          errorMessage.classList.remove('hidden');
        }
      }
    });
    logger.debug('Login form event listener attached');
  }

  // Render apps
  function renderApps() {
    logger.debug('Rendering apps grid', { appCount: APPS.length });
    if (!appsGrid) {
      logger.warn('Apps grid element not found');
      return;
    }
    appsGrid.innerHTML = APPS.map(app => `
      <a href="${escapeHtml(app.url)}" 
         class="block border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors">
        <h3 class="text-lg sm:text-xl font-light tracking-tight mb-2">${escapeHtml(app.name)}</h3>
        <p class="text-sm sm:text-base text-gray-600">Acceder a ${escapeHtml(app.name)}</p>
      </a>
    `).join('');
    logger.debug('Apps grid rendered successfully');
  }

  // Listen for auth state changes
  logger.debug('Setting up auth state change listener');
  onAuthStateChanged((user) => {
    if (user) {
      logger.info('User authenticated, showing portal', { uid: user.uid, email: user.email });
      renderApps();
      showPortal();
    } else {
      logger.info('User not authenticated, showing login');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
      if (errorMessage) {
        errorMessage.textContent = '';
        errorMessage.classList.add('hidden');
      }
      showLogin();
    }
  });
  
  logger.info('NRD Portal app initialized successfully');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

