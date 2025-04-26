/**
 * reportService.ts - Service for reporting outdated delivery information
 */

interface ReportData {
    originZip: string;
    destZip: string;
    estafetaData: {
      reexpe: string;
      ocurreForzoso: string;
      deliveryDays: Record<string, boolean>;
    };
  }
  
  /**
   * Report outdated delivery frequency data from Estafeta
   * 
   * @param data - The report data containing origin/destination and Estafeta info
   * @returns A promise with the result of the report submission
   */
  export const reportOutdatedData = async (data: ReportData): Promise<{ success: boolean; error?: string }> => {
    try {
      // Determine the API endpoint based on environment
      const apiUrl = import.meta.env.DEV
        ? `https://${location.hostname.replace('5173', '3000')}/api/report-outdated`
        : 'https://enviadores.com.mx/api/report-outdated.php';
  
      // Make the API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
  
      // Check if the response is OK
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
  
      // Parse the response
      const responseText = await response.text();
      try {
        const result = JSON.parse(responseText);
        return { success: true, ...result };
      } catch (parseError) {
        console.error('Failed to parse API response as JSON:', parseError);
        return { 
          success: false, 
          error: 'Invalid response from server',
          raw: import.meta.env.DEV ? responseText : undefined 
        };
      }
    } catch (error) {
      console.error('API report error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };