import React from 'react';
import { AlertCircle } from 'lucide-react';

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

interface UserDetailsModalProps {
  user: User;
  tokens: UserToken[];
  loadingTokens: boolean;
  onClose: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onInvalidateToken: (tokenId: number) => void;
  onInvalidateAllTokens: (userId: string) => void;
}

export function UserDetailsModal({
  user,
  tokens,
  loadingTokens,
  onClose,
  onEdit,
  onToggleActive,
  onInvalidateToken,
  onInvalidateAllTokens
}: UserDetailsModalProps) {
  // Format a date string
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  // Check if a token is expired
  const isTokenExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // Get a string representation of token status
  const getTokenStatus = (token: UserToken) => {
    if (!token.is_valid) return 'Invalidado';
    if (isTokenExpired(token.expires_at)) return 'Expirado';
    return 'Activo';
  };

  // Get a color class based on token status
  const getTokenStatusClass = (token: UserToken) => {
    if (!token.is_valid) return 'bg-red-100 text-red-800';
    if (isTokenExpired(token.expires_at)) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Detalles del Usuario
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Información Básica</h3>
              <div className="space-y-2">
                <p><span className="font-medium">ID:</span> {user.id}</p>
                <p><span className="font-medium">Usuario:</span> {user.username}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">Teléfono:</span> {user.phone}</p>
                <p>
                  <span className="font-medium">Rol:</span> 
                  {user.role === 'admin_user' ? ' Administrador' : ' Usuario Cliente'}
                </p>
                <p>
                  <span className="font-medium">Cliente ID:</span> 
                  {user.cliente_id || ' N/A'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">Estado y Fechas</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Estado:</span> 
                  <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </p>
                <p><span className="font-medium">Creado:</span> {formatDate(user.created_at)}</p>
                <p><span className="font-medium">Actualizado:</span> {formatDate(user.updated_at)}</p>
                <p><span className="font-medium">Último login:</span> {formatDate(user.last_login)}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-700">Sesiones Activas (Tokens)</h3>
              {tokens.some(t => t.is_valid) && (
                <button
                  onClick={() => onInvalidateAllTokens(user.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  title="Cerrar todas las sesiones"
                >
                  Cerrar todas las sesiones
                </button>
              )}
            </div>

            {loadingTokens ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : tokens.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500">
                No hay sesiones registradas para este usuario
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creado</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expira</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último uso</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Navegador</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tokens.map((token) => (
                      <tr key={token.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTokenStatusClass(token)}`}>
                            {getTokenStatus(token)}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(token.issued_at)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(token.expires_at)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(token.last_used_at)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {token.ip_address || 'Desconocido'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          <div className="max-w-xs truncate">
                            {token.user_agent || 'Desconocido'}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                          {token.is_valid && !isTokenExpired(token.expires_at) && (
                            <button
                              onClick={() => onInvalidateToken(token.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Invalidar Token"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Security warning for token invalidation */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Al invalidar un token, la sesión del usuario será cerrada inmediatamente.
                  El usuario deberá iniciar sesión nuevamente para acceder al sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Editar Usuario
            </button>
            <button
              onClick={onToggleActive}
              className={`px-4 py-2 rounded-md ${
                user.is_active
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {user.is_active ? 'Desactivar Usuario' : 'Activar Usuario'}
            </button>
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
}