/**
 * Cotizador API Service - Handles all API calls related to the quotation features
 */

interface DeliveryFrequency {
    lunes: boolean;
    martes: boolean;
    miercoles: boolean;
    jueves: boolean;
    viernes: boolean;
    sabado: boolean;
    domingo: boolean;
    frecuencia: string;
    ocurre_forzoso: boolean;
    zona_extendida: boolean;
    garantia_maxima: string;
    error?: string;
  }
  
  interface EstafetaData {
    reexpe: string;
    ocurreForzoso: string;
    deliveryDays: Record<string, boolean>;
  }
  
  interface QuoteParams {
    zona: number | null;
    tipoPaquete: string;
    peso: number;
    pesoVolumetrico: number;
    esInternacional: boolean;
    valorSeguro: number;
    opcionEmpaque: string;
    precioEmpaquePersonalizado: number | null;
    requiereRecoleccion: boolean;
    precioRecoleccion: number | null;
    requiereReexpedicion: boolean;
  }
  
  /**
   * Fetches the delivery frequency information for a given postal code
   * 
   * @param postalCode - The postal code to fetch frequency data for
   * @returns Promise with the delivery frequency data
   */
  export const fetchDeliveryFrequency = async (postalCode: string): Promise<DeliveryFrequency | null> => {
    try {
      const response = await fetch(`https://enviadores.com.mx/api/delivery-frequency.php?postal_code=${postalCode}`);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      return data.error ? null : data;
    } catch (error) {
      console.error("Error fetching delivery frequency:", error);
      return null;
    }
  };
  
  /**
   * Validates a shipping route with Estafeta
   * 
   * @param originZip - Origin postal code
   * @param destZip - Destination postal code
   * @returns Promise with the Estafeta validation result
   */
  export const validateWithEstafeta = async (originZip: string, destZip: string) => {
    try {
      const formData = new FormData();
      formData.append('originZipCode', originZip);
      formData.append('destinationZipCode', destZip);
      formData.append('country', 'MEX');
      formData.append('language', '0');
  
      const response = await fetch('https://eproxy.alejandro-sarmiento-pa.workers.dev/', {
        method: 'POST',
        body: new URLSearchParams(formData as any),
      });
  
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error("Error validating with Estafeta:", error);
      return {
        reexpe: 'No',
        success: false,
        error: 'Error al conectar con Estafeta'
      };
    }
  };
  
  /**
   * Reports outdated delivery information to the backend
   * 
   * @param originZip - Origin postal code
   * @param destZip - Destination postal code
   * @param estafetaData - Data from Estafeta validation
   * @returns Promise with the report submission result
   */
  export const reportOutdatedInfo = async (
    originZip: string,
    destZip: string,
    estafetaData: EstafetaData
  ): Promise<{ success: boolean }> => {
    try {
      const apiUrl = import.meta.env.DEV
        ? `https://${location.hostname.replace('5173', '3000')}/api/report-outdated`
        : '/api/report-outdated'; // cambiar a 'https://enviadores.com.mx/api/report-outdated.php' para produccion
  
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          originZip,
          destZip,
          estafetaData
        })
      });
  
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
  
      return { success: true };
    } catch (error) {
      console.error("Error reporting outdated info:", error);
      return { success: false };
    }
  };
  
  /**
   * Gets a price quote for a shipment
   * 
   * @param params - Quote parameters
   * @returns Promise with the quote result
   */
  export const getQuote = async (params: QuoteParams) => {
    try {
      const response = await fetch('https://enviadores.com.mx/api/get-prices.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
  
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error("Error getting quote:", error);
      throw error;
    }
  };
  
  /**
   * Fetches ZIP code data from the Sepomex API
   * 
   * @param zipCode - The postal code to fetch data for
   * @returns Promise with the ZIP code data
   */
  export const fetchZipCodeData = async (zipCode: string) => {
    try {
      const response = await fetch(`https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${zipCode}`);
      
      if (!response.ok) {
        throw new Error("ZIP Code not found");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching ZIP code data:", error);
      throw error;
    }
  };