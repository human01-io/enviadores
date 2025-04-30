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

      // Format the data for Manuable API
      const params = {
        address_from: {
          country_code: 'MX',
          zip_code: originZip
        },
        address_to: {
          country_code: 'MX',
          zip_code: destZip
        },
        parcel: manuableService.mapPackageToManuableParcel(packageDetails)
      };

      const response = await manuableService.getRates(params);
      setRates(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get rates';
      setError(errorMessage);
      return [];
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
    rateUuid: string
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

      const response = await manuableService.createLabel({
        address_from: addressFrom,
        address_to: addressTo,
        parcel: {
          currency: 'MXN',
          product_id: '01010101',
          product_value: 1000,
          quantity_products: 1,
          content: 'GIFT',
          mass_unit: 'KG',
          distance_unit: 'CM'
        },
        rate_token: rateUuid,
        label_format: 'PDF'
      });

      setLabelResponse(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create label';
      setError(errorMessage);
      return null;
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