<script>
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  
  const dispatch = createEventDispatcher();
  
  export let show = false;
  export let title = 'Confirm Action';
  export let message = 'Are you sure you want to proceed?';
  export let confirmText = 'Confirm';
  export let cancelText = 'Cancel';
  export let type = 'warning'; // 'warning', 'danger', 'info'
  
  function handleConfirm() {
    dispatch('confirm');
  }
  
  function handleCancel() {
    dispatch('cancel');
  }
  
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }
  
  function getTypeStyles() {
    switch (type) {
      case 'danger':
        return {
          icon: '#ef4444',
          confirmBg: 'linear-gradient(135deg, #ef4444, #dc2626)',
          confirmHover: 'linear-gradient(135deg, #dc2626, #b91c1c)'
        };
      case 'warning':
        return {
          icon: '#f59e0b',
          confirmBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
          confirmHover: 'linear-gradient(135deg, #d97706, #b45309)'
        };
      case 'info':
        return {
          icon: '#3b82f6',
          confirmBg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          confirmHover: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
        };
      default:
        return {
          icon: '#8b5cf6',
          confirmBg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          confirmHover: 'linear-gradient(135deg, #7c3aed, #6d28d9)'
        };
    }
  }
  
  const typeStyles = getTypeStyles();
</script>

{#if show}
  <div
    class="dialog-backdrop"
    transition:fade={{ duration: 200 }}
    on:click={handleBackdropClick}
  >
    <div
      class="dialog-content"
      transition:fly={{ y: 50, duration: 300 }}
      on:click|stopPropagation
    >
      <!-- Header -->
      <div class="dialog-header">
        <div class="dialog-icon" style="color: {typeStyles.icon};">
          {#if type === 'danger'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          {:else if type === 'warning'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          {/if}
        </div>
        <h3 class="dialog-title">{title}</h3>
      </div>
      
      <!-- Body -->
      <div class="dialog-body">
        <p class="dialog-message">{message}</p>
      </div>
      
      <!-- Footer -->
      <div class="dialog-footer">
        <button
          class="cancel-button"
          on:click={handleCancel}
        >
          {cancelText}
        </button>
        <button
          class="confirm-button"
          style="background: {typeStyles.confirmBg};"
          on:click={handleConfirm}
          on:mouseenter={(e) => e.target.style.background = typeStyles.confirmHover}
          on:mouseleave={(e) => e.target.style.background = typeStyles.confirmBg}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  }
  
  .dialog-content {
    background: linear-gradient(135deg, #1f2937, #111827);
    border-radius: 16px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    width: 90%;
    max-width: 480px;
    color: #e5e7eb;
    border: 1px solid rgba(167, 139, 250, 0.2);
    overflow: hidden;
  }
  
  .dialog-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 1.5rem 1rem 1.5rem;
    border-bottom: 1px solid rgba(167, 139, 250, 0.1);
  }
  
  .dialog-icon {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }
  
  .dialog-icon svg {
    width: 100%;
    height: 100%;
  }
  
  .dialog-title {
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(135deg, #fff, #c4b5fd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }
  
  .dialog-body {
    padding: 1.5rem;
  }
  
  .dialog-message {
    font-size: 1rem;
    line-height: 1.6;
    color: #d1d5db;
    margin: 0;
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem 1.5rem 1.5rem;
    border-top: 1px solid rgba(167, 139, 250, 0.1);
  }
  
  .cancel-button,
  .confirm-button {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    min-width: 100px;
  }
  
  .cancel-button {
    background: #4b5563;
    color: #e5e7eb;
    border: 1px solid #4b5563;
  }
  
  .cancel-button:hover {
    background: #6b7280;
    border-color: #6b7280;
    transform: translateY(-1px);
  }
  
  .confirm-button {
    color: white;
    border: 1px solid transparent;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  
  .confirm-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
  
  .confirm-button:active {
    transform: translateY(0);
  }
  
  /* Mobile adjustments */
  @media (max-width: 640px) {
    .dialog-content {
      width: 95%;
      margin: 1rem;
    }
    
    .dialog-header {
      padding: 1rem 1rem 0.75rem 1rem;
      gap: 0.75rem;
    }
    
    .dialog-icon {
      width: 28px;
      height: 28px;
    }
    
    .dialog-title {
      font-size: 1.125rem;
    }
    
    .dialog-body {
      padding: 1rem;
    }
    
    .dialog-message {
      font-size: 0.9375rem;
    }
    
    .dialog-footer {
      padding: 0.75rem 1rem 1rem 1rem;
      gap: 0.5rem;
    }
    
    .cancel-button,
    .confirm-button {
      padding: 0.625rem 1.25rem;
      font-size: 0.9375rem;
      min-width: 80px;
    }
  }
</style>
