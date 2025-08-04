<script>
  import axios from 'axios';
  import { goto } from '$app/navigation';
  import { authToken } from '../../stores/authStore.js';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let error = '';
  let isLoading = false;
  let showPassword = false;
  let showConfirmPassword = false;
  let termsAccepted = false;

  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

  async function handleSubmit() {
    if (!email || !password || !confirmPassword) {
      error = 'Please fill in all fields.';
      return;
    }
    if (password !== confirmPassword) {
      error = 'Passwords do not match.';
      return;
    }
    isLoading = true;
    error = '';
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
      });
      
      authToken.set(response.data.token);
      goto('/dashboard');

    } catch (err) {
      error = err.response?.data?.msg || 'An error occurred during registration.';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="relative min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
  <!-- Motion Gradient Background -->
  <div class="background-gradient fixed"></div>

  <div class="relative z-10 w-full max-w-md sm:max-w-2xl space-y-8 sm:space-y-12">
    <div>
      <h2 class="text-center text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
        Create your account
      </h2>
    </div>
    <form class="space-y-8 sm:space-y-12 bg-gray-800/80 backdrop-blur-sm p-8 sm:p-12 rounded-2xl shadow-2xl border border-gray-700" on:submit|preventDefault={handleSubmit}>
      
      <div class="flex justify-center">
        <img src="/deltuh1logo1.svg" alt="Deltuh Logo" class="h-28 sm:h-32 w-auto" />
      </div>

      <!-- Grouping the input fields together -->
      <div class="space-y-6 sm:space-y-8 rounded-md">
        <div>
          <label for="email-address" class="sr-only">Email address</label>
          <input 
            bind:value={email}
            id="email-address" 
            name="email" 
            type="email" 
            autocomplete="email" 
            required 
            class="relative block w-full appearance-none rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 sm:px-6 sm:py-5 text-gray-200 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-base sm:text-xl transition" 
            placeholder="Email address"
          >
        </div>
        <div class="relative">
          <label for="password" class="sr-only">Password</label>
          <input 
            bind:value={password}
            id="password" 
            name="password" 
            type={showPassword ? 'text' : 'password'}
            autocomplete="new-password" 
            required 
            class="relative block w-full appearance-none rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 sm:px-6 sm:py-5 text-gray-200 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-base sm:text-xl transition" 
            placeholder="Password"
          >
          <button type="button" on:click={() => showPassword = !showPassword} class="absolute inset-y-0 right-0 flex items-center pr-4 sm:pr-6 text-gray-500 hover:text-gray-300">
            {#if showPassword}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l-2.145-2.145" /></svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {/if}
          </button>
        </div>
         <div class="relative">
          <label for="confirm-password" class="sr-only">Confirm Password</label>
          <input 
            bind:value={confirmPassword}
            id="confirm-password" 
            name="confirm-password" 
            type={showConfirmPassword ? 'text' : 'password'}
            autocomplete="new-password" 
            required 
            class="relative block w-full appearance-none rounded-xl border border-gray-600 bg-gray-900 px-4 py-3 sm:px-6 sm:py-5 text-gray-200 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-base sm:text-xl transition" 
            placeholder="Confirm Password"
          >
          <button type="button" on:click={() => showConfirmPassword = !showConfirmPassword} class="absolute inset-y-0 right-0 flex items-center pr-4 sm:pr-6 text-gray-500 hover:text-gray-300">
            {#if showConfirmPassword}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l-2.145-2.145" /></svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {/if}
          </button>
        </div>
      </div>

      <div class="flex items-center">
        <input id="terms-and-conditions" name="terms-and-conditions" type="checkbox" bind:checked={termsAccepted} class="h-4 w-4 rounded border-gray-500 bg-gray-700 text-indigo-600 focus:ring-indigo-500">
        <label for="terms-and-conditions" class="ml-3 block text-sm text-gray-400">
          I agree to the
          <a href="/terms" class="font-medium text-indigo-400 hover:underline">Terms of Service</a>
          and
          <a href="/privacy" class="font-medium text-indigo-400 hover:underline">Privacy Policy</a>.
        </label>
      </div>

      {#if error}
        <div class="text-base sm:text-xl text-red-400 text-center">
          {error}
        </div>
      {/if}

      <div>
        <button 
          type="submit" 
          disabled={isLoading || !termsAccepted}
          class="group relative flex w-full justify-center rounded-xl border border-transparent bg-indigo-600 py-3 sm:py-5 px-4 text-base sm:text-xl font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:bg-indigo-800 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
    </form>
    <p class="text-center text-base sm:text-xl text-gray-400">
      Already have an account?
      <a href="/login" class="font-medium text-indigo-400 hover:text-indigo-300">
        Sign in
      </a>
    </p>
    <div class="px-4 sm:px-8">
        <p class="text-center text-xs text-gray-500">
            Disclaimer: The information provided by Deltuh is for educational and informational purposes only, and should not be construed as financial advice. Options trading involves substantial risk and is not suitable for all investors.
        </p>
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
        z-index: 0;
        background: linear-gradient(240deg, #1e1b4b, #4c1d95, #111827, #111827);
        background-size: 400% 400%;
        animation: gradient-animation 20s ease infinite;
    }

    @keyframes gradient-animation {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
</style>
