<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  export let calculationResults = null;
  export let inputData = {};
  export const config = {};
  export let entryPriceAnalysis = null;

  // Analysis state
  let targetPrice = '';
  let timeHorizon = '1'; // days
  let volatilityAdjustment = 0; // percentage change
  let showAdvanced = false;

  // Get available time horizons from pricing matrix
  $: availableTimeHorizons = calculationResults?.tableData?.timeHeaders?.map((timeHeader, index) => {
    const date = new Date(timeHeader);
    const now = new Date();
    const daysDiff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    return {
      value: daysDiff.toString(),
      label: `${daysDiff} day${daysDiff !== 1 ? 's' : ''}`,
      date: timeHeader
    };
  }) || [];

  // Analysis data
  $: analysisData = calculationResults ? {
    currentPrice: inputData.stockPrice || 0,
    strikePrice: inputData.strikePrice || 0,
    optionType: inputData.optionType || 'call',
    expiration: inputData.expiration || '',
    impliedVolatility: inputData.impliedVolatility || 0,
    currentPremium: getCurrentPremium(),
    tableData: calculationResults.tableData
  } : null;

  function getCurrentPremium() {
    if (!calculationResults) return 0;
    const premiumRange = inputData.optionType === 'call' 
      ? calculationResults.callPriceRange 
      : calculationResults.putPriceRange;
    return getAveragePremium(premiumRange);
  }

  function getAveragePremium(premiumRange) {
    if (!premiumRange) return 0;
    const parts = premiumRange.split('-').map(Number);
    return (parts[0] + parts[1]) / 2;
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  }

  function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  function getDaysToExpiry() {
    if (!inputData.expiration) return 0;
    const expiry = new Date(inputData.expiration);
    const now = new Date();
    return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  }

  // Find premium at specific price and time from pricing matrix
  function getPremiumAtPriceAndTime(targetPrice, timeHorizonDays) {
    if (!analysisData?.tableData) return null;
    
    const targetPriceNum = parseFloat(targetPrice);
    const timeHorizonNum = parseInt(timeHorizonDays);
    
    // Find the closest stock price row
    let closestRow = null;
    let minDiff = Infinity;
    
    analysisData.tableData.rows.forEach(row => {
      const diff = Math.abs(row.stockPrice - targetPriceNum);
      if (diff < minDiff) {
        minDiff = diff;
        closestRow = row;
      }
    });
    
    if (!closestRow) return null;
    
    // Find the premium at the specified time horizon
    const timeIndex = Math.min(timeHorizonNum - 1, closestRow.premiums.length - 1);
    if (timeIndex < 0 || timeIndex >= closestRow.premiums.length) return null;
    
    return getAveragePremium(closestRow.premiums[timeIndex]);
  }

  function calculatePriceImpact() {
    if (!analysisData || !targetPrice || !timeHorizon) return null;
    
    const currentPremium = analysisData.currentPremium;
    const targetPremium = getPremiumAtPriceAndTime(targetPrice, timeHorizon);
    
    if (!currentPremium || !targetPremium) return null;
    
    const premiumChange = ((targetPremium - currentPremium) / currentPremium) * 100;
    const priceChange = ((parseFloat(targetPrice) - analysisData.currentPrice) / analysisData.currentPrice) * 100;
    
    return {
      priceChange,
      premiumChange,
      newPremium: targetPremium,
      isProfit: premiumChange > 0
    };
  }

  function calculateTimeDecay() {
    if (!analysisData || !timeHorizon) return null;
    
    const currentPremium = analysisData.currentPremium;
    const timeHorizonDays = parseInt(timeHorizon);
    
    // Get premium at current price but at the time horizon
    const futurePremium = getPremiumAtPriceAndTime(analysisData.currentPrice.toString(), timeHorizonDays);
    
    if (!currentPremium || !futurePremium) return null;
    
    const totalDecay = currentPremium - futurePremium;
    const decayPercentage = (totalDecay / currentPremium) * 100;
    const dailyDecay = totalDecay / timeHorizonDays;
    
    return {
      dailyDecay,
      totalDecay,
      decayPercentage,
      futurePremium,
      remainingDays: getDaysToExpiry() - timeHorizonDays
    };
  }

  function calculateCombinedAnalysis() {
    if (!analysisData || !targetPrice || !timeHorizon) return null;
    
    const currentPremium = analysisData.currentPremium;
    const targetPremium = getPremiumAtPriceAndTime(targetPrice, timeHorizon);
    
    if (!currentPremium || !targetPremium) return null;
    
    const premiumChange = ((targetPremium - currentPremium) / currentPremium) * 100;
    const priceChange = ((parseFloat(targetPrice) - analysisData.currentPrice) / analysisData.currentPrice) * 100;
    
    return {
      priceChange,
      premiumChange,
      newPremium: targetPremium,
      isProfit: premiumChange > 0,
      timeHorizonDays: parseInt(timeHorizon)
    };
  }

  // Reactive calculations
  $: priceImpact = calculatePriceImpact();
  $: timeDecay = calculateTimeDecay();
  $: combinedAnalysis = calculateCombinedAnalysis();

  function getAnalysisColor(value, isPositive) {
    if (value > 0) return isPositive ? 'positive' : 'negative';
    if (value < 0) return isPositive ? 'negative' : 'positive';
    return 'neutral';
  }

  function getAnalysisIcon(value, isPositive) {
    if (value > 0) return isPositive ? '↗' : '↘';
    if (value < 0) return isPositive ? '↘' : '↗';
    return '→';
  }

  // Auto-populate target price when entry price analysis is available
  $: if (entryPriceAnalysis && entryPriceAnalysis.entryPrice) {
    targetPrice = entryPriceAnalysis.entryPrice.toString();
  }
