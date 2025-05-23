import { useState, useEffect, useCallback } from 'react';
import { Combobox } from '@headlessui/react';
import { Search, Check, User, X, Loader2 } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { Cliente } from '../../types';

interface ClienteSelectorProps {
  onClienteSelected: (cliente: Cliente) => void;
  onCancel: () => void;
}

export default function ClienteSelector({ onClienteSelected, onCancel }: ClienteSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [clienteSuggestions, setClienteSuggestions] = useState<Cliente[]>([]);
  const [isSearching, setIsSearching] = useState(false);
 
  


  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setClienteSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await apiService.searchCustomers(query);
        setClienteSuggestions(results);
      } catch (error) {
        console.error('Customer search failed:', error);
        setClienteSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Seleccionar Cliente
              </h2>
              <p className="text-sm text-gray-600">
                Selecciona un cliente para continuar con la creación del destino
              </p>
            </div>
          </div>
          <button 
            onClick={onCancel} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <Combobox onChange={onClienteSelected}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Combobox.Input
                className="w-full p-3 pl-10 pr-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Buscar por nombre, teléfono o email..."
                onChange={(e) => setSearchQuery(e.target.value)}
                displayValue={(cliente: Cliente) => 
                  cliente?.nombre 
                    ? `${cliente.nombre} ${cliente.apellido_paterno || ''}`
                    : ''
                }
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                </div>
              )}

              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {clienteSuggestions.length === 0 && searchQuery.trim() !== '' ? (
                  <div className="py-8 px-4 text-center">
                    <p className="text-gray-500">No se encontraron clientes</p>
                    <button 
                      className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={() => {
                        // You can add functionality to create a new client here
                        // or just clear the search
                        setSearchQuery('');
                      }}
                    >
                      Crear un nuevo cliente
                    </button>
                  </div>
                ) : (
                  clienteSuggestions.map((cliente) => (
                    <Combobox.Option
                      key={cliente.id || cliente.telefono}
                      value={cliente}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-3 pl-10 pr-4 ${
                          active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {cliente.nombre} {cliente.apellido_paterno} 
                              {cliente.razon_social && ` (${cliente.razon_social})`}
                            </span>
                            <span className="text-sm text-gray-500">
                              {cliente.telefono} {cliente.email && `• ${cliente.email}`}
                            </span>
                          </div>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function for debouncing
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}