import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, RefreshCw, Info } from 'lucide-react';
import { useManuable } from '../hooks/useManuable';
import { CSSTransition } from 'react-transition-group';

interface ManuableSurchargesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManuableSurchargesModal: React.FC<ManuableSurchargesModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isLoading, error, surchargesList, surchargesPage, getSurcharges, isAuthenticated, login } = useManuable();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated) {
        // If already authenticated, get the surcharges
        loadSurcharges();
      } else {
        // If not authenticated, try to login first
        handleLogin();
      }
    }
  }, [isOpen, isAuthenticated]);

  const loadSurcharges = async (page?: number) => {
    try {
      await getSurcharges({ page });
    } catch (err) {
      console.error("Error loading surcharges:", err);
    }
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      await login();
      // After successful login, get the surcharges
      await loadSurcharges();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al conectar con Manuable';
      setLoginError(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    loadSurcharges(newPage);
  };



  const formatPrice = (price: string | number) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice)) return price;
    
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(numericPrice);
  };

  const getStatusBadgeClass = (status?: string) => {
    if (!status) return 'bg-gray-200 text-gray-800';
    
    switch(status.toLowerCase()) {
      case 'active':
      case 'activo':
      case 'collected':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'inactivo':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getSurchargeTypeName = (surchargeType: string) => {
    switch(surchargeType) {
      case 'additional_fee':
        return 'Tarifa adicional';
      case 'weight_difference':
        return 'Diferencia de peso';
      default:
        return surchargeType || 'Estándar';
    }
  };

  // Get the actual surcharges data - handle both formats
  const getSurchargesData = () => {
    // Check if surchargesList.data exists and has items
    if (surchargesList?.data && Array.isArray(surchargesList.data) && surchargesList.data.length > 0) {
      return surchargesList.data;
    }
    
    // If not, check if the response has numbered keys (0, 1, 2, etc.)
    if (surchargesList && typeof surchargesList === 'object') {
      const keys = Object.keys(surchargesList).filter(key => 
        !isNaN(Number(key)) && key !== 'data' && key !== 'pagination'
      );
      
      if (keys.length > 0) {
        return keys.map(key => (surchargesList as any)[key]);
      }
    }
    
    return [];
  };

  const surchargesData = getSurchargesData();

  return (
    <CSSTransition
      in={isOpen}
      timeout={300}
      classNames="modal"
      unmountOnExit
    >
      <div className="fixed inset-0  bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-opacity-75" onClick={onClose}></div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div 
            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white">
              <h3 className="text-lg font-medium">Sobrecargos Manuable</h3>
              <button 
                onClick={onClose}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {loginLoading || isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">
                    {loginLoading ? 'Conectando con Manuable...' : 'Cargando sobrecargos...'}
                  </span>
                </div>
              ) : loginError || error ? (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                  <div className="font-medium">Error</div>
                  <div>{loginError || error}</div>
                  <button 
                    onClick={handleLogin}
                    className="mt-3 flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" /> Intentar nuevamente
                  </button>
                </div>
              ) : (
                <>
                  {/* Info banner */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm flex items-start">
                    <Info className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      Los sobrecargos son cargos adicionales que pueden aplicarse a tus envíos. Estos varían según la zona, el tipo de servicio y otros factores.
                    </div>
                  </div>

                  {/* Surcharges table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Número de seguimiento
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Monto
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo de sobrecargo
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descripción
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sobrepeso (kg)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {surchargesData.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              No se encontraron sobrecargos
                            </td>
                          </tr>
                        ) : (
                          surchargesData.map((surcharge, index) => (
                            <tr key={surcharge.uuid || `surcharge-${index}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {surcharge.tracking_number || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatPrice(surcharge.amount_collected || surcharge.amount_to_collect || '0')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(surcharge.status)}`}>
                                  {surcharge.status === 'collected' ? 'Cobrado' : surcharge.status || 'No especificado'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {getSurchargeTypeName(surcharge.surcharge_type)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                                {surcharge.additional_fee_info ? (
                                  <div>
                                    <div className="font-medium">{surcharge.additional_fee_info.name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{surcharge.additional_fee_info.description}</div>
                                  </div>
                                ) : (
                                  surcharge.surcharge_type === 'weight_difference' ? 'Diferencia de peso detectada' : 'Sin descripción'
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {surcharge.overweight ? `${surcharge.overweight} kg` : '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination - only show if we have pagination data */}
                  {(surchargesList as any)?.pagination && (surchargesList as any).pagination.total_pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                      <div className="flex justify-between flex-1 sm:hidden">
                        <button
                          onClick={() => handlePageChange(Math.max(1, surchargesPage - 1))}
                          disabled={surchargesPage <= 1}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                            surchargesPage <= 1
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              : 'text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => handlePageChange(surchargesPage + 1)}
                          disabled={(surchargesList as any).pagination && surchargesPage >= (surchargesList as any).pagination.total_pages}
                          className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium rounded-md ${
                            (surchargesList as any).pagination && surchargesPage >= (surchargesList as any).pagination.total_pages
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              : 'text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                        >
                          Siguiente
                        </button>
                      </div>
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Mostrando{' '}
                            <span className="font-medium">página {surchargesPage}</span>{' '}
                            de{' '}
                            <span className="font-medium">{(surchargesList as any).pagination?.total_pages || 1}</span>{' '}
                            páginas
                          </p>
                        </div>
                        <div>
                          <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => handlePageChange(Math.max(1, surchargesPage - 1))}
                              disabled={surchargesPage <= 1}
                              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                surchargesPage <= 1
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              <span className="sr-only">Anterior</span>
                              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                            </button>
                            
                            {/* Current page indicator */}
                            <span
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-700"
                            >
                              {surchargesPage}
                            </span>
                            
                            <button
                              onClick={() => handlePageChange(surchargesPage + 1)}
                              disabled={(surchargesList as any).pagination && surchargesPage >= (surchargesList as any).pagination.total_pages}
                              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                (surchargesList as any).pagination && surchargesPage >= (surchargesList as any).pagination.total_pages
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              <span className="sr-only">Siguiente</span>
                              <ChevronRight className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 text-right">
              <button
                onClick={() => loadSurcharges(1)}
                className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none mr-2"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Actualizar
              </button>
              <button
                onClick={onClose}
                className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </CSSTransition>
  );
};