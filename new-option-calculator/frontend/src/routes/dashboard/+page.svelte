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
    
    <!-- Main Card: Launch Terminal (takes up 2 columns on large screens) -->
    <a href="/terminal" class="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 p-6 sm:p-8 rounded-2xl shadow-2xl transition-all duration-300 group transform hover:-translate-y-1 hover:shadow-indigo-500/30 flex flex-col text-left">
        <div class="flex-grow">
            <div class="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <!-- SVG Icon for Terminal -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 sm:h-8 sm:w-8 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
            <h3 class="text-2xl sm:text-3xl font-bold text-white mb-3">Option Terminal</h3>
            <p class="text-indigo-200 text-base sm:text-lg">
              Access the full, real-time option pricing terminal with advanced analytics.
            </p>
        </div>
        <span class="font-semibold text-white group-hover:text-indigo-200 mt-8 text-base sm:text-lg self-start">
          Launch Terminal &rarr;
        </span>
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

  <!-- [NEW] Saved Calculations Card -->
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
    
    <!-- Placeholder for saved calculations list -->
    <div class="space-y-4">
        <!-- Example of a saved item -->
        <a href="#" class="saved-item-link group">
            <div class="flex-grow">
                <p class="font-bold text-white group-hover:text-indigo-300 transition-colors">AAPL - Iron Condor</p>
                <p class="text-sm text-gray-400">Saved on: 2023-10-27</p>
            </div>
            <span class="text-indigo-400 group-hover:text-white transition-colors">&rarr;</span>
        </a>
        <a href="#" class="saved-item-link group">
            <div class="flex-grow">
                <p class="font-bold text-white group-hover:text-indigo-300 transition-colors">TSLA - Long Call</p>
                <p class="text-sm text-gray-400">Saved on: 2023-10-26</p>
            </div>
            <span class="text-indigo-400 group-hover:text-white transition-colors">&rarr;</span>
        </a>
        <div class="text-center py-6">
            <p class="text-gray-500">No more saved calculations.</p>
        </div>
    </div>
  </div>
</div>
{/if}

<style>
    .saved-item-link {
        @apply flex items-center bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-indigo-500 transition-all duration-200;
    }
</style>
