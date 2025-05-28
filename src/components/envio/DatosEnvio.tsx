import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '../../services/apiService';
import { Cliente, Destino, ServicioCotizado } from '../../types';
import EnvioDataDisplay from './EnvioDataDisplay';
import EnvioConfirmation from './EnvioConfirmation';
import ShippingOptionsModal from './ShippingOptionsModal';
import { Check, AlertTriangle, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
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
  const [showShippingModal, setShowShippingModal] = useState(false);

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

  // New state for tracking if we need a new quote
  const [needsNewQuote, setNeedsNewQuote] = useState(false);
  const [isGeneratingNewQuote, setIsGeneratingNewQuote] = useState(false);

  // Package details for Manuable API
  const [packageDetails] = useState({
    peso: selectedService.peso || 1,
    alto: selectedService.alto || 10,
    largo: selectedService.largo || 30,
    ancho: selectedService.ancho || 25,
    valor_declarado: selectedService.valorSeguro || 1,
    content: contenido || "GIFT",
    tipo_paquete: selectedService.tipoPaquete || 'paquete'
  });

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRemoveCliente = () => {
    setCliente(null);
    setDestino(null);
    setErrorMessage(null);
    setNeedsNewQuote(false);
  };

  const handleRemoveDestino = () => {
    setDestino(null);
    setErrorMessage(null);
    // Check if we still need a new quote based on client ZIP
    if (cliente && cliente.codigo_postal !== originZip) {
      setNeedsNewQuote(true);
    } else {
      setNeedsNewQuote(false);
    }
  };

  // Effects
  useEffect(() => {
    loadExistingData();
  }, [clienteId, destinoId]);

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
    if (cliente && destino) {
      const originValid = cliente.codigo_postal === originZip;
      const destValid = destino.codigo_postal === destZip;
      
      setZipValidation({
        originValid,
        destValid
      });

      // Set needsNewQuote if any ZIP doesn't match
      setNeedsNewQuote(!originValid || !destValid);
    } else if (cliente) {
      const originValid = cliente.codigo_postal === originZip;
      setZipValidation({
        originValid,
        destValid: true // No destination yet
      });
      setNeedsNewQuote(!originValid);
    }
  }

  // New function to handle generating a new quote
  const handleGenerateNewQuote = async () => {
    if (!cliente || !destino) {
      setErrorMessage('Por favor complete los datos del remitente y destinatario');
      return;
    }

    setIsGeneratingNewQuote(true);
    setErrorMessage(null);

    try {
      // Save the current quotation ID for reference
      const currentQuotationId = localStorage.getItem('current_cotizacion_id');
      
      // Create a new quotation URL with updated ZIP codes
      const quotationParams = new URLSearchParams({
        originZip: cliente.codigo_postal,
        destZip: destino.codigo_postal,
        // Preserve package details from current service
        packageType: selectedService.tipoPaquete || 'Paquete',
        weight: selectedService.peso?.toString() || '1',
        // Include dimensions if it's a package
        ...(selectedService.tipoPaquete === 'Paquete' && {
          length: selectedService.largo?.toString() || '30',
          width: selectedService.ancho?.toString() || '25',
          height: selectedService.alto?.toString() || '10',
        }),
        // Include other quotation details
        insurance: selectedService.valorSeguro > 0 ? 'true' : 'false',
        insuranceValue: selectedService.valorSeguro?.toString() || '0',
        // Preserve client and destination IDs
        clienteId: cliente.id || '',
        destinoId: destino.id || '',
        // Mark this as a re-quote
        requote: 'true',
        previousQuotationId: currentQuotationId || ''
      });

      // Navigate back to cotizador with the new parameters
      // This will trigger a new quotation with the updated ZIP codes
      window.location.href = `/cotizador?${quotationParams.toString()}`;
      
    } catch (error) {
      console.error('Error generating new quote:', error);
      setErrorMessage('Error al generar nueva cotización. Por favor intente nuevamente.');
      setIsGeneratingNewQuote(false);
    }
  };

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

    if (needsNewQuote) {
      setErrorMessage('Los códigos postales no coinciden con la cotización. Por favor genere una nueva cotización.');
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

  const handleShippingModalSubmit = async (shippingData: any) => {
    if (!isFormValid()) {
      setErrorMessage('Por favor complete todos los campos requeridos');
      return;
    }

    if (!isZipValidationPassing()) {
      setErrorMessage("Los códigos postales no coinciden con la cotización original. Por favor genere una nueva cotización.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Process the shipment
      const { clienteId, destinoId, shipmentId } = await processShipment(shippingData);

      // Close modal
      setShowShippingModal(false);

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

  async function processShipment(shippingData: any) {
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
      await updateDestinationWithRetry(destId, destinoPayload);
    }

    // Get the temporary ID from localStorage
    const tempCotizacionId = localStorage.getItem('current_cotizacion_id');

    // Update quotation status if needed
    if (tempCotizacionId) {
      await updateQuotationStatus(tempCotizacionId, shippingData);
    }

    // Extract data based on shipping option
    let externalLabelData = undefined;
    let externalCost = undefined;
    let selectedManuableService = undefined;
    let manuableLabelData = undefined;

    if (shippingData.selectedOption === 'external') {
      externalLabelData = shippingData.externalLabelData;
      externalCost = shippingData.externalCost;
    } else if (shippingData.selectedOption === 'manuable') {
      selectedManuableService = shippingData.selectedManuableService;
      if (shippingData.labelData) {
        manuableLabelData = {
          tracking_number: shippingData.labelData.tracking_number,
          label_url: shippingData.labelData.label_url,
          price: shippingData.labelData.price
        };
      }
    }

    // Create shipment data
    const shipmentData = createShipmentData(
      clientId,
      destId,
      selectedService,
      contenido,
      shippingData.selectedOption,
      externalLabelData,
      externalCost,
      selectedManuableService,
      tempCotizacionId || '',
      manuableLabelData
    );

    // Create the shipment with options
    const shipmentOptions: { labelFile?: File } = {};
    if (shippingData.selectedOption === 'external' && externalLabelData?.labelFile) {
      shipmentOptions.labelFile = externalLabelData.labelFile;
    }

    // Create the shipment
    const { id: shipmentId } = await apiService.createShipment(shipmentData, shipmentOptions);

    // Clear the temporary quotation ID
    localStorage.removeItem('current_cotizacion_id');

    return { clienteId: clientId, destinoId: destId, shipmentId };
  }

  async function updateQuotationStatus(tempCotizacionId: string, shippingData: any) {
    if (shippingData.selectedOption === 'external') {
      try {
        await apiService.updateQuotationStatus({
          temp_id: tempCotizacionId,
          status_update: 'external_selected',
          carrier: shippingData.externalLabelData.carrier,
          tracking_number: shippingData.externalLabelData.trackingNumber,
          service_id: selectedService.sku,
          price: shippingData.externalCost ?? undefined
        });
      } catch (updateError) {
        console.error("Error updating quotation status:", updateError);
      }
    } else if (shippingData.selectedOption === 'manuable' && shippingData.labelData) {
      try {
        await apiService.updateQuotationStatus({
          temp_id: tempCotizacionId,
          status_update: 'manuable_label_generated',
          service_id: shippingData.selectedManuableService.uuid,
          carrier: shippingData.selectedManuableService.carrier,
          service_name: shippingData.selectedManuableService.service,
          tracking_number: shippingData.labelData.tracking_number,
          label_url: shippingData.labelData.label_url,
          price: parseFloat(shippingData.labelData.price)
        });
      } catch (updateError) {
        console.error("Error updating quotation status:", updateError);
      }
    }
  }

  // Render component based on current step
  return (
    <div className="w-full">
      {/* Loading Overlay */}
      {(isLoading || isGeneratingNewQuote) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">
              {isGeneratingNewQuote ? 'Generando nueva cotización...' : 'Procesando envío...'}
            </span>
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

          {/* ZIP Validation Warning - Enhanced */}
          {needsNewQuote && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4"
            >
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    Códigos postales no coinciden con la cotización
                  </h3>
                  <div className="text-sm text-yellow-700 space-y-2">
                    {!zipValidation.originValid && (
                      <p>• Código postal de origen: {cliente?.codigo_postal} (cotización: {originZip})</p>
                    )}
                    {!zipValidation.destValid && (
                      <p>• Código postal de destino: {destino?.codigo_postal} (cotización: {destZip})</p>
                    )}
                  </div>
                  <p className="text-sm text-yellow-700 mt-3">
                    Los precios de envío pueden variar según los códigos postales. 
                    Es necesario generar una nueva cotización con los códigos postales actualizados.
                  </p>
                  <Button
                    onClick={handleGenerateNewQuote}
                    className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white"
                    disabled={!cliente || !destino}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generar Nueva Cotización
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Data Display */}
          <EnvioDataDisplay
            cliente={cliente}
            destino={destino}
            onUpdateCliente={handleUpdateCliente}
            onUpdateDestino={handleUpdateDestino}
            onRemoveCliente={handleRemoveCliente}
            onRemoveDestino={handleRemoveDestino}
            clienteId={clienteId}
            contenido={contenido}
            onUpdateContenido={handleUpdateContenido}
            zipValidation={zipValidation}
            originZip={originZip}
            destZip={destZip}
          />

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Regresar a cotización
            </Button>
            
            <Button
              onClick={handleContinueToConfirmation}
              disabled={!isFormValid() || needsNewQuote}
              className={`flex items-center ${
                (!isFormValid() || needsNewQuote) ? 'opacity-50' : ''
              }`}
            >
              {needsNewQuote ? (
                <>
                  Generar nueva cotización primero
                  <AlertTriangle className="h-4 w-4 ml-2" />
                </>
              ) : isFormValid() ? (
                <>
                  Continuar a confirmación
                  <Check className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Completar información
                  <AlertTriangle className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <EnvioConfirmation
              cliente={cliente!}
              destino={destino!}
              selectedService={selectedService}
              onBack={handleBackToForm}
              contenido={contenido}
            />
          </div>

          {/* Single Action Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => setShowShippingModal(true)}
              className="px-8 py-3 text-lg"
            >
              Finalizar y Confirmar Envío
              <CheckCircle2 className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Shipping Options Modal */}
      <ShippingOptionsModal
        isOpen={showShippingModal}
        onClose={() => setShowShippingModal(false)}
        onSubmit={handleShippingModalSubmit}
        originZip={originZip}
        destZip={destZip}
        packageDetails={{
          ...packageDetails,
          content: contenido
        }}
        cliente={cliente!}
        destino={destino!}
      />
    </div>
  );
}