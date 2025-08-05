<script>
  // Import the global auth store to check the user's login status.
  import { authToken } from '../stores/authStore.js';
</script>

<!-- 
  FIX: This outer container now has a minimum height and overflow-hidden to
  properly contain the new fixed-position background and prevent mobile zooming.
-->
<div class="relative min-h-[calc(100vh-64px)] overflow-hidden">
    
    <!-- 
      [NEW] This div creates the animated, flowing gradient background.
      'position: fixed' makes it fill the entire viewport, solving the desktop issue.
    -->
    <div class="background-gradient"></div>

    <!-- 
      This is the main content container, positioned above the background with a relative z-index.
      It centers the content both vertically and horizontally.
    -->
    <div class="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center py-20 sm:py-32 px-4">
      <div class="max-w-4xl">
        <!-- Logo Placeholder -->
        <div class="mb-8 animate-fade-in-down">
          <img src="/deltuh logo.svg" alt="Deltuh Logo" class="mx-auto h-20 w-auto">
        </div>

        <!-- Main heading with a fade-in animation -->
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-white animate-fade-in-down">
          The Future of Option Pricing is
          <span class="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 mt-2">
            Here.
          </span>
        </h1>
        <!-- Subheading with a delayed fade-in animation -->
        <p class="mt-8 max-w-3xl mx-auto text-xl text-gray-300 animate-fade-in-up">
          Leverage our real-time analytics terminal to gain an edge in the market. Accurate, fast, and built for serious traders.
        </p>
        <!-- Call-to-action buttons with a delayed fade-in animation -->
        <div class="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6 animate-fade-in-up">
          <!-- Use an #if block to show different buttons based on login state -->
          {#if $authToken}
            <!-- This button shows if the user IS logged in -->
            <a
              href="/dashboard"
              class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-indigo-500/20"
            >
              Go to Dashboard
            </a>
          {:else}
            <!-- These buttons show if the user IS NOT logged in -->
            <a
              href="/register"
              class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-indigo-500/20"
            >
              Get Started
            </a>
            <a
              href="/login"
              class="w-full sm:w-auto bg-gray-800/50 border border-gray-700 hover:bg-gray-700/80 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all duration-300 ease-in-out"
            >
              Sign In
            </a>
          {/if}
        </div>
      </div>
    </div>
</div>

<style>
  :global(html) {
    background-color: #111827; /* Corresponds to Tailwind's bg-gray-900 */
  }

  /* [NEW] Styles for the flowing gradient background */
  .background-gradient {
    position: fixed; /* Changed from absolute to fixed */
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    background: linear-gradient(270deg, #3730a3, #5b21b6, #1e1b4b, #111827);
    background-size: 400% 400%;
    animation: gradient-flow 20s ease infinite;
  }

  @keyframes gradient-flow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes fade-in-down {
    0% {
      opacity: 0;
      transform: translateY(-20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fade-in-up {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-down {
    animation: fade-in-down 0.8s ease-out forwards;
  }

  .animate-fade-in-up {
    animation: fade-in-up 1s ease-out 0.4s forwards;
    opacity: 0; /* Start hidden for the animation */
  }
</style>
