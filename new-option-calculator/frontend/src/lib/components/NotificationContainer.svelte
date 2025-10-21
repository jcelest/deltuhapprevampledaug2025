<script>
  import { notifications, removeNotification } from '../stores/notificationStore.js';
  import NotificationToast from './NotificationToast.svelte';
</script>

<div class="notification-container">
  {#each $notifications as notification (notification.id)}
    <NotificationToast
      show={true}
      type={notification.type}
      title={notification.title}
      message={notification.message}
      duration={notification.duration}
      on:close={() => removeNotification(notification.id)}
    />
  {/each}
</div>

<style>
  .notification-container {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 10000;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    max-width: 480px;
  }
  
  /* Mobile adjustments */
  @media (max-width: 640px) {
    .notification-container {
      left: 0;
      right: 0;
      padding: 0.5rem;
      max-width: none;
    }
  }
</style>
