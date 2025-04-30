import React, { useState } from 'react';
import { Cliente, Destino } from '../../types';
import { ManuableRate, ManuableLabelResponse } from '../../services/manuableService';
import { useManuable } from '../../hooks/useManuable';
import { mapClienteToManuableAddress, mapDestinoToManuableAddress } from '../../utils/manuableUtils';

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
  
  const { createLabel } = useManuable();

  const handleGenerateLabel = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Call the API to generate label
      const labelResponse = await createLabel(cliente, destino, selectedService.uuid);
      
      if (labelResponse) {
        onLabelGenerated(labelResponse);
      } else {
        throw new Error('No se pudo generar la etiqueta');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar la etiqueta');
    } finally {
      setIsGenerating(false);
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