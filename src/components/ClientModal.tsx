import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { apiService } from '../services/apiService';

interface Cliente {
  id?: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  razon_social?: string;
  rfc?: string;
  telefono: string;
  telefono_alternativo?: string;
  email: string;
  tipo: string;
  calle: string;
  numero_exterior: string;
  numero_interior?: string;
  colonia: string;
  municipio: string;
  estado: string;
  codigo_postal: string;
  pais?: string;
  referencia?: string;
  notas?: string;
  colonias?: string[];
  activo?: boolean | number;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSaved: (client: Cliente) => void;
  initialClient?: Cliente | null;
}

const DEFAULT_CLIENT: Cliente = {
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  razon_social: '',
  rfc: '',
  telefono: '',
  telefono_alternativo: '',
  email: '',
  tipo: 'persona',
  calle: '',
  numero_exterior: '',
  numero_interior: '',
  colonia: '',
  municipio: '',
  estado: '',
  codigo_postal: '',
  pais: 'México',
  referencia: '',
  notas: '',
  activo: 1
};

export function ClientModal({ isOpen, onClose, onClientSaved, initialClient }: ClientModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Cliente[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [cliente, setCliente] = useState<Cliente>(DEFAULT_CLIENT);
  const [zipValidation, setZipValidation] = useState(true);

  // Reset the form when the modal opens or closes
  useEffect(() => {
    if (isOpen) {
      if (initialClient) {
        // If we're editing an existing client, populate the form
        setCliente(initialClient);
        setIsExistingCustomer(true);
      }
    }
  }, [isOpen, initialClient]);

  const isFormValid = (): boolean => {
    return (
      cliente.nombre.trim() !== '' &&
      cliente.apellido_paterno.trim() !== '' &&
      cliente.telefono.trim() !== '' &&
      cliente.calle.trim() !== '' &&
      cliente.colonia.trim() !== '' &&
      cliente.municipio.trim() !== '' &&
      cliente.estado.trim() !== '' &&
      cliente.codigo_postal.trim() !== ''
    );
  };

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

            setCliente(prev => ({
              ...prev,
              estado: zipData.d_estado,
              municipio: zipData.d_mnpio,
              ciudad: zipData.d_ciudad || zipData.d_mnpio,
              colonias,
              colonia: colonias[0] || ''
            }));
            setZipValidation(true);
          } else {
            throw new Error("No se encontraron datos para este código postal");
          }
        } catch (error) {
          console.error("Error fetching address data:", error);
          setZipValidation(false);
        }
      }
    };

    if (cliente.codigo_postal && cliente.codigo_postal.length === 5) {
      fetchAddressData(cliente.codigo_postal);
    }
  }, [cliente.codigo_postal]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        try {
          const results = await apiService.searchCustomers(searchQuery);
          setCustomerSuggestions(results);
        } catch (error) {
          console.error('Search failed:', error);
          setCustomerSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setCustomerSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCustomer = (selectedCustomer: Cliente | null) => {
    if (!selectedCustomer) {
      setSearchQuery('');
      setCustomerSuggestions([]);
      return;
    }

    setCliente(prev => ({
      ...prev,
      ...selectedCustomer,
      nombre: selectedCustomer.nombre || prev.nombre || '',
      apellido_paterno: selectedCustomer.apellido_paterno || prev.apellido_paterno || '',
      telefono: selectedCustomer.telefono || prev.telefono || '',
      email: selectedCustomer.email || prev.email || '',
      tipo: selectedCustomer.tipo || prev.tipo || 'persona'
    }));
    setIsExistingCustomer(true);
    setSearchQuery('');
    setCustomerSuggestions([]);
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCliente(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
    } else {
      setCliente(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveCustomer = async () => {
    if (!isFormValid()) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

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
      onClientSaved(cliente);
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error al guardar el cliente');
    }
  };

  // Clear form and reset to defaults
  const handleClearForm = () => {
    setCliente(DEFAULT_CLIENT);
    setIsExistingCustomer(false);
    setSearchQuery('');
    setCustomerSuggestions([]);
    setZipValidation(true);
  };

  // Handle modal close with cleanup
  const handleClose = () => {
    handleClearForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {isExistingCustomer ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!initialClient && (
            <div className="mb-6">
              <Combobox value={cliente} onChange={handleSelectCustomer}>
                <div className="relative">
                  <Combobox.Input
                    displayValue={(c: Cliente) => c.nombre ? `${c.nombre} ${c.apellido_paterno || ''}`.trim() : ''}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isSearching ? "Buscando..." : "Buscar cliente existente..."}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />

                  {isSearching && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          )}

          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre*</label>
                <input
                  type="text"
                  name="nombre"
                  value={cliente.nombre}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono*</label>
                <input
                  type="tel"
                  name="telefono"
                  value={cliente.telefono}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo*</label>
                <select
                  name="tipo"
                  value={cliente.tipo}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
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
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">RFC</label>
                    <input
                      type="text"
                      name="rfc"
                      value={cliente.rfc}
                      onChange={handleClienteChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                </>
              )}

              {/* Status field - only for existing customers */}
              {isExistingCustomer && (
                <div className="col-span-full">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      name="activo"
                      checked={cliente.activo === 1 || cliente.activo === true}
                      onChange={handleClienteChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Cliente Activo</span>
                  </label>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Dirección del Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Calle*</label>
                  <input
                    type="text"
                    name="calle"
                    value={cliente.calle}
                    onChange={handleClienteChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Colonia*</label>
                  <select
                    name="colonia"
                    value={cliente.colonia}
                    onChange={handleClienteChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    required
                  >
                    {cliente.colonias?.map((colonia, index) => (
                      <option key={index} value={colonia}>{colonia}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Municipio*</label>
                  <input
                    type="text"
                    name="municipio"
                    value={cliente.municipio || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    required
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado*</label>
                  <input
                    type="text"
                    name="estado"
                    value={cliente.estado || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    required
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Código Postal*</label>
                  <div>
                    <input
                      type="text"
                      name="codigo_postal"
                      value={cliente.codigo_postal}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                        setCliente(prev => ({ ...prev, codigo_postal: value }));
                      }}
                      className={`mt-1 block w-full border ${!zipValidation ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}
                      required
                    />
                    {!zipValidation && (
                      <p className="text-red-500 text-sm">Código postal no válido</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">País*</label>
                  <input
                    type="text"
                    name="pais"
                    value={cliente.pais}
                    onChange={handleClienteChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Referencia</label>
                <input
                  type="text"
                  name="referencia"
                  value={cliente.referencia || ''}
                  onChange={handleClienteChange}
                  placeholder="Referencias para ubicar la dirección"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Notas</label>
                <textarea
                  name="notas"
                  value={cliente.notas || ''}
                  onChange={handleClienteChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Información adicional sobre el cliente"
                ></textarea>
              </div>
            </div>
          </form>
        </div>
        
        {/* Fixed footer with buttons */}
        <div className="border-t bg-gray-50 p-4 flex justify-end gap-3 sticky bottom-0">
          <button
            type="button"
            onClick={handleClearForm}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveCustomer}
            className={`px-4 py-2 rounded-md text-white ${
              isFormValid() 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-blue-300 cursor-not-allowed'
            }`}
            disabled={!isFormValid()}
          >
            {isExistingCustomer ? 'Actualizar Cliente' : 'Guardar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}