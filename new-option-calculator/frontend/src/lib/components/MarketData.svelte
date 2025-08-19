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

<div class="bg-transparent p-6 h-full flex flex-col">
  <div class="flex items-center justify-between mb-6 flex-shrink-0">
    <h2 class="text-xl font-bold text-white">Market Data</h2>
    {#if marketData.lastUpdate}
      <span class="text-xs text-gray-400">
        Updated: {marketData.lastUpdate}
      </span>
    {/if}
  </div>

  <div class="flex-1 overflow-hidden">
    {#if isLoading}
      <div class="h-full flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    {:else if inputData.ticker}
      <div class="space-y-4 h-full overflow-y-auto">
        <!-- Current Price -->
        <div class="bg-gray-700/80 p-4 rounded-lg border border-gray-600/50 backdrop-blur-sm flex-shrink-0">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-white">{inputData.ticker}</h3>
              <p class="text-2xl font-bold text-white">
                {formatCurrency(marketData.price)}
              </p>
            </div>
            {#if marketData.change !== null}
              <div class="text-right">
                <p class="text-sm {marketData.change >= 0 ? 'text-green-400' : 'text-red-400'}">
                  {marketData.change >= 0 ? '+' : ''}{formatCurrency(marketData.change)}
                </p>
                <p class="text-sm {marketData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}">
                  {marketData.changePercent >= 0 ? '+' : ''}{marketData.changePercent?.toFixed(2)}%
                </p>
              </div>
            {/if}
          </div>
        </div>

        <!-- Trading Stats -->
        <div class="grid grid-cols-2 gap-3 flex-shrink-0">
          <div class="bg-gray-700/80 p-3 rounded-lg border border-gray-600/50 backdrop-blur-sm">
            <p class="text-xs text-gray-400 uppercase tracking-wide">Open</p>
            <p class="text-sm font-semibold text-white">{formatCurrency(marketData.open)}</p>
          </div>
          <div class="bg-gray-700/80 p-3 rounded-lg border border-gray-600/50 backdrop-blur-sm">
            <p class="text-xs text-gray-400 uppercase tracking-wide">Volume</p>
            <p class="text-sm font-semibold text-white">{formatNumber(marketData.volume, 0)}</p>
          </div>
          <div class="bg-gray-700/80 p-3 rounded-lg border border-gray-600/50 backdrop-blur-sm">
            <p class="text-xs text-gray-400 uppercase tracking-wide">Day High</p>
            <p class="text-sm font-semibold text-white">{formatCurrency(marketData.high)}</p>
          </div>
          <div class="bg-gray-700/80 p-3 rounded-lg border border-gray-600/50 backdrop-blur-sm">
            <p class="text-xs text-gray-400 uppercase tracking-wide">Day Low</p>
            <p class="text-sm font-semibold text-white">{formatCurrency(marketData.low)}</p>
          </div>
        </div>

        {#if marketData.marketCap}
          <div class="bg-gray-700/80 p-3 rounded-lg border border-gray-600/50 backdrop-blur-sm flex-shrink-0">
            <p class="text-xs text-gray-400 uppercase tracking-wide">Market Cap</p>
            <p class="text-sm font-semibold text-white">{formatCurrency(marketData.marketCap, 0)}</p>
          </div>
        {/if}

        {#if error}
          <div class="bg-yellow-900/30 border border-yellow-700 text-yellow-300 p-3 rounded-lg text-sm flex-shrink-0">
            <p class="font-medium">Limited Data</p>
            <p>{error}</p>
          </div>
        {/if}
      </div>
    {:else}
      <div class="h-full flex items-center justify-center text-gray-400">
        <div class="text-center">
          <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <p>Enter a ticker to see market data</p>
        </div>
      </div>
    {/if}
  </div>
</div>