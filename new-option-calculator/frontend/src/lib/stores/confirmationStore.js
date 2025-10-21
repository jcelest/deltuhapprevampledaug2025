import { writable } from 'svelte/store';

// Confirmation dialog state
export const confirmationDialog = writable({
  show: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'warning',
  resolve: null
});

// Show confirmation dialog and return a promise
export function showConfirmationDialog(title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning') {
  return new Promise((resolve) => {
    confirmationDialog.set({
      show: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      resolve
    });
  });
}

// Handle confirmation
export function handleConfirm() {
  confirmationDialog.update(dialog => {
    if (dialog.resolve) {
      dialog.resolve(true);
    }
    return {
      ...dialog,
      show: false,
      resolve: null
    };
  });
}

// Handle cancellation
export function handleCancel() {
  confirmationDialog.update(dialog => {
    if (dialog.resolve) {
      dialog.resolve(false);
    }
    return {
      ...dialog,
      show: false,
      resolve: null
    };
  });
}
