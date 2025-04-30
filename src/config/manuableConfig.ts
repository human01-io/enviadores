/**
 * Manuable API Configuration
 * 
 * This file contains configuration for the Manuable API integration.
 */

export const manuableConfig = {
    // API base URL (pointing to our proxy with absolute URL)
    baseURL: 'https://enviadores.com.mx/api/manuable-proxy.php',
    
    // API request configuration
    requestConfig: {
      timeout: 10000,
      withCredentials: true, // This is crucial for sending cookies cross-domain
      headers: {
        'Content-Type': 'application/json',
      }
    },
    // API endpoints (adjusted for the proxy)
    endpoints: {
      session: '?endpoint=session',
      rates: '?endpoint=rates',
      labels: '?endpoint=labels'
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
    timeout: 10000
  };
  
  // Update Manuable service to use this configuration
  export const updateManuableServiceConfig = () => {
    // Check if we should use a different proxy URL
    if (import.meta.env.VITE_MANUABLE_PROXY_URL) {
      manuableConfig.baseURL = import.meta.env.VITE_MANUABLE_PROXY_URL;
    }
};