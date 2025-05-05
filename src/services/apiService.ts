import axios, { AxiosError } from 'axios';
import {
  Cliente,
  Destino,
  ServicioCotizado,
  ShipmentDetails,
  EnvioResponse,
  ApiResponse,
  UserProfile,
  Envio,
  EnvioWithDetails,
  User
  
} from '../types';
import { retryWithBackoff } from '../utils/apiErrorHandler';

const api = axios.create({
  baseURL: 'https://enviadores.com.mx/api',
  timeout: 10000,
  withCredentials: true, // This is crucial for sending cookies cross-domain
  headers: {
    'Content-Type': 'application/json',
  }
});


api.interceptors.request.use(config => {
  if (!config.headers) {
    config.headers = {};
  }
  
  // First try to get token from cookies
  const cookies = document.cookie.split(';').map(c => c.trim());
  const authCookie = cookies.find(c => c.startsWith('auth_token='));
  
  if (authCookie) {
    const token = authCookie.split('=')[1];
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }
  
  // If no cookie, try localStorage
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

      if (response.data && response.data.success === true) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        throw new Error('Invalid data format in response');
      }
      throw new Error(response.data.error || 'Search request failed');
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to search customers. Please try again.');
    }
  },

// Advanced search with multiple criteria
advancedSearchCustomers: async (filters: Record<string, string>, mode: 'all' | 'any' = 'all'): Promise<{ data: Cliente[]; total: number }> => {
  try {
    // Convert filters to a format that works with our backend
    const queryParams = new URLSearchParams();
    
    // Add each filter to the params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    // Add advanced=true flag and search mode
    queryParams.append('advanced', 'true');
    queryParams.append('mode', mode);
    
    const response = await api.get(`/customers.php?${queryParams.toString()}`);
    
    if (response.data?.success) {
      return {
        data: response.data.data || [],
        total: response.data.total || 0
      };
    }
    throw new Error(response.data?.error || 'Advanced search request failed');
  } catch (error) {
    console.error('Advanced search error:', error);
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
      console.error('Get customers error:', error);
      throw new Error('Failed to fetch customers. Please try again.');
    }
  },

  toggleCustomerActive: async (customerId: string, active: boolean): Promise<void> => {
    try {
      await api.put(`/customers.php?id=${customerId}`, {
        activo: active ? 1 : 0
      });
    } catch (error) {
      console.error('Toggle customer active error:', error);
      throw new Error('Failed to update customer status. Please try again.');
    }
  },


  createCustomer: async (customerData: Omit<Cliente, 'id'>): Promise<Cliente> => {
    try {
      const response = await api.post('/customers.php', customerData);

      const responseId = response.data?.id || response.data?.data?.id || null;
      if (!responseId) {
        throw new Error('Server did not return customer ID');
      }
      
      return { ...customerData, id: responseId };
    } catch (error) {
      console.error('Create customer error:', error);
      throw new Error('Failed to create customer. Please try again.');
    }
  },

  updateCustomer: async (id: string, updates: Partial<Cliente>): Promise<void> => {
    try {
      await api.put(`/customers.php?id=${id}`, updates);
    } catch (error) {
      console.error('Update customer error:', error);
      throw new Error('Failed to update customer. Please try again.');
    }
  },

  getDestinations: async (page: number, limit: number, clienteId?: string): Promise<{ data: Destino[]; total: number }> => {
    try {
      const params: Record<string, string | number> = { 
        page,
        limit
      };
      
      // Add cliente_id filter if provided
      if (clienteId) {
        params.cliente_id = clienteId;
      }
      
      const response = await api.get('/destinations.php', { params });
  
      if (response.data?.success) {
        return {
          data: response.data.data || [],
          total: response.data.total || 0
        };
      }
      throw new Error(response.data?.error || 'Failed to fetch destinations');
    } catch (error) {
      console.error('Get destinations error:', error);
      throw new Error('Failed to fetch destinations. Please try again.');
    }
  },

  // Destination endpoints
  getCustomerDestinations: async (customerId: string, query?: string): Promise<Destino[]> => {
    try {
      const params: Record<string, string> = { customer_id: customerId };
      if (query) params.q = query;
      
      const response = await api.get('/destinations.php', { params });
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.warn('Unexpected response format from destinations API:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Get destinations error:', error);
      throw new Error('Failed to fetch destinations. Please try again.');
    }
  },

  advancedSearchDestinations: async (filters: Record<string, string>, mode: 'all' | 'any' = 'all'): Promise<{ data: Destino[]; total: number }> => {
    try {
      // Convert filters to a format that works with our backend
      const queryParams = new URLSearchParams();
      
      // Add each filter to the params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      // Add advanced=true flag and search mode
      queryParams.append('advanced', 'true');
      queryParams.append('mode', mode);
      
      const response = await api.get(`/destinations.php?${queryParams.toString()}`);
      
      if (response.data?.success) {
        return {
          data: response.data.data || [],
          total: response.data.total || 0
        };
      }
      throw new Error(response.data?.error || 'Advanced search request failed');
    } catch (error) {
      console.error('Advanced search error:', error);
      throw new Error('Failed to search destinations. Please try again.');
    }
  },

  // Delete destination
  deleteDestination: async (destinoId: string): Promise<void> => {
    try {
      const response = await api.delete(`/destinations.php?id=${destinoId}`);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to delete destination');
      }
    } catch (error) {
      console.error('Delete destination error:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete destination. Please try again.');
    }
  },
  
  // Add method to get last shipments for a destination
  getDestinationLastShipments: async (destinoId: string): Promise<any[]> => {
    try {
      const response = await api.get('/shipments.php', {
        params: { destino_id: destinoId, limit: 10 }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Get last shipments error:', error);
      throw new Error('Failed to fetch last shipments. Please try again.');
    }
  },

    // Get shipments by destination ID
    getShipmentsByDestination: async (destinoId: string): Promise<Envio[]> => {
      try {
        const response = await api.get('/shipments.php', {
          params: { destino_id: destinoId, limit: 10 } // Only get the last 10 shipments
        });
        
        if (response.data?.success) {
          return response.data.data || [];
        }
        
        return [];
      } catch (error) {
        console.error('Get shipments by destination error:', error);
        return []; // Return empty array instead of throwing
      }
    },

  createDestination: async (destinationData: Omit<Destino, 'id'>): Promise<Destino> => {
    try {
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
        alias: destinationData.alias || null,
        email: destinationData.email || null,
        referencia: destinationData.referencia || null,
        instrucciones_entrega: destinationData.instrucciones_entrega || null
      };

      const response = await api.post('/destinations.php', payload);

      // Handle different response formats
      const responseId = 
        response.data?.id ||
        response.data?.data?.id ||
        null;

      if (!responseId) {
        console.error('Response structure:', response.data);
        throw new Error('Server did not return destination ID');
      }

      return { ...destinationData, id: responseId };
    } catch (error) {
      console.error('Create destination error:', error);
      throw new Error('Failed to create destination. Please try again.');
    }
  },

  updateDestination: async (id: string, updates: Partial<Destino>): Promise<void> => {
    // Skip update if nothing has changed
    if (Object.keys(updates).length === 0) {
      console.log('No changes to update for destination', id);
      return;
    }
    
    return retryWithBackoff(async () => {
      try {
        // Include the ID in the payload as required by the API
        const payload = { id, ...updates };
        await api.put('/destinations.php', payload);
      } catch (error) {
        console.error('Update destination error:', error);
        throw new Error('Failed to update destination. Please try again.');
      }
    });
  },

    // Validation helpers
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


  // Get paginated shipments with optional filters
getShipments: async (
  page: number, 
  limit: number, 
  options?: {
    cliente_id?: string;
    estatus?: string;
    date_start?: string;
    date_end?: string;
    sort_by?: string;
    sort_direction?: 'asc' | 'desc';
  }
): Promise<{ data: EnvioWithDetails[]; total: number }> => {
  try {
    const params: Record<string, string | number> = { 
      page,
      limit
    };
    
    // Add optional filters if provided
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
    }
    
    const response = await api.get('/shipments.php', { params });

    if (response.data?.success) {
      return {
        data: response.data.data || [],
        total: response.data.total || 0
      };
    }
    throw new Error(response.data?.error || 'Failed to fetch shipments');
  } catch (error) {
    console.error('Get shipments error:', error);
    throw new Error('Failed to fetch shipments. Please try again.');
  }
},

