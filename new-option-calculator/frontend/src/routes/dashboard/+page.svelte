<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authToken, user } from '../../stores/authStore.js';
  import axios from 'axios';

  const API_URL = import.meta.env.VITE_API_URL || 'https://deltuhapprevampledaug2025.onrender.com';
  
  let savedTerminals = [];
  let isLoadingTerminals = true;
  let deletingTerminalId = null;

  // This is a simple check to protect the route.
  // If there's no auth token when the component mounts, redirect to login.
  onMount(async () => {
    const token = $authToken;
    if (!token) {
      goto('/login');
      return;
    }
    // In a real app, you would also use the token to fetch user details
    // and populate the 'user' store here.
    // For now, we'll just simulate it.
    user.set({ email: 'user@example.com' }); 
    
    // Fetch saved terminals
    await fetchSavedTerminals();
  });

  async function fetchSavedTerminals() {
    try {
      isLoadingTerminals = true;
      const token = $authToken;
      
      const response = await axios.get(`${API_URL}/api/terminals`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      savedTerminals = response.data;
    } catch (error) {
      console.error('Error fetching terminals:', error);
      savedTerminals = [];
    } finally {
      isLoadingTerminals = false;
    }
  }

  function loadTerminal(terminalId) {
    goto(`/terminal?id=${terminalId}`);
  }

  async function deleteTerminal(terminalId, event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this terminal? This action cannot be undone.')) {
      return;
    }
    
    try {
      deletingTerminalId = terminalId;
      const token = $authToken;
      
      await axios.delete(`${API_URL}/api/terminals/${terminalId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Remove from list
      savedTerminals = savedTerminals.filter(t => t._id !== terminalId);
    } catch (error) {
      console.error('Error deleting terminal:', error);
      alert('Failed to delete terminal. Please try again.');
    } finally {
      deletingTerminalId = null;
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  function getTerminalPreview(terminal) {
    if (terminal.ticker && terminal.optionType) {
      return `${terminal.ticker} - ${terminal.optionType.toUpperCase()}`;
    }
    if (terminal.ticker) {
      return terminal.ticker;
    }
    return `${terminal.layout?.length || 0} component${terminal.layout?.length !== 1 ? 's' : ''}`;
  }
</script>

{#if $user}
<div class="dashboard-container">
  <!-- Main Welcome Header - Compact on Mobile -->
  <div class="welcome-header">
    <h1 class="welcome-title">Welcome to your Dashboard</h1>
    <p class="welcome-subtitle">Here's your command center.</p>
  </div>

  <!-- Grid for Dashboard Cards/Widgets -->
  <div class="dashboard-grid">
    
    <!-- Main Card: Launch Terminal with Deltuh Branding -->
    <a href="/terminal" class="terminal-card group">
      <div class="terminal-card-bg"></div>
      <div class="terminal-card-content">
        <div class="terminal-header">
          <div class="terminal-controls">
            <div class="terminal-dot red"></div>
            <div class="terminal-dot yellow"></div>
            <div class="terminal-dot green"></div>
          </div>
          <div class="terminal-title">deltuh.terminal</div>
        </div>
        
        <div class="terminal-body">
          <div class="terminal-brand">
            <img src="/deltuh logo.svg" alt="Deltuh" class="deltuh-logo" />
            <div class="brand-text">
              <h3 class="terminal-main-title">Option Terminal</h3>
              <div class="terminal-cursor-line">
                <span class="terminal-prompt">$</span>
                <span class="terminal-command">launch --advanced-analytics</span>
                <span class="terminal-cursor"></span>
              </div>
            </div>
          </div>
          
          <div class="terminal-description">
            <p class="terminal-text">
              > Real-time option pricing with advanced Greeks analysis
            </p>
            <p class="terminal-text">
              > Interactive pricing matrix and volatility modeling  
            </p>
            <p class="terminal-text">
              > Professional-grade risk management tools
            </p>
          </div>
          
          <div class="terminal-launch">
            <div class="launch-indicator">
              <span class="status-dot"></span>
              <span class="launch-text">Ready to launch</span>
            </div>
            <span class="launch-arrow">→</span>
          </div>
        </div>
      </div>
    </a>

    <!-- Sidebar Cards Container -->
    <div class="sidebar-cards">
        <!-- Card 2: Subscription Status -->
        <a href="/subscription" class="sidebar-card group">
           <div class="card-content">
               <div class="card-header">
                   <div class="card-icon">
                       <!-- SVG Icon for Subscription -->
                       <svg xmlns="http://www.w3.org/2000/svg" class="icon subscription-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                           <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                   </div>
                   <h3 class="card-title">Subscription</h3>
               </div>
               <p class="card-description">
                 Your current plan: <span class="plan-status">Premium</span>
               </p>
           </div>
           <span class="card-arrow">
               Upgrade Plan &rarr;
           </span>
        </a>

        <!-- Card 3: Profile Settings -->
         <a href="/settings" class="sidebar-card group">
            <div class="card-content">
                <div class="card-header">
                    <div class="card-icon">
                        <!-- SVG Icon for Profile -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon profile-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h3 class="card-title">Profile</h3>
                </div>
                <p class="card-description">
                  Update your email or change your password.
                </p>
            </div>
            <span class="card-arrow">
                Go to Settings &rarr;
            </span>
         </a>
    </div>
  </div>

  <!-- Saved Terminals Section - Compact -->
  <div class="saved-calculations">
    <div class="saved-header">
        <div class="saved-icon">
            <!-- SVG Icon for Saved -->
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
        </div>
        <h3 class="saved-title">Saved Terminals</h3>
    </div>
    
    <!-- Loading State -->
    {#if isLoadingTerminals}
      <div class="loading-state">
        <svg class="loading-spinner" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="loading-text">Loading your terminals...</p>
      </div>
    {:else if savedTerminals.length > 0}
      <!-- Saved terminals grid -->
      <div class="saved-grid">
        {#each savedTerminals as terminal (terminal._id)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div 
            class="saved-item group"
            on:click={() => loadTerminal(terminal._id)}
          >
            <div class="saved-content">
              <p class="saved-name">{terminal.name}</p>
              <p class="saved-preview">{getTerminalPreview(terminal)}</p>
              <p class="saved-date">{formatDate(terminal.updatedAt)}</p>
            </div>
            <div class="saved-actions">
              <button
                class="delete-button"
                on:click={(e) => deleteTerminal(terminal._id, e)}
                disabled={deletingTerminalId === terminal._id}
                title="Delete terminal"
              >
                {#if deletingTerminalId === terminal._id}
                  <svg class="delete-spinner" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                {/if}
              </button>
              <span class="saved-arrow">&rarr;</span>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <!-- Empty State -->
      <div class="empty-terminals">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        <p class="empty-text">No saved terminals yet</p>
        <p class="empty-subtext">Create your first terminal and save it for later</p>
        <a href="/terminal" class="empty-button">
          Go to Terminal
        </a>
      </div>
    {/if}
  </div>
</div>
{/if}

<style>
    .dashboard-container {
        max-width: 1792px;
        margin: 0 auto;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
    }

    @media (min-width: 640px) {
        .dashboard-container {
            padding: 1rem;
            gap: 2rem;
        }
    }

    /* Welcome Header - Compact on Mobile */
    .welcome-header {
        text-align: center;
        margin-bottom: 1rem;
    }

    @media (min-width: 640px) {
        .welcome-header {
            margin-bottom: 2rem;
        }
    }

    .welcome-title {
        font-size: 1.875rem;
        font-weight: 800;
        color: white;
        margin: 0;
    }

    @media (min-width: 640px) {
        .welcome-title {
            font-size: 3rem;
        }
    }

    .welcome-subtitle {
        font-size: 0.875rem;
        color: #9ca3af;
        margin: 0.25rem 0 0 0;
    }

    @media (min-width: 640px) {
        .welcome-subtitle {
            font-size: 1.25rem;
            margin-top: 1rem;
        }
    }

    /* Dashboard Grid Layout */
    .dashboard-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    @media (min-width: 1024px) {
        .dashboard-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }
    }

    /* Terminal Card - Compact on Mobile */
    .terminal-card {
        position: relative;
        border-radius: 1rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        transition: all 0.5s;
        transform: translateY(0);
        background: linear-gradient(135deg, rgba(88, 28, 135, 0.9) 0%, rgba(59, 7, 100, 0.95) 100%);
        border: 1px solid rgba(196, 181, 253, 0.3);
        overflow: hidden;
        backdrop-filter: blur(10px);
        min-height: 200px;
    }

    @media (min-width: 640px) {
        .terminal-card {
            min-height: 300px;
        }
    }

    .terminal-card:hover {
        transform: translateY(-4px);
        border-color: rgba(196, 181, 253, 0.6);
        box-shadow: 0 20px 40px rgba(147, 51, 234, 0.3);
    }

    .terminal-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(196, 181, 253, 0.15) 0%, rgba(147, 51, 234, 0.1) 100%);
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 1;
    }

    .terminal-card:hover::before {
        opacity: 1;
    }

    .terminal-card-bg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
            radial-gradient(circle at 20% 80%, rgba(196, 181, 253, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%);
        z-index: 0;
    }

    .terminal-card-content {
        position: relative;
        z-index: 2;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 1rem;
    }

    @media (min-width: 640px) {
        .terminal-card-content {
            padding: 1.5rem;
        }
    }

    .terminal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(196, 181, 253, 0.3);
    }

    @media (min-width: 640px) {
        .terminal-header {
            margin-bottom: 1.5rem;
            padding-bottom: 0.75rem;
        }
    }

    .terminal-controls {
        display: flex;
        gap: 0.375rem;
    }

    @media (min-width: 640px) {
        .terminal-controls {
            gap: 0.5rem;
        }
    }

    .terminal-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        opacity: 0.8;
    }

    @media (min-width: 640px) {
        .terminal-dot {
            width: 12px;
            height: 12px;
        }
    }

    .terminal-dot.red {
        background: #ef4444;
    }

    .terminal-dot.yellow {
        background: #f59e0b;
    }

    .terminal-dot.green {
        background: #22c55e;
    }

    .terminal-title {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        color: #c4b5fd;
        font-size: 0.75rem;
        font-weight: 500;
    }

    @media (min-width: 640px) {
        .terminal-title {
            font-size: 0.875rem;
        }
    }

    .terminal-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    @media (min-width: 640px) {
        .terminal-body {
            gap: 1.5rem;
        }
    }

    .terminal-brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    @media (min-width: 640px) {
        .terminal-brand {
            gap: 1rem;
        }
    }

    .deltuh-logo {
        height: 32px;
        width: auto;
        filter: brightness(1.2) saturate(1.1);
        opacity: 0.95;
        transition: all 0.3s;
        flex-shrink: 0;
    }

    @media (min-width: 640px) {
        .deltuh-logo {
            height: 48px;
        }
    }

    .group:hover .deltuh-logo {
        opacity: 1;
        filter: brightness(1.3) saturate(1.2);
        transform: scale(1.05);
    }

    .brand-text {
        flex: 1;
        min-width: 0;
    }

    .terminal-main-title {
        font-size: 1.25rem;
        font-weight: 800;
        background: linear-gradient(135deg, #ffffff, #e9d5ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0 0 0.25rem 0;
        line-height: 1.2;
    }

    @media (min-width: 640px) {
        .terminal-main-title {
            font-size: 1.875rem;
            margin-bottom: 0.5rem;
        }
    }

    .terminal-cursor-line {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 0.625rem;
        flex-wrap: wrap;
    }

    @media (min-width: 640px) {
        .terminal-cursor-line {
            gap: 0.5rem;
            font-size: 0.875rem;
        }
    }

    .terminal-prompt {
        color: #a855f7;
        font-weight: 600;
    }

    .terminal-command {
        color: #e9d5ff;
        word-break: break-all;
    }

    .terminal-cursor {
        display: inline-block;
        width: 6px;
        height: 12px;
        background: #c4b5fd;
        animation: blink 1s infinite;
        flex-shrink: 0;
    }

    @media (min-width: 640px) {
        .terminal-cursor {
            width: 8px;
            height: 16px;
        }
    }

    @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
    }

    .terminal-description {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.75rem;
        background: rgba(59, 7, 100, 0.6);
        border-radius: 8px;
        border: 1px solid rgba(196, 181, 253, 0.2);
    }

    @media (min-width: 640px) {
        .terminal-description {
            gap: 0.5rem;
            padding: 1rem;
        }
    }

    .terminal-text {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        color: #86efac;
        font-size: 0.625rem;
        margin: 0;
        line-height: 1.4;
    }

    @media (min-width: 640px) {
        .terminal-text {
            font-size: 0.875rem;
            line-height: 1.5;
        }
    }

    .terminal-launch {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: auto;
        padding-top: 0.75rem;
    }

    @media (min-width: 640px) {
        .terminal-launch {
            padding-top: 1rem;
        }
    }

    .launch-indicator {
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }

    @media (min-width: 640px) {
        .launch-indicator {
            gap: 0.5rem;
        }
    }

    .status-dot {
        width: 6px;
        height: 6px;
        background: #22c55e;
        border-radius: 50%;
        animation: pulse-dot 2s infinite;
    }

    @media (min-width: 640px) {
        .status-dot {
            width: 8px;
            height: 8px;
        }
    }

    @keyframes pulse-dot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    .launch-text {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        color: #22c55e;
        font-size: 0.75rem;
        font-weight: 600;
    }

    @media (min-width: 640px) {
        .launch-text {
            font-size: 0.875rem;
        }
    }

    .launch-arrow {
        font-size: 1.25rem;
        color: #c4b5fd;
        transition: all 0.3s;
        font-weight: 600;
    }

    @media (min-width: 640px) {
        .launch-arrow {
            font-size: 1.5rem;
        }
    }

    .group:hover .launch-arrow {
        color: #e9d5ff;
        transform: translateX(4px);
    }

    /* Sidebar Cards - Compact on Mobile */
    .sidebar-cards {
        display: flex;
        gap: 0.75rem;
    }

    @media (min-width: 640px) {
        .sidebar-cards {
            flex-direction: column;
            gap: 2rem;
        }
    }

    .sidebar-card {
        background: #1f2937;
        padding: 0.75rem;
        border-radius: 1rem;
        border: 1px solid #374151;
        transition: all 0.3s;
        display: flex;
        flex-direction: column;
        flex: 1;
        text-align: left;
    }

    @media (min-width: 640px) {
        .sidebar-card {
            padding: 2rem;
        }
    }

    .sidebar-card:hover {
        border-color: #4b5563;
        transform: translateY(-2px);
    }

    .card-content {
        flex-grow: 1;
    }

    .card-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    @media (min-width: 640px) {
        .card-header {
            gap: 1rem;
            margin-bottom: 1rem;
        }
    }

    .card-icon {
        width: 32px;
        height: 32px;
        background: #374151;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    @media (min-width: 640px) {
        .card-icon {
            width: 48px;
            height: 48px;
            border-radius: 0.75rem;
        }
    }

    .icon {
        width: 16px;
        height: 16px;
    }

    @media (min-width: 640px) {
        .icon {
            width: 24px;
            height: 24px;
        }
    }

    .subscription-icon {
        color: #22c55e;
    }

    .profile-icon {
        color: #8b5cf6;
    }

    .card-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: white;
        margin: 0;
    }

    @media (min-width: 640px) {
        .card-title {
            font-size: 1.5rem;
        }
    }

    .card-description {
        color: #9ca3af;
        font-size: 0.75rem;
        margin: 0;
        line-height: 1.4;
    }

    @media (min-width: 640px) {
        .card-description {
            font-size: 1rem;
        }
    }

    .plan-status {
        font-weight: 600;
        color: #22c55e;
    }

    .card-arrow {
        font-weight: 600;
        color: #8b5cf6;
        margin-top: 0.5rem;
        font-size: 0.75rem;
        align-self: flex-start;
        transition: color 0.3s;
    }

    @media (min-width: 640px) {
        .card-arrow {
            margin-top: 1.5rem;
            font-size: 1rem;
        }
    }

    .group:hover .card-arrow {
        color: #a78bfa;
    }

    /* Saved Calculations - Compact */
    .saved-calculations {
        background: #1f2937;
        padding: 0.75rem;
        border-radius: 1rem;
        border: 1px solid #374151;
    }

    @media (min-width: 640px) {
        .saved-calculations {
            padding: 2rem;
        }
    }

    .saved-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }

    @media (min-width: 640px) {
        .saved-header {
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
    }

    .saved-icon {
        width: 32px;
        height: 32px;
        background: #374151;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    @media (min-width: 640px) {
        .saved-icon {
            width: 48px;
            height: 48px;
            border-radius: 0.75rem;
        }
    }

    .saved-icon .icon {
        color: #8b5cf6;
    }

    .saved-title {
        font-size: 1rem;
        font-weight: 700;
        color: white;
        margin: 0;
    }

    @media (min-width: 640px) {
        .saved-title {
            font-size: 1.875rem;
        }
    }

    .saved-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }

    @media (min-width: 768px) {
        .saved-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    .saved-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(135deg, #111827, #1f2937);
        padding: 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid #374151;
        transition: all 0.3s;
        transform: translateY(0);
        cursor: pointer;
    }

    @media (min-width: 640px) {
        .saved-item {
            padding: 1rem;
        }
    }

    .saved-item:hover {
        transform: scale(1.02);
        border-color: #8b5cf6;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
    }

    .saved-content {
        flex-grow: 1;
        min-width: 0;
    }

    .saved-name {
        font-weight: 700;
        color: white;
        margin: 0 0 0.25rem 0;
        font-size: 0.875rem;
        transition: color 0.3s;
    }

    @media (min-width: 640px) {
        .saved-name {
            font-size: 1rem;
        }
    }

    .group:hover .saved-name {
        color: #a78bfa;
    }

    .saved-preview {
        font-size: 0.75rem;
        color: #6b7280;
        margin: 0 0 0.25rem 0;
        font-family: 'Courier New', monospace;
    }

    .saved-date {
        font-size: 0.75rem;
        color: #9ca3af;
        margin: 0;
    }

    @media (min-width: 640px) {
        .saved-date {
            font-size: 0.875rem;
        }
    }

    .saved-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-shrink: 0;
    }

    .delete-button {
        padding: 0.5rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 0.5rem;
        color: #f87171;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
    }

    .delete-button:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.4);
        color: #fca5a5;
        transform: scale(1.05);
    }

    .delete-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .delete-button svg {
        width: 16px;
        height: 16px;
    }

    .delete-spinner {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .saved-arrow {
        color: #8b5cf6;
        transition: color 0.3s;
        font-weight: 600;
        font-size: 1.25rem;
    }

    .group:hover .saved-arrow {
        color: white;
    }

    /* Loading State */
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1rem;
        gap: 1rem;
    }

    .loading-spinner {
        width: 48px;
        height: 48px;
        color: #8b5cf6;
        animation: spin 1s linear infinite;
    }

    .loading-text {
        font-size: 1rem;
        color: #9ca3af;
        margin: 0;
    }

    /* Empty State */
    .empty-terminals {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1rem;
        text-align: center;
        gap: 0.75rem;
    }

    .empty-terminals .empty-icon {
        width: 64px;
        height: 64px;
        color: #6b7280;
        stroke-width: 1.5;
    }

    .empty-terminals .empty-text {
        font-size: 1.125rem;
        font-weight: 600;
        color: #9ca3af;
        margin: 0;
    }

    .empty-terminals .empty-subtext {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
    }

    .empty-terminals .empty-button {
        margin-top: 1rem;
        padding: 0.625rem 1.5rem;
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;
        border-radius: 0.5rem;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.3s;
    }

    .empty-terminals .empty-button:hover {
        background: linear-gradient(135deg, #7c3aed, #6d28d9);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    }
</style>