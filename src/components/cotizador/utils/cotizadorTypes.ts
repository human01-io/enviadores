export interface DeliveryFrequency {
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
  
  export interface EstafetaResult {
    reexpe: string;
    success: boolean;
    error?: string;
    ocurreForzoso?: string;
    estafetaDeliveryDays?: {
      [key: string]: boolean;
    };
    htmlSnippet?: string;
  }
  
  export interface ServicioCotizado {
    sku: string;
    nombre: string;
    precioBase: number;
    precioFinal: number;
    cargoSobrepeso: number;
    diasEstimados: number;
    precioTotal: number;
    precioConIva: number;
    iva: number;
    pesoFacturable?: number;
    esInternacional: boolean;
  }
  
  export interface DetallesCotizacion {
    empaque: number;
    empaqueConIva: number;
    seguro: number;
    seguroConIva: number;
    recoleccion: number;
    recoleccionConIva: number;
    reexpedicion: number;
    reexpedicionConIva: number;
    pesoTotal: number;
    pesoVolumetrico: number;
    pesoFacturable: number;
    iva: number;
    totalConIva: number;
  }
  
  export interface Notification {
    show: boolean;
    message: string;
    details?: any;
  }
  
  export interface ZipCodeData {
    estado: string;
    municipio: string;
    ciudad: string;
    colonias: string[];
  }
  
  export interface CotizadorState {
    originZip: string;
    destZip: string;
    zone: number | null;
    selectedZone: number | null;
    isInternational: boolean;
    packageType: string;
    length: string;
    width: string;
    height: string;
    weight: string;
    insurance: boolean;
    insuranceValue: string;
    volumetricWeight: number;
    packagingOption: string;
    customPackagingPrice: number | null;
    collectionRequired: boolean;
    collectionPrice: number | null;
    isValidated: boolean;
    flowStage: 'quote' | 'customer-data';
    // Add these new fields to store client and destination IDs
    clienteId?: string | null;
    destinoId?: string | null;
    servicios?: ServicioCotizado[];
    detallesCotizacion?: DetallesCotizacion;
  }
  
  export interface AddressData {
    estado: string;
    municipio: string;
    ciudad: string;
    colonias: string[];
  }
  
  export type FlowStage = 'quote' | 'customer-data';