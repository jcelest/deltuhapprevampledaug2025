<script>
  import { createEventDispatcher, onMount } from 'svelte';
  
  const dispatch = createEventDispatcher();
  export const calculationResults = null; // Mark as const to indicate external reference only
  export let inputData = {};
  export const config = {}; // Mark as const to indicate external reference only

  let marketData = {
    price: null,
    change: null,
    changePercent: null,
    volume: null,
    high: null,
    low: null,
    open: null,
    marketCap: null,
    lastUpdate: null
  };

  let isLoading = false;
  let error = null;

  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

  async function fetchMarketData() {
    if (!inputData.ticker) return;

    isLoading = true;
    error = null;

    try {
      const response = await fetch(`${API_URL}/api/market-data/${inputData.ticker}`);
      if (!response.ok) throw new Error('Failed to fetch market data');
      
      const data = await response.json();
      marketData = {
        price: data.currentPrice || inputData.stockPrice,
        change: data.change || 0,
        changePercent: data.changePercent || 0,
        volume: data.volume,
        high: data.dayHigh,
        low: data.dayLow,
        open: data.dayOpen,
        marketCap: data.marketCap,
        lastUpdate: new Date().toLocaleTimeString()
      };
    } catch (err) {
      console.error('Market data fetch error:', err);
      error = 'Unable to fetch market data';
      // Use fallback data from calculation results
      if (inputData.stockPrice) {
        marketData.price = inputData.stockPrice;
        marketData.lastUpdate = new Date().toLocaleTimeString();
      }
    } finally {
      isLoading = false;
    }
  }

  function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return 'N/A';
    if (typeof num !== 'number') return num;
    
    if (num >= 1e9) {
      return (num / 1e9).toFixed(1) + 'B';
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M';
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K';
    }
    return num.toFixed(decimals);
  }

  function formatCurrency(num, decimals = 2) {
    if (num === null || num === undefined) return 'N/A';
    return '$' + formatNumber(num, decimals);
  }

  $: if (inputData.ticker && inputData.ticker !== '') {
    fetchMarketData();
  }

  // Auto-refresh every 30 seconds
  onMount(() => {
    const interval = setInterval(() => {
      if (inputData.ticker) {
        fetchMarketData();
      }
    }, 30000);

    return () => clearInterval(interval);
  });
</script>

