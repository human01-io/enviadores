import axios, { AxiosInstance } from 'axios';
import { manuableConfig, updateManuableServiceConfig } from '../config/manuableConfig';

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
   * Login to Manuable API via the proxy
   * Note: The proxy handles the actual credentials, so we don't need to send them
   */
  async login(): Promise<ManuableAuth> {
    try {
      console.log('Attempting to login to Manuable API via proxy');
      console.time('manuable-login');
      
      // We're using the proxy which will inject the credentials
      const response = await this.api.post(manuableConfig.endpoints.session, {});
      
      console.timeEnd('manuable-login');
      console.log('Manuable login successful');
      
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

      const response = await this.api.post(manuableConfig.endpoints.rates, params);
      return response.data;
    } catch (error) {
      console.error('Manuable get rates error:', error);
      throw error;
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

      const response = await this.api.post(manuableConfig.endpoints.labels, params);
      return response.data;
    } catch (error) {
      console.error('Manuable create label error:', error);
      throw error;
    }
  }

  /**
   * Map our app's data format to Manuable's format
   */
  mapToManuableAddressFormat(data: {
    nombre: string;
    calle: string;
    colonia: string;
    numero_exterior: string;
    municipio: string;
    estado: string;
    codigo_postal: string;
    telefono: string;
    email: string;
    pais?: string;
    referencia?: string;
  }): ManuableAddress {
    return {
      name: data.nombre,
      street1: data.calle,
      neighborhood: data.colonia,
      external_number: data.numero_exterior,
      city: data.municipio,
      state: data.estado,
      phone: data.telefono,
      email: data.email,
      country: (data.pais || 'México').toUpperCase(),
      country_code: 'MX', // Default to Mexico
      reference: data.referencia || '',
      zip_code: data.codigo_postal,
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
  }): ManuableAddress {
    return {
      name: data.nombre_destinatario,
      street1: data.direccion,
      neighborhood: data.colonia,
      external_number: '', // Not available in our destination model
      city: data.ciudad,
      state: data.estado,
      phone: data.telefono,
      email: data.email || '',
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