</script>

<div class="deltuh-option-analysis">
  <div class="analysis-header">
    <div class="header-left">
      <div class="title-row">
        <img src="/deltuh logo.svg" alt="Deltuh" class="deltuh-logo" />
        <h3 class="analysis-title">Option Analysis</h3>
      </div>
    </div>
    {#if inputData.ticker}
      <div class="ticker-badge">
        <span class="ticker-text">{inputData.ticker}</span>
      </div>
    {/if}
  </div>

  <div class="analysis-content">
    {#if analysisData}
      <!-- Current Scenario Analysis -->
      <div class="analysis-card">
        <h4 class="card-title">Current Scenario</h4>
        <div class="scenario-content">
          <div class="scenario-item">
            <span class="scenario-label">Current Premium:</span>
            <span class="scenario-value">${analysisData.currentPremium.toFixed(2)}</span>
          </div>
          <div class="scenario-item">
            <span class="scenario-label">Stock Price:</span>
            <span class="scenario-value">${analysisData.currentPrice}</span>
          </div>
          <div class="scenario-item">
            <span class="scenario-label">Days to Expiry:</span>
            <span class="scenario-value">{getDaysToExpiry()}</span>
          </div>
        </div>
      </div>

      <!-- Combined Price & Time Analysis -->
      <div class="analysis-card">
        <h4 class="card-title">Price & Time Analysis</h4>
        <div class="input-row">
          <div class="input-group">
            <label for="target-price">Target Price ($)</label>
            <input 
              id="target-price"
              type="number" 
              step="0.01" 
              bind:value={targetPrice}
              placeholder="Enter target price"
              class="price-input"
            />
          </div>
          <div class="input-group">
            <label for="time-horizon">Time Horizon</label>
            <select 
              id="time-horizon"
              bind:value={timeHorizon}
              class="time-select"
            >
              {#each availableTimeHorizons as horizon}
                <option value={horizon.value}>{horizon.label}</option>
              {/each}
            </select>
          </div>
        </div>
        
        {#if combinedAnalysis}
          <div class="impact-result {getAnalysisColor(combinedAnalysis.premiumChange, combinedAnalysis.isProfit)}">
            <div class="impact-header">
              <span class="impact-icon {getAnalysisColor(combinedAnalysis.premiumChange, combinedAnalysis.isProfit)}">
                {getAnalysisIcon(combinedAnalysis.premiumChange, combinedAnalysis.isProfit)}
              </span>
              <span class="impact-text">
                Premiums are expected to 
                <span class="impact-value {getAnalysisColor(combinedAnalysis.premiumChange, combinedAnalysis.isProfit)}">
                  {combinedAnalysis.premiumChange > 0 ? 'increase' : 'decrease'} {Math.abs(combinedAnalysis.premiumChange).toFixed(1)}%
                </span>
                if price goes to 
                <span class="price-highlight">${targetPrice}</span>
                in {combinedAnalysis.timeHorizonDays} day{combinedAnalysis.timeHorizonDays !== 1 ? 's' : ''}
              </span>
            </div>
            <div class="impact-details">
              <div class="detail-item">
                <span class="detail-label">New Premium:</span>
                <span class="detail-value">${combinedAnalysis.newPremium.toFixed(2)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Price Change:</span>
                <span class="detail-value {getAnalysisColor(combinedAnalysis.priceChange, true)}">
                  {combinedAnalysis.priceChange > 0 ? '+' : ''}{combinedAnalysis.priceChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        {/if}

        <!-- Entry Price Analysis Integration -->
        {#if entryPriceAnalysis && entryPriceAnalysis.entryPrice}
          <div class="entry-price-analysis">
            <div class="entry-price-header">
              <span class="entry-price-icon">🎯</span>
              <span class="entry-price-text">
                Analysis from your entry price: <span class="entry-price-value">${entryPriceAnalysis.entryPrice}</span>
              </span>
            </div>
            <div class="entry-price-details">
              <div class="detail-item">
                <span class="detail-label">Entry Premium:</span>
                <span class="detail-value">${entryPriceAnalysis.entryPrice}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Current Premium:</span>
                <span class="detail-value">${analysisData.currentPremium.toFixed(2)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">P&L:</span>
                <span class="detail-value {getAnalysisColor(analysisData.currentPremium - entryPriceAnalysis.entryPrice, true)}">
                  {analysisData.currentPremium - entryPriceAnalysis.entryPrice > 0 ? '+' : ''}${(analysisData.currentPremium - entryPriceAnalysis.entryPrice).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Time Decay Analysis -->
      <div class="analysis-card">
        <h4 class="card-title">Time Decay Analysis</h4>
        <div class="input-group">
          <label for="decay-time-horizon">Time Horizon</label>
          <select 
            id="decay-time-horizon"
            bind:value={timeHorizon}
            class="time-select"
          >
            {#each availableTimeHorizons as horizon}
              <option value={horizon.value}>{horizon.label}</option>
            {/each}
          </select>
        </div>
        
        {#if timeDecay}
          <div class="decay-result">
            <div class="decay-header">
              <span class="decay-icon">⏰</span>
              <span class="decay-text">
                Premiums are expected to 
                <span class="decay-value negative">decrease {timeDecay.decayPercentage.toFixed(1)}%</span>
                over the next {timeHorizon} day{timeHorizon !== '1' ? 's' : ''} if price remains at current level
              </span>
            </div>
            <div class="decay-details">
              <div class="detail-item">
                <span class="detail-label">Daily Decay:</span>
                <span class="detail-value">${timeDecay.dailyDecay.toFixed(2)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Total Decay:</span>
                <span class="detail-value">${timeDecay.totalDecay.toFixed(2)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Future Premium:</span>
                <span class="detail-value">${timeDecay.futurePremium.toFixed(2)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Remaining Days:</span>
                <span class="detail-value">{timeDecay.remainingDays}</span>
              </div>
            </div>
          </div>
        {/if}
      </div>

    {:else}
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p class="empty-text">Calculate options to see analysis</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .deltuh-option-analysis {
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
  .analysis-header {
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

  .analysis-title {
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(135deg, #fff, #c4b5fd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }

  .ticker-badge {
    display: flex;
    align-items: center;
    padding: 0.375rem 0.875rem;
    background: rgba(167, 139, 250, 0.1);
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 20px;
    font-family: 'Courier New', monospace;
  }

  .ticker-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: #c4b5fd;
    letter-spacing: 0.05em;
  }

  /* Main Content */
  .analysis-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Analysis Cards */
  .analysis-card {
    background: rgba(17, 24, 39, 0.6);
    border: 1px solid rgba(167, 139, 250, 0.1);
    border-radius: 12px;
    padding: 1rem;
    transition: all 0.3s;
  }

  .analysis-card:hover {
    border-color: rgba(167, 139, 250, 0.2);
    background: rgba(17, 24, 39, 0.8);
  }

  .card-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #c4b5fd;
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Input Groups */
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .input-group label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Input Row Layout */
  .input-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .price-input, .time-input, .time-select {
    background: rgba(17, 24, 39, 0.8);
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    color: #fff;
    font-size: 0.875rem;
    transition: all 0.3s;
    width: 100%;
  }

  .time-select {
    cursor: pointer;
  }

  .price-input:focus, .time-input:focus, .time-select:focus {
    outline: none;
    border-color: #a78bfa;
    box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.2);
  }

  .time-select option {
    background: #1f2937;
    color: #fff;
  }


  /* Scenario Content */
  .scenario-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .scenario-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .scenario-label {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .scenario-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #fff;
    font-family: 'Courier New', monospace;
  }

  /* Impact Results */
  .impact-result, .decay-result, .volatility-result {
    background: rgba(167, 139, 250, 0.05);
    border: 1px solid rgba(167, 139, 250, 0.15);
    border-radius: 8px;
    padding: 0.75rem;
    margin-top: 0.75rem;
  }

  .impact-header, .decay-header, .volatility-header {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .impact-icon, .decay-icon, .volatility-icon {
    font-size: 1rem;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .impact-text, .decay-text, .volatility-text {
    font-size: 0.75rem;
    color: #94a3b8;
    line-height: 1.4;
  }

  .impact-value, .decay-value, .volatility-value {
    font-weight: 600;
    font-family: 'Courier New', monospace;
  }

  .price-highlight {
    color: #c4b5fd;
    font-weight: 600;
  }

  .positive {
    color: #4ade80;
  }

  .negative {
    color: #f87171;
  }

  .neutral {
    color: #94a3b8;
  }

  /* Enhanced color coding for analysis results */
  .impact-result.positive {
    background: linear-gradient(135deg, rgba(74, 222, 128, 0.1), rgba(34, 197, 94, 0.05));
    border: 1px solid rgba(74, 222, 128, 0.3);
  }

  .impact-result.negative {
    background: linear-gradient(135deg, rgba(248, 113, 113, 0.1), rgba(239, 68, 68, 0.05));
    border: 1px solid rgba(248, 113, 113, 0.3);
  }

  .impact-result.neutral {
    background: linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(100, 116, 139, 0.05));
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  /* Entry Price Analysis */
  .entry-price-analysis {
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.1), rgba(196, 181, 253, 0.05));
    border: 1px solid rgba(167, 139, 250, 0.3);
    border-radius: 8px;
    padding: 0.75rem;
    margin-top: 0.75rem;
  }

  .entry-price-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .entry-price-icon {
    font-size: 1rem;
  }

  .entry-price-text {
    font-size: 0.75rem;
    color: #c4b5fd;
    font-weight: 500;
  }

  .entry-price-value {
    color: #fff;
    font-weight: 600;
    font-family: 'Courier New', monospace;
  }

  .entry-price-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  /* Impact Details */
  .impact-details, .decay-details, .volatility-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-label {
    font-size: 0.6875rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .detail-value {
    font-size: 0.75rem;
    font-weight: 600;
    color: #fff;
    font-family: 'Courier New', monospace;
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
    gap: 1rem;
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    stroke-width: 1.5;
  }

  .empty-text {
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .analysis-header {
      padding: 1rem;
      flex-direction: column;
      align-items: stretch;
    }

    .analysis-content {
      padding: 0 1rem 1rem;
    }

    .analysis-card {
      padding: 0.875rem;
    }

    .input-row {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .impact-details, .decay-details, .volatility-details {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .impact-header, .decay-header, .volatility-header {
      flex-direction: column;
      gap: 0.25rem;
    }

    .impact-text, .decay-text, .volatility-text {
      font-size: 0.6875rem;
    }
  }

  @media (max-width: 640px) {
    .deltuh-option-analysis {
      border-radius: 12px;
    }

    .analysis-title {
      font-size: 1.125rem;
    }

    .deltuh-logo {
      height: 20px;
    }

    .ticker-badge {
      padding: 0.25rem 0.75rem;
    }

    .ticker-text {
      font-size: 0.8125rem;
    }

    .card-title {
      font-size: 0.8125rem;
    }

    .scenario-value, .detail-value {
      font-size: 0.8125rem;
    }

    .impact-text, .decay-text, .volatility-text {
      font-size: 0.625rem;
    }
  }

  /* Tablet Portrait and Small Desktop */
  @media (min-width: 769px) and (max-width: 1024px) {
    .analysis-card {
      padding: 1.125rem;
    }

    .greeks-breakdown {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Large screens */
  @media (min-width: 1400px) {
    .analysis-content {
      gap: 1.25rem;
    }

    .analysis-card {
      padding: 1.25rem;
    }
  }
</style>
