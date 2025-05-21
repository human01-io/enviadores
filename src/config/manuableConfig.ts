/**
 * Manuable API Configuration
 * 
 * This file contains configuration for the Manuable API integration.
 */

export const manuableConfig = {
  // API base URL (pointing to our Cloudflare Worker)
  baseURL: 'https://manuable-proxy.alejandro-sarmiento-pa.workers.dev',

  environment: import.meta.env.VITE_MANUABLE_ENVIRONMENT || 'production',
  
  // API request configuration
  requestConfig: {
    timeout: 30000,
    withCredentials: true, // This is crucial for sessions
    headers: {
      'Content-Type': 'application/json',
    }
  },
  // API endpoints (adjusted for the worker)
  endpoints: {
    session: '?endpoint=session',
    rates: '?endpoint=rates',
    labels: '?endpoint=labels',
    balance: '?endpoint=accounts/balance'
  },
  
  // Default values for API requests
  defaults: {
    currency: 'MXN',
    distance_unit: 'CM',
    mass_unit: 'KG',
    product_id: '01010101',
    label_format: 'PDF',
    content: 'GIFT'
  },
  
  // Product types mapping
  productTypes: {
    sobre: {
      height: 1,
      length: 30,
      width: 25
    },
    paquete: {
      height: 10,
      length: 10,
      width: 10
    }
  },
  
  // Default timeout in milliseconds
  timeout: 30000
};

// Update Manuable service to use this configuration
export const updateManuableServiceConfig = () => {
  // Check if we should use a different proxy URL in development
  if (import.meta.env.VITE_MANUABLE_PROXY_URL) {
    manuableConfig.baseURL = import.meta.env.VITE_MANUABLE_PROXY_URL;
  }
};