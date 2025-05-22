import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '../../services/apiService';
import { Cliente, Destino, ServicioCotizado } from '../../types';
import { ManuableRate, ManuableLabelResponse } from '../../services/manuableService';
import EnvioDataDisplay from './EnvioDataDisplay';
import EnvioConfirmation from './EnvioConfirmation';
import ShippingOptions from './ShippingOptions';
import { Check, ArrowLeft, AlertTriangle, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import {
  updateDestinationWithRetry,
  createShipmentData
} from './utils/envioUtils';

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
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [destino, setDestino] = useState<Destino | null>(null);

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

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

const handleRemoveCliente = () => {
  setCliente(null);
  setDestino(null); // Remove destino as well since it depends on cliente
  setErrorMessage(null);
};

const handleRemoveDestino = () => {
  setDestino(null);
  setErrorMessage(null);
};

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
    if (cliente?.codigo_postal || destino?.codigo_postal) {
      validateZipCodes();
    }
  }, [cliente?.codigo_postal, destino?.codigo_postal, originZip, destZip]);

  // Helper functions
  async function loadExistingData() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (clienteId) {
        const results = await apiService.searchCustomers(clienteId);
        if (results && results.length > 0) {
          const clienteData = results[0];
          setCliente(clienteData);
        }
      }

      if (clienteId && destinoId) {
        const results = await apiService.getCustomerDestinations(clienteId);
        if (results && results.length > 0) {
          const destinoData = results.find(d => d.id === destinoId);
          if (destinoData) {
            setDestino(destinoData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setErrorMessage('Error al cargar los datos del cliente/destino');
    } finally {
      setIsLoading(false);
    }
  }

  function validateZipCodes() {
    // Validate ZIP codes against the original quote
    if (cliente && destino) {
      setZipValidation({
        originValid: cliente.codigo_postal === originZip,
        destValid: destino.codigo_postal === destZip
      });
    }
  }

  // Event handlers
  const handleUpdateCliente = (updatedCliente: Cliente) => {
    setCliente(updatedCliente);
    validateZipCodes();
  };

  const handleUpdateDestino = (updatedDestino: Destino) => {
    setDestino(updatedDestino);
    validateZipCodes();
  };

  const handleUpdateContenido = (newContenido: string) => {
    setContenido(newContenido);
  };

  const handleContinueToConfirmation = () => {
    if (!isFormValid()) {
      if (!cliente) {
        setErrorMessage('Por favor complete los datos del remitente');
      } else if (!destino) {
        setErrorMessage('Por favor complete los datos del destinatario');
      } else if (!contenido.trim()) {
        setErrorMessage('Por favor describa el contenido del envío');
      }
      return;
    }

    setStep('confirmation');
  };

  const handleBackToForm = () => {
    setStep('form');
  };

  const isFormValid = (): boolean => {
    return !!cliente && !!destino && contenido.trim() !== '';
  };

  const isZipValidationPassing = (): boolean => {
    return zipValidation.originValid && zipValidation.destValid;
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!isFormValid()) {
      setErrorMessage('Por favor complete todos los campos requeridos');
      return;
    }

    if (selectedOption === 'none') {
      setErrorMessage('Por favor seleccione una opción de envío');
      return;
    }

    // Shipping option specific validation
    if (selectedOption === 'external') {
      if (!externalLabelData.carrier) {
        setErrorMessage('Por favor seleccione una paquetería');
        return;
      }
      if (!externalLabelData.trackingNumber) {
        setErrorMessage('Por favor ingrese el número de guía');
        return;
      }
      if (!externalLabelData.labelFile) {
        setErrorMessage('Por favor seleccione un archivo de etiqueta');
        return;
      }
      if (externalCost === null) {
        setErrorMessage('Por favor ingrese el costo neto');
        return;
      }
    }

    if (selectedOption === 'manuable' && !selectedManuableService) {
      setErrorMessage('Por favor seleccione un servicio de Manuable');
      return;
    }

    // ZIP code validation
    if (!isZipValidationPassing()) {
      setErrorMessage("Los códigos postales no coinciden con la cotización original. Por favor genere una nueva cotización.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Process the shipment
      const { clienteId, destinoId, shipmentId } = await processShipment();

      // Call onSubmit with all data
      onSubmit({
        cliente: cliente!,
        destino: destino!,
        shipmentId
      });

    } catch (error) {
      console.error('Error saving data:', error);
      setErrorMessage('Error al guardar los datos. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  async function processShipment() {
    if (!cliente || !destino) {
      throw new Error('Missing cliente or destino data');
    }

    // Save or update client
    let clientId = cliente.id;
    if (!clientId) {
      const { id } = await apiService.createCustomer(cliente);
      clientId = id;
    } else {
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
    } else {
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
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Procesando...</span>
          </div>
        </div>
      )}

      {step === 'form' ? (
        <div className="space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Main Data Display */}
          <EnvioDataDisplay
            cliente={cliente}
            destino={destino}
            onUpdateCliente={handleUpdateCliente}
            onUpdateDestino={handleUpdateDestino}
              onRemoveCliente={handleRemoveCliente}  // Add this
  onRemoveDestino={handleRemoveDestino}
            clienteId={clienteId}
            contenido={contenido}
            onUpdateContenido={handleUpdateContenido}
            zipValidation={zipValidation}
          />

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-4 border-t mt-6">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Regresar
            </Button>

            <Button
              onClick={handleContinueToConfirmation}
              disabled={!isFormValid()}
              className={`flex items-center ${!isFormValid() ? 'opacity-50' : ''}`}
            >
              {isFormValid() ? (
                <>
                  Continuar a Confirmación
                  <Check className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Completar Información
                  <AlertTriangle className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* ZIP Validation Warning */}
          {isFormValid() && !isZipValidationPassing() && (
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Los códigos postales seleccionados no coinciden con la cotización original.
                Esto puede causar discrepancias en el precio y servicio.
              </AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Confirmation View */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="bg-blue-50 p-4 border-b">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-800">Confirmar Envío</h3>
              </div>
            </div>
            <div className="p-4">
              <EnvioConfirmation
                cliente={cliente!}
                destino={destino!}
                selectedService={selectedService}
                onBack={handleBackToForm}
                contenido={contenido}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="bg-blue-50 p-4 border-b">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H14a1 1 0 001-1v-3h2a1 1 0 001-1V8a1 1 0 00-.416-.789l-2-1.666A1 1 0 0014 5.333V4a1 1 0 00-1-1H3zM16 8.8V8l-2-1.667V5H14v3.8l2 .8z" />
                </svg>
                <h3 className="text-lg font-semibold text-blue-800">Opciones de Envío</h3>
              </div>
            </div>
            <div className="p-4">
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
                packageDetails={{
                  ...packageDetails,
                  content: contenido
                }}
                cliente={cliente!}
                destino={destino!}
                labelData={labelData}
                setLabelData={setLabelData}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-4 border-t mt-6">
            <Button
              variant="outline"
              onClick={handleBackToForm}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Modificar Datos
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={selectedOption === 'none' || isLoading}
              className="flex items-center"
            >
              Finalizar y Crear Envío
              <Check className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}