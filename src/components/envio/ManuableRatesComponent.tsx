import React, { useEffect, useState } from 'react';
import { ManuableRate } from '../../services/manuableService';
import { useManuable } from '../../hooks/useManuable';
import { ServicioCotizado } from '../../types';

interface ManuableRatesComponentProps {
  originZip: string;
  destZip: string;
  packageDetails: {
    peso: number;
    alto?: number;
    largo?: number;
    ancho?: number;
    valor_declarado?: number;
    content?: string;
  };
  onSelectService: (service: ManuableRate) => void;
  selectedService: ManuableRate | null;
}

const ManuableRatesComponent: React.FC<ManuableRatesComponentProps> = ({
  originZip,
  destZip,
  packageDetails,
  onSelectService,
  selectedService
}) => {
  // Add local loading state for manual fetch operations
  const [localLoading, setLocalLoading] = useState(false);
  
  const { 
    isLoading: apiLoading, 
    error, 
    rates, 
    getRates 
  } = useManuable();

  const [hasFetched, setHasFetched] = useState(false);
  
  // Combine API loading state with local loading state
  const isLoading = apiLoading || localLoading;

  // Fetch rates when component mounts or inputs change
  useEffect(() => {
    const fetchRates = async () => {
      if (originZip && destZip && packageDetails.peso) {
        try {
          // Use the actual package details from the quotation
          console.log('Using package details for Manuable:', packageDetails);
          
          await getRates(originZip, destZip, packageDetails);
          setHasFetched(true);
        } catch (error) {
          console.error("Error fetching rates:", error);
          setHasFetched(true);
        }
      }
    };

    if (!hasFetched) {
      fetchRates();
    }

  }, [originZip, destZip, packageDetails]);

  // Convert ManuableRate to display format for price
  const formatCurrency = (amount: string) => {
    const numericAmount = parseFloat(amount);
    return numericAmount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Manual fetch button handler - fixed to use localLoading
  const handleFetchRates = async () => {
    // Set loading state using localLoading
    setLocalLoading(true);
    
    try {
      // Call the API directly instead of through the useEffect cycle
      await getRates(originZip, destZip, packageDetails);
    } catch (error) {
      console.error("Error fetching rates:", error);
    } finally {
      // Always set loading to false when done
      setLocalLoading(false);
    }
  };

  if (isLoading && !hasFetched) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-gray-600">Obteniendo cotizaciones de Manuable...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-medium text-red-800">Error al obtener cotizaciones</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={handleFetchRates}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!rates || !Array.isArray(rates) || rates.length === 0) {
    if (hasFetched) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-medium text-yellow-800">No hay servicios disponibles</h3>
              <p className="text-sm text-yellow-700 mt-1">
                No se encontraron servicios de envío para esta ruta. Verifique los códigos postales o inténtelo más tarde.
              </p>
              <button
                onClick={handleFetchRates}
                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // If we haven't fetched yet, show a loading state
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">Esperando datos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="font-medium text-gray-800">Cotizaciones disponibles</h3>
        <button
          onClick={handleFetchRates}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paquetería</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rates.map((rate, index) => (
              <tr key={rate.uuid || index} className={selectedService?.uuid === rate.uuid ? 'bg-blue-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rate.carrier}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rate.service}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rate.shipping_type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(rate.total_amount)} {rate.currency}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onSelectService(rate)}
                    className={`px-3 py-1 rounded-md ${
                      selectedService?.uuid === rate.uuid
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {selectedService?.uuid === rate.uuid ? 'Seleccionado' : 'Seleccionar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedService && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h5 className="font-semibold mb-2">Servicio seleccionado:</h5>
          <p>{selectedService.carrier} - {selectedService.service}</p>
          <p className="font-medium">Precio: ${formatCurrency(selectedService.total_amount)} {selectedService.currency}</p>
        </div>
      )}
    </div>
  );
};

export default ManuableRatesComponent;