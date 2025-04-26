import { useState } from 'react';
import { apiService } from '../services/apiService';
import { Cliente } from '../types';
import '../App.css'

interface UserCreationModalProps {
  onClose: () => void;
  onCreate: (userId: string) => void;
}

export function UserCreationModal({ onClose, onCreate }: UserCreationModalProps) {
  const [creationMethod, setCreationMethod] = useState<'existing' | 'new' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Cliente[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state for new user
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer_user' as 'admin_user' | 'customer_user'
  });

  const handleSearchCustomers = async () => {
    try {
      setIsLoading(true);
      const results = await apiService.searchCustomers(searchQuery);
      setCustomers(results);
    } catch (err) {
      setError('Failed to search customers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFromCustomer = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    if (userData.password !== userData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiService.createUser({
        cliente_id: selectedCustomer.id!,
        username: selectedCustomer.email.split('@')[0],
        email: selectedCustomer.email,
        phone: selectedCustomer.telefono,
        password: userData.password,
        role: userData.role
      });
      onCreate(response.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User creation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewUser = async () => {
    if (userData.password !== userData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiService.createUser({
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: userData.role
      });
      onCreate(response.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User creation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Crear Nuevo Usuario</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>

        {!creationMethod ? (
          <div className="space-y-4">
            <button
              onClick={() => setCreationMethod('existing')}
              className="w-full bg-blue-100 text-blue-800 p-3 rounded hover:bg-blue-200"
            >
              Crear a partir de cliente existente
            </button>
            <button
              onClick={() => setCreationMethod('new')}
              className="w-full bg-green-100 text-green-800 p-3 rounded hover:bg-green-200"
            >
              Crear desde cero
            </button>
          </div>
        ) : creationMethod === 'existing' ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente..."
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={handleSearchCustomers}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {isLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {customers.length > 0 && (
              <div className="max-h-60 overflow-y-auto border rounded">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`p-3 hover:bg-gray-100 cursor-pointer ${
                      selectedCustomer?.id === customer.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-medium">{customer.nombre}</div>
                    <div className="text-sm text-gray-600">{customer.email}</div>
                    <div className="text-sm text-gray-600">{customer.telefono}</div>
                  </div>
                ))}
              </div>
            )}

            {selectedCustomer && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h3 className="font-medium">Cliente seleccionado:</h3>
                <p>{selectedCustomer.nombre}</p>
                <p>{selectedCustomer.email}</p>
                <p>{selectedCustomer.telefono}</p>
              </div>
              
            )}

<div>
              <label className="block text-sm font-medium mb-1">Contraseña</label>
              <input
                type="password"
                value={userData.password}
                onChange={(e) => setUserData({...userData, password: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirmar Contraseña</label>
              <input
                type="password"
                value={userData.confirmPassword}
                onChange={(e) => setUserData({...userData, confirmPassword: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rol</label>
              <select
                value={userData.role}
                onChange={(e) => setUserData({...userData, role: e.target.value as any})}
                className="w-full p-2 border rounded"
              >
                <option value="customer_user">Cliente</option>
                <option value="admin_user">Administrador</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setCreationMethod(null)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Volver
              </button>
              <button
                onClick={handleCreateFromCustomer}
                disabled={!selectedCustomer || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre de usuario</label>
              <input
                type="text"
                value={userData.username}
                onChange={(e) => setUserData({...userData, username: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({...userData, email: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                type="tel"
                value={userData.phone}
                onChange={(e) => setUserData({...userData, phone: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contraseña</label>
              <input
                type="password"
                value={userData.password}
                onChange={(e) => setUserData({...userData, password: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirmar Contraseña</label>
              <input
                type="password"
                value={userData.confirmPassword}
                onChange={(e) => setUserData({...userData, confirmPassword: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rol</label>
              <select
                value={userData.role}
                onChange={(e) => setUserData({...userData, role: e.target.value as any})}
                className="w-full p-2 border rounded"
              >
                <option value="customer_user">Cliente</option>
                <option value="admin_user">Administrador</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setCreationMethod(null)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Volver
              </button>
              <button
                onClick={handleCreateNewUser}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}