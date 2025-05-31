import axios, { AxiosInstance } from 'axios';
import { manuableConfig, updateManuableServiceConfig } from '../config/manuableConfig';
import { RectangleHorizontal } from 'lucide-react';

// Initialize configuration 
updateManuableServiceConfig();

// Types for Manuable API
export interface ManuableAuth {
  id: string;
  token: string;
  email: string;
}

export interface ManuableAddress {
  country_code: string;
  zip_code: string;
  // Additional fields for label generation
  name?: string;
  street1?: string;
  neighborhood?: string;
  external_number?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  country?: string;
  reference?: string;
  company?: string;
}

export interface ManuableParcel {
  currency: string;
  distance_unit: string;
  height: number;
  length: number;
  mass_unit: string;
  weight: number;
  width: number;
  product_id?: string;
  product_value?: number;
  quantity_products?: number;
  content?: string;
}

export interface ManuableRate {
  additional_fees: any[];
  carrier: string;
  currency: string;
  service: string;
  shipping_type: string;
  total_amount: string;
  uuid: string;
  zone?: number;
}

export interface ManuableRateResponse {
  data: ManuableRate[];
}

export interface ManuableLabelRequest {
  address_from: ManuableAddress;
  address_to: ManuableAddress;
  parcel: Omit<ManuableParcel, 'height' | 'length' | 'width' | 'weight'>;
  rate_token: string;
  label_format: 'PDF' | 'THERMAL';
}

export interface ManuableLabelResponse {
  token: string;
  created_at: string;
  tracking_number: string;
  label_url: string;
  price: string;
}

// New interface for getting labels list
export interface ManuableLabelsListResponse {
  data: ManuableLabelResponse[];
  meta?: {
    current_page: number;
    total_pages: number;
    total_items: number;
  };
}

// New interface for balance response
export interface ManuableBalanceResponse {
  balance: number;
  currency: string; 
  lastUpdated?: string;
}

// Interface for surcharges
export interface ManuableSurcharge {
  id: string;
  name: string;
  price: string;
  description?: string;
  status?: string;
  type?: string;
  created_at?: string;
}

export interface ManuableSurchargesResponse {
  data: ManuableSurcharge[];
  meta?: {
    current_page: number;
    total_pages: number;
    total_items: number;
  };
}

