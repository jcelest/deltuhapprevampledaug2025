<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export const componentRegistry = {};
  
const availableComponents = [
  {
    type: 'CalculationEngine',
    title: 'Calculation Engine',
    description: 'Input parameters and calculate option prices',
    icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
  },
  {
    type: 'PricingMatrix',
    title: 'Pricing Matrix',
    description: 'View option prices across time and price ranges',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
  },
  {
    type: 'GreeksDashboard',
    title: 'Greeks Dashboard',
    description: 'Monitor Delta, Gamma, Theta, Vega, and Rho',
    icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z'
  },
  {
    type: 'OptionAnalysis',
    title: 'Option Analysis',
    description: 'Advanced analysis with price targets, time decay, and volatility impact',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
  },
  {
    type: 'MarketData',
    title: 'Market Data',
    description: 'Real-time market information and analysis',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
  },
  {
    type: 'IVRank',
    title: 'IV Rank',
    description: 'Simple volatility gauge showing if options are expensive or cheap',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
  }
];
  
  function addComponent(componentType) {
    dispatch('addComponent', { componentType });
    dispatch('close');
  }
  
  function closeModal() {
    dispatch('close');
  }
  
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }
  
  function handleBackdropKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      closeModal();
    }
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div 
  class="modal-backdrop"
  on:click={handleBackdropClick}
  on:keydown={handleBackdropKeydown}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  tabindex="0"
>
  <div class="modal-container">
    <!-- Header -->
    <div class="modal-header">
      <div class="header-content">
        <img src="/deltuh logo.svg" alt="Deltuh" class="deltuh-logo" />
        <h2 id="modal-title" class="modal-title">Add Component</h2>
      </div>
      <button
        on:click={closeModal}
        class="close-button"
        aria-label="Close modal"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <!-- Component grid -->
    <div class="modal-content">
      <div class="components-grid">
        {#each availableComponents as component}
          <button
            on:click={() => addComponent(component.type)}
            class="component-card"
          >
            <div class="component-content">
              <div class="component-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={component.icon} />
                </svg>
              </div>
              <div class="component-info">
                <h3 class="component-title">
                  {component.title}
                </h3>
                <p class="component-description">
                  {component.description}
                </p>
                <div class="component-action">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add to workspace</span>
                </div>
              </div>
            </div>
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Footer -->
    <div class="modal-footer">
      <p class="footer-text">
        Click on a component to add it to your workspace. You can customize and rearrange components after adding them.
      </p>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 1rem;
    animation: fadeIn 0.2s ease-out;
    backdrop-filter: blur(4px);
  }

  .modal-container {
    background: linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
    border-radius: 16px;
    border: 1px solid rgba(167, 139, 250, 0.15);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    max-width: 42rem;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    animation: slideIn 0.3s ease-out;
    backdrop-filter: blur(10px);
  }

  /* Header */
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(167, 139, 250, 0.1);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .deltuh-logo {
    height: 28px;
    width: auto;
    filter: brightness(1.1);
    opacity: 0.9;
  }

  .modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #fff, #c4b5fd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }

  .close-button {
    padding: 0.5rem;
    color: #94a3b8;
    transition: all 0.3s;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover {
    color: white;
    background: rgba(167, 139, 250, 0.1);
  }

  .close-button svg {
    height: 24px;
    width: 24px;
  }

  /* Content */
  .modal-content {
    padding: 1.5rem;
    overflow-y: auto;
    max-height: 60vh;
  }

  /* Custom scrollbar */
  .modal-content::-webkit-scrollbar {
    width: 6px;
  }

  .modal-content::-webkit-scrollbar-track {
    background: rgba(17, 24, 39, 0.3);
    border-radius: 3px;
  }

  .modal-content::-webkit-scrollbar-thumb {
    background: rgba(167, 139, 250, 0.3);
    border-radius: 3px;
  }

  .modal-content::-webkit-scrollbar-thumb:hover {
    background: rgba(167, 139, 250, 0.5);
  }

  .components-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
  }

  .component-card {
    background: rgba(17, 24, 39, 0.6);
    border: 1px solid rgba(167, 139, 250, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    text-align: left;
    transition: all 0.3s;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .component-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(196, 181, 253, 0.02));
    opacity: 0;
    transition: opacity 0.3s;
  }

  .component-card:hover {
    border-color: rgba(167, 139, 250, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }

  .component-card:hover::before {
    opacity: 1;
  }

  .component-card:focus {
    outline: none;
    border-color: rgba(167, 139, 250, 0.4);
    box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
  }

  .component-content {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    position: relative;
    z-index: 1;
  }

  .component-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(167, 139, 250, 0.1);
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 10px;
    transition: all 0.3s;
  }

  .component-card:hover .component-icon {
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(196, 181, 253, 0.1));
    border-color: rgba(167, 139, 250, 0.3);
    transform: scale(1.05);
  }

  .component-icon svg {
    width: 24px;
    height: 24px;
    color: #c4b5fd;
  }

  .component-info {
    flex: 1;
    min-width: 0;
  }

  .component-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: white;
    margin: 0 0 0.5rem 0;
    transition: color 0.3s;
  }

  .component-card:hover .component-title {
    color: #c4b5fd;
  }

  .component-description {
    font-size: 0.875rem;
    color: #94a3b8;
    line-height: 1.4;
    margin: 0 0 0.75rem 0;
    transition: color 0.3s;
  }

  .component-card:hover .component-description {
    color: #cbd5e1;
  }

  .component-action {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: #a78bfa;
    font-weight: 500;
    transition: all 0.3s;
  }

  .component-card:hover .component-action {
    color: #c4b5fd;
    transform: translateX(2px);
  }

  .component-action svg {
    width: 16px;
    height: 16px;
  }

  /* Footer */
  .modal-footer {
    padding: 1rem 1.5rem;
    background: rgba(17, 24, 39, 0.3);
    border-top: 1px solid rgba(167, 139, 250, 0.1);
  }

  .footer-text {
    font-size: 0.875rem;
    color: #94a3b8;
    text-align: center;
    margin: 0;
    line-height: 1.4;
  }

  /* Animations */
  @keyframes fadeIn {
    from { 
      opacity: 0; 
    }
    to { 
      opacity: 1; 
    }
  }

  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0.5rem;
    }

    .modal-container {
      max-height: 95vh;
    }

    .modal-header {
      padding: 1rem;
    }

    .modal-title {
      font-size: 1.25rem;
    }

    .deltuh-logo {
      height: 24px;
    }

    .modal-content {
      padding: 1rem;
      max-height: 70vh;
    }

    .components-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .component-card {
      padding: 1.25rem;
    }

    .component-content {
      gap: 0.875rem;
    }

    .component-icon {
      width: 40px;
      height: 40px;
    }

    .component-icon svg {
      width: 20px;
      height: 20px;
    }

    .component-title {
      font-size: 1rem;
    }

    .component-description {
      font-size: 0.8125rem;
    }

    .modal-footer {
      padding: 0.875rem 1rem;
    }

    .footer-text {
      font-size: 0.8125rem;
    }
  }

  @media (max-width: 640px) {
    .modal-container {
      border-radius: 12px;
    }

    .component-card {
      padding: 1rem;
    }

    .component-content {
      flex-direction: column;
      text-align: center;
    }

    .component-icon {
      align-self: center;
    }
  }
</style>