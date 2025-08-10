<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authToken, user } from '../../stores/authStore.js';

  // --- State Variables ---
  let email = '';
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let notificationMessage = '';
  let messageIsError = false;

  // Protect the route and populate user data
  onMount(() => {
    const token = $authToken;
    if (!token) {
      goto('/login');
    }
    
    // If the user store is empty on refresh, re-populate it.
    if (!$user) {
        user.set({ email: 'user@example.com' });
    }

    // When the component mounts, set the email from the user store
    if ($user && $user.email) {
        email = $user.email;
    }
  });

  // --- Functions ---

  function handleSaveChanges() {
      // Placeholder for API call to update user profile
      console.log('Saving profile changes for:', email);
      showNotification('Profile updated successfully!');
  }

  function handleChangePassword() {
      if (newPassword !== confirmPassword) {
          showNotification('New passwords do not match.', true);
          return;
      }
      // Placeholder for API call to change password
      console.log('Changing password...');
      showNotification('Password changed successfully!');
      // Clear password fields after submission
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
  }

  function showNotification(message, isError = false) {
      notificationMessage = message;
      messageIsError = isError;
      setTimeout(() => {
          notificationMessage = '';
      }, 3000); // Hide message after 3 seconds
  }

</script>

<div class="relative min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
  <!-- Motion Gradient Background -->
  <div class="background-gradient fixed"></div>

  <div class="relative z-10 w-full max-w-7xl space-y-8 sm:space-y-12">
    {#if $user}
      <!-- Main Header -->
      <div class="text-center">
        <h1 class="text-4xl sm:text-5xl font-extrabold text-white">Settings</h1>
        <p class="text-lg sm:text-xl text-gray-400 mt-4">Manage your account and subscription.</p>
      </div>

      <!-- Grid for Settings Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <!-- Main Settings Forms (takes up 2 columns on large screens) -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- Profile Information Card -->
          <div class="settings-card">
            <h3 class="card-header">Profile Information</h3>
            <div class="space-y-6">
              <label class="input-group">
                <span class="input-label">Email Address</span>
                <input type="email" bind:value={email} class="input-field" placeholder="your@email.com">
              </label>
              <button on:click={handleSaveChanges} class="button-primary w-full sm:w-auto">Save Changes</button>
            </div>
          </div>

          <!-- Change Password Card -->
          <div class="settings-card">
            <h3 class="card-header">Change Password</h3>
            <div class="space-y-6">
              <label class="input-group">
                <span class="input-label">Current Password</span>
                <input type="password" bind:value={currentPassword} class="input-field">
              </label>
              <label class="input-group">
                <span class="input-label">New Password</span>
                <input type="password" bind:value={newPassword} class="input-field">
              </label>
              <label class="input-group">
                <span class="input-label">Confirm New Password</span>
                <input type="password" bind:value={confirmPassword} class="input-field">
              </label>
              <button on:click={handleChangePassword} class="button-primary w-full sm:w-auto">Update Password</button>
            </div>
          </div>

        </div>

        <!-- Sidebar Cards Container -->
        <div class="space-y-8">
            <!-- [MODIFIED] Subscription Card -->
            <a href="/subscription" class="settings-card group flex flex-col text-left transition-all duration-300 hover:border-gray-600">
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
                    Manage Plan &rarr;
                </span>
            </a>

            <!-- Delete Account Card -->
            <div class="bg-gray-800/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-red-700/50">
                <h3 class="card-header text-red-400">Danger Zone</h3>
                <p class="text-gray-400 mb-6 text-sm">
                  Deleting your account is a permanent action and cannot be undone.
                </p>
                <button class="button-danger w-full">
                  Delete Account
                </button>
            </div>
        </div>
      </div>
      
      <!-- Global Footer -->
      <footer class="border-t border-gray-700 pt-8 mt-8">
        <div class="text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Deltuh. All Rights Reserved.</p>
          <div class="mt-2 space-x-4">
            <a href="/terms" class="hover:text-white transition-colors">Terms of Service</a>
            <span>&bull;</span>
            <a href="/privacy" class="hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>

      <!-- Notification Popup -->
      {#if notificationMessage}
        <div class="fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-50" class:bg-green-600={!messageIsError} class:bg-red-600={messageIsError}>
          {notificationMessage}
        </div>
      {/if}
    {/if}
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

  .settings-card {
    @apply bg-gray-800/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-gray-700;
  }
  .card-header {
    @apply text-2xl font-bold text-white mb-6;
  }
  .input-group {
    @apply flex flex-col space-y-2;
  }
  .input-label {
    @apply font-semibold text-gray-400 text-sm;
  }
  .input-field {
    @apply bg-gray-900 border border-gray-600 rounded-lg p-3 text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition w-full;
  }
  
  /* [MODIFIED] Button Styles */
  .button-primary {
    @apply font-bold py-3 px-6 rounded-lg text-base text-white transition-all duration-300;
    background-image: linear-gradient(to right, #4f46e5, #7c3aed);
    border: 1px solid #6d28d9;
    box-shadow: 0 0 15px rgba(124, 58, 237, 0.3);
  }
  .button-primary:hover {
    box-shadow: 0 0 25px rgba(124, 58, 237, 0.6);
    transform: translateY(-2px);
  }

  .button-secondary {
    @apply font-semibold py-3 px-4 rounded-md text-white transition-all duration-300;
    background-color: #374151; /* bg-gray-700 */
    border: 1px solid #4b5563; /* border-gray-600 */
  }
  .button-secondary:hover {
    background-color: #4b5563; /* hover:bg-gray-600 */
    border-color: #6b7280; /* hover:border-gray-500 */
  }

  .button-danger {
    @apply font-semibold py-3 px-4 rounded-md text-red-400 transition-all duration-300;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.4);
  }
  .button-danger:hover {
    background-color: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.6);
    color: #f87171; /* hover:text-red-400 */
  }
</style>
