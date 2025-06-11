import { Cliente, Destino, ServicioCotizado } from '../../../types';
import { AxiosError } from 'axios';
import { apiService } from '../../../services';

/**
 * Gets initial Cliente state with given postal code
 */
export function getInitialClienteState(zip: string): Cliente {
  return {
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    razon_social: '',
    rfc: '',
    telefono: '',
    telefono_alternativo: '',
    email: '',
    tipo: 'persona',
    calle: '',
    numero_exterior: '',
    numero_interior: '',
    colonia: '',
    municipio: '',
    estado: '',
    codigo_postal: zip || '',
    pais: 'México',
    referencia: '',
    notas: ''
  };
}

/**
 * Gets initial Destino state with given postal code
 */
export function getInitialDestinoState(zip: string): Destino {
  return {
    alias: '',
    nombre_destinatario: '',
    direccion: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigo_postal: zip || '',
    pais: 'México',
    telefono: '',
    email: '',
    referencia: '',
    instrucciones_entrega: ''
  };
}

/**
 * Validates form fields for Cliente
 */
export function validateClienteForm(cliente: Cliente): boolean {
  return (
    cliente.nombre.trim() !== '' &&
    cliente.apellido_paterno.trim() !== '' &&
    cliente.telefono.trim() !== '' &&
    cliente.calle.trim() !== '' &&
    cliente.colonia.trim() !== '' &&
    cliente.municipio.trim() !== '' &&
    cliente.estado.trim() !== '' &&
    cliente.codigo_postal.trim() !== ''
  );
}

/**
 * Validates form fields for Destino
 */
export function validateDestinoForm(destino: Destino): boolean {
  return (
    destino.nombre_destinatario.trim() !== '' &&
    destino.direccion.trim() !== '' &&
    destino.colonia.trim() !== '' &&
    destino.ciudad.trim() !== '' &&
    destino.estado.trim() !== '' &&
    destino.codigo_postal.trim() !== '' &&
    destino.telefono.trim() !== ''
  );
}

/**
 * Updates destination data with retry logic for rate limiting
 */
