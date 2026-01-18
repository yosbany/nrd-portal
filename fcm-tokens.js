// FCM Tokens management for NRD Portal

// Use nrd from global scope (exposed by auth.js)
// nrd is available via window.nrd after initAuth() is called

let fcmTokensListener = null;
let fcmTokensSearchTerm = '';

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper functions for alerts (simple implementation)
function showError(message) {
  alert('Error: ' + message);
}

function showSuccess(message) {
  alert(message);
}

function showConfirm(title, message) {
  return confirm(message);
}

// Load FCM tokens
function loadFCMTokens() {
  const nrd = window.nrd;
  if (!nrd) {
    logger.warn('NRD Data Access not initialized');
    return;
  }
  
  logger.debug('Loading FCM tokens');
  const tokensList = document.getElementById('fcm-tokens-list');
  if (!tokensList) {
    logger.warn('FCM tokens list element not found');
    return;
  }
  
  tokensList.innerHTML = '';

  // Remove previous listener
  if (fcmTokensListener) {
    logger.debug('Removing previous FCM tokens listener');
    fcmTokensListener();
    fcmTokensListener = null;
  }

  // Listen for tokens using NRD Data Access
  logger.debug('Setting up FCM tokens listener');
  fcmTokensListener = nrd.fcmTokens.onValue((tokens) => {
    logger.debug('FCM tokens data received', { count: Array.isArray(tokens) ? tokens.length : Object.keys(tokens || {}).length });
    if (!tokensList) return;
    tokensList.innerHTML = '';
    
    const tokensDict = Array.isArray(tokens) 
      ? tokens.reduce((acc, token) => {
          if (token && token.id) {
            acc[token.id] = token;
          }
          return acc;
        }, {})
      : tokens || {};

    if (Object.keys(tokensDict).length === 0) {
      tokensList.innerHTML = `
        <div class="text-center py-8 border border-gray-200 p-4">
          <p class="text-gray-600 mb-3 text-sm">No hay tokens FCM registrados</p>
        </div>
      `;
      return;
    }

    // Filter by search term if active
    let tokensToShow = Object.entries(tokensDict);
    if (fcmTokensSearchTerm.trim()) {
      const searchLower = fcmTokensSearchTerm.toLowerCase().trim();
      tokensToShow = tokensToShow.filter(([id, token]) => {
        const deviceName = token.deviceName ? token.deviceName.toLowerCase() : '';
        const platform = token.platform ? token.platform.toLowerCase() : '';
        const tokenStr = token.token ? token.token.toLowerCase() : '';
        
        return deviceName.includes(searchLower) || 
               platform.includes(searchLower) ||
               tokenStr.includes(searchLower);
      });
    }
    
    if (tokensToShow.length === 0) {
      tokensList.innerHTML = '<p class="text-center text-gray-600 py-6 text-sm">No hay tokens que coincidan con la búsqueda</p>';
      return;
    }

    tokensToShow.forEach(([id, token]) => {
      const item = document.createElement('div');
      item.className = 'border border-gray-200 p-4 hover:border-red-600 transition-colors cursor-pointer';
      item.dataset.tokenId = id;
      
      const activeBadge = token.active !== false 
        ? '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Activo</span>'
        : '<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Inactivo</span>';
      
      item.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <div class="flex-1">
            <div class="text-base font-light mb-1">${escapeHtml(token.deviceName || 'Sin nombre')}</div>
            <div class="text-xs text-gray-500 font-mono break-all">${escapeHtml(token.token ? token.token.substring(0, 50) + '...' : '')}</div>
          </div>
          ${activeBadge}
        </div>
        <div class="text-xs text-gray-600 mt-2 mb-3">
          ${token.platform ? `<div>Plataforma: <span class="font-medium">${escapeHtml(token.platform)}</span></div>` : ''}
          ${token.createdAt ? `<div>Creado: ${new Date(token.createdAt).toLocaleDateString()}</div>` : ''}
        </div>
        <div class="flex gap-2 pt-2 border-t border-gray-200">
          <button class="edit-token-btn px-3 py-1 bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors" data-token-id="${id}">
            Editar
          </button>
          <button class="delete-token-btn px-3 py-1 bg-red-600 text-white text-xs hover:bg-red-700 transition-colors" data-token-id="${id}">
            Eliminar
          </button>
        </div>
      `;
      
      // Add event listeners for buttons
      const editBtn = item.querySelector('.edit-token-btn');
      const deleteBtn = item.querySelector('.delete-token-btn');
      
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          showFCMTokenForm(id);
        });
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteFCMTokenHandler(id);
        });
      }
      
      tokensList.appendChild(item);
    });
  });
}

// Show token form
function showFCMTokenForm(tokenId = null) {
  const form = document.getElementById('fcm-token-form');
  const list = document.getElementById('fcm-tokens-list');
  const title = document.getElementById('fcm-token-form-title');
  const formHeader = document.getElementById('fcm-token-form-header');
  const saveBtn = document.getElementById('save-fcm-token-btn');
  
  if (!form || !list) return;
  
  form.classList.remove('hidden');
  
  const formElement = document.getElementById('fcm-token-form-element');
  if (formElement) formElement.reset();
  
  const idInput = document.getElementById('fcm-token-id');
  if (idInput) idInput.value = tokenId || '';

  if (tokenId) {
    if (title) title.textContent = 'Editar Token FCM';
    if (saveBtn) {
      saveBtn.classList.remove('bg-green-600', 'border-green-600', 'hover:bg-green-700');
      saveBtn.classList.add('bg-blue-600', 'border-blue-600', 'hover:bg-blue-700');
    }
    (async () => {
      const nrd = window.nrd;
      if (!nrd) return;
      const token = await nrd.fcmTokens.getById(tokenId);
      if (token) {
        const tokenInput = document.getElementById('fcm-token-token');
        const deviceNameInput = document.getElementById('fcm-token-device-name');
        const platformInput = document.getElementById('fcm-token-platform');
        const activeInput = document.getElementById('fcm-token-active');
        
        if (tokenInput) tokenInput.value = token.token || '';
        if (deviceNameInput) deviceNameInput.value = token.deviceName || '';
        if (platformInput) platformInput.value = token.platform || '';
        if (activeInput) activeInput.checked = token.active !== false;
      }
    })();
  } else {
    if (title) title.textContent = 'Nuevo Token FCM';
    if (saveBtn) {
      saveBtn.classList.remove('bg-blue-600', 'border-blue-600', 'hover:bg-blue-700');
      saveBtn.classList.add('bg-green-600', 'border-green-600', 'hover:bg-green-700');
    }
  }
}

// Hide token form
function hideFCMTokenForm() {
  const form = document.getElementById('fcm-token-form');
  if (form) form.classList.add('hidden');
}

// Save token
async function saveFCMToken(tokenId, tokenData) {
  const nrd = window.nrd;
  if (!nrd) {
    throw new Error('NRD Data Access not initialized');
  }
  if (tokenId) {
    await nrd.fcmTokens.update(tokenId, { ...tokenData, updatedAt: Date.now() });
    return { key: tokenId };
  } else {
    const id = await nrd.fcmTokens.create({ ...tokenData, createdAt: Date.now() });
    return { key: id, getKey: () => id };
  }
}

// View token detail (no longer used, buttons handle actions)
async function viewFCMToken(tokenId) {
  // Deprecated - buttons handle actions now
}

// Delete token handler
async function deleteFCMTokenHandler(tokenId) {
  const nrd = window.nrd;
  if (!nrd) {
    logger.warn('NRD Data Access not initialized');
    return;
  }
  
  logger.debug('Delete FCM token requested', { tokenId });
  const confirmed = await showConfirm('Eliminar Token FCM', '¿Está seguro de eliminar este token?');
  if (!confirmed) {
    logger.debug('FCM token deletion cancelled', { tokenId });
    return;
  }

  try {
    await nrd.fcmTokens.delete(tokenId);
    logger.info('FCM token deleted successfully', { tokenId });
    loadFCMTokens();
  } catch (error) {
    logger.error('Failed to delete FCM token', error);
    await showError('Error al eliminar token: ' + error.message);
  }
}

// Token form submit handler
let fcmTokenFormHandlerSetup = false;
function setupFCMTokenFormHandler() {
  if (fcmTokenFormHandlerSetup) return;
  const formElement = document.getElementById('fcm-token-form-element');
  if (!formElement) return;
  
  fcmTokenFormHandlerSetup = true;
  formElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tokenId = document.getElementById('fcm-token-id')?.value;
    const token = document.getElementById('fcm-token-token')?.value.trim();
    const deviceName = document.getElementById('fcm-token-device-name')?.value.trim();
    const platform = document.getElementById('fcm-token-platform')?.value;
    const active = document.getElementById('fcm-token-active')?.checked;

    if (!token) {
      await showError('El token FCM es requerido');
      return;
    }

    try {
      const tokenData = { 
        token,
        active: active !== false
      };
      if (deviceName) {
        tokenData.deviceName = deviceName;
      }
      if (platform) {
        tokenData.platform = platform;
      }
      
      await saveFCMToken(tokenId || null, tokenData);
      hideFCMTokenForm();
      await showSuccess(tokenId ? 'Token actualizado exitosamente' : 'Token creado exitosamente');
    } catch (error) {
      logger.error('Failed to save FCM token', error);
      await showError('Error al guardar token: ' + error.message);
    }
  });
}

// Show/hide FCM tokens view
function showFCMTokensView() {
  const appsGrid = document.getElementById('apps-grid');
  const appsHeader = document.querySelector('main > div:first-child');
  const tokensView = document.getElementById('fcm-tokens-view');
  
  if (appsGrid) appsGrid.style.display = 'none';
  if (appsHeader) appsHeader.style.display = 'none';
  if (tokensView) tokensView.classList.remove('hidden');
  
  loadFCMTokens();
}

function hideFCMTokensView() {
  const appsGrid = document.getElementById('apps-grid');
  const appsHeader = document.querySelector('main > div:first-child');
  const tokensView = document.getElementById('fcm-tokens-view');
  
  if (appsGrid) appsGrid.style.display = 'grid';
  if (appsHeader) appsHeader.style.display = 'block';
  if (tokensView) tokensView.classList.add('hidden');
}

// Initialize FCM tokens management
function initializeFCMTokens() {
  setupFCMTokenFormHandler();
  
  // FCM Tokens button
  const fcmTokensBtn = document.getElementById('fcm-tokens-btn');
  if (fcmTokensBtn) {
    fcmTokensBtn.addEventListener('click', () => {
      showFCMTokensView();
    });
  }

  // Back to apps button
  const backBtn = document.getElementById('back-to-apps-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      hideFCMTokensView();
    });
  }

  // Search input handler
  const searchInput = document.getElementById('fcm-tokens-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      fcmTokensSearchTerm = e.target.value;
      loadFCMTokens();
    });
  }

  // New token button
  const newBtn = document.getElementById('new-fcm-token-btn');
  if (newBtn) {
    newBtn.addEventListener('click', () => {
      showFCMTokenForm();
    });
  }

  // Cancel token form
  const cancelBtn = document.getElementById('cancel-fcm-token-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideFCMTokenForm();
    });
  }

  // Close token form button
  const closeBtn = document.getElementById('close-fcm-token-form');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideFCMTokenForm();
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFCMTokens);
} else {
  initializeFCMTokens();
}
