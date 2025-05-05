import { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { Cliente, Destino, ServicioCotizado } from '../../types';
import ClienteForm from './ClienteForm';
import DestinoForm from './DestinoForm';
import EnvioConfirmation from './EnvioConfirmation';
import ShippingOptions from './ShippingOptions';
import { ManuableRate } from '../../services/manuableService';
import { AxiosError } from 'axios';

interface DatosEnvioProps {
  selectedService: ServicioCotizado;
  onBack: () => void;
  onSubmit: (envioData: {
    cliente: Cliente;
    destino: Destino;
    shipmentId: string;
  }) => void;
  originData?: {
    estado: string;
    municipio: string;
    ciudad: string;
    colonias: string[];
  };
  destData?: {
    estado: string;
    municipio: string;
    ciudad: string;
    colonias: string[];
  };
  originZip: string;
  destZip: string;
  clienteId?: string | null;
  destinoId?: string | null;
}

export default function DatosEnvio({
  selectedService,
  onBack,
  onSubmit,
  originData,
  destData,
  originZip,
  destZip,
  clienteId,
  destinoId
}: DatosEnvioProps) {
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [selectedOption, setSelectedOption] = useState<'none' | 'external' | 'manuable'>('none');
  
  // Form states
  const [cliente, setCliente] = useState<Cliente>({
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
    codigo_postal: originZip || '',
    pais: 'México',
    referencia: '',
    notas: ''
  });

  const [destino, setDestino] = useState<Destino>({
    alias: '',
    nombre_destinatario: '',
    direccion: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigo_postal: destZip || '',
    pais: 'México',
    telefono: '',
    email: '',
    referencia: '',
    instrucciones_entrega: ''
  });

  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [isExistingDestino, setIsExistingDestino] = useState(false);
  const [zipValidation, setZipValidation] = useState({
    originValid: true,
    destValid: true
  });

  // External label data
  const [externalLabelData, setExternalLabelData] = useState<{
    carrier: string;
    trackingNumber: string;
    labelFile: File | null;
  }>({
    carrier: '',
    trackingNumber: '',
    labelFile: null
  });

  const [externalCost, setExternalCost] = useState<number | null>(null);

  // Manuable services
  const [manuableServices, setManuableServices] = useState<ManuableRate[]>([]);
  const [selectedManuableService, setSelectedManuableService] = useState<ManuableRate | null>(null);

  // Package details for Manuable API
  const [packageDetails, setPackageDetails] = useState({
    peso: selectedService.pesoFacturable || 1,
    alto: 10,
    largo: 10,
    ancho: 10,
    valor_declarado: selectedService.valorSeguro || 0
  });

  // Load existing client and destination data if IDs are provided
  useEffect(() => {
    const loadExistingData = async () => {
      if (clienteId) {
        try {
          const results = await apiService.searchCustomers(clienteId);
          if (results && results.length > 0) {
            const clienteData = results[0];
            setCliente(prev => ({
              ...prev,
              ...clienteData,
              id: clienteData.id
            }));
            setIsExistingCustomer(true);
          }
        } catch (error) {
          console.error('Error loading client data:', error);
        }
      }

      if (clienteId && destinoId) {
        try {
          const results = await apiService.getCustomerDestinations(clienteId);
          if (results && results.length > 0) {
            const destinoData = results.find(d => d.id === destinoId);
            if (destinoData) {
              setDestino(prev => ({
                ...prev,
                ...destinoData,
                id: destinoData.id
              }));
              setIsExistingDestino(true);
            }
          }
        } catch (error) {
          console.error('Error loading destination data:', error);
        }
      }
    };

    loadExistingData();
  }, [clienteId, destinoId]);

  // Form validation
  const isClientFormValid = (): boolean => {
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
  };

  const isDestinoFormValid = (): boolean => {
    return (
      destino.nombre_destinatario.trim() !== '' &&
      destino.direccion.trim() !== '' &&
      destino.colonia.trim() !== '' &&
      destino.ciudad.trim() !== '' &&
      destino.estado.trim() !== '' &&
      destino.codigo_postal.trim() !== '' &&
      destino.telefono.trim() !== ''
    );
  };


  // Submit function
  const handleSubmit = async () => {
    if (!isClientFormValid() || !isDestinoFormValid()) {
      alert('Por favor complete todos los campos requeridos en ambos formularios');
      return;
    }
  
    if (selectedOption === 'none') {
      alert('Por favor seleccione una opción de envío');
      return;
    }
  
    // Check shipping option specific validations
    if (selectedOption === 'external') {
      if (!externalLabelData.carrier) {
        alert('Por favor seleccione una paquetería');
        return;
      }
      if (!externalLabelData.trackingNumber) {
        alert('Por favor ingrese el número de guía');
        return;
      }
      if (!externalLabelData.labelFile) {
        alert('Por favor seleccione un archivo de etiqueta');
        return;
      }
      if (externalCost === null) {
        alert('Por favor ingrese el costo neto');
        return;
      }
    }
  
    if (selectedOption === 'manuable' && !selectedManuableService) {
      alert('Por favor seleccione un servicio de Manuable');
      return;
    }
  
    // Validate ZIP codes against original quote
    if (cliente.codigo_postal !== originZip || destino.codigo_postal !== destZip) {
      alert("Los códigos postales no coinciden con la cotización original. Por favor genere una nueva cotización.");
      return;
    }
  
    if (!zipValidation.originValid || !zipValidation.destValid) {
      alert("Por favor verifique los códigos postales");
      return;
    }
  
    try {
      // Save or update client
      let clienteId = cliente.id;
      if (!clienteId) {
        const { id } = await apiService.createCustomer(cliente);
        clienteId = id;
      } else if (isExistingCustomer) {
        await apiService.updateCustomer(clienteId, cliente);
      }
  
      // Save or update destination
      let destinoId = destino.id;
      const destinoPayload = {
        ...destino,
        cliente_id: clienteId
      };
  
      if (!destinoId) {
        // Create new destination if no ID exists
        try {
          const newDestino = await apiService.createDestination(destinoPayload);
          destinoId = newDestino.id;
        } catch (error) {
          console.error('Error creating destination:', error);
          throw new Error('Failed to create destination. Please try again.');
        }
      } else if (isExistingDestino) {
        // Update existing destination with retry logic for rate limiting
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
  
      // Get the temporary ID from localStorage that was created during quotation
      const tempCotizacionId = localStorage.getItem('current_cotizacion_id');
      
      // If we have a temp quotation ID, update its status in the database
      if (tempCotizacionId && selectedOption === 'external') {
        try {
          // Update the quotation status for external option
          await apiService.updateQuotationStatus({
            temp_id: tempCotizacionId,
            status_update: 'external_selected',
            carrier: externalLabelData.carrier,
            tracking_number: externalLabelData.trackingNumber,
            service_id: selectedService.sku,
            price: externalCost
          });
          
          console.log("Updated quotation with external shipping details");
        } catch (updateError) {
          console.error("Error updating quotation status:", updateError);
          // Continue with shipment creation even if update fails
        }
      }
      
      // Create shipment data
      const shipmentData: any = {
        cliente_id: clienteId,
        destino_id: destinoId,
        servicio_id: selectedService.sku,
        peso_real: selectedService.pesoFacturable || 1,
        peso_volumetrico: selectedService.pesoFacturable || 1,
        valor_declarado: selectedService.valorSeguro || 0,
        costo_seguro: selectedService.costoSeguro || 0,
        costo_envio: selectedService.precioFinal,
        iva: selectedService.precioConIva - selectedService.precioFinal,
        total: selectedService.precioConIva,
        tipo_paquete: selectedService.tipoPaquete || 'paquete',
        opcion_empaque: selectedService.opcionEmpaque || undefined,
        requiere_recoleccion: selectedService.requiereRecoleccion || false,
        estatus: 'preparacion', // Set default status to 'preparacion'
        
        // Set method based on selected option
        metodo_creacion: selectedOption === 'external' ? 'externo' : 
                        selectedOption === 'manuable' ? 'manuable' : 'interno',
        
        // Add the temporary ID from quotation to link records
        temp_cotizacion_id: tempCotizacionId || undefined
      };
  
      // Add external label data if applicable
      if (selectedOption === 'external') {
        shipmentData.paqueteria_externa = externalLabelData.carrier;
        shipmentData.numero_guia_externa = externalLabelData.trackingNumber;
        shipmentData.costo_neto = externalCost;
      }
  
      // Add Manuable data if applicable
      if (selectedOption === 'manuable' && selectedManuableService) {
        shipmentData.uuid_manuable = selectedManuableService.uuid;
        shipmentData.servicio_manuable = `${selectedManuableService.carrier} - ${selectedManuableService.service}`;
        shipmentData.costo_neto = parseFloat(selectedManuableService.total_amount);
        shipmentData.paqueteria_externa = selectedManuableService.carrier;
        shipmentData.numero_guia_externa = externalLabelData.trackingNumber;
      }
  
      // Create shipment options for file upload
      const options: any = {};
      if (externalLabelData.labelFile) {
        options.labelFile = externalLabelData.labelFile;
      }
  
      // Create the shipment
      const { id: shipmentId } = await apiService.createShipment(shipmentData, options);
  
      // Clear the temporary quotation ID from localStorage
      localStorage.removeItem('current_cotizacion_id');
  
      // Call onSubmit with all the data
      onSubmit({
        cliente: { ...cliente, id: clienteId },
        destino: { ...destino, id: destinoId, cliente_id: clienteId },
        shipmentId
      });
  
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error al guardar los datos. Por favor intente nuevamente.');
    }
  };

  // ZIP code validation
  useEffect(() => {
    const validateZipCodes = () => {
      // Validate ZIP codes against the original quote
      if (cliente.codigo_postal !== originZip || destino.codigo_postal !== destZip) {
        setZipValidation({
          originValid: cliente.codigo_postal === originZip,
          destValid: destino.codigo_postal === destZip
        });
      } else {
        setZipValidation({
          originValid: true,
          destValid: true
        });
      }
    };

    validateZipCodes();
  }, [cliente.codigo_postal, destino.codigo_postal, originZip, destZip]);

  return (
    <div className="w-full">
      {step === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Cliente Form */}
          <div className="lg:block">
            <ClienteForm
              cliente={cliente}
              setCliente={setCliente}
              isExistingCustomer={isExistingCustomer}
              setIsExistingCustomer={setIsExistingCustomer}
              isValid={isClientFormValid()}
              originData={originData}
              zipValidation={zipValidation.originValid}
            />
          </div>
          
          {/* Right Column - Destino Form */}
          <div className="lg:block">
            <DestinoForm
              destino={destino}
              setDestino={setDestino}
              isExistingDestino={isExistingDestino}
              setIsExistingDestino={setIsExistingDestino}
              isValid={isDestinoFormValid()}
              clienteId={cliente.id}
              destData={destData}
              zipValidation={zipValidation.destValid}
            />
          </div>
        </div>
      ) : (
        <div>
          <EnvioConfirmation
            cliente={cliente}
            destino={destino}
            selectedService={selectedService}
            onBack={() => setStep('form')}
          />

          <div className="mt-6">
            <ShippingOptions
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              externalLabelData={externalLabelData}
              setExternalLabelData={setExternalLabelData}
              externalCost={externalCost}
              setExternalCost={setExternalCost}
              manuableServices={manuableServices}
              setManuableServices={setManuableServices}
              selectedManuableService={selectedManuableService}
              setSelectedManuableService={setSelectedManuableService}
              originZip={originZip}
              destZip={destZip}
              packageDetails={packageDetails}
              cliente={cliente}
              destino={destino}
            />
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="mt-6 flex justify-between border-t pt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Regresar
        </button>
        
        {step === 'form' ? (
          <button
            onClick={() => setStep('confirmation')}
            className={`px-4 py-2 rounded-md flex items-center ${
              isClientFormValid() && isDestinoFormValid()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!isClientFormValid() || !isDestinoFormValid()}
          >
            Revisar y Confirmar
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedOption !== 'none'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={selectedOption === 'none'}
          >
            {selectedOption === 'none' ? (
              <>
                Seleccione una opción de envío
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </>
            ) : (
              <>
                Confirmar Envío
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}