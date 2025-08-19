<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  export let calculationResults = null;
  export let inputData = {};
  export const config = {}; // Mark as const to indicate external reference only

  // Mock Greeks data - in real implementation, these would come from your backend
  $: greeksData = calculationResults ? {
    delta: calculationResults.greeks?.delta || (inputData.optionType === 'call' ? 0.6523 : -0.3477),
    gamma: calculationResults.greeks?.gamma || 0.0234,
    theta: calculationResults.greeks?.theta || -0.1245,
    vega: calculationResults.greeks?.vega || 0.2134,
    rho: calculationResults.greeks?.rho || 0.0567
  } : null;

  function getGreekColor(greek, value) {
    switch(greek) {
      case 'delta':
        return value > 0 ? 'text-green-400' : 'text-red-400';
      case 'gamma':
        return 'text-blue-400';
      case 'theta':
        return value < 0 ? 'text-red-400' : 'text-green-400';
      case 'vega':
        return 'text-purple-400';
      case 'rho':
        return value > 0 ? 'text-green-400' : 'text-red-400';
      default:
        return 'text-gray-400';
    }
  }

  function getGreekDescription(greek) {
    switch(greek) {
      case 'delta':
        return 'Price sensitivity to underlying';
      case 'gamma':
        return 'Rate of change of delta';
      case 'theta':
        return 'Time decay per day';
      case 'vega':
        return 'Volatility sensitivity';
      case 'rho':
        return 'Interest rate sensitivity';
      default:
        return '';
    }
  }
</script>

<div class="bg-transparent p-6 h-full flex flex-col">
  <div class="flex items-center justify-between mb-6 flex-shrink-0">
    <h2 class="text-xl font-bold text-white">Greeks Dashboard</h2>
    {#if inputData.ticker}
      <span class="text-sm text-gray-400 font-mono">{inputData.ticker}</span>
    {/if}
  </div>

  <div class="flex-1 overflow-hidden">
    {#if greeksData}
      <div class="grid grid-cols-2 gap-4 h-full">
        {#each Object.entries(greeksData) as [greek, value]}
          <div class="bg-gray-700/80 p-4 rounded-lg border border-gray-600/50 backdrop-blur-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                {greek}
              </span>
              <span class="text-xs text-gray-500">
                {greek === 'delta' ? 'Δ' : greek === 'gamma' ? 'Γ' : greek === 'theta' ? 'Θ' : greek === 'vega' ? 'ν' : 'ρ'}
              </span>
            </div>
            <div class="text-2xl font-bold {getGreekColor(greek, value)} mb-1">
              {typeof value === 'number' ? (Math.abs(value) < 1 ? value.toFixed(4) : value.toFixed(2)) : value}
            </div>
            <div class="text-xs text-gray-400">
              {getGreekDescription(greek)}
            </div>
          </div>
        {/each}
      </div>

      {#if inputData.optionType}
        <div class="mt-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600/30 backdrop-blur-sm flex-shrink-0">
          <h3 class="text-sm font-semibold text-gray-300 mb-2">Option Analysis</h3>
          <div class="text-xs text-gray-400 space-y-1">
            <p>• Delta indicates the option will move ~${Math.abs(greeksData.delta).toFixed(2)} for every $1 move in {inputData.ticker || 'the underlying'}</p>
            <p>• Theta shows ${Math.abs(greeksData.theta).toFixed(2)} daily time decay</p>
            <p>• Vega sensitivity: ${greeksData.vega.toFixed(2)} per 1% volatility change</p>
          </div>
        </div>
      {/if}
    {:else}
      <div class="h-full flex items-center justify-center text-gray-400">
        <div class="text-center">
          <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>Calculate options to see Greeks</p>
        </div>
      </div>
    {/if}
  </div>
</div>