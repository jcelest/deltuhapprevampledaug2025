<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authToken } from '../../stores/authStore.js';
  import axios from 'axios';
  
  // Import components
  import CalculationEngine from '../../lib/components/CalculationEngine.svelte';
  import PricingMatrix from '../../lib/components/PricingMatrix.svelte';
  import GreeksDashboard from '../../lib/components/GreeksDashboard.svelte';
  import MarketData from '../../lib/components/MarketData.svelte';
  import IVRank from '../../lib/components/IVRank.svelte';
  import ComponentSelector from '../../lib/components/ComponentSelector.svelte';
  import SaveTerminalModal from '../../lib/components/SaveTerminalModal.svelte';
  
  // Component registry
  const components = {
    CalculationEngine,
    PricingMatrix,
    GreeksDashboard,
    MarketData,
    IVRank
  };

  const componentRegistry = {
    CalculationEngine: { title: 'Calculation Engine', defaultSize: { w: 12, h: 7 } },
    PricingMatrix: { title: 'Pricing Matrix', defaultSize: { w: 12, h: 4 } },
    GreeksDashboard: { title: 'Greeks Dashboard', defaultSize: { w: 6, h: 5 } },
    MarketData: { title: 'Market Data', defaultSize: { w: 6, h: 5 } },
    IVRank: { title: 'IV Rank', defaultSize: { w: 6, h: 5 } }
  };

  // Layout state
  let layout = writable([
    { id: 'calculation-engine', component: 'CalculationEngine', x: 0, y: 0, w: 12, h: 7, config: {} }
  ]);

  let isEditMode = writable(false);
  let showComponentSelector = false;
  let showSaveModal = false;
  let isSavingTerminal = false;
  let calculationResults = null;
  let inputData = {};
  let currentTerminalId = null;
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // Drag and resize state
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

  // Mobile state with proper device detection
  let isMobile = false;
  let isLandscape = false;
  let initialPinchDistance = 0;
  let isMultiTouch = false;

  onMount(async () => {
    // Check if loading a saved terminal
    const urlParams = new URLSearchParams(window.location.search);
    const terminalId = urlParams.get('id');
    
    if (terminalId) {
      await loadSavedTerminal(terminalId);
    } else {
      loadLayout();
    }
    
    updateDeviceInfo();
    
    // Add event listeners
    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);
    document.addEventListener('click', handleGlobalClick, true);
    document.addEventListener('touchend', handleGlobalClick, true);
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    setTimeout(autoExpandComponents, 200);
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('click', handleGlobalClick, true);
      document.removeEventListener('touchend', handleGlobalClick, true);
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  });

  function updateDeviceInfo() {
    if (typeof window === 'undefined') return;
    
    // Detect if it's actually a mobile/tablet device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasSmallScreen = window.screen.width <= 768 || window.screen.height <= 768;
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // True mobile detection - not just window width
    isMobile = isTouchDevice && (hasSmallScreen || isMobileUA);
    
    // Detect landscape orientation
    isLandscape = window.innerWidth > window.innerHeight;
  }

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
    if (!$isEditMode) {
      hoveredComponent = null;
      activeComponent = null;
    }
  }

  function addComponent(componentType) {
    const newId = `${componentType.toLowerCase()}-${Date.now()}`;
    const defaultSize = componentRegistry[componentType]?.defaultSize || { w: 6, h: 6 };
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

  function findNextAvailableRow() {
    const currentLayout = $layout;
    if (currentLayout.length === 0) return 0;
    const maxY = Math.max(...currentLayout.map(item => item.y + item.h));
    return maxY;
  }

  function resetLayout() {
    layout.set([
      { id: 'calculation-engine', component: 'CalculationEngine', x: 0, y: 0, w: 12, h: 7, config: {} }
    ]);
    saveLayout();
    showComponentSelector = false;
  }

  function getGridStyle(item) {
    if (isMobile) {
      if (isLandscape) {
        // Mobile landscape: use a 2-column flexible grid
        return `
          width: calc(50% - 0.375rem);
          margin-bottom: 0.75rem;
          display: flex;
          flex-direction: column;
        `;
      } else {
        // Mobile portrait: full width stacking
        return '';
      }
    }
    
    // Desktop grid (unchanged)
    const colSpan = Math.max(MIN_COMPONENT_WIDTH, Math.min(GRID_COLS, item.w));
    const colStart = Math.max(1, Math.min(GRID_COLS - colSpan + 1, item.x + 1));
    const rowSpan = Math.max(MIN_COMPONENT_HEIGHT, item.h);
    
    return `
      grid-column: ${colStart} / span ${colSpan};
      grid-row: ${item.y + 1} / span ${rowSpan};
      min-height: ${MIN_CELL_HEIGHT * rowSpan}px;
      height: fit-content;
    `;
  }

  function getEventCoordinates(event) {
    if (event.touches) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    return { x: event.clientX, y: event.clientY };
  }

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

  function swapComponents(component1Id, component2Id) {
    layout.update(items => {
      const comp1Index = items.findIndex(item => item.id === component1Id);
      const comp2Index = items.findIndex(item => item.id === component2Id);
      
      if (comp1Index !== -1 && comp2Index !== -1) {
        const comp1 = items[comp1Index];
        const comp2 = items[comp2Index];
        
        if (isMobile) {
          const newItems = [...items];
          newItems[comp1Index] = comp2;
          newItems[comp2Index] = comp1;
          return newItems;
        }
        
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

  function handleGlobalMouseMove(event) {
    if (!activeAction || !activeComponent || !isDragging) return;
    
    event.preventDefault();
    
    const coords = getEventCoordinates(event);
    
    if (activeAction === 'drag') {
      const targetComponent = findComponentAtPosition(coords.x, coords.y, activeComponent.id);
      
      if (targetComponent && targetComponent.id !== hoveredComponent?.id) {
        if (hoveredComponent) {
          const prevElement = document.querySelector(`[data-component-id="${hoveredComponent.id}"]`);
          if (prevElement) prevElement.classList.remove('swap-target');
        }
        
        hoveredComponent = targetComponent;
        const targetElement = document.querySelector(`[data-component-id="${targetComponent.id}"]`);
        if (targetElement) targetElement.classList.add('swap-target');
        
      } else if (!targetComponent && hoveredComponent) {
        const prevElement = document.querySelector(`[data-component-id="${hoveredComponent.id}"]`);
        if (prevElement) prevElement.classList.remove('swap-target');
        hoveredComponent = null;
      }
      
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
        
        updateComponentPosition(activeComponent.id, { x: constrainedX, y: constrainedY });
      }
      
    } else if (activeAction === 'resize' && !isMobile) {
      const currentGridPos = pixelToGrid(coords.x, coords.y);
      const startGridPos = pixelToGrid(dragStart.x, dragStart.y);
      
      const deltaX = currentGridPos.x - startGridPos.x;
      const deltaY = currentGridPos.y - startGridPos.y;
      
      const newW = Math.max(1, Math.min(GRID_COLS - activeComponent.x, componentStart.w + deltaX));
      const newH = Math.max(1, componentStart.h + deltaY);
      
      updateComponentPosition(activeComponent.id, { w: newW, h: newH });
    }
  }

  function handleGlobalMouseUp(event) {
    if (!isDragging) return;
    
    document.body.style.overflow = '';
    isDragging = false;
    
    if (activeAction && activeComponent) {
      const element = document.querySelector(`[data-component-id="${activeComponent.id}"]`);
      if (element) element.classList.remove('dragging');

      if (activeAction === 'drag') {
        if (hoveredComponent) {
          swapComponents(activeComponent.id, hoveredComponent.id);
          
          const hoveredElement = document.querySelector(`[data-component-id="${hoveredComponent.id}"]`);
          if (hoveredElement) hoveredElement.classList.remove('swap-target');
          hoveredComponent = null;
        } else if (!isMobile) {
          const coords = getEventCoordinates(event);
          const deltaX = coords.x - dragStart.x;
          const deltaY = coords.y - dragStart.y;
          
          const rect = gridContainer.getBoundingClientRect();
          const cellWidth = rect.width / GRID_COLS;
          const cellHeight = MIN_CELL_HEIGHT;
          
          const gridDeltaX = Math.round(deltaX / cellWidth);
          const gridDeltaY = Math.round(deltaY / cellHeight);
          
          const finalX = Math.max(0, Math.min(GRID_COLS - activeComponent.w, componentStart.x + gridDeltaX));
          const finalY = Math.max(0, componentStart.y + gridDeltaY);
          
          updateComponentPosition(activeComponent.id, { x: finalX, y: finalY });
        }
      }
      
      saveLayout();
    }
    
    activeAction = null;
    activeComponent = null;
    draggedElement = null;
  }

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
      if (gridContainer) gridContainer.style.transform = '';
      handleGlobalMouseUp(event);
    }
  }

  function updateComponentPosition(id, changes) {
    layout.update(items => 
      items.map(item => 
        item.id === id ? { ...item, ...changes } : item
      )
    );
  }

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

  function handleGridKeydown(e) {
    if (e.key === 'Escape' && $isEditMode && activeComponent) {
      activeComponent = null;
      document.querySelectorAll('.component-container.active').forEach(el => {
        el.classList.remove('active');
      });
    }
  }

  function handleCalculationComplete(event) {
    calculationResults = event.detail.results;
    inputData = event.detail.inputData;
    
    const pricingMatrixComponent = $layout.find(item => item.component === 'PricingMatrix');
    if (pricingMatrixComponent) {
      const optimalHeight = 12;
      if (pricingMatrixComponent.h < optimalHeight) {
        updateComponentPosition(pricingMatrixComponent.id, { h: optimalHeight });
        saveLayout();
      }
    }
    
    autoExpandComponents();
  }

  function handleResultsCleared() {
    calculationResults = null;
    inputData = {};
  }
  
  function autoExpandComponents() {
    setTimeout(() => {
      $layout.forEach(item => {
        const element = document.querySelector(`[data-component-id="${item.id}"] .component-content`);
        if (element && !isMobile) {
          const scrollHeight = element.scrollHeight;
          const clientHeight = element.clientHeight;
          
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

  function handleRequestComponent(event) {
    const { type } = event.detail;
    if (type === 'PricingMatrix') {
      const existingMatrix = $layout.find(item => item.component === 'PricingMatrix');
      if (!existingMatrix) {
        addComponent('PricingMatrix');
      }
    }
  }

  function hasPricingMatrix() {
    return $layout.some(item => item.component === 'PricingMatrix');
  }

  // Save and load terminal functions
  async function loadSavedTerminal(terminalId) {
    try {
      const token = $authToken;
      if (!token) {
        goto('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/api/terminals/${terminalId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const terminal = response.data;
      
      // Load the terminal state
      if (terminal.layout && terminal.layout.length > 0) {
        layout.set(terminal.layout);
      }
      if (terminal.calculationResults) {
        calculationResults = terminal.calculationResults;
      }
      if (terminal.inputData) {
        inputData = terminal.inputData;
      }
      
      currentTerminalId = terminalId;
      
      setTimeout(autoExpandComponents, 200);
    } catch (error) {
      console.error('Error loading terminal:', error);
      alert('Failed to load terminal. It may have been deleted or you may not have access to it.');
      goto('/dashboard');
    }
  }

  async function handleSaveTerminal(event) {
    const { name, description } = event.detail;
    
    try {
      isSavingTerminal = true;
      const token = $authToken;
      
      if (!token) {
        goto('/login');
        return;
      }

      const terminalData = {
        name,
        description,
        layout: $layout,
        calculationResults,
        inputData,
        ticker: inputData.ticker || '',
        optionType: inputData.optionType || ''
      };

      if (currentTerminalId) {
        // Update existing terminal
        await axios.put(
          `${API_URL}/api/terminals/${currentTerminalId}`,
          terminalData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Create new terminal
        const response = await axios.post(
          `${API_URL}/api/terminals`,
          terminalData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        currentTerminalId = response.data.terminal._id;
      }

      showSaveModal = false;
      isSavingTerminal = false;
      
      // Show success message (you could add a toast notification here)
      alert('Terminal saved successfully!');
    } catch (error) {
      console.error('Error saving terminal:', error);
      isSavingTerminal = false;
      alert('Failed to save terminal. Please try again.');
    }
  }

  function openSaveModal() {
    const token = $authToken;
    if (!token) {
      goto('/login');
      return;
    }
    showSaveModal = true;
  }
</script>

<svelte:head>
  <title>Terminal - Deltuh</title>
</svelte:head>

<div class="terminal-container">
  <!-- Header -->
  <div class="terminal-header">
    <!-- Mobile Header -->
    <div class="mobile-header">
      <img src="/deltuh logo.svg" alt="Deltuh Logo" class="deltuh-logo-mobile">
      <div class="mobile-title-section">
        <h1 class="terminal-title-mobile">Terminal</h1>
        <p class="terminal-subtitle-mobile">Your analytics workspace</p>
      </div>
    </div>
    
    <!-- Desktop Header -->
    <div class="desktop-header">
      <div class="desktop-title-section">
        <img src="/deltuh logo.svg" alt="Deltuh Logo" class="deltuh-logo-desktop">
        <div class="title-content">
          <h1 class="terminal-title-desktop">Terminal</h1>
          <p class="terminal-subtitle-desktop">Your customizable analytics workspace.</p>
        </div>
      </div>
      <div class="desktop-controls">
        <button 
          on:click={openSaveModal}
          class="control-button save-button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save Terminal
        </button>
        
        <button 
          on:click={() => showComponentSelector = true}
          class="control-button primary-button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Component
        </button>
        
        <button 
          on:click={resetLayout}
          class="control-button secondary-button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>
        
        <button 
          on:click={toggleEditMode}
          class="control-button tertiary-button"
          class:active={$isEditMode}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {$isEditMode ? 'Lock Layout' : 'Customize'}
        </button>
      </div>
    </div>
    
    <!-- Mobile Controls -->
    <div class="mobile-controls">
      <button 
        on:click={openSaveModal}
        class="mobile-button save-mobile"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        Save
      </button>
      
      <button 
        on:click={() => showComponentSelector = true}
        class="mobile-button primary-mobile"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add
      </button>
      
      <button 
        on:click={toggleEditMode}
        class="mobile-button secondary-mobile"
        class:active={$isEditMode}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        {$isEditMode ? 'Lock' : 'Edit'}
      </button>
      
      <button 
        on:click={resetLayout}
        class="mobile-button tertiary-mobile"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset
      </button>
    </div>
  </div>
  
  {#if $isEditMode}
    <div class="edit-mode-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
      <p class="edit-message-mobile">Edit mode - Drag over components to swap positions</p>
      <div class="edit-message-desktop">
        <p class="edit-primary">Edit mode - Drag to move • Drag over another component to swap • Resize from bottom-right</p>
        <p class="edit-secondary">Components will swap positions when you drop one on another</p>
      </div>
    </div>
  {/if}
  
  <!-- Grid Layout -->
  <div 
    class="grid-container w-full text-left" 
    class:mobile-landscape={isMobile && isLandscape}
    bind:this={gridContainer}
    on:click={handleBackgroundClick}
    on:keydown={handleGridKeydown}
    role="region"
    aria-label="Component layout grid"
  >
    {#each $layout as item (item.id)}
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <div
        class="component-container"
        class:edit-mode={$isEditMode}
        class:active={activeComponent?.id === item.id}
        class:dragging={isDragging && activeComponent?.id === item.id}
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
        role={$isEditMode ? "button" : "region"}
        tabindex={$isEditMode ? "0" : "-1"}
        aria-label={$isEditMode ? `Select and drag ${componentRegistry[item.component]?.title || item.component} component` : `${componentRegistry[item.component]?.title || item.component} component`}
      >
        {#if $isEditMode}
          <div class="absolute top-2 right-2 z-30 flex gap-2">
            <button 
              class="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-md shadow-lg cursor-move drag-handle"
              title="Drag to move or swap"
              aria-label="Drag to move or swap component"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
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

          {#if !isMobile}
            <button 
              class="absolute bottom-1 right-1 w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 cursor-se-resize resize-handle opacity-80 hover:opacity-100 transition-all duration-200 rounded-tl-lg flex items-center justify-center"
              on:mousedown={(e) => startResize(e, item)}
              on:touchstart={(e) => handleTouchStart(e, item, 'resize')}
              title="Drag to resize"
              aria-label={`Resize ${componentRegistry[item.component]?.title || item.component} component`}
            >
              <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          {/if}

          <div class="absolute inset-0 grid-overlay pointer-events-none opacity-10">
            <div class="w-full h-full border-2 border-dashed border-indigo-400 rounded-lg bg-indigo-500/5"></div>
          </div>
        {/if}
        
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
      </div>
    {/each}
    
    {#if $layout.length === 0}
      <div class="empty-workspace">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 class="empty-title">No Components Yet</h3>
        <p class="empty-description">Add components to build your analytics workspace</p>
        <div class="empty-actions">
          <button 
            on:click={() => showComponentSelector = true}
            class="empty-button primary-empty"
          >
            Add Your First Component
          </button>
          <button 
            on:click={resetLayout}
            class="empty-button secondary-empty"
          >
            Start with Calculation Engine
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

{#if showComponentSelector}
  <ComponentSelector 
    {componentRegistry}
    on:addComponent={(e) => addComponent(e.detail.componentType)}
    on:close={() => showComponentSelector = false} 
  />
{/if}

<SaveTerminalModal
  show={showSaveModal}
  isSaving={isSavingTerminal}
  on:save={handleSaveTerminal}
  on:close={() => showSaveModal = false}
/>

<style>
  .terminal-container {
    max-width: 1792px;
    margin: 0 auto;
    padding: 0.75rem;
  }

  @media (min-width: 640px) {
    .terminal-container {
      padding: 1rem;
    }
  }

  .terminal-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (min-width: 640px) {
    .terminal-header {
      margin-bottom: 2.5rem;
    }
  }

  .mobile-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.75rem;
  }

  @media (min-width: 640px) {
    .mobile-header {
      display: none;
    }
  }

  .deltuh-logo-mobile {
    height: 3rem;
    width: auto;
    filter: brightness(1.1);
    opacity: 0.9;
  }

  .mobile-title-section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .terminal-title-mobile {
    font-size: 1.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #fff, #c4b5fd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }

  .terminal-subtitle-mobile {
    font-size: 0.875rem;
    color: #9ca3af;
    margin: 0;
  }

  .desktop-header {
    display: none;
  }

  @media (min-width: 640px) {
    .desktop-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
  }

  .desktop-title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .deltuh-logo-desktop {
    height: 4rem;
    width: auto;
    filter: brightness(1.1);
    opacity: 0.9;
  }

  .title-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .terminal-title-desktop {
    font-size: 1.875rem;
    font-weight: 800;
    background: linear-gradient(135deg, #fff, #c4b5fd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }

  @media (min-width: 1024px) {
    .terminal-title-desktop {
      font-size: 3rem;
    }
  }

  .terminal-subtitle-desktop {
    font-size: 1rem;
    color: #9ca3af;
    margin: 0;
  }

  @media (min-width: 1024px) {
    .terminal-subtitle-desktop {
      font-size: 1.25rem;
    }
  }

  .desktop-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .control-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.3s;
    cursor: pointer;
    border: none;
  }

  .control-button svg {
    width: 20px;
    height: 20px;
  }

  .primary-button {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    border: 1px solid transparent;
  }

  .primary-button:hover {
    background: linear-gradient(135deg, #16a34a, #15803d);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  }

  .secondary-button {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: 1px solid transparent;
  }

  .secondary-button:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .tertiary-button {
    background: rgba(31, 41, 55, 0.6);
    color: #94a3b8;
    border: 1px solid rgba(167, 139, 250, 0.2);
    backdrop-filter: blur(10px);
  }

  .tertiary-button:hover {
    background: rgba(31, 41, 55, 0.8);
    color: #c4b5fd;
    border-color: rgba(167, 139, 250, 0.3);
    transform: translateY(-1px);
  }

  .tertiary-button.active {
    background: linear-gradient(135deg, #a78bfa, #c4b5fd);
    color: white;
    border-color: transparent;
    box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.3);
  }

  .save-button {
    background: linear-gradient(135deg, #a855f7, #9333ea);
    color: white;
    border: 1px solid transparent;
  }

  .save-button:hover {
    background: linear-gradient(135deg, #9333ea, #7e22ce);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
  }

  .mobile-controls {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  @media (min-width: 640px) {
    .mobile-controls {
      display: none;
    }
  }

  .mobile-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.875rem;
    transition: all 0.3s;
    cursor: pointer;
    border: none;
    transform-origin: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .mobile-button:active {
    transform: scale(0.95);
  }

  .mobile-button svg {
    width: 20px;
    height: 20px;
  }

  .primary-mobile {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
  }

  .primary-mobile:hover {
    background: linear-gradient(135deg, #16a34a, #15803d);
  }

  .secondary-mobile {
    background: linear-gradient(135deg, #a78bfa, #c4b5fd);
    color: white;
  }

  .secondary-mobile:hover {
    background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  }

  .secondary-mobile.active {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.4);
  }

  .tertiary-mobile {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }

  .tertiary-mobile:hover {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
  }

  .save-mobile {
    background: linear-gradient(135deg, #a855f7, #9333ea);
    color: white;
  }

  .save-mobile:hover {
    background: linear-gradient(135deg, #9333ea, #7e22ce);
  }

  .edit-mode-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding: 0.875rem 1rem;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05));
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 12px;
    text-align: center;
    backdrop-filter: blur(10px);
  }

  .edit-mode-banner svg {
    width: 20px;
    height: 20px;
    color: #a78bfa;
    flex-shrink: 0;
  }

  @media (min-width: 640px) {
    .edit-mode-banner svg {
      width: 24px;
      height: 24px;
    }
  }

  .edit-message-mobile {
    font-size: 0.875rem;
    font-weight: 500;
    color: #c4b5fd;
    margin: 0;
  }

  @media (min-width: 640px) {
    .edit-message-mobile {
      display: none;
    }
  }

  .edit-message-desktop {
    display: none;
  }

  @media (min-width: 640px) {
    .edit-message-desktop {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
  }

  .edit-primary {
    font-size: 0.875rem;
    font-weight: 500;
    color: #c4b5fd;
    margin: 0;
  }

  .edit-secondary {
    font-size: 0.75rem;
    color: #a78bfa;
    margin: 0;
    opacity: 0.8;
  }

  .empty-workspace {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    min-height: 400px;
  }

  .empty-icon {
    width: 4rem;
    height: 4rem;
    color: #6b7280;
    margin-bottom: 1rem;
    stroke-width: 1.5;
  }

  .empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #9ca3af;
    margin: 0 0 0.5rem 0;
  }

  .empty-description {
    font-size: 1rem;
    color: #6b7280;
    margin: 0 0 1.5rem 0;
  }

  .empty-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .empty-button {
    padding: 0.625rem 1.5rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.3s;
    cursor: pointer;
    border: none;
  }

  .primary-empty {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
  }

  .primary-empty:hover {
    background: linear-gradient(135deg, #16a34a, #15803d);
    transform: translateY(-1px);
  }

  .secondary-empty {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }

  .secondary-empty:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    transform: translateY(-1px);
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 0.5rem;
    grid-auto-rows: minmax(70px, max-content);
    grid-auto-flow: dense;
    min-height: 400px;
    position: relative;
    background: none;
    border: none;
    padding: 0;
  }

  /* Mobile Landscape Grid Layout */
  .grid-container.mobile-landscape {
    display: flex !important;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem;
  }
  
  /* Clean seamless desktop layout - no containers visible by default */
  .component-container {
    transition: all 0.2s ease;
    position: relative;
    background: transparent;
    border-radius: 0;
    backdrop-filter: none;
    border: none;
    cursor: default;
    width: 100%;
    height: fit-content;
    min-height: 400px;
    text-align: left;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  
  /* Show container styling only in edit mode */
  .component-container.edit-mode {
    cursor: grab;
    border: 2px dashed rgba(99, 102, 241, 0.3);
    background: rgba(31, 41, 55, 0.6);
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }
  
  .component-container.edit-mode:hover {
    border-color: rgba(99, 102, 241, 0.6);
    transform: scale(1.005);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15);
    background: rgba(31, 41, 55, 0.8);
  }
  
  .component-container.active {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4);
    z-index: 50;
    background: rgba(31, 41, 55, 0.9) !important;
    border-radius: 12px !important;
  }
  
  .component-container.dragging {
    cursor: grabbing;
    opacity: 0.85;
    transform: rotate(1deg) scale(1.03);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    z-index: 100;
    border-color: #8b5cf6 !important;
    background: rgba(31, 41, 55, 0.9) !important;
    border-radius: 12px !important;
  }

  /* Swap target styling */
  .component-container.swap-target {
    border: 2px solid rgba(34, 197, 94, 0.6) !important;
    background: rgba(34, 197, 94, 0.1) !important;
    border-radius: 12px !important;
  }
  
  .component-content {
    height: 100%;
    width: 100%;
    overflow: auto;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 300px;
  }
  
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
  
  .grid-overlay {
    background-image: 
      linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
    border-radius: 12px;
  }

  /* Mobile styling - keep containers visible on mobile */
  @media (max-width: 1024px) {
    .component-container {
      background: rgba(31, 41, 55, 0.8);
      border: 1px solid rgba(75, 85, 99, 0.3);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .grid-container {
      gap: 1rem;
    }
  }

  /* Mobile Portrait Layout */
  @media (max-width: 768px) and (orientation: portrait) {
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
    
    .component-content {
      height: auto !important;
      min-height: auto !important;
      overflow: visible !important;
      flex: 1 0 auto;
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
  }

  /* Mobile Landscape Layout */
  @media (max-width: 1024px) and (orientation: landscape) {
    .grid-container.mobile-landscape .component-container {
      width: calc(50% - 0.375rem) !important;
      min-height: 350px;
      height: auto !important;
      margin-bottom: 0;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .grid-container.mobile-landscape .component-content {
      height: auto !important;
      min-height: 300px !important;
      overflow: visible !important;
      flex: 1 0 auto;
    }

    .grid-container.mobile-landscape .drag-handle {
      min-width: 44px;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 12px;
    }

    /* Ensure components stack nicely in landscape */
    .grid-container.mobile-landscape {
      align-content: flex-start;
      max-height: calc(100vh - 200px);
      overflow-y: auto;
    }

    /* Custom scrollbar for mobile landscape */
    .grid-container.mobile-landscape::-webkit-scrollbar {
      width: 6px;
    }

    .grid-container.mobile-landscape::-webkit-scrollbar-track {
      background: rgba(17, 24, 39, 0.5);
      border-radius: 3px;
    }

    .grid-container.mobile-landscape::-webkit-scrollbar-thumb {
      background: rgba(167, 139, 250, 0.3);
      border-radius: 3px;
    }

    .grid-container.mobile-landscape::-webkit-scrollbar-thumb:hover {
      background: rgba(167, 139, 250, 0.5);
    }
  }

  .component-container:focus-visible {
    outline: 2px solid #6366f1;
    outline-offset: 2px;
  }
  
  .drag-handle:focus-visible,
  .resize-handle:focus-visible {
    outline: 2px solid #fbbf24;
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .component-container,
    .drag-handle,
    .resize-handle,
    .control-button,
    .mobile-button,
    .empty-button {
      transition: none;
    }
    
    .component-container.edit-mode:hover,
    .control-button:hover,
    .mobile-button:hover,
    .empty-button:hover {
      transform: none;
    }
  }
</style>