<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import axios from 'axios';

  const dispatch = createEventDispatcher();
  export const config = {};
  export let hasPricingMatrix = false;
  export let loadedInputData = null;

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
  let expiration = getTodayDateString();
  let strikePrice = '';
  
  // Data state that will be fetched from our backend
  let stockPrice = '';
  let impliedVolatility = '';

  // State for advanced options
  let optionType = 'call';
  let priceIncrement = '1.0';
  let sliderValue = 1; // Track slider position separately

  // App state to manage UI feedback
  let isLoading = false;
  let error = '';
  let calculationResults = null;
  
  // State for the informational message
  let infoMessage = '';

  // Advanced UI toggle
  let autoCalculateOnInput = true;
  let showAdvanced = false;

  // Track if we've already loaded data to prevent overwriting user input
  let hasLoadedData = false;

  // Function to populate fields from loaded data
  function populateFromLoadedData(data) {
    if (!data || Object.keys(data).length === 0) return;
    
    console.log('🔄 Loading input data into CalculationEngine:', data);
    
    // Only populate if we haven't loaded data yet (to avoid overwriting user input)
    if (!hasLoadedData) {
      ticker = data.ticker || '';
      strikePrice = data.strikePrice || '';
      expiration = data.expiration || getTodayDateString();
      optionType = data.optionType || 'call';
      stockPrice = data.stockPrice || '';
      impliedVolatility = data.impliedVolatility || '';
      priceIncrement = data.priceIncrement || '1.0';
      
      hasLoadedData = true;
      console.log('✅ Fields updated - ticker:', ticker, 'strike:', strikePrice, 'expiration:', expiration);
    }
  }

  // Populate fields when loadedInputData changes
  $: if (loadedInputData && Object.keys(loadedInputData).length > 0) {
    populateFromLoadedData(loadedInputData);
  }

  // Also handle the case where data is passed after component is mounted
  $: if (loadedInputData) {
    // Use a small delay to ensure the component is ready
    setTimeout(() => {
      populateFromLoadedData(loadedInputData);
    }, 100);
  }

  // Reset the loaded data flag when component is destroyed/recreated
  $: if (!loadedInputData) {
    hasLoadedData = false;
  }

  // Expose current input values for external access
  export function getCurrentInputs() {
    return {
      ticker,
      strikePrice,
      expiration,
      optionType,
      stockPrice,
      impliedVolatility,
      priceIncrement
    };
  }

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
  function clearResults() {
    calculationResults = null;
    infoMessage = '';
    error = '';
    dispatch('resultsCleared');
  }

  async function handleCalculate(skipDataFetch = false) {
    if (!ticker || !strikePrice || !expiration) {
      error = 'Please fill in Ticker, Strike Price, and Expiration Date.';
      return;
    }
    isLoading = true;
    
    // Only clear results if we're doing a fresh calculation, not just updating increment
    if (!skipDataFetch) {
      clearResults();
    } else {
      error = ''; // Clear any existing errors
    }
    
    try {
      let finalStockPrice = stockPrice;
      let finalImpliedVolatility = impliedVolatility;
      
      // Only fetch market data if we don't already have the values
      if (!skipDataFetch || !stockPrice || !impliedVolatility) {
        const marketDataResponse = await axios.post(`${API_URL}/api/fetch-market-data`, { ticker });
        finalStockPrice = stockPrice || marketDataResponse.data.currentStockPrice;
        finalImpliedVolatility = impliedVolatility || marketDataResponse.data.impliedVolatility;
        stockPrice = finalStockPrice;
        impliedVolatility = finalImpliedVolatility;
      }

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

      const asOfTime = new Date(calculationResponse.data.calculationTime);
      if (calculationResponse.data.isMarketOpen) {
        infoMessage = `Real-time • ${asOfTime.toLocaleTimeString()}`;
      } else {
        infoMessage = `Closed • Last: ${asOfTime.toLocaleTimeString()}`;
      }

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
      error = 'Failed to calculate. Check ticker and try again.';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
  
  function reCalculate() {
    if (calculationResults && autoCalculateOnInput) {
      handleCalculate();
    }
  }

  function requestPricingMatrix() {
    dispatch('requestComponent', { type: 'PricingMatrix' });
  }

  function handleOptionTypeChange(newType) {
    optionType = newType;
    reCalculate();
  }

  function handleSliderChange(e) {
    const index = parseInt(e.target.value);
    sliderValue = index;
    priceIncrement = priceIncrementOptions[index].value;
    // Always recalculate if we have results, skip market data fetch since we just need new pricing
    if (calculationResults) {
      console.log('Recalculating with new price increment:', priceIncrement);
      handleCalculate(true); // Skip data fetch, just recalculate with new increment
    }
  }

  // --- Reactive Statements ---
  $: ticker = ticker.replace(/[^a-zA-Z]/g, '').toUpperCase();

  // Update slider value when priceIncrement changes
  $: sliderValue = priceIncrementOptions.findIndex(opt => opt.value === priceIncrement);

  // Auto-set price increment based on stock price (only when no results exist)
  $: if (stockPrice && !calculationResults) {
    const price = parseFloat(stockPrice);
    if (price >= 1 && price <= 10) {
      priceIncrement = '0.5';
      sliderValue = 0;
    } else if (price >= 11 && price <= 99) {
      priceIncrement = '1.0';
      sliderValue = 1;
    } else if (price >= 100 && price <= 199) {
      priceIncrement = '2.5';
      sliderValue = 2;
    } else if (price >= 200 && price <= 999) {
      priceIncrement = '5.0';
      sliderValue = 3;
    } else if (price >= 1000) {
      priceIncrement = '10.0';
      sliderValue = 4;
    }
  }
</script>

<div class="deltuh-calc-engine">
  <!-- Compact Header -->
  <div class="engine-header">
    <div class="header-left">
      <div class="title-row">
        <img src="/deltuh logo.svg" alt="Deltuh" class="deltuh-logo" />
        <h2 class="engine-title">Calculation Engine</h2>
      </div>
      {#if calculationResults}
        <div class="market-status" class:open={calculationResults.isMarketOpen}>
          <span class="status-dot"></span>
          <span class="status-text">{infoMessage}</span>
        </div>
      {/if}
    </div>
    <div class="header-controls">
      <label class="auto-calc-toggle">
        <input
          type="checkbox"
          bind:checked={autoCalculateOnInput}
          class="toggle-input"
        />
        <div class="toggle-track">
          <div class="toggle-thumb"></div>
        </div>
        <span class="toggle-label">Auto</span>
      </label>
    </div>
  </div>

  <!-- Main Input Grid - Compact Layout -->
  <div class="input-section">
    <div class="input-row primary-inputs">
      <div class="input-group ticker-group">
        <input 
          bind:value={ticker} 
          type="text" 
          placeholder="TICKER" 
          class="input-field ticker-input"
          id="ticker-input"
        />
        <label class="input-label" for="ticker-input">Symbol</label>
      </div>
      
      <div class="input-group strike-group">
        <input 
          bind:value={strikePrice} 
          type="number" 
          placeholder="0.00"
          class="input-field strike-input"
          id="strike-input"
        />
        <label class="input-label" for="strike-input">Strike</label>
      </div>
      
      <div class="input-group date-group">
        <input 
          bind:value={expiration} 
          type="date" 
          class="input-field date-input"
          id="expiration-input"
        />
        <label class="input-label" for="expiration-input">Expiry</label>
      </div>
    </div>

    <!-- Advanced Options - Collapsible -->
    <div class="advanced-section" class:expanded={showAdvanced}>
      <button 
        class="advanced-toggle"
        on:click={() => showAdvanced = !showAdvanced}
      >
        <span>Advanced</span>
        <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {#if showAdvanced}
        <div class="advanced-inputs">
          <div class="input-group">
            <input 
              bind:value={stockPrice} 
              type="number" 
              placeholder="Auto"
              class="input-field"
              id="stock-price-input"
            />
            <label class="input-label" for="stock-price-input">Stock Price</label>
          </div>
          
          <div class="input-group">
            <input 
              bind:value={impliedVolatility} 
              type="number" 
              placeholder="Auto"
              class="input-field"
              id="iv-input"
            />
            <label class="input-label" for="iv-input">IV %</label>
          </div>
        </div>
      {/if}
    </div>

    <!-- Controls Row -->
    <div class="controls-row">
      <div class="option-type-selector">
        <button 
          class="type-btn" 
          class:active={optionType === 'call'}
          on:click={() => handleOptionTypeChange('call')}
        >
          Calls
        </button>
        <button 
          class="type-btn" 
          class:active={optionType === 'put'}
          on:click={() => handleOptionTypeChange('put')}
        >
          Puts
        </button>
      </div>

      <div class="increment-selector">
        <label class="increment-label" for="increment-slider">
          <span>${priceIncrementOptions.find(opt => opt.value === priceIncrement)?.label || '1.00'}</span>
        </label>
        <input
          type="range"
          min="0"
          max={priceIncrementOptions.length - 1}
          step="1"
          bind:value={sliderValue}
          on:input={handleSliderChange}
          class="increment-slider"
          id="increment-slider"
        />
      </div>

      <button 
        on:click={handleCalculate} 
        disabled={isLoading} 
        class="calculate-btn"
        class:loading={isLoading}
      >
        {#if isLoading}
          <span class="loading-spinner"></span>
        {:else}
          Calculate
        {/if}
      </button>
    </div>
  </div>

  {#if error}
    <div class="error-message">
      <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      {error}
    </div>
  {/if}

  <!-- Compact Results Display -->
  {#if calculationResults}
    <div class="results-section">
      <div class="result-card">
        <div class="result-main">
          <div class="result-price">
            <span class="price-label">Current {optionType === 'call' ? 'Call' : 'Put'}</span>
            <span class="price-value">
              {optionType === 'call' ? calculationResults.callPriceRange : calculationResults.putPriceRange}
            </span>
          </div>
          
          <div class="result-meta">
            <div class="meta-item">
              <span class="meta-label">{ticker}</span>
              <span class="meta-value">${parseFloat(stockPrice).toFixed(2)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Strike</span>
              <span class="meta-value">${strikePrice}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">IV</span>
              <span class="meta-value">{parseFloat(impliedVolatility).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div class="result-actions">
          {#if !hasPricingMatrix}
            <button 
              on:click={requestPricingMatrix}
              class="matrix-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Matrix
            </button>
          {:else}
            <div class="matrix-status">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Matrix Open
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .deltuh-calc-engine {
    background: linear-gradient(135deg, rgba(31, 41, 55, 0.6) 0%, rgba(17, 24, 39, 0.8) 100%);
    border-radius: 16px;
    padding: 1.25rem;
    border: 1px solid rgba(167, 139, 250, 0.15);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    overflow: hidden;
    backdrop-filter: blur(10px);
  }

  /* Header Section */
  .engine-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(167, 139, 250, 0.1);
    flex-wrap: wrap;
    gap: 0.5rem;
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

  .engine-title {
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

  .header-controls {
    display: flex;
    align-items: center;
    margin-left: auto;
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

  /* Auto Calculate Toggle */
  .auto-calc-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .toggle-input {
    display: none;
  }

  .toggle-track {
    width: 36px;
    height: 20px;
    background: #374151;
    border-radius: 10px;
    position: relative;
    transition: all 0.3s;
  }

  .toggle-input:checked + .toggle-track {
    background: linear-gradient(135deg, #a78bfa, #c4b5fd);
  }

  .toggle-thumb {
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: transform 0.3s;
  }

  .toggle-input:checked + .toggle-track .toggle-thumb {
    transform: translateX(16px);
  }

  .toggle-label {
    font-size: 0.875rem;
    color: #94a3b8;
    font-weight: 500;
  }

  /* Input Section */
  .input-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .input-row {
    display: grid;
    gap: 0.75rem;
  }

  .primary-inputs {
    grid-template-columns: 1.5fr 1fr 1.25fr;
  }

  .input-group {
    position: relative;
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

  .ticker-input {
    text-transform: uppercase;
    letter-spacing: 0.05em;
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

  /* Enhanced date input fixes for mobile */
  .date-input {
    padding-right: 0.75rem;
    font-size: 0.875rem;
    min-height: 48px;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
  }

  /* Force date input to handle text properly on all browsers */
  input[type="date"]::-webkit-datetime-edit {
    padding-top: 0.5rem;
    padding-bottom: 0.25rem;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
  }

  input[type="date"]::-webkit-datetime-edit-fields-wrapper {
    padding: 0;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
  }

  input[type="date"]::-webkit-datetime-edit-text {
    padding: 0 0.2rem;
    line-height: 1;
  }

  input[type="date"]::-webkit-datetime-edit-month-field,
  input[type="date"]::-webkit-datetime-edit-day-field,
  input[type="date"]::-webkit-datetime-edit-year-field {
    padding: 0;
    line-height: 1;
  }

  /* Specific adjustments for date container */
  .date-group {
    min-width: 140px;
  }

  @media (max-width: 640px) {
    .date-input {
      font-size: 0.8rem;
      padding: 1rem 0.5rem 0.4rem;
      min-height: 56px;
      height: 56px;
      line-height: 1;
      display: flex;
      align-items: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    input[type="date"]::-webkit-datetime-edit {
      padding-top: 0;
      padding-bottom: 0;
      display: flex;
      align-items: center;
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      width: 100%;
    }

    input[type="date"]::-webkit-datetime-edit-fields-wrapper {
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      width: 100%;
    }

    input[type="date"]::-webkit-datetime-edit-text {
      line-height: 1;
      white-space: nowrap;
      font-size: inherit;
    }

    input[type="date"]::-webkit-datetime-edit-month-field,
    input[type="date"]::-webkit-datetime-edit-day-field,
    input[type="date"]::-webkit-datetime-edit-year-field {
      line-height: 1;
      white-space: nowrap;
      font-size: inherit;
    }
    
    .date-group {
      width: 100%;
    }
    
    .date-group .input-label {
      top: 4px;
      font-size: 0.55rem;
      opacity: 0.9;
      z-index: 1;
    }
    
    /* Ensure all input fields have consistent height on mobile */
    .input-field {
      min-height: 56px;
      height: 56px;
    }
    
    .ticker-input, .strike-input {
      padding: 1rem 0.5rem 0.5rem;
    }
  }

  /* Advanced Section */
  .advanced-section {
    border-radius: 8px;
    overflow: hidden;
  }

  .advanced-toggle {
    width: 100%;
    padding: 0.5rem;
    background: rgba(167, 139, 250, 0.05);
    border: 1px solid rgba(167, 139, 250, 0.1);
    border-radius: 8px;
    color: #c4b5fd;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s;
  }

  .advanced-toggle:hover {
    background: rgba(167, 139, 250, 0.1);
  }

  .toggle-icon {
    width: 16px;
    height: 16px;
    transition: transform 0.3s;
  }

  .advanced-section.expanded .toggle-icon {
    transform: rotate(180deg);
  }

  .advanced-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  /* Controls Row */
  .controls-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.75rem;
    align-items: center;
  }

  .option-type-selector {
    display: flex;
    background: rgba(17, 24, 39, 0.6);
    border-radius: 8px;
    padding: 2px;
    border: 1px solid rgba(167, 139, 250, 0.1);
  }

  .type-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.3s;
  }

  .type-btn.active {
    background: linear-gradient(135deg, #a78bfa, #c4b5fd);
    color: white;
  }

  .increment-selector {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .increment-label {
    font-size: 0.875rem;
    color: #94a3b8;
    font-weight: 600;
    min-width: 50px;
  }

  .increment-slider {
    flex: 1;
    height: 4px;
    background: rgba(167, 139, 250, 0.2);
    border-radius: 2px;
    outline: none;
    -webkit-appearance: none;
  }

  .increment-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: linear-gradient(135deg, #a78bfa, #c4b5fd);
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid #111827;
  }

  .increment-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: linear-gradient(135deg, #a78bfa, #c4b5fd);
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid #111827;
  }

  .calculate-btn {
    padding: 0.625rem 1.5rem;
    background: linear-gradient(135deg, #a78bfa, #c4b5fd);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 100px;
  }

  .calculate-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(167, 139, 250, 0.3);
  }

  .calculate-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Error Message */
  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    color: #f87171;
    font-size: 0.875rem;
  }

  .error-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  /* Results Section */
  .results-section {
    margin-top: auto;
  }

  .result-card {
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.08), rgba(196, 181, 253, 0.04));
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .result-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .result-price {
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

  .result-meta {
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

  .result-actions {
    display: flex;
    align-items: center;
  }

  .matrix-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: 8px;
    color: #22c55e;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .matrix-btn:hover {
    background: rgba(34, 197, 94, 0.2);
    transform: translateY(-1px);
  }

  .matrix-btn svg {
    width: 18px;
    height: 18px;
  }

  .matrix-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: rgba(34, 197, 94, 0.05);
    border: 1px solid rgba(34, 197, 94, 0.1);
    border-radius: 8px;
    color: #22c55e;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .matrix-status svg {
    width: 20px;
    height: 20px;
  }

  /* Mobile Responsive */
  @media (max-width: 640px) {
    .deltuh-calc-engine {
      padding: 1rem;
      gap: 1rem;
    }

    .engine-header {
      gap: 0.75rem;
    }

    .header-left {
      width: 100%;
    }

    .market-status {
      margin-top: 0.25rem;
    }

    .engine-title {
      font-size: 1.125rem;
    }

    .primary-inputs {
      grid-template-columns: 1fr;
    }

    .controls-row {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .option-type-selector {
      justify-content: stretch;
    }

    .type-btn {
      flex: 1;
    }

    .increment-selector {
      display: grid;
      grid-template-columns: auto 1fr;
      width: 100%;
    }

    .result-card {
      flex-direction: column;
      align-items: stretch;
    }

    .result-meta {
      justify-content: space-between;
    }

    .matrix-btn,
    .matrix-status {
      width: 100%;
      justify-content: center;
    }
  }
</style>