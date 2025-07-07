import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Info, Eye, TrendingDown } from 'lucide-react';
import { Badge } from '../ui/BadgeComponent';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/CardComponent';
import { useManuable } from '../../hooks/useManuable';

// Import carrier logos
import EstafetaLogo from '../../assets/carrier-logos/estafeta-logo.svg';
import UPSLogo from '../../assets/carrier-logos/ups-logo.svg';
import FedexLogo from '../../assets/carrier-logos/fedex-logo.png';
import DHLLogo from '../../assets/carrier-logos/dhl-logo.png';

interface ManuableRate {
  uuid: string;
  carrier: string;
  service: string;
  total_amount: string;
  currency: string;
  lead_time?: string;
  cancellable?: boolean;
  shipping_type?: string;
  additional_fees?: Array<{
    amount: string;
    code: string;
    description: string;
    include_taxes: boolean;
    name: string;
  }>;
}

interface ProviderCostsViewProps {
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

const ProviderCostsView: React.FC<ProviderCostsViewProps> = ({
  originZip,
  destZip,
  packageDetails
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rates, setRates] = useState<ManuableRate[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  
  const { 
    isLoading, 
    error, 
    getRates 
  } = useManuable();

  // Fetch rates when expanded for the first time
  useEffect(() => {
    const fetchRates = async () => {
      if (isExpanded && !hasFetched && originZip && destZip && packageDetails.peso) {
        try {
          console.log('Fetching provider costs for comparison:', { originZip, destZip, packageDetails });
          const fetchedRates = await getRates(originZip, destZip, packageDetails);
          if (fetchedRates && Array.isArray(fetchedRates)) {
            setRates(fetchedRates);
          }
          setHasFetched(true);
        } catch (error) {
          console.error("Error fetching provider rates:", error);
          setHasFetched(true);
        }
      }
    };

    fetchRates();
  }, [isExpanded, hasFetched, originZip, destZip, packageDetails, getRates]);

  const formatCurrency = (amount: string) => {
    const numericAmount = parseFloat(amount);
    return numericAmount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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

  return (
    <Card className="border-orange-200 bg-orange-50 mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingDown className="h-5 w-5 mr-2 text-orange-600" />
            <div>
              <CardTitle className="text-base">Costos de Proveedor (Manuable)</CardTitle>
              <p className="text-sm text-orange-700 mt-1">
                Información de costos reales del proveedor para la ruta {originZip} → {destZip}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center px-3 py-1.5 text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-md transition-colors"
          >
            <Eye className="h-4 w-4 mr-1" />
            {isExpanded ? 'Ocultar' : 'Ver costos'}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            {/* Header Info */}
            <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center text-orange-800">
                <Info className="h-4 w-4 mr-2" />
                <p className="text-sm">
                  <strong>Solo información:</strong> Estos son los costos reales del proveedor. 
                  No afectan los precios mostrados al cliente.
                </p>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full mr-3"></div>
                <p className="text-orange-700">Obteniendo costos de proveedor...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="flex items-center text-red-700 py-4">
                <Info className="h-4 w-4 mr-2" />
                <p className="text-sm">No se pudieron obtener los costos del proveedor: {error}</p>
              </div>
            )}

            {/* No Data State */}
            {!isLoading && !error && hasFetched && (!rates || rates.length === 0) && (
              <div className="flex items-center text-gray-700 py-4">
                <Info className="h-4 w-4 mr-2" />
                <p className="text-sm">No hay costos de proveedor disponibles para esta ruta.</p>
              </div>
            )}

            {/* Data Display */}
            {!isLoading && !error && rates && rates.length > 0 && (
              <>
                {/* Desktop View */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Paquetería
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Servicio
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tiempo
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cargos Adicionales
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Costo Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rates.map((rate, index) => {
                          const logo = getCarrierLogo(rate.carrier);
                          const serviceInfo = getServiceTypeInfo(rate.service);
                          const hasAdditionalFees = rate.additional_fees && rate.additional_fees.length > 0;

                          return (
                            <tr key={rate.uuid || index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {logo ? (
                                    <div className="w-10 h-4 flex items-center justify-center">
                                      <img 
                                        src={logo} 
                                        alt={rate.carrier} 
                                        className="max-w-full max-h-full object-contain"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-4 w-10 bg-gray-100 rounded flex items-center justify-center">
                                      <span className="text-xs text-gray-600 font-medium">
                                        {rate.carrier.slice(0, 3)}
                                      </span>
                                    </div>
                                  )}
                                  <span className="text-sm font-medium text-gray-900">
                                    {rate.carrier}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded ${serviceInfo.className}`}>
                                  {serviceInfo.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {rate.lead_time || 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {rate.cancellable && (
                                    <Badge className="bg-green-100 text-green-700 text-xs">
                                      Cancelable
                                    </Badge>
                                  )}
                                  {hasAdditionalFees && (
                                    <Badge className="bg-amber-100 text-amber-700 text-xs">
                                      +{rate.additional_fees!.length} cargo{rate.additional_fees!.length > 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {hasAdditionalFees ? (
                                  <div className="space-y-1">
                                    {rate.additional_fees!.map((fee, feeIndex) => (
                                      <div key={feeIndex} className="flex items-center justify-between text-xs">
                                        <span className="text-gray-700">{fee.name}</span>
                                        <span className="text-gray-900 font-medium">
                                          +${formatCurrency(fee.amount)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500">Sin cargos adicionales</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-bold text-gray-900">
                                  ${formatCurrency(rate.total_amount)}
                                </div>
                                <div className="text-xs text-gray-500">{rate.currency}</div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                  {rates.map((rate, index) => {
                    const logo = getCarrierLogo(rate.carrier);
                    const serviceInfo = getServiceTypeInfo(rate.service);
                    const hasAdditionalFees = rate.additional_fees && rate.additional_fees.length > 0;

                    return (
                      <div key={rate.uuid || index} className="bg-gray-50 rounded-lg p-3 border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {logo ? (
                              <div className="w-10 h-4 flex items-center justify-center">
                                <img 
                                  src={logo} 
                                  alt={rate.carrier} 
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="h-4 w-10 bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-xs text-gray-600 font-medium">
                                  {rate.carrier.slice(0, 3)}
                                </span>
                              </div>
                            )}
                            <span className="text-sm font-medium">{rate.carrier}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-bold text-gray-900">
                              ${formatCurrency(rate.total_amount)}
                            </div>
                            <div className="text-xs text-gray-500">{rate.currency}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${serviceInfo.className}`}>
                            {serviceInfo.label}
                          </span>
                          {rate.lead_time && (
                            <span className="text-xs text-gray-600">{rate.lead_time}</span>
                          )}
                          {rate.cancellable && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              Cancelable
                            </Badge>
                          )}
                        </div>

                        {hasAdditionalFees && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Cargos adicionales:</p>
                            <div className="space-y-1">
                              {rate.additional_fees!.map((fee, feeIndex) => (
                                <div key={feeIndex} className="flex justify-between items-center text-xs">
                                  <span className="text-gray-700">{fee.name}</span>
                                  <span className="text-gray-900 font-medium">
                                    +${formatCurrency(fee.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ProviderCostsView;