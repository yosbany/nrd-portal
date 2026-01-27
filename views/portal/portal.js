// Portal view - Displays available NRD applications

const logger = window.logger || console;

// Detect if we're on localhost
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '0.0.0.0';

// Apps disponibles con URLs locales y remotas
const APPS_CONFIG = [
  { name: "Pedidos", localPath: "/nrd-pedidos/", remoteUrl: "https://yosbany.github.io/nrd-pedidos", icon: "📦" },
  { name: "Gestión Operativa", localPath: "/nrd-gestion-operativa/", remoteUrl: "https://yosbany.github.io/nrd-gestion-operativa", icon: "⚙️" },
  { name: "Flujo de Caja", localPath: "/nrd-flujo-caja/", remoteUrl: "https://yosbany.github.io/nrd-flujo-caja", icon: "💰" },
  { name: "Control de Cajas", localPath: "/nrd-control-cajas/", remoteUrl: "https://yosbany.github.io/nrd-control-cajas", icon: "📊" },
  { name: "Costos", localPath: "/nrd-costos/", remoteUrl: "https://yosbany.github.io/nrd-costos", icon: "💵" },
  { name: "RRHH", localPath: "/nrd-rrhh/", remoteUrl: "https://yosbany.github.io/nrd-rrhh", icon: "👥" },
  { name: "Productos", localPath: "/nrd-productos/", remoteUrl: "https://yosbany.github.io/nrd-productos", icon: "📋" },
  { name: "Compras", localPath: "/nrd-compras/", remoteUrl: "https://yosbany.github.io/nrd-compras", icon: "🛒" },
  { name: "Administración de Datos", localPath: "/nrd-data-access/", remoteUrl: "https://yosbany.github.io/nrd-data-access", icon: "🗄️" }
];

// Generate APPS array with correct URLs based on environment
const APPS = APPS_CONFIG.map(app => ({
  name: app.name,
  url: isLocalhost ? app.localPath : app.remoteUrl,
  icon: app.icon
}));

/**
 * Initialize portal view
 */
export function initializePortal() {
  logger.debug('Initializing portal view');
  renderApps();
}

/**
 * Render apps grid
 */
function renderApps() {
  logger.debug('Rendering apps grid', { appCount: APPS.length });
  const appsGrid = document.getElementById('apps-grid');
  
  if (!appsGrid) {
    logger.warn('Apps grid element not found');
    return;
  }
  
  const escapeHtml = window.escapeHtml || ((text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  });
  
  appsGrid.innerHTML = APPS.map(app => `
    <a href="${escapeHtml(app.url)}" 
       class="block border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors">
      <div class="flex items-center gap-3 sm:gap-4 mb-3">
        <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span class="text-2xl sm:text-3xl">${app.icon || "📱"}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-lg sm:text-xl font-light tracking-tight mb-1">${escapeHtml(app.name)}</h3>
          <p class="text-sm sm:text-base text-gray-600">Acceder a ${escapeHtml(app.name)}</p>
        </div>
      </div>
    </a>
  `).join('');
  
  logger.debug('Apps grid rendered successfully');
}
