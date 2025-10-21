import { writable } from 'svelte/store';

// Notification state
export const notifications = writable([]);

// Add a new notification
export function addNotification(notification) {
  const id = Date.now() + Math.random();
  const newNotification = {
    id,
    type: 'info',
    title: '',
    message: '',
    duration: 4000,
    ...notification
  };
  
  notifications.update(current => [...current, newNotification]);
  
  // Auto-remove after duration
  if (newNotification.duration > 0) {
    setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration);
  }
  
  return id;
}

// Remove a notification
export function removeNotification(id) {
  notifications.update(current => current.filter(n => n.id !== id));
}

// Clear all notifications
export function clearNotifications() {
  notifications.set([]);
}

// Convenience methods for different types
export function showSuccess(title, message, duration = 4000) {
  return addNotification({ type: 'success', title, message, duration });
}

export function showError(title, message, duration = 6000) {
  return addNotification({ type: 'error', title, message, duration });
}

export function showWarning(title, message, duration = 5000) {
  return addNotification({ type: 'warning', title, message, duration });
}

export function showInfo(title, message, duration = 4000) {
  return addNotification({ type: 'info', title, message, duration });
}
