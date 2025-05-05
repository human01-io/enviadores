import React, { useState } from 'react';
import { Cliente, Destino } from '../../types';
import { ManuableRate, ManuableLabelResponse } from '../../services/manuableService';
import { useManuable } from '../../hooks/useManuable';
import { mapClienteToManuableAddress, mapDestinoToManuableAddress } from '../../utils/manuableUtils';
import ValidationErrors from './ValidationErrors'; // Import the new component

interface ManuableLabelGeneratorProps {
  cliente: Cliente;
  destino: Destino;
  selectedService: ManuableRate;
  onLabelGenerated: (labelData: ManuableLabelResponse) => void;
}

const ManuableLabelGenerator: React.FC<ManuableLabelGeneratorProps> = ({
  cliente,
  destino,
  selectedService,
  onLabelGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<any>(null);
  
  const { createLabel } = useManuable();

  const handleGenerateLabel = async () => {
    setIsGenerating(true);
    setError(null);
    setValidationErrors(null);
    
    try {
      // Ensure external_number is included in the address
      const destinoWithExternalNumber = {
        ...destino,
        // Use numero_exterior from destino if it exists, otherwise extract it from the address
        numero_exterior: destino.numero_exterior || extractExternalNumber(destino.direccion)
      };
      
      // Call the API to generate label
      const labelResponse = await createLabel(cliente, destinoWithExternalNumber, selectedService.uuid);
      
      console.log("Label generated successfully:", labelResponse);
  
      if (labelResponse) {
        // Ensure we have absolute URLs for the label
        const processedResponse = {
          ...labelResponse,
          label_url: ensureAbsoluteUrl(labelResponse.label_url)
        };
        
        console.log("Processed label response:", processedResponse);
        
        // Get the temporary ID from localStorage that was created during quotation
        const tempCotizacionId = localStorage.getItem('current_cotizacion_id');
        
        // Update the quotation status in the database
        if (tempCotizacionId) {
          try {
            // Update the quotation status using apiService
            const updateResult = await apiService.updateQuotationStatus({
              temp_id: tempCotizacionId,
              status_update: 'manuable_label_generated',
              service_id: selectedService.uuid,
              carrier: selectedService.carrier,
              service_name: selectedService.service,
              tracking_number: processedResponse.tracking_number,
              label_url: processedResponse.label_url,
              price: processedResponse.price
            });
            
            if (updateResult.success) {
              console.log("Updated quotation with Manuable label info");
            } else {
              console.error("Error updating quotation status");
            }
          } catch (updateError) {
            console.error("Error updating quotation:", updateError);
            // Don't block the process if update fails
          }
        }
        
        onLabelGenerated(processedResponse);
      } else {
        throw new Error('No se pudo generar la etiqueta');
      }
    } catch (err) {
      console.error('Label generation error:', err);
      
      // Check if it's a validation error response
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      } else {
        setError(err instanceof Error ? err.message : 'Error al generar la etiqueta');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to extract external number from address
  const extractExternalNumber = (address: string): string => {
    // Try to match common patterns for street numbers
    const matches = address.match(/\b[Nn][o]?\.\s*(\d+(?:-\w+)?)\b|\b#(\d+)\b|\b(\d+(?:-\w+)?)\b/);
    if (matches) {
      // Return the first capture group that matched
      return matches[1] || matches[2] || matches[3] || '';
    }
    return ''; // Return empty string if no match found
  };

  // Helper function to ensure URL is absolute
  const ensureAbsoluteUrl = (url: string): string => {
    if (!url) return '';
    
    // Check if URL already starts with http:// or https://
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it's a relative URL starting with a slash, prepend the API base
    if (url.startsWith('/')) {
      return `http://ec2-54-188-18-143.us-west-2.compute.amazonaws.com:4000${url}`;
    }
    
    // Otherwise assume it's a relative URL and prepend the API base with a slash
    return `http://ec2-54-188-18-143.us-west-2.compute.amazonaws.com:4000/${url}`;
  };

  // Function to fix validation issues automatically
  const handleFixValidationIssues = () => {
    // Create a copy of destino to modify
    const updatedDestino = { ...destino };
    
    if (validationErrors) {
      // Fix email validation
      if (validationErrors.address_to?.email) {
        // If email is invalid, use a default or client email
        updatedDestino.email = cliente.email || 'cliente@enviadores.com.mx';
      }
      
      // Fix external_number validation
      if (validationErrors.address_to?.external_number) {
        // If missing, add a default external number or extract from address
        updatedDestino.numero_exterior = extractExternalNumber(destino.direccion) || 'S/N';
      }
      
      // Update the destino data
      // This would normally update state, but we'll retry directly
      setValidationErrors(null);
      
      // Try generating the label again with the fixed data
      setIsGenerating(true);
      createLabel(cliente, updatedDestino, selectedService.uuid)
        .then(labelResponse => {
          if (labelResponse) {
            // Process the URL to make sure it's absolute
            const processedResponse = {
              ...labelResponse,
              label_url: ensureAbsoluteUrl(labelResponse.label_url)
            };
            onLabelGenerated(processedResponse);
          }
        })
        .catch(err => {
          console.error('Error after fixing validation:', err);
          if (err.response?.data?.errors) {
            setValidationErrors(err.response.data.errors);
          } else {
            setError(err instanceof Error ? err.message : 'Error al generar la etiqueta');
          }
        })
        .finally(() => {
          setIsGenerating(false);
        });
    }
  };

  if (isGenerating) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-gray-600">Generando etiqueta de envío...</p>
      </div>
    );
  }

  // Show validation errors if present
  if (validationErrors) {
    return (
      <div className="mb-4">
        <ValidationErrors 
          errors={validationErrors} 
          onClose={() => setValidationErrors(null)}
          className="mb-4"
        />
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={handleFixValidationIssues}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-1"
          >
            Arreglar automáticamente
          </button>
          
          <button
            onClick={() => setValidationErrors(null)}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 flex-1"
          >
            Editar manualmente
          </button>
        </div>
        
        <p className="mt-3 text-sm text-gray-600">
          El API de Manuable requiere información adicional. Puedes arreglar estos problemas automáticamente
          o editar los datos del destinatario manualmente.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-red-800 font-medium">Error al generar etiqueta</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={handleGenerateLabel}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <p className="mb-3 text-sm text-gray-700">
        Servicio seleccionado: <strong>{selectedService.carrier} - {selectedService.service}</strong>
      </p>
      
      <button
        onClick={handleGenerateLabel}
        className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Generar Etiqueta con Manuable
      </button>
      
      <p className="mt-2 text-xs text-gray-500">
        Al generar la etiqueta, se creará un envío con los datos proporcionados a través de Manuable.
      </p>
    </div>
  );
};

export default ManuableLabelGenerator;