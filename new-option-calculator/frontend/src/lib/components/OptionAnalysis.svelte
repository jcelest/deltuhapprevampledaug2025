<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  export let calculationResults = null;
  export let inputData = {};
  export const config = {};
  export let entryPriceAnalysis = null;

  // Analysis state
  let targetPrice = '';
  let timeHorizon = '0'; // index
  let volatilityAdjustment = 0; // percentage change
  let showAdvanced = false;

  // Debug initial state
  console.log('🔧 OptionAnalysis Initial State:', {
    targetPrice,
    timeHorizon,
    calculationResults: !!calculationResults,
    inputData: !!inputData
  });

  // Get available time horizons from pricing matrix with proper formatting
  $: availableTimeHorizons = calculationResults?.tableData?.timeHeaders?.map((timeHeader, index) => {
    const date = new Date(timeHeader);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dateStr = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    
    return {
      value: index.toString(),
      label: `${dayName}, ${dateStr}`,
      timeLabel: timeStr,
      fullLabel: `${dayName}, ${dateStr} ${timeStr}`,
      date: timeHeader,
      index: index
    };
  }) || [];

  // Group time horizons by date for better organization
  $: groupedTimeHorizons = availableTimeHorizons.reduce((groups, horizon) => {
    const dateKey = horizon.label; // "WED, 10/22/2025"
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(horizon);
    return groups;
  }, {});

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

  // Debug pricing matrix data
  $: if (calculationResults) {
    console.log('🔍 OptionAnalysis Debug:');
    console.log('📊 calculationResults:', calculationResults);
    console.log('📋 tableData:', calculationResults.tableData);
    console.log('⏰ timeHeaders:', calculationResults.tableData?.timeHeaders);
    console.log('📈 rows:', calculationResults.tableData?.rows);
    console.log('🎯 inputData:', inputData);
  }

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
  function getPremiumAtPriceAndTime(targetPrice, timeIndex) {
    console.log('🔍 getPremiumAtPriceAndTime called:', { targetPrice, timeIndex, targetPriceType: typeof targetPrice });
    
    if (!analysisData?.tableData) {
      console.log('❌ No tableData available');
      return null;
    }
    
    const targetPriceNum = parseFloat(targetPrice);
    const timeIndexNum = parseInt(timeIndex);
    
    console.log('🔢 Parsed values:', { targetPriceNum, timeIndexNum });
    
    console.log('📊 Table data:', analysisData.tableData);
    console.log('📈 Rows available:', analysisData.tableData.rows?.length);
    
    // Find the closest stock price row
    let closestRow = null;
    let minDiff = Infinity;
    
    if (analysisData.tableData.rows) {
      analysisData.tableData.rows.forEach((row, index) => {
        const diff = Math.abs(row.stockPrice - targetPriceNum);
        console.log(`Row ${index}: stockPrice=${row.stockPrice}, diff=${diff}`);
        if (diff < minDiff) {
          minDiff = diff;
          closestRow = row;
        }
      });
    }
    
    console.log('🎯 Closest row:', closestRow);
    console.log('📊 Closest row premiums:', closestRow?.premiums);
    
    if (!closestRow) {
      console.log('❌ No closest row found');
      return null;
    }
    
    // Find the premium at the specified time index
    if (timeIndexNum < 0 || timeIndexNum >= closestRow.premiums.length) {
      console.log('❌ Invalid time index:', { timeIndexNum, premiumsLength: closestRow.premiums.length });
      return null;
    }
    
    const premium = getAveragePremium(closestRow.premiums[timeIndexNum]);
    console.log('💰 Final premium:', premium);
    console.log('📊 Premium range at this time:', closestRow.premiums[timeIndexNum]);
    console.log('🎯 Target price:', targetPriceNum, 'Time index:', timeIndexNum);
    return premium;
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
    if (!analysisData || !timeHorizon) {
      console.log('❌ TimeDecay: Missing data', { analysisData, timeHorizon });
      return null;
    }
    
    const currentPremium = analysisData.currentPremium;
    const timeIndex = parseInt(timeHorizon);
    
    console.log('🕐 TimeDecay Calculation:', {
      currentPremium,
      timeIndex,
      currentPrice: analysisData.currentPrice,
      tableData: analysisData.tableData
    });
    
    // Get premium at current price but at the time horizon
    const futurePremium = getPremiumAtPriceAndTime(analysisData.currentPrice.toString(), timeIndex);
    
    console.log('🔮 Future Premium:', futurePremium);
    
    if (!currentPremium || !futurePremium) {
      console.log('❌ TimeDecay: Missing premiums', { currentPremium, futurePremium });
      return null;
    }
    
    const totalDecay = currentPremium - futurePremium;
    const decayPercentage = (totalDecay / currentPremium) * 100;
    
    // Calculate daily decay based on time difference
    const selectedTime = availableTimeHorizons[timeIndex];
    const currentTime = new Date();
    const timeDiff = new Date(selectedTime?.date || currentTime) - currentTime;
    const daysDiff = Math.max(1, timeDiff / (1000 * 60 * 60 * 24));
    const dailyDecay = totalDecay / daysDiff;
    
    const result = {
      dailyDecay,
      totalDecay,
      decayPercentage,
      futurePremium,
      remainingDays: getDaysToExpiry() - daysDiff
    };
    
    console.log('✅ TimeDecay Result:', result);
    return result;
  }

  function calculateCombinedAnalysis() {
    console.log('🎯 Combined Analysis Calculation:', {
      analysisData: !!analysisData,
      targetPrice,
      timeHorizon,
      currentPrice: analysisData?.currentPrice,
      optionType: analysisData?.optionType,
      targetPriceType: typeof targetPrice,
      targetPriceValue: targetPrice,
      timeHorizonType: typeof timeHorizon,
      timeHorizonValue: timeHorizon
    });
    
    if (!analysisData || !targetPrice || targetPrice === '' || targetPrice === null || targetPrice === undefined || parseFloat(targetPrice) <= 0 || !timeHorizon) {
      console.log('❌ Combined Analysis: Missing required data', {
        hasAnalysisData: !!analysisData,
        targetPrice: targetPrice,
        timeHorizon: timeHorizon,
        targetPriceEmpty: targetPrice === '',
        targetPriceNull: targetPrice === null,
        targetPriceUndefined: targetPrice === undefined,
        timeHorizonEmpty: timeHorizon === '',
        timeHorizonNull: timeHorizon === null,
        timeHorizonUndefined: timeHorizon === undefined,
        targetPriceNumber: typeof targetPrice === 'number',
        targetPriceString: typeof targetPrice === 'string',
        parsedTargetPrice: parseFloat(targetPrice),
        isValidTargetPrice: parseFloat(targetPrice) > 0
      });
      return null;
    }
    
    const currentPremium = analysisData.currentPremium;
    const targetPriceNum = parseFloat(targetPrice);
    const targetPremium = getPremiumAtPriceAndTime(targetPriceNum.toString(), timeHorizon);
    
    console.log('💰 Premium Analysis:', {
      currentPremium,
      targetPremium,
      targetPrice: targetPriceNum,
      currentPrice: analysisData.currentPrice,
      targetPriceString: targetPriceNum.toString()
    });
    
    if (!currentPremium || !targetPremium) {
      console.log('❌ Combined Analysis: Missing premiums');
      return null;
    }
    
    const premiumChange = ((targetPremium - currentPremium) / currentPremium) * 100;
    const priceChange = ((targetPriceNum - analysisData.currentPrice) / analysisData.currentPrice) * 100;
    
    const selectedTime = availableTimeHorizons[parseInt(timeHorizon)];
    
    const result = {
      priceChange,
      premiumChange,
      newPremium: targetPremium,
      isProfit: premiumChange > 0,
      timeLabel: selectedTime?.fullLabel || 'Unknown time'
    };
    
    console.log('✅ Combined Analysis Result:', result);
    return result;
  }

  // Reactive calculations with debouncing
  $: priceImpact = calculatePriceImpact();
  $: timeDecay = calculateTimeDecay();
  
  // Only calculate combined analysis if we have a valid target price
  $: {
    const shouldCalculate = targetPrice && targetPrice !== '' && parseFloat(targetPrice) > 0;
    console.log('🔄 Combined Analysis Trigger:', {
      targetPrice,
      shouldCalculate,
      parsedValue: parseFloat(targetPrice)
    });
    combinedAnalysis = shouldCalculate ? calculateCombinedAnalysis() : null;
  }

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
    console.log('🎯 Auto-populated targetPrice:', targetPrice);
  }

  // Debug targetPrice changes
  $: console.log('📝 targetPrice changed:', targetPrice, typeof targetPrice);
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
                <option value={horizon.value}>{horizon.fullLabel}</option>
              {/each}
            </select>
          </div>
        </div>
        
        <div class="analysis-button-container">
          <button 
            class="analysis-button"
            on:click={() => {
              console.log('🔘 Analysis Button Clicked!');
              console.log('📊 Current State:', {
                targetPrice,
                timeHorizon,
                analysisData: !!analysisData,
                calculationResults: !!calculationResults
              });
              // Force recalculation by triggering reactive statements
              timeHorizon = timeHorizon;
              targetPrice = targetPrice;
            }}
          >
            <svg class="analysis-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analyze Scenario
          </button>
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
                by {combinedAnalysis.timeLabel}
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

      <!-- Time Decay Analysis - Main Event -->
      <div class="main-analysis-card">
        <div class="main-analysis-header">
          <div class="main-title-section">
            <svg class="main-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            <h3 class="main-title">Time Decay Analysis</h3>
          </div>
          <div class="time-selector-section">
            <label for="decay-time-horizon" class="main-label">Select Time Horizon</label>
            <select 
              id="decay-time-horizon"
              bind:value={timeHorizon}
              class="main-time-select"
            >
              {#each availableTimeHorizons as horizon}
                <option value={horizon.value}>{horizon.fullLabel}</option>
              {/each}
            </select>
          </div>
        </div>
        
        {#if timeDecay || combinedAnalysis}
          <div class="main-decay-result">
            <div class="main-decay-statement">
              <svg class="statement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 3v18h18"/>
                <path d="M18.5 8.5l-5 5-2-2-4 4"/>
              </svg>
              <div class="statement-content">
                {#if targetPrice && combinedAnalysis}
                  <!-- Price Target Analysis -->
                  <div class="statement-text">
                    Premiums are expected to 
                    <span class="main-decay-value {combinedAnalysis.premiumChange > 0 ? 'positive' : 'negative'}">
                      {combinedAnalysis.premiumChange > 0 ? 'increase' : 'decrease'} {Math.abs(combinedAnalysis.premiumChange).toFixed(1)}%
                    </span>
                  </div>
                  <div class="statement-time">
                    by {combinedAnalysis.timeLabel} if price goes to ${targetPrice}
                  </div>
                {:else if timeDecay}
                  <!-- Time Decay Analysis -->
                  <div class="statement-text">
                    Premiums are expected to 
                    <span class="main-decay-value negative">decrease {timeDecay.decayPercentage.toFixed(1)}%</span>
                  </div>
                  <div class="statement-time">
                    by {availableTimeHorizons[parseInt(timeHorizon)]?.fullLabel || 'selected time'} if price remains at current level
                  </div>
                {/if}
              </div>
            </div>
            
            <div class="main-metrics-grid">
              {#if targetPrice && combinedAnalysis}
                <!-- Price Target Metrics -->
                <div class="main-metric-card">
                  <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <div class="metric-content">
                    <div class="metric-label">New Premium</div>
                    <div class="metric-value">${combinedAnalysis.newPremium.toFixed(2)}</div>
                  </div>
                </div>
                
                <div class="main-metric-card">
                  <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 3v18h18"/>
                    <path d="M18.5 8.5l-5 5-2-2-4 4"/>
                  </svg>
                  <div class="metric-content">
                    <div class="metric-label">Price Change</div>
                    <div class="metric-value {combinedAnalysis.priceChange > 0 ? 'positive' : 'negative'}">
                      {combinedAnalysis.priceChange > 0 ? '+' : ''}{combinedAnalysis.priceChange.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div class="main-metric-card">
                  <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 1v6l3-3 3 3V1"/>
                    <path d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6"/>
                    <path d="M3 12h18"/>
                  </svg>
                  <div class="metric-content">
                    <div class="metric-label">Premium Change</div>
                    <div class="metric-value {combinedAnalysis.premiumChange > 0 ? 'positive' : 'negative'}">
                      {combinedAnalysis.premiumChange > 0 ? '+' : ''}{combinedAnalysis.premiumChange.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div class="main-metric-card">
                  <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2v20"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  <div class="metric-content">
                    <div class="metric-label">Time Horizon</div>
                    <div class="metric-value">{availableTimeHorizons[parseInt(timeHorizon)]?.label || 'Unknown'}</div>
                  </div>
                </div>
              {:else if timeDecay}
                <!-- Time Decay Metrics -->
                <div class="main-metric-card">
                  <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 1v6l3-3 3 3V1"/>
                    <path d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6"/>
                    <path d="M3 12h18"/>
                  </svg>
                  <div class="metric-content">
                    <div class="metric-label">Daily Decay</div>
                    <div class="metric-value">${timeDecay.dailyDecay.toFixed(2)}</div>
                  </div>
                </div>
                
                <div class="main-metric-card">
                  <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 3v18h18"/>
                    <path d="M18.5 8.5l-5 5-2-2-4 4"/>
                  </svg>
                  <div class="metric-content">
                    <div class="metric-label">Total Decay</div>
                    <div class="metric-value">${timeDecay.totalDecay.toFixed(2)}</div>
                  </div>
                </div>
                
                <div class="main-metric-card">
                  <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <div class="metric-content">
                    <div class="metric-label">Future Premium</div>
                    <div class="metric-value">${timeDecay.futurePremium.toFixed(2)}</div>
                  </div>
                </div>
                
                <div class="main-metric-card">
                  <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2v20"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  <div class="metric-content">
                    <div class="metric-label">Remaining Days</div>
                    <div class="metric-value">{timeDecay.remainingDays}</div>
                  </div>
                </div>
              {/if}
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

  /* Analysis Button */
  .analysis-button-container {
    display: flex;
    justify-content: center;
    margin: 1rem 0;
  }

  .analysis-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #a78bfa, #8b5cf6);
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    color: white;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(167, 139, 250, 0.3);
  }

  .analysis-button:hover {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(167, 139, 250, 0.4);
  }

  .analysis-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(167, 139, 250, 0.3);
  }

  .analysis-icon {
    width: 16px;
    height: 16px;
  }

  /* Main Analysis Card - Time Decay as Main Event */
  .main-analysis-card {
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(196, 181, 253, 0.08) 100%);
    border: 2px solid rgba(167, 139, 250, 0.3);
    border-radius: 16px;
    padding: 2rem;
    margin: 1.5rem 0;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
  }

  .main-analysis-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #a78bfa, #8b5cf6, #7c3aed);
  }

  .main-analysis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .main-title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .main-icon {
    width: 2rem;
    height: 2rem;
    color: #a78bfa;
    filter: drop-shadow(0 2px 4px rgba(167, 139, 250, 0.3));
  }

  .main-title {
    font-size: 1.75rem;
    font-weight: 800;
    background: linear-gradient(135deg, #fff, #c4b5fd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .time-selector-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 250px;
  }

  .main-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #c4b5fd;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .main-time-select {
    background: rgba(17, 24, 39, 0.9);
    border: 2px solid rgba(167, 139, 250, 0.3);
    border-radius: 12px;
    padding: 0.875rem 1rem;
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .main-time-select:focus {
    outline: none;
    border-color: #a78bfa;
    box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.2), 0 6px 16px rgba(0, 0, 0, 0.3);
    transform: translateY(-1px);
  }

  .main-time-select option {
    background: #1f2937;
    color: #fff;
    font-weight: 600;
  }

  /* Main Decay Result */
  .main-decay-result {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .main-decay-statement {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    background: rgba(17, 24, 39, 0.6);
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  .statement-icon {
    width: 3rem;
    height: 3rem;
    color: #f87171;
    flex-shrink: 0;
  }

  .statement-content {
    flex: 1;
  }

  .statement-text {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 0.5rem;
    line-height: 1.3;
  }

  .main-decay-value {
    font-size: 2rem;
    font-weight: 900;
    font-family: 'Courier New', monospace;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .main-decay-value.negative {
    color: #f87171;
    text-shadow: 0 0 8px rgba(248, 113, 113, 0.3);
  }

  .main-decay-value.positive {
    color: #10b981;
    text-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
  }

  .statement-time {
    font-size: 1rem;
    color: #94a3b8;
    font-weight: 500;
  }

  /* Main Metrics Grid */
  .main-metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .main-metric-card {
    background: rgba(17, 24, 39, 0.8);
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .main-metric-card:hover {
    border-color: rgba(167, 139, 250, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  .metric-icon {
    width: 2rem;
    height: 2rem;
    color: #a78bfa;
    flex-shrink: 0;
  }

  .metric-content {
    flex: 1;
  }

  .metric-label {
    font-size: 0.875rem;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: 800;
    color: #fff;
    font-family: 'Courier New', monospace;
  }

  .metric-value.positive {
    color: #10b981;
  }

  .metric-value.negative {
    color: #f87171;
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

    /* Main Analysis Mobile */
    .main-analysis-card {
      padding: 1.5rem;
      margin: 1rem 0;
    }

    .main-analysis-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1.5rem;
    }

    .main-title {
      font-size: 1.5rem;
    }

    .main-icon {
      font-size: 1.75rem;
    }

    .time-selector-section {
      min-width: auto;
    }

    .main-time-select {
      font-size: 0.875rem;
      padding: 0.75rem;
    }

    .main-decay-statement {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
      padding: 1.5rem;
    }

    .statement-text {
      font-size: 1.25rem;
    }

    .main-decay-value {
      font-size: 1.75rem;
    }

    .main-metrics-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .main-metric-card {
      padding: 1rem;
    }

    .metric-value {
      font-size: 1.25rem;
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
