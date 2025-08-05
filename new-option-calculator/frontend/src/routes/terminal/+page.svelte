<script>
  import axios from 'axios';
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { authToken } from '../../stores/authStore.js';

  // This function formats a date object to 'YYYY-MM-DD' for the input field.
  function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Protect the route
  onMount(() => {
    // Note: In a real app, you might use a store that checks the token's validity.
    // For this example, we'll assume if a token exists, the user is authenticated.
    // if (!$authToken) {
    //   goto('/login');
    // }
  });

  // --- State Variables ---

  // Input state now defaults to empty values for a clean slate.
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

  // A reference to the results container for auto-scrolling
  let resultsSection;
  
  // State for the heatmap calculation
  let heatmapMaxDifference = 0;

  // State for the Entry Price Analysis feature
  let isAnalyzing = false;
  let entryPrice = '';
  let entryPriceHeatmapMax = 0;

  // State to hold the coordinates of the single "current premium" cell
  let currentPremiumCoords = null;

  // The URL of our backend server
  // Make sure to set VITE_BACKEND_URL in your .env file for production
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

  // --- Functions ---

  /**
   * Clears any existing results and messages.
   */
  function clearResults() {
      calculationResults = null;
      infoMessage = '';
      error = '';
      isAnalyzing = false;
      entryPrice = '';
      currentPremiumCoords = null; // Reset the coordinates
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
            strikePrice,
            expirationDate: expiration,
            volatility: finalImpliedVolatility,
            optionType,
            priceIncrement: parseFloat(priceIncrement)
        };
        const calculationResponse = await axios.post(`${API_URL}/api/calculate`, params);
        calculationResults = calculationResponse.data;

        // Find the coordinates of the cell for the current stock price and current time.
        const currentPriceRowIndex = calculationResults.tableData.rows.findIndex(row => Math.abs(row.stockPrice - stockPrice) < 0.01);
        if (currentPriceRowIndex !== -1) {
            // The current premium is always in the first time column (j=0) of the current price row.
            currentPremiumCoords = { row: currentPriceRowIndex, col: 0 };
        }

        // Set the informational message based on market status.
        const asOfTime = new Date(calculationResponse.data.calculationTime);
        if (calculationResponse.data.isMarketOpen) {
            infoMessage = `Prices calculated in real-time as of ${asOfTime.toLocaleString()}.`;
        } else {
            infoMessage = `The market is currently closed. Prices are based on the last market close: ${asOfTime.toLocaleString()}.`;
        }

        // Wait for the DOM to update, then smoothly scroll to the results.
        await tick();
        if (resultsSection) {
          const topOffset = resultsSection.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: topOffset, behavior: 'smooth' });
        }

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
    if (calculationResults) {
      handleCalculate();
    }
  }

  /**
   * A helper function to parse the premium range string (e.g., "1.23-1.45") into an average number.
   */
  function getAveragePremium(premiumRange) {
      const parts = premiumRange.split('-').map(Number);
      return (parts[0] + parts[1]) / 2;
  }
  
  /**
   * Checks if the user's entry price is within the given premium range.
   */
  function isBreakeven(premiumRange, priceToAnalyze) {
      if (!isAnalyzing || !priceToAnalyze) return false;
      const [min, max] = premiumRange.split('-').map(Number);
      return priceToAnalyze >= min && priceToAnalyze <= max;
  }

  /**
   * Calculates the percentage change from the entry price to the projected average premium.
   */
  function getPercentageChange(premiumRange, priceToAnalyze) {
      if (!isAnalyzing || !priceToAnalyze) return { text: '', isProfit: false };
      const avgPremium = getAveragePremium(premiumRange);
      const change = ((avgPremium - priceToAnalyze) / priceToAnalyze) * 100;
      const isProfit = change >= 0;
      const sign = isProfit ? '+' : '';
      return {
          text: `${sign}${change.toFixed(1)}%`,
          isProfit,
      };
  }

  /**
   * Determines if a stock price is "In the Money" for the current option type.
   */
  function isITM(currentStockPrice, currentStrikePrice, currentOptionType) {
      if (currentOptionType === 'call') {
          return currentStockPrice > currentStrikePrice;
      } else { // 'put'
          return currentStockPrice < currentStrikePrice;
      }
  }

  /**
   * Calculates the dynamic style for the heatmap based on the active mode (ITM/OTM or Entry Price Analysis).
   */
  function getHeatmapStyle(currentPrice, premium, analysisMode, priceToAnalyze) {
    // Entry Price Analysis Mode
    if (analysisMode && priceToAnalyze > 0) {
        const avgPremium = getAveragePremium(premium);
        const difference = avgPremium - priceToAnalyze;
        const intensity = Math.min(Math.abs(difference) / entryPriceHeatmapMax, 1);
        const opacity = 0.1 + intensity * 0.4; // Opacity from 10% to 50%

        if (difference > 0) return `background-color: rgba(34, 197, 94, ${opacity});`; // Green for profit
        if (difference < 0) return `background-color: rgba(239, 68, 68, ${opacity});`; // Red for loss

    // Default ITM/OTM Heatmap Mode
    } else {
        if (!heatmapMaxDifference) return '';
        const difference = currentPrice - strikePrice;
        const intensity = Math.min(Math.abs(difference) / heatmapMaxDifference, 1);
        const opacity = 0.1 + intensity * 0.4;

        if (optionType === 'call') {
            if (difference > 0) return `background-color: rgba(34, 197, 94, ${opacity});`; // Green for ITM
            if (difference < 0) return `background-color: rgba(239, 68, 68, ${opacity});`; // Red for OTM
        } else { // 'put'
            if (difference < 0) return `background-color: rgba(34, 197, 94, ${opacity});`; // Green for ITM
            if (difference > 0) return `background-color: rgba(239, 68, 68, ${opacity});`; // Red for OTM
        }
    }
    return '';
  }

  /**
   * Formats a date object to include the time (e.g., "3:00 PM").
   */
  function formatHeaderTime(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          hour12: true,
      }).format(date);
  }

  /**
   * Formats a date object to get the abbreviated day of the week (e.g., "Mon").
   */
  function formatHeaderDay(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  }


  // --- Reactive Statements ---

  // Ensure the ticker is always uppercase and contains only letters.
  $: ticker = ticker.replace(/[^a-zA-Z]/g, '').toUpperCase();

  // This block recalculates heatmap maximums whenever the results or analysis mode change.
  $: {
    if (calculationResults) {
        // For the default ITM/OTM heatmap
        const prices = calculationResults.tableData.rows.map(row => row.stockPrice);
        const maxDiff = Math.max(...prices.map(p => Math.abs(p - strikePrice)));
        heatmapMaxDifference = maxDiff > 0 ? maxDiff : 1;

        // For the entry price analysis heatmap
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
            entryPriceHeatmapMax = 0;
        }
    }
  }

  // This block automatically selects a reasonable price increment based on the stock price.
  $: if (stockPrice && !calculationResults) {
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
    
    <!-- Main Inputs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <label class="flex flex-col space-y-2">
        <span class="font-semibold text-gray-400">Ticker</span>
        <input bind:value={ticker} type="text" placeholder="e.g., AAPL" class="uppercase bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition">
      </label>
      <label class="flex flex-col space-y-2">
        <span class="font-semibold text-gray-400">Strike Price</span>
        <input bind:value={strikePrice} type="number" class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="e.g., 540">
      </label>
      <label class="flex flex-col space-y-2">
        <span class="font-semibold text-gray-400">Expiration Date</span>
        <input bind:value={expiration} type="date" class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition">
      </label>
    </div>

    <!-- Advanced / Auto-populated Inputs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <label class="flex flex-col space-y-2">
            <span class="font-semibold text-gray-400">Current Stock Price (Optional)</span>
            <input bind:value={stockPrice} type="number" class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="Auto-fetched">
        </label>
        <label class="flex flex-col space-y-2">
            <span class="font-semibold text-gray-400">Implied Volatility (Optional)</span>
            <input bind:value={impliedVolatility} type="number" class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="Auto-fetched">
        </label>
    </div>

    <hr class="border-gray-700">

    <!-- Calculation Controls -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
        <label class="flex flex-col space-y-2">
            <span class="font-semibold text-gray-400">Option Type</span>
            <select bind:value={optionType} on:change={reCalculate} class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition h-[52px]">
              <option value="call">Calls</option>
              <option value="put">Puts</option>
            </select>
        </label>
        <label class="flex flex-col space-y-2">
            <span class="font-semibold text-gray-400">Price Increments</span>
            <select bind:value={priceIncrement} on:change={reCalculate} class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition h-[52px]">
              <option value="0.5">0.50</option>
              <option value="1.0">1.00</option>
              <option value="2.5">2.50</option>
              <option value="5.0">5.00</option>
              <option value="10.0">10.00</option>
            </select>
        </label>
        <button on:click={handleCalculate} disabled={isLoading} class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-all text-base sm:text-lg h-[52px] disabled:bg-indigo-800 disabled:cursor-not-allowed">
            {isLoading ? 'Calculating...' : 'Calculate'}
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

      <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 flex items-center justify-center">
          <button on:click={() => isAnalyzing = !isAnalyzing} class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-all text-base sm:text-lg">
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
                        <th class="sticky left-0 bg-gray-800 p-2 sm:p-4 font-semibold tracking-wider text-white whitespace-nowrap z-20">Stock Price</th>
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
                    {#each calculationResults.tableData.rows as row, i}
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
                            {#each row.premiums as premium, j}
                                {@const isBreakevenCell = isBreakeven(premium, entryPrice)}
                                {@const percentageChange = getPercentageChange(premium, entryPrice)}
                                {@const isCurrentPremiumCell = currentPremiumCoords && currentPremiumCoords.row === i && currentPremiumCoords.col === j}
                                <td 
                                  class="p-2 sm:p-4 font-sans text-gray-400 text-center whitespace-nowrap transition-colors duration-300"
                                  style={getHeatmapStyle(row.stockPrice, premium, isAnalyzing, entryPrice)}
                                >
                                  {#if isAnalyzing && entryPrice > 0}
                                    <div class="flex flex-col justify-center items-center">
                                      {#if isBreakevenCell}
                                        <span class="breakeven-label">Breakeven</span>
                                      {:else}
                                        <span class="percentage-label" class:profit={percentageChange.isProfit} class:loss={!percentageChange.isProfit}>
                                          {percentageChange.text}
                                        </span>
                                      {/if}
                                      <span class:breakeven-text={isBreakevenCell}>{premium}</span>
                                    </div>
                                  {:else if isCurrentPremiumCell}
                                    <div class="flex flex-col justify-center items-center">
                                        <span class="current-label">Current</span>
                                        <span class="current-text">{premium}</span>
                                    </div>
                                  {:else}
                                    <span>{premium}</span>
                                  {/if}
                                </td>
                            {/each}
                        </tr>
                        
                        <!-- This block checks if the line between the current row and the next row is the border between ITM and OTM. -->
                        {#if i < calculationResults.tableData.rows.length - 1}
                            {@const regionAboveIsITM = isITM(row.stockPrice, strikePrice, optionType)}
                            {@const regionBelowIsITM = isITM(calculationResults.tableData.rows[i + 1].stockPrice, strikePrice, optionType)}
                            
                            {#if regionAboveIsITM !== regionBelowIsITM}
                                <tr class="itm-otm-separator-row">
                                    <td colspan={calculationResults.tableData.timeHeaders.length + 1}>
                                        <div class="separator-content">
                                            <!-- Left side of separator (describes region ABOVE - lower stock prices) -->
                                            <div class="flex items-center gap-2">
                                                <svg class="h-4 w-4" class:itm-arrow={optionType === 'put'} class:otm-arrow={optionType === 'call'} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                                                {#if optionType === 'call'}
                                                    <span class="separator-text otm-text">Out of the Money</span>
                                                {:else}
                                                    <span class="separator-text itm-text">In the Money</span>
                                                {/if}
                                            </div>

                                            <span class="separator-line" class:call={optionType === 'call'} class:put={optionType === 'put'}></span>

                                            <!-- Right side of separator (describes region BELOW - higher stock prices) -->
                                            <div class="flex items-center gap-2">
                                                {#if optionType === 'call'}
                                                    <span class="separator-text itm-text">In the Money</span>
                                                {:else}
                                                    <span class="separator-text otm-text">Out of the Money</span>
                                                {/if}
                                                <svg class="h-4 w-4" class:itm-arrow={optionType === 'call'} class:otm-arrow={optionType === 'put'} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            {/if}
                        {/if}
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

  /* Styles for the breakeven indicator */
  .breakeven-label {
    font-size: 0.6rem;
    font-weight: bold;
    color: #facc15; /* yellow-400 */
    text-transform: uppercase;
    line-height: 1;
  }
  .breakeven-text {
    font-weight: bold;
    color: #fde047; /* yellow-300 */
    text-shadow: 0 0 8px rgba(250, 204, 21, 0.5);
    line-height: 1.2;
  }

  /* Styles for the percentage change indicator */
  .percentage-label {
    font-size: 0.6rem;
    font-weight: bold;
    text-transform: uppercase;
    line-height: 1;
  }
  .percentage-label.profit {
    color: #4ade80; /* green-400 */
    text-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
  }
  .percentage-label.loss {
    color: #f87171; /* red-400 */
    text-shadow: 0 0 8px rgba(248, 113, 113, 0.5);
  }
  
  /* Styles for the current price indicator */
  .current-label {
      font-size: 0.6rem;
      font-weight: bold;
      color: #93c5fd; /* blue-300 */
      text-transform: uppercase;
      line-height: 1;
  }
  .current-text {
      font-weight: bold;
      color: #60a5fa; /* blue-400 */
      text-shadow: 0 0 8px rgba(96, 165, 250, 0.5);
      line-height: 1.2;
  }

  /* Responsive adjustments for the labels */
  @media (min-width: 640px) {
    .breakeven-label, .percentage-label, .current-label {
      font-size: 0.65rem;
    }
  }

  /* Styles for the ITM/OTM separator */
  .itm-otm-separator-row td {
      padding: 0 !important;
  }
  .separator-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 4px 1rem;
  }
  .separator-line {
      flex-grow: 1;
      height: 2px;
      margin: 0 1rem;
      border-radius: 99px;
  }
  /* [NEW] Dynamic gradient for the separator line */
  .separator-line.call {
    background: linear-gradient(to right, #ef4444, #22c55e); /* red to green */
  }
  .separator-line.put {
    background: linear-gradient(to right, #22c55e, #ef4444); /* green to red */
  }

  .separator-text {
      font-size: 0.7rem;
      font-weight: bold;
      text-transform: uppercase;
  }
  
  /* [NEW] Color coding for text and arrows */
  .itm-text {
    color: #4ade80; /* green-400 */
  }
  .otm-text {
    color: #f87171; /* red-400 */
  }
  .itm-arrow {
    color: #4ade80; /* green-400 */
  }
  .otm-arrow {
    color: #f87171; /* red-400 */
  }
</style>
