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
    CalculationEngine: { title: 'Calculation Engine', defaultSize: { w: 12, h: 7 } },
    PricingMatrix: { title: 'Pricing Matrix', defaultSize: { w: 12, h: 4 } },
    GreeksDashboard: { title: 'Greeks Dashboard', defaultSize: { w: 6, h: 5 } },
    MarketData: { title: 'Market Data', defaultSize: { w: 6, h: 5 } }
  };

  // Layout state - start with only CalculationEngine
  let layout = writable([
    { id: 'calculation-engine', component: 'CalculationEngine', x: 0, y: 0, w: 12, h: 7, config: {} }
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
  let hoveredComponent = null;
  let draggedElement = null;

  // Grid configuration
  const GRID_COLS = 12;
  const MIN_CELL_HEIGHT = 70;
  const MIN_COMPONENT_WIDTH = 2;
  const MIN_COMPONENT_HEIGHT = 2;

  // Mobile gesture state
  let initialPinchDistance = 0;
  let isMultiTouch = false;

  // Check if we're on mobile
  $: isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  onMount(() => {
    loadLayout();
    
    // Add global event listeners for drag operations
    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);
    
    // Add global click handler for unfocusing components
    document.addEventListener('click', handleGlobalClick, true);
    document.addEventListener('touchend', handleGlobalClick, true);
    
    // Auto-expand components after initial load
    setTimeout(autoExpandComponents, 200);
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('click', handleGlobalClick, true);
      document.removeEventListener('touchend', handleGlobalClick, true);
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
    // Clear any hover states when exiting edit mode
    if (!$isEditMode) {
      hoveredComponent = null;
      activeComponent = null;
    }
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
      { id: 'calculation-engine', component: 'CalculationEngine', x: 0, y: 0, w: 12, h: 7, config: {} }
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
    // On mobile, don't apply grid styles - let CSS handle it
    if (isMobile) {
      return '';
    }
    
    const colSpan = Math.max(MIN_COMPONENT_WIDTH, Math.min(GRID_COLS, item.w));
    const colStart = Math.max(1, Math.min(GRID_COLS - colSpan + 1, item.x + 1));
    const rowSpan = Math.max(MIN_COMPONENT_HEIGHT, item.h);
    
    // Use fit-content for height to auto-expand
    return `
      grid-column: ${colStart} / span ${colSpan};
      grid-row: ${item.y + 1} / span ${rowSpan};
      min-height: ${MIN_CELL_HEIGHT * rowSpan}px;
      height: fit-content;
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
    
    const gridX = Math.floor(relativeX / cellWidth);
    const gridY = Math.floor(relativeY / cellHeight);
    
    return { x: gridX, y: gridY };
  }

  // Find component at current cursor position for swapping
  function findComponentAtPosition(x, y, excludeId = null) {
    const coords = getEventCoordinates({ clientX: x, clientY: y });
    const elements = document.elementsFromPoint(coords.x, coords.y);
    
    for (const element of elements) {
      const componentElement = element.closest('.component-container');
      if (componentElement) {
        const componentId = componentElement.getAttribute('data-component-id');
        if (componentId && componentId !== excludeId) {
          return $layout.find(item => item.id === componentId);
        }
      }
    }
    return null;
  }

  // Swap two components' positions
  function swapComponents(component1Id, component2Id) {
    layout.update(items => {
      const comp1Index = items.findIndex(item => item.id === component1Id);
      const comp2Index = items.findIndex(item => item.id === component2Id);
      
      if (comp1Index !== -1 && comp2Index !== -1) {
        const comp1 = items[comp1Index];
        const comp2 = items[comp2Index];
        
        // For mobile, swap array positions
        if (isMobile) {
          const newItems = [...items];
          newItems[comp1Index] = comp2;
          newItems[comp2Index] = comp1;
          return newItems;
        }
        
        // For desktop, swap grid positions
        const temp = { x: comp1.x, y: comp1.y, w: comp1.w, h: comp1.h };
        
        return items.map(item => {
          if (item.id === component1Id) {
            return { ...item, x: comp2.x, y: comp2.y, w: comp2.w, h: comp2.h };
          } else if (item.id === component2Id) {
            return { ...item, x: temp.x, y: temp.y, w: temp.w, h: temp.h };
          }
          return item;
        });
      }
      return items;
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
      draggedElement = element;
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

  // Enhanced mouse move handler with swap detection
  function handleGlobalMouseMove(event) {
    if (!activeAction || !activeComponent || !isDragging) return;
    
    event.preventDefault();
    
    const coords = getEventCoordinates(event);
    
    if (activeAction === 'drag') {
      // Check if we're hovering over another component for swapping
      const targetComponent = findComponentAtPosition(coords.x, coords.y, activeComponent.id);
      
      // Update hover state
      if (targetComponent && targetComponent.id !== hoveredComponent?.id) {
        // Remove previous hover state
        if (hoveredComponent) {
          const prevElement = document.querySelector(`[data-component-id="${hoveredComponent.id}"]`);
          if (prevElement) {
            prevElement.classList.remove('swap-target');
          }
        }
        
        // Add new hover state
        hoveredComponent = targetComponent;
        const targetElement = document.querySelector(`[data-component-id="${targetComponent.id}"]`);
        if (targetElement) {
          targetElement.classList.add('swap-target');
        }
      } else if (!targetComponent && hoveredComponent) {
        // Clear hover state if not over any component
        const prevElement = document.querySelector(`[data-component-id="${hoveredComponent.id}"]`);
        if (prevElement) {
          prevElement.classList.remove('swap-target');
        }
        hoveredComponent = null;
      }
      
      // If not swapping, handle normal drag movement (desktop only)
      if (!hoveredComponent && !isMobile) {
        const deltaX = coords.x - dragStart.x;
        const deltaY = coords.y - dragStart.y;
        
        const rect = gridContainer.getBoundingClientRect();
        const cellWidth = rect.width / GRID_COLS;
        const cellHeight = MIN_CELL_HEIGHT;
        
        const sensitivity = 0.3;
        const gridDeltaX = Math.floor(deltaX / (cellWidth * sensitivity)) * sensitivity;
        const gridDeltaY = Math.floor(deltaY / (cellHeight * sensitivity)) * sensitivity;
        
        const rawNewX = componentStart.x + gridDeltaX;
        const rawNewY = componentStart.y + gridDeltaY;
        
        const snappedX = Math.round(rawNewX);
        const snappedY = Math.round(rawNewY);
        
        const constrainedX = Math.max(0, Math.min(GRID_COLS - activeComponent.w, snappedX));
        const constrainedY = Math.max(0, snappedY);
        
        updateComponentPosition(activeComponent.id, { 
          x: constrainedX, 
          y: constrainedY 
        });
      }
      
    } else if (activeAction === 'resize' && !isMobile) {
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

  // Enhanced mouse up handler with swap execution
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
        // Check if we should swap components
        if (hoveredComponent) {
          // Perform the swap
          swapComponents(activeComponent.id, hoveredComponent.id);
          
          // Clear hover state
          const hoveredElement = document.querySelector(`[data-component-id="${hoveredComponent.id}"]`);
          if (hoveredElement) {
            hoveredElement.classList.remove('swap-target');
          }
          hoveredComponent = null;
        } else if (!isMobile) {
          // For final positioning (desktop only)
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
          
          updateComponentPosition(activeComponent.id, { 
            x: finalX, 
            y: finalY 
          });
        }
      }
      
      saveLayout();
    }
    
    activeAction = null;
    activeComponent = null;
    draggedElement = null;
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

  // Handle clicking outside components to unfocus
  function handleBackgroundClick(event) {
    if ($isEditMode && activeComponent && !isDragging) {
      const clickedElement = event.target;
      const isGridBackground = clickedElement === gridContainer || 
                              clickedElement.classList.contains('grid-container') ||
                              clickedElement.closest('.component-container') === null;
      
      if (isGridBackground) {
        activeComponent = null;
        document.querySelectorAll('.component-container.active').forEach(el => {
          el.classList.remove('active');
        });
        event.stopPropagation();
      }
    }
  }

  // Global click handler for mobile unfocus
  function handleGlobalClick(event) {
    if ($isEditMode && activeComponent && !isDragging) {
      const clickedComponent = event.target.closest('.component-container');
      if (!clickedComponent) {
        activeComponent = null;
        document.querySelectorAll('.component-container.active').forEach(el => {
          el.classList.remove('active');
        });
      }
    }
  }

  // Handle calculation results
  function handleCalculationComplete(event) {
    calculationResults = event.detail.results;
    inputData = event.detail.inputData;
    
    // Auto-expand PricingMatrix when results are available
    const pricingMatrixComponent = $layout.find(item => item.component === 'PricingMatrix');
    if (pricingMatrixComponent) {
      // Set optimal height for content
      const optimalHeight = 12; // Adjust based on content needs
      if (pricingMatrixComponent.h < optimalHeight) {
        updateComponentPosition(pricingMatrixComponent.id, { h: optimalHeight });
        saveLayout();
      }
    }
    
    // Auto-expand all components to fit content
    autoExpandComponents();
  }

  function handleResultsCleared() {
    calculationResults = null;
    inputData = {};
    
    // Keep components at their current size when results are cleared
    // Users can manually resize if they want
  }
  
  // Auto-expand components to fit their content
  function autoExpandComponents() {
    // Wait for DOM updates
    setTimeout(() => {
      $layout.forEach(item => {
        const element = document.querySelector(`[data-component-id="${item.id}"] .component-content`);
        if (element && !isMobile) {
          const scrollHeight = element.scrollHeight;
          const clientHeight = element.clientHeight;
          
          // If content is scrollable, expand the component
          if (scrollHeight > clientHeight) {
            const currentHeight = item.h * MIN_CELL_HEIGHT;
            const neededHeight = Math.ceil(scrollHeight / MIN_CELL_HEIGHT);
            
            if (neededHeight > item.h) {
              updateComponentPosition(item.id, { h: neededHeight });
            }
          }
        }
      });
      saveLayout();
    }, 100);
  }

  // Handle component requests from CalculationEngine
  function handleRequestComponent(event) {
    const { type } = event.detail;
    if (type === 'PricingMatrix') {
      const existingMatrix = $layout.find(item => item.component === 'PricingMatrix');
      if (!existingMatrix) {
        addComponent('PricingMatrix');
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
  <div class="flex flex-col gap-4 mb-6 sm:mb-10">
    <!-- Mobile Header: Stacked and Centered -->
    <div class="flex flex-col items-center text-center gap-3 sm:hidden">
      <img src="/deltuh logo.svg" alt="Deltuh Logo" class="h-12 w-auto">
      <div>
        <h1 class="text-2xl font-extrabold text-white">Terminal</h1>
        <p class="text-sm text-gray-400">Your analytics workspace</p>
      </div>
    </div>
    
    <!-- Desktop Header: Side by Side -->
    <div class="hidden sm:flex justify-between items-center">
      <div class="text-left flex items-center gap-4">
        <img src="/deltuh logo.svg" alt="Deltuh Logo" class="h-16 w-auto">
        <div>
          <h1 class="text-3xl lg:text-5xl font-extrabold text-white">Terminal</h1>
          <p class="text-base lg:text-xl text-gray-400 mt-2">Your customizable analytics workspace.</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button 
          on:click={() => showComponentSelector = true}
          class="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-5 rounded-lg transition-all text-base flex items-center gap-2"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Component
        </button>
        
        <button 
          on:click={resetLayout}
          class="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-5 rounded-lg transition-all text-base"
        >
          Reset
        </button>
        
        <button 
          on:click={toggleEditMode}
          class="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-5 rounded-lg transition-all text-base flex items-center gap-2 {$isEditMode ? 'ring-2 ring-indigo-500' : ''}"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {$isEditMode ? 'Lock Layout' : 'Customize'}
        </button>
      </div>
    </div>
    
    <!-- Mobile Action Buttons -->
    <div class="flex justify-center gap-3 sm:hidden">
      <button 
        on:click={() => showComponentSelector = true}
        class="bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform active:scale-95 shadow-lg flex items-center gap-2"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add
      </button>
      
      <button 
        on:click={toggleEditMode}
        class="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform active:scale-95 shadow-lg {$isEditMode ? 'ring-2 ring-yellow-400' : ''}"
      >
        {$isEditMode ? '🔒 Lock' : '✨ Edit'}
      </button>
      
      <button 
        on:click={resetLayout}
        class="bg-red-500 hover:bg-red-400 active:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all transform active:scale-95 shadow-lg"
      >
        🔄 Reset
      </button>
    </div>
  </div>
  
  {#if $isEditMode}
    <div class="mb-6 bg-indigo-900/30 border border-indigo-700 text-indigo-300 p-3 sm:p-4 rounded-lg text-center">
      <svg class="mx-auto h-5 w-5 sm:h-6 sm:w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
      <!-- Mobile: Simplified message -->
      <p class="font-medium text-sm sm:hidden">Edit mode - Drag over components to swap positions</p>
      <!-- Desktop: Full message -->
      <div class="hidden sm:block">
        <p class="font-medium">Edit mode - Drag to move • Drag over another component to swap • Resize from bottom-right</p>
        <p class="text-sm mt-1 opacity-80">Components will swap positions when you drop one on another</p>
      </div>
    </div>
  {/if}
  
  <!-- Enhanced Grid Layout -->
  <button 
    class="grid-container w-full text-left" 
    bind:this={gridContainer}
    on:click={handleBackgroundClick}
    on:keydown={(e) => {
      if (e.key === 'Escape' && $isEditMode && activeComponent) {
        activeComponent = null;
        document.querySelectorAll('.component-container.active').forEach(el => {
          el.classList.remove('active');
        });
      }
    }}
    aria-label="Component layout grid"
    disabled={!$isEditMode}
  >
    {#each $layout as item (item.id)}
      <button
        class="component-container {$isEditMode ? 'edit-mode' : ''} {activeComponent?.id === item.id ? 'active' : ''} {isDragging && activeComponent?.id === item.id ? 'dragging' : ''}"
        style={getGridStyle(item)}
        data-component-id={item.id}
        on:mousedown={(e) => {
          if ($isEditMode) {
            e.stopPropagation();
            activeComponent = item;
            startDrag(e, item);
          }
        }}
        on:touchstart={(e) => {
          if ($isEditMode) {
            e.stopPropagation();
            activeComponent = item;
            handleTouchStart(e, item, 'drag');
          }
        }}
        on:click={(e) => {
          if ($isEditMode) {
            e.stopPropagation();
            activeComponent = item;
          }
        }}
        on:keydown={(e) => {
          if ($isEditMode) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              activeComponent = item;
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              activeComponent = null;
              document.querySelectorAll('.component-container.active').forEach(el => {
                el.classList.remove('active');
              });
            }
          }
        }}
        aria-label={$isEditMode ? `Select and drag ${componentRegistry[item.component]?.title || item.component} component` : `${componentRegistry[item.component]?.title || item.component} component`}
        aria-pressed={$isEditMode && activeComponent?.id === item.id ? "true" : "false"}
        disabled={!$isEditMode}
      >
        {#if $isEditMode}
          <div class="absolute top-2 right-2 z-30 flex gap-2">
            <!-- Drag handle -->
            <div 
              class="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-md shadow-lg cursor-move drag-handle"
              title="Drag to move or swap"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <!-- Remove button -->
            <button
              on:click={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleRemoveComponent(item.id);
              }}
              on:touchstart={(e) => {
                e.stopPropagation();
              }}
              class="bg-red-600 hover:bg-red-500 text-white p-2 rounded-md shadow-lg"
              title="Remove component"
              aria-label="Remove component"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Enhanced resize handle (desktop only) -->
          {#if !isMobile}
            <div 
              class="absolute bottom-1 right-1 w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 cursor-se-resize resize-handle opacity-80 hover:opacity-100 transition-all duration-200 rounded-tl-lg flex items-center justify-center"
              on:mousedown={(e) => startResize(e, item)}
              on:touchstart={(e) => handleTouchStart(e, item, 'resize')}
              title="Drag to resize"
              role="button"
              tabindex="0"
              aria-label={`Resize ${componentRegistry[item.component]?.title || item.component} component`}
            >
              <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
          {/if}

          <!-- Grid overlay for visual feedback -->
          <div class="absolute inset-0 grid-overlay pointer-events-none opacity-10">
            <div class="w-full h-full border-2 border-dashed border-indigo-400 rounded-lg bg-indigo-500/5"></div>
          </div>
        {/if}
        
        <!-- Component content with flexible overflow -->
        <div class="component-content">
          {#if components[item.component]}
            <svelte:component 
              this={components[item.component]} 
              config={item.config}
              {calculationResults}
              {inputData}
              {isMobile}
              hasPricingMatrix={hasPricingMatrix()}
              on:configChange={(e) => handleConfigChange(item.id, e.detail.config)}
              on:remove={() => handleRemoveComponent(item.id)}
              on:calculationComplete={handleCalculationComplete}
              on:resultsCleared={handleResultsCleared}
              on:requestComponent={handleRequestComponent}
            />
          {/if}
        </div>
      </button>
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
  </button>
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
  /* Grid container styles */
  .grid-container {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1rem;
    grid-auto-rows: minmax(70px, max-content);
    grid-auto-flow: dense;
    min-height: 400px;
    position: relative;
    background: none;
    border: none;
    padding: 0;
  }
  
  /* Enhanced component container styles */
  .component-container {
    transition: all 0.2s ease;
    position: relative;
    background: rgba(31, 41, 55, 0.8);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(75, 85, 99, 0.3);
    appearance: none;
    cursor: default;
    width: 100%;
    height: fit-content;
    min-height: 400px; /* Ensure minimum height for proper centering */
    text-align: left;
    padding: 0;
    background-color: transparent;
    display: flex;
    flex-direction: column;
  }
  
  .component-container:disabled {
    cursor: default;
  }
  
  .component-container.edit-mode {
    cursor: grab;
    border: 2px dashed transparent;
  }
  
  .component-container.edit-mode:not(:disabled) {
    cursor: grab;
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
  
  /* Swap target indicator */
  .component-container.swap-target {
    border-color: #10b981 !important;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.4);
    background: rgba(16, 185, 129, 0.1);
    animation: pulse 0.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }
  
  /* Component content styling */
  .component-content {
    height: 100%;
    width: 100%;
    overflow: auto;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 300px;
  }
  
  /* Force all component empty states to be centered */
  :global(.component-content > div) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  /* Target empty state containers specifically */
  :global(.empty-state),
  :global(.component-content .flex.flex-col.items-center.justify-center) {
    flex: 1;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    min-height: 100%;
  }
  
  /* Ensure PricingMatrix and other components center their empty states */
  :global(.component-content > div:has(svg):has(p)) {
    display: flex !important;
    flex-direction: column;
    align-items: center !important;
    justify-content: center !important;
    height: 100%;
    min-height: 300px;
  }
  
  /* Desktop: Auto-expand content by default */
  @media (min-width: 769px) {
    .component-content {
      height: auto !important;
      min-height: 100%;
      overflow: visible;
    }
    
    /* Allow scrolling only when manually resized smaller */
    .component-container.edit-mode .component-content {
      height: 100%;
      overflow: auto;
    }
  }
  
  /* Grid container button styling */
  .grid-container:disabled {
    cursor: default;
    opacity: 1;
  }
  
  .grid-container:not(:disabled) {
    cursor: pointer;
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
    .grid-container {
      display: flex !important;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.5rem;
    }
    
    .component-container {
      min-height: auto !important;
      height: auto !important;
      display: flex;
      flex-direction: column;
      width: 100% !important;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .component-container.edit-mode {
      min-height: auto !important;
    }
    
    /* Force component content to be fully visible on mobile */
    .component-content {
      height: auto !important;
      min-height: auto !important;
      overflow: visible !important;
      flex: 1 0 auto;
    }
    
    /* Ensure all child components expand properly */
    .component-content > * {
      height: auto !important;
      min-height: auto !important;
    }
    
    /* Disable grid positioning on mobile */
    .component-container[style*="grid-column"],
    .component-container[style*="grid-row"] {
      grid-column: unset !important;
      grid-row: unset !important;
    }
    
    .drag-handle {
      min-width: 48px;
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 12px;
    }
    
    /* Fun mobile interactions */
    .component-container.edit-mode:active {
      transform: scale(0.98);
    }
    
    /* Mobile-friendly touch targets */
    .component-container.edit-mode .absolute.top-2.right-2 {
      top: 8px;
      right: 8px;
      gap: 8px;
      z-index: 40; /* Ensure buttons are clickable */
    }
    
    /* Ensure remove button is clickable on mobile */
    .component-container.edit-mode button {
      position: relative;
      z-index: 50;
      touch-action: manipulation;
    }
    
    /* Swap animation on mobile */
    .component-container.swap-target {
      animation: mobile-pulse 0.3s ease-in-out infinite;
      border-color: #fbbf24 !important;
      box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.4);
    }
    
    @keyframes mobile-pulse {
      0%, 100% {
        transform: scale(1);
        background: rgba(251, 191, 36, 0.1);
      }
      50% {
        transform: scale(0.98);
        background: rgba(251, 191, 36, 0.2);
      }
    }
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
    
    .component-container.swap-target {
      animation: none;
    }
  }
</style>