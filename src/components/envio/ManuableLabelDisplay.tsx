import React from 'react';
import { ManuableLabelResponse } from '../../services/manuableService';

interface ManuableLabelDisplayProps {
  labelData: ManuableLabelResponse;
}

const ManuableLabelDisplay: React.FC<ManuableLabelDisplayProps> = ({ labelData }) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="text-green-800 font-medium">¡Etiqueta generada con éxito!</h3>
          
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium text-green-800">Número de rastreo:</div>
              <div className="text-green-700">{labelData.tracking_number}</div>
              
              <div className="font-medium text-green-800">Fecha de creación:</div>
              <div className="text-green-700">{new Date(labelData.created_at).toLocaleString()}</div>
              
              <div className="font-medium text-green-800">Costo:</div>
              <div className="text-green-700">${labelData.price} MXN</div>
            </div>
          </div>
          
          <div className="mt-4">
            <a 
              href={labelData.label_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Descargar Etiqueta
            </a>
          </div>
          
          <p className="mt-3 text-xs text-green-600">
            Guarde esta etiqueta. La URL de descarga puede expirar después de cierto tiempo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManuableLabelDisplay;