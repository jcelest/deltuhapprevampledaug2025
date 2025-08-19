<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let componentRegistry = {};
  
  const availableComponents = [
    {
      type: 'CalculationEngine',
      title: 'Calculation Engine',
      description: 'Input parameters and calculate option prices',
      icon: '🧮'
    },
    {
      type: 'PricingMatrix',
      title: 'Pricing Matrix',
      description: 'View option prices across time and price ranges',
      icon: '📊'
    },
    {
      type: 'GreeksDashboard',
      title: 'Greeks Dashboard',
      description: 'Monitor Delta, Gamma, Theta, Vega, and Rho',
      icon: '📈'
    },
    {
      type: 'MarketData',
      title: 'Market Data',
      description: 'Real-time market information and news',
      icon: '📰'
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
  
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal backdrop -->
<div 
  class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  on:click={handleBackdropClick}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <!-- Modal content -->
  <div class="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-700">
      <h2 id="modal-title" class="text-xl sm:text-2xl font-bold text-white">Add Component</h2>
      <button
        on:click={closeModal}
        class="text-gray-400 hover:text-white transition-colors p-1"
        aria-label="Close modal"
      >
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <!-- Component grid -->
    <div class="p-6 overflow-y-auto max-h-[70vh]">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {#each availableComponents as component}
          <button
            on:click={() => addComponent(component.type)}
            class="group bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-gray-500 rounded-lg p-6 text-left transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div class="flex items-start space-x-4">
              <div class="text-3xl group-hover:scale-110 transition-transform">
                {component.icon}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {component.title}
                </h3>
                <p class="text-sm text-gray-400 group-hover:text-gray-300 transition-colors mt-1">
                  {component.description}
                </p>
                <div class="mt-3 flex items-center text-xs text-indigo-400 group-hover:text-indigo-300">
                  <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add to workspace
                </div>
              </div>
            </div>
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Footer -->
    <div class="px-6 py-4 bg-gray-700/50 border-t border-gray-700">
      <p class="text-sm text-gray-400 text-center">
        Click on a component to add it to your workspace. You can customize and rearrange components after adding them.
      </p>
    </div>
  </div>
</div>

<style>
  /* Smooth modal animations */
  div[role="dialog"] {
    animation: fadeIn 0.2s ease-out;
  }
  
  div[role="dialog"] > div {
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
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
</style>