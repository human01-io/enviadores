import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Destino, Envio } from '../types';
import { DestinoModal } from './DestinoModal'; // You'll need to create this component

type FilterField = keyof Destino;

interface FilterState {
  field: FilterField;
  value: string;
}

interface LastShipmentModalProps {
  destino: Destino;
  onClose: () => void;
  shipments: Envio[];
  loading: boolean;
}

// Last Shipment Modal Component
const LastShipmentModal: React.FC<LastShipmentModalProps> = ({ destino, onClose, shipments, loading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Últimos Envíos para {destino.nombre_destinatario}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {shipments.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No hay envíos registrados para este destino</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {shipments.map((shipment) => (
                        <tr key={shipment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {shipment.id}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(shipment.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {shipment.servicio_id}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              shipment.estatus === 'entregado' 
                                ? 'bg-green-100 text-green-800' 
                                : shipment.estatus === 'transito'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {shipment.estatus === 'entregado' 
                                ? 'Entregado' 
                                : shipment.estatus === 'transito'
                                ? 'En tránsito'
                                : 'Pendiente'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            ${shipment.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => window.open(`/shipments/${shipment.id}`, '_blank')}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver Detalles"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end gap-4 pt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
interface DeleteConfirmationProps {
  destino: Destino;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ destino, onCancel, onConfirm, isDeleting }) => {
  const [confirmText, setConfirmText] = useState('');
  const confirmationPhrase = `eliminar ${destino.id}`;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-bold">Eliminar Destino</h2>
          </div>
          
          <p className="mb-4 text-gray-700">
            Estás a punto de eliminar el destino <span className="font-semibold">{destino.nombre_destinatario}</span>. 
            Esta acción no se puede deshacer.
          </p>
          
          <p className="mb-4 text-gray-700">
            Para confirmar, escribe <span className="font-mono bg-gray-100 p-1 rounded">{confirmationPhrase}</span> a continuación:
          </p>
          
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={confirmationPhrase}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          />
          
          <div className="flex justify-end gap-4 pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={confirmText !== confirmationPhrase || isDeleting}
              className={`px-4 py-2 rounded-md ${
                confirmText !== confirmationPhrase 
                  ? 'bg-red-300 text-red-700 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              } flex items-center`}
            >
              {isDeleting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Eliminar Destino
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Destinos() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(true);
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedDestino, setSelectedDestino] = useState<Destino | null>(null);
  const [filters, setFilters] = useState<FilterState[]>([{ field: 'nombre_destinatario', value: '' }]);
  const [searchMode, setSearchMode] = useState<'all' | 'any'>('all');
  const [clienteFilter, setClienteFilter] = useState('');
  
  // State for modals
  const [isDestinoModalOpen, setIsDestinoModalOpen] = useState(false);
  const [isLastShipmentModalOpen, setIsLastShipmentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [lastShipments, setLastShipments] = useState<Envio[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter field options for the dropdown
  const filterFields: { value: FilterField; label: string }[] = [
    { value: 'id', label: 'ID' },
    { value: 'cliente_id', label: 'ID Cliente' },
    { value: 'nombre_destinatario', label: 'Nombre Destinatario' },
    { value: 'alias', label: 'Alias' },
    { value: 'direccion', label: 'Dirección' },
    { value: 'colonia', label: 'Colonia' },
    { value: 'ciudad', label: 'Ciudad' },
    { value: 'estado', label: 'Estado' },
    { value: 'codigo_postal', label: 'Código Postal' },
    { value: 'telefono', label: 'Teléfono' },
    { value: 'email', label: 'Email' }
  ];

  const stickyColumnStyles = `
/* Container styling to properly handle sticky columns */
.table-container {
  position: relative;
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
}

/* Make the table columns properly sized */
.sticky-table {
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

/* Styling for the sticky destinatario column */
.sticky-destinatario {
  position: sticky;
  left: 0;
  z-index: 2; /* Above most content but below sticky actions */
  background-color: white; /* Prevents content from showing through */
  /* Add shadow to indicate stickiness */
  box-shadow: 2px 0 5px -2px rgba(0,0,0,0.1);
}

/* Styling for the sticky actions column */
.sticky-actions {
  position: sticky;
  right: 0;
  z-index: 3; /* Above all other content */
  background-color: white;
  /* Add shadow to indicate stickiness */
  box-shadow: -2px 0 5px -2px rgba(0,0,0,0.1);
}

/* For the header cells in the sticky columns */
.sticky-header {
  background-color: #f9fafb; /* Matches the thead background color */
}

/* Hover state for sticky columns */
tr:hover .sticky-destinatario,
tr:hover .sticky-actions {
  background-color: #f9fafb; /* Match your hover background color */
}
`;

  useEffect(() => {
    if (!isAuthenticated) return;
  
    const fetchDestinos = async () => {
      try {
        setLoading(true);
        setError('');
        
        // This would need to be implemented in the apiService
        const response = await apiService.getDestinations(currentPage, itemsPerPage, clienteFilter);
        setDestinos(response.data);
        setTotalItems(response.total);
      } catch (error) {
        console.error('Error fetching destinations:', error);
        setError('Error al cargar destinos');
      } finally {
        setLoading(false);
      }
    };
  
    fetchDestinos();
  }, [isAuthenticated, currentPage, itemsPerPage, clienteFilter]);

  const filteredDestinos = destinos;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (destino: Destino) => {
    setSelectedDestino(destino);
  };

  const handleCloseDetails = () => {
    setSelectedDestino(null);
  };

  const handleViewLastShipments = async (destino: Destino) => {
    try {
      setLoadingShipments(true);
      setSelectedDestino(destino);
      setIsLastShipmentModalOpen(true);
      
      // This would need to be implemented in the apiService
      const shipments = await apiService.getShipmentsByDestination(destino.id);
      setLastShipments(shipments);
    } catch (error) {
      setError('Error al cargar los envíos');
      console.error('Error fetching shipments:', error);
    } finally {
      setLoadingShipments(false);
    }
  };

  const handleOpenDeleteModal = (destino: Destino) => {
    setSelectedDestino(destino);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteDestino = async () => {
    if (!selectedDestino) return;
    
    try {
      setIsDeleting(true);
      
      // This would need to be implemented in the apiService
      await apiService.deleteDestination(selectedDestino.id);
      
      // Update the local state after successful deletion
      setDestinos(prev => prev.filter(d => d.id !== selectedDestino.id));
      setTotalItems(prev => prev - 1);
      
      // Close the modal
      setIsDeleteModalOpen(false);
      setSelectedDestino(null);
      
      // Show success message
      // You could implement a toast notification system here
    } catch (error) {
      setError('Error al eliminar el destino');
      console.error('Error deleting destination:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilterChange = (index: number, field: FilterField | null, value?: string) => {
    const newFilters = [...filters];
    
    if (field === null) {
      // Remove this filter
      newFilters.splice(index, 1);
    } else {
      // Update existing filter
      newFilters[index] = { 
        field: field, 
        value: value !== undefined ? value : newFilters[index].value 
      };
    }
    
    setFilters(newFilters);
  };

  const handleAddFilter = () => {
    setFilters([...filters, { field: 'nombre_destinatario', value: '' }]);
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');
      
      // If no filters are active and no cliente filter, just load the regular paginated data
      if (!filters.some(f => f.value.trim() !== '') && !clienteFilter) {
        const response = await apiService.getDestinations(1, itemsPerPage);
        setDestinos(response.data);
        setTotalItems(response.total);
        setCurrentPage(1);
        return;
      }
  
      // Convert filter array to an object for the API
      const searchParams: Record<string, string> = {};
      filters.forEach(filter => {
        if (filter.value.trim()) {
          searchParams[filter.field] = filter.value;
        }
      });
      
      // Add cliente_id filter if present
      if (clienteFilter) {
        searchParams.cliente_id = clienteFilter;
      }
      
      // This would need to be implemented in the apiService
      const results = await apiService.advancedSearchDestinations(searchParams, searchMode);
      
      setDestinos(results.data);
      setTotalItems(results.total);
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error('Search error:', error);
      setError('Error al buscar destinos');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters([{ field: 'nombre_destinatario', value: '' }]);
    setClienteFilter('');
  };

  // Handler for when a destination is saved in the modal
  const handleDestinoSaved = (savedDestino: Destino) => {
    // Refresh the destinos list after saving
    if (filters.some(f => f.value.trim() !== '') || clienteFilter) {
      // If we have filters, just add the new destino to the list without refreshing
      setDestinos(prev => {
        const existingDestinoIndex = prev.findIndex(d => d.id === savedDestino.id);
        if (existingDestinoIndex >= 0) {
          // Update existing destino
          const newDestinos = [...prev];
          newDestinos[existingDestinoIndex] = savedDestino;
          return newDestinos;
        } else {
          // Add new destino
          return [savedDestino, ...prev];
        }
      });
    } else {
      // If no filters, refresh the list to get the new destino
      apiService.getDestinations(currentPage, itemsPerPage).then(response => {
        setDestinos(response.data);
        setTotalItems(response.total);
      }).catch(error => {
        console.error('Error refreshing destinations:', error);
      });
    }
    
    // Close the modal
    setIsDestinoModalOpen(false);
  };

  if (!isAuthenticated) return null;

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Administración de Destinos</h1>
        </div>
      </header>

      <main className="p-3 py-6 max-w-screen-2xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-2">
            <button 
              onClick={() => setIsDestinoModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Nuevo Destino
            </button>
          </div>
        </div>

        {/* Advanced Filtering */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium mb-4">Filtros Avanzados</h2>
          
          {/* Cliente Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Cliente (ID)
            </label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={clienteFilter}
                onChange={(e) => setClienteFilter(e.target.value)}
                placeholder="ID del Cliente (ej. C00001)"
                className="border rounded px-3 py-2 flex-1"
              />
              <button 
                onClick={() => setClienteFilter('')}
                className="px-2 py-1 text-gray-500 hover:text-gray-700"
                title="Limpiar filtro de cliente"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {filters.map((filter, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <select 
                  value={filter.field}
                  onChange={(e) => handleFilterChange(index, e.target.value as FilterField)}
                  className="border rounded px-3 py-2"
                >
                  {filterFields.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                <input 
                  type="text"
                  value={filter.value}
                  onChange={(e) => handleFilterChange(index, filter.field, e.target.value)}
                  placeholder={`Valor para ${filterFields.find(f => f.value === filter.field)?.label}`}
                  className="border rounded px-3 py-2 flex-1"
                />
                
                {filters.length > 1 && (
                  <button 
                    onClick={() => handleFilterChange(index, null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Modo de búsqueda:</span>
              <select 
                value={searchMode}
                onChange={(e) => setSearchMode(e.target.value as 'all' | 'any')}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">Cumplir con todos los criterios</option>
                <option value="any">Cumplir con al menos un criterio</option>
              </select>
            </div>
            
            <div className="flex gap-2 ml-auto">
              <button 
                onClick={handleAddFilter}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
              >
                + Agregar Filtro
              </button>
              <button 
                onClick={handleClearFilters}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
              >
                Limpiar Filtros
              </button>
              <button 
                onClick={handleSearch}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <style>{stickyColumnStyles}</style>
            <div className="table-container">
            <table className="sticky-table min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente ID</th>
          <th className="sticky-destinatario sticky-header px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinatario</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alias</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ciudad</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
          <th className="sticky-actions sticky-header px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
        </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDestinos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        No se encontraron destinos con los criterios de búsqueda
                      </td>
                    </tr>
                  ) : (
                    filteredDestinos.map((destino) => (
                      <tr key={destino.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {destino.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span 
                            className="cursor-pointer text-blue-600 hover:text-blue-800"
                            onClick={() => {
                              setClienteFilter(destino.cliente_id);
                              handleSearch();
                            }}
                            title="Filtrar por este cliente"
                          >
                            {destino.cliente_id}
                          </span>
                        </td>
                        <td className="sticky-destinatario px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {destino.nombre_destinatario}
                          </div>
                          {destino.email && (
                            <div className="text-sm text-gray-500">{destino.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {destino.alias || 'Sin alias'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 truncate max-w-xs">
                            {destino.direccion}, {destino.colonia}
                          </div>
                          <div className="text-sm text-gray-500">
                            CP {destino.codigo_postal}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {destino.ciudad}, {destino.estado}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {destino.telefono}
                        </td>
                        <td className="sticky-actions px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleViewDetails(destino)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver Detalles"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleViewLastShipments(destino)}
                              className="text-green-600 hover:text-green-900"
                              title="Ver Últimos Envíos"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDestino(destino);
                                setIsDestinoModalOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Editar Destino"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(destino)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar Destino"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de{' '}
                    <span className="font-medium">{totalItems}</span> destinos
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Primera</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Última</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Destino Details Modal */}
        {selectedDestino && !isLastShipmentModalOpen && !isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    Detalles del Destino
                  </h2>
                  <button
                    onClick={handleCloseDetails}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Información Básica</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">ID:</span> {selectedDestino.id}</p>
                      <p><span className="font-medium">Cliente ID:</span> {selectedDestino.cliente_id}</p>
                      <p><span className="font-medium">Nombre:</span> {selectedDestino.nombre_destinatario}</p>
                      <p><span className="font-medium">Alias:</span> {selectedDestino.alias || 'N/A'}</p>
                      <p><span className="font-medium">Teléfono:</span> {selectedDestino.telefono}</p>
                      <p><span className="font-medium">Email:</span> {selectedDestino.email || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Dirección</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Dirección:</span> {selectedDestino.direccion}</p>
                      <p><span className="font-medium">Colonia:</span> {selectedDestino.colonia}</p>
                      <p><span className="font-medium">Ciudad:</span> {selectedDestino.ciudad}</p>
                      <p><span className="font-medium">Estado:</span> {selectedDestino.estado}</p>
                      <p><span className="font-medium">Código Postal:</span> {selectedDestino.codigo_postal}</p>
                      <p><span className="font-medium">País:</span> {selectedDestino.pais || 'México'}</p>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="font-medium text-gray-700 mb-2">Información Adicional</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Referencia:</span> {selectedDestino.referencia || 'N/A'}</p>
                      <p><span className="font-medium">Instrucciones de Entrega:</span> {selectedDestino.instrucciones_entrega || 'N/A'}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-5">
                      Creado: {selectedDestino.created_at ? new Date(selectedDestino.created_at).toLocaleString() : 'N/A'}
                      <br />
                      Última actualización: {selectedDestino.updated_at ? new Date(selectedDestino.updated_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <button
                    onClick={() => handleViewLastShipments(selectedDestino)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Ver Envíos
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDestino(null);
                      setIsDestinoModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(selectedDestino)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={handleCloseDetails}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last Shipment Modal */}
        {isLastShipmentModalOpen && selectedDestino && (
          <LastShipmentModal 
            destino={selectedDestino} 
            onClose={() => {
              setIsLastShipmentModalOpen(false);
              setLastShipments([]);
            }} 
            shipments={lastShipments} 
            loading={loadingShipments} 
          />
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && selectedDestino && (
          <DeleteConfirmation 
            destino={selectedDestino} 
            onCancel={() => {
              setIsDeleteModalOpen(false);
              setSelectedDestino(null);
            }}
            onConfirm={handleDeleteDestino}
            isDeleting={isDeleting}
          />
        )}

        {/* Destino Modal */}
        <DestinoModal 
          isOpen={isDestinoModalOpen} 
          onClose={() => setIsDestinoModalOpen(false)} 
          onDestinoSaved={handleDestinoSaved}
          initialDestino={selectedDestino} // Pass the selected destination for editing
        />
      </main>
    </div>
  );
}