class ManuableService {
  private api: AxiosInstance;
  private token: string | null = null;
  private baseURL = manuableConfig.baseURL;

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: manuableConfig.requestConfig.timeout,
      withCredentials: manuableConfig.requestConfig.withCredentials,
      headers: manuableConfig.requestConfig.headers,
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle errors (401, 403, etc.) here
        console.error('Manuable API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    // Add request interceptor to include token if available
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
    * Login to Manuable API via the Cloudflare Worker proxy
    * Note: The worker handles the actual credentials, so we don't need to send them
    */
  async login(): Promise<ManuableAuth> {
    try {
      console.log('Attempting to login to Manuable API via proxy');
      console.time('manuable-login');

      // We're using the Cloudflare Worker which will inject the credentials
      // Just send an empty body to the session endpoint
      const response = await this.api.post(manuableConfig.endpoints.session, {});

      console.timeEnd('manuable-login');
      console.log('Manuable login successful:', response.data);

      // Save token for future requests
      this.token = response.data.token;

      return response.data;
    } catch (error) {
      console.timeEnd('manuable-login');
      console.error('Manuable login error:', error);

      // Enhanced error reporting
      if (axios.isAxiosError(error)) {
        console.error('Request details:', {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout,
          headers: error.config?.headers
        });

        if (error.code === 'ECONNABORTED') {
          console.error('Connection timeout. Check if the proxy URL is correct and accessible.');
        }
      }

      throw new Error('Authentication with Manuable failed');
    }
  }

  /**
   * Get rate quotes from Manuable
   */
  async getRates(params: {
    address_from: ManuableAddress;
    address_to: ManuableAddress;
    parcel: ManuableParcel;
  }): Promise<ManuableRateResponse> {
    try {
      // Ensure we're authenticated
      if (!this.token) {
        await this.login();
      }

      console.log('Sending getRates request to Manuable API');
      const response = await this.api.post(manuableConfig.endpoints.rates, params);
      console.log('Received getRates response:', response.data);

      // Make sure rates is always an array
      const ratesResponse: ManuableRateResponse = {
        data: Array.isArray(response.data) ? response.data :
          response.data?.data && Array.isArray(response.data.data) ? response.data.data : []
      };

      return ratesResponse;
    } catch (error) {
      console.error('Manuable get rates error:', error);
      // Return empty rates instead of throwing
      return { data: [] };
    }
  }

  /**
   * Generate a shipping label
   */
  async createLabel(params: ManuableLabelRequest): Promise<ManuableLabelResponse> {
    try {
      // Ensure we're authenticated
      if (!this.token) {
        await this.login();
      }

      console.log('Creating label with params:', JSON.stringify(params, null, 2));

      // Add required fields if missing
      this.ensureRequiredFields(params);

      const response = await this.api.post(manuableConfig.endpoints.labels, params);
      console.log('Label creation successful, raw response:', response);
      console.log('Label response data:', JSON.stringify(response.data, null, 2));

      // Extract data from nested structure if needed
      let labelData = response.data;
      if (response.data && response.data.data) {
        console.log('Detected nested data in response, extracting...');
        labelData = response.data.data;
      }

      // Ensure all required fields are present
      const processedResponse: ManuableLabelResponse = {
        token: labelData.token || '',
        created_at: labelData.created_at || new Date().toISOString(),
        tracking_number: labelData.tracking_number || '',
        label_url: labelData.label_url || '',
        price: labelData.price || '0'
      };

      return processedResponse;
    } catch (error) {
      console.error('Manuable create label error:', error);

      // If it's an Axios error with a response, we can provide more details
      if (axios.isAxiosError(error)) {
        console.error('API response status:', error.response?.status);
        console.error('API response data:', JSON.stringify(error.response?.data));

        // Check if it's a validation error (usually 400 or 422)
        if (error.response?.status === 400 || error.response?.status === 422) {
          // Pass through the validation errors
          throw error;
        }
      }

      // For other types of errors, just throw a generic message
      throw new Error('Error creating shipping label');
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<ManuableBalanceResponse> {
    try {
      // Ensure we're authenticated
      if (!this.token) {
        await this.login();
      }

      console.log('Getting account balance from Manuable API');
      // Use the balance endpoint from config
      const response = await this.api.get(manuableConfig.endpoints.balance);
      console.log('Received balance response:', response.data);
      console.log('Balance response structure:', JSON.stringify(response.data));

      // Extract and format the balance data
      let balanceData = response.data;
      if (response.data && response.data.data) {
        console.log('Detected nested data in response, extracting...');
        balanceData = response.data.data;
      }

      // Ensure consistent response format - check for both 'balance' and 'total' fields
      const processedResponse: ManuableBalanceResponse = {
        balance: parseFloat(balanceData.total || balanceData.balance || balanceData.amount || '0'),
        currency: balanceData.currency || 'MXN',
        lastUpdated: balanceData.updated_at || new Date().toISOString()
      };

      return processedResponse;
    } catch (error) {
      console.error('Manuable get balance error:', error);

      // If it's an Axios error with a response, we can provide more details
      if (axios.isAxiosError(error)) {
        console.error('API response status:', error.response?.status);
        console.error('API response data:', JSON.stringify(error.response?.data));

        // For authentication issues, try to login again
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.token = null; // Clear invalid token
          throw new Error('Authentication required to get balance');
        }
      }

      // For other types of errors, just throw a generic message
      throw new Error('Error retrieving account balance');
    }
  }

  /**
   * Get labels list with optional tracking number filter and pagination
   */
  async getLabels(params?: {
    tracking_number?: string;
    page?: number;
  }): Promise<ManuableLabelsListResponse> {
    try {
      // Ensure we're authenticated
      if (!this.token) {
        await this.login();
      }

      console.log('Getting labels from Manuable API with params:', params);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params?.tracking_number) {
        queryParams.append('tracking_number', params.tracking_number);
      }
      if (params?.page && params.page > 1) {
        queryParams.append('page', params.page.toString());
      }
      
      // Create the URL with query parameters
      const endpoint = manuableConfig.endpoints.getLabels;
      const url = queryParams.toString() ? `${endpoint}&${queryParams.toString()}` : endpoint;
      
      console.log('Fetching labels with URL:', url);
      const response = await this.api.get(url);
      console.log('Received labels response:', response.data);
      
      // Process and normalize the response
      let labelsData: ManuableLabelsListResponse = { data: [] };
      
      // Check if the data is directly in the response or nested
      if (Array.isArray(response.data)) {
        labelsData = { data: response.data };
      } else if (response.data && Array.isArray(response.data.data)) {
        labelsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Try to extract data if it's in a different structure
        const possibleData = Object.values(response.data).find(v => Array.isArray(v));
        if (possibleData) {
          labelsData = { data: possibleData as ManuableLabelResponse[] };
        }
      }
      
      // Add pagination metadata if available
      if (response.data.meta) {
        labelsData.meta = response.data.meta;
      } else if (response.data.current_page || response.data.total_pages) {
        labelsData.meta = {
          current_page: response.data.current_page || 1,
          total_pages: response.data.total_pages || 1,
          total_items: response.data.total_items || labelsData.data.length
        };
      }
      
      return labelsData;
    } catch (error) {
      console.error('Manuable get labels error:', error);

      // If it's an Axios error with a response, we can provide more details
      if (axios.isAxiosError(error)) {
        console.error('API response status:', error.response?.status);
        console.error('API response data:', JSON.stringify(error.response?.data));

        // For authentication issues, try to login again
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.token = null; // Clear invalid token
          throw new Error('Authentication required to get labels');
        }
      }

      // For other types of errors, just throw a generic message
      throw new Error('Error retrieving shipping labels');
    }
  }
  
