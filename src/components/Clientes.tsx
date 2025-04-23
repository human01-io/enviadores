import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Cliente } from '../types';


export default function Clientes() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchClientes = async () => {
      try {
        setLoading(true);
        setError('');
        // Modify the API call to include pagination parameters
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
  }, [isAuthenticated, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (cliente: Cliente) => {
    setSelectedCliente(cliente);
  };

  const handleCloseDetails = () => {
    setSelectedCliente(null);
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
          <h1 className="text-xl font-bold">Clientes / Remitentes</h1>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Nuevo Cliente
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cliente.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {cliente.nombre} {cliente.apellido_paterno}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(cliente)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Ver Detalles
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Desactivar
                        </button>
                      </td>
                    </tr>
                  ))}
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
          </div>
        )}

        {/* Client Details Modal */}
        {selectedCliente && (
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
                      <p><span className="font-medium">Email:</span> {selectedCliente.email}</p>
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
                    <p>{selectedCliente.activo ? 'Activo' : 'Inactivo'}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Creado: {new Date(selectedCliente.created_at || '').toLocaleString()}
                      <br />
                      Última actualización: {new Date(selectedCliente.updated_at || '').toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
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
      </main>
    </div>
  );
}