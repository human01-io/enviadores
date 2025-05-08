import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { apiService } from '../../services/apiService';
import { Cliente } from '../../types';

interface ClienteFormProps {
  cliente: Cliente;
  setCliente: (cliente: Cliente | ((prev: Cliente) => Cliente)) => void;
  isExistingCustomer: boolean;
  setIsExistingCustomer: (isExisting: boolean) => void;
  isValid: boolean;
  originData?: {
    estado: string;
    municipio: string;
    ciudad: string;
    colonias: string[];
  };
  zipValidation: boolean;
}

export default function ClienteForm({
  cliente,
  setCliente,
  isExistingCustomer,
  setIsExistingCustomer,
  isValid,
  originData,
  zipValidation
}: ClienteFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Cliente[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search for customers when query changes
  useEffect(() => {
    const searchCustomers = async () => {
      if (searchQuery.trim().length < 2) {
        setCustomerSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await apiService.searchCustomers(searchQuery);
        setCustomerSuggestions(results);
      } catch (error) {
        console.error('Customer search failed:', error);
        setCustomerSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchAddressData = async (zip: string) => {
      if (zip.length === 5) {
        try {
          const response = await fetch(`https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${zip}`);
          if (!response.ok) throw new Error("Código postal no encontrado");
  
          const data = await response.json();
          if (data?.zip_codes?.length > 0) {
            const zipData = data.zip_codes[0];
            const colonias = data.zip_codes.map((z: any) => z.d_asenta);
            
            // Preserve existing colonia if this is an existing customer
            setCliente(prev => {
              const shouldUpdateColonia = !prev.colonia || prev.colonia === '';
              
              return {
                ...prev,
                estado: zipData.d_estado,
                municipio: zipData.d_mnpio,
                ciudad: zipData.d_ciudad || zipData.d_mnpio,
                colonias,
                colonia: shouldUpdateColonia ? (colonias[0] || '') : prev.colonia
              };
            });
          }
        } catch (error) {
          console.error("Error fetching address data:", error);
        }
      }
    };
  
    // Call the fetch function when ZIP code changes
    if (cliente.codigo_postal && cliente.codigo_postal.length === 5) {
      fetchAddressData(cliente.codigo_postal);
    }
  }, [cliente.codigo_postal]);

  // Handle customer selection
  const handleSelectCustomer = (selectedCustomer: Cliente | null) => {
    if (!selectedCustomer) {
      setSearchQuery('');
      setCustomerSuggestions([]);
      return;
    }

    setCliente(selectedCustomer);
    setIsExistingCustomer(true);
    setSearchQuery('');
    setCustomerSuggestions([]);
  };

  // Handle form changes
  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCliente(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
    } else {
      setCliente(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle ZIP code changes with auto-formatting
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setCliente(prev => ({ ...prev, codigo_postal: value }));
  };

  // Update customer in DB
  const handleSaveCustomer = async () => {
    try {
      if (isExistingCustomer && cliente.id) {
        await apiService.updateCustomer(cliente.id, cliente);
        alert('Cliente actualizado correctamente');
      } else {
        const { id } = await apiService.createCustomer(cliente);
        setCliente(prev => ({ ...prev, id }));
        setIsExistingCustomer(true);
        alert('Cliente creado correctamente');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error al guardar el cliente');
    }
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center sticky top-0 bg-blue-50 py-2 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        Datos del Remitente
      </h3>
      
      {/* Customer Search Combobox */}
      <div className="mb-6">
        <label className="block text-base font-medium text-blue-800 mb-1">
          Buscar cliente existente
        </label>
        <div className="bg-white border-2 border-blue-300 rounded-md shadow-sm">
          <Combobox value={cliente} onChange={handleSelectCustomer}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <Combobox.Input
                displayValue={(c: Cliente) => c.nombre ? `${c.nombre} ${c.apellido_paterno || ''}`.trim() : ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isSearching ? "Buscando..." : "Buscar por nombre, teléfono o email..."}
                className="w-full p-3 pl-10 border-none rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder-blue-400"
              />

              {isSearching && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}

              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {customerSuggestions.length === 0 && searchQuery !== '' ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                    No se encontraron clientes
                  </div>
                ) : (
                  customerSuggestions.map((customer) => (
                    <Combobox.Option
                      key={customer.id || customer.telefono}
                      value={customer}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {customer.nombre} {customer.apellido_paterno} - {customer.telefono}
                            {customer.razon_social && ` (${customer.razon_social})`}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                              ✓
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
        
        {isExistingCustomer && cliente.id && (
          <div className="mt-2 text-sm text-blue-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Cliente existente seleccionado
          </div>
        )}
      </div>
      
      {/* Cliente Form Fields */}
      <div className="space-y-4 overflow-y-auto pr-2 flex-grow max-h-[calc(100vh-16rem)]">
        <div className="border-t pt-4 border-blue-200">
          <h4 className="font-medium mb-3 text-blue-800">Información del Cliente</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre*</label>
              <input
                type="text"
                name="nombre"
                value={cliente.nombre}
                onChange={handleClienteChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido Paterno*</label>
              <input
                type="text"
                name="apellido_paterno"
                value={cliente.apellido_paterno}
                onChange={handleClienteChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido Materno</label>
              <input
                type="text"
                name="apellido_materno"
                value={cliente.apellido_materno}
                onChange={handleClienteChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono*</label>
              <input
                type="tel"
                name="telefono"
                value={cliente.telefono}
                onChange={handleClienteChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email*</label>
              <input
                type="email"
                name="email"
                value={cliente.email}
                onChange={handleClienteChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo*</label>
              <select
                name="tipo"
                value={cliente.tipo}
                onChange={handleClienteChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                required
              >
                <option value="persona">Persona</option>
                <option value="empresa">Empresa</option>
                <option value="gobierno">Gobierno</option>
              </select>
            </div>

            {cliente.tipo === 'empresa' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Razón Social</label>
                  <input
                    type="text"
                    name="razon_social"
                    value={cliente.razon_social}
                    onChange={handleClienteChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">RFC</label>
                  <input
                    type="text"
                    name="rfc"
                    value={cliente.rfc}
                    onChange={handleClienteChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                  />
                </div>
              </>
            )}
          </div>

          {/* Address Section */}
          <div className="border-t pt-4 mt-4 border-blue-100">
            <h4 className="font-medium mb-3 text-blue-800">Dirección</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Calle*</label>
                <input
                  type="text"
                  name="calle"
                  value={cliente.calle}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Número Exterior*</label>
                <input
                  type="text"
                  name="numero_exterior"
                  value={cliente.numero_exterior}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Número Interior</label>
                <input
                  type="text"
                  name="numero_interior"
                  value={cliente.numero_interior}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Código Postal*</label>
                <input
                  type="text"
                  name="codigo_postal"
                  value={cliente.codigo_postal}
                  onChange={handleZipChange}
                  className={`mt-1 block w-full border ${!zipValidation ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 bg-white`}
                  required
                />
                {!zipValidation && (
                  <p className="text-xs text-red-500 mt-1">
                    El código postal no coincide con la cotización
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Colonia*</label>
                <div className="relative">
                  <select
                    name="colonia"
                    value={cliente.colonias?.includes(cliente.colonia) ? cliente.colonia : "custom"}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        // If "Otra colonia" is selected, keep the current value
                        return;
                      }
                      setCliente(prev => ({ ...prev, colonia: e.target.value }));
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                    required
                  >
                    <option value="">Seleccionar colonia</option>
                    {cliente.colonias?.map((colonia, index) => (
                      <option key={index} value={colonia}>{colonia}</option>
                    ))}
                    {cliente.colonia && !cliente.colonias?.includes(cliente.colonia) && (
                      <option value={cliente.colonia}>{cliente.colonia}</option>
                    )}
                    <option value="custom">Otra colonia</option>
                  </select>
                  
                  {/* Show input field if "Otra colonia" is selected or if current value is not in the list */}
                  {(!cliente.colonias?.includes(cliente.colonia) || cliente.colonia === "custom") && (
                    <input
                      type="text"
                      name="colonia"
                      value={cliente.colonia === "custom" ? "" : cliente.colonia}
                      onChange={handleClienteChange}
                      placeholder="Escribir nombre de colonia"
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Municipio*</label>
                <input
                  type="text"
                  name="municipio"
                  value={cliente.municipio || ''}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estado*</label>
                <input
                  type="text"
                  name="estado"
                  value={cliente.estado || ''}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">País*</label>
                <input
                  type="text"
                  name="pais"
                  value={cliente.pais || 'México'}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                  required
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">Referencia</label>
              <input
                type="text"
                name="referencia"
                value={cliente.referencia || ''}
                onChange={handleClienteChange}
                placeholder="Referencias para ubicar la dirección"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 mt-3">
            {isExistingCustomer ? (
              <button
                type="button"
                onClick={handleSaveCustomer}
                className="px-3 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
              >
                Actualizar Cliente
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveCustomer}
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                disabled={!isValid}
              >
                Guardar Cliente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}