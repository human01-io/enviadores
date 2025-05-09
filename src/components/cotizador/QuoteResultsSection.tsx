import React from 'react';
import { ServicioCotizado, DetallesCotizacion } from './utils/cotizadorTypes';

interface QuoteResultsSectionProps {
  servicios: ServicioCotizado[];
  detallesCotizacion: DetallesCotizacion | null;
  selectedService: ServicioCotizado | null;
  setSelectedService: (service: ServicioCotizado | null) => void;
  proceedToCustomerData: () => void;
}

export const QuoteResultsSection: React.FC<QuoteResultsSectionProps> = ({
  servicios,
  detallesCotizacion,
  selectedService,
  setSelectedService,
  proceedToCustomerData
}) => {
  if (!servicios || !detallesCotizacion) {
    return null;
  }

  // Format numbers with comma separators
  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-MX', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className="space-y-4">
      {detallesCotizacion?.reexpedicion > 0 && (
        <div className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
          ⚠️ Precio estándar de reexpedición aplicado
        </div>
      )}

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2">Servicio</th>
              <th className="border border-gray-300 p-2">Precio Base</th>
              <th className="border border-gray-300 p-2">Cargo Sobrepeso</th>
              <th className="border border-gray-300 p-2">Subtotal</th>
              <th className="border border-gray-300 p-2">Total (con IVA)</th>
              <th className="border border-gray-300 p-2">Tiempo</th>
              <th className="border border-gray-300 p-2">Seleccionar</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((servicio) => (
              <tr 
                key={servicio.sku}
                className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                  selectedService?.sku === servicio.sku ? 'bg-blue-100 border-2 border-blue-400' : ''
                }`}
                onClick={() => setSelectedService(servicio)}
              >
                <td className="border border-gray-300 p-2 font-medium">{servicio.nombre}</td>
                <td className="border border-gray-300 p-2">${formatCurrency(servicio.precioBase)}</td>
                <td className={`border border-gray-300 p-2 ${servicio.cargoSobrepeso > 0 ? 'font-medium text-amber-600' : ''}`}>
                  ${formatCurrency(servicio.cargoSobrepeso)}
                </td>
                <td className="border border-gray-300 p-2 font-medium">${formatCurrency(servicio.precioTotal)}</td>
                <td className="border border-gray-300 p-2 font-medium text-blue-700">${formatCurrency(servicio.precioConIva)}</td>
                <td className="border border-gray-300 p-2">{servicio.diasEstimados} día{servicio.diasEstimados !== 1 ? 's' : ''}</td>
                <td className="border border-gray-300 p-2 text-center">
                  <div className="flex justify-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      selectedService?.sku === servicio.sku 
                        ? 'bg-blue-600 text-white' 
                        : 'border-2 border-gray-300'
                    }`}>
                      {selectedService?.sku === servicio.sku && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {servicios.map((servicio) => (
          <div 
            key={servicio.sku}
            className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
              selectedService?.sku === servicio.sku
                ? 'border-blue-500 shadow-md bg-blue-50'
                : 'border-gray-300 hover:border-blue-300 hover:shadow'
            }`}
            onClick={() => setSelectedService(servicio)}
          >
            <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-medium">{servicio.nombre}</h3>
              <div className="flex items-center">
                <span className="text-blue-700 font-medium mr-2">${formatCurrency(servicio.precioConIva)}</span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedService?.sku === servicio.sku 
                    ? 'bg-blue-600 text-white' 
                    : 'border-2 border-gray-300'
                }`}>
                  {selectedService?.sku === servicio.sku && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Precio Base:</span>
                  <p className="font-medium">${formatCurrency(servicio.precioBase)}</p>
                </div>
                {servicio.cargoSobrepeso > 0 && (
                  <div>
                    <span className="text-gray-500">Cargo Sobrepeso:</span>
                    <p className="font-medium text-amber-600">${formatCurrency(servicio.cargoSobrepeso)}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Subtotal:</span>
                  <p className="font-medium">${formatCurrency(servicio.precioTotal)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tiempo estimado:</span>
                  <p>{servicio.diasEstimados} día{servicio.diasEstimados !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional charges summary - more compact */}
      <div className="p-3 bg-gray-50 border rounded-lg">
        <h3 className="font-medium text-sm mb-2">Cargos adicionales:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Empaque:</span>
            <p>${formatCurrency(detallesCotizacion.empaque)}</p>
          </div>
          <div>
            <span className="text-gray-500">Seguro:</span>
            <p>${formatCurrency(detallesCotizacion.seguro)}</p>
          </div>
          <div>
            <span className="text-gray-500">Recolección:</span>
            <p>${formatCurrency(detallesCotizacion.recoleccion)}</p>
          </div>
          <div>
            <span className="text-gray-500">Reexpedición:</span>
            <p>${formatCurrency(detallesCotizacion.reexpedicion)}</p>
          </div>
        </div>
      </div>

      {/* Continue button with enhanced visual cues */}
      <div className="pt-4 border-t mt-4">
        {selectedService ? (
          <div className="relative">
            {/* Animated arrow to highlight the continue button */}
            <div className="absolute -top-8 right-6 text-green-500 animate-bounce hidden md:block">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            
            <button
              onClick={proceedToCustomerData}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              Continuar con {selectedService.nombre}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-sm text-yellow-700">
              ⚠️ Seleccione un servicio para continuar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};