import React from 'react';
import { DeliveryFrequency, EstafetaResult } from './utils/cotizadorTypes';

interface DeliveryInfoDisplayProps {
  deliveryFrequency: DeliveryFrequency | null;
  loadingFrequency: boolean;
  estafetaResult: EstafetaResult | null;
  loadingEstafeta: boolean;
  validateOnExternalSite: () => void;
  validateThreeTimes: () => void;
  handleReport: () => void;
  reportSubmitted: boolean;
}

export const DeliveryInfoDisplay: React.FC<DeliveryInfoDisplayProps> = ({
  deliveryFrequency,
  loadingFrequency,
  estafetaResult,
  loadingEstafeta,
  validateOnExternalSite,
  validateThreeTimes,
  handleReport,
  reportSubmitted
}) => {
  const renderDeliveryDays = (frequency: DeliveryFrequency) => {
    const days = [
      { name: 'Lunes', key: 'lunes', short: 'L' },
      { name: 'Martes', key: 'martes', short: 'M' },
      { name: 'Miércoles', key: 'miercoles', short: 'MI' },
      { name: 'Jueves', key: 'jueves', short: 'J' },
      { name: 'Viernes', key: 'viernes', short: 'V' },
      { name: 'Sábado', key: 'sabado', short: 'S' },
      { name: 'Domingo', key: 'domingo', short: 'D' },
    ];

    return (
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Días de entrega:</h4>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {days.map(day => (
              <div
                key={day.key}
                className={`w-8 h-8 rounded-full flex items-center justify-center 
                            ${frequency[day.key as keyof DeliveryFrequency]
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'}`}
                title={day.name}
              >
                {day.short}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFrequencyInfo = () => {
    if (loadingFrequency) {
      return <div className="mt-4 text-gray-500">Cargando información de entrega...</div>;
    }

    if (!deliveryFrequency) {
      return <div className="mt-4 text-yellow-600">No se encontró información de entrega para este código postal</div>;
    }

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Información de Entrega</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><span className="font-semibold">Frecuencia:</span> {deliveryFrequency.frecuencia}</p>
            <p><span className="font-semibold">Garantía máxima:</span> {deliveryFrequency.garantia_maxima}</p>
          </div>
          <div>
            <p>
              <span className="font-semibold">Zona extendida:</span>
              {deliveryFrequency.zona_extendida ? (
                <span className="text-red-600 ml-1">Sí (puede tener costo adicional)</span>
              ) : (
                <span className="text-green-600 ml-1">No</span>
              )}
            </p>
            <p>
              <span className="font-semibold">Recolección en sucursal:</span>
              {deliveryFrequency.ocurre_forzoso ? (
                <span className="text-red-600 ml-1">Requerida</span>
              ) : (
                <span className="text-green-600 ml-1">No requerida</span>
              )}
            </p>
          </div>
        </div>

        {renderDeliveryDays(deliveryFrequency)}
      </div>
    );
  };

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
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Días de entrega disponibles:</h4>
        <div className="flex flex-wrap gap-2">
          {days.map(day => (
            <div
              key={day.key}
              className={`px-3 py-1 rounded-full ${deliveryDays[day.key]
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-500'
                }`}
            >
              <div className="flex items-center">
                {deliveryDays[day.key] ? (
                  <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  const renderEstafetaResults = () => {
    if (loadingEstafeta) {
      return (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-600 flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Consultando Estafeta...
          </p>
        </div>
      );
    }

    if (!estafetaResult) return null;

    return (
      <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 relative">
        <h3 className="font-semibold text-lg mb-3 text-blue-600">Resultados de Estafeta</h3>

        {/* Cost Information */}
        <div className="mb-3">
          <p className="font-medium">Costo de Reexpedición:</p>
          <p className={`text-lg ${estafetaResult.reexpe === 'No' ? 'text-green-600' : 'text-blue-600'
            }`}>
            {estafetaResult.reexpe === 'No' ? 'Sin costo adicional' : estafetaResult.reexpe}
          </p>
        </div>

        {/* Ocurre Forzoso Information */}
        <div>
          <p className="font-medium">Ocurre Forzoso:</p>
          <p className={`${estafetaResult.ocurreForzoso === 'No' ? 'text-green-600' : 'text-yellow-600'
            }`}>
            {estafetaResult.ocurreForzoso || 'No disponible'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {estafetaResult.ocurreForzoso === 'No'
              ? 'No se requiere recolección en sucursal'
              : 'Se requiere recolección en sucursal'}
          </p>
        </div>
        {renderEstafetaDeliveryDays(estafetaResult.estafetaDeliveryDays)}

        {/* Added validation button */}
        <button
          onClick={validateThreeTimes}
          className="absolute bottom-2 right-2 text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Validar tres veces
        </button>
      </div>
    );
  };

  return (
    <div>
      {renderFrequencyInfo()}
      {renderEstafetaResults()}
      
      {/* External validation button - only shows after validation */}
      <div className="mt-4 flex space-x-2">
        <button
          onClick={validateOnExternalSite}
          disabled={loadingEstafeta}
          className={`px-4 py-2 text-white rounded flex items-center ${loadingEstafeta ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
            } transition-colors`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
              clipRule="evenodd"
            />
          </svg>
          {loadingEstafeta ? 'Consultando...' : 'Verificar en Estafeta'}
        </button>
        
        {estafetaResult && (
          <button
            onClick={handleReport}
            disabled={reportSubmitted}
            className={`flex items-center px-4 py-2 rounded ${reportSubmitted
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
          >
            {reportSubmitted ? (
              <>
                <svg className="h-4 w-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Reporte Enviado!
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        )}
      </div>
    </div>
  );
};