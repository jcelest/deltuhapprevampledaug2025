<script>
  // Import the global stylesheet. This is the crucial step.
  import '../app.css'; 

  import { authToken } from '../stores/authStore.js';
  import { goto } from '$app/navigation';

  // This function will be called when the user clicks "Logout"
  function handleLogout() {
    // Setting the token to null will trigger the store's logic
    // to remove it from localStorage.
    authToken.set(null);
    
    // Redirect the user to the home page after logging out.
    goto('/');
  }
</script>

<!-- This is the main container for the application, styled with Tailwind CSS classes -->
<div class="bg-gray-900 text-gray-200 min-h-screen font-sans">
  <header class="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
    <nav class="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
      <!-- Logo and App Name -->
      <a href="/" class="flex items-center space-x-3 text-2xl font-bold text-white hover:text-indigo-400 transition-colors">
        <!-- Replaced placeholder SVG with your logo -->
        <img src="/deltuh logo.svg" alt="Deltuh Logo" class="h-8 w-auto">
        <span>Deltuh</span>
      </a>
      
      <!-- Navigation Links Section -->
      <div class="flex items-center space-x-6">
        <!-- Use an #if block to show different links based on login state -->
        {#if $authToken}
          <!-- This content shows if the user IS logged in -->
          <a href="/dashboard" class="text-gray-300 hover:text-white transition-colors font-medium">Dashboard</a>
          <a href="/terminal" class="text-gray-300 hover:text-white transition-colors font-medium">Terminal</a>
          <button 
            on:click={handleLogout}
            class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105"
          >
            Logout
          </button>
        {:else}
          <!-- This content shows if the user IS NOT logged in -->
          <a href="/login" class="text-gray-300 hover:text-white transition-colors font-medium">Login</a>
          <a 
            href="/register" 
            class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105"
          >
            Sign Up
          </a>
        {/if}
      </div>
    </nav>
  </header>

  <main class="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
    <!-- The <slot /> is a special SvelteKit tag. -->
    <!-- It's where the content of the current page will be rendered. -->
    <slot />
  </main>
</div>