// Advanced search with multiple criteria
advancedSearchShipments: async (
  filters: Record<string, string>, 
  mode: 'all' | 'any' = 'all'
): Promise<{ data: EnvioWithDetails[]; total: number }> => {
  try {
    // Convert filters to a format that works with our backend
    const queryParams = new URLSearchParams();
    
    // Add each filter to the params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    // Add advanced=true flag and search mode
    queryParams.append('advanced', 'true');
    queryParams.append('mode', mode);
    
    const response = await api.get(`/shipments.php?${queryParams.toString()}`);
    
    if (response.data?.success) {
      return {
        data: response.data.data || [],
        total: response.data.total || 0
      };
    }
    throw new Error(response.data?.error || 'Advanced search request failed');
  } catch (error) {
    console.error('Advanced search error:', error);
    throw new Error('Failed to search shipments. Please try again.');
  }
},

getDestinationById: async (destinoId: string): Promise<Destino | null> => {
  try {
    const response = await api.get(`/destinations.php?id=${destinoId}`);
    
    if (response.data?.success) {
      return response.data.data;
    }
    
    throw new Error(response.data?.error || 'Failed to fetch destination');
  } catch (error) {
    console.error('Get destination by ID error:', error);
    return null;
  }
},
  // Shipment endpoints
  createShipment: async (
    shipmentData: {
      cliente_id: string;
      destino_id: string;
      servicio_id: string;
      peso_real: number;
      peso_volumetrico: number;
      peso_facturable?: number;
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
      estatus?: string;
    },
    options?: {
      labelFile?: File;
      progressCallback?: (progress: number) => void;
    }
  ): Promise<{ id: string }> => {
    // Retry configuration
    const maxRetries = 3;
    let retryCount = 0;
    let lastError: any = null;
    const initialDelay = 2000; // 2 seconds
    
    // Function to perform the actual API call
    const attemptShipmentCreation = async (): Promise<{ id: string }> => {
      console.log(`Creating shipment - attempt ${retryCount + 1}/${maxRetries + 1}`);
      
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      
      // Set default status if not provided
      if (!shipmentData.estatus) {
        shipmentData.estatus = 'preparacion';
      }
      
      // Define fields that should be handled as numeric values for explicit conversion
      const numericFields = ['peso_real', 'peso_volumetrico', 'peso_facturable', 'costo_neto', 
                            'valor_declarado', 'costo_seguro', 'costo_envio', 'iva', 'total'];
      
      // Add all shipment data to the FormData
      Object.entries(shipmentData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        
        if (numericFields.includes(key)) {
          // Explicit conversion to string for numeric values
          formData.append(key, value.toString());
        } else if (typeof value === 'boolean') {
          // Convert boolean to 0/1
          formData.append(key, value ? '1' : '0');
        } else {
          // Default string conversion for other types
          formData.append(key, String(value));
        }
      });
      
      // Add label file if provided
      if (options?.labelFile) {
        console.log(`Appending label file: ${options.labelFile.name} (${options.labelFile.type}, ${options.labelFile.size} bytes)`);
        formData.append('label_file', options.labelFile);
      }
      
      try {
        // Make the API request
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
        
        // Check if response contains the expected data
        if (!response.data?.id && !response.data?.data?.id) {
          throw new Error('Server response missing shipment ID');
        }
        
        // Extract the shipment ID from the response
        const shipmentId = response.data?.id || response.data?.data?.id;
        console.log(`Shipment created successfully with ID: ${shipmentId}`);
        
        return { id: shipmentId };
      } catch (error) {
        // Check if we got a rate limiting error (429)
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          console.warn(`Rate limited (429). Attempt: ${retryCount + 1}/${maxRetries + 1}`);
          
          // If we haven't exhausted retry attempts, throw a special error to trigger retry
          if (retryCount < maxRetries) {
            error.isRateLimited = true;
            throw error;
          }
        }
        
        // Log detailed error info for debugging
        if (axios.isAxiosError(error)) {
          console.error("Error creating shipment:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
          });
        } else {
          console.error("Unknown error creating shipment:", error);
        }
        
        // Rethrow the error for parent catch block
        throw error;
      }
    };
    
    // Main execution with retry logic
    while (true) {
      try {
        return await attemptShipmentCreation();
      } catch (error) {
        lastError = error;
        
        // Check if this is a rate limiting error and we should retry
        if (axios.isAxiosError(error) && error.isRateLimited && retryCount < maxRetries) {
          retryCount++;
          
          // Calculate backoff delay with exponential increase
          const backoffDelay = initialDelay * Math.pow(2, retryCount - 1);
          console.log(`Retrying in ${backoffDelay}ms...`);
          
          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        } else {
          // Either not a rate limiting error or we've exhausted retries
          // Format a more user-friendly error message
          if (axios.isAxiosError(lastError)) {
            if (lastError.response?.status === 429) {
              throw new Error('Service temporarily unavailable due to high traffic. Please try again later.');
            } else if (lastError.response?.data?.error) {
              throw new Error(`Shipment creation failed: ${lastError.response.data.error}`);
            } else {
              throw new Error(`Shipment creation failed: ${lastError.message}`);
            }
          } else if (lastError instanceof Error) {
            throw new Error(`Shipment creation failed: ${lastError.message}`);
          } else {
            throw new Error('Shipment creation failed due to an unknown error');
          }
        }
      }
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

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      const response = await api.post('/change-password.php', {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Change password error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('La contraseña actual es incorrecta');
      } else if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Error al cambiar la contraseña');
      }
      throw new Error('Error al cambiar la contraseña. Por favor intente nuevamente.');
    }
  },

  getUsers: async (page: number, limit: number): Promise<{ data: User[]; total: number }> => {
    try {
      const response = await api.get('/users.php', {
        params: { 
          page,
          limit
        }
      });
  
      if (response.data?.success) {
        return {
          data: response.data.data || [],
          total: response.data.total || 0
        };
      }
      throw new Error(response.data?.error || 'Failed to fetch users');
    } catch (error) {
      console.error('Get users error:', error);
      throw new Error('Failed to fetch users. Please try again.');
    }
  },
  
  advancedSearchUsers: async (filters: Record<string, string>, mode: 'all' | 'any' = 'all'): Promise<{ data: User[]; total: number }> => {
    try {
      // Convert filters to a format that works with our backend
      const queryParams = new URLSearchParams();
      
      // Add each filter to the params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      // Add advanced=true flag and search mode
      queryParams.append('advanced', 'true');
      queryParams.append('mode', mode);
      
      const response = await api.get(`/users.php?${queryParams.toString()}`);
      
      if (response.data?.success) {
        return {
          data: response.data.data || [],
          total: response.data.total || 0
        };
      }
      throw new Error(response.data?.error || 'Advanced search request failed');
    } catch (error) {
      console.error('Advanced search error:', error);
      throw new Error('Failed to search users. Please try again.');
    }
  },
  
  updateUser: async (id: string, updates: Record<string, any>): Promise<void> => {
    try {
      await api.put(`/users.php?id=${id}`, updates);
    } catch (error) {
      console.error('Update user error:', error);
      throw new Error('Failed to update user. Please try again.');
    }
  },
  
  getUserActivity: async (userId: string): Promise<UserToken[]> => {
    try {
      const response = await api.get(`/user-tokens.php`, {
        params: { user_id: userId }
      });
  
      if (response.data?.success) {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Get user activity error:', error);
      throw new Error('Failed to fetch user activity. Please try again.');
    }
  },
  
  invalidateUserToken: async (tokenId: number): Promise<void> => {
    try {
      await api.put(`/user-tokens.php?id=${tokenId}`, {
        is_valid: 0
      });
    } catch (error) {
      console.error('Invalidate token error:', error);
      throw new Error('Failed to invalidate token. Please try again.');
    }
  },
  
  invalidateAllUserTokens: async (userId: string): Promise<void> => {
    try {
      await api.put(`/user-tokens.php`, {
        user_id: userId,
        is_valid: 0
      });
    } catch (error) {
      console.error('Invalidate all tokens error:', error);
      throw new Error('Failed to invalidate all tokens. Please try again.');
    }
  },
  
  resetUserPassword: async (userId: string, newPassword: string): Promise<void> => {
    try {
      await api.put(`/users.php?id=${userId}`, {
        password: newPassword,
        password_reset: true
      });
    } catch (error) {
      console.error('Reset password error:', error);
      throw new Error('Failed to reset password. Please try again.');
    }
  },

  /**
 * Gets user preferences from the server
 */
getUserPreferences: async (): Promise<{
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
  emailNotifications: boolean;
}> => {
  try {
    const response = await api.get('/user-preferences.php');
    
    if (response.data?.success) {
      return {
        theme: response.data.data.theme || 'system',
        language: response.data.data.language || 'es',
        emailNotifications: response.data.data.email_notifications === 1
      };
    }
    
    throw new Error(response.data?.error || 'Failed to fetch preferences');
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    
    // Return defaults if fetching fails
    return {
      theme: 'light',
      language: 'es',
      emailNotifications: true
    };
  }
},

/**
 * Saves user preferences to the server
 */
saveUserPreferences: async (preferences: {
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
  emailNotifications: boolean;
}): Promise<void> => {
  try {
    // Convert to format expected by the server
    const payload = {
      theme: preferences.theme,
      language: preferences.language,
      email_notifications: preferences.emailNotifications ? 1 : 0
    };
    
    const response = await api.post('/user-preferences.php', payload);
    
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to save preferences');
    }
  } catch (error) {
    console.error('Error saving user preferences:', error);
    throw new Error('Failed to save preferences. Please try again.');
  }
},
  
  // This function extends your existing createUser method
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
      
      if (response.data?.success) {
        return { 
          id: response.data.id || response.data.data?.id 
        };
      }
      throw new Error(response.data?.error || 'User creation failed');
    } catch (error) {
      console.error('Create user error:', error);
      throw new Error('Failed to create user. Please try again.');
    }
  }

};




// Type guards for API responses
export function isApiError(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}