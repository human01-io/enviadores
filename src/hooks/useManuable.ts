import { useState, useCallback } from 'react';
import { manuableService, ManuableRate, ManuableLabelResponse } from '../services/manuableService';
import { Cliente, Destino } from '../types';

interface UseManuableProps {
  // Optional config
  autoLogin?: boolean;
}

/**
 * Hook to manage Manuable API state
 */
export function useManuable({ autoLogin = true }: UseManuableProps = {}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(manuableService.isAuthenticated());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<ManuableRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ManuableRate | null>(null);
  const [labelResponse, setLabelResponse] = useState<ManuableLabelResponse | null>(null);

  /**
   * Login to Manuable API
   * Now using the proxy which handles credentials, so no parameters needed
   */
  const login = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authData = await manuableService.login();
      setIsAuthenticated(true);
      return authData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get rate quotes from Manuable
   */
  const getRates = useCallback(async (
    originZip: string, 
    destZip: string, 
    packageDetails: {
      peso: number;
      alto?: number;
      largo?: number;
      ancho?: number;
      valor_declarado?: number;
      content?: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      // First ensure we're authenticated
      if (!isAuthenticated && autoLogin) {
        // No credentials needed with the proxy approach
        await login();
      }

      // Format the data for Manuable API - IMPORTANT: use the actual values from packageDetails
      const params = {
        address_from: {
          country_code: 'MX',
          zip_code: originZip
        },
        address_to: {
          country_code: 'MX',
          zip_code: destZip
        },
        parcel: {
          currency: 'MXN',
          distance_unit: 'CM',
          mass_unit: 'KG',
          // Use the actual peso (weight) value, not pesoFacturable
          weight: packageDetails.peso,
          // Use the actual dimensions
          height: packageDetails.alto || 10,
          length: packageDetails.largo || 10,
          width: packageDetails.ancho || 10,
          product_id: '01010101',
          product_value: packageDetails.valor_declarado || 1,
          quantity_products: 1,
          content: packageDetails.content || 'GIFT'
        }
      };

      console.log('Sending getRates request with params:', JSON.stringify(params));
      const response = await manuableService.getRates(params);
      console.log('Received getRates response:', JSON.stringify(response));
      
      // Initialize rates to empty array if response data is undefined
      if (!response || !response.data) {
        console.warn('No rate data found in response');
        setRates([]);
        return [];
      }
      
      // Make sure we have an array of rates
      const ratesData = Array.isArray(response.data) ? response.data : [];
      setRates(ratesData);
      return ratesData;
    } catch (err) {
      // Check if this is a validation error
      if (err.response?.data?.errors) {
        console.warn('Validation errors in getRates:', err.response.data.errors);
        // Return empty array but don't set error state since this is a validation issue
        setRates([]);
        return [];
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get rates';
        console.error('Error getting rates:', errorMessage);
        setError(errorMessage);
        setRates([]);
        return [];
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, autoLogin, login]);

  /**
   * Create a shipping label
   */
  const createLabel = useCallback(async (
    cliente: Cliente,
    destino: Destino,
    rateUuid: string,
    content?: string,
    valor_declarado?: number
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      // First ensure we're authenticated
      if (!isAuthenticated && autoLogin) {
        await login();
      }

      // Map data to Manuable format
      const addressFrom = manuableService.mapToManuableAddressFormat(cliente);
      const addressTo = manuableService.mapDestinoToManuableAddress(destino);

      console.log('Creating label with parameters:', {
        rateUuid,
        addressFrom,
        addressTo,
        content
      });

      const response = await manuableService.createLabel({
        address_from: addressFrom,
        address_to: addressTo,
        parcel: {
          currency: 'MXN',
          product_id: '01010101',
          product_value: valor_declarado || 1,
          quantity_products: 1,
          content: content || 'GIFT',
          mass_unit: 'KG',
          distance_unit: 'CM'
        },
        rate_token: rateUuid,
        label_format: 'PDF'
      });

      console.log('Label creation response:', JSON.stringify(response));

      // Check for missing fields and provide defaults
      const processedResponse = {
        token: response?.token || '',
        created_at: response?.created_at || new Date().toISOString(),
        tracking_number: response?.tracking_number || '',
        label_url: response?.label_url || '',
        price: response?.price || '0.00'
      };

      setLabelResponse(processedResponse);
      return processedResponse;
    } catch (err) {
      // Don't set the error state, just pass it up to the component
      // This allows the component to handle validation errors separately
      console.error('Error creating label:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, autoLogin, login]);

  /**
   * Logout from Manuable
   */
  const logout = useCallback(() => {
    manuableService.logout();
    setIsAuthenticated(false);
    setRates([]);
    setSelectedRate(null);
    setLabelResponse(null);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    rates,
    selectedRate,
    setSelectedRate,
    labelResponse,
    login,
    getRates,
    createLabel,
    logout
  };
}