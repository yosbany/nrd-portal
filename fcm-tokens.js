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

// Show notification confirmation modal (returns 'now' or 'scheduled' or null)
function showNotificationConfirmModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById('notification-confirm-modal');
    const sendNowBtn = document.getElementById('notification-send-now-btn');
    const sendScheduledBtn = document.getElementById('notification-send-scheduled-btn');
    const closeBtn = document.getElementById('close-notification-confirm-modal');

    if (!modal || !sendNowBtn || !sendScheduledBtn || !closeBtn) {
      // Fallback to confirm if modal elements don't exist
      const result = confirm('¿Cómo desea enviar la notificación?\n\nAceptar = Enviar al momento (ejecutar workflow ahora)\nCancelar = Programada (se enviará en los próximos 5 minutos)');
      resolve(result ? 'now' : 'scheduled');
      return;
    }

    // Show modal
    modal.classList.remove('hidden');

    // Handle send now
    const handleSendNow = () => {
      modal.classList.add('hidden');
      sendNowBtn.removeEventListener('click', handleSendNow);
      sendScheduledBtn.removeEventListener('click', handleSendScheduled);
      closeBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleBackgroundClick);
      resolve('now');
    };

    // Handle send scheduled
    const handleSendScheduled = () => {
      modal.classList.add('hidden');
      sendNowBtn.removeEventListener('click', handleSendNow);
      sendScheduledBtn.removeEventListener('click', handleSendScheduled);
      closeBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleBackgroundClick);
      resolve('scheduled');
    };

    // Handle cancel
    const handleCancel = () => {
      modal.classList.add('hidden');
      sendNowBtn.removeEventListener('click', handleSendNow);
      sendScheduledBtn.removeEventListener('click', handleSendScheduled);
      closeBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleBackgroundClick);
      resolve(null);
    };

    sendNowBtn.addEventListener('click', handleSendNow);
    sendScheduledBtn.addEventListener('click', handleSendScheduled);
    closeBtn.addEventListener('click', handleCancel);

    // Close on background click
    const handleBackgroundClick = (e) => {
      if (e.target === modal) {
        handleCancel();
      }
    };
    modal.addEventListener('click', handleBackgroundClick);
  });
}

// Show notification result modal
function showNotificationResultModal(type, message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('notification-result-modal');
    const titleEl = document.getElementById('notification-result-title');
    const iconEl = document.getElementById('notification-result-icon');
    const typeEl = document.getElementById('notification-result-type').querySelector('span');
    const messageEl = document.getElementById('notification-result-message');
    const confirmBtn = document.getElementById('notification-result-confirm-btn');
    const closeBtn = document.getElementById('close-notification-result-modal');

    if (!modal || !titleEl || !iconEl || !typeEl || !messageEl || !confirmBtn || !closeBtn) {
      // Fallback to alert if modal elements don't exist
      alert(message);
      resolve();
      return;
    }

    // Set content based on type
    if (type === 'manual') {
      titleEl.textContent = 'Notificación Enviada';
      iconEl.textContent = '✅';
      iconEl.className = 'text-center text-4xl mb-2 text-green-600';
      typeEl.textContent = 'Envío Manual';
      typeEl.className = 'inline-block px-3 py-1 rounded-full text-xs font-light uppercase tracking-wider bg-blue-100 text-blue-700';
      messageEl.textContent = message || 'La notificación se ha enviado manualmente y se procesará inmediatamente. Se enviará a todos los dispositivos registrados ahora.';
    } else if (type === 'scheduled') {
      titleEl.textContent = 'Notificación Programada';
      iconEl.textContent = '⏰';
      iconEl.className = 'text-center text-4xl mb-2 text-blue-600';
      typeEl.textContent = 'Envío Programado';
      typeEl.className = 'inline-block px-3 py-1 rounded-full text-xs font-light uppercase tracking-wider bg-gray-100 text-gray-700';
      messageEl.textContent = message || 'La notificación se ha creado exitosamente. Se enviará a todos los dispositivos registrados en los próximos 5 minutos.';
    } else if (type === 'error') {
      titleEl.textContent = 'Error al Enviar';
      iconEl.textContent = '❌';
      iconEl.className = 'text-center text-4xl mb-2 text-red-600';
      typeEl.textContent = 'Error';
      typeEl.className = 'inline-block px-3 py-1 rounded-full text-xs font-light uppercase tracking-wider bg-red-100 text-red-700';
      messageEl.textContent = message || 'Ocurrió un error al enviar la notificación.';
    } else {
      titleEl.textContent = 'Resultado';
      iconEl.textContent = 'ℹ️';
      iconEl.className = 'text-center text-4xl mb-2 text-gray-600';
      typeEl.textContent = 'Información';
      typeEl.className = 'inline-block px-3 py-1 rounded-full text-xs font-light uppercase tracking-wider bg-gray-100 text-gray-700';
      messageEl.textContent = message || 'Operación completada.';
    }

    // Show modal
    modal.classList.remove('hidden');

    // Handle close
    const handleClose = () => {
      modal.classList.add('hidden');
      confirmBtn.removeEventListener('click', handleClose);
      closeBtn.removeEventListener('click', handleClose);
      modal.removeEventListener('click', handleBackgroundClick);
      resolve();
    };

    confirmBtn.addEventListener('click', handleClose);
    closeBtn.addEventListener('click', handleClose);

    // Close on background click
    const handleBackgroundClick = (e) => {
      if (e.target === modal) {
        handleClose();
      }
    };
    modal.addEventListener('click', handleBackgroundClick);
  });
}

