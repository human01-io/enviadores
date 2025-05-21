import React, { useEffect, useState } from 'react';
import { X, Search, ChevronLeft, ChevronRight, RefreshCw, ExternalLink, Download } from 'lucide-react';
import { useManuable } from '../hooks/useManuable';
import { CSSTransition } from 'react-transition-group';

interface ManuableLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManuableLabelsModal: React.FC<ManuableLabelsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isLoading, error, labelsList, labelsPage, getLabels, isAuthenticated, login } = useManuable();
  const [searchQuery, setSearchQuery] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated) {
        // If already authenticated, get the labels
        loadLabels();
      } else {
        // If not authenticated, try to login first
        handleLogin();
      }
    }
  }, [isOpen, isAuthenticated]);

  const loadLabels = async (page?: number, tracking_number?: string) => {
    try {
      await getLabels({
        page,
        tracking_number: tracking_number || undefined
      });
    } catch (err) {
      console.error("Error loading labels:", err);
    }
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      await login();
      // After successful login, get the labels
      await loadLabels();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al conectar con Manuable';
      setLoginError(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadLabels(1, searchQuery);
  };

  const handlePageChange = (newPage: number) => {
    loadLabels(newPage, searchQuery || undefined);
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

  // Function to open label in new tab
  const openLabel = (url: string) => {
    window.open(url, '_blank');
  };

  // Function to download label
  const downloadLabel = async (url: string, tracking: string) => {
    try {
      // Create a direct download
      const link = document.createElement('a');
      link.href = url;
      link.download = `guia-${tracking}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading label:', error);
      // Fallback to opening in a new tab
      window.open(url, '_blank');
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
            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white">
              <h3 className="text-lg font-medium">Guías de Envío Manuable</h3>
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
                    {loginLoading ? 'Conectando con Manuable...' : 'Cargando guías...'}
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
                  {/* Search bar */}
                  <form onSubmit={handleSearch} className="mb-4">
                    <div className="flex w-full">
                      <div className="relative flex-grow">
                        <input
                          type="text"
                          className="w-full p-2 pr-10 border rounded-l"
                          placeholder="Buscar por número de guía..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <Search className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 text-white bg-blue-600 rounded-r hover:bg-blue-700"
                      >
                        Buscar
                      </button>
                    </div>
                  </form>

                  {/* Labels table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Número de Guía
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {labelsList.data.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                              No se encontraron guías
                            </td>
                          </tr>
                        ) : (
                          labelsList.data.map((label) => (
                            <tr key={label.token} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {label.tracking_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(label.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Intl.NumberFormat('es-MX', {
                                  style: 'currency',
                                  currency: 'MXN'
                                }).format(parseFloat(label.price))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => openLabel(label.label_url)}
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                  title="Ver guía"
                                >
                                  <ExternalLink className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => downloadLabel(label.label_url, label.tracking_number)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Descargar guía"
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {labelsList.meta && labelsList.meta.total_pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                      <div className="flex justify-between flex-1 sm:hidden">
                        <button
                          onClick={() => handlePageChange(Math.max(1, labelsPage - 1))}
                          disabled={labelsPage <= 1}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                            labelsPage <= 1
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              : 'text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => handlePageChange(labelsPage + 1)}
                          disabled={labelsList.meta && labelsPage >= labelsList.meta.total_pages}
                          className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium rounded-md ${
                            labelsList.meta && labelsPage >= labelsList.meta.total_pages
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
                            <span className="font-medium">página {labelsPage}</span>{' '}
                            de{' '}
                            <span className="font-medium">{labelsList.meta?.total_pages || 1}</span>{' '}
                            páginas
                          </p>
                        </div>
                        <div>
                          <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => handlePageChange(Math.max(1, labelsPage - 1))}
                              disabled={labelsPage <= 1}
                              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                labelsPage <= 1
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
                              {labelsPage}
                            </span>
                            
                            <button
                              onClick={() => handlePageChange(labelsPage + 1)}
                              disabled={labelsList.meta && labelsPage >= labelsList.meta.total_pages}
                              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                labelsList.meta && labelsPage >= labelsList.meta.total_pages
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
                onClick={() => loadLabels(1)}
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