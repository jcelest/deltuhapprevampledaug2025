<script>
  import axios from 'axios';
  import { goto } from '$app/navigation';
  import { authToken } from '../../stores/authStore.js';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let error = '';
  let isLoading = false;

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
      
      // On successful registration, save the token to our global store
      authToken.set(response.data.token);
      
      // Redirect to the dashboard
      goto('/dashboard');

    } catch (err) {
      error = err.response?.data?.msg || 'An error occurred during registration.';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="flex min-h-full flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="w-full max-w-2xl space-y-12">
    <!-- Logo Placeholder -->
    <div class="mx-auto h-24 w-auto">
      <!-- You can place an <img src="/your-logo.svg" alt="Deltuh"> here -->
    </div>
    <div>
      <h2 class="text-center text-6xl font-extrabold tracking-tight text-white">
        Create your account
      </h2>
    </div>
    <form class="space-y-12 bg-gray-800 p-12 rounded-2xl shadow-2xl border border-gray-700" on:submit|preventDefault={handleSubmit}>
      <!-- Grouping the input fields together -->
      <div class="space-y-8 rounded-md">
        <div>
          <label for="email-address" class="sr-only">Email address</label>
          <input 
            bind:value={email}
            id="email-address" 
            name="email" 
            type="email" 
            autocomplete="email" 
            required 
            class="relative block w-full appearance-none rounded-xl border border-gray-600 bg-gray-900 px-6 py-5 text-gray-200 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-xl transition" 
            placeholder="Email address"
          >
        </div>
        <div>
          <label for="password" class="sr-only">Password</label>
          <input 
            bind:value={password}
            id="password" 
            name="password" 
            type="password" 
            autocomplete="new-password" 
            required 
            class="relative block w-full appearance-none rounded-xl border border-gray-600 bg-gray-900 px-6 py-5 text-gray-200 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-xl transition" 
            placeholder="Password"
          >
        </div>
         <div>
          <label for="confirm-password" class="sr-only">Confirm Password</label>
          <input 
            bind:value={confirmPassword}
            id="confirm-password" 
            name="confirm-password" 
            type="password" 
            autocomplete="new-password" 
            required 
            class="relative block w-full appearance-none rounded-xl border border-gray-600 bg-gray-900 px-6 py-5 text-gray-200 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-xl transition" 
            placeholder="Confirm Password"
          >
        </div>
      </div>

      {#if error}
        <div class="text-xl text-red-400 text-center">
          {error}
        </div>
      {/if}

      <!-- Grouping the action button separately -->
      <div>
        <button 
          type="submit" 
          disabled={isLoading}
          class="group relative flex w-full justify-center rounded-xl border border-transparent bg-indigo-600 py-5 px-4 text-xl font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:bg-indigo-800 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
    </form>
    <p class="text-center text-xl text-gray-400">
      Already have an account?
      <a href="/login" class="font-medium text-indigo-400 hover:text-indigo-300">
        Sign in
      </a>
    </p>
  </div>
</div>
