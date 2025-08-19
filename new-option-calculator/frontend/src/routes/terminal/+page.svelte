<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  
  // Import components
  import CalculationEngine from '../../lib/components/CalculationEngine.svelte';
  import PricingMatrix from '../../lib/components/PricingMatrix.svelte';
  import GreeksDashboard from '../../lib/components/GreeksDashboard.svelte';
  import MarketData from '../../lib/components/MarketData.svelte';
  import ComponentSelector from '../../lib/components/ComponentSelector.svelte';
  
  // Component registry
  const components = {
    CalculationEngine,
    PricingMatrix,
    GreeksDashboard,
    MarketData
  };

  const componentRegistry = {
    CalculationEngine: { title: 'Calculation Engine', defaultSize: { w: 12, h: 8 } },
    PricingMatrix: { title: 'Pricing Matrix', defaultSize: { w: 12, h: 4 } },
    GreeksDashboard: { title: 'Greeks Dashboard', defaultSize: { w: 6, h: 6 } },
    MarketData: { title: 'Market Data', defaultSize: { w: 6, h: 6 } }
  };

  // Layout state - start with only CalculationEngine
  let layout = writable([
    { id: 'calculation-engine', component: 'CalculationEngine', x: 0, y: 0, w: 12, h: 8, config: {} }
  ]);

  let isEditMode = writable(false);
  let showComponentSelector = false;
  let calculationResults = null;
  let inputData = {};

  // Enhanced drag and resize state
  let activeAction = null;
  let activeComponent = null;
  let dragStart = { x: 0, y: 0 };
  let componentStart = { x: 0, y: 0, w: 0, h: 0 };
  let gridContainer = null;
  let isDragging = false;

  // Grid configuration
  const GRID_COLS = 12;
  const MIN_CELL_HEIGHT = 80;
  const MIN_COMPONENT_WIDTH = 2;
  const MIN_COMPONENT_HEIGHT = 2;

  // Mobile gesture state
  let initialPinchDistance = 0;
  let isMultiTouch = false;

  onMount(() => {
    loadLayout();
    
    // Add global event listeners for drag operations
    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  });

  function loadLayout() {
    try {
      const saved = localStorage.getItem('terminal-layout');
      if (saved) {
        const savedLayout = JSON.parse(saved);
        const normalizedLayout = savedLayout.map(item => ({
          ...item,
          h: Math.max(MIN_COMPONENT_HEIGHT, item.h)
        }));
        layout.set(normalizedLayout);
      }
    } catch (e) {
      console.error('Failed to load layout:', e);
    }
  }

  function saveLayout() {
    try {
      localStorage.setItem('terminal-layout', JSON.stringify($layout));
    } catch (e) {
      console.error('Failed to save layout:', e);
    }
  }

  function handleRemoveComponent(id) {
    layout.update(items => items.filter(item => item.id !== id));
    saveLayout();
  }

  function handleConfigChange(id, newConfig) {
    layout.update(items => 
      items.map(item => 
        item.id === id ? { ...item, config: newConfig } : item
      )
    );
    saveLayout();
  }

  function toggleEditMode() {
    isEditMode.update(mode => !mode);
  }

  function addComponent(componentType) {
    const newId = `${componentType.toLowerCase()}-${Date.now()}`;
    const defaultSize = componentRegistry[componentType]?.defaultSize || { w: 6, h: 6 };
    
    // Find the best position for the new component
    const newY = findNextAvailableRow();
    
    const newComponent = {
      id: newId,
      component: componentType,
      x: 0,
      y: newY,
      ...defaultSize,
      config: {}
    };
    
    layout.update(items => [...items, newComponent]);
    saveLayout();
    showComponentSelector = false;
    console.log('Added component:', componentType, 'at position:', { x: 0, y: newY, ...defaultSize });
  }

  // Find the next available row to place a component
  function findNextAvailableRow() {
    const currentLayout = $layout;
    if (currentLayout.length === 0) return 0;
    const maxY = Math.max(...currentLayout.map(item => item.y + item.h));
    return maxY;
  }

  // Reset layout function
  function resetLayout() {
    layout.set([
      { id: 'calculation-engine', component: 'CalculationEngine', x: 0, y: 0, w: 12, h: 8, config: {} }
    ]);
    saveLayout();
    showComponentSelector = false;
  }

  // Clear all components
  function clearAllComponents() {
    layout.set([]);
    saveLayout();
  }

  // Enhanced grid style calculation
  function getGridStyle(item) {
    const colSpan = Math.max(MIN_COMPONENT_WIDTH, Math.min(GRID_COLS, item.w));
    const colStart = Math.max(1, Math.min(GRID_COLS - colSpan + 1, item.x + 1));
    const rowSpan = Math.max(MIN_COMPONENT_HEIGHT, item.h);
    
    return `
      grid-column: ${colStart} / span ${colSpan};
      grid-row: ${item.y + 1} / span ${rowSpan};
      min-height: ${MIN_CELL_HEIGHT * rowSpan}px;
    `;
  }

  // Get pixel coordinates from mouse/touch event
  function getEventCoordinates(event) {
    if (event.touches) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    return { x: event.clientX, y: event.clientY };
  }

  // Enhanced pixel to grid conversion with proper coordinate handling
  function pixelToGrid(pixelX, pixelY) {
    if (!gridContainer) return { x: 0, y: 0 };
    
    const rect = gridContainer.getBoundingClientRect();
    const relativeX = pixelX - rect.left;
    const relativeY = pixelY - rect.top;
    
    const cellWidth = rect.width / GRID_COLS;
    const cellHeight = MIN_CELL_HEIGHT;
    
    // Allow negative coordinates during drag, constrain only at the end
    const gridX = Math.floor(relativeX / cellWidth);
    const gridY = Math.floor(relativeY / cellHeight);
    
    return { x: gridX, y: gridY };
  }

  // Find overlapping components for swapping
  function findOverlappingComponents(x, y, w, h, excludeId = null) {
    return $layout.filter(item => {
      if (item.id === excludeId) return false;
      return !(
        x >= item.x + item.w ||
        x + w <= item.x ||
        y >= item.y + item.h ||
        y + h <= item.y
      );
    });
  }

  // Drag functionality with proper coordinate handling
  function startDrag(event, item) {
    if (!$isEditMode || isDragging) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    isDragging = true;
    document.body.style.overflow = 'hidden';
    
    activeAction = 'drag';
    activeComponent = item;
    
    const coords = getEventCoordinates(event);
    dragStart = coords;
    componentStart = { x: item.x, y: item.y, w: item.w, h: item.h };
    
    const element = document.querySelector(`[data-component-id="${item.id}"]`);
    if (element) {
      element.classList.add('dragging');
    }
  }

  // Resize functionality
  function startResize(event, item) {
    if (!$isEditMode || isDragging) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    isDragging = true;
    document.body.style.overflow = 'hidden';
    
    activeAction = 'resize';
    activeComponent = item;
    
    const coords = getEventCoordinates(event);
    dragStart = coords;
    componentStart = { x: item.x, y: item.y, w: item.w, h: item.h };
  }

  // Fixed mouse move handler with smooth positioning and snap detection
  function handleGlobalMouseMove(event) {
    if (!activeAction || !activeComponent || !isDragging) return;
    
    event.preventDefault();
    
    const coords = getEventCoordinates(event);
    
    if (activeAction === 'drag') {
      // Calculate the difference in pixels, then convert to grid units
      const deltaX = coords.x - dragStart.x;
      const deltaY = coords.y - dragStart.y;
      
      // Convert pixel deltas to grid deltas with more sensitive movement
      const rect = gridContainer.getBoundingClientRect();
      const cellWidth = rect.width / GRID_COLS;
      const cellHeight = MIN_CELL_HEIGHT;
      
      // Use a smaller threshold for more responsive movement
      const sensitivity = 0.3; // Adjust this value for sensitivity (0.1 = very sensitive, 0.5 = less sensitive)
      const gridDeltaX = Math.floor(deltaX / (cellWidth * sensitivity)) * sensitivity;
      const gridDeltaY = Math.floor(deltaY / (cellHeight * sensitivity)) * sensitivity;
      
      // Calculate new position
      const rawNewX = componentStart.x + gridDeltaX;
      const rawNewY = componentStart.y + gridDeltaY;
      
      // Snap to grid with better precision
      const snappedX = Math.round(rawNewX);
      const snappedY = Math.round(rawNewY);
      
      // Apply constraints
      const constrainedX = Math.max(0, Math.min(GRID_COLS - activeComponent.w, snappedX));
      const constrainedY = Math.max(0, snappedY);
      
      // Check for adjacent component snapping
      const snapPosition = findSnapPosition(constrainedX, constrainedY, activeComponent);
      
      // Update position
      updateComponentPosition(activeComponent.id, { 
        x: snapPosition.x, 
        y: snapPosition.y 
      });
      
    } else if (activeAction === 'resize') {
      const currentGridPos = pixelToGrid(coords.x, coords.y);
      const startGridPos = pixelToGrid(dragStart.x, dragStart.y);
      
      const deltaX = currentGridPos.x - startGridPos.x;
      const deltaY = currentGridPos.y - startGridPos.y;
      
      const newW = Math.max(1, Math.min(GRID_COLS - activeComponent.x, 
        componentStart.w + deltaX));
      const newH = Math.max(1, componentStart.h + deltaY);
      
      updateComponentPosition(activeComponent.id, { w: newW, h: newH });
    }
  }

  // Find the best snap position to avoid overlaps and enable close positioning
  function findSnapPosition(targetX, targetY, draggedComponent) {
    const snapThreshold = 1; // How close components can be
    const otherComponents = $layout.filter(item => item.id !== draggedComponent.id);
    
    let bestX = targetX;
    let bestY = targetY;
    
    // Check for collisions and find adjacent positions
    for (const otherComponent of otherComponents) {
      const wouldOverlap = !(
        targetX >= otherComponent.x + otherComponent.w ||
        targetX + draggedComponent.w <= otherComponent.x ||
        targetY >= otherComponent.y + otherComponent.h ||
        targetY + draggedComponent.h <= otherComponent.y
      );
      
      if (wouldOverlap) {
        // Find the best adjacent position
        const positions = [
          // Right of the other component
          { x: otherComponent.x + otherComponent.w, y: targetY },
          // Left of the other component
          { x: otherComponent.x - draggedComponent.w, y: targetY },
          // Below the other component
          { x: targetX, y: otherComponent.y + otherComponent.h },
          // Above the other component
          { x: targetX, y: otherComponent.y - draggedComponent.h }
        ];
        
        // Filter valid positions and find the closest one
        const validPositions = positions.filter(pos => 
          pos.x >= 0 && 
          pos.x + draggedComponent.w <= GRID_COLS && 
          pos.y >= 0
        );
        
        if (validPositions.length > 0) {
          // Choose the position closest to the target
          const closest = validPositions.reduce((closest, pos) => {
            const currentDistance = Math.abs(pos.x - targetX) + Math.abs(pos.y - targetY);
            const closestDistance = Math.abs(closest.x - targetX) + Math.abs(closest.y - targetY);
            return currentDistance < closestDistance ? pos : closest;
          });
          
          bestX = closest.x;
          bestY = closest.y;
          break;
        }
      }
    }
    
    return { x: bestX, y: bestY };
  }

  // Enhanced mouse up handler with improved final positioning
  function handleGlobalMouseUp(event) {
    if (!isDragging) return;
    
    document.body.style.overflow = '';
    isDragging = false;
    
    if (activeAction && activeComponent) {
      const element = document.querySelector(`[data-component-id="${activeComponent.id}"]`);
      if (element) {
        element.classList.remove('dragging');
      }

      if (activeAction === 'drag') {
        // For final positioning, use more precise logic
        const coords = getEventCoordinates(event);
        const deltaX = coords.x - dragStart.x;
        const deltaY = coords.y - dragStart.y;
        
        const rect = gridContainer.getBoundingClientRect();
        const cellWidth = rect.width / GRID_COLS;
        const cellHeight = MIN_CELL_HEIGHT;
        
        const gridDeltaX = Math.round(deltaX / cellWidth);
        const gridDeltaY = Math.round(deltaY / cellHeight);
        
        const finalX = Math.max(0, Math.min(GRID_COLS - activeComponent.w, 
          componentStart.x + gridDeltaX));
        const finalY = Math.max(0, componentStart.y + gridDeltaY);
        
        // Use snap positioning for final placement
        const snapPosition = findSnapPosition(finalX, finalY, activeComponent);
        
        // Apply final position
        updateComponentPosition(activeComponent.id, { 
          x: snapPosition.x, 
          y: snapPosition.y 
        });
      }
      
      saveLayout();
    }
    
    activeAction = null;
    activeComponent = null;
  }

  // Touch event handlers
  function handleTouchStart(event, item, action = 'drag') {
    if (!$isEditMode) return;
    
    if (event.touches.length === 1) {
      isMultiTouch = false;
      if (action === 'drag') {
        startDrag(event, item);
      } else if (action === 'resize') {
        startResize(event, item);
      }
    } else if (event.touches.length === 2) {
      isMultiTouch = true;
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      initialPinchDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
    }
  }

  function handleGlobalTouchMove(event) {
    if (isMultiTouch && event.touches.length === 2) {
      event.preventDefault();
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scale = currentDistance / initialPinchDistance;
      if (gridContainer) {
        gridContainer.style.transform = `scale(${Math.max(0.5, Math.min(2, scale))})`;
        gridContainer.style.transformOrigin = 'center center';
      }
    } else if (!isMultiTouch && activeAction && activeComponent) {
      event.preventDefault();
      handleGlobalMouseMove(event);
    }
  }

  function handleGlobalTouchEnd(event) {
    if (event.touches.length === 0) {
      isMultiTouch = false;
      if (gridContainer) {
        gridContainer.style.transform = '';
      }
      handleGlobalMouseUp(event);
    }
  }

  // Update component position
  function updateComponentPosition(id, changes) {
    layout.update(items => 
      items.map(item => 
        item.id === id ? { ...item, ...changes } : item
      )
    );
  }

  // Handle calculation results
  function handleCalculationComplete(event) {
    calculationResults = event.detail.results;
    inputData = event.detail.inputData;
    
    // Auto-expand PricingMatrix when results are available
    const pricingMatrixComponent = $layout.find(item => item.component === 'PricingMatrix');
    if (pricingMatrixComponent && pricingMatrixComponent.h < 8) {
      updateComponentPosition(pricingMatrixComponent.id, { h: 10 });
      saveLayout();
    }
    
    console.log('Calculation completed:', event.detail);
  }

  function handleResultsCleared() {
    calculationResults = null;
    inputData = {};
    
    // Auto-shrink PricingMatrix when results are cleared
    const pricingMatrixComponent = $layout.find(item => item.component === 'PricingMatrix');
    if (pricingMatrixComponent && pricingMatrixComponent.h > 6) {
      updateComponentPosition(pricingMatrixComponent.id, { h: 4 });
      saveLayout();
    }
  }

  // Handle component requests from CalculationEngine
  function handleRequestComponent(event) {
    console.log('Component requested:', event.detail);
    const { type } = event.detail;
    if (type === 'PricingMatrix') {
      // Check if PricingMatrix already exists
      const existingMatrix = $layout.find(item => item.component === 'PricingMatrix');
      if (!existingMatrix) {
        console.log('Adding PricingMatrix component');
        addComponent('PricingMatrix');
      } else {
        console.log('PricingMatrix already exists');
      }
    }
  }

  // Check if PricingMatrix component exists
  function hasPricingMatrix() {
    return $layout.some(item => item.component === 'PricingMatrix');
  }
