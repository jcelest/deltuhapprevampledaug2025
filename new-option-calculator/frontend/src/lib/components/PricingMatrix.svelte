<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let calculationResults = null;
  export let inputData = {};
  export let config = {};

  // State for Entry Price Analysis
  let isAnalyzing = false;
  let entryPrice = '';
  let entryPriceHeatmapMax = 0;
  let heatmapMaxDifference = 0;
  let currentPremiumCoords = null;
  let infoMessage = '';

  // --- Functions ---

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
      const difference = currentPrice - inputData.strikePrice;
      const intensity = Math.min(Math.abs(difference) / heatmapMaxDifference, 1);
      const opacity = 0.1 + intensity * 0.4;

      if (inputData.optionType === 'call') {
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

  // Calculate heatmap maximums whenever the results or analysis mode change
  $: if (calculationResults && inputData.strikePrice) {
    // For the default ITM/OTM heatmap
    const prices = calculationResults.tableData.rows.map(row => row.stockPrice);
    const maxDiff = Math.max(...prices.map(p => Math.abs(p - inputData.strikePrice)));
    heatmapMaxDifference = maxDiff > 0 ? maxDiff : 1;

    // Find current premium coordinates
    const currentPriceRowIndex = calculationResults.tableData.rows.findIndex(row => 
      Math.abs(row.stockPrice - inputData.stockPrice) < 0.01
    );
    if (currentPriceRowIndex !== -1) {
      currentPremiumCoords = { row: currentPriceRowIndex, col: 0 };
    }

    // Set info message
    const asOfTime = new Date(calculationResults.calculationTime);
    if (calculationResults.isMarketOpen) {
      infoMessage = `Prices calculated in real-time as of ${asOfTime.toLocaleString()}.`;
    } else {
      infoMessage = `The market is currently closed. Prices are based on the last market close: ${asOfTime.toLocaleString()}.`;
    }

    // For entry price analysis heatmap
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
</script>

<!-- Adaptive container that matches other empty components when no data -->
<div class="bg-transparent h-full flex flex-col">
  {#if calculationResults}
    <!-- Full expanded content when data is available -->
    <div class="space-y-6 h-full overflow-auto">
      {#if infoMessage}
        <div class="bg-gray-800/60 border border-gray-700 text-gray-300 p-3 rounded-lg text-center text-sm flex items-center justify-center gap-2 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <span class="font-medium">{infoMessage}</span>
        </div>
      {/if}

      <div class="bg-gray-800/80 p-4 rounded-lg border border-gray-600/50 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
        <button 
          on:click={() => isAnalyzing = !isAnalyzing} 
          class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-all text-sm"
        >
          {isAnalyzing ? 'Hide Analyzer' : 'Analyze Entry Price'}
        </button>
      </div>

      {#if isAnalyzing}
        <div class="bg-gray-800/80 p-4 rounded-lg border border-gray-600/50 backdrop-blur-sm flex-shrink-0">
          <label class="flex flex-col sm:flex-row items-center gap-3">
            <span class="font-semibold text-gray-400 text-sm">Your Entry Price:</span>
            <input 
              bind:value={entryPrice} 
              type="number" 
              placeholder="e.g., 12.50" 
              class="flex-grow bg-gray-900 border border-gray-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </label>
        </div>
      {/if}

      <div class="bg-gray-800/80 p-4 rounded-lg border border-gray-600/50 backdrop-blur-sm text-center flex-shrink-0">
        {#if inputData.optionType === 'call'}
          <h3 class="text-base font-semibold text-gray-400">Current Call Price</h3>
          <p class="text-xl font-sans text-white mt-1">{calculationResults.callPriceRange}</p>
        {:else}
          <h3 class="text-base font-semibold text-gray-400">Current Put Price</h3>
          <p class="text-xl font-sans text-white mt-1">{calculationResults.putPriceRange}</p>
        {/if}
      </div>

      <div class="bg-gray-800/80 rounded-xl shadow-lg border border-gray-600/50 backdrop-blur-sm overflow-hidden flex-1 min-h-0">
        <div class="p-3 bg-gray-700/50 border-b border-gray-600/50 grid grid-cols-3 items-center">
          <h3 class="text-base font-bold text-white uppercase text-left">{inputData.ticker}</h3>
          <img src="/deltuh logo.svg" alt="Deltuh Logo" class="h-8 w-auto justify-self-center">
          <p class="text-sm font-medium text-gray-300 text-right">Expiration: {inputData.expiration}</p>
        </div>
        <div class="overflow-x-auto custom-scrollbar h-full">
          <table class="min-w-full text-sm sm:text-base text-left h-full">
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
                {@const isStrike = Math.abs(row.stockPrice - inputData.strikePrice) < 0.01}
                {@const isCurrent = Math.abs(row.stockPrice - inputData.stockPrice) < 0.01}
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
                
                <!-- ITM/OTM separator -->
                {#if i < calculationResults.tableData.rows.length - 1}
                  {@const regionAboveIsITM = isITM(row.stockPrice, inputData.strikePrice, inputData.optionType)}
                  {@const regionBelowIsITM = isITM(calculationResults.tableData.rows[i + 1].stockPrice, inputData.strikePrice, inputData.optionType)}
                  
                  {#if regionAboveIsITM !== regionBelowIsITM}
                    <tr class="itm-otm-separator-row">
                      <td colspan={calculationResults.tableData.timeHeaders.length + 1}>
                        <div class="separator-content">
                          <!-- Left side of separator -->
                          <div class="flex items-center gap-2">
                            <svg class="h-4 w-4" class:itm-arrow={inputData.optionType === 'put'} class:otm-arrow={inputData.optionType === 'call'} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                            {#if inputData.optionType === 'call'}
                              <span class="separator-text otm-text">Out of the Money</span>
                            {:else}
                              <span class="separator-text itm-text">In the Money</span>
                            {/if}
                          </div>

                          <span class="separator-line" class:call={inputData.optionType === 'call'} class:put={inputData.optionType === 'put'}></span>

                          <!-- Right side of separator -->
                          <div class="flex items-center gap-2">
                            {#if inputData.optionType === 'call'}
                              <span class="separator-text itm-text">In the Money</span>
                            {:else}
                              <span class="separator-text otm-text">Out of the Money</span>
                            {/if}
                            <svg class="h-4 w-4" class:itm-arrow={inputData.optionType === 'call'} class:otm-arrow={inputData.optionType === 'put'} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
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
  {:else}
    <!-- Compact empty state that matches Greeks Dashboard and Market Data exactly -->
    <div class="h-full flex items-center justify-center text-gray-400">
      <div class="text-center">
        <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>Calculate options to see pricing matrix</p>
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
  /* Dynamic gradient for the separator line */
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
  
  /* Color coding for text and arrows */
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