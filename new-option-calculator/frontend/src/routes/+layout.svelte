<script>
  // Import the global stylesheet.
  import '../app.css';
  
  // Import the `page` store to access the current URL.
  import { page } from '$app/stores';

  import { authToken } from '../stores/authStore.js';
  import { goto } from '$app/navigation';
  import NotificationContainer from '../lib/components/NotificationContainer.svelte';
  import ConfirmationDialogContainer from '../lib/components/ConfirmationDialogContainer.svelte';

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
<div class="bg-gray-900 text-gray-200 min-h-screen font-sans flex flex-col">
  <header class="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
    <nav class="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
      <!-- Logo and App Name -->
      <a href="/" class="flex items-center space-x-3 text-2xl font-bold text-white hover:text-indigo-400 transition-colors">
        <!-- Replaced placeholder SVG with your logo -->
        <img src="/deltuh logo.svg" alt="Deltuh Logo" class="h-8 w-auto">
        <span>Deltuh</span>
      </a>
      
      <!-- Navigation Links Section -->
      <div class="flex items-center space-x-2 sm:space-x-6">
        <!-- Use an #if block to show different links based on login state -->
        {#if $authToken}
          <!-- This content shows if the user IS logged in -->
          
          <!-- [MODIFIED] Link now has a purple underline indicator when active -->
          <a
            href="/dashboard"
            class="relative text-sm sm:text-base text-gray-300 hover:text-indigo-400 transition-colors font-medium whitespace-nowrap py-2"
            class:text-indigo-400={$page.url.pathname === '/dashboard'}
          >
            Dashboard
            <!-- This span is the animated underline -->
            <span
              class="absolute bottom-0 left-0 block h-0.5 bg-indigo-500 transition-all duration-300"
              class:w-full={$page.url.pathname === '/dashboard'}
              class:w-0={!($page.url.pathname === '/dashboard')}
            ></span>
          </a>
          
          <button 
            on:click={handleLogout}
            class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-3 sm:px-4 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105 text-sm sm:text-base"
          >
            Logout
          </button>
        {:else}
          <!-- This content shows if the user IS NOT logged in -->
          <a href="/login" class="text-sm sm:text-base text-gray-300 hover:text-white transition-colors font-medium">Login</a>
          <a 
            href="/register" 
            class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-3 sm:px-4 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105 text-sm sm:text-base"
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

  <!-- Global Footer -->
  <footer class="bg-gray-800/50 border-t border-gray-700 mt-auto">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-400 text-sm">
      <p>&copy; {new Date().getFullYear()} Deltuh. All Rights Reserved.</p>
      <div class="mt-2 space-x-4">
        <a href="/terms" class="hover:text-white transition-colors">Terms of Service</a>
        <span>&bull;</span>
        <a href="/privacy" class="hover:text-white transition-colors">Privacy Policy</a>
      </div>
    </div>
  </footer>
  
  <!-- Global Notification System -->
  <NotificationContainer />
  <ConfirmationDialogContainer />
</div>

<style global>
  /* This global style prevents horizontal scrolling/zooming on mobile */
  html, body {
    overflow-x: hidden;
  }
</style>
