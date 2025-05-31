import { Cliente, Destino, ServicioCotizado } from '../types';
import { ManuableAddress, ManuableParcel, ManuableRate } from '../services/manuableService';
import { manuableConfig } from '../config/manuableConfig';

/**
 * Utility functions for mapping between our app data model and Manuable API formats
 */

/**
 * Map Cliente data to Manuable address format
 */
export const mapClienteToManuableAddress = (cliente: Cliente): ManuableAddress => {
  return {
    name: `${cliente.nombre} ${cliente.apellido_paterno} ${cliente.apellido_materno || ''}`.trim(),
    street1: cliente.calle,
    neighborhood: cliente.colonia,
    external_number: cliente.numero_exterior,
    city: cliente.municipio,
    state: cliente.estado,
    phone: cliente.telefono,
    email: cliente.email,
    country: (cliente.pais || 'México').toUpperCase(),
    country_code: 'MX', // Default to Mexico
    reference: cliente.referencia || '',
    zip_code: cliente.codigo_postal,
    company: cliente.razon_social || 'enviadores.com.mx',
  };
};

/**
 * Map Destino data to Manuable address format
 */
export const mapDestinoToManuableAddress = (destino: Destino): ManuableAddress => {
  return {
    name: destino.nombre_destinatario,
    street1: destino.direccion,
    neighborhood: destino.colonia,
    external_number: '', // Not available in our destination model
    city: destino.ciudad,
    state: destino.estado,
    phone: destino.telefono,
    email: destino.email || '',
    country: (destino.pais || 'México').toUpperCase(),
    country_code: 'MX', // Default to Mexico
    reference: destino.referencia || '',
    zip_code: destino.codigo_postal,
    company: destino.alias || '',
  };
};

/**
 * Map basic postal code data for rate queries
 */
export const mapPostalCodeToManuableAddress = (postalCode: string): ManuableAddress => {
  return {
    country_code: 'MX',
    zip_code: postalCode
  };
};

/**
 * Map package details from ServicioCotizado to ManuableParcel format
 */
export const mapToManuableParcel = (
  servicio: ServicioCotizado,
  height?: number,
  length?: number,
  width?: number
): ManuableParcel => {
  // Determine if it's an envelope or package
  const isEnvelope = servicio.tipoPaquete === 'sobre';
  
  // Get default dimensions based on package type
  const defaultDimensions = isEnvelope
    ? manuableConfig.productTypes.sobre
    : manuableConfig.productTypes.paquete;
  
  return {
    currency: manuableConfig.defaults.currency,
    distance_unit: manuableConfig.defaults.distance_unit,
    mass_unit: manuableConfig.defaults.mass_unit,
    weight: servicio.pesoFacturable || 1,
    height: height || defaultDimensions.height,
    length: length || defaultDimensions.length,
    width: width || defaultDimensions.width,
    product_id: manuableConfig.defaults.product_id,
    product_value: servicio.valorSeguro || 100,
    quantity_products: 1,
    content: servicio.contenido || manuableConfig.defaults.content,
  };
};

/**
 * Convert Manuable rate to our ServicioCotizado format for display
 */
export const convertManuableRateToServicio = (rate: ManuableRate): ServicioCotizado => {
  const precioFinal = parseFloat(rate.total_amount);
  const iva = precioFinal * 0.16; // Assuming 16% IVA
  
  return {
    sku: rate.uuid,
    nombre: `${rate.carrier} - ${rate.service}`,
    precioBase: precioFinal,
    precioFinal: precioFinal,
    precioConIva: precioFinal + iva,
    cargoSobrepeso: 0,
    diasEstimados: 2, // Default value, Manuable doesn't return this
    iva: iva,
    esInternacional: false,
    tipoPaquete: 'paquete', // Default
    opcionEmpaque: null
  };
};