<div class="deltuh-market-data">
  <div class="market-header">
    <div class="header-left">
      <div class="title-row">
        <img src="/deltuh logo.svg" alt="Deltuh" class="deltuh-logo" />
        <h3 class="market-title">Market Data</h3>
      </div>
      {#if marketData.lastUpdate}
        <div class="update-status">
          <span class="status-dot"></span>
          <span class="status-text">Updated: {marketData.lastUpdate}</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="market-content">
    {#if isLoading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <span class="loading-text">Loading market data...</span>
      </div>
    {:else if inputData.ticker}
      <div class="data-sections">
        <!-- Current Price Section -->
        <div class="price-card">
          <div class="price-main">
            <div class="ticker-info">
              <h4 class="ticker-symbol">{inputData.ticker}</h4>
              <span class="price-primary">{formatCurrency(marketData.price)}</span>
            </div>
            {#if marketData.change !== null}
              <div class="price-changes">
                <span class="change-value" class:positive={marketData.change >= 0} class:negative={marketData.change < 0}>
                  {marketData.change >= 0 ? '+' : ''}{formatCurrency(marketData.change)}
                </span>
                <span class="change-percent" class:positive={marketData.changePercent >= 0} class:negative={marketData.changePercent < 0}>
                  {marketData.changePercent >= 0 ? '+' : ''}{marketData.changePercent?.toFixed(2)}%
                </span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Trading Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Open</span>
            <span class="stat-value">{formatCurrency(marketData.open)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Volume</span>
            <span class="stat-value">{formatNumber(marketData.volume, 0)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Day High</span>
            <span class="stat-value">{formatCurrency(marketData.high)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Day Low</span>
            <span class="stat-value">{formatCurrency(marketData.low)}</span>
          </div>
        </div>

        {#if marketData.marketCap}
          <div class="market-cap-card">
            <span class="stat-label">Market Cap</span>
            <span class="stat-value">{formatCurrency(marketData.marketCap, 0)}</span>
          </div>
        {/if}

        {#if error}
          <div class="error-notice">
            <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <div class="error-content">
              <span class="error-title">Limited Data</span>
              <span class="error-message">{error}</span>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <p class="empty-text">Enter a ticker to see market data</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .deltuh-market-data {
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
  .market-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.25rem 1.25rem 0.75rem;
    border-bottom: 1px solid rgba(167, 139, 250, 0.1);
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

  .market-title {
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(135deg, #fff, #c4b5fd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }

  .update-status {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    background: rgba(167, 139, 250, 0.1);
    border-radius: 20px;
    border: 1px solid rgba(167, 139, 250, 0.2);
    font-size: 0.75rem;
    width: fit-content;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #a78bfa;
    animation: pulse 2s infinite;
  }

  .status-text {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Main Content */
  .market-content {
    flex: 1;
    overflow: hidden;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
  }

  /* Loading State */
  .loading-state {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(167, 139, 250, 0.2);
    border-top-color: #a78bfa;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    font-size: 0.875rem;
    color: #94a3b8;
  }

  /* Data Sections */
  .data-sections {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
    overflow-y: auto;
  }

  /* Custom scrollbar */
  .data-sections::-webkit-scrollbar {
    width: 6px;
  }

  .data-sections::-webkit-scrollbar-track {
    background: rgba(17, 24, 39, 0.3);
    border-radius: 3px;
  }

  .data-sections::-webkit-scrollbar-thumb {
    background: rgba(167, 139, 250, 0.3);
    border-radius: 3px;
  }

  .data-sections::-webkit-scrollbar-thumb:hover {
    background: rgba(167, 139, 250, 0.5);
  }

  /* Price Card */
  .price-card {
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.08), rgba(196, 181, 253, 0.04));
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 12px;
    padding: 1.25rem;
  }

  .price-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .ticker-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .ticker-symbol {
    font-size: 1.125rem;
    font-weight: 700;
    color: white;
    margin: 0;
  }

  .price-primary {
    font-size: 1.875rem;
    font-weight: 700;
    color: white;
    line-height: 1;
  }

  .price-changes {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    align-items: flex-end;
  }

  .change-value,
  .change-percent {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .change-value.positive,
  .change-percent.positive {
    color: #4ade80;
  }

  .change-value.negative,
  .change-percent.negative {
    color: #f87171;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .stat-card,
  .market-cap-card {
    background: rgba(17, 24, 39, 0.6);
    border: 1px solid rgba(167, 139, 250, 0.1);
    border-radius: 8px;
    padding: 0.875rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .market-cap-card {
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(196, 181, 253, 0.02));
    border-color: rgba(167, 139, 250, 0.15);
  }

  .stat-label {
    font-size: 0.625rem;
    color: #a78bfa;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .stat-value {
    font-size: 0.875rem;
    color: white;
    font-weight: 600;
  }

  /* Error Notice */
  .error-notice {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.875rem;
    background: rgba(251, 191, 36, 0.1);
    border: 1px solid rgba(251, 191, 36, 0.2);
    border-radius: 8px;
  }

  .error-icon {
    width: 20px;
    height: 20px;
    color: #fbbf24;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .error-content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .error-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #fbbf24;
  }

  .error-message {
    font-size: 0.8125rem;
    color: #fde68a;
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
    .market-header {
      padding: 1rem;
    }

    .market-content {
      padding: 0 1rem 1rem;
    }

    .price-main {
      flex-direction: column;
      text-align: center;
      align-items: center;
    }

    .price-changes {
      align-items: center;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .stat-card,
    .market-cap-card {
      padding: 0.75rem;
    }
  }

  @media (max-width: 640px) {
    .deltuh-market-data {
      border-radius: 12px;
    }

    .market-title {
      font-size: 1.125rem;
    }

    .deltuh-logo {
      height: 20px;
    }

    .price-card {
      padding: 1rem;
    }

    .ticker-symbol {
      font-size: 1rem;
    }

    .price-primary {
      font-size: 1.5rem;
    }

    .change-value,
    .change-percent {
      font-size: 0.8125rem;
    }

    .stat-value {
      font-size: 0.8125rem;
    }
  }
</style>