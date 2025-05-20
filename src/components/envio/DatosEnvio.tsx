import { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { Cliente, Destino, ServicioCotizado } from '../../types';
import { ManuableRate } from '../../services/manuableService';
import { FormView, ConfirmationView } from './views/EnvioViews';
import {
  getInitialClienteState,
  getInitialDestinoState,
  validateClienteForm,
  validateDestinoForm,
  updateDestinationWithRetry,
  createShipmentData
} from './utils/envioUtils';
import { ManuableLabelResponse } from '../../services/manuableService';

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
  // Main UI state
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [selectedOption, setSelectedOption] = useState<'none' | 'external' | 'manuable'>('none');

  // Content state
  const [contenido, setContenido] = useState<string>('');

  // Client and destination state
  const [cliente, setCliente] = useState<Cliente>(getInitialClienteState(originZip));
  const [destino, setDestino] = useState<Destino>(getInitialDestinoState(destZip));
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [isExistingDestino, setIsExistingDestino] = useState(false);

  // Validation state
  const [zipValidation, setZipValidation] = useState({
    originValid: true,
    destValid: true
  });

  // External shipping option state
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

  // Manuable shipping option state
  const [manuableServices, setManuableServices] = useState<ManuableRate[]>([]);
  const [selectedManuableService, setSelectedManuableService] = useState<ManuableRate | null>(null);

  // Package details for Manuable API - with safe type handling
  const [packageDetails, setPackageDetails] = useState({
    peso: selectedService.peso || 1,
    alto: selectedService.alto || 10,
    largo: selectedService.largo || 30,
    ancho: selectedService.ancho || 25,
    valor_declarado: selectedService.valorSeguro || 1,
    content: contenido || "GIFT",
    tipo_paquete: selectedService.tipoPaquete || 'paquete'
  });

   const [labelData, setLabelData] = useState<ManuableLabelResponse | null>(null);

  // Effects
  // Update package details when content changes
  useEffect(() => {
    setPackageDetails(prev => ({
      ...prev,
      content: contenido || "GIFT"
    }));
  }, [contenido]);

  // Load existing client and destination data if IDs are provided
  useEffect(() => {
    loadExistingData();
  }, [clienteId, destinoId]);

  // Validate ZIP codes when they change
  useEffect(() => {
    validateZipCodes();
  }, [cliente.codigo_postal, destino.codigo_postal, originZip, destZip]);

  // Validation functions
  const isClientFormValid = (): boolean => validateClienteForm(cliente);
  const isDestinoFormValid = (): boolean => validateDestinoForm(destino);
  const isContentValid = (): boolean => contenido.trim() !== '';
  const isFormValid = (): boolean => isClientFormValid() && isDestinoFormValid() && isContentValid();

  // Helper functions
  async function loadExistingData() {
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
  }

  function validateZipCodes() {
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
  }

  // Event handlers
  const handleContinueToConfirmation = () => {
    if (!isFormValid()) {
      if (!isClientFormValid()) {
        alert('Por favor complete todos los campos requeridos del remitente.');
      } else if (!isDestinoFormValid()) {
        alert('Por favor complete todos los campos requeridos del destinatario.');
      } else if (!isContentValid()) {
        alert('Por favor describa el contenido del envío.');
      }
      return;
    }

    setStep('confirmation');
  };

  const handleBackToForm = () => {
    setStep('form');
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!isFormValid()) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    if (selectedOption === 'none') {
      alert('Por favor seleccione una opción de envío');
      return;
    }

    // Shipping option specific validation
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

    // ZIP code validation
    if (!zipValidation.originValid || !zipValidation.destValid) {
      alert("Los códigos postales no coinciden con la cotización original. Por favor genere una nueva cotización.");
      return;
    }

    try {
      // Process the shipment
      const { clienteId, destinoId, shipmentId } = await processShipment();

      // Call onSubmit with all data
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

  async function processShipment() {
    // Save or update client
    let clientId = cliente.id;
    if (!clientId) {
      const { id } = await apiService.createCustomer(cliente);
      clientId = id;
    } else if (isExistingCustomer) {
      await apiService.updateCustomer(clientId, cliente);
    }

    // Save or update destination
    let destId = destino.id;
    const destinoPayload = {
      ...destino,
      cliente_id: clientId
    };

    if (!destId) {
      try {
        const newDestino = await apiService.createDestination(destinoPayload);
        destId = newDestino.id;
      } catch (error) {
        console.error('Error creating destination:', error);
        throw new Error('Failed to create destination. Please try again.');
      }
    } else if (isExistingDestino) {
      // Use utility function for retrying on rate limiting
      await updateDestinationWithRetry(destId, destinoPayload);
    }

    // Get the temporary ID from localStorage that was created during quotation
    const tempCotizacionId = localStorage.getItem('current_cotizacion_id');

    // Update quotation status if needed
    if (tempCotizacionId) {
      await updateQuotationStatus(tempCotizacionId);
    }

    // Extract Manuable label data if available
    const manuableLabelData = labelData ? {
      tracking_number: labelData.tracking_number,
      label_url: labelData.label_url,
      price: labelData.price
    } : undefined;

    // Create shipment data using utility function
    const shipmentData = createShipmentData(
      clientId,
      destId,
      selectedService,
      contenido,
      selectedOption,
      externalLabelData,
      externalCost,
      selectedManuableService,
      tempCotizacionId || '', // Provide empty string as fallback
      manuableLabelData
    );

    // Create the shipment with options
    const shipmentOptions: { labelFile?: File } = {};
    if (selectedOption === 'external' && externalLabelData.labelFile) {
      shipmentOptions.labelFile = externalLabelData.labelFile;
    }

    // Create the shipment
    const { id: shipmentId } = await apiService.createShipment(shipmentData, shipmentOptions);

    // Clear the temporary quotation ID from localStorage
    localStorage.removeItem('current_cotizacion_id');

    return { clienteId: clientId, destinoId: destId, shipmentId };
  }

const handleLabelGenerated = (data: ManuableLabelResponse) => {
  console.log('Label generated with data:', data);
  setLabelData(data);
};

  async function updateQuotationStatus(tempCotizacionId: string) {
    if (selectedOption === 'external') {
      try {
        await apiService.updateQuotationStatus({
          temp_id: tempCotizacionId,
          status_update: 'external_selected',
          carrier: externalLabelData.carrier,
          tracking_number: externalLabelData.trackingNumber,
          service_id: selectedService.sku,
          price: externalCost ?? undefined
        });
        console.log("Updated quotation with external shipping details");
      } catch (updateError) {
        console.error("Error updating quotation status:", updateError);
        // Continue even if update fails
      }
    }
  }

  // Render component based on current step
  return (
    <div className="w-full">
      {step === 'form' ? (
        <FormView
          cliente={cliente}
          setCliente={setCliente}
          isExistingCustomer={isExistingCustomer}
          setIsExistingCustomer={setIsExistingCustomer}
          isClientFormValid={isClientFormValid()}
          destino={destino}
          setDestino={setDestino}
          isExistingDestino={isExistingDestino}
          setIsExistingDestino={setIsExistingDestino}
          isDestinoFormValid={isDestinoFormValid()}
          contenido={contenido}
          setContenido={setContenido}
          originData={originData}
          destData={destData}
          zipValidation={zipValidation}
          isFormValid={isFormValid()}
          onContinue={handleContinueToConfirmation}
          onBack={onBack}
        />
      ) : (
        <ConfirmationView
          cliente={cliente}
          destino={destino}
          selectedService={selectedService}
          contenido={contenido}
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
          packageDetails={packageDetails}
          originZip={originZip}
          destZip={destZip}
          onBack={handleBackToForm}
          onSubmit={handleSubmit}
          labelData={labelData}
          setLabelData={setLabelData}
        />
      )}
    </div>
  );
}