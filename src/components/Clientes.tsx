import { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Cliente, Destino } from '../types';
import ClienteFormModal from './shared/ClienteFormModal';

type FilterField = keyof Cliente;

interface FilterState {
  field: FilterField;
  value: string;
}

export default function AdvancedClientes() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showDestinos, setShowDestinos] = useState(false);
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [loadingDestinos, setLoadingDestinos] = useState(false);
  const [filters, setFilters] = useState<FilterState[]>([{ field: 'nombre', value: '' }]);
  const [searchMode, setSearchMode] = useState<'all' | 'any'>('all');
  const [searchInput, setSearchInput] = useState('');
  
  // Add state for the client modal
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Filter field options for the dropdown
  const filterFields: { value: FilterField; label: string }[] = [
    { value: 'id', label: 'ID' },
    { value: 'nombre', label: 'Nombre' },
    { value: 'apellido_paterno', label: 'Apellido Paterno' },
    { value: 'apellido_materno', label: 'Apellido Materno' },
    { value: 'razon_social', label: 'Razón Social' },
    { value: 'rfc', label: 'RFC' },
    { value: 'telefono', label: 'Teléfono' },
    { value: 'email', label: 'Email' },
    { value: 'tipo', label: 'Tipo' },
    { value: 'colonia', label: 'Colonia' },
    { value: 'municipio', label: 'Municipio' },
    { value: 'estado', label: 'Estado' },
    { value: 'codigo_postal', label: 'Código Postal' }
  ];

  useEffect(() => {
    if (!isAuthenticated) return;
  
    const fetchClientes = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Only fetch paginated data when not searching
        const response = await apiService.getCustomers(currentPage, itemsPerPage);
        setClientes(response.data);
        setTotalItems(response.total);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setError('Error al cargar clientes');
      } finally {
        setLoading(false);
      }
    };
  
    fetchClientes();
  }, [isAuthenticated, currentPage, itemsPerPage]); // Remove searchInput dependency

  // Apply client-side filtering for multiple criteria
  const filteredClientes = clientes;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (cliente: Cliente) => {
    setSelectedCliente(cliente);
  };

  const handleCloseDetails = () => {
    setSelectedCliente(null);
  };

  const handleViewDestinos = async (cliente: Cliente) => {
    try {
      setLoadingDestinos(true);
      setSelectedCliente(cliente);
      setShowDestinos(true);
      const response = await apiService.getCustomerDestinations(cliente.id);
      setDestinos(response);
    } catch (error) {
      setError('Error al cargar los destinos');
      console.error('Error fetching destinations:', error);
    } finally {
      setLoadingDestinos(false);
    }
  };

  const handleCloseDestinos = () => {
    setShowDestinos(false);
    setDestinos([]);
  };

  const handleToggleActive = async (cliente: Cliente) => {
    try {
      await apiService.updateCustomer(cliente.id, { activo: cliente.activo ? 0 : 1 });
      
      // Update the client in the local state
      setClientes(prev => 
        prev.map(c => c.id === cliente.id ? { ...c, activo: !c.activo } : c)
      );
    } catch (error) {
      setError('Error al actualizar el estado del cliente');
      console.error('Error toggling customer active state:', error);
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
    setFilters([...filters, { field: 'nombre', value: '' }]);
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');
      
      // If no filters are active, just load the regular paginated data
      if (!filters.some(f => f.value.trim() !== '')) {
        const response = await apiService.getCustomers(1, itemsPerPage);
        setClientes(response.data);
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
      
      // Use the new advanced search method
      const results = await apiService.advancedSearchCustomers(searchParams, searchMode);
      
      setClientes(results.data);
      setTotalItems(results.total);
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error('Search error:', error);
      setError('Error al buscar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters([{ field: 'nombre', value: '' }]);
    setSearchInput('');
  };

  // Handler for when a client is saved in the modal
  const handleClientSaved = (savedClient: Cliente) => {
    // Refresh the client list after saving
    if (filters.some(f => f.value.trim() !== '')) {
      // If we have filters, just add the new client to the list without refreshing
      setClientes(prev => {
        const existingClientIndex = prev.findIndex(c => c.id === savedClient.id);
        if (existingClientIndex >= 0) {
          // Update existing client
          const newClients = [...prev];
          newClients[existingClientIndex] = savedClient;
          return newClients;
        } else {
          // Add new client
          return [savedClient, ...prev];
        }
      });
    } else {
      // If no filters, refresh the list to get the new client
      apiService.getCustomers(currentPage, itemsPerPage).then(response => {
        setClientes(response.data);
        setTotalItems(response.total);
      }).catch(error => {
        console.error('Error refreshing clients:', error);
      });
    }
    
    // Close the modal
    setIsClientModalOpen(false);
  };

  if (!isAuthenticated) return null;

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const redirectToDashboard = () => {
    if (import.meta.env.PROD) {
      window.location.href = 'https://app.enviadores.com.mx';
    } else {
      navigate('/dashboard');
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-4">
          <button 
            onClick={redirectToDashboard}
            className="text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Administración de Clientes</h1>
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
              onClick={() => setIsClientModalOpen(true)} // Open modal instead of navigating
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Nuevo Cliente
            </button>
          </div>
        </div>

        {/* Advanced Filtering */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          {/* ...filtering UI code... */}
          <h2 className="text-lg font-medium mb-4">Filtros Avanzados</h2>
          
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
            {/* ...table code... */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre / Razón Social</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClientes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No se encontraron clientes con los criterios de búsqueda
                      </td>
                    </tr>
                  ) : (
                    filteredClientes.map((cliente) => (
                      <tr key={cliente.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cliente.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {cliente.nombre} {cliente.apellido_paterno} {cliente.apellido_materno}
                          </div>
                          {cliente.razon_social && (
                            <div className="text-sm text-gray-500">{cliente.razon_social}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cliente.telefono}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cliente.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cliente.tipo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            cliente.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {cliente.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleViewDetails(cliente)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver Detalles"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleViewDestinos(cliente)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Ver Destinos"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleActive(cliente)}
                              className={`${cliente.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                              title={cliente.activo ? 'Desactivar' : 'Activar'}
                            >
                              {cliente.activo ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
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
            {!searchInput && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                {/* ...pagination code... */}
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
                      Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de{' '}
                      <span className="font-medium">{totalItems}</span> clientes
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
            )}
          </div>
        )}

        {/* Client Details Modal */}
        {selectedCliente && !showDestinos && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    Detalles del Cliente
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
                      <p><span className="font-medium">ID:</span> {selectedCliente.id}</p>
                      <p><span className="font-medium">Nombre:</span> {selectedCliente.nombre} {selectedCliente.apellido_paterno} {selectedCliente.apellido_materno}</p>
                      <p><span className="font-medium">Razón Social:</span> {selectedCliente.razon_social || 'N/A'}</p>
                      <p><span className="font-medium">RFC:</span> {selectedCliente.rfc || 'N/A'}</p>
                      <p><span className="font-medium">Tipo:</span> {selectedCliente.tipo}</p>
                      <p><span className="font-medium">Teléfono:</span> {selectedCliente.telefono}</p>
                      <p><span className="font-medium">Teléfono Alternativo:</span> {selectedCliente.telefono_alternativo || 'N/A'}</p>
                      <p><span className="font-medium">Email:</span> {selectedCliente.email || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Dirección</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Calle:</span> {selectedCliente.calle} {selectedCliente.numero_exterior} {selectedCliente.numero_interior && `Int. ${selectedCliente.numero_interior}`}</p>
                      <p><span className="font-medium">Colonia:</span> {selectedCliente.colonia}</p>
                      <p><span className="font-medium">Municipio:</span> {selectedCliente.municipio}</p>
                      <p><span className="font-medium">Estado:</span> {selectedCliente.estado}</p>
                      <p><span className="font-medium">Código Postal:</span> {selectedCliente.codigo_postal}</p>
                      <p><span className="font-medium">País:</span> {selectedCliente.pais || 'México'}</p>
                      <p><span className="font-medium">Referencia:</span> {selectedCliente.referencia || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="font-medium text-gray-700 mb-2">Notas</h3>
                    <p className="bg-gray-50 p-3 rounded">{selectedCliente.notas || 'No hay notas registradas'}</p>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="font-medium text-gray-700 mb-2">Estado</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedCliente.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedCliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        onClick={() => {
                          handleToggleActive(selectedCliente);
                          handleCloseDetails();
                        }}
                        className={`text-sm px-3 py-1 rounded ${
                          selectedCliente.activo 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {selectedCliente.activo ? 'Desactivar Cliente' : 'Activar Cliente'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                      Creado: {selectedCliente.created_at ? new Date(selectedCliente.created_at).toLocaleString() : 'N/A'}
                      <br />
                      Última actualización: {selectedCliente.updated_at ? new Date(selectedCliente.updated_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <button
                    onClick={() => handleViewDestinos(selectedCliente)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Ver Destinos
                  </button>
                  <button
                    onClick={() => {
                      // Open the modal with the selected client for editing
                      setSelectedCliente(null);
                      setIsClientModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Editar
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

        {/* Destinos Modal */}
        {showDestinos && selectedCliente && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    Destinos de {selectedCliente.nombre} {selectedCliente.apellido_paterno}
                  </h2>
                  <button
                    onClick={handleCloseDestinos}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {loadingDestinos ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total: {destinos.length} destinos</span>
                      <button 
                        onClick={() => navigate(`/customers/destinations/new?client=${selectedCliente.id}`)}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                      >
                        Nuevo Destino
                      </button>
                    </div>

                    {destinos.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">Este cliente no tiene destinos registrados</p>
                        <button 
                          onClick={() => navigate(`/customers/destinations/new?client=${selectedCliente.id}`)}
                          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Agregar Destino
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alias</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinatario</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {destinos.map((destino) => (
                              <tr key={destino.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {destino.id}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {destino.alias || 'Sin alias'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {destino.nombre_destinatario}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  <div className="truncate max-w-xs">
                                    {destino.direccion}, {destino.colonia}, {destino.ciudad}, {destino.estado}, CP {destino.codigo_postal}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {destino.telefono}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => navigate(`/customers/destinations/edit/${destino.id}`)}
                                      className="text-blue-600 hover:text-blue-900"
                                      title="Editar"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex justify-end gap-4 pt-6">
                      <button
                        onClick={handleCloseDestinos}
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
        )}

        {/* Client Modal */}
        <ClienteFormModal 
          isOpen={isClientModalOpen} 
          onClose={() => setIsClientModalOpen(false)} 
          onClientSaved={handleClientSaved}
          initialCliente={selectedCliente} // Pass the selected client for editing
        />
      </main>
    </div>
  );
}