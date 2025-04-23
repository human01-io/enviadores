import axios from 'axios';
import {
  Cliente,
  Destino,
  ServicioCotizado,
  ShipmentDetails,
  EnvioResponse,
  ApiResponse,
  UserProfile
  
} from '../types';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://enviadores.com.mx/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});


api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// Error handling utility
const handleApiError = (error: unknown): never => {



  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error || error.message;
    throw new Error(message || 'API request failed');
  }
  throw new Error('Unknown API error occurred');
};

export const apiService = {
  // Customer endpoints
  searchCustomers: async (query: string): Promise<Cliente[]> => {
    try {
      const response = await api.get('/customers.php', {
        params: { q: query }
      });

      // Handle the specific response format you shared
      if (response.data && response.data.success === true) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        throw new Error('Invalid data format in response');
      }
      throw new Error(response.data.error || 'Search request failed');

    } catch (error) {
      console.error('Search error:', {
        request: error.config,
        response: error.response?.data,
        message: error.message
      });
      throw new Error('Failed to search customers. Please try again.');
    }
  },

  // Add this to your apiService.ts
  getCustomers: async (page: number, limit: number): Promise<{ data: Cliente[]; total: number }> => {
    try {
      const response = await api.get('/customers.php', {
        params: { 
          page,
          limit
          // Remove list_all parameter as it's not needed anymore
        }
      });
  
      if (response.data?.success) {
        return {
          data: response.data.data || [],
          total: response.data.total || 0
        };
      }
      throw new Error(response.data?.error || 'Failed to fetch customers');
    } catch (error) {
      console.error('Get customers error:', {
        request: error.config,
        response: error.response?.data,
        message: error.message
      });
      throw new Error('Failed to fetch customers. Please try again.');
    }
  },

  createCustomer: async (customerData: Omit<Cliente, 'id'>): Promise<Cliente> => {
    const response = await api.post('/customers.php', customerData);

    const responseId = response.data?.id ||
        response.data?.data?.id ||
        null;
    return { ...customerData, id: responseId }; // Return full customer with ID
  },

  updateCustomer: async (id: string, updates: Partial<Cliente>): Promise<void> => {
    try {
      await api.put(`/customers.php?id=${id}`, updates);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Destination endpoints
  getCustomerDestinations: async (customerId: string, query?: string): Promise<Destino[]> => {
    try {
      const response = await api.get('/destinations.php', {
        params: {
          customer_id: customerId,
          q: query
        }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  createDestination: async (destinationData: Omit<Destino, 'id'>): Promise<Destino> => {
    const payload = {
      cliente_id: destinationData.cliente_id,
      nombre_destinatario: destinationData.nombre_destinatario,
      direccion: destinationData.direccion,
      colonia: destinationData.colonia,
      ciudad: destinationData.ciudad,
      estado: destinationData.estado,
      codigo_postal: destinationData.codigo_postal,
      pais: destinationData.pais || 'México',
      telefono: destinationData.telefono,
      // Optional fields explicitly set to null
      alias: destinationData.alias || null,
      email: destinationData.email || null,
      referencia: destinationData.referencia || null,
      instrucciones_entrega: destinationData.instrucciones_entrega || null
    };

    try {
      const response = await api.post('/destinations.php', payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseId = response.data?.id ||
        response.data?.data?.id ||
        null;

      if (!responseId) {
        console.error('Response structure:', response.data);
        throw new Error('Server did not return destination ID');
      }

      return { ...destinationData, id: responseId };
    } catch (error) {
      console.error('Full error context:', {
        payload,
        config: error.config,
        response: error.response?.data,
        stack: error.stack
      });
      throw new Error(`Destination creation failed: ${error.response?.data?.error || error.message}`);
    }
  },

  updateDestination: async (id: string, updates: Partial<Destino>): Promise<void> => {
    try {
      await api.put(`/destinations.php?id=${id}`, updates);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Shipment endpoints
  createShipment: async (shipmentData: {
    cliente_id: string;
    destino_id: string;
    servicio_id: string;
    peso_real: number;
    peso_volumetrico: number;
    valor_declarado?: number;
    costo_seguro?: number;
    costo_envio: number;
    iva: number;
    total: number;
    tipo_paquete: string;
    opcion_empaque?: string;
    requiere_recoleccion: boolean;
    metodo_creacion: 'interno' | 'externo' | 'manuable';
    paqueteria_externa?: string;
    numero_guia_externa?: string;
    ruta_etiqueta?: string;
    uuid_manuable?: string;
    servicio_manuable?: string;
    costo_neto?: number;
  },
  options?: {
    labelFile?: File;
    progressCallback?: (progress: number) => void;
  }
): Promise<{ id: string }> => {

  const formData = new FormData();

  const numericFields = ['peso_real', 'peso_volumetrico', 'costo_neto', 'valor_declarado'];

  Object.entries(shipmentData).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    
    if (numericFields.includes(key)) {
      formData.append(key, value.toString()); // Explicit for numbers
    } else {
      formData.append(key, String(value)); // Default string conversion
    }
  });
  if (options?.labelFile) {
    formData.append('label_file', options.labelFile);
  }

  try {
    const response = await api.post('/shipments.php', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: options?.progressCallback 
        ? (progressEvent: ProgressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            options.progressCallback(percentCompleted);
          }
        : undefined
    });
    return response.data;
  } catch (error) {
    throw new Error(`Shipment creation failed: ${error.message}`);
  }
  },

  getShipmentDetails: async (shipmentId: string): Promise<ShipmentDetails & {
    cliente_nombre: string;
    nombre_destinatario: string;
  }> => {
    try {
      const response = await api.get(`/shipments.php?id=${shipmentId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Additional utility methods
  validateCustomer: (customer: Partial<Cliente>): customer is Cliente => {
    const requiredFields: Array<keyof Cliente> = [
      'nombre', 'telefono', 'calle', 'colonia',
      'municipio', 'estado', 'codigo_postal'
    ];
    return requiredFields.every(field => customer[field]);
  },

  validateDestination: (destination: Partial<Destino>): destination is Destino => {
    const requiredFields: Array<keyof Destino> = [
      'nombre_destinatario', 'direccion', 'colonia',
      'ciudad', 'estado', 'codigo_postal', 'telefono'
    ];
    return requiredFields.every(field => destination[field]);
  },

  searchUsers: async (query: string): Promise<any[]> => {
    try {
      const response = await api.get('/users.php', {
        params: { q: query }
      });
      return response.data.data || [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  
  getUserProfile: async (): Promise<UserProfile> => {
    try {
      const token = localStorage.getItem('auth_token');
      //console.log('Using auth token:', token ? token.substring(0, 20) + '...' : 'None');
      
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      //console.log('Request headers:', headers);
      
      const response = await api.get('/user-profile.php', { headers });
      //console.log('Profile API Response:', response);
      
      if (!response.data?.data) {
        throw new Error('User data not found in response');
      }
      return response.data.data;
    } catch (error) {
      console.error('Profile API Error:', error.response?.data || error.message);
      handleApiError(error);
      throw error;
    }
  },

  createUser: async (userData: {
    cliente_id?: string;
    username: string;
    email: string;
    phone: string;
    password: string;
    role: 'admin_user' | 'customer_user';
  }): Promise<{ id: string }> => {
    try {
      const response = await api.post('/users.php', userData);
      return response.data;
    } catch (error) {
      throw new Error(`User creation failed: ${error.response?.data?.error || error.message}`);
    }
  }

};


// Type guards for API responses
export function isApiError(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}