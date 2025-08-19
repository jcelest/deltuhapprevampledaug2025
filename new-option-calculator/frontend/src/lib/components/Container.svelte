<script>
  export let title = '';
  export let id = '';
  export let canRemove = true;
  export let onRemove = null;
  
  let showSettings = false;
  
  function handleRemove() {
    if (onRemove) {
      onRemove(id);
    }
  }
</script>

<div class="bg-gray-800 rounded-xl shadow-lg border border-gray-700 h-full flex flex-col">
  <div class="p-3 sm:p-4 bg-gray-700/50 border-b border-gray-700 flex items-center justify-between">
    <h3 class="text-sm sm:text-lg font-bold text-white truncate">{title}</h3>
    <div class="flex items-center gap-2">
      <button 
        on:click={() => showSettings = !showSettings}
        class="text-gray-400 hover:text-white transition-colors p-1"
        title="Settings"
        aria-label="Toggle settings"
      >
        <svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      {#if canRemove}
        <button 
          on:click={handleRemove}
          class="text-gray-400 hover:text-red-400 transition-colors p-1"
          title="Remove component"
          aria-label="Remove component"
        >
          <svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
    </div>
  </div>
  
  {#if showSettings}
    <div class="p-3 sm:p-4 bg-gray-700/30 border-b border-gray-700">
      <slot name="settings" />
    </div>
  {/if}
  
  <div class="flex-grow overflow-hidden">
    <slot />
  </div>
</div>