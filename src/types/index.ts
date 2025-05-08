/**
 * Database models and UI component props interfaces
 */

/**
 * Service quote interface used for displaying shipping service options
 */

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
  request?: any;
}
export interface ServicioCotizado {
    sku: string;                   // Service identifier
    nombre: string;                // Service name
    precioBase: number;            // Base price
    precioFinal: number;           // Final price before tax
    precioConIva: number;
    iva: number;          // Final price with tax
    cargoSobrepeso: number;        // Overweight charge
    diasEstimados: number;         // Estimated delivery days
    pesoFacturable?: number;       // Billable weight
    valorSeguro?: number;          // Declared value for insurance
    costoSeguro?: number;          // Insurance cost
    tipoPaquete?: string;          // Package type ('sobre' or 'paquete')
    opcionEmpaque?: string | null;        // Packaging option
    requiereRecoleccion?: boolean;
    esInternacional: boolean;
  }
  
  /**
   * Cliente (Customer) model based on database structure 
   */
  export interface Cliente {
    id?: string;                   // Primary key (varchar 12)
    nombre: string;                // First name (varchar 100)
    apellido_paterno: string;      // Father's last name (varchar 50)
    apellido_materno?: string;     // Mother's last name (varchar 50)
    razon_social?: string;         // Business name (varchar 100)
    rfc?: string;                  // Tax ID (RFC) (varchar 13)
    telefono: string;              // Phone number (varchar 15)
    telefono_alternativo?: string; // Alternative phone (varchar 15)
    email: string;                 // Email address (varchar 100)
    tipo: string;                  // Type: 'persona', 'empresa', or 'gobierno'
    calle: string;                 // Street name (varchar 100) 
    numero_exterior: string;       // Exterior number (varchar 20)
    numero_interior?: string;      // Interior number (varchar 20)
    colonia: string;               // Neighborhood (varchar 100)
    municipio: string;             // Municipality (varchar 100)
    estado: string;                // State (varchar 50)
    codigo_postal: string;         // Postal code (varchar 5)
    pais?: string;                 // Country, default 'México' (varchar 50)
    referencia?: string;           // Address reference (text)
    notas?: string;                // Notes (text)
    activo?: boolean;              // Active status (tinyint)
    colonias?: string[];           // Available neighborhoods (UI helper, not in DB)
    created_at?: string;           // Creation timestamp
    updated_at?: string;           // Last update timestamp
  }
  
  /**
   * Destino (Destination) model based on database structure
   */
  export interface Destino {
    id?: string;                     // Primary key (varchar 14)
    cliente_id?: string;             // Foreign key to Cliente (varchar 12)
    alias?: string;                  // Friendly name like "Home", "Office" (varchar 50)
    nombre_destinatario: string;     // Recipient name (varchar 100)
    direccion: string;               // Address (varchar 100)
    colonia: string;                 // Neighborhood (varchar 100)
    ciudad: string;                  // City (varchar 100)
    estado: string;                  // State (varchar 50)
    codigo_postal: string;           // Postal code (varchar 5)
    pais?: string;                   // Country, default 'México' (varchar 50)
    telefono: string;                // Phone number (varchar 15)
    email?: string;                  // Email address (varchar 100)
    referencia?: string;             // Address reference (text)
    instrucciones_entrega?: string;  // Delivery instructions (text)
    colonias?: string[];             // Available neighborhoods (UI helper, not in DB)
    created_at?: string;             // Creation timestamp
    updated_at?: string;
    [key: string]: any;             // Last update timestamp
  }
  
  /**
   * Envio (Shipment) model based on database structure
   */
  export interface ShipmentDetails {
    id?: string;                      // Primary key YYYYMMDDXXXXXX format (varchar 17)
    cliente_id: string;               // Foreign key to Cliente (varchar 12)
    destino_id: string;               // Foreign key to Destino (varchar 14)
    servicio_id: string;              // Foreign key to servicios_envio (varchar 10)
    guia?: string;                    // Tracking number from carrier (varchar 20)
    estatus: EnvioEstatus;            // Shipment status (enum)
    peso_real: number;                // Actual weight in kg (decimal 10,2)
    peso_volumetrico: number;         // Volumetric weight in kg (decimal 10,2)
    peso_facturable: number;          // Billable weight in kg (decimal 10,2)
    largo?: number;                   // Length in cm (decimal 10,2)
    ancho?: number;                   // Width in cm (decimal 10,2)
    alto?: number;                    // Height in cm (decimal 10,2)
    valor_declarado?: number;         // Declared value (decimal 10,2)
    costo_seguro?: number;            // Insurance cost (decimal 10,2)
    costo_envio: number;              // Shipping cost (decimal 10,2)
    iva: number;                      // Tax amount (decimal 10,2)
    total: number;                    // Total cost (decimal 10,2)
    tipo_paquete: string; // Package type (enum)
    opcion_empaque?: string;          // Packaging option (varchar 10)
    requiere_recoleccion: boolean;    // Whether pickup is required (tinyint)
    fecha_recoleccion?: string;       // Pickup date (datetime)
    fecha_entrega_estimada?: string;  // Estimated delivery date (date)
    fecha_entrega_real?: string;      // Actual delivery date (datetime)
    incidencia?: string;              // Incident description (text)
    evidencia_entrega?: string;       // Delivery proof URL (text)
    notas?: string;                   // Notes (text)
    metodo_creacion: 'interno' | 'externo' | 'manuable';
    paqueteria_externa?: string;
    numero_guia_externa?: string;
    ruta_etiqueta_externa?: string;
    uuid_manuable?: string;
    servicio_manuable?: string;
    costo_neto?: number;
    created_at?: string;              // Creation timestamp
    updated_at?: string;              // Last update timestamp
    created_by?: number;              // ID of user who created the shipment (int)
  }

  // Add this to your types.ts file

  export interface Envio {
    id: string;
    cliente_id: string;
    destino_id: string;
    servicio_id: string;
    guia: string | null;
    estatus: EnvioEstatus;
    peso_real: number;
    peso_volumetrico: number;
    peso_facturable: number;
    largo: number | null;
    ancho: number | null;
    alto: number | null;
    valor_declarado: number;
    costo_seguro: number;
    costo_envio: number;
    iva: number;
    total: number;
    tipo_paquete: 'sobre' | 'paquete';
    opcion_empaque: string | null;
    requiere_recoleccion: boolean;
    fecha_recoleccion: string | null;
    fecha_entrega_estimada: string | null;
    fecha_entrega_real: string | null;
    incidencia: string | null;
    evidencia_entrega: string | null;
    notas: string | null;
    created_at: string;
    updated_at: string;
    created_by: number | null;
    metodo_creacion: 'interno' | 'externo' | 'manuable';
    paqueteria_externa: string | null;
    numero_guia_externa: string | null;
    ruta_etiqueta: string | null;
    uuid_manuable: string | null;
    servicio_manuable: string | null;
    costo_neto: number;
  }

  export interface EnvioWithDetails extends Envio {
    cliente_nombre: string;
    nombre_destinatario: string;
    username?: string;
  }
  
  /**
   * Shipment status enum type
   */
  export type EnvioEstatus = 
    'cotizado' |      // Quoted
    'preparacion' |   // In preparation
    'transito' |      // In transit
    'entregado' |     // Delivered
    'devolucion' |    // Return
    'cancelado' |     // Cancelled
    'incidencia';     // With incident
  
  /**
   * Location data interface for origin and destination
   */
  export interface LocationData {
    estado: string;
    municipio: string;
    ciudad: string;
    colonias: string[];
  }
  
  /**
   * Props for the DatosCliente component
   */
  export interface DatosClienteProps {
    selectedService: ServicioCotizado;
    onBack: () => void;
    onSubmit: (envioData: {
      cliente: Cliente;
      destino: Destino;
      shipmentId: string;
    }) => void;
    originData?: LocationData;
    destData?: LocationData;
    originZip: string;
    destZip: string;
  }
  
  /**
   * Form data for new shipment submission
   */
  export interface EnvioFormData {
    cliente: Cliente;
    destino: Destino;
    shipmentId: string;
    
    servicio: ServicioCotizado;
  }
  
  /**
   * API response for quotation
   */
  export interface CotizacionResponse {
    success: boolean;
    services?: ServicioCotizado[];
    error?: string;
  }
  
  /**
   * API response for shipment creation
   */
  export interface EnvioResponse {
    success: boolean;
    shipment?: ShipmentDetails;
    error?: string;
  }

// Add this to your existing types
export interface DashboardCardProps {
  title: string;
  items: string[];
  onItemClick?: (item: string, event: React.MouseEvent) => void;
}

export type UserRole = 'admin_user' | 'customer_user';

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  cliente_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface AccountModalProps {
  user: {
    name: string;
    email: string;
    phone: string;
    role: string;
    // Add any additional fields you need
    avatar?: string;
    lastLogin?: string;
  };
  onClose: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  isLoading?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  last_login?: string;
}

// For the ProtectedRoute component
export interface ProtectedRouteProps {
  children: React.ReactNode;
  isJustRedirected?: boolean;
  requiredRole?: string;
}

// If you're modifying the existing PrivateRoute component
export interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}


export interface UserToken {
  id: number;
  user_id: string;
  token: string;
  issued_at: string;
  expires_at: string;
  last_used_at: string;
  user_agent: string | null;
  ip_address: string | null;
  is_valid: boolean;
}
