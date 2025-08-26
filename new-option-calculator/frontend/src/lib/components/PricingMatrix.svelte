<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let calculationResults = null;
  export let inputData = {};
  export const config = {};

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
      infoMessage = `Real-time • ${asOfTime.toLocaleTimeString()}`;
    } else {
      infoMessage = `Closed • Last: ${asOfTime.toLocaleTimeString()}`;
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

<div class="deltuh-pricing-matrix">
  {#if calculationResults}
    <!-- Main content when data is available -->
    <div class="matrix-content">
      <!-- Header with Market Status -->
      <div class="matrix-header">
        <div class="header-left">
          <div class="title-row">
            <img src="/deltuh logo.svg" alt="Deltuh" class="deltuh-logo" />
            <h3 class="matrix-title">Options Pricing Matrix</h3>
          </div>
          {#if infoMessage}
            <div class="market-status" class:open={calculationResults.isMarketOpen}>
              <span class="status-dot"></span>
              <span class="status-text">{infoMessage}</span>
            </div>
          {/if}
        </div>
        
        <!-- Controls -->
        <div class="matrix-controls">
          <button 
            on:click={() => isAnalyzing = !isAnalyzing} 
            class="analyzer-toggle"
            class:active={isAnalyzing}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {isAnalyzing ? 'Hide Analyzer' : 'Analyze Entry'}
          </button>
        </div>
      </div>

      <!-- Entry Price Analysis Input -->
      {#if isAnalyzing}
        <div class="analysis-section">
          <div class="input-group">
            <label class="input-label" for="entry-price-input">Entry Price</label>
            <input 
              id="entry-price-input"
              bind:value={entryPrice} 
              type="number" 
              placeholder="0.00"
              class="input-field"
            />
          </div>
        </div>
      {/if}

      <!-- Current Price Display -->
      <div class="current-price-card">
        <div class="price-display">
          <span class="price-label">Current {inputData.optionType === 'call' ? 'Call' : 'Put'}</span>
          <span class="price-value">
            {inputData.optionType === 'call' ? calculationResults.callPriceRange : calculationResults.putPriceRange}
          </span>
        </div>
        <div class="price-meta">
          <div class="meta-item">
            <span class="meta-label">{inputData.ticker}</span>
            <span class="meta-value">${inputData.stockPrice?.toFixed(2)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Exp</span>
            <span class="meta-value">{inputData.expiration}</span>
          </div>
        </div>
      </div>

      <!-- Pricing Matrix Table -->
      <div class="matrix-table-container">
        <div class="table-wrapper">
          <table class="pricing-table">
            <thead>
              <tr>
                <th class="stock-price-header">Stock Price</th>
                {#each calculationResults.tableData.timeHeaders as timeHeader}
                  <th class="time-header">
                    <div class="time-header-content">
                      <span class="day-label">{formatHeaderDay(timeHeader)}</span>
                      <span class="date-label">{new Date(timeHeader).toLocaleDateString()}</span>
                      <span class="time-label">{formatHeaderTime(timeHeader)}</span>
                    </div>
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each calculationResults.tableData.rows as row, i}
                {@const isStrike = Math.abs(row.stockPrice - inputData.strikePrice) < 0.01}
                {@const isCurrent = Math.abs(row.stockPrice - inputData.stockPrice) < 0.01}
                <tr class="price-row">
                  <td class="stock-price-cell" class:strike={isStrike} class:current={isCurrent}>
                    <div class="stock-price-content">
                      <span class="price-value">${row.stockPrice.toFixed(2)}</span>
                      {#if isStrike}
                        <span class="price-badge strike-badge">Strike</span>
                      {/if}
                      {#if isCurrent}
                        <span class="price-badge current-badge">Current</span>
                      {/if}
                    </div>
                  </td>
                  {#each row.premiums as premium, j}
                    {@const isBreakevenCell = isBreakeven(premium, entryPrice)}
                    {@const percentageChange = getPercentageChange(premium, entryPrice)}
                    {@const isCurrentPremiumCell = currentPremiumCoords && currentPremiumCoords.row === i && currentPremiumCoords.col === j}
                    <td 
                      class="premium-cell"
                      style={getHeatmapStyle(row.stockPrice, premium, isAnalyzing, entryPrice)}
                    >
                      <div class="premium-content">
                        {#if isAnalyzing && entryPrice > 0}
                          {#if isBreakevenCell}
                            <span class="analysis-label breakeven">Breakeven</span>
                          {:else}
                            <span class="analysis-label" class:profit={percentageChange.isProfit} class:loss={!percentageChange.isProfit}>
                              {percentageChange.text}
                            </span>
                          {/if}
                          <span class="premium-value" class:breakeven={isBreakevenCell}>{premium}</span>
                        {:else if isCurrentPremiumCell}
                          <span class="analysis-label current">Current</span>
                          <span class="premium-value current">{premium}</span>
                        {:else}
                          <span class="premium-value">{premium}</span>
                        {/if}
                      </div>
                    </td>
                  {/each}
                </tr>
                
                <!-- ITM/OTM separator -->
                {#if i < calculationResults.tableData.rows.length - 1}
                  {@const regionAboveIsITM = isITM(row.stockPrice, inputData.strikePrice, inputData.optionType)}
                  {@const regionBelowIsITM = isITM(calculationResults.tableData.rows[i + 1].stockPrice, inputData.strikePrice, inputData.optionType)}
                  
                  {#if regionAboveIsITM !== regionBelowIsITM}
                    <tr class="separator-row">
                      <td colspan={calculationResults.tableData.timeHeaders.length + 1} class="separator-cell">
                        <div class="separator-content">
                          <!-- Left side: Region above separator -->
                          <div class="separator-section">
                            {#if regionAboveIsITM}
                              <svg class="separator-arrow itm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                              </svg>
                              <span class="separator-text itm">In the Money</span>
                            {:else}
                              <svg class="separator-arrow otm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                              </svg>
                              <span class="separator-text otm">Out of the Money</span>
                            {/if}
                          </div>

                          <div class="separator-line" class:call={inputData.optionType === 'call'} class:put={inputData.optionType === 'put'}></div>

                          <!-- Right side: Region below separator -->
                          <div class="separator-section">
                            {#if regionBelowIsITM}
                              <span class="separator-text itm">In the Money</span>
                              <svg class="separator-arrow itm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            {:else}
                              <span class="separator-text otm">Out of the Money</span>
                              <svg class="separator-arrow otm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            {/if}
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
    <!-- Empty state matching the calculation engine style -->
    <div class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p class="empty-text">Calculate options to see pricing matrix</p>
    </div>
  {/if}
</div>

<style>
  .deltuh-pricing-matrix {
    background: linear-gradient(135deg, rgba(31, 41, 55, 0.6) 0%, rgba(17, 24, 39, 0.8) 100%);
    border-radius: 16px;
    border: 1px solid rgba(167, 139, 250, 0.15);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    backdrop-filter: blur(10px);
  }

  /* Header Section */
  .matrix-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.25rem 1.25rem 0.75rem;
    border-bottom: 1px solid rgba(167, 139, 250, 0.1);
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 200px;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .deltuh-logo {
    height: 24px;
    width: auto;
    filter: brightness(1.1);
    opacity: 0.9;
  }

  .matrix-title {
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(135deg, #fff, #c4b5fd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }

  .market-status {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 20px;
    border: 1px solid rgba(239, 68, 68, 0.2);
    font-size: 0.75rem;
    width: fit-content;
  }

  .market-status.open {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.2);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ef4444;
    animation: pulse 2s infinite;
  }

  .market-status.open .status-dot {
    background: #22c55e;
  }

  .status-text {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .matrix-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .analyzer-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: rgba(167, 139, 250, 0.05);
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 8px;
    color: #c4b5fd;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .analyzer-toggle:hover {
    background: rgba(167, 139, 250, 0.1);
  }

  .analyzer-toggle.active {
    background: linear-gradient(135deg, #a78bfa, #c4b5fd);
    color: white;
    border-color: transparent;
  }

  .analyzer-toggle svg {
    width: 18px;
    height: 18px;
  }

  /* Main Content */
  .matrix-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    height: 100%;
    overflow: hidden;
  }

  /* Analysis Section */
  .analysis-section {
    padding: 0 1.25rem;
  }

  .input-group {
    position: relative;
    max-width: 200px;
  }

  .input-field {
    width: 100%;
    padding: 0.75rem 0.5rem 0.25rem;
    background: rgba(17, 24, 39, 0.6);
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 8px;
    color: white;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s;
    outline: none;
  }

  .input-field:focus {
    border-color: #a78bfa;
    background: rgba(17, 24, 39, 0.8);
    box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
  }

  .input-field::placeholder {
    color: #64748b;
  }

  .input-label {
    position: absolute;
    top: 2px;
    left: 0.5rem;
    font-size: 0.625rem;
    color: #a78bfa;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Current Price Card */
  .current-price-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    margin: 0 1.25rem;
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.08), rgba(196, 181, 253, 0.04));
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 12px;
    gap: 1rem;
  }

  .price-display {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .price-label {
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .price-value {
    font-size: 1.875rem;
    font-weight: 700;
    color: white;
    line-height: 1;
  }

  .price-meta {
    display: flex;
    gap: 1.5rem;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .meta-label {
    font-size: 0.625rem;
    color: #a78bfa;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .meta-value {
    font-size: 0.875rem;
    color: white;
    font-weight: 600;
  }

  /* Table Container */
  .matrix-table-container {
    flex: 1;
    overflow: hidden;
    margin: 0 1.25rem 1.25rem;
    border-radius: 12px;
    background: rgba(17, 24, 39, 0.4);
    border: 1px solid rgba(167, 139, 250, 0.1);
  }

  .table-wrapper {
    height: 100%;
    overflow: auto;
  }

  /* Custom scrollbar */
  .table-wrapper::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .table-wrapper::-webkit-scrollbar-track {
    background: rgba(17, 24, 39, 0.5);
  }

  .table-wrapper::-webkit-scrollbar-thumb {
    background: rgba(167, 139, 250, 0.3);
    border-radius: 4px;
  }

  .table-wrapper::-webkit-scrollbar-thumb:hover {
    background: rgba(167, 139, 250, 0.5);
  }

  /* Table Styles */
  .pricing-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .pricing-table thead {
    background: rgba(31, 41, 55, 0.8);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .stock-price-header,
  .time-header {
    padding: 1rem;
    font-weight: 600;
    color: white;
    border-bottom: 1px solid rgba(167, 139, 250, 0.2);
    text-align: center;
  }

  .stock-price-header {
    position: sticky;
    left: 0;
    background: #1f2937 !important;
    z-index: 25;
    text-align: left;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
    border-right: 2px solid rgba(167, 139, 250, 0.2);
  }

  .stock-price-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #1f2937;
    z-index: -1;
  }

  .time-header-content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .day-label {
    font-size: 0.625rem;
    color: #a78bfa;
    font-weight: 700;
    text-transform: uppercase;
  }

  .date-label {
    font-size: 0.75rem;
    color: white;
  }

  .time-label {
    font-size: 0.625rem;
    color: #94a3b8;
  }

  /* Table Body */
  .price-row {
    border-bottom: 1px solid rgba(167, 139, 250, 0.05);
  }

  .stock-price-cell {
    position: sticky;
    left: 0;
    background: #111827 !important;
    padding: 1rem;
    border-right: 2px solid rgba(167, 139, 250, 0.2);
    z-index: 15;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
    border-top: 1px solid #111827;
    border-bottom: 1px solid #111827;
  }

  .stock-price-cell::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 0;
    right: 0;
    bottom: -1px;
    background: #111827;
    z-index: -1;
  }

  .stock-price-cell::after {
    content: '';
    position: absolute;
    top: 0;
    left: -1px;
    width: 3px;
    height: 100%;
    background: #111827;
    z-index: 16;
  }

  .stock-price-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .stock-price-cell .price-value {
    font-size: 1rem;
    font-weight: 600;
    color: #94a3b8;
  }

  .stock-price-cell.strike .price-value {
    color: #22c55e;
  }

  .stock-price-cell.current .price-value {
    color: #60a5fa;
  }

  .price-badge {
    font-size: 0.625rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .strike-badge {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }

  .current-badge {
    background: rgba(96, 165, 250, 0.1);
    color: #60a5fa;
    border: 1px solid rgba(96, 165, 250, 0.2);
  }

  .premium-cell {
    padding: 1rem;
    text-align: center;
    color: #94a3b8;
    transition: all 0.3s;
    min-height: 60px;
    vertical-align: middle;
  }

  /* Consistent Premium Content Layout */
  .premium-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.25rem;
    min-height: 28px;
    width: 100%;
  }

  .premium-value {
    font-weight: 500;
    color: #94a3b8;
    font-size: 0.875rem;
    line-height: 1.2;
    text-align: center;
    white-space: nowrap;
  }

  .analysis-label {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    line-height: 1;
    white-space: nowrap;
  }

  .analysis-label.profit {
    color: #4ade80;
  }

  .analysis-label.loss {
    color: #f87171;
  }

  .analysis-label.breakeven {
    color: #facc15;
  }

  .analysis-label.current {
    color: #93c5fd;
  }

  .premium-value.breakeven {
    color: #fde047;
    font-weight: 600;
  }

  .premium-value.current {
    color: #60a5fa;
    font-weight: 600;
  }

  /* ITM/OTM Separator */
  .separator-row {
    background: rgba(31, 41, 55, 0.3);
  }

  .separator-cell {
    padding: 0.5rem 1rem;
  }

  .separator-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .separator-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .separator-line {
    flex: 1;
    height: 2px;
    border-radius: 1px;
  }

  .separator-line.call {
    background: linear-gradient(to right, #ef4444, #22c55e);
  }

  .separator-line.put {
    background: linear-gradient(to right, #22c55e, #ef4444);
  }

  .separator-text {
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .separator-text.itm {
    color: #4ade80;
  }

  .separator-text.otm {
    color: #f87171;
  }

  .separator-arrow {
    width: 16px;
    height: 16px;
  }

  .separator-arrow.itm {
    color: #4ade80;
  }

  .separator-arrow.otm {
    color: #f87171;
  }

  /* Empty State */
  .empty-state {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #64748b;
    padding: 2rem;
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 1rem;
    stroke-width: 1.5;
  }

  .empty-text {
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .matrix-header {
      flex-direction: column;
      align-items: stretch;
    }

    .matrix-controls {
      justify-content: center;
    }

    .current-price-card {
      flex-direction: column;
      text-align: center;
    }

    .price-meta {
      justify-content: center;
    }

    .matrix-table-container {
      margin: 0 0.75rem 0.75rem;
    }

    /* Mobile table layout fixes */
    .stock-price-header {
      width: 70px;
      min-width: 70px;
      max-width: 70px;
      padding: 0.5rem 0.25rem;
      font-size: 0.65rem;
      text-align: center;
      line-height: 1.1;
      position: sticky;
      left: 0;
      background: #1f2937 !important;
      z-index: 25;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
      border-right: 2px solid rgba(167, 139, 250, 0.2);
    }

    .time-header {
      padding: 0.5rem 0.25rem;
      width: auto;
      min-width: 85px;
    }

    .stock-price-cell {
      width: 70px;
      min-width: 70px;
      max-width: 70px;
      padding: 0.4rem 0.125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      position: sticky;
      left: 0;
      background: #111827 !important;
      z-index: 15;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
      border-right: 2px solid rgba(167, 139, 250, 0.2);
      border-top: 1px solid #111827;
      border-bottom: 1px solid #111827;
    }

    .stock-price-content {
      flex-direction: column;
      gap: 0.125rem;
      align-items: center;
      justify-content: center;
      width: 100%;
    }

    .stock-price-cell .price-value {
      font-size: 0.35rem !important;
      line-height: 1 !important;
      text-align: center !important;
      white-space: nowrap !important;
    }

    .price-badge {
      font-size: 0.5rem;
      padding: 0.125rem 0.25rem;
      text-align: center;
      line-height: 1;
    }

    .premium-cell {
      min-height: 50px;
      padding: 0.5rem 0.25rem;
      width: auto;
    }

    .premium-content {
      min-height: 30px;
    }

    .premium-value {
      font-size: 0.75rem;
      line-height: 1.2;
    }

    .analysis-label {
      font-size: 0.5rem;
    }

    .pricing-table {
      font-size: 0.75rem;
    }

    .price-value {
      font-size: 1.5rem !important;
    }

    .time-header-content {
      gap: 0.125rem;
    }

    .day-label,
    .time-label {
      font-size: 0.5rem;
    }

    .date-label {
      font-size: 0.625rem;
    }
  }

  @media (max-width: 640px) {
    .deltuh-pricing-matrix {
      border-radius: 12px;
    }

    .matrix-header {
      padding: 1rem;
    }

    .matrix-title {
      font-size: 1.125rem;
    }

    .deltuh-logo {
      height: 20px;
    }

    .analyzer-toggle {
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
    }

    .analyzer-toggle svg {
      width: 16px;
      height: 16px;
    }

    .current-price-card {
      margin: 0 1rem;
      padding: 0.875rem;
    }

    .price-value {
      font-size: 1.25rem !important;
    }

    .analysis-section {
      padding: 0 1rem;
    }

    .input-group {
      max-width: 100%;
    }

    .matrix-table-container {
      margin: 0 1rem 1rem;
      border-radius: 8px;
    }

    /* Ultra-compact layout for smallest screens */
    .stock-price-header {
      width: 65px;
      min-width: 65px;
      max-width: 65px;
      padding: 0.375rem 0.125rem;
      font-size: 0.6rem;
      line-height: 1;
      text-align: center;
      position: sticky;
      left: 0;
      background: #1f2937 !important;
      z-index: 25;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
      border-right: 2px solid rgba(167, 139, 250, 0.2);
    }

    .time-header {
      padding: 0.375rem 0.25rem;
      min-width: 80px;
    }

    .stock-price-cell {
      width: 65px;
      min-width: 65px;
      max-width: 65px;
      padding: 0.3rem 0.0625rem;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      position: sticky;
      left: 0;
      background: #111827 !important;
      z-index: 15;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
      border-right: 2px solid rgba(167, 139, 250, 0.2);
      border-top: 1px solid #111827;
      border-bottom: 1px solid #111827;
    }

    .stock-price-content {
      max-width: 65px;
    }

    .stock-price-cell .price-value {
      font-size: 0.3rem !important;
      line-height: 1 !important;
      text-align: center !important;
      white-space: nowrap !important;
    }

    .price-badge {
      font-size: 0.4375rem;
      padding: 0.0625rem 0.125rem;
      text-align: center;
      line-height: 1;
    }

    .premium-cell {
      min-height: 45px;
      padding: 0.375rem 0.25rem;
    }

    .premium-content {
      min-height: 25px;
      gap: 0.125rem;
    }

    .premium-value {
      font-size: 0.6875rem;
      line-height: 1.1;
    }

    .analysis-label {
      font-size: 0.4375rem;
    }

    .time-header-content {
      gap: 0.0625rem;
    }

    .day-label,
    .time-label {
      font-size: 0.4375rem;
    }

    .date-label {
      font-size: 0.5625rem;
    }
  }
</style>