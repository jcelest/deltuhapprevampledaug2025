<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let show = false;
  export let isSaving = false;
  export let defaultName = '';
  
  let terminalName = '';
  let terminalDescription = '';
  let errorMessage = '';
  
  // Update terminal name when defaultName changes and modal is shown
  $: if (show && defaultName && !terminalName) {
    terminalName = defaultName;
  }
  
  function handleSave() {
    errorMessage = '';
    
    if (!terminalName.trim()) {
      errorMessage = 'Please enter a name for your terminal';
      return;
    }
    
    dispatch('save', {
      name: terminalName.trim(),
      description: terminalDescription.trim()
    });
  }
  
  function handleClose() {
    if (!isSaving) {
      // Don't clear terminalName here - it will be reset when modal reopens
      terminalDescription = '';
      errorMessage = '';
      dispatch('close');
    }
  }
  
  // Reset the modal when it closes
  $: if (!show) {
    terminalName = '';
    terminalDescription = '';
    errorMessage = '';
  }
  
  function handleKeydown(e) {
    if (e.key === 'Escape' && !isSaving) {
      handleClose();
    }
  }
  
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget && !isSaving) {
      handleClose();
    }
  }
</script>

{#if show}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div 
    class="modal-backdrop" 
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
  >
    <div class="modal-container">
      <div class="modal-header">
        <div class="header-content">
          <div class="icon-container">
            <svg class="save-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </div>
          <div class="header-text">
            <h2 class="modal-title">Save Terminal</h2>
            <p class="modal-subtitle">Save your current workspace for later</p>
          </div>
        </div>
        {#if !isSaving}
          <button class="close-button" on:click={handleClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label for="terminal-name" class="form-label">
            Terminal Name <span class="required">*</span>
          </label>
          <input
            id="terminal-name"
            type="text"
            class="form-input"
            placeholder="e.g., AAPL Iron Condor"
            bind:value={terminalName}
            disabled={isSaving}
            maxlength="100"
            autocomplete="off"
          />
        </div>
        
        <div class="form-group">
          <label for="terminal-description" class="form-label">
            Description <span class="optional">(optional)</span>
          </label>
          <textarea
            id="terminal-description"
            class="form-textarea"
            placeholder="Add notes about this terminal setup..."
            bind:value={terminalDescription}
            disabled={isSaving}
            maxlength="500"
            rows="3"
          ></textarea>
          <div class="char-count">
            {terminalDescription.length}/500
          </div>
        </div>
        
        {#if errorMessage}
          <div class="error-message">
            <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        {/if}
      </div>
      
      <div class="modal-footer">
        <button 
          class="btn btn-secondary" 
          on:click={handleClose}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button 
          class="btn btn-primary" 
          on:click={handleSave}
          disabled={isSaving}
        >
          {#if isSaving}
            <svg class="spinner" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          {:else}
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Save Terminal
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
    animation: fadeIn 0.2s ease-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .modal-container {
    background: linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(17, 24, 39, 0.98) 100%);
    border: 1px solid rgba(167, 139, 250, 0.3);
    border-radius: 1rem;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease-out;
    overflow: hidden;
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(167, 139, 250, 0.2);
    gap: 1rem;
  }
  
  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }
  
  .icon-container {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(167, 139, 250, 0.1));
    border: 1px solid rgba(167, 139, 250, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .save-icon {
    width: 24px;
    height: 24px;
    color: #c4b5fd;
  }
  
  .header-text {
    flex: 1;
    min-width: 0;
  }
  
  .modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
    margin: 0 0 0.25rem 0;
  }
  
  .modal-subtitle {
    font-size: 0.875rem;
    color: #9ca3af;
    margin: 0;
  }
  
  .close-button {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  
  .close-button:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.3);
    color: #f87171;
  }
  
  .close-button svg {
    width: 18px;
    height: 18px;
  }
  
  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #e5e7eb;
  }
  
  .required {
    color: #f87171;
  }
  
  .optional {
    color: #9ca3af;
    font-weight: 400;
    font-size: 0.8125rem;
  }
  
  .form-input,
  .form-textarea {
    padding: 0.75rem 1rem;
    background: rgba(17, 24, 39, 0.6);
    border: 1px solid rgba(75, 85, 99, 0.5);
    border-radius: 8px;
    color: white;
    font-size: 0.9375rem;
    transition: all 0.2s;
    font-family: inherit;
  }
  
  .form-input:focus,
  .form-textarea:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
    background: rgba(17, 24, 39, 0.8);
  }
  
  .form-input:disabled,
  .form-textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .form-input::placeholder,
  .form-textarea::placeholder {
    color: #6b7280;
  }
  
  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }
  
  .char-count {
    font-size: 0.75rem;
    color: #6b7280;
    text-align: right;
  }
  
  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #fca5a5;
    font-size: 0.875rem;
  }
  
  .error-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid rgba(167, 139, 250, 0.1);
  }
  
  .btn {
    padding: 0.625rem 1.5rem;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    min-width: 120px;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: rgba(75, 85, 99, 0.5);
    color: #e5e7eb;
    border: 1px solid rgba(75, 85, 99, 0.8);
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: rgba(75, 85, 99, 0.7);
    border-color: rgba(107, 114, 128, 0.9);
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
    border: 1px solid transparent;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    transform: translateY(-1px);
  }
  
  .btn-icon {
    width: 18px;
    height: 18px;
  }
  
  .spinner {
    width: 18px;
    height: 18px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  /* Mobile Responsive */
  @media (max-width: 640px) {
    .modal-backdrop {
      padding: 0.5rem;
    }
    
    .modal-container {
      border-radius: 0.75rem;
    }
    
    .modal-header {
      padding: 1rem;
    }
    
    .icon-container {
      width: 40px;
      height: 40px;
    }
    
    .save-icon {
      width: 20px;
      height: 20px;
    }
    
    .modal-title {
      font-size: 1.125rem;
    }
    
    .modal-subtitle {
      font-size: 0.8125rem;
    }
    
    .modal-body {
      padding: 1rem;
    }
    
    .modal-footer {
      padding: 1rem;
      flex-direction: column-reverse;
    }
    
    .btn {
      width: 100%;
    }
  }
</style>

