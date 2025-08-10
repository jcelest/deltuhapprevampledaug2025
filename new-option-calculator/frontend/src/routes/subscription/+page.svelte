<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authToken } from '../../stores/authStore.js';

  // State to control which tier is highlighted or "featured"
  let featuredTier = 'gold'; // Can be 'basic', 'gold', or 'premium'

  onMount(() => {
    const token = $authToken;
    if (!token) {
      goto('/login');
    }
  });

  function handleSelectPlan(planName) {
      // Placeholder for handling subscription logic, e.g., redirecting to a checkout page
      console.log(`Selected plan: ${planName}`);
      alert(`You've selected the ${planName} plan!`);
  }
</script>

<div class="relative min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
  <!-- Motion Gradient Background -->
  <div class="background-gradient fixed"></div>

  <div class="relative z-10 w-full max-w-7xl space-y-8 sm:space-y-12">
    <!-- Main Header -->
    <div class="text-center">
      <img src="/deltuh logo.svg" alt="Deltuh Logo" class="h-16 w-auto mx-auto mb-8">
      <h1 class="text-4xl sm:text-5xl font-extrabold text-white">Choose Your Plan</h1>
      <p class="text-lg sm:text-xl text-gray-400 mt-4">Unlock the full power of advanced option analytics.</p>
    </div>

    <!-- Pricing Cards Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center pt-8">
      
      <!-- Tier 1: Basic -->
      <div class="tier-card">
        <div class="card-shine"></div>
        <h3 class="text-2xl font-bold text-white">Basic</h3>
        <p class="text-gray-400 mt-2">For the casual trader.</p>
        <p class="text-4xl font-extrabold text-white my-6">$19<span class="text-lg font-medium text-gray-400">/mo</span></p>
        <ul class="space-y-4 text-gray-300 text-left">
          <li class="flex items-center"><svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>Standard Terminal Access</li>
          <li class="flex items-center"><svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>Single Leg Strategies</li>
          <li class="flex items-center text-gray-500"><svg class="cross-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>Multi-Leg Strategies</li>
        </ul>
        <button on:click={() => handleSelectPlan('Basic')} class="button-secondary w-full mt-8">Choose Basic</button>
      </div>

      <!-- Tier 2: Gold (Featured) -->
      <div class="tier-card featured gold">
        <div class="card-shine"></div>
        <span class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase">Most Popular</span>
        <h3 class="text-2xl font-bold text-white">Gold</h3>
        <p class="text-yellow-200/70 mt-2">For the serious analyst.</p>
        <p class="text-4xl font-extrabold text-white my-6">$49<span class="text-lg font-medium text-gray-400">/mo</span></p>
        <ul class="space-y-4 text-gray-300 text-left">
            <li class="flex items-center"><svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>Standard Terminal Access</li>
            <li class="flex items-center"><svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>All Option Strategies</li>
            <li class="flex items-center"><svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>Priority Support</li>
        </ul>
        <button on:click={() => handleSelectPlan('Gold')} class="button-primary gold w-full mt-8">Choose Gold</button>
      </div>

      <!-- Tier 3: Premium -->
      <div class="tier-card premium">
        <div class="card-shine"></div>
        <h3 class="text-2xl font-bold text-white">Premium</h3>
        <p class="text-purple-200/70 mt-2">For the professional trader.</p>
        <p class="text-4xl font-extrabold text-white my-6">$99<span class="text-lg font-medium text-gray-400">/mo</span></p>
        <ul class="space-y-4 text-gray-300 text-left">
            <li class="flex items-center"><svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>All Gold Features</li>
            <li class="flex items-center"><svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>API Access</li>
            <li class="flex items-center"><svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>Dedicated Support</li>
        </ul>
        <button on:click={() => handleSelectPlan('Premium')} class="button-primary premium w-full mt-8">Choose Premium</button>
      </div>
    </div>

    <!-- Subscription Management Section -->
    <div class="text-center pt-8">
        <p class="text-gray-400">Already a member?</p>
        <div class="mt-4 flex justify-center items-center space-x-4">
            <a href="/settings" class="font-medium text-indigo-400 hover:text-indigo-300 transition">Manage Subscription</a>
            <span class="text-gray-600">|</span>
            <button class="font-medium text-gray-400 hover:text-white transition">Cancel Plan</button>
        </div>
    </div>
  </div>
</div>

<style>
  .background-gradient {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: -1;
      background: linear-gradient(240deg, #1e1b4b, #4c1d95, #111827, #111827);
      background-size: 400% 400%;
      animation: gradient-animation 20s ease infinite;
  }

  @keyframes gradient-animation {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
  }

  .tier-card {
    @apply bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 text-center relative transition-all duration-300 transform hover:scale-105;
  }

  /* [MODIFIED] Removed the default scale-105 from the featured card */
  .tier-card.featured {
    @apply border-2 z-10 lg:scale-105;
  }
  
  .tier-card.gold {
      @apply border-yellow-400;
  }
  .tier-card.premium {
      @apply border-purple-500;
  }

  .card-shine {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(110deg, transparent 20%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.1) 55%, transparent 80%);
    opacity: 0.5;
    transition: opacity 0.5s;
    pointer-events: none;
    border-radius: inherit;
  }
  
  .tier-card:hover .card-shine {
      opacity: 1;
  }

  .check-icon {
    @apply h-5 w-5 mr-3 text-green-500 flex-shrink-0;
  }
  .cross-icon {
    @apply h-5 w-5 mr-3 text-gray-600 flex-shrink-0;
  }

  .button-primary {
    @apply bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-all text-base;
  }
  .button-primary.gold {
    @apply bg-yellow-400 hover:bg-yellow-500 text-gray-900;
  }
  .button-primary.premium {
    @apply bg-purple-600 hover:bg-purple-500;
  }

  .button-secondary {
    @apply bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-md transition-all;
  }
</style>
