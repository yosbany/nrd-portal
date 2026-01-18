// Notifications management for NRD Portal

// Helper functions for alerts (simple implementation)
function showError(message) {
  alert('Error: ' + message);
}

function showSuccess(message) {
  alert(message);
}

// Show notification form view
function showSendNotificationView() {
  const appsGrid = document.getElementById('apps-grid');
  const appsHeader = document.querySelector('main > div:first-child');
  const notificationView = document.getElementById('send-notification-view');
  
  if (appsGrid) appsGrid.style.display = 'none';
  if (appsHeader) appsHeader.style.display = 'none';
  if (notificationView) notificationView.classList.remove('hidden');
  
  // Reset form
  const formElement = document.getElementById('notification-form-element');
  if (formElement) formElement.reset();
}

// Hide notification form view
function hideSendNotificationView() {
  const appsGrid = document.getElementById('apps-grid');
  const appsHeader = document.querySelector('main > div:first-child');
  const notificationView = document.getElementById('send-notification-view');
  
  if (appsGrid) appsGrid.style.display = 'grid';
  if (appsHeader) appsHeader.style.display = 'block';
  if (notificationView) notificationView.classList.add('hidden');
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

    try {
      logger.debug('Sending notification', { title, message });
      const notificationId = await sendNotification({ title, message });
      logger.info('Notification created successfully', { notificationId });
      
      // Reset form
      formElement.reset();
      
      await showSuccess('Notificación creada exitosamente. Se enviará a todos los dispositivos registrados en los próximos minutos.');
    } catch (error) {
      logger.error('Failed to send notification', error);
      await showError('Error al enviar notificación: ' + error.message);
    }
  });
}

// Initialize notifications management
function initializeNotifications() {
  setupNotificationFormHandler();
  
  // Send notification button
  const sendNotificationBtn = document.getElementById('send-notification-btn');
  if (sendNotificationBtn) {
    sendNotificationBtn.addEventListener('click', () => {
      showSendNotificationView();
    });
  }

  // Back to apps button
  const backBtn = document.getElementById('back-to-apps-from-notification-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      hideSendNotificationView();
    });
  }

  // Cancel notification button
  const cancelBtn = document.getElementById('cancel-notification-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideSendNotificationView();
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotifications);
} else {
  initializeNotifications();
}