export async function updateDestinationWithRetry(destinoId: string, destinoPayload: any): Promise<void> {
  let retryCount = 0;
  const maxRetries = 3;
  const initialDelay = 2000; // 2 seconds
  
  while (retryCount <= maxRetries) {
    try {
      await apiService.updateDestination(destinoId, destinoPayload);
      break; // Success, exit the loop
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 429) {
        // Rate limited - should we retry?
        if (retryCount < maxRetries) {
          retryCount++;
          const backoffDelay = initialDelay * Math.pow(2, retryCount - 1);
          console.log(`Rate limited when updating destination. Retrying in ${backoffDelay}ms... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        } else {
          // Exhausted retries but this is non-critical - continue with shipment
          console.warn('Rate limited when updating destination, continuing with shipment creation');
          break;
        }
      } else {
        // Not a rate limit error - log and continue with shipment
        console.error('Error updating destination:', error);
        break;
      }
    }
  }
}

/**
 * Creates shipment data from the inputs
 */
export function createShipmentData(
  clienteId: string, 
  destinoId: string, 
  selectedService: ServicioCotizado, 
  contenido: string,
  selectedOption: 'none' | 'external' | 'manuable',
  externalLabelData?: { carrier: string; trackingNumber: string; labelFile: File | null },
  externalCost?: number | null,
  selectedManuableService?: any,
  tempCotizacionId?: string,
  manuableLabelData?: { tracking_number?: string; label_url?: string; price?: string },
  empaqueCharge?: number,
  seguroCharge?: number,
  recoleccionCharge?: number,
  reexpedicionCharge?: number,
  discountData?: {
    tipo: 'porcentaje' | 'fijo' | 'codigo' | '';
    valor: number;
    codigo?: string;
    aplicado: boolean;
    subtotalBeforeDiscount?: number;
    discountAmount?: number;
  }

): any {

const baseServiceCost = selectedService.precioBase + (selectedService.cargoSobrepeso || 0);
  const totalAdditionalCharges = (empaqueCharge || 0) + (seguroCharge || 0) + (recoleccionCharge || 0) + (reexpedicionCharge || 0);
  const subtotalBeforeDiscount = baseServiceCost + totalAdditionalCharges;

  // Calculate discount amount
  let discountAmount = 0;
  if (discountData?.aplicado && discountData.valor > 0) {
    switch (discountData.tipo) {
      case 'porcentaje':
        discountAmount = subtotalBeforeDiscount * (discountData.valor / 100);
        break;
      case 'fijo':
      case 'codigo':
        discountAmount = Math.min(discountData.valor, subtotalBeforeDiscount);
        break;
    }
  }

  // Calculate final amounts
  const subtotalAfterDiscount = subtotalBeforeDiscount - discountAmount;
  const ivaAmount = subtotalAfterDiscount * 0.16; // 16% IVA
  const totalWithIva = subtotalAfterDiscount + ivaAmount;

  const shipmentData: any = {
    cliente_id: clienteId,
    destino_id: destinoId,
    servicio_id: selectedService.sku,
    
    // Weight mapping - use actual weight values from service
    peso_real: selectedService.peso || 1,
    peso_volumetrico: selectedService.pesoVolumetrico || 1,
    peso_facturable: selectedService.pesoFacturable || Math.max(selectedService.peso || 1, selectedService.pesoVolumetrico || 1),
    
    valor_declarado: selectedService.valorSeguro || 0,
    
    // Individual charge mapping
    costo_seguro: seguroCharge || selectedService.costoSeguro || 0,
    costo_sobrepeso: selectedService.cargoSobrepeso || 0,
    costo_empaque: empaqueCharge || 0,
    costo_recoleccion: recoleccionCharge || 0,
    costo_reexpedicion: reexpedicionCharge || 0,
    
    // Discount fields
    descuento_tipo: discountData?.aplicado ? discountData.tipo : null,
    descuento_valor: discountData?.aplicado ? discountData.valor : 0,
    descuento_codigo: discountData?.aplicado && discountData.tipo === 'codigo' ? discountData.codigo : null,
    subtotal_antes_descuento: subtotalBeforeDiscount,
    
    // Base shipping cost (service base price)
    costo_envio: selectedService.precioBase,
    
    // Calculated IVA and total
    iva: ivaAmount,
    total: totalWithIva,
    
    tipo_paquete: selectedService.tipoPaquete || 'paquete',
    opcion_empaque: selectedService.opcionEmpaque || undefined,
    requiere_recoleccion: (recoleccionCharge && recoleccionCharge > 0) || selectedService.requiereRecoleccion || false,
    estatus: 'preparacion',
    contenido: contenido, // Use correct field name (assuming DB is fixed)
    
    // Set method based on selected option
    metodo_creacion: selectedOption === 'external' ? 'externo' : 
                    selectedOption === 'manuable' ? 'manuable' : 'interno',
    
    // Add the temporary ID from quotation to link records
    temp_cotizacion_id: tempCotizacionId ? tempCotizacionId : undefined
  };

  // Add external label data if applicable
  if (selectedOption === 'external' && externalLabelData) {
    shipmentData.paqueteria_externa = externalLabelData.carrier;
    shipmentData.numero_guia_externa = externalLabelData.trackingNumber;
    shipmentData.costo_neto = externalCost;
    // For external option, we don't set ruta_etiqueta here as it will be 
    // uploaded as a file in the form data
  }

  // Add Manuable data if applicable
  if (selectedOption === 'manuable' && selectedManuableService) {
    shipmentData.uuid_manuable = selectedManuableService.uuid;
    shipmentData.servicio_manuable = `${selectedManuableService.carrier} - ${selectedManuableService.service}`;
    shipmentData.costo_neto = parseFloat(selectedManuableService.total_amount);
    shipmentData.paqueteria_externa = selectedManuableService.carrier;
    
    // Add tracking number if available from Manuable API response
    if (manuableLabelData?.tracking_number) {
      shipmentData.numero_guia_externa = manuableLabelData.tracking_number;
    }
    
    // Use the new dedicated field for Manuable label URLs
    if (manuableLabelData?.label_url) {
      shipmentData.manuable_label_url = manuableLabelData.label_url;
    }
  }

  return shipmentData;
}

/**
 * Extracts external number from address
 */
export function extractExternalNumber(address: string): string {
  // Try to match common patterns for street numbers
  const matches = address.match(/\b[Nn][o]?\.\s*(\d+(?:-\w+)?)\b|\b#(\d+)\b|\b(\d+(?:-\w+)?)\b/);
  
  if (matches) {
    // Return the first capture group that matched
    return matches[1] || matches[2] || matches[3] || 'S/N';
  }
  
  return 'S/N'; // Return 'S/N' if no match found
}