  /**
   * Get surcharges list with pagination
   */
  async getSurcharges(params?: {
    page?: number;
  }): Promise<ManuableSurchargesResponse> {
    try {
      // Ensure we're authenticated
      if (!this.token) {
        await this.login();
      }

      console.log('Getting surcharges from Manuable API with params:', params);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params?.page && params.page > 1) {
        queryParams.append('page', params.page.toString());
      }
      
      // Create the URL with query parameters
      const endpoint = manuableConfig.endpoints.surcharges;
      const url = queryParams.toString() ? `${endpoint}&${queryParams.toString()}` : endpoint;
      
      console.log('Fetching surcharges with URL:', url);
      const response = await this.api.get(url);
      console.log('Received surcharges response:', response.data);
      
      // Process and normalize the response
      let surchargesData: ManuableSurchargesResponse = { data: [] };
      
      // Check if the data is directly in the response or nested
      if (Array.isArray(response.data)) {
        surchargesData = { data: response.data };
      } else if (response.data && Array.isArray(response.data.data)) {
        surchargesData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Try to extract data if it's in a different structure
        const possibleData = Object.values(response.data).find(v => Array.isArray(v));
        if (possibleData) {
          surchargesData = { data: possibleData as ManuableSurcharge[] };
        }
      }
      
      // Add pagination metadata if available
      if (response.data.meta) {
        surchargesData.meta = response.data.meta;
      } else if (response.data.current_page || response.data.total_pages) {
        surchargesData.meta = {
          current_page: response.data.current_page || 1,
          total_pages: response.data.total_pages || 1,
          total_items: response.data.total_items || surchargesData.data.length
        };
      }
      
      return surchargesData;
    } catch (error) {
      console.error('Manuable get surcharges error:', error);

      // If it's an Axios error with a response, we can provide more details
      if (axios.isAxiosError(error)) {
        console.error('API response status:', error.response?.status);
        console.error('API response data:', JSON.stringify(error.response?.data));

        // For authentication issues, try to login again
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.token = null; // Clear invalid token
          throw new Error('Authentication required to get surcharges');
        }
      }

