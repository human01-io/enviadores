import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Envio } from '../types';
import { Menu } from '@headlessui/react';

type FilterField = keyof Envio;

interface FilterState {
  field: FilterField;
  value: string;
}

interface EnvioWithDetails extends Envio {
  cliente_nombre: string;
  nombre_destinatario: string;
  username?: string;
}

// Last Shipment Details Modal Component
interface ShipmentDetailsModalProps {
  envio: EnvioWithDetails;
  onClose: () => void;
}

const ShipmentDetailsModal: React.FC<ShipmentDetailsModalProps> = ({ envio, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Detalles del Envío {envio.id}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Información General</h3>
              <div className="space-y-2">
                <p><span className="font-medium">ID:</span> {envio.id}</p>
                <p><span className="font-medium">Cliente:</span> {envio.cliente_nombre}</p>
                <p><span className="font-medium">Destinatario:</span> {envio.nombre_destinatario}</p>
                <p><span className="font-medium">Servicio:</span> {envio.servicio_id}</p>
                <p>
                  <span className="font-medium">Estatus:</span>{' '}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    envio.estatus === 'entregado' 
                      ? 'bg-green-100 text-green-800' 
                      : envio.estatus === 'transito'
                      ? 'bg-blue-100 text-blue-800'
                      : envio.estatus === 'preparacion'
                      ? 'bg-yellow-100 text-yellow-800'
                      : envio.estatus === 'incidencia'
                      ? 'bg-red-100 text-red-800'
                      : envio.estatus === 'cancelado'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                  >
                    {envio.estatus === 'entregado' 
                      ? 'Entregado' 
                      : envio.estatus === 'transito'
                      ? 'En Tránsito'
                      : envio.estatus === 'preparacion'
                      ? 'En Preparación'
                      : envio.estatus === 'incidencia'
                      ? 'Incidencia'
                      : envio.estatus === 'cancelado'
                      ? 'Cancelado'
                      : 'Cotizado'}
                  </span>
                </p>
                <p><span className="font-medium">Guía:</span> {envio.guia || 'N/A'}</p>
                <p><span className="font-medium">Fecha de creación:</span> {new Date(envio.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">Información de Envío</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Tipo de Paquete:</span> {envio.tipo_paquete === 'sobre' ? 'Sobre' : 'Paquete'}</p>
                <p><span className="font-medium">Peso Real:</span> {envio.peso_real} kg</p>
                <p><span className="font-medium">Peso Volumétrico:</span> {envio.peso_volumetrico} kg</p>
                <p><span className="font-medium">Peso Facturable:</span> {envio.peso_facturable} kg</p>
                {envio.requiere_recoleccion && (
                  <p><span className="font-medium">Requiere Recolección:</span> Sí</p>
                )}
                {envio.fecha_recoleccion && (
                  <p><span className="font-medium">Fecha de Recolección:</span> {new Date(envio.fecha_recoleccion).toLocaleString()}</p>
                )}
                {envio.fecha_entrega_estimada && (
                  <p><span className="font-medium">Entrega Estimada:</span> {new Date(envio.fecha_entrega_estimada).toLocaleDateString()}</p>
                )}
                {envio.fecha_entrega_real && (
                  <p><span className="font-medium">Entrega Real:</span> {new Date(envio.fecha_entrega_real).toLocaleString()}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">Información de Costos</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Costo de Envío:</span> ${envio.costo_envio}</p>
                <p><span className="font-medium">IVA:</span> ${envio.iva}</p>
                <p><span className="font-medium">Total:</span> ${envio.total}</p>
                {envio.valor_declarado > 0 && (
                  <>
                    <p><span className="font-medium">Valor Declarado:</span> ${envio.valor_declarado}</p>
                    <p><span className="font-medium">Costo de Seguro:</span> ${envio.costo_seguro}</p>
                  </>
                )}
                {envio.costo_neto > 0 && (
                  <p><span className="font-medium">Costo Neto:</span> ${envio.costo_neto}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">Información Adicional</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Método de Creación:</span> {
                  envio.metodo_creacion === 'interno' 
                    ? 'Interno' 
                    : envio.metodo_creacion === 'externo'
                    ? 'Externo'
                    : 'Manuable'
                }</p>
                {(envio.metodo_creacion === 'externo' || envio.paqueteria_externa) && (
                  <>
                    <p><span className="font-medium">Paquetería Externa:</span> {envio.paqueteria_externa}</p>
                    <p><span className="font-medium">Número de Guía Externa:</span> {envio.numero_guia_externa}</p>
                  </>
                )}
                {envio.metodo_creacion === 'manuable' && (
                  <>
                    <p><span className="font-medium">UUID Manuable:</span> {envio.uuid_manuable}</p>
                    <p><span className="font-medium">Servicio Manuable:</span> {envio.servicio_manuable}</p>
                  </>
                )}
                {envio.incidencia && (
                  <p><span className="font-medium">Incidencia:</span> {envio.incidencia}</p>
                )}
                {envio.notas && (
                  <p><span className="font-medium">Notas:</span> {envio.notas}</p>
                )}
                <p><span className="font-medium">Creado por:</span> {envio.username || 'Usuario ' + envio.created_by}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            {envio.ruta_etiqueta && (
              <button
                onClick={() => window.open(`/api/uploads/labels/${envio.ruta_etiqueta}`, '_blank')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Ver/Imprimir Etiqueta
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ship Again Modal Component
interface ShipAgainModalProps {
  envio: EnvioWithDetails;
  onClose: () => void;
  onConfirm: () => void;
}

const ShipAgainModal: React.FC<ShipAgainModalProps> = ({ envio, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <h2 className="text-xl font-bold">Reenviar Paquete</h2>
          </div>
          
          <p className="mb-4 text-gray-700">
            Estás a punto de crear un nuevo envío con los mismos datos del envío <span className="font-semibold">{envio.id}</span>. 
            Se creará un nuevo envío con la misma dirección y características.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Cliente:</span> {envio.cliente_nombre}<br />
              <span className="font-medium">Destinatario:</span> {envio.nombre_destinatario}<br />
              <span className="font-medium">Servicio:</span> {envio.servicio_id}<br />
              <span className="font-medium">Peso:</span> {envio.peso_real} kg<br />
            </p>
          </div>
          
          <div className="flex justify-end gap-4 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              Crear Nuevo Envío
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Envios() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(true);
  const [envios, setEnvios] = useState<EnvioWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<FilterState[]>([{ field: 'id', value: '' }]);
  const [searchMode, setSearchMode] = useState<'all' | 'any'>('all');
  const [clienteFilter, setClienteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' });
  
  // Sort state
  const [sortField, setSortField] = useState<FilterField>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // State for modals
  const [selectedEnvio, setSelectedEnvio] = useState<EnvioWithDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isShipAgainModalOpen, setIsShipAgainModalOpen] = useState(false);
  
  // Filter field options for the dropdown
  const filterFields: { value: FilterField; label: string }[] = [
    { value: 'id', label: 'ID Envío' },
    { value: 'cliente_id', label: 'ID Cliente' },
    { value: 'destino_id', label: 'ID Destino' },
    { value: 'servicio_id', label: 'Servicio' },
    { value: 'guia', label: 'Número de Guía' },
    { value: 'estatus', label: 'Estatus' },
    { value: 'paqueteria_externa', label: 'Paquetería Externa' },
    { value: 'numero_guia_externa', label: 'Guía Externa' },
    { value: 'tipo_paquete', label: 'Tipo de Paquete' },
    { value: 'created_by', label: 'Creado por' }
  ];
  
  // Status options for filter dropdown
  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'cotizado', label: 'Cotizado' },
    { value: 'preparacion', label: 'En Preparación' },
    { value: 'transito', label: 'En Tránsito' },
    { value: 'entregado', label: 'Entregado' },
    { value: 'incidencia', label: 'Incidencia' },
    { value: 'cancelado', label: 'Cancelado' }
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

/* Styling for the sticky ID column */
.sticky-id {
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
tr:hover .sticky-id,
tr:hover .sticky-actions {
  background-color: #f9fafb; /* Match your hover background color */
}
`;

  useEffect(() => {
    if (!isAuthenticated) return;
  
    const fetchEnvios = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await apiService.getShipments(
          currentPage, 
          itemsPerPage, 
          {
            cliente_id: clienteFilter,
            estatus: statusFilter,
            date_start: dateRangeFilter.start,
            date_end: dateRangeFilter.end,
            sort_by: sortField,
            sort_direction: sortDirection
          }
        );
        console.log('API Response:', response.data);
        
        setEnvios(response.data);
        setTotalItems(response.total);
      } catch (error) {
        console.error('Error fetching shipments:', error);
        setError('Error al cargar envíos');
      } finally {
        setLoading(false);
      }
    };
  
    fetchEnvios();
  }, [isAuthenticated, currentPage, itemsPerPage, clienteFilter, statusFilter, dateRangeFilter, sortField, sortDirection]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (envio: EnvioWithDetails) => {
    setSelectedEnvio(envio);
    setIsDetailsModalOpen(true);
  };

  const handleShipAgain = (envio: EnvioWithDetails) => {
    setSelectedEnvio(envio);
    setIsShipAgainModalOpen(true);
  };

  const handleConfirmShipAgain = async () => {
    if (!selectedEnvio) return;
    
    try {
      navigate(`/shipments/new?clone=${selectedEnvio.id}`);
      
      setIsShipAgainModalOpen(false);
      setSelectedEnvio(null);
    } catch (error) {
      console.error('Error preparing new shipment:', error);
      setError('Error al preparar el nuevo envío');
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
    setFilters([...filters, { field: 'id', value: '' }]);
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');
      
      // If no filters are active and no cliente filter, just load the regular paginated data
      if (!filters.some(f => f.value.trim() !== '') && !clienteFilter && !statusFilter && !dateRangeFilter.start && !dateRangeFilter.end) {
        const response = await apiService.getShipments(1, itemsPerPage, {
          sort_by: sortField,
          sort_direction: sortDirection
        });
        setEnvios(response.data);
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
      
      // Add additional filters if present
      if (clienteFilter) {
        searchParams.cliente_id = clienteFilter;
      }
      
      if (statusFilter) {
        searchParams.estatus = statusFilter;
      }
      
      if (dateRangeFilter.start) {
        searchParams.date_start = dateRangeFilter.start;
      }
      
      if (dateRangeFilter.end) {
        searchParams.date_end = dateRangeFilter.end;
      }
      
      // Add sort parameters
      searchParams.sort_by = sortField;
      searchParams.sort_direction = sortDirection;
      
      const results = await apiService.advancedSearchShipments(searchParams, searchMode);
      
      setEnvios(results.data);
      setTotalItems(results.total);
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error('Search error:', error);
      setError('Error al buscar envíos');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters([{ field: 'id', value: '' }]);
    setClienteFilter('');
    setStatusFilter('');
    setDateRangeFilter({ start: '', end: '' });
  };

  const handleSort = (field: FilterField) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: FilterField) => {
    if (field !== sortField) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    if (sortDirection === 'asc') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
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
          <h1 className="text-xl font-bold">Administración de Envíos</h1>
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
              onClick={() => navigate('/envios/nuevo')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Nuevo Envío
            </button>
          </div>
        </div>

        {/* Advanced Filtering */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium mb-4">Filtros Avanzados</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Cliente Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente ID
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
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estatus
              </label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rango de Fechas
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input 
                    type="date" 
                    value={dateRangeFilter.start}
                    onChange={(e) => setDateRangeFilter({...dateRangeFilter, start: e.target.value})}
                    className="border rounded px-3 py-2 w-full"
                  />
                </div>
                <div className="flex-1">
                  <input 
                    type="date" 
                    value={dateRangeFilter.end}
                    onChange={(e) => setDateRangeFilter({...dateRangeFilter, end: e.target.value})}
                    className="border rounded px-3 py-2 w-full"
                  />
                </div>
              </div>
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
                    <th 
                      onClick={() => handleSort('id')}
                      className="sticky-id sticky-header px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-1">
                        ID {renderSortIcon('id')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('created_at')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-1">
                        Fecha {renderSortIcon('created_at')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('cliente_id')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-1">
                        Cliente {renderSortIcon('cliente_id')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('destino_id')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-1">
                        Destinatario {renderSortIcon('destino_id')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('servicio_id')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-1">
                        Servicio {renderSortIcon('servicio_id')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('estatus')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-1">
                        Estatus {renderSortIcon('estatus')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('paqueteria_externa')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-1">
                        Paquetería {renderSortIcon('paqueteria_externa')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('total')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-1">
                        Total {renderSortIcon('total')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('created_by')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-1">
                        Creado por {renderSortIcon('created_by')}
                      </div>
                    </th>
                    <th className="sticky-actions sticky-header px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {envios.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                        No se encontraron envíos con los criterios de búsqueda
                      </td>
                    </tr>
                  ) : (
                    envios.map((envio) => (
                      <tr key={envio.id} className="hover:bg-gray-50">
                        <td 
                          className="sticky-id px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer" 
                          onClick={() => handleViewDetails(envio)}
                        >
                          {envio.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(envio.created_at).toLocaleString(undefined, {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {envio.cliente_nombre}
                          </div>
                          <div className="text-xs text-gray-500">{envio.cliente_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {envio.nombre_destinatario}
                          </div>
                          <div className="text-xs text-gray-500">{envio.destino_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {envio.servicio_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            envio.estatus === 'entregado' 
                              ? 'bg-green-100 text-green-800' 
                              : envio.estatus === 'transito'
                              ? 'bg-blue-100 text-blue-800'
                              : envio.estatus === 'preparacion'
                              ? 'bg-yellow-100 text-yellow-800'
                              : envio.estatus === 'incidencia'
                              ? 'bg-red-100 text-red-800'
                              : envio.estatus === 'cancelado'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {envio.estatus === 'entregado' 
                              ? 'Entregado' 
                              : envio.estatus === 'transito'
                              ? 'En Tránsito'
                              : envio.estatus === 'preparacion'
                              ? 'En Preparación'
                              : envio.estatus === 'incidencia'
                              ? 'Incidencia'
                              : envio.estatus === 'cancelado'
                              ? 'Cancelado'
                              : 'Cotizado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {envio.paqueteria_externa || 'N/A'}
                          {envio.numero_guia_externa && (
                            <div className="text-xs">{envio.numero_guia_externa}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        ${typeof envio.total === 'number' 
      ? envio.total.toFixed(2) 
      : parseFloat(envio.total || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {envio.username || `Usuario ${envio.created_by}`}
                        </td>
                        <td className="sticky-actions px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Menu as="div" className="relative inline-block text-left">
                            <div>
                              <Menu.Button className="inline-flex items-center justify-center p-2 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                </svg>
                              </Menu.Button>
                            </div>
                            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleViewDetails(envio)}
                                      className={`${
                                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                      } flex items-center px-4 py-2 text-sm w-full text-left`}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      Ver Detalles
                                    </button>
                                  )}
                                </Menu.Item>
                                
                                {envio.ruta_etiqueta && (
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => window.open(`/api/uploads/labels/${envio.ruta_etiqueta}`, '_blank')}
                                        className={`${
                                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                        } flex items-center px-4 py-2 text-sm w-full text-left`}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Ver/Imprimir Etiqueta
                                      </button>
                                    )}
                                  </Menu.Item>
                                )}
                                
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleShipAgain(envio)}
                                      className={`${
                                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                      } flex items-center px-4 py-2 text-sm w-full text-left`}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      Enviar de Nuevo
                                    </button>
                                  )}
                                </Menu.Item>
                                
                                <Menu.Item>
                                  {({ active }) => (
                                    <a
                                      href={`/envios/${envio.id}/seguimiento`}
                                      className={`${
                                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                      } flex items-center px-4 py-2 text-sm`}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                      Seguimiento
                                    </a>
                                  )}
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Menu>
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
                    <span className="font-medium">{totalItems}</span> envíos
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

        {/* Shipment Details Modal */}
        {isDetailsModalOpen && selectedEnvio && (
          <ShipmentDetailsModal 
            envio={selectedEnvio} 
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedEnvio(null);
            }}
          />
        )}

        {/* Ship Again Modal */}
        {isShipAgainModalOpen && selectedEnvio && (
          <ShipAgainModal 
            envio={selectedEnvio} 
            onClose={() => {
              setIsShipAgainModalOpen(false);
              setSelectedEnvio(null);
            }}
            onConfirm={handleConfirmShipAgain}
          />
        )}
      </main>
    </div>
  );
}