import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

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

interface Cliente {
  id: string;
  nombre: string;
  razon_social?: string;
}

interface UserEditModalProps {
  user: User;
  onClose: () => void;
  onUserSaved: (user: User) => void;
  onError: (error: string) => void;
}

export function UserEditModal({ user, onClose, onUserSaved, onError }: UserEditModalProps) {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    cliente_id: user.cliente_id || '',
    resetPassword: false,
    newPassword: ''
  });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch customers when needed
  useEffect(() => {
    if (formData.role === 'customer_user' && clientes.length === 0) {
      fetchClientes();
    }
  }, [formData.role]);

  // Fetch top 50 customers
  const fetchClientes = async (search = '') => {
    try {
      setLoadingClientes(true);
      let response;
      
      if (search) {
        response = await apiService.searchCustomers(search);
      } else {
        // Assuming your API supports pagination for customers
        response = await apiService.getCustomers(1, 50);
        if ('data' in response) {
          response = response.data;
        }
      }
      
      setClientes(response);
    } catch (error) {
      console.error('Error fetching customers:', error);
      onError('Error al cargar clientes');
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }
    
    if (formData.role === 'customer_user' && !formData.cliente_id) {
      newErrors.cliente_id = 'Debe seleccionar un cliente';
    }
    
    if (formData.resetPassword && !formData.newPassword) {
      newErrors.newPassword = 'Debe ingresar una nueva contraseña';
    } else if (formData.resetPassword && formData.newPassword.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const payload: Record<string, any> = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        role: formData.role
      };
      
      if (formData.role === 'customer_user') {
        payload.cliente_id = formData.cliente_id;
      } else {
        payload.cliente_id = null;
      }
      
      if (formData.resetPassword) {
        payload.password = formData.newPassword;
      }
      
      await apiService.updateUser(user.id, payload);
      
      // Create updated user object for the caller
      const updatedUser: User = {
        ...user,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        cliente_id: formData.role === 'customer_user' ? formData.cliente_id : null,
        updated_at: new Date().toISOString()
      };
      
      onUserSaved(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      onError('Error al actualizar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClienteSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    setClienteSearch(search);
    
    if (search.length >= 3) {
      fetchClientes(search);
    } else if (search.length === 0) {
      fetchClientes();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Editar Usuario
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

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ID de Usuario
                </label>
                <input
                  type="text"
                  value={user.id}
                  disabled
                  className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Nombre de Usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Rol
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="admin_user">Administrador</option>
                  <option value="customer_user">Usuario Cliente</option>
                </select>
              </div>

              {formData.role === 'customer_user' && (
                <div>
                  <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700">
                    Cliente
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      placeholder="Buscar cliente..."
                      value={clienteSearch}
                      onChange={handleClienteSearch}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {loadingClientes && (
                      <div className="absolute right-3 top-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                  <div className="mt-1">
                    <select
                      id="cliente_id"
                      name="cliente_id"
                      value={formData.cliente_id}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-2 border ${
                        errors.cliente_id ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    >
                      <option value="">Seleccionar cliente</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nombre} {cliente.razon_social ? `(${cliente.razon_social})` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.cliente_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.cliente_id}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center">
                  <input
                    id="resetPassword"
                    name="resetPassword"
                    type="checkbox"
                    checked={formData.resetPassword}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="resetPassword" className="ml-2 block text-sm text-gray-700">
                    Restablecer contraseña
                  </label>
                </div>
              </div>

              {formData.resetPassword && (
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    Nueva Contraseña
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.newPassword ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}