import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { UserCreationModal } from './UserCreationModal';
import { UserDetailsModal } from './UserDetails';
import { UserEditModal } from './UserEditModal';

// User interface (add this to your types.ts file later)
interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: 'admin_user' | 'customer_user';
  cliente_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

interface UserToken {
  id: number;
  user_id: string;
  token: string;
  issued_at: string;
  expires_at: string;
  last_used_at: string;
  user_agent: string | null;
  ip_address: string | null;
  is_valid: boolean;
}

interface FilterState {
  field: keyof User;
  value: string;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth(true);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActivity, setUserActivity] = useState<UserToken[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filters, setFilters] = useState<FilterState[]>([{ field: 'username', value: '' }]);
  const [searchMode, setSearchMode] = useState<'all' | 'any'>('all');

  // Filter field options for the dropdown
  const filterFields: { value: keyof User; label: string }[] = [
    { value: 'id', label: 'ID' },
    { value: 'username', label: 'Nombre de Usuario' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Teléfono' },
    { value: 'role', label: 'Rol' },
    { value: 'cliente_id', label: 'ID de Cliente' },
    { value: 'is_active', label: 'Activo' },
  ];

  // Only allow admin users to access this page
  useEffect(() => {
    if (isAuthenticated && role !== 'admin_user') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (!isAuthenticated || role !== 'admin_user') return;
  
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        
        // This would be your actual API call
        const response = await apiService.getUsers(currentPage, itemsPerPage);
        setUsers(response.data);
        setTotalItems(response.total);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Error al cargar usuarios');
      } finally {
        setLoading(false);
      }
    };
  
    fetchUsers();
  }, [isAuthenticated, role, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewDetails = async (user: User) => {
    try {
      setSelectedUser(user);
      setLoadingActivity(true);
      setShowDetailsModal(true);
      
      // Fetch user activity (tokens)
      const activity = await apiService.getUserActivity(user.id);
      setUserActivity(activity);
    } catch (error) {
      setError('Error al cargar la actividad del usuario');
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
    setUserActivity([]);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleToggleActive = async (user: User) => {
    try {
      await apiService.updateUser(user.id, { is_active: user.is_active ? 0 : 1 });
      
      // Update the user in the local state
      setUsers(prev => 
        prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u)
      );
      
      setSuccessMessage(`Usuario ${user.username} ${user.is_active ? 'desactivado' : 'activado'} exitosamente`);
    } catch (error) {
      setError('Error al actualizar el estado del usuario');
    }
  };

  const handleFilterChange = (index: number, field: keyof User | null, value?: string) => {
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
    setFilters([...filters, { field: 'username', value: '' }]);
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');
      
      // If no filters are active, just load the regular paginated data
      if (!filters.some(f => f.value.trim() !== '')) {
        const response = await apiService.getUsers(1, itemsPerPage);
        setUsers(response.data);
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
      
      // Use the advanced search method
      const results = await apiService.advancedSearchUsers(searchParams, searchMode);
      
      setUsers(results.data);
      setTotalItems(results.total);
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error('Search error:', error);
      setError('Error al buscar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters([{ field: 'username', value: '' }]);
  };

  const handleUserSaved = (savedUser: User) => {
    // Refresh the user list
    apiService.getUsers(currentPage, itemsPerPage).then(response => {
      setUsers(response.data);
      setTotalItems(response.total);
      setSuccessMessage(`Usuario ${savedUser.id ? 'actualizado' : 'creado'} exitosamente`);
    }).catch(error => {
      console.error('Error refreshing users:', error);
    });
    
    // Close modals
    setShowUserModal(false);
    setShowEditModal(false);
  };

  const handleInvalidateToken = async (tokenId: number) => {
    try {
      await apiService.invalidateUserToken(tokenId);
      
      // Update the tokens list
      setUserActivity(prev => 
        prev.map(token => token.id === tokenId ? { ...token, is_valid: false } : token)
      );
      
      setSuccessMessage('Token invalidado exitosamente');
    } catch (error) {
      setError('Error al invalidar el token');
    }
  };

  const handleInvalidateAllTokens = async (userId: string) => {
    try {
      await apiService.invalidateAllUserTokens(userId);
      
      // Update all tokens as invalid
      setUserActivity(prev => 
        prev.map(token => ({ ...token, is_valid: false }))
      );
      
      setSuccessMessage('Todos los tokens han sido invalidados exitosamente');
    } catch (error) {
      setError('Error al invalidar los tokens');
    }
  };

  if (!isAuthenticated || role !== 'admin_user') {
    return null;
  }

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
          <h1 className="text-xl font-bold">Administración de Usuarios</h1>
        </div>
      </header>

      <main className="p-6 max-w-screen-2xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 text-red-700 hover:text-red-900"
            >
              &times;
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
            <button 
              onClick={() => setSuccessMessage('')}
              className="ml-2 text-green-700 hover:text-green-900"
            >
              &times;
            </button>
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <button 
            onClick={() => setShowUserModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Nuevo Usuario
          </button>
        </div>

        {/* Advanced Filtering */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium mb-4">Filtros Avanzados</h2>
          
          <div className="space-y-3">
            {filters.map((filter, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <select 
                  value={filter.field}
                  onChange={(e) => handleFilterChange(index, e.target.value as keyof User)}
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                        No se encontraron usuarios con los criterios de búsqueda
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.role === 'admin_user' ? 'Administrador' : 'Cliente'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.cliente_id || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : 'Nunca'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleViewDetails(user)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver Detalles"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Editar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                              title={user.is_active ? 'Desactivar' : 'Activar'}
                            >
                              {user.is_active ? (
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
                    <span className="font-medium">{totalItems}</span> usuarios
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

        {/* User Details Modal */}
        {showDetailsModal && selectedUser && (
          <UserDetailsModal 
            user={selectedUser}
            tokens={userActivity}
            loadingTokens={loadingActivity}
            onClose={handleCloseDetails}
            onEdit={() => {
              handleCloseDetails();
              handleEditUser(selectedUser);
            }}
            onToggleActive={() => {
              handleToggleActive(selectedUser);
              handleCloseDetails();
            }}
            onInvalidateToken={handleInvalidateToken}
            onInvalidateAllTokens={handleInvalidateAllTokens}
          />
        )}

        {/* User Creation Modal */}
        {showUserModal && (
          <UserCreationModal
            onClose={() => setShowUserModal(false)}
            onCreate={handleUserSaved}
            onError={(error) => setError(error)}
          />
        )}

        {/* User Edit Modal */}
        {showEditModal && selectedUser && (
          <UserEditModal
            user={selectedUser}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onUserSaved={handleUserSaved}
            onError={(error) => setError(error)}
          />
        )}
      </main>
    </div>
  );
}