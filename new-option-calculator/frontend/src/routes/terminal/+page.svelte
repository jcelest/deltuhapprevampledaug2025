<script>
  import axios from 'axios';
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { authToken } from '../../stores/authStore.js';

  // Protect the route
  onMount(() => {
    if (!$authToken) {
      goto('/login');
    }
  });

  // --- State Variables ---

  // Input state with default values
  let ticker = 'SPY';
  let expiration = '2025-12-19';
  let strikePrice = 540;
  
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

  // A reference to the results container for auto-scrolling
  let resultsSection;
  
  // State for the heatmap calculation
  let heatmapMaxDifference = 0;

  // State for the Entry Price Analysis feature
  let isAnalyzing = false;
  let entryPrice = '';
  let entryPriceHeatmapMax = 0;

  // The URL of our backend server
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

  // --- Functions ---

  /**
   * Clears any existing results and messages. This is called when primary inputs change.
   */
  function clearResults() {
      calculationResults = null;
      infoMessage = '';
      error = '';
      isAnalyzing = false;
      entryPrice = '';
  }

  /**
   * Fetches mock market data for the given ticker.
   */
  async function handleSearch() {
    if (!ticker) {
      error = 'Please enter a ticker symbol.';
      return;
    }
    isLoading = true;
    clearResults();
    try {
      const response = await axios.post(`${API_URL}/api/fetch-market-data`, { ticker });
      stockPrice = response.data.currentStockPrice;
      impliedVolatility = response.data.impliedVolatility;
    } catch (err) {
      error = 'Failed to fetch market data from the server.';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  /**
   * Sends input data to the backend to get calculation results.
   */
  async function handleGenerate() {
    if (!stockPrice || !strikePrice || !expiration || !impliedVolatility) {
        error = 'Please fill in all fields before generating.';
        return;
    }
    isLoading = true;
    // Clear previous results before fetching new ones
    calculationResults = null;
    infoMessage = '';
    error = '';
    
    try {
        const params = {
            stockPrice,
            strikePrice,
            expirationDate: expiration,
            volatility: impliedVolatility,
            optionType: optionType,
            priceIncrement: parseFloat(priceIncrement)
        };
        const response = await axios.post(`${API_URL}/api/calculate`, params);
        calculationResults = response.data;

        // This logic correctly processes the backend response to create the info message.
        const asOfTime = new Date(response.data.calculationTime);
        if (response.data.isMarketOpen) {
            infoMessage = `Prices calculated in real-time as of ${asOfTime.toLocaleString()}.`;
        } else {
            infoMessage = `The market is currently closed. Prices are based on the last market close: ${asOfTime.toLocaleString()}.`;
        }

        // Auto-scroll to the results section after the DOM has updated
        await tick(); // Wait for Svelte to render the results
        if (resultsSection) {
          const topOffset = resultsSection.getBoundingClientRect().top + window.scrollY - 80; // 80px offset for navbar
          window.scrollTo({ top: topOffset, behavior: 'smooth' });
        }

    } catch (err) {
        error = 'Failed to calculate option data.';
        console.error(err);
    } finally {
        isLoading = false;
    }
  }

  /**
   * A function to re-calculate only if results are already visible.
   */
  function reCalculate() {
    if (calculationResults) {
      handleGenerate();
    }
  }

  /**
   * A helper function to parse the premium range string (e.g., "1.05-1.15") into an average number.
   */
  function getAveragePremium(premiumRange) {
      const parts = premiumRange.split('-').map(Number);
      return (parts[0] + parts[1]) / 2;
  }
  
  /**
   * [NEW] Checks if the user's entry price is within the given premium range.
   */
  function isBreakeven(premiumRange, priceToAnalyze) {
      if (!isAnalyzing || !priceToAnalyze) return false;
      const [min, max] = premiumRange.split('-').map(Number);
      return priceToAnalyze >= min && priceToAnalyze <= max;
  }

  /**
   * Calculates the dynamic style for the heatmap based on price.
   * @param {number} currentPrice The stock price for the current table row.
   * @param {string} premium The premium range string for the current cell.
   * @param {boolean} analysisMode - The current state of isAnalyzing.
   * @param {number} priceToAnalyze - The current entryPrice.
   * @returns {string} A CSS style string for the background color.
   */
  function getHeatmapStyle(currentPrice, premium, analysisMode, priceToAnalyze) {
    // If we are in "Analyze Entry Price" mode and have a valid price
    if (analysisMode && priceToAnalyze > 0) {
        const avgPremium = getAveragePremium(premium);
        const difference = avgPremium - priceToAnalyze;
        const intensity = Math.min(Math.abs(difference) / entryPriceHeatmapMax, 1);
        const opacity = 0.1 + intensity * 0.4;

        if (difference > 0) return `background-color: rgba(34, 197, 94, ${opacity});`; // Profit (Green)
        if (difference < 0) return `background-color: rgba(239, 68, 68, ${opacity});`; // Loss (Red)

    } 
    // Otherwise, use the default "in-the-money" heatmap
    else {
        if (!heatmapMaxDifference) return '';
        const difference = currentPrice - strikePrice;
        const intensity = Math.min(Math.abs(difference) / heatmapMaxDifference, 1);
        const opacity = 0.1 + intensity * 0.4;

        if (optionType === 'call') {
            if (difference > 0) return `background-color: rgba(34, 197, 94, ${opacity});`;
            if (difference < 0) return `background-color: rgba(239, 68, 68, ${opacity});`;
        } else {
            if (difference < 0) return `background-color: rgba(34, 197, 94, ${opacity});`;
            if (difference > 0) return `background-color: rgba(239, 68, 68, ${opacity});`;
        }
    }
    return '';
  }

  /**
   * Formats a date object to include the time, rounded to the nearest hour.
   * @param {string | Date} dateString - The date to format.
   * @returns {string} The formatted time string.
   */
  function formatHeaderTime(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          hour12: true,
      }).format(date);
  }

  /**
   * Formats a date object to get the abbreviated day of the week.
   * @param {string | Date} dateString - The date to format.
   * @returns {string} The formatted day string (e.g., "Mon").
   */
  function formatHeaderDay(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  }


  // --- Reactive Statements ---

  // This reactive statement automatically formats the ticker input.
  $: ticker = ticker.replace(/[^a-zA-Z]/g, '').toUpperCase();

  // This single reactive block now handles all heatmap calculations
  // and is correctly triggered by changes to any of its dependencies.
  $: {
    if (calculationResults) {
        // Calculate max difference for the default heatmap
        const prices = calculationResults.tableData.rows.map(row => row.stockPrice);
        const maxDiff = Math.max(...prices.map(p => Math.abs(p - strikePrice)));
        heatmapMaxDifference = maxDiff > 0 ? maxDiff : 1;

        // Calculate max difference for the entry price heatmap if active
        if (isAnalyzing && entryPrice > 0) {
            let maxPremiumDiff = 0;
            calculationResults.tableData.rows.forEach(row => {
                row.premiums.forEach(p => {
                    const avg = getAveragePremium(p);
                    maxPremiumDiff = Math.max(maxPremiumDiff, Math.abs(avg - entryPrice));
                });
            });
            entryPriceHeatmapMax = maxPremiumDiff > 0 ? maxPremiumDiff : 1;
        } else {
            // This ensures that if the user clears the input, the heatmap resets.
            entryPriceHeatmapMax = 0;
        }
    }
  }

  // This reactive block automatically sets the price increment based on the stock price.
  $: if (stockPrice) {
      const price = parseFloat(stockPrice);
      if (price >= 1 && price <= 10) priceIncrement = '0.5';
      else if (price >= 11 && price <= 99) priceIncrement = '1.0';
      else if (price >= 100 && price <= 199) priceIncrement = '2.5';
      else if (price >= 200 && price <= 999) priceIncrement = '5.0';
      else if (price >= 1000) priceIncrement = '10.0';
  }

