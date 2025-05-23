import axios, { AxiosError } from 'axios';

/**
 * Common error handling for API requests
 */

interface ApiErrorOptions {
  defaultMessage?: string;
  logToConsole?: boolean;
  includeResponseData?: boolean;
}

const defaultOptions: ApiErrorOptions = {
  defaultMessage: 'Ocurrió un error en la solicitud',
  logToConsole: true,
  includeResponseData: false
};

/**
 * Standardized error handler for API requests
 * 
 * @param error The error from a try/catch block
 * @param options Options for handling the error
 * @returns Standardized error message
 */
export const handleApiError = (error: unknown, options: ApiErrorOptions = {}): string => {
  const opts = { ...defaultOptions, ...options };
  
  // For axios errors, extract relevant information
  if (axios.isAxiosError(error)) {
    const axiosError = error;
    
    // Log the error to console if requested
    if (opts.logToConsole) {
      console.error('API Error:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        data: opts.includeResponseData ? axiosError.response?.data : '[REDACTED]'
      });
    }
    
    // Return appropriate message based on status code
    if (axiosError.response) {
      switch (axiosError.response.status) {
        case 400:
          return 'Solicitud incorrecta. Verifique los datos enviados.';
        case 401:
          return 'No autorizado. Por favor inicie sesión nuevamente.';
        case 403:
          return 'Acceso denegado. No tiene permisos para realizar esta acción.';
        case 404:
          return 'Recurso no encontrado.';
        case 422:
          // Data validation error, try to extract validation message
          try {
            const responseData = axiosError.response.data as { errors?: Array<{ message?: string }> };
            if (responseData.errors && responseData.errors.length > 0) {
              return responseData.errors[0].message ?? 'Error de validación de datos.';
            }
            return 'Error de validación de datos.';
          } catch (e) {
            return 'Error de validación de datos.';
          }
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Error del servidor. Por favor intente más tarde.';
        default:
          return `Error: ${axiosError.response.status} ${axiosError.response.statusText}`;
      }
    } else if (axiosError.request) {
      // Network error
      return 'Error de red. Verifique su conexión a internet.';
    } else {
      return axiosError.message ?? opts.defaultMessage;
    }
  }
  
  // For non-axios errors
  if (error instanceof Error) {
    if (opts.logToConsole) {
      console.error('Non-Axios Error:', error);
    }
    return error.message ?? opts.defaultMessage;
  }
  
  // For unknown errors
  if (opts.logToConsole) {
    console.error('Unknown Error:', error);
  }
  
  return opts.defaultMessage;
};

/**
 * Type guard to check if an error is from the API
 */
export const isApiError = (error: unknown): error is { message: string } => {
  return typeof error === 'object' && error !== null && 'message' in error;
};

/**
 * Retry an API call with exponential backoff when rate limited (429)
 * 
 * @param apiCall Function that makes the API call
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelay Initial delay in milliseconds
 * @returns Promise with the API call result
 */
export const retryWithBackoff = async <T>(
  apiCall: () => Promise<T>, 
  maxRetries = 3, 
  initialDelay = 1000
): Promise<T> => {
  let retries = 0;
  
  while (true) {
    try {
      return await apiCall();
    } catch (error) {
      // Check if it's a 429 error and we haven't exceeded max retries
      if (axios.isAxiosError(error) && 
          error.response?.status === 429 && 
          retries < maxRetries) {
        
        retries++;
        // Exponential backoff: delay gets longer with each retry
        const delay = initialDelay * Math.pow(2, retries - 1);
        console.log(`Rate limited (429). Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Not a 429 error or max retries exceeded
        throw error;
      }
    }
  }
};