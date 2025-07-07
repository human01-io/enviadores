import React, { useState } from 'react';
import { Cliente, Destino } from '../../types';
import { ManuableRate, ManuableLabelResponse } from '../../services/manuableService';
import { useManuable } from '../../hooks/useManuable';
import ValidationErrors from './ValidationErrors';
import { apiService } from '../../services';
import { isAxiosError } from 'axios';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

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
  const [step, setStep] = useState<'ready' | 'confirm' | 'generating' | 'error'>('ready');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<any>(null);
  
  const { createLabel } = useManuable();

  const handleGenerateLabel = async () => {
    setStep('generating');
    setError(null);
    setValidationErrors(null);
    
    try {
      const destinoWithExternalNumber = {
        ...destino,
        numero_exterior: destino.numero_exterior || extractExternalNumber(destino.direccion)
      };
      
      const labelResponse = await createLabel(cliente, destinoWithExternalNumber, selectedService.uuid, content);
      
      console.log("Label generated successfully:", labelResponse);
  
      if (labelResponse) {
        console.log("Using label response as-is:", labelResponse);
        
        const tempCotizacionId = localStorage.getItem('current_cotizacion_id');
        
        if (tempCotizacionId) {
          try {
            const updateResult = await apiService.updateQuotationStatus({
              temp_id: tempCotizacionId,
              status_update: 'manuable_label_generated',
              service_id: selectedService.uuid,
              carrier: selectedService.carrier,
              service_name: selectedService.service,
              tracking_number: labelResponse.tracking_number,
              label_url: labelResponse.label_url,
              price: labelResponse.price
            });
            
            if (updateResult.success) {
              console.log("Updated quotation with Manuable label info");
            }
          } catch (updateError) {
            console.error("Error updating quotation:", updateError);
          }
        }
        
        onLabelGenerated(labelResponse);
      } else {
        throw new Error('No se pudo generar la etiqueta');
      }
    } catch (err) {
      console.error('Label generation error:', err);
      setStep('error');
      
      if (isAxiosError(err)) {
        if (err.response?.data?.errors) {
          setValidationErrors(err.response.data.errors);
        } else {
          setError(err.message || 'Error al generar la etiqueta');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al generar la etiqueta');
      }
    }
  };

  const extractExternalNumber = (address: string): string => {
    const matches = address.match(/\b[Nn][o]?\.\s*(\d+(?:-\w+)?)\b|\b#(\d+)\b|\b(\d+(?:-\w+)?)\b/);
    if (matches) {
      return matches[1] || matches[2] || matches[3] || '';
    }
    return '';
  };

  const handleFixValidationIssues = () => {
    const updatedDestino = { ...destino };
    
    if (validationErrors) {
      if (validationErrors.address_to?.email) {
        updatedDestino.email = cliente.email || 'cliente@enviadores.com.mx';
      }
      
      if (validationErrors.address_to?.external_number) {
        updatedDestino.numero_exterior = extractExternalNumber(destino.direccion) || 'S/N';
      }
      
      setValidationErrors(null);
      setStep('generating');
      
      createLabel(cliente, updatedDestino, selectedService.uuid, content)
        .then(labelResponse => {
          if (labelResponse) {
            onLabelGenerated(labelResponse);
          }
        })
        .catch(err => {
          console.error('Error after fixing validation:', err);
          setStep('error');
          if (isAxiosError(err) && err.response?.data?.errors) {
            setValidationErrors(err.response.data.errors);
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Error al generar la etiqueta');
          }
        });
    }
  };

  const resetToReady = () => {
    setStep('ready');
    setError(null);
    setValidationErrors(null);
  };

  // Loading State
  if (step === 'generating') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin mr-2" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">Generando etiqueta...</h3>
            <p className="text-xs text-blue-700">Procesando con Manuable</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State with Validation
  if (step === 'error') {
    return (
      <div className="space-y-3">
        {validationErrors && (
          <ValidationErrors 
            errors={validationErrors} 
            onClose={() => setValidationErrors(null)}
          />
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800">Error al generar etiqueta</h3>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          {validationErrors ? (
            <>
              <button
                onClick={handleFixValidationIssues}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center justify-center"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Arreglar automáticamente
              </button>
              <button
                onClick={resetToReady}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('generating')}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-xs hover:bg-red-700 flex items-center justify-center"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reintentar
              </button>
              <button
                onClick={resetToReady}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Generar Etiqueta</p>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-gray-600">
                Contenido: <span className="font-medium">{content}</span>
              </span>
              <span className="text-xs text-gray-600">
                Costo: <span className="font-medium">${selectedService.total_amount} {selectedService.currency}</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {step === 'ready' && (
            <button
              onClick={() => setStep('confirm')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
            >
              Generar Etiqueta
            </button>
          )}
          
          {step === 'confirm' && (
            <>
              <button
                onClick={() => setStep('ready')}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateLabel}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
              >
                Confirmar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManuableLabelGenerator;