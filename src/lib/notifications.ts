/**
 * Utilidades para Notificaciones Web Push y Avisos Nativos en PWA
 */

export const isPushSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getPushPermission = (): NotificationPermission => {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
};

export const requestPushPermission = async (): Promise<NotificationPermission> => {
  if (!isPushSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error al solicitar permiso de notificaciones:', error);
    return 'denied';
  }
};

export const sendBrowserNotification = (
  title: string,
  options?: {
    body?: string;
    tag?: string;
    icon?: string;
    badge?: string;
    data?: any;
  }
) => {
  if (!isPushSupported() || Notification.permission !== 'granted') return;

  const defaultOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    ...options,
  };

  // Intentar mostrar vía Service Worker para mejor soporte en móviles y PWA
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.showNotification(title, defaultOptions);
      })
      .catch(() => {
        try {
          new Notification(title, defaultOptions);
        } catch (e) {
          console.warn('Fallback notification failed:', e);
        }
      });
  } else {
    try {
      new Notification(title, defaultOptions);
    } catch (e) {
      console.warn('Notification failed:', e);
    }
  }
};
