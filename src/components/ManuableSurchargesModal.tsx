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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatPrice = (price: string) => {
    const numericPrice = parseFloat(price);
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
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'inactivo':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <CSSTransition
      in={isOpen}
      timeout={300}
      classNames="modal"
      unmountOnExit
    >
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div 
            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
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
                            Nombre
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Descripción
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {surchargesList.data.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                              No se encontraron sobrecargos
                            </td>
                          </tr>
                        ) : (
                          surchargesList.data.map((surcharge) => (
                            <tr key={surcharge.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {surcharge.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatPrice(surcharge.price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(surcharge.status)}`}>
                                  {surcharge.status || 'No especificado'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {surcharge.type || 'Estándar'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                                {surcharge.description || 'Sin descripción'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {surchargesList.meta && surchargesList.meta.total_pages > 1 && (
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
                          disabled={surchargesList.meta && surchargesPage >= surchargesList.meta.total_pages}
                          className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium rounded-md ${
                            surchargesList.meta && surchargesPage >= surchargesList.meta.total_pages
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
                            <span className="font-medium">{surchargesList.meta?.total_pages || 1}</span>{' '}
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
                              disabled={surchargesList.meta && surchargesPage >= surchargesList.meta.total_pages}
                              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                surchargesList.meta && surchargesPage >= surchargesList.meta.total_pages
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