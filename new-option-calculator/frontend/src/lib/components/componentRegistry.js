// @ts-nocheck
import CalculationEngine from './CalculationEngine.svelte';
import PricingMatrix from './PricingMatrix.svelte';
import GreeksDashboard from './GreeksDashboard.svelte';
import MarketData from './MarketData.svelte';

/**
 * @typedef {Object} ComponentConfig
 * @property {any} component - The Svelte component
 * @property {string} title - Display title
 * @property {string} description - Component description
 * @property {Object} defaultConfig - Default configuration object
 */

/**
 * Registry of available components
 * @type {Record<string, ComponentConfig>}
 */
export const componentRegistry = {
  CalculationEngine: {
    component: CalculationEngine,
    title: 'Calculation Engine',
    description: 'Input parameters and calculate option prices',
    defaultConfig: {
      showAdvancedInputs: true,
      autoCalculate: true,
      defaultPriceIncrement: '1.0'
    }
  },
  PricingMatrix: {
    component: PricingMatrix,
    title: 'Pricing Matrix',
    description: 'Display option pricing table with heatmap',
    defaultConfig: {
      showHeatmap: true,
      showAnalyzer: true,
      colorScheme: 'default',
      fontSize: 'medium'
    }
  },
  GreeksDashboard: {
    component: GreeksDashboard,
    title: 'Greeks Dashboard',
    description: 'Display option Greeks (Delta, Gamma, Theta, Vega, Rho)',
    defaultConfig: {
      showAllGreeks: true,
      precision: 4
    }
  },
  MarketData: {
    component: MarketData,
    title: 'Market Data',
    description: 'Real-time market data and price information',
    defaultConfig: {
      refreshInterval: 5000,
      showVolume: true,
      showChange: true
    }
  }
};

/**
 * Get component by type
 * @param {string} type - Component type key
 * @returns {any|undefined} Component or undefined
 */
export function getComponent(type) {
  return componentRegistry[/** @type {keyof typeof componentRegistry} */ (type)]?.component;
}

/**
 * Get component info by type
 * @param {string} type - Component type key
 * @returns {ComponentConfig|undefined} Component info or undefined
 */
export function getComponentInfo(type) {
  return componentRegistry[/** @type {keyof typeof componentRegistry} */ (type)];
}