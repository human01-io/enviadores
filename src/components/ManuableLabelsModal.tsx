import React, { useEffect, useState } from 'react';
import { X, Search, ChevronLeft, ChevronRight, RefreshCw, Eye, Download, Trash2 } from 'lucide-react';
import { useManuable } from '../hooks/useManuable';
import { CSSTransition } from 'react-transition-group';

import { DateTime } from 'luxon';

interface ManuableLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManuableLabelsModal: React.FC<ManuableLabelsModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    isLoading,
    error,
    labelsList,
    labelsPage,
    getLabels,
    isAuthenticated,
    login,
    cancelLabels
  } = useManuable();

  const [searchQuery, setSearchQuery] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [labelToCancel, setLabelToCancel] = useState<string | null>(null);
  const [cancelComments, setCancelComments] = useState('');
  const [cancellationReason, setCancellationReason] = useState<'wrong_data' | 'will_no_longer_be_used'>('wrong_data');
  const [isViewingLabel, setIsViewingLabel] = useState(false);
  const [currentLabelUrl, setCurrentLabelUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated) {
        loadLabels();
      } else {
        handleLogin();
      }
    }
  }, [isOpen, isAuthenticated]);

  const loadLabels = async (page?: number, tracking_number?: string) => {
    try {
      await getLabels({
        page: page || 1, // Default to page 1 if not specified
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
  if (newPage < 1) return;
  loadLabels(newPage, searchQuery || undefined);
};

  const handleCancelLabel = async () => {
    if (!labelToCancel) return;

    try {
      await cancelLabels(
        [labelToCancel],
        cancellationReason,
        cancelComments || "Cancelación solicitada por el usuario"
      );
      await loadLabels(labelsPage, searchQuery || undefined);
      setLabelToCancel(null);
      setCancelComments('');
    } catch (err) {
      console.error("Error cancelling label:", err);
    }
  };
  
  const formatToGMT6 = (dateString: string) => {
  try {
    // Create a Date object from the ISO string
    const date = new Date(dateString);

    date.setHours(date.getHours() - 6);
    
    // Get the time in GMT-6 (Central Time)
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Mexico_City', // This handles GMT-6 with daylight savings
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Use 24-hour format
    };
    
    return new Intl.DateTimeFormat('es-MX', options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original if conversion fails
  }
};



const formatDate = (dateString: string) => {
  try {
    return DateTime.fromISO(dateString)
      .setZone('America/Mexico_City')
      .minus({ hours: 6}) // GMT-6 adjustment
      .toFormat('dd-MM-yyyy HH:mm', { locale: 'es-MX' });
  } catch (error) {
    return dateString;
  }

};

  const viewLabel = (url: string) => {
    // Use Google Docs as a universal PDF viewer
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    setCurrentLabelUrl(viewerUrl);
    setIsViewingLabel(true);
  };

  const downloadLabel = async (url: string, tracking: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `guia-${tracking}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading label:', error);
      viewLabel(url);
    }
  };


  return (
    <CSSTransition
      in={isOpen}
      timeout={300}
      classNames="modal"
      unmountOnExit
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
        {/* Main Modal Container */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white sticky top-0 z-10">
              <h3 className="text-lg font-medium">Guías de Envío Manuable</h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="px-6 py-4 flex-1 overflow-auto">
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
                  {/* Search Bar */}
                  <form onSubmit={handleSearch} className="mb-4 sticky top-0 bg-white pt-2 z-10">
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

                  {/* Scrollable Table Container */}
                  <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                            Número de Guía
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50">
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
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
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white">
                                <button
                                  onClick={() => viewLabel(label.label_url)}
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                  title="Ver guía"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => downloadLabel(label.label_url, label.tracking_number)}
                                  className="text-green-600 hover:text-green-900 mr-4"
                                  title="Descargar guía"
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => setLabelToCancel(label.token)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Cancelar guía"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls 
{labelsList.data.length > 0 && (
  <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 mt-4">
    <div className="flex items-center justify-between">
  <div className="text-sm text-gray-700">
    Página {labelsPage}
  </div>
  <div className="flex space-x-2">
    <button
      onClick={() => handlePageChange(labelsPage - 1)}
      disabled={labelsPage <= 1}
      className={`px-3 py-1 rounded-md ${
        labelsPage <= 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
    <button
      onClick={() => handlePageChange(labelsPage + 1)}
      disabled={labelsList.data.length < 30}
      className={`px-3 py-1 rounded-md ${
        labelsList.data.length < 30 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <ChevronRight className="w-5 h-5" />
    </button>
  </div>
</div>
  </div>
)} */}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t flex justify-between sticky bottom-0">
              <span className="text-sm text-gray-500">
                Mostrando {labelsList.data.length} guías
              </span>
              <div>
                <button
                  onClick={() => loadLabels(1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2"
                >
                  <RefreshCw className="inline mr-1 w-4 h-4" />
                  Actualizar
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Viewer Modal */}
        {isViewingLabel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-medium">Vista previa de guía</h3>
                <button onClick={() => setIsViewingLabel(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1">
                <iframe
                  src={currentLabelUrl.includes('google.com/viewer')
                    ? currentLabelUrl
                    : `https://docs.google.com/viewer?url=${encodeURIComponent(currentLabelUrl)}&embedded=true`}
                  className="w-full h-full min-h-[70vh]"
                  frameBorder="0"
                />
              </div>
              <div className="p-4 border-t flex justify-end">
                <button
                  onClick={() => {
                    const tracking = labelsList.data.find(l => l.label_url === currentLabelUrl)?.tracking_number || 'guia';
                    downloadLabel(currentLabelUrl, tracking);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  <Download className="inline mr-2 w-4 h-4" />
                  Descargar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Modal */}
        {labelToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Cancelar guía</h3>
                <button
                  onClick={() => setLabelToCancel(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo de cancelación
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="cancellationReason"
                        value="wrong_data"
                        checked={cancellationReason === 'wrong_data'}
                        onChange={() => setCancellationReason('wrong_data')}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Datos incorrectos</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="cancellationReason"
                        value="will_no_longer_be_used"
                        checked={cancellationReason === 'will_no_longer_be_used'}
                        onChange={() => setCancellationReason('will_no_longer_be_used')}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">No se usará</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {cancellationReason === 'wrong_data'
                      ? "Especifique los datos incorrectos"
                      : "Razón (opcional)"}
                  </label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows={3}
                    value={cancelComments}
                    onChange={(e) => setCancelComments(e.target.value)}
                    required={cancellationReason === 'wrong_data'}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setLabelToCancel(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCancelLabel}
                  disabled={cancellationReason === 'wrong_data' && !cancelComments}
                  className={`px-4 py-2 text-white rounded-md ${cancellationReason === 'wrong_data' && !cancelComments
                      ? 'bg-red-300 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  Confirmar cancelación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CSSTransition>
  );
};