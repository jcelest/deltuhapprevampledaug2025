// @ts-nocheck
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/** @type {LayoutItem[]} */
const defaultLayout = [
  { 
    id: 'calculator', 
    component: 'CalculationEngine', 
    x: 0, y: 0, w: 4, h: 11, 
    config: { 
      showAdvancedInputs: true,  // Default to true
      autoCalculate: true,
      defaultPriceIncrement: '1.0'
    } 
  },
  { 
    id: 'results', 
    component: 'PricingMatrix', 
    x: 4, y: 0, w: 8, h: 11, 
    config: {
      showHeatmap: true,
      showAnalyzer: true,
      colorScheme: 'default',
      fontSize: 'medium'
    } 
  }
];

export const layout = writable(defaultLayout);
export const isEditMode = writable(false);
export const calculationData = writable(null);

export function addComponent(componentType, config = {}) {
  const newComponent = {
    id: Date.now().toString(),
    component: componentType,
    x: 0, y: 0, w: 4, h: 6,
    config
  };
  layout.update(items => [...items, newComponent]);
}

export function removeComponent(id) {
  layout.update(items => items.filter(item => item.id !== id));
}

export function updateComponentConfig(id, newConfig) {
  layout.update(items => 
    items.map(item => 
      item.id === id ? { ...item, config: { ...item.config, ...newConfig } } : item
    )
  );
}

export function updateLayoutItem(id, changes) {
  layout.update(items => 
    items.map(item => 
      item.id === id ? { ...item, ...changes } : item
    )
  );
}

export function saveLayout() {
  if (browser) {
    try {
      layout.subscribe(items => {
        const layoutToSave = items.map(({ id, x, y, w, h }) => ({ id, x, y, w, h }));
        localStorage.setItem('terminalLayout', JSON.stringify(layoutToSave));
      })();
    } catch (e) {
      console.warn('localStorage not available');
    }
  }
}

export function loadLayout() {
  if (browser) {
    try {
      const savedLayout = localStorage.getItem('terminalLayout');
      if (savedLayout) {
        const parsedLayout = JSON.parse(savedLayout);
        if (Array.isArray(parsedLayout) && parsedLayout.every(item => 'id' in item)) {
          layout.update(items => 
            items.map(defaultItem => {
              const savedItem = parsedLayout.find(i => i.id === defaultItem.id);
              return savedItem ? { ...defaultItem, ...savedItem } : defaultItem;
            })
          );
        }
      }
    } catch (e) {
      console.error("Failed to parse saved layout:", e);
      if (browser) localStorage.removeItem('terminalLayout');
    }
  }
}