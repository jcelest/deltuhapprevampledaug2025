<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authToken, user } from '../../stores/authStore.js';

  // This is a simple check to protect the route.
  // If there's no auth token when the component mounts, redirect to login.
  onMount(() => {
    const token = $authToken;
    if (!token) {
      goto('/login');
    }
    // In a real app, you would also use the token to fetch user details
    // and populate the 'user' store here.
    // For now, we'll just simulate it.
    user.set({ email: 'user@example.com' }); 
  });
</script>

{#if $user}
<div class="space-y-8 sm:space-y-12">
  <!-- Main Welcome Header -->
  <div class="text-center">
    <h1 class="text-4xl sm:text-5xl font-extrabold text-white">Welcome to your Dashboard</h1>
    <p class="text-lg sm:text-xl text-gray-400 mt-4">Here's your command center.</p>
  </div>

  <!-- Grid for Dashboard Cards/Widgets -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    <!-- Main Card: Launch Terminal with Deltuh Branding -->
    <a href="/terminal" class="terminal-card lg:col-span-2 group">
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
    <div class="space-y-8">
        <!-- Card 2: Subscription Status -->
        <a href="/subscription" class="bg-gray-800 p-6 sm:p-8 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all duration-300 flex flex-col text-left group">
           <div class="flex-grow">
               <div class="flex items-center space-x-4 mb-4">
                   <div class="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                       <!-- SVG Icon for Subscription -->
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                           <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                   </div>
                   <h3 class="text-xl sm:text-2xl font-semibold text-white">Subscription</h3>
               </div>
               <p class="text-gray-400">
                 Your current plan: <span class="font-semibold text-green-400">Premium</span>
               </p>
           </div>
           <span class="font-semibold text-indigo-400 group-hover:text-indigo-300 mt-6 text-base self-start">
               Upgrade Plan &rarr;
           </span>
        </a>

        <!-- Card 3: Profile Settings -->
         <a href="/settings" class="bg-gray-800 p-6 sm:p-8 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all duration-300 flex flex-col text-left group">
            <div class="flex-grow">
                <div class="flex items-center space-x-4 mb-4">
                    <div class="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                        <!-- SVG Icon for Profile -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h3 class="text-xl sm:text-2xl font-semibold text-white">Profile</h3>
                </div>
                <p class="text-gray-400">
                  Update your email or change your password.
                </p>
            </div>
            <span class="font-semibold text-indigo-400 group-hover:text-indigo-300 mt-6 text-base self-start">
                Go to Settings &rarr;
            </span>
         </a>
    </div>
  </div>

  <!-- [MODIFIED] Saved Calculations Section -->
  <div class="bg-gray-800 p-6 sm:p-8 rounded-2xl border border-gray-700">
    <div class="flex items-center space-x-4 mb-6">
        <div class="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
            <!-- SVG Icon for Saved -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
        </div>
        <h3 class="text-2xl sm:text-3xl font-bold text-white">Saved Calculations</h3>
    </div>
    
    <!-- [MODIFIED] Grid layout for saved calculations -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Example of a saved item -->
        <a href="#" class="saved-item-card group">
            <div class="flex-grow">
                <p class="font-bold text-white group-hover:text-indigo-300 transition-colors">AAPL - Iron Condor</p>
                <p class="text-sm text-gray-400">Saved on: 2023-10-27</p>
            </div>
            <span class="text-indigo-400 group-hover:text-white transition-colors">&rarr;</span>
        </a>
        <a href="#" class="saved-item-card group">
            <div class="flex-grow">
                <p class="font-bold text-white group-hover:text-indigo-300 transition-colors">TSLA - Long Call</p>
                <p class="text-sm text-gray-400">Saved on: 2023-10-26</p>
            </div>
            <span class="text-indigo-400 group-hover:text-white transition-colors">&rarr;</span>
        </a>
        <a href="#" class="saved-item-card group">
            <div class="flex-grow">
                <p class="font-bold text-white group-hover:text-indigo-300 transition-colors">NVDA - Vertical Spread</p>
                <p class="text-sm text-gray-400">Saved on: 2023-10-25</p>
            </div>
            <span class="text-indigo-400 group-hover:text-white transition-colors">&rarr;</span>
        </a>
        <div class="text-center py-6 md:col-span-2">
            <p class="text-gray-500">No more saved calculations.</p>
        </div>
    </div>
  </div>
</div>
{/if}

<style>
    /* Saved calculations card styles */
    .saved-item-card {
        @apply flex items-center bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-xl border border-gray-700 transition-all duration-300 transform hover:scale-105 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10;
    }

    /* Terminal Card Styles */
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
    }

    .terminal-card:hover {
        transform: translateY(-4px);
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

    .terminal-card:hover {
        border-color: rgba(196, 181, 253, 0.6);
        box-shadow: 0 20px 40px rgba(147, 51, 234, 0.3);
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
        padding: 1.5rem;
    }

    .terminal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(196, 181, 253, 0.3);
    }

    .terminal-controls {
        display: flex;
        gap: 0.5rem;
    }

    .terminal-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        opacity: 0.8;
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
        font-size: 0.875rem;
        font-weight: 500;
    }

    .terminal-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .terminal-brand {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .deltuh-logo {
        height: 48px;
        width: auto;
        filter: brightness(1.2) saturate(1.1);
        opacity: 0.95;
        transition: all 0.3s;
    }

    .group:hover .deltuh-logo {
        opacity: 1;
        filter: brightness(1.3) saturate(1.2);
        transform: scale(1.05);
    }

    .brand-text {
        flex: 1;
    }

    .terminal-main-title {
        font-size: 1.875rem;
        font-weight: 800;
        background: linear-gradient(135deg, #ffffff, #e9d5ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0 0 0.5rem 0;
    }

    .terminal-cursor-line {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 0.875rem;
    }

    .terminal-prompt {
        color: #a855f7;
        font-weight: 600;
    }

    .terminal-command {
        color: #e9d5ff;
    }

    .terminal-cursor {
        display: inline-block;
        width: 8px;
        height: 16px;
        background: #c4b5fd;
        animation: blink 1s infinite;
    }

    @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
    }

    .terminal-description {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem;
        background: rgba(59, 7, 100, 0.6);
        border-radius: 8px;
        border: 1px solid rgba(196, 181, 253, 0.2);
    }

    .terminal-text {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        color: #86efac;
        font-size: 0.875rem;
        margin: 0;
        line-height: 1.5;
    }

    .terminal-launch {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: auto;
        padding-top: 1rem;
    }

    .launch-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        background: #22c55e;
        border-radius: 50%;
        animation: pulse-dot 2s infinite;
    }

    @keyframes pulse-dot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    .launch-text {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        color: #22c55e;
        font-size: 0.875rem;
        font-weight: 600;
    }

    .launch-arrow {
        font-size: 1.5rem;
        color: #c4b5fd;
        transition: all 0.3s;
        font-weight: 600;
    }

    .group:hover .launch-arrow {
        color: #e9d5ff;
        transform: translateX(4px);
    }

    /* Mobile responsive adjustments */
    @media (max-width: 640px) {
        .terminal-card-content {
            padding: 1rem;
        }

        .terminal-brand {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
            text-align: left;
        }

        .deltuh-logo {
            height: 40px;
        }

        .terminal-main-title {
            font-size: 1.5rem;
        }

        .terminal-cursor-line {
            font-size: 0.75rem;
        }

        .terminal-text {
            font-size: 0.75rem;
        }
    }

    @media (max-width: 1024px) {
        .terminal-brand {
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
        }
    }
</style>