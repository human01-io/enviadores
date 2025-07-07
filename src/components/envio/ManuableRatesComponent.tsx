import React, { useEffect, useState } from 'react';
import { ManuableRate } from '../../services/manuableService';
import { useManuable } from '../../hooks/useManuable';

// Extended interface to include additional properties from API response
interface ExtendedManuableRate extends Omit<ManuableRate, 'additional_fees'> {
  lead_time?: string;
  cancellable?: boolean;
  additional_fees?: Array<{
    amount: string;
    code: string;
    description: string;
    include_taxes: boolean;
    name: string;
  }>;
}

// Import carrier logos
import EstafetaLogo from '../../assets/carrier-logos/estafeta-logo.svg';
import UPSLogo from '../../assets/carrier-logos/ups-logo.svg';
import FedexLogo from '../../assets/carrier-logos/fedex-logo.png';
import DHLLogo from '../../assets/carrier-logos/dhl-logo.png';

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
  onSelectService: (service: ExtendedManuableRate) => void;
  selectedService: ExtendedManuableRate | null;
}

// Carrier logo mapping
const CARRIER_LOGOS = {
  'FEDEX': FedexLogo,
  'DHL': DHLLogo,
  'Estafeta': EstafetaLogo,
  'UPS': UPSLogo
} as const;

// Service type configuration
const SERVICE_TYPES = {
  'express': {
    label: 'Express',
    description: '1-2 días',
    className: 'bg-orange-100 text-orange-700'
  },
  'standard': {
    label: 'Estándar',
    description: '3+ días',
    className: 'bg-blue-100 text-blue-700'
  }
} as const;

const ManuableRatesComponent: React.FC<ManuableRatesComponentProps> = ({
  originZip,
  destZip,
  packageDetails,
  onSelectService,
  selectedService
}) => {
  const [localLoading, setLocalLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { 
    isLoading: apiLoading, 
    error, 
    rates, 
    getRates 
  } = useManuable();

  const [hasFetched, setHasFetched] = useState(false);
  const isLoading = apiLoading || localLoading;

  // Handle selection with animation
  const handleSelectService = (service: ExtendedManuableRate) => {
    if (selectedService?.uuid === service.uuid) {
      // Deselect current service
      onSelectService(null as any);
      setIsCollapsed(false);
    } else {
      // Select new service
      onSelectService(service);
      setIsCollapsed(true);
    }
  };

  // Reset collapse when no service is selected externally
  useEffect(() => {
    if (!selectedService) {
      setIsCollapsed(false);
    }
  }, [selectedService]);

  useEffect(() => {
    const fetchRates = async () => {
      if (originZip && destZip && packageDetails.peso) {
        try {
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

  const formatCurrency = (amount: string) => {
    const numericAmount = parseFloat(amount);
    return numericAmount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleFetchRates = async () => {
    setLocalLoading(true);
    try {
      await getRates(originZip, destZip, packageDetails);
    } catch (error) {
      console.error("Error fetching rates:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  const getCarrierLogo = (carrier: string): string | undefined => {
    return CARRIER_LOGOS[carrier as keyof typeof CARRIER_LOGOS] || undefined;
  };

  const getServiceTypeInfo = (service: string) => {
    return SERVICE_TYPES[service as keyof typeof SERVICE_TYPES] || {
      label: service,
      description: '',
      className: 'bg-gray-100 text-gray-700'
    };
  };

  if (isLoading && !hasFetched) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Obteniendo cotizaciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-medium text-red-800 text-sm">Error al obtener cotizaciones</h3>
            <p className="text-xs text-red-700 mt-1">{error}</p>
            <button
              onClick={handleFetchRates}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
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
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-medium text-yellow-800 text-sm">No hay servicios disponibles</h3>
              <p className="text-xs text-yellow-700 mt-1">
                No se encontraron servicios de envío para esta ruta.
              </p>
              <button
                onClick={handleFetchRates}
                className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-600">Esperando datos...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 transition-all duration-300 ${
      isCollapsed ? 'max-h-28 overflow-hidden' : 'max-h-80 overflow-y-auto'
    }`}>
      <div className="flex justify-between items-center sticky top-0 bg-white z-10 pb-2">
        <h3 className="text-sm font-semibold text-gray-900">Cotizaciones disponibles</h3>
        <button
          onClick={handleFetchRates}
          disabled={isLoading}
          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded flex items-center transition-colors disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      <div className="space-y-1">
        {rates.map((rate, index) => {
          const extendedRate = rate as ExtendedManuableRate;
          const logo = getCarrierLogo(extendedRate.carrier);
          const serviceInfo = getServiceTypeInfo(extendedRate.service);
          const isSelected = selectedService?.uuid === extendedRate.uuid;
          const hasAdditionalFees = extendedRate.additional_fees && extendedRate.additional_fees.length > 0;
          const shouldShow = !isCollapsed || isSelected;

          return (
            <div
              key={extendedRate.uuid || index}
              className={`transition-all duration-300 ease-in-out ${
                shouldShow 
                  ? 'opacity-100 max-h-32 transform translate-y-0' 
                  : 'opacity-0 max-h-0 transform -translate-y-2 pointer-events-none'
              }`}
              style={{
                transitionProperty: 'opacity, max-height, transform, margin',
              }}
            >
              <div
                className={`p-2 border rounded transition-all hover:shadow-sm ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* SINGLE ROW LAYOUT WITH HORIZONTAL SPACE USAGE */}
                <div className="flex items-center gap-2">
                  {/* Logo Section */}
                  <div className="flex-shrink-0">
                    {logo ? (
                      <div className="w-12 h-5 flex items-center justify-center">
                        <img 
                          src={logo} 
                          alt={extendedRate.carrier} 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-5 w-12 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-600 font-medium">{extendedRate.carrier.slice(0, 3)}</span>
                      </div>
                    )}
                  </div>

                  {/* Service Info */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${serviceInfo.className}`}>
                      {serviceInfo.label}
                    </span>
                    {extendedRate.lead_time && (
                      <span className="text-xs text-gray-600 whitespace-nowrap">{extendedRate.lead_time}</span>
                    )}
                  </div>

                  {/* MIDDLE SPACE FOR ADDITIONAL CHARGES */}
                  <div className="flex-1 flex items-center justify-start gap-1 px-2">
                    {extendedRate.cancellable && (
                      <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                        Cancelable
                      </span>
                    )}
                    
                    {hasAdditionalFees && extendedRate.additional_fees!.map((fee, feeIndex) => (
                      <span 
                        key={feeIndex} 
                        className="px-1.5 py-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded"
                        title={`${fee.description} - Código: ${fee.code} - ${fee.include_taxes ? 'Con IVA' : 'Sin IVA'}`}
                      >
                        {fee.name}: +${formatCurrency(fee.amount)}
                      </span>
                    ))}
                  </div>

                  {/* Price and Button */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-base font-bold text-gray-900">
                        ${formatCurrency(extendedRate.total_amount)}
                      </div>
                      <div className="text-xs text-gray-500">{extendedRate.currency}</div>
                    </div>
                    
                    <button
                      onClick={() => handleSelectService(extendedRate)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isSelected ? 'Cambiar' : 'Elegir'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ManuableRatesComponent;