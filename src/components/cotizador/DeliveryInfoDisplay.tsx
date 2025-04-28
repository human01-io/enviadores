import React from 'react';
import { EstafetaResult } from './utils/cotizadorTypes';

interface DeliveryInfoDisplayProps {
  estafetaResult: EstafetaResult | null;
  loadingEstafeta: boolean;
  validateThreeTimes: () => void;
  handleReport: () => void;
  reportSubmitted: boolean;
}

export const DeliveryInfoDisplay: React.FC<DeliveryInfoDisplayProps> = ({
  estafetaResult,
  loadingEstafeta,
  validateThreeTimes,
  handleReport,
  reportSubmitted
}) => {
  const renderEstafetaDeliveryDays = (deliveryDays: { [key: string]: boolean } | undefined) => {
    if (!deliveryDays) return null;

    const days = [
      { name: 'Lunes', key: 'lunes' },
      { name: 'Martes', key: 'martes' },
      { name: 'Miercoles', key: 'miercoles' },
      { name: 'Jueves', key: 'jueves' },
      { name: 'Viernes', key: 'viernes' },
      { name: 'Sábado', key: 's&#225;bado' },
      { name: 'Domingo', key: 'domingo' }
    ];

    return (
      <div className="mt-3">
        <h4 className="text-sm font-medium mb-2">Días de entrega disponibles:</h4>
        <div className="flex flex-wrap gap-1.5">
          {days.map(day => (
            <div
              key={day.key}
              className={`px-2.5 py-1 rounded-full text-xs
                ${deliveryDays[day.key]
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-500'
                }`}
            >
              <div className="flex items-center">
                {deliveryDays[day.key] ? (
                  <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {day.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loadingEstafeta) {
    return (
      <div className="flex items-center justify-center p-4 bg-blue-50 rounded border border-blue-100">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-blue-500">Consultando información de entrega...</span>
      </div>
    );
  }

  if (!estafetaResult) {
    return (
      <div className="p-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded">
        Al validar los códigos postales se mostrará la información de entrega.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-white rounded border border-blue-100 relative">
        <h3 className="text-sm font-medium text-blue-700 mb-2">Información de Entrega</h3>

        {/* Cost Information */}
        <div className="mb-3">
          <p className="text-sm"><span className="font-medium">Costo de Reexpedición:</span></p>
          <p className={`text-sm font-medium ${estafetaResult.reexpe === 'No' ? 'text-green-600' : 'text-blue-600'}`}>
            {estafetaResult.reexpe === 'No' ? 'Sin costo adicional' : estafetaResult.reexpe}
          </p>
        </div>

        {/* Ocurre Forzoso Information */}
        <div className="mb-3">
          <p className="text-sm"><span className="font-medium">Ocurre Forzoso:</span></p>
          <p className={`text-sm font-medium ${estafetaResult.ocurreForzoso === 'No' ? 'text-green-600' : 'text-yellow-600'}`}>
            {estafetaResult.ocurreForzoso || 'No disponible'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {estafetaResult.ocurreForzoso === 'No'
              ? 'No se requiere recolección en sucursal'
              : 'Se requiere recolección en sucursal'}
          </p>
        </div>

        {/* Delivery Days */}
        {renderEstafetaDeliveryDays(estafetaResult.estafetaDeliveryDays)}

        {/* Validation link */}
        <button
          onClick={validateThreeTimes}
          className="absolute bottom-2 right-2 text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Validar en Estafeta
        </button>
      </div>
      
      {/* Report button */}
      <div className="flex justify-end">
        <button
          onClick={handleReport}
          disabled={reportSubmitted}
          className={`flex items-center px-3 py-1.5 rounded text-sm ${
            reportSubmitted
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {reportSubmitted ? (
            <>
              <svg className="h-4 w-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              ¡Reporte Enviado!
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z"
                />
              </svg>
              Reportar Información Desactualizada
            </>
          )}
        </button>
      </div>
    </div>
  );
};