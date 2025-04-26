/**
 * Constants used in the Cotizador component
 */

// Default pricing for standard packaging options
export const PACKAGING_OPTIONS = [
    { id: 'EMP00', name: 'Sin empaque', price: 0 },
    { id: 'EMP01', name: 'Sobre', price: 10 },
    { id: 'EMP02', name: 'Chico', price: 25 },
    { id: 'EMP03', name: 'Mediano', price: 70 },
    { id: 'EMP04', name: 'Grande', price: 170 },
    { id: 'EMP05', name: 'Personalizado', price: null }
  ];
  
  // Days of the week for delivery frequency
  export const DAYS_OF_WEEK = [
    { name: 'Lunes', key: 'lunes', short: 'L' },
    { name: 'Martes', key: 'martes', short: 'M' },
    { name: 'Miércoles', key: 'miercoles', short: 'MI' },
    { name: 'Jueves', key: 'jueves', short: 'J' },
    { name: 'Viernes', key: 'viernes', short: 'V' },
    { name: 'Sábado', key: 'sabado', short: 'S' },
    { name: 'Domingo', key: 'domingo', short: 'D' }
  ];
  
  // Estafeta days mapping (different format)
  export const ESTAFETA_DAYS = [
    { name: 'Lunes', key: 'lunes' },
    { name: 'Martes', key: 'martes' },
    { name: 'Miercoles', key: 'miercoles' },
    { name: 'Jueves', key: 'jueves' },
    { name: 'Viernes', key: 'viernes' },
    { name: 'Sábado', key: 's&#225;bado' },
    { name: 'Domingo', key: 'domingo' }
  ];
  
  // International shipping zones
  export const INTERNATIONAL_ZONES = [1, 2, 3, 4, 5];
  
  // Package types
  export const PACKAGE_TYPES = [
    { id: 'Paquete', name: 'Paquete' },
    { id: 'Sobre', name: 'Sobre' }
  ];
  
  // Default IVA rate (16%)
  export const DEFAULT_IVA_RATE = 0.16;
  
  // Maximum weight allowed (kg)
  export const MAX_WEIGHT = 70;
  
  // Format for currency display
  export const CURRENCY_FORMAT_OPTIONS = { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };
  
  // Regular expression for international packages (GED/GEN services)
  export const INTERNATIONAL_SERVICE_REGEX = /^G(E[DN]0[1-5])$/;
  
  // Divisor for volumetric weight calculation
  export const VOLUMETRIC_DIVISOR = 5000;