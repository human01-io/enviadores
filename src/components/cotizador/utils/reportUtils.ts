/**
 * Helper functions for reporting outdated delivery information
 */

interface EstafetaDeliveryData {
    reexpe: string;
    ocurreForzoso: string;
    deliveryDays: Record<string, boolean>;
  }
  
  /**
   * Submits a report of outdated delivery information to the API
   * 
   * @param originZip - Origin postal code
   * @param destZip - Destination postal code
   * @param estafetaData - Data from Estafeta about delivery options
   * @returns Promise with the response
   */
  export const submitDeliveryReport = async (
    originZip: string,
    destZip: string,
    estafetaData: EstafetaDeliveryData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const apiUrl = import.meta.env.DEV
        ? `https://${location.hostname.replace('5173', '3000')}/api/report-outdated`
        : '/api/report-outdated'; // cambiar a 'https://enviadores.com.mx/api/report-outdated.php' para produccion
  
      console.log("Making API call with:", {
        originZip,
        destZip,
        estafetaData
      });
  
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          originZip,
          destZip,
          estafetaData: {
            reexpe: estafetaData.reexpe || 'N/A',
            ocurreForzoso: estafetaData.ocurreForzoso || 'N/A',
            deliveryDays: estafetaData.deliveryDays || {}
          }
        })
      });
  
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
  
      const result = await response.json();
      return { success: true, ...result };
    } catch (error) {
      console.error("Error submitting delivery report:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };
  
  /**
   * Opens the Estafeta validation form in a new tab
   * 
   * @param originZip - Origin postal code
   * @param destZip - Destination postal code
   */
  export const openEstafetaValidation = (originZip: string, destZip: string): void => {
    // Create a form dynamically
    const form = document.createElement('form');
    form.action = 'https://frecuenciaentregasitecorecms.azurewebsites.net/';
    form.method = 'POST';
    form.target = '_blank'; // Open in new tab
    form.style.display = 'none';
  
    // Add origin ZIP
    const originInput = document.createElement('input');
    originInput.type = 'hidden';
    originInput.name = 'originZipCode';
    originInput.value = originZip;
    form.appendChild(originInput);
  
    // Add destination ZIP
    const destInput = document.createElement('input');
    destInput.type = 'hidden';
    destInput.name = 'destinationZipCode';
    destInput.value = destZip;
    form.appendChild(destInput);
  
    // Add country
    const countryInput = document.createElement('input');
    countryInput.type = 'hidden';
    countryInput.name = 'country';
    countryInput.value = 'MEX';
    form.appendChild(countryInput);
  
    // Add language
    const langInput = document.createElement('input');
    langInput.type = 'hidden';
    langInput.name = 'language';
    langInput.value = '0';
    form.appendChild(langInput);
  
    // Add to DOM and submit
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };
  
  /**
   * Parses a reexpedition cost to determine if it exists
   * 
   * @param value - String value from Estafeta about reexpedition cost
   * @returns Boolean indicating if there is a reexpedition cost
   */
  export const parseReexpeditionCost = (value: string | undefined): boolean => {
    if (!value) return false;
  
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === "no") return false;
  
    const numericValue = parseFloat(normalizedValue.replace(/[^0-9.]/g, ''));
    return !isNaN(numericValue) && numericValue > 0;
  };