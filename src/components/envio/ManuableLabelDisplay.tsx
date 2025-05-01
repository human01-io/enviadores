import React from 'react';
import { ManuableLabelResponse } from '../../services/manuableService';

interface ManuableLabelDisplayProps {
  labelData: ManuableLabelResponse;
}

const ManuableLabelDisplay: React.FC<ManuableLabelDisplayProps> = ({ labelData }) => {
  // For debugging
  console.log('Displaying label data:', labelData);
  
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <h3 className="text-green-800 font-medium">¡Etiqueta generada con éxito!</h3>
          
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium text-green-800">Número de rastreo:</div>
              <div className="text-green-700">{labelData.tracking_number || "Sin número de rastreo"}</div>
              
              <div className="font-medium text-green-800">Fecha de creación:</div>
              <div className="text-green-700">
                {labelData.created_at
                  ? new Date(labelData.created_at).toLocaleString()
                  : "No disponible"}
              </div>
              
              <div className="font-medium text-green-800">Costo:</div>
              <div className="text-green-700">
                {labelData.price
                  ? `$${labelData.price} MXN`
                  : "No disponible"}
              </div>
              
              <div className="font-medium text-green-800">URL de etiqueta:</div>
              <div className="text-green-700 truncate">
                {labelData.label_url || "No disponible"}
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            {labelData.label_url ? (
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
            ) : (
              <button className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-md cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                No hay etiqueta disponible
              </button>
            )}
            
            <button
              onClick={() => navigator.clipboard.writeText(labelData.tracking_number || '')}
              className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
              disabled={!labelData.tracking_number}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copiar número
            </button>
          </div>
          
          {labelData.label_url && (
            <p className="mt-3 text-xs text-green-600">
              Guarde esta etiqueta. La URL de descarga puede expirar después de cierto tiempo.
            </p>
          )}

          {/* Debug section - Only show in development environment 
          {import.meta.env.DEV && (
            <div className="mt-4 p-2 border border-gray-200 rounded-md bg-white text-xs text-gray-700 font-mono">
              <h4 className="font-bold mb-1">Datos de la etiqueta (debug):</h4>
              <pre>
                {JSON.stringify(labelData, null, 2)}
              </pre>
            </div>
          )}*/}
        </div>
      </div>
    </div>
  );
};

export default ManuableLabelDisplay;