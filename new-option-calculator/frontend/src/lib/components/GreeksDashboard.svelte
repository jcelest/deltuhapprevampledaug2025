<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  export let calculationResults = null;
  export let inputData = {};
  export const config = {}; // Mark as const to indicate external reference only

  // Mock Greeks data - in real implementation, these would come from your backend
  $: greeksData = calculationResults ? {
    delta: calculationResults.greeks?.delta || (inputData.optionType === 'call' ? 0.6523 : -0.3477),
    gamma: calculationResults.greeks?.gamma || 0.0234,
    theta: calculationResults.greeks?.theta || -0.1245,
    vega: calculationResults.greeks?.vega || 0.2134,
    rho: calculationResults.greeks?.rho || 0.0567
  } : null;

  function getGreekColor(greek, value) {
    switch(greek) {
      case 'delta':
        return value > 0 ? 'positive' : 'negative';
      case 'gamma':
        return 'neutral-blue';
      case 'theta':
        return value < 0 ? 'negative' : 'positive';
      case 'vega':
        return 'neutral-purple';
      case 'rho':
        return value > 0 ? 'positive' : 'negative';
      default:
        return 'neutral';
    }
  }

  function getGreekSymbol(greek) {
    switch(greek) {
      case 'delta': return 'Δ';
      case 'gamma': return 'Γ';
      case 'theta': return 'Θ';
      case 'vega': return 'ν';
      case 'rho': return 'ρ';
      default: return '';
    }
  }

  function getGreekDescription(greek) {
    switch(greek) {
      case 'delta':
        return 'Price sensitivity to underlying';
      case 'gamma':
        return 'Rate of change of delta';
      case 'theta':
        return 'Time decay per day';
      case 'vega':
        return 'Volatility sensitivity';
      case 'rho':
        return 'Interest rate sensitivity';
      default:
        return '';
    }
  }

  function formatGreekValue(greek, value) {
    if (typeof value !== 'number') return value;
    
    switch(greek) {
      case 'delta':
      case 'gamma':
      case 'rho':
        return Math.abs(value) < 1 ? value.toFixed(4) : value.toFixed(2);
      case 'theta':
        return value.toFixed(4);
      case 'vega':
        return value.toFixed(3);
      default:
        return value.toFixed(4);
    }
  }
</script>

<div class="deltuh-greeks-dashboard">
  <div class="greeks-header">
    <div class="header-left">
      <div class="title-row">
        <img src="/deltuh logo.svg" alt="Deltuh" class="deltuh-logo" />
        <h3 class="greeks-title">Greeks Dashboard</h3>
      </div>
    </div>
    {#if inputData.ticker}
      <div class="ticker-badge">
        <span class="ticker-text">{inputData.ticker}</span>
      </div>
    {/if}
  </div>

  <div class="greeks-content">
    {#if greeksData}
      <div class="greeks-grid">
        {#each Object.entries(greeksData) as [greek, value]}
          <div class="greek-card">
            <div class="greek-header">
              <div class="greek-info">
                <span class="greek-name">{greek}</span>
                <span class="greek-symbol">{getGreekSymbol(greek)}</span>
              </div>
            </div>
            <div class="greek-value {getGreekColor(greek, value)}">
              {formatGreekValue(greek, value)}
            </div>
            <div class="greek-description">
              {getGreekDescription(greek)}
            </div>
          </div>
        {/each}
      </div>

      {#if inputData.optionType}
        <div class="analysis-card">
          <h4 class="analysis-title">Option Analysis</h4>
          <div class="analysis-content">
            <div class="analysis-point">
              <span class="analysis-bullet">•</span>
              <span class="analysis-text">
                Delta indicates the option will move ~${Math.abs(greeksData.delta).toFixed(2)} for every $1 move in {inputData.ticker || 'the underlying'}
              </span>
            </div>
            <div class="analysis-point">
              <span class="analysis-bullet">•</span>
              <span class="analysis-text">
                Theta shows ${Math.abs(greeksData.theta).toFixed(2)} daily time decay
              </span>
            </div>
            <div class="analysis-point">
              <span class="analysis-bullet">•</span>
              <span class="analysis-text">
                Vega sensitivity: ${greeksData.vega.toFixed(2)} per 1% volatility change
              </span>
            </div>
          </div>
        </div>
      {/if}
    {:else}
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p class="empty-text">Calculate options to see Greeks</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .deltuh-greeks-dashboard {
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
  .greeks-header {
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

  .greeks-title {
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
  .greeks-content {
    flex: 1;
    overflow: hidden;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* Greeks Grid */
  .greeks-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.875rem;
    flex: 1;
  }

  .greek-card {
    background: rgba(17, 24, 39, 0.6);
    border: 1px solid rgba(167, 139, 250, 0.1);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition: all 0.3s;
  }

  .greek-card:hover {
    border-color: rgba(167, 139, 250, 0.2);
    background: rgba(17, 24, 39, 0.8);
  }

  .greek-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .greek-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .greek-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .greek-symbol {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
  }

  .greek-value {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
    font-family: 'Courier New', monospace;
  }

  .greek-value.positive {
    color: #4ade80;
  }

  .greek-value.negative {
    color: #f87171;
  }

  .greek-value.neutral {
    color: #94a3b8;
  }

  .greek-value.neutral-blue {
    color: #60a5fa;
  }

  .greek-value.neutral-purple {
    color: #c084fc;
  }

  .greek-description {
    font-size: 0.75rem;
    color: #64748b;
    line-height: 1.3;
  }

  /* Analysis Card */
  .analysis-card {
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(196, 181, 253, 0.02));
    border: 1px solid rgba(167, 139, 250, 0.15);
    border-radius: 12px;
    padding: 1rem;
    flex-shrink: 0;
  }

  .analysis-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #c4b5fd;
    margin: 0 0 0.75rem 0;
  }

  .analysis-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .analysis-point {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .analysis-bullet {
    color: #a78bfa;
    font-weight: bold;
    font-size: 0.875rem;
    line-height: 1.2;
    margin-top: 0.1rem;
  }

  .analysis-text {
    font-size: 0.75rem;
    color: #94a3b8;
    line-height: 1.4;
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
    .greeks-header {
      padding: 1rem;
      flex-direction: column;
      align-items: stretch;
    }

    .greeks-content {
      padding: 0 1rem 1rem;
    }

    .greeks-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .greek-card {
      padding: 0.875rem;
    }

    .greek-value {
      font-size: 1.375rem;
    }

    .analysis-card {
      padding: 0.875rem;
    }
  }

  @media (max-width: 640px) {
    .deltuh-greeks-dashboard {
      border-radius: 12px;
    }

    .greeks-title {
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

    .greek-value {
      font-size: 1.25rem;
    }

    .greek-name {
      font-size: 0.8125rem;
    }

    .greek-description,
    .analysis-text {
      font-size: 0.6875rem;
    }

    .analysis-title {
      font-size: 0.8125rem;
    }
  }

  /* Tablet Portrait and Small Desktop */
  @media (min-width: 769px) and (max-width: 1024px) {
    .greeks-grid {
      gap: 1rem;
    }

    .greek-card {
      padding: 1.125rem;
    }

    .greek-value {
      font-size: 1.375rem;
    }
  }

  /* Large screens - 5 column layout if needed */
  @media (min-width: 1400px) {
    .greeks-grid {
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
    }

    .greek-card {
      min-height: 140px;
    }
  }
</style>