import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, RefreshCw, Info, Search, Filter } from 'lucide-react';
import { useManuable } from '../hooks/useManuable';
import { CSSTransition } from 'react-transition-group';

interface ManuableCancellationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManuableCancellationsModal: React.FC<ManuableCancellationsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    isLoading, 
    error, 
    cancellationsHistory, 
    cancellationsPage, 
    getCancellationsHistory, 
    isAuthenticated, 
    login 
  } = useManuable();
  
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [reasonFilter, setReasonFilter] = useState<string>('');
  const [refundStatusFilter, setRefundStatusFilter] = useState<string>('');
  const [trackingNumberFilter, setTrackingNumberFilter] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated) {
        loadCancellationsHistory();
      } else {
        handleLogin();
      }
    }
  }, [isOpen, isAuthenticated]);

  const loadCancellationsHistory = async (page?: number, filters?: {
    reason?: 'will_no_longer_be_used' | 'wrong_data';
    refund_status?: 'pending' | 'done' | 'not_refundable';
    label_token?: string;
  }) => {
    try {
      await getCancellationsHistory({ 
        page,
        ...filters
      });
    } catch (err) {
      console.error("Error loading cancellations history:", err);
    }
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      await login();
      await loadCancellationsHistory();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al conectar con Manuable';
      setLoginError(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    loadCancellationsHistory(newPage, {
      reason: reasonFilter as any,
      refund_status: refundStatusFilter as any,
      label_token: trackingNumberFilter
    });
  };

  const handleApplyFilters = () => {
    loadCancellationsHistory(1, {
      reason: reasonFilter as any,
      refund_status: refundStatusFilter as any,
      label_token: trackingNumberFilter
    });
  };

  const handleClearFilters = () => {
    setReasonFilter('');
    setRefundStatusFilter('');
    setTrackingNumberFilter('');
    loadCancellationsHistory(1);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getReasonBadgeClass = (reason: string) => {
    switch(reason) {
      case 'will_no_longer_be_used':
        return 'bg-blue-100 text-blue-800';
      case 'wrong_data':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonText = (reason: string) => {
    switch(reason) {
      case 'will_no_longer_be_used':
        return 'Ya no se usará';
      case 'wrong_data':
        return 'Datos incorrectos';
      default:
        return reason;
    }
  };

  const getRefundStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_refundable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRefundStatusText = (status: string) => {
    switch(status) {
      case 'done':
        return 'Reembolsado';
      case 'pending':
        return 'Pendiente';
      case 'not_refundable':
        return 'No reembolsable';
      default:
        return status;
    }
  };

  const cancellationsData = cancellationsHistory?.data || [];

  return (
    <CSSTransition
      in={isOpen}
      timeout={300}
      classNames="modal"
      unmountOnExit
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-opacity-75" onClick={onClose}></div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div 
            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white">
              <h3 className="text-lg font-medium">Historial de Cancelaciones - Manuable</h3>
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
                    {loginLoading ? 'Conectando con Manuable...' : 'Cargando historial de cancelaciones...'}
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
                      Este es el historial de todas las guías que han sido canceladas en tu cuenta de Manuable. 
                      Puedes ver el motivo de cancelación, estado del reembolso y información adicional.
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="mb-4">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                    >
                      <Filter className="w-4 h-4" />
                      {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                    </button>

                    {showFilters && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Motivo de cancelación
                            </label>
                            <select
                              value={reasonFilter}
                              onChange={(e) => setReasonFilter(e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Todos los motivos</option>
                              <option value="will_no_longer_be_used">Ya no se usará</option>
                              <option value="wrong_data">Datos incorrectos</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Estado del reembolso
                            </label>
                            <select
                              value={refundStatusFilter}
                              onChange={(e) => setRefundStatusFilter(e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Todos los estados</option>
                              <option value="done">Reembolsado</option>
                              <option value="pending">Pendiente</option>
                              <option value="not_refundable">No reembolsable</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Número de seguimiento
                            </label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <input
                                type="text"
                                value={trackingNumberFilter}
                                onChange={(e) => setTrackingNumberFilter(e.target.value)}
                                placeholder="Buscar por tracking..."
                                className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={handleApplyFilters}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
                          >
                            Aplicar filtros
                          </button>
                          <button
                            onClick={handleClearFilters}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200 text-sm"
                          >
                            Limpiar filtros
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cancellations table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Número de seguimiento
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Token de guía
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Motivo
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado del reembolso
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usado después
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Información adicional
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cancellationsData.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              No se encontraron cancelaciones
                            </td>
                          </tr>
                        ) : (
                          cancellationsData.map((cancellation, index) => (
                            <tr key={cancellation.token || `cancellation-${index}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {cancellation.tracking_number || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                {cancellation.label_token ? (
                                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                    {cancellation.label_token.substring(0, 20)}...
                                  </span>
                                ) : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getReasonBadgeClass(cancellation.reason)}`}>
                                  {getReasonText(cancellation.reason)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRefundStatusBadgeClass(cancellation.refund_status)}`}>
                                  {getRefundStatusText(cancellation.refund_status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  cancellation.used_after_cancellation 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {cancellation.used_after_cancellation ? 'Sí' : 'No'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                                <div className="truncate" title={cancellation.additional_info}>
                                  {cancellation.additional_info || 'Sin información adicional'}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {(cancellationsHistory as any)?.pagination && (cancellationsHistory as any).pagination.total_pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                      <div className="flex justify-between flex-1 sm:hidden">
                        <button
                          onClick={() => handlePageChange(Math.max(1, cancellationsPage - 1))}
                          disabled={cancellationsPage <= 1}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                            cancellationsPage <= 1
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              : 'text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => handlePageChange(cancellationsPage + 1)}
                          disabled={(cancellationsHistory as any).pagination && cancellationsPage >= (cancellationsHistory as any).pagination.total_pages}
                          className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium rounded-md ${
                            (cancellationsHistory as any).pagination && cancellationsPage >= (cancellationsHistory as any).pagination.total_pages
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
                            <span className="font-medium">página {cancellationsPage}</span>{' '}
                            de{' '}
                            <span className="font-medium">{(cancellationsHistory as any).pagination?.total_pages || 1}</span>{' '}
                            páginas
                          </p>
                        </div>
                        <div>
                          <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => handlePageChange(Math.max(1, cancellationsPage - 1))}
                              disabled={cancellationsPage <= 1}
                              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                cancellationsPage <= 1
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              <span className="sr-only">Anterior</span>
                              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                            </button>
                            
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-700">
                              {cancellationsPage}
                            </span>
                            
                            <button
                              onClick={() => handlePageChange(cancellationsPage + 1)}
                              disabled={(cancellationsHistory as any).pagination && cancellationsPage >= (cancellationsHistory as any).pagination.total_pages}
                              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                (cancellationsHistory as any).pagination && cancellationsPage >= (cancellationsHistory as any).pagination.total_pages
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
                onClick={() => loadCancellationsHistory(1)}
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