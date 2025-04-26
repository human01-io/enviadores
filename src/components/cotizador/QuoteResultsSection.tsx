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

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-2">Servicios Disponibles</h3>
      <div className="overflow-x-auto">
        {detallesCotizacion?.reexpedicion > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            Precio estándar de reexpedición aplicado
          </div>
        )}

        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-gray-300 p-2">Servicio</th>
              <th className="border border-gray-300 p-2">Precio Base</th>
              <th className="border border-gray-300 p-2">Sobrepeso</th>
              <th className="border border-gray-300 p-2">Peso Facturable</th>
              <th className="border border-gray-300 p-2">Reexpedición</th>
              <th className="border border-gray-300 p-2">Empaque</th>
              <th className="border border-gray-300 p-2">Seguro</th>
              <th className="border border-gray-300 p-2">Recoleccion</th>
              <th className="border border-gray-300 p-2">IVA (16%)</th>
              <th className="border border-gray-300 p-2">Subtotal</th>
              <th className="border border-gray-300 p-2">Total</th>
              <th className="border border-gray-300 p-2">Tiempo</th>
              <th className="border border-gray-300 p-2"></th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((servicio) => (
              <tr 
                key={servicio.sku}
                className={`cursor-pointer hover:bg-blue-50 ${selectedService?.sku === servicio.sku ? 'bg-blue-100 border-2 border-blue-400' : ''}`}
                onClick={() => setSelectedService(servicio)}
              >
                <td className="border border-gray-300 p-2">{servicio.nombre}</td>
                <td className="border border-gray-300 p-2">${servicio.precioBase.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="border border-gray-300 p-2">${servicio.cargoSobrepeso.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="border border-gray-300 p-2">{servicio.pesoFacturable} kg</td>
                <td className="border border-gray-300 p-2">${detallesCotizacion.reexpedicion.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="border border-gray-300 p-2">${detallesCotizacion.empaque.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="border border-gray-300 p-2">${detallesCotizacion.seguro.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="border border-gray-300 p-2">${detallesCotizacion.recoleccion.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="border border-gray-300 p-2">${servicio.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                <td className="border border-gray-300 p-2 font-semibold">${servicio.precioTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="border border-gray-300 p-2 font-semibold">${servicio.precioConIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                <td className="border border-gray-300 p-2">{servicio.diasEstimados} día{servicio.diasEstimados !== 1 ? 's' : ''}</td>
                <td className="border border-gray-300 p-2 text-center">
                  <input
                    type="radio"
                    name="selectedService"
                    checked={selectedService?.sku === servicio.sku}
                    onChange={() => {}}
                    className="cursor-pointer"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedService && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={proceedToCustomerData}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              Continuar con {selectedService.nombre}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};