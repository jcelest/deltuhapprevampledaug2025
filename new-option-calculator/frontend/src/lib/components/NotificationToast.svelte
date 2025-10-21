<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let show = false;
  export let type = 'success'; // 'success', 'error', 'info', 'warning'
  export let title = '';
  export let message = '';
  export let duration = 4000; // Auto-hide duration in ms
  
  let progress = 100;
  let progressInterval;
  
  $: if (show && duration > 0) {
    startProgress();
  }
  
  function startProgress() {
    progress = 100;
    const interval = 50; // Update every 50ms
    const decrement = (interval / duration) * 100;
    
    progressInterval = setInterval(() => {
      progress -= decrement;
      if (progress <= 0) {
        clearInterval(progressInterval);
        handleClose();
      }
    }, interval);
  }
  
  function handleClose() {
    clearInterval(progressInterval);
    dispatch('close');
  }
  
  function getIcon() {
    switch (type) {
      case 'success':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>`;
      case 'error':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>`;
      case 'warning':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`;
      case 'info':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`;
      default:
        return '';
    }
  }
  
  function getTypeStyles() {
    switch (type) {
      case 'success':
        return {
          bg: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.1))',
          border: 'rgba(34, 197, 94, 0.3)',
          icon: '#22c55e',
          text: '#86efac'
        };
      case 'error':
        return {
          bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))',
          border: 'rgba(239, 68, 68, 0.3)',
          icon: '#ef4444',
          text: '#fca5a5'
        };
      case 'warning':
        return {
          bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1))',
          border: 'rgba(245, 158, 11, 0.3)',
          icon: '#f59e0b',
          text: '#fbbf24'
        };
      case 'info':
        return {
          bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))',
          border: 'rgba(59, 130, 246, 0.3)',
          icon: '#3b82f6',
          text: '#93c5fd'
        };
      default:
        return {
          bg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.1))',
          border: 'rgba(139, 92, 246, 0.3)',
          icon: '#8b5cf6',
          text: '#c4b5fd'
        };
    }
  }
  
  const typeStyles = getTypeStyles();
</script>

{#if show}
  <div 
    class="notification-toast"
    style="background: {typeStyles.bg}; border-color: {typeStyles.border};"
    on:click={handleClose}
    on:keydown={(e) => e.key === 'Escape' && handleClose()}
    role="alert"
    tabindex="0"
  >
    <!-- Progress Bar -->
    {#if duration > 0}
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          style="width: {progress}%; background: {typeStyles.icon};"
        ></div>
      </div>
    {/if}
    
    <!-- Content -->
    <div class="notification-content">
      <!-- Icon -->
      <div class="notification-icon" style="color: {typeStyles.icon};">
        {@html getIcon()}
      </div>
      
      <!-- Text Content -->
      <div class="notification-text">
        {#if title}
          <h4 class="notification-title">{title}</h4>
        {/if}
        {#if message}
          <p class="notification-message" style="color: {typeStyles.text};">{message}</p>
        {/if}
      </div>
      
      <!-- Close Button -->
      <button 
        class="notification-close"
        on:click={handleClose}
        aria-label="Close notification"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
{/if}

<style>
  .notification-toast {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 10000;
    min-width: 320px;
    max-width: 480px;
    border-radius: 12px;
    border: 1px solid;
    backdrop-filter: blur(10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: all 0.3s ease;
    animation: slideInRight 0.4s ease-out;
    overflow: hidden;
  }
  
  .notification-toast:hover {
    transform: translateY(-2px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    transition: width 50ms linear;
    border-radius: 0 3px 3px 0;
  }
  
  .notification-content {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
  }
  
  .notification-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
  
  .notification-icon svg {
    width: 100%;
    height: 100%;
  }
  
  .notification-text {
    flex: 1;
    min-width: 0;
  }
  
  .notification-title {
    font-size: 0.9375rem;
    font-weight: 700;
    color: white;
    margin: 0 0 0.25rem 0;
    line-height: 1.3;
  }
  
  .notification-message {
    font-size: 0.875rem;
    margin: 0;
    line-height: 1.4;
  }
  
  .notification-close {
    width: 24px;
    height: 24px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  
  .notification-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    transform: scale(1.1);
  }
  
  .notification-close svg {
    width: 14px;
    height: 14px;
  }
  
  /* Mobile Responsive */
  @media (max-width: 640px) {
    .notification-toast {
      top: 0.5rem;
      right: 0.5rem;
      left: 0.5rem;
      min-width: auto;
      max-width: none;
    }
    
    .notification-content {
      padding: 0.875rem;
      gap: 0.625rem;
    }
    
    .notification-icon {
      width: 20px;
      height: 20px;
    }
    
    .notification-title {
      font-size: 0.875rem;
    }
    
    .notification-message {
      font-size: 0.8125rem;
    }
    
    .notification-close {
      width: 20px;
      height: 20px;
    }
    
    .notification-close svg {
      width: 12px;
      height: 12px;
    }
  }
  
  /* Dark theme adjustments */
  @media (prefers-color-scheme: dark) {
    .notification-toast {
      background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.95));
    }
  }
</style>
