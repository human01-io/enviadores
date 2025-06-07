import React, { useState } from 'react';
import { Cliente, Destino } from '../../types';
import { ManuableRate, ManuableLabelResponse } from '../../services/manuableService';
import { useManuable } from '../../hooks/useManuable';
import ValidationErrors from './ValidationErrors';
import { apiService } from '../../services';
import { isAxiosError } from 'axios';
import { Package, FileText, Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface ManuableLabelGeneratorProps {
  cliente: Cliente;
  destino: Destino;
  selectedService: ManuableRate;
  onLabelGenerated: (labelData: ManuableLabelResponse) => void;
  content?: string;
}

const ManuableLabelGenerator: React.FC<ManuableLabelGeneratorProps> = ({
  cliente,
  destino,
  selectedService,
  onLabelGenerated,
  content = "GIFT"
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
      
      // Call the API to generate label, passing the content
      const labelResponse = await createLabel(cliente, destinoWithExternalNumber, selectedService.uuid, content);
      
      console.log("Label generated successfully:", labelResponse);
  
      if (labelResponse) {
        // Process the URL to ensure it's absolute, but DO NOT automatically download
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
        
        // Only notify parent component of successful label generation
        onLabelGenerated(processedResponse);
      } else {
        throw new Error('No se pudo generar la etiqueta');
      }
    } catch (err) {
      console.error('Label generation error:', err);
      
      // Check if it's a validation error response
      if (isAxiosError(err)) {  // Check if it's an Axios error
        if (err.response?.data?.errors) {
          setValidationErrors(err.response.data.errors);
        } else {
          setError(err.message || 'Error al generar la etiqueta');
        }
      } else if (err instanceof Error) {  // Check if it's a standard Error
        setError(err.message);
      } else {
        setError('Error al generar la etiqueta');
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
      createLabel(cliente, updatedDestino, selectedService.uuid, content) // Pass content here too
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
          if (isAxiosError(err) && err.response?.data?.errors) {
            setValidationErrors(err.response.data.errors);
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Error al generar la etiqueta');
          }
        })
        .finally(() => {
          setIsGenerating(false);
        });
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 bg-blue-50 rounded-lg border border-blue-200">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Generando etiqueta...</h3>
        <p className="text-sm text-blue-700 text-center max-w-md">
          Estamos procesando su solicitud con Manuable. 
          Este proceso puede tardar unos segundos.
        </p>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-1 flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Arreglar automáticamente
          </button>
          
          <button
            onClick={() => setValidationErrors(null)}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 flex-1 flex items-center justify-center"
          >
            <FileText className="h-4 w-4 mr-2" />
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
          <AlertTriangle className="h-6 w-6 text-red-600 mr-2 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 font-medium">Error al generar etiqueta</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={handleGenerateLabel}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-full -mt-8 -mr-8 z-0 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-green-100 rounded-full -mb-4 -ml-4 z-0 opacity-50"></div>
      
      <div className="relative z-10">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
            <Package className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">Generar Etiqueta de Envío</h3>
            <p className="text-sm text-green-700">
              Servicio seleccionado: <span className="font-medium">{selectedService.carrier} - {selectedService.service}</span>
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-green-100">
            <p className="text-xs text-gray-500 mb-1">Contenido a declarar:</p>
            <p className="font-medium text-gray-800">{content || "GIFT"}</p>
          </div>
          
          <div className="bg-white rounded-lg p-3 shadow-sm border border-green-100">
            <p className="text-xs text-gray-500 mb-1">Precio:</p>
            <p className="font-medium text-gray-800">${selectedService.total_amount} {selectedService.currency}</p>
          </div>
          
          <div className="bg-white rounded-lg p-3 shadow-sm border border-green-100">
            <p className="text-xs text-gray-500 mb-1">Carrier:</p>
            <p className="font-medium text-gray-800">{selectedService.carrier}</p>
          </div>
        </div>
        
        <button
          onClick={handleGenerateLabel}
          className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm transition-colors"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Generar Etiqueta con Manuable
        </button>
        
        <p className="mt-3 text-xs text-green-600 text-center">
          Al generar la etiqueta, se creará un envío con los datos proporcionados a través de Manuable.
        </p>
      </div>
    </div>
  );
};

export default ManuableLabelGenerator;