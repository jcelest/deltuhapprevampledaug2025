<script>
  import { createEventDispatcher, onMount } from 'svelte';
  
  const dispatch = createEventDispatcher();
  export let calculationResults = null;
  export let inputData = {};
  export const config = {};

  let ivRankData = {
    currentIV: null,
    ivRank: null,
    ivPercentile: null,
    meanIV: null,
    highIV: null,
    lowIV: null,
    lastUpdate: null,
    isLoading: false,
    error: null
  };

  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

  async function fetchIVRankData() {
    if (!inputData.ticker) return;

    ivRankData.isLoading = true;
    ivRankData.error = null;

    try {
      const response = await fetch(`${API_URL}/api/iv-rank/${inputData.ticker}`);
      if (!response.ok) throw new Error('Failed to fetch IV rank data');
      
      const data = await response.json();
      ivRankData = {
        currentIV: data.currentIV || calculationResults?.impliedVolatility || inputData.impliedVolatility,
        ivRank: data.ivRank || 50, // Mock data fallback
        ivPercentile: data.ivPercentile || 50,
        meanIV: data.meanIV || (data.currentIV * 0.85),
        highIV: data.highIV || (data.currentIV * 1.8),
        lowIV: data.lowIV || (data.currentIV * 0.4),
        lastUpdate: new Date().toLocaleTimeString(),
        isLoading: false,
        error: null
      };
    } catch (err) {
      console.error('IV rank fetch error:', err);
      
      // Use fallback mock data based on available information
      const currentIV = calculationResults?.impliedVolatility || 
                       parseFloat(inputData.impliedVolatility) || 25;
      
      ivRankData = {
        currentIV: currentIV,
        ivRank: Math.floor(Math.random() * 100), // Mock rank
        ivPercentile: Math.floor(Math.random() * 100),
        meanIV: currentIV * 0.85,
        highIV: currentIV * 1.8,
        lowIV: currentIV * 0.4,
        lastUpdate: new Date().toLocaleTimeString(),
        isLoading: false,
        error: 'Using simulated data'
      };
    }
  }

  function getRankColor(rank) {
    if (rank >= 80) return '#ef4444'; // High - Red
    if (rank >= 70) return '#f97316'; // Medium-High - Orange  
    if (rank >= 30) return '#eab308'; // Medium - Yellow
    if (rank >= 20) return '#22c55e'; // Low-Medium - Green
    return '#10b981'; // Very Low - Emerald
  }

  function getRankLabel(rank) {
    if (rank >= 80) return 'Very High';
    if (rank >= 70) return 'High';
    if (rank >= 30) return 'Medium';
    if (rank >= 20) return 'Low';
    return 'Very Low';
  }

  function getRankDescription(rank) {
    if (rank >= 80) return 'Options are very expensive - consider selling strategies';
    if (rank >= 70) return 'Options are expensive - good for selling premium';
    if (rank >= 30) return 'Options are moderately priced';
    if (rank >= 20) return 'Options are cheap - good for buying';
    return 'Options are very cheap - excellent for buying';
  }

  // Calculate the gauge arc path
  function getGaugeArcPath(radius, startAngle, endAngle, rank) {
    const centerX = 120;
    const centerY = 120;
    const actualEndAngle = startAngle + ((endAngle - startAngle) * rank / 100);
    
    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(actualEndAngle);
    const endY = centerY + radius * Math.sin(actualEndAngle);
    
    const largeArc = (actualEndAngle - startAngle) > Math.PI ? 1 : 0;
    
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;
  }

  // Watch for changes in ticker or calculation results
  $: if (inputData.ticker) {
    fetchIVRankData();
  }

  // Auto-refresh every 60 seconds
  onMount(() => {
    const interval = setInterval(() => {
      if (inputData.ticker) {
        fetchIVRankData();
      }
    }, 60000);

    return () => clearInterval(interval);
  });
</script>