// Load FCM tokens
function loadFCMTokens() {
  const nrd = window.nrd;
  if (!nrd) {
    logger.warn('NRD Data Access not initialized');
    return;
  }
  
  // Check if fcmTokens service is available
  if (!nrd.fcmTokens) {
    logger.error('FCMTokensService not available. Please ensure you are using the latest version of nrd-data-access library.');
    const tokensList = document.getElementById('fcm-tokens-list');
    if (tokensList) {
      tokensList.innerHTML = `
        <div class="text-center py-8 border border-red-200 bg-red-50 p-4">
          <p class="text-red-600 mb-3 text-sm font-medium">Servicio FCM Tokens no disponible</p>
          <p class="text-gray-600 text-xs">Por favor, actualiza la librería nrd-data-access a la última versión.</p>
        </div>
      `;
    }
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
  
  // Scroll al formulario
  setTimeout(() => {
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
  
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
      if (!nrd || !nrd.fcmTokens) {
        logger.error('FCMTokensService not available');
        return;
      }
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
  if (!nrd.fcmTokens) {
    throw new Error('FCMTokensService not available. Please ensure you are using the latest version of nrd-data-access library.');
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
  if (!nrd.fcmTokens) {
    logger.error('FCMTokensService not available');
    await showError('El servicio FCM Tokens no está disponible. Por favor, actualiza la librería nrd-data-access.');
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

// Show notification form
function showNotificationForm() {
  const form = document.getElementById('notification-form');
  if (!form) return;
  
  form.classList.remove('hidden');
  
  // Scroll al formulario
  setTimeout(() => {
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
  
  const formElement = document.getElementById('notification-form-element');
  if (formElement) formElement.reset();
}

// Hide notification form
function hideNotificationForm() {
  const form = document.getElementById('notification-form');
  if (form) form.classList.add('hidden');
}

// Send notification
async function sendNotification(notificationData) {
  const nrd = window.nrd;
  if (!nrd) {
    throw new Error('NRD Data Access not initialized');
  }
  if (!nrd.notifications) {
    throw new Error('NotificationsService not available. Please ensure you are using the latest version of nrd-data-access library.');
  }
  
  const notification = {
    title: notificationData.title,
    message: notificationData.message,
    sent: false,
    createdAt: Date.now()
  };
  
  const notificationId = await nrd.notifications.create(notification);
  return notificationId;
}

// Get GitHub token from Firebase using nrd-data-access
async function getGitHubToken() {
  try {
    const nrd = window.nrd;
    if (!nrd) {
      throw new Error('NRD Data Access not initialized');
    }
    
    if (!nrd.config) {
      throw new Error('ConfigService not available. Please ensure you are using the latest version of nrd-data-access library.');
    }
    
    // Obtener token desde Firebase usando el servicio Config
    const token = await nrd.config.get('githubToken');
    
    if (!token || typeof token !== 'string') {
      throw new Error('Token de GitHub no configurado en Firebase');
    }
    
    return token;
  } catch (error) {
    logger.error('Failed to get GitHub token from Firebase', error);
    throw error;
  }
}

// Trigger GitHub Actions workflow
async function triggerGitHubWorkflow() {
  const GITHUB_OWNER = 'yosbany';
  const GITHUB_REPO = 'nrd-notificacion';
  const WORKFLOW_FILE = 'process-notifications.yml';
  
  // Obtener token desde Firebase
  let GITHUB_TOKEN;
  try {
    GITHUB_TOKEN = await getGitHubToken();
  } catch (error) {
    throw new Error('Token de GitHub no configurado en Firebase. No se puede ejecutar el workflow al momento. La notificación se enviará en los próximos 5 minutos.');
  }
  
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: 'main'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `GitHub API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (e) {
        errorMessage += ` - ${errorText}`;
      }
      throw new Error(errorMessage);
    }
    
    // GitHub API returns 204 No Content for successful workflow_dispatch
    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
      // Success with no content (204 No Content)
      return { success: true, message: 'Workflow triggered successfully' };
    }
    
    // Try to parse JSON only if there's content
    const text = await response.text();
    if (!text || text.trim() === '') {
      return { success: true, message: 'Workflow triggered successfully' };
    }
    
    try {
      return await JSON.parse(text);
    } catch (e) {
      // If JSON parsing fails but status is OK, consider it success
      logger.warn('Could not parse GitHub API response as JSON, but status is OK', { text, status: response.status });
      return { success: true, message: 'Workflow triggered successfully' };
    }
  } catch (error) {
    logger.error('GitHub workflow trigger error', error);
    throw error;
  }
}

// Notification form submit handler
let notificationFormHandlerSetup = false;
function setupNotificationFormHandler() {
  if (notificationFormHandlerSetup) return;
  const formElement = document.getElementById('notification-form-element');
  if (!formElement) return;
  
  notificationFormHandlerSetup = true;
  formElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('notification-title')?.value.trim();
    const message = document.getElementById('notification-message')?.value.trim();

    if (!title) {
      await showError('El título es requerido');
      return;
    }

    if (!message) {
      await showError('El mensaje es requerido');
      return;
    }

    // Mostrar modal de confirmación con opciones
    const sendOption = await showNotificationConfirmModal();
    
    // Si el usuario canceló, no hacer nada
    if (sendOption === null) {
      return;
    }
    
    const sendNow = sendOption === 'now'; // 'now' = Enviar ahora, 'scheduled' = Programado
    
    try {
      logger.debug('Sending notification', { title, message, sendNow });
      const notificationId = await sendNotification({ title, message });
      logger.info('Notification created successfully', { notificationId });
      
      // Si es al momento, ejecutar workflow de GitHub Actions
      if (sendNow) {
        try {
          await triggerGitHubWorkflow();
          // Mostrar modal de resultado manual
          await showNotificationResultModal('manual', 'La notificación se ha enviado manualmente y se procesará inmediatamente. Se enviará a todos los dispositivos registrados ahora.');
        } catch (workflowError) {
          logger.error('Failed to trigger workflow', workflowError);
          // Mostrar modal de error pero indicando que se creó
          await showNotificationResultModal('error', 'Notificación creada pero no se pudo ejecutar el workflow: ' + workflowError.message + '\n\nLa notificación se enviará automáticamente en los próximos 5 minutos.');
        }
      } else {
        // Mostrar modal de resultado programado
        await showNotificationResultModal('scheduled', 'La notificación se ha creado exitosamente. Se enviará a todos los dispositivos registrados en los próximos 5 minutos.');
      }
      
      // Reset form
      formElement.reset();
      hideNotificationForm();
    } catch (error) {
      logger.error('Failed to send notification', error);
      // Mostrar modal de error
      await showNotificationResultModal('error', 'Error al enviar notificación: ' + error.message);
    }
  });
}

// Initialize FCM tokens management
function initializeFCMTokens() {
  setupFCMTokenFormHandler();
  setupNotificationFormHandler();
  
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

  // Send notification button
  const sendNotificationBtn = document.getElementById('send-notification-btn');
  if (sendNotificationBtn) {
    sendNotificationBtn.addEventListener('click', () => {
      showNotificationForm();
    });
  }

  // Close notification form button
  const closeNotificationBtn = document.getElementById('close-notification-form');
  if (closeNotificationBtn) {
    closeNotificationBtn.addEventListener('click', () => {
      hideNotificationForm();
    });
  }

  // Cancel notification button
  const cancelNotificationBtn = document.getElementById('cancel-notification-btn');
  if (cancelNotificationBtn) {
    cancelNotificationBtn.addEventListener('click', () => {
      hideNotificationForm();
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFCMTokens);
} else {
  initializeFCMTokens();
}
