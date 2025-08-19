<script>
  export let checked = false;
  export let label = '';
  export let id = '';
</script>

<label class="flex items-center space-x-3 cursor-pointer group" for={id}>
  <div class="relative">
    <input 
      {id}
      type="checkbox" 
      bind:checked 
      class="sr-only"
    />
    <div class="w-5 h-5 bg-gray-700 border-2 border-gray-600 rounded-md transition-all duration-200 group-hover:border-indigo-500 {checked ? 'bg-indigo-600 border-indigo-600' : ''}">
      {#if checked}
        <svg class="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      {/if}
    </div>
  </div>
  <span class="text-gray-300 text-sm select-none">{label}</span>
</label>