<div class="deltuh-iv-rank">
  <div class="rank-header">
    <div class="header-left">
      <div class="title-row">
        <img src="/deltuh logo.svg" alt="Deltuh" class="deltuh-logo" />
        <h3 class="rank-title">IV Rank</h3>
      </div>
      {#if ivRankData.lastUpdate}
        <div class="update-status">
          <span class="status-dot"></span>
          <span class="status-text">Updated: {ivRankData.lastUpdate}</span>
        </div>
      {/if}
    </div>
    {#if inputData.ticker}
      <div class="ticker-badge">
        <span class="ticker-text">{inputData.ticker}</span>
      </div>
    {/if}
  </div>

  <div class="rank-content">
    {#if ivRankData.isLoading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <span class="loading-text">Loading IV rank...</span>
      </div>
    {:else if inputData.ticker && ivRankData.currentIV}
      <div class="gauge-section">
        <!-- Main IV Rank Gauge -->
        <div class="gauge-container">
          <svg viewBox="0 0 240 180" class="gauge-svg">
            <!-- Background arc -->
            <path
              d="M 40 120 A 80 80 0 0 1 200 120"
              fill="none"
              stroke="rgba(55, 65, 81, 0.3)"
              stroke-width="12"
              stroke-linecap="round"
            />
            
            <!-- Colored segments -->
            <path
              d="M 40 120 A 80 80 0 0 1 72 68"
              fill="none"
              stroke="#10b981"
              stroke-width="12"
              stroke-linecap="round"
              opacity="0.7"
            />
            <path
              d="M 72 68 A 80 80 0 0 1 120 48"
              fill="none"
              stroke="#22c55e"
              stroke-width="12" 
              stroke-linecap="round"
              opacity="0.7"
            />
            <path
              d="M 120 48 A 80 80 0 0 1 168 68"
              fill="none"
              stroke="#eab308"
              stroke-width="12"
              stroke-linecap="round"
              opacity="0.7"
            />
            <path
              d="M 168 68 A 80 80 0 0 1 200 120"
              fill="none"
              stroke="#ef4444"
              stroke-width="12"
              stroke-linecap="round"
              opacity="0.7"
            />
            
            <!-- Current rank indicator -->
            <g transform="translate(120, 120)">
              <g transform="rotate({-90 + (180 * ivRankData.ivRank / 100)})">
                <line
                  x1="0"
                  y1="0" 
                  x2="0"
                  y2="-75"
                  stroke={getRankColor(ivRankData.ivRank)}
                  stroke-width="4"
                  stroke-linecap="round"
                />
                <circle
                  cx="0"
                  cy="-75"
                  r="6"
                  fill={getRankColor(ivRankData.ivRank)}
                />
              </g>
              <circle
                cx="0"
                cy="0"
                r="8"
                fill="rgba(31, 41, 55, 0.9)"
                stroke={getRankColor(ivRankData.ivRank)}
                stroke-width="2"
              />
            </g>
            
            <!-- Scale markers -->
            {#each [0, 20, 50, 80, 100] as mark}
              <g transform="translate(120, 120)">
                <g transform="rotate({-90 + (180 * mark / 100)})">
                  <text
                    x="0"
                    y="-95"
                    text-anchor="middle"
                    fill="#6b7280"
                    font-size="10"
                    font-weight="500"
                  >
                    {mark}
                  </text>
                </g>
              </g>
            {/each}
          </svg>
          
          <div class="gauge-center">
            <div class="rank-value" style="color: {getRankColor(ivRankData.ivRank)}">
              {ivRankData.ivRank}
            </div>
            <div class="rank-label-text">{getRankLabel(ivRankData.ivRank)}</div>
          </div>
        </div>

        <!-- Current IV Display -->
        <div class="iv-display">
          <div class="iv-current">
            <span class="iv-label">Current IV</span>
            <span class="iv-value">{ivRankData.currentIV?.toFixed(1)}%</span>
          </div>
          <div class="iv-context">
            <span class="iv-description">
              {getRankDescription(ivRankData.ivRank)}
            </span>
          </div>
        </div>
      </div>

      <!-- IV Statistics -->
      <div class="iv-stats">
        <div class="stat-item">
          <span class="stat-label">52W High</span>
          <span class="stat-value">{ivRankData.highIV?.toFixed(1)}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">52W Average</span>
          <span class="stat-value">{ivRankData.meanIV?.toFixed(1)}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">52W Low</span>
          <span class="stat-value">{ivRankData.lowIV?.toFixed(1)}%</span>
        </div>
      </div>

      {#if ivRankData.error}
        <div class="error-notice">
          <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div class="error-content">
            <span class="error-title">Simulated Data</span>
            <span class="error-message">{ivRankData.error}</span>
          </div>
        </div>
      {/if}
    {:else}
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p class="empty-text">Calculate options to see IV rank</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .deltuh-iv-rank {
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
  .rank-header {
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

  .rank-title {
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
  .rank-content {
    flex: 1;
    overflow: hidden;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
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

  /* Gauge Section */
  .gauge-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
  }

  .gauge-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .gauge-svg {
    width: 100%;
    max-width: 240px;
    height: auto;
  }

  .gauge-center {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    top: 60%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .rank-value {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
    font-family: 'Courier New', monospace;
  }

  .rank-label-text {
    font-size: 0.875rem;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.25rem;
  }

  /* IV Display */
  .iv-display {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }

  .iv-current {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .iv-label {
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .iv-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    font-family: 'Courier New', monospace;
  }

  .iv-context {
    padding: 0.75rem;
    background: rgba(17, 24, 39, 0.6);
    border-radius: 8px;
    border: 1px solid rgba(167, 139, 250, 0.1);
  }

  .iv-description {
    font-size: 0.875rem;
    color: #c4b5fd;
    line-height: 1.4;
  }

  /* IV Statistics */
  .iv-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .stat-item {
    background: rgba(17, 24, 39, 0.6);
    border: 1px solid rgba(167, 139, 250, 0.1);
    border-radius: 8px;
    padding: 0.875rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    text-align: center;
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
    font-family: 'Courier New', monospace;
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
    .rank-header {
      padding: 1rem;
      flex-direction: column;
      align-items: stretch;
    }

    .rank-content {
      padding: 0 1rem 1rem;
    }

    .gauge-center {
      top: 65%;
    }

    .rank-value {
      font-size: 2rem;
    }

    .iv-stats {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .stat-item {
      padding: 0.75rem;
    }
  }

  @media (max-width: 640px) {
    .deltuh-iv-rank {
      border-radius: 12px;
    }

    .rank-title {
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

    .rank-value {
      font-size: 1.75rem;
    }

    .iv-value {
      font-size: 1.25rem;
    }

    .iv-description {
      font-size: 0.8125rem;
    }
  }
</style>