      // For other types of errors, just throw a generic message
      throw new Error('Error retrieving surcharges');
    }
  }

  /**
   * Ensure all required fields are present in the request
   * This is to prevent common validation issues
   */
  private ensureRequiredFields(params: ManuableLabelRequest) {
    // Ensure address_from has all required fields
    if (params.address_from) {
      params.address_from = {
        ...params.address_from,
        external_number: params.address_from.external_number || 'S/N',
        email: params.address_from.email || 'contacto@enviadores.com.mx'
      };
    }

    // Ensure address_to has all required fields
    if (params.address_to) {
      params.address_to = {
        ...params.address_to,
        external_number: params.address_to.external_number || 'S/N',
        email: params.address_to.email || 'contacto@enviadores.com.mx'
      };
    }
  }

  /**
   * Map our app's data format to Manuable's format
   */
  mapToManuableAddressFormat(data: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    calle: string;
    colonia: string;
    numero_exterior: string;
    numero_interior?: string;
    municipio: string;
    estado: string;
    codigo_postal: string;
    telefono: string;
    email: string;
    pais?: string;
    referencia?: string;
    razon_social?: string;
  }): ManuableAddress {

    const fullName = [
      data.nombre || '',
      data.apellido_paterno || '',
      data.apellido_materno || ''
    ].filter(Boolean).join(' ').trim();

    const fullAddress = [
      data.calle || '',
      data.numero_exterior || '',
      data.numero_interior || ''
    ].filter(Boolean).join(' ').trim();
    
    return {
      name: fullName,
      street1: fullAddress,
      neighborhood: data.colonia,
      external_number: '.',
      city: data.municipio,
      state: data.estado,
      phone: data.telefono,
      email: data.email || 'contacto@enviadores.com.mx',
      country: (data.pais || 'México').toUpperCase(),
      country_code: 'MX', // Default to Mexico
      reference: data.referencia || '',
      zip_code: data.codigo_postal,
      company: data.razon_social || 'enviadores.com.mx'
    };
  }


  /**
   * Map destination data to Manuable format
   */
  mapDestinoToManuableAddress(data: {
    nombre_destinatario: string;
    direccion: string;
    colonia: string;
    ciudad: string;
    estado: string;
    codigo_postal: string;
    telefono: string;
    email?: string;
    pais?: string;
    referencia?: string;
    numero_exterior?: string;
  }): ManuableAddress {
    return {
      name: data.nombre_destinatario,
      street1: data.direccion,
      neighborhood: data.colonia,
      external_number: '.', // Use provided or default
      city: data.ciudad,
      state: data.estado,
      phone: data.telefono,
      email: data.email || 'contacto@enviadores.com.mx',
      country: (data.pais || 'México').toUpperCase(),
      country_code: 'MX', // Default to Mexico
      reference: data.referencia || '',
      zip_code: data.codigo_postal,
    };
  }

  /**
   * Map package details to Manuable format
   */
  mapPackageToManuableParcel(data: {
    peso: number;
    alto?: number;
    largo?: number;
    ancho?: number;
    valor_declarado?: number;
    content?: string;
  }): ManuableParcel {
    return {
      currency: manuableConfig.defaults.currency,
      distance_unit: manuableConfig.defaults.distance_unit,
      mass_unit: manuableConfig.defaults.mass_unit,
      weight: data.peso,
      height: data.alto || 10, // Default values if not provided
      length: data.largo || 10,
      width: data.ancho || 10,
      product_id: manuableConfig.defaults.product_id,
      product_value: data.valor_declarado || 1,
      quantity_products: 1,
      content: data.content || manuableConfig.defaults.content
    };
  }

  /**
   * Check if we're authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Clear authentication token
   */
  logout(): void {
    this.token = null;
  }
}

export const manuableService = new ManuableService();