</script>

<div class="max-w-7xl mx-auto">
  <div class="text-center mb-8 sm:mb-10">
    <h1 class="text-4xl sm:text-5xl font-extrabold text-white">Option Price Terminal</h1>
    <p class="text-lg sm:text-xl text-gray-400 mt-4">Real-time analytics and price modeling.</p>
  </div>
  
  <div class="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700 space-y-8">
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
      <label class="flex flex-col space-y-2">
        <span class="font-semibold text-gray-400">Ticker</span>
        <input on:input={clearResults} bind:value={ticker} type="text" placeholder="e.g., AAPL" class="uppercase bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition">
      </label>
      <label class="flex flex-col space-y-2">
        <span class="font-semibold text-gray-400">Strike Price</span>
        <input on:input={clearResults} bind:value={strikePrice} type="number" class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition">
      </label>
      <label class="flex flex-col space-y-2">
        <span class="font-semibold text-gray-400">Expiration Date</span>
        <input on:input={clearResults} bind:value={expiration} type="date" class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition">
      </label>
      <button on:click={handleSearch} disabled={isLoading} class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-all text-base sm:text-lg h-auto md:h-[52px] disabled:bg-indigo-800 disabled:cursor-not-allowed">
        Search
      </button>
    </div>

    <hr class="border-gray-700">

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <label class="flex flex-col space-y-2">
            <span class="font-semibold text-gray-400">Current Stock Price</span>
            <input on:input={clearResults} bind:value={stockPrice} type="number" class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition">
        </label>
        <label class="flex flex-col space-y-2">
            <span class="font-semibold text-gray-400">Implied Volatility (%)</span>
            <input on:input={clearResults} bind:value={impliedVolatility} type="number" class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition">
        </label>
        <button on:click={handleGenerate} disabled={isLoading} class="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-all text-base sm:text-lg h-auto md:h-[52px] disabled:bg-green-800 disabled:cursor-not-allowed">
            {isLoading ? 'Calculating...' : 'Generate Option'}
        </button>
    </div>
  </div>

  {#if error}
    <div class="mt-8 bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">
        {error}
    </div>
  {/if}

  {#if calculationResults}
    <div class="mt-12 space-y-8" bind:this={resultsSection}>
      
      {#if infoMessage}
        <div class="bg-gray-800/60 border border-gray-700 text-gray-300 p-4 rounded-lg text-center text-base flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 flex-shrink-0 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <span class="font-medium">{infoMessage}</span>
        </div>
      {/if}

      <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <label class="flex items-center gap-3">
            <span class="font-semibold text-gray-400 text-base sm:text-lg">Option Type:</span>
            <select bind:value={optionType} on:change={reCalculate} class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition">
              <option value="call">Calls</option>
              <option value="put">Puts</option>
            </select>
          </label>
          <label class="flex items-center gap-3">
            <span class="font-semibold text-gray-400 text-base sm:text-lg">Price Increments:</span>
            <select bind:value={priceIncrement} on:change={reCalculate} class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition">
              <option value="0.5">0.50</option>
              <option value="1.0">1.00</option>
              <option value="2.5">2.50</option>
              <option value="5.0">5.00</option>
              <option value="10.0">10.00</option>
            </select>
          </label>
          <button on:click={() => isAnalyzing = !isAnalyzing} class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all text-base sm:text-lg">
            {isAnalyzing ? 'Hide Analyzer' : 'Analyze Entry Price'}
          </button>
      </div>

      {#if isAnalyzing}
        <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <label class="flex flex-col sm:flex-row items-center gap-4">
                <span class="font-semibold text-gray-400 text-base sm:text-lg">Your Entry Price:</span>
                <input bind:value={entryPrice} type="number" placeholder="e.g., 12.50" class="flex-grow bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition">
            </label>
        </div>
      {/if}

      <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
          {#if optionType === 'call'}
            <h3 class="text-lg sm:text-xl font-semibold text-gray-400">Current Call Price</h3>
            <p class="text-2xl sm:text-3xl font-sans text-white mt-2">{calculationResults.callPriceRange}</p>
          {:else}
            <h3 class="text-lg sm:text-xl font-semibold text-gray-400">Current Put Price</h3>
            <p class="text-2xl sm:text-3xl font-sans text-white mt-2">{calculationResults.putPriceRange}</p>
          {/if}
      </div>

      <div class="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
        <div class="p-4 bg-gray-700/50 border-b border-gray-700 grid grid-cols-3 items-center">
            <h3 class="text-lg sm:text-xl font-bold text-white uppercase text-left">{ticker}</h3>
            <img src="/deltuh logo.svg" alt="Deltuh Logo" class="h-10 w-auto justify-self-center">
            <p class="text-base sm:text-lg font-medium text-gray-300 text-right">Expiration: {expiration}</p>
        </div>
        <div class="overflow-x-auto custom-scrollbar">
            <table class="min-w-full text-sm sm:text-base text-left">
                <thead class="bg-gray-700/50">
                    <tr>
                        <th class="sticky left-0 bg-gray-800 p-2 sm:p-4 font-semibold tracking-wider text-white whitespace-nowrap z-10">Stock Price</th>
                        {#each calculationResults.tableData.timeHeaders as timeHeader}
                            <th class="p-2 sm:p-4 font-semibold tracking-wider text-white text-center whitespace-nowrap">
                                <div class="flex flex-col">
                                    <span class="text-xs text-indigo-400 font-bold">{formatHeaderDay(timeHeader)}</span>
                                    <span class="text-xs sm:text-sm">{new Date(timeHeader).toLocaleDateString()}</span>
                                    <span class="text-xs text-gray-400 font-normal">{formatHeaderTime(timeHeader)}</span>
                                </div>
                            </th>
                        {/each}
                    </tr>
                </thead>
                <tbody>
                    {#each calculationResults.tableData.rows as row}
                        {@const isStrike = Math.abs(row.stockPrice - strikePrice) < 0.01}
                        {@const isCurrent = Math.abs(row.stockPrice - stockPrice) < 0.01}
                        <tr 
                          class="border-b border-gray-700"
                          title={isStrike ? 'Strike Price' : (isCurrent ? 'Current Stock Price' : '')}
                        >
                            <td 
                              class="sticky left-0 bg-gray-800 p-2 sm:p-4 font-sans font-bold whitespace-nowrap z-10 {isStrike ? 'text-green-400' : ''} {isCurrent ? 'text-blue-400' : ''} {(!isStrike && !isCurrent) ? 'text-gray-300' : ''}"
                            >
                                <div class="flex items-center gap-2 sm:gap-3">
                                    <span class="text-sm sm:text-base">${row.stockPrice.toFixed(2)}</span>
                                    {#if isStrike}
                                      <span class="text-xs font-semibold px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full">Strike</span>
                                    {/if}
                                    {#if isCurrent}
                                      <span class="text-xs font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">Current</span>
                                    {/if}
                                </div>
                            </td>
                            {#each row.premiums as premium}
                                {@const isBreakevenCell = isBreakeven(premium, entryPrice)}
                                <td 
                                  class="p-2 sm:p-4 font-sans text-gray-400 text-center whitespace-nowrap transition-colors duration-300 relative"
                                  class:breakeven-cell={isBreakevenCell}
                                  style={getHeatmapStyle(row.stockPrice, premium, isAnalyzing, entryPrice)}
                                >
                                  {#if isBreakevenCell}
                                    <span class="breakeven-label">Breakeven</span>
                                  {/if}
                                  <span class:breakeven-text={isBreakevenCell}>{premium}</span>
                                </td>
                            {/each}
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom styles for the table's horizontal scrollbar */
  .custom-scrollbar::-webkit-scrollbar {
    height: 12px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background-color: #1f2937; /* bg-gray-800 */
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #4f46e5; /* bg-indigo-600 */
    border-radius: 10px;
    border: 3px solid #1f2937; /* Creates padding around thumb */
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #4338ca; /* bg-indigo-700 */
  }

  /* [NEW] Styles for the breakeven indicator */
  .breakeven-cell {
    position: relative;
  }
  .breakeven-label {
    position: absolute;
    top: 2px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.65rem;
    font-weight: bold;
    color: #facc15; /* yellow-400 */
    text-transform: uppercase;
  }
  .breakeven-text {
    font-weight: bold;
    color: #fde047; /* yellow-300 */
    text-shadow: 0 0 8px rgba(250, 204, 21, 0.5); /* Glowing effect */
  }
</style>
