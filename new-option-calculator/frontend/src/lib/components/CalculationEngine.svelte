<script>
  import { createEventDispatcher } from 'svelte';
  import axios from 'axios';

  const dispatch = createEventDispatcher();
  export let config = {};
  export let hasPricingMatrix = false;

  // This function formats a date object to 'YYYY-MM-DD' for the input field.
  function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // --- State Variables ---
  let ticker = '';
  let expiration = getTodayDateString(); // Default to today's date
  let strikePrice = '';
  
  // Data state that will be fetched from our backend
  let stockPrice = '';
  let impliedVolatility = '';

  // State for advanced options
  let optionType = 'call';
  let priceIncrement = '1.0';

  // App state to manage UI feedback
  let isLoading = false;
  let error = '';
  let calculationResults = null;
  
  // State for the informational message
  let infoMessage = '';

  // Advanced UI toggle
  let autoCalculateOnInput = true;
  let showEmbeddedResults = false;

  // The URL of our backend server
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

  // Price increment options for the slider
  const priceIncrementOptions = [
    { value: '0.5', label: '0.50' },
    { value: '1.0', label: '1.00' },
    { value: '2.5', label: '2.50' },
    { value: '5.0', label: '5.00' },
    { value: '10.0', label: '10.00' }
  ];

  // --- Functions ---

  /**
   * Clears any existing results and messages.
   */
  function clearResults() {
    calculationResults = null;
    infoMessage = '';
    error = '';
    dispatch('resultsCleared');
  }

  /**
   * A single function to handle the entire calculation process.
   */
  async function handleCalculate() {
    if (!ticker || !strikePrice || !expiration) {
      error = 'Please fill in Ticker, Strike Price, and Expiration Date.';
      return;
    }
    isLoading = true;
    clearResults();
    
    try {
      // Step 1: Fetch market data (stock price and volatility)
      const marketDataResponse = await axios.post(`${API_URL}/api/fetch-market-data`, { ticker });
      
      // Use user-provided values as overrides if they exist, otherwise use fetched data.
      const finalStockPrice = stockPrice || marketDataResponse.data.currentStockPrice;
      const finalImpliedVolatility = impliedVolatility || marketDataResponse.data.impliedVolatility;

      // Update the input fields with the fetched data for transparency
      stockPrice = finalStockPrice;
      impliedVolatility = finalImpliedVolatility;

      // Step 2: Immediately proceed to generate the option table with all necessary parameters.
      const params = {
        stockPrice: finalStockPrice,
        strikePrice: parseFloat(strikePrice),
        expirationDate: expiration,
        volatility: finalImpliedVolatility,
        optionType,
        priceIncrement: parseFloat(priceIncrement)
      };
      const calculationResponse = await axios.post(`${API_URL}/api/calculate`, params);
      calculationResults = calculationResponse.data;

      // Set the informational message based on market status.
      const asOfTime = new Date(calculationResponse.data.calculationTime);
      if (calculationResponse.data.isMarketOpen) {
        infoMessage = `Prices calculated in real-time as of ${asOfTime.toLocaleString()}.`;
      } else {
        infoMessage = `The market is currently closed. Prices are based on the last market close: ${asOfTime.toLocaleString()}.`;
      }

      // Dispatch results to parent components for PricingMatrix
      dispatch('calculationComplete', {
        results: calculationResults,
        inputData: {
          ticker,
          strikePrice: parseFloat(strikePrice),
          stockPrice: parseFloat(finalStockPrice),
          optionType,
          expiration
        }
      });

    } catch (err) {
      error = 'Failed to calculate option data. Please check the ticker and try again.';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
  
  /**
   * A function to re-calculate only if results are already visible.
   * This is triggered when changing Option Type or Price Increments.
   */
  function reCalculate() {
    if (calculationResults && autoCalculateOnInput) {
      handleCalculate();
    }
  }

  /**
   * Request adding a PricingMatrix component
   */
  function requestPricingMatrix() {
    dispatch('requestComponent', { type: 'PricingMatrix' });
  }

  /**
   * Get the current price increment index for the slider
   */
  function getPriceIncrementIndex() {
    return priceIncrementOptions.findIndex(option => option.value === priceIncrement);
  }

  /**
   * Set price increment from slider index
   */
  function setPriceIncrementFromIndex(index) {
    priceIncrement = priceIncrementOptions[index].value;
    reCalculate();
  }

  // --- Reactive Statements ---

  // Ensure the ticker is always uppercase and contains only letters.
  $: ticker = ticker.replace(/[^a-zA-Z]/g, '').toUpperCase();

  // This block automatically selects a reasonable price increment based on the stock price.
  $: if (stockPrice && !calculationResults) {
    const price = parseFloat(stockPrice);
    if (price >= 1 && price <= 10) priceIncrement = '0.5';
    else if (price >= 11 && price <= 99) priceIncrement = '1.0';
    else if (price >= 100 && price <= 199) priceIncrement = '2.5';
    else if (price >= 200 && price <= 999) priceIncrement = '5.0';
    else if (price >= 1000) priceIncrement = '10.0';
  }

  // Auto-calculate when option type changes
  $: if (optionType) {
    reCalculate();
  }
</script>

<div class="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700 space-y-8 h-full overflow-y-auto">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl sm:text-2xl font-bold text-white">Calculation Engine</h2>
    <div class="flex items-center space-x-4">
      <!-- Custom Toggle for Auto-calculate -->
      <label class="flex items-center space-x-3 cursor-pointer">
        <div class="relative">
          <input
            type="checkbox"
            bind:checked={autoCalculateOnInput}
            class="sr-only"
          />
          <div class={`block w-14 h-8 rounded-full transition-colors ${
            autoCalculateOnInput ? 'bg-indigo-600' : 'bg-gray-600'
          }`}>
            <div class={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
              autoCalculateOnInput ? 'transform translate-x-6' : ''
            }`} />
          </div>
        </div>
        <span class="font-semibold text-gray-400 text-sm">Auto-calculate</span>
      </label>

      <!-- Results Toggle -->
      {#if calculationResults}
        <button
          on:click={() => showEmbeddedResults = !showEmbeddedResults}
          class="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
        >
          {showEmbeddedResults ? 'Hide Details' : 'Show Details'}
        </button>
      {/if}
    </div>
  </div>

  <!-- Main Inputs -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <label class="flex flex-col space-y-2">
      <span class="font-semibold text-gray-400">Ticker</span>
      <input 
        bind:value={ticker} 
        type="text" 
        placeholder="e.g., AAPL" 
        class="uppercase bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-white"
      />
    </label>
    <label class="flex flex-col space-y-2">
      <span class="font-semibold text-gray-400">Strike Price</span>
      <input 
        bind:value={strikePrice} 
        type="number" 
        class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-white" 
        placeholder="e.g., 540"
      />
    </label>
    <label class="flex flex-col space-y-2">
      <span class="font-semibold text-gray-400">Expiration Date</span>
      <input 
        bind:value={expiration} 
        type="date" 
        class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-white"
      />
    </label>
  </div>

  <!-- Advanced Inputs -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <label class="flex flex-col space-y-2">
      <span class="font-semibold text-gray-400">Current Stock Price (Optional)</span>
      <input 
        bind:value={stockPrice} 
        type="number" 
        class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-white" 
        placeholder="Auto-fetched"
      />
    </label>
    <label class="flex flex-col space-y-2">
      <span class="font-semibold text-gray-400">Implied Volatility (Optional)</span>
      <input 
        bind:value={impliedVolatility} 
        type="number" 
        class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-white" 
        placeholder="Auto-fetched"
      />
    </label>
  </div>

  <hr class="border-gray-700">

  <!-- Calculation Controls -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
    <label class="flex flex-col space-y-2">
      <span class="font-semibold text-gray-400">Option Type</span>
      <select 
        bind:value={optionType} 
        on:change={reCalculate}
        class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition h-[52px] text-white"
      >
        <option value="call">Calls</option>
        <option value="put">Puts</option>
      </select>
    </label>

    <!-- Price Increment Slider -->
    <label class="flex flex-col space-y-2">
      <span class="font-semibold text-gray-400">Price Increments: ${priceIncrementOptions[getPriceIncrementIndex()].label}</span>
      <div class="relative h-[52px] flex items-center">
        <input
          type="range"
          min="0"
          max={priceIncrementOptions.length - 1}
          step="1"
          value={getPriceIncrementIndex()}
          on:input={(e) => setPriceIncrementFromIndex(parseInt(e.target.value))}
          class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1 absolute -bottom-6 w-full">
          {#each priceIncrementOptions as option}
            <span>${option.label}</span>
          {/each}
        </div>
      </div>
    </label>

    <button 
      on:click={handleCalculate} 
      disabled={isLoading} 
      class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-all text-base sm:text-lg h-[52px] disabled:bg-indigo-800 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Calculating...' : 'Calculate'}
    </button>
  </div>

  {#if error}
    <div class="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">
      {error}
    </div>
  {/if}

  <!-- Simplified Results Section -->
  {#if calculationResults}
    <div class="space-y-6 border-t border-gray-700 pt-8">
      
      {#if infoMessage && showEmbeddedResults}
        <div class="bg-gray-800/60 border border-gray-700 text-gray-300 p-4 rounded-lg text-center text-base flex items-center justify-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 flex-shrink-0 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <span class="font-medium">{infoMessage}</span>
        </div>
      {/if}

      <!-- Main Results Card -->
      <div class="bg-gray-700 p-6 rounded-lg border border-gray-600">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h3 class="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
              Current {optionType === 'call' ? 'Call' : 'Put'} Price
            </h3>
            <p class="text-3xl sm:text-4xl font-sans text-white font-bold">
              {optionType === 'call' ? calculationResults.callPriceRange : calculationResults.putPriceRange}
            </p>
            {#if infoMessage && !showEmbeddedResults}
              <p class="text-sm text-gray-400 mt-2">
                {calculationResults.isMarketOpen ? 'Real-time pricing' : 'Last close pricing'}
              </p>
            {/if}
          </div>
          <div class="flex flex-col gap-3 ml-6">
            {#if hasPricingMatrix}
              <div class="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 opacity-75">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Matrix Already Open
              </div>
            {:else}
              <button 
                on:click={requestPricingMatrix}
                class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Full Matrix
              </button>
            {/if}
            <button 
              on:click={() => showEmbeddedResults = !showEmbeddedResults}
              class="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-medium transition-all text-sm"
            >
              {showEmbeddedResults ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Stats Grid (always visible) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-gray-700 p-4 rounded-lg border border-gray-600 text-center">
          <div class="text-sm text-gray-400 mb-1">Ticker</div>
          <div class="text-lg font-bold text-white">{ticker}</div>
        </div>
        <div class="bg-gray-700 p-4 rounded-lg border border-gray-600 text-center">
          <div class="text-sm text-gray-400 mb-1">Strike</div>
          <div class="text-lg font-bold text-white">${strikePrice}</div>
        </div>
        <div class="bg-gray-700 p-4 rounded-lg border border-gray-600 text-center">
          <div class="text-sm text-gray-400 mb-1">Stock Price</div>
          <div class="text-lg font-bold text-white">${parseFloat(stockPrice).toFixed(2)}</div>
        </div>
        <div class="bg-gray-700 p-4 rounded-lg border border-gray-600 text-center">
          <div class="text-sm text-gray-400 mb-1">Expiration</div>
          <div class="text-lg font-bold text-white">{expiration}</div>
        </div>
      </div>

      <!-- Extended Details (toggleable) -->
      {#if showEmbeddedResults}
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div class="text-sm text-gray-400 mb-2">Implied Volatility</div>
              <div class="text-2xl font-bold text-white">{parseFloat(impliedVolatility).toFixed(2)}%</div>
            </div>
            <div class="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div class="text-sm text-gray-400 mb-2">Price Increment</div>
              <div class="text-2xl font-bold text-white">${priceIncrement}</div>
            </div>
          </div>

          <!-- Market Status -->
          <div class="bg-gray-700 p-4 rounded-lg border border-gray-600">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-gray-400 mb-1">Market Status</div>
                <div class="flex items-center gap-2">
                  <div class={`w-3 h-3 rounded-full ${calculationResults.isMarketOpen ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span class="text-lg font-semibold text-white">
                    {calculationResults.isMarketOpen ? 'Market Open' : 'Market Closed'}
                  </span>
                </div>
              </div>
              <div class="text-sm text-gray-400 text-right">
                <div>Last Updated</div>
                <div class="text-white">{new Date(calculationResults.calculationTime).toLocaleTimeString()}</div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button 
              on:click={handleCalculate}
              disabled={isLoading}
              class="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-semibold transition-all disabled:bg-gray-700"
            >
              Recalculate
            </button>
            <button 
              on:click={clearResults}
              class="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 px-4 rounded-lg font-semibold transition-all"
            >
              Clear Results
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Custom slider styles */
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    cursor: pointer;
    border: 2px solid #1f2937;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .slider::-webkit-slider-thumb:hover {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    transform: scale(1.1);
  }

  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    cursor: pointer;
    border: 2px solid #1f2937;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .slider::-webkit-slider-track {
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right, #374151, #6366f1, #374151);
  }

  .slider::-moz-range-track {
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right, #374151, #6366f1, #374151);
  }

  /* Focus styles */
  .slider:focus {
    outline: none;
  }

  .slider:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4);
  }
</style>