</script>

<svelte:head>
  <title>Terminal - Deltuh</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-3 sm:p-4">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
    <div class="text-left flex items-center gap-4">
      <img src="/deltuh logo.svg" alt="Deltuh Logo" class="h-16 w-auto">
      <div>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">Terminal</h1>
        <p class="text-base sm:text-lg lg:text-xl text-gray-400 mt-2">Your customizable analytics workspace.</p>
      </div>
    </div>
    <div class="flex items-center gap-3 sm:gap-4">
      <button 
        on:click={() => showComponentSelector = true}
        class="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 sm:px-5 rounded-lg transition-all text-sm sm:text-base flex items-center gap-2"
      >
        <svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span class="hidden sm:inline">Add Component</span>
        <span class="sm:hidden">Add</span>
      </button>
      
      <!-- Reset Layout Button -->
      <button 
        on:click={resetLayout}
        class="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 sm:px-5 rounded-lg transition-all text-sm sm:text-base"
      >
        <span>Reset</span>
      </button>
      
      <button 
        on:click={toggleEditMode}
        class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 sm:px-5 rounded-lg transition-all text-sm sm:text-base flex items-center gap-2 {$isEditMode ? 'ring-2 ring-indigo-500' : ''}"
      >
        <svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="hidden sm:inline">{$isEditMode ? 'Lock Layout' : 'Customize'}</span>
        <span class="sm:hidden">{$isEditMode ? 'Lock' : 'Edit'}</span>
      </button>
    </div>
  </div>
  
  {#if $isEditMode}
    <div class="mb-6 bg-indigo-900/30 border border-indigo-700 text-indigo-300 p-4 rounded-lg text-center">
      <svg class="mx-auto h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
      <p class="font-medium">Edit mode active - Drag to move • Resize from bottom-right • Drop on components to swap</p>
      <p class="text-sm mt-1 opacity-80">You have full control over component sizes - resize as small or large as needed</p>
    </div>
  {/if}
  
  <!-- Enhanced Grid Layout -->
  <div 
    class="grid grid-cols-12 gap-3 sm:gap-4 grid-container" 
    style="grid-auto-rows: {MIN_CELL_HEIGHT}px; min-height: 400px; position: relative;"
    bind:this={gridContainer}
  >
    {#each $layout as item (item.id)}
      <div
        class="relative component-container {$isEditMode ? 'edit-mode' : ''} {activeComponent?.id === item.id ? 'active' : ''} {isDragging && activeComponent?.id === item.id ? 'dragging' : ''}"
        style={getGridStyle(item)}
        data-component-id={item.id}
        on:mousedown={(e) => startDrag(e, item)}
        on:touchstart={(e) => handleTouchStart(e, item, 'drag')}
        role="button"
        tabindex="0"
        aria-label="Drag to reposition component"
      >
        {#if $isEditMode}
          <div class="absolute top-2 right-2 z-30 flex gap-2">
            <!-- Drag handle -->
            <div 
              class="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-md shadow-lg cursor-move drag-handle"
              title="Drag to move"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <!-- Remove button -->
            <button
              on:click={() => handleRemoveComponent(item.id)}
              class="bg-red-600 hover:bg-red-500 text-white p-2 rounded-md shadow-lg"
              title="Remove component"
              aria-label="Remove component"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Enhanced resize handle -->
          <div 
            class="absolute bottom-1 right-1 w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 cursor-se-resize resize-handle opacity-80 hover:opacity-100 transition-all duration-200 rounded-tl-lg flex items-center justify-center"
            on:mousedown={(e) => startResize(e, item)}
            on:touchstart={(e) => handleTouchStart(e, item, 'resize')}
            title="Drag to resize"
            role="button"
            tabindex="0"
            aria-label="Drag to resize component"
          >
            <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>

          <!-- Grid overlay for visual feedback -->
          <div class="absolute inset-0 grid-overlay pointer-events-none opacity-10">
            <div class="w-full h-full border-2 border-dashed border-indigo-400 rounded-lg bg-indigo-500/5"></div>
          </div>
        {/if}
        
        <!-- Component content with flexible overflow -->
        <div class="h-full w-full overflow-auto component-content">
          {#if components[item.component]}
            <svelte:component 
              this={components[item.component]} 
              config={item.config}
              {calculationResults}
              {inputData}
              hasPricingMatrix={hasPricingMatrix()}
              on:configChange={(e) => handleConfigChange(item.id, e.detail.config)}
              on:remove={() => handleRemoveComponent(item.id)}
              on:calculationComplete={handleCalculationComplete}
              on:resultsCleared={handleResultsCleared}
              on:requestComponent={handleRequestComponent}
            />
          {/if}
        </div>
      </div>
    {/each}
    
    <!-- Empty state when no components -->
    {#if $layout.length === 0}
      <div class="col-span-12 flex flex-col items-center justify-center p-12 text-center">
        <svg class="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 class="text-xl font-semibold text-gray-400 mb-2">No Components Yet</h3>
        <p class="text-gray-500 mb-6">Add components to build your analytics workspace</p>
        <div class="flex gap-3">
          <button 
            on:click={() => showComponentSelector = true}
            class="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-6 rounded-lg transition-all"
          >
            Add Your First Component
          </button>
          <button 
            on:click={resetLayout}
            class="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg transition-all"
          >
            Start with Calculation Engine
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Component Selector Modal -->
{#if showComponentSelector}
  <ComponentSelector 
    {componentRegistry}
    on:addComponent={(e) => addComponent(e.detail.componentType)}
    on:close={() => showComponentSelector = false} 
  />
{/if}

<style>
  /* Enhanced component container styles */
  .component-container {
    transition: all 0.2s ease;
    position: relative;
    background: rgba(31, 41, 55, 0.8);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(75, 85, 99, 0.3);
  }
  
  .component-container.edit-mode {
    cursor: grab;
    border: 2px dashed transparent;
  }
  
  .component-container.edit-mode:hover {
    border-color: rgba(99, 102, 241, 0.6);
    transform: scale(1.005);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15);
    background: rgba(31, 41, 55, 0.9);
  }
  
  .component-container.active {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4);
    z-index: 50;
    background: rgba(31, 41, 55, 0.95);
  }
  
  .component-container.dragging {
    cursor: grabbing;
    opacity: 0.85;
    transform: rotate(1deg) scale(1.03);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    z-index: 100;
    border-color: #8b5cf6 !important;
  }
  
  /* Enhanced drag handle styles */
  .drag-handle {
    cursor: grab;
    transition: all 0.2s ease;
    background: linear-gradient(135deg, #6b7280, #4b5563);
  }
  
  .drag-handle:hover {
    transform: scale(1.1);
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
  }
  
  .drag-handle:active {
    cursor: grabbing;
    transform: scale(0.95);
  }
  
  /* Enhanced resize handle styles */
  .resize-handle {
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .resize-handle:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }
  
  .resize-handle:active {
    transform: scale(0.9);
  }
  
  /* Grid overlay for visual feedback */
  .grid-overlay {
    background-image: 
      linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
    border-radius: 12px;
  }
  
  /* Enhanced grid container */
  .grid-container {
    transform-origin: center center;
    transition: transform 0.2s ease-out;
    touch-action: manipulation;
    position: relative;
    isolation: isolate;
  }
  
  /* Prevent separation during scroll */
  .grid-container::before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    background: transparent;
    pointer-events: none;
    z-index: -1;
  }
  
  /* Custom scrollbars for all components */
  :global(.component-container *::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
  }

  :global(.component-container *::-webkit-scrollbar-track) {
    background-color: rgba(55, 65, 81, 0.3);
    border-radius: 4px;
  }

  :global(.component-container *::-webkit-scrollbar-thumb) {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 4px;
    border: 1px solid rgba(55, 65, 81, 0.5);
  }

  :global(.component-container *::-webkit-scrollbar-thumb:hover) {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
  }

  :global(.component-container *::-webkit-scrollbar-corner) {
    background-color: rgba(55, 65, 81, 0.3);
  }

  /* Firefox scrollbar support */
  :global(.component-container *) {
    scrollbar-width: thin;
    scrollbar-color: #6366f1 rgba(55, 65, 81, 0.3);
  }
  
  /* Force stable positioning */
  :global(.component-container) {
    contain: layout style paint;
    will-change: transform;
  }
  
  /* Prevent layout shifts during scroll */
  :global(body) {
    overflow-x: hidden;
  }
  
  /* Mobile-optimized styles */
  @media (max-width: 768px) {
    .component-container.edit-mode {
      min-height: 120px;
    }
    
    .drag-handle, .resize-handle {
      min-width: 44px;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .grid-container {
      grid-template-columns: repeat(6, 1fr);
      gap: 0.75rem;
      padding: 0.5rem;
    }
  }
  
  /* Original custom scrollbar styles for backward compatibility */
  :global(.custom-scrollbar::-webkit-scrollbar) {
    height: 8px;
    width: 8px;
  }
  :global(.custom-scrollbar::-webkit-scrollbar-track) {
    background-color: #374151;
    border-radius: 4px;
  }
  :global(.custom-scrollbar::-webkit-scrollbar-thumb) {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 4px;
  }
  :global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
  }
  
  /* Accessibility improvements */
  .component-container:focus-visible {
    outline: 2px solid #6366f1;
    outline-offset: 2px;
  }
  
  .drag-handle:focus-visible,
  .resize-handle:focus-visible {
    outline: 2px solid #fbbf24;
    outline-offset: 2px;
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .component-container,
    .drag-handle,
    .resize-handle,
    .grid-container {
      transition: none;
    }
    
    .component-container.edit-mode:hover {
      transform: none;
    }
  }
</style>