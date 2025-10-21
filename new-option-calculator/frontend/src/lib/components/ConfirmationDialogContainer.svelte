<script>
  import { confirmationDialog, handleConfirm, handleCancel } from '../stores/confirmationStore.js';
  import ConfirmationDialog from './ConfirmationDialog.svelte';
</script>

{#if $confirmationDialog.show}
  <ConfirmationDialog
    show={$confirmationDialog.show}
    title={$confirmationDialog.title}
    message={$confirmationDialog.message}
    confirmText={$confirmationDialog.confirmText}
    cancelText={$confirmationDialog.cancelText}
    type={$confirmationDialog.type}
    on:confirm={handleConfirm}
    on:cancel={handleCancel}
  />
{/if}
