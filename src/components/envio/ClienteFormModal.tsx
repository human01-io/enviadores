import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { apiService } from '../../services/apiService';
import { Cliente } from '../../types';
import { User, Phone, Mail, MapPin, X, Search, Check, AlertCircle, ArrowDown } from 'lucide-react';

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSaved: (cliente: Cliente) => void;
  initialCliente?: Cliente | null;
}

export default function ClienteFormModal({
  isOpen,
  onClose,
  onClientSaved,
  initialCliente
}: ClienteFormModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Cliente[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [zipValidation, setZipValidation] = useState(true);
  const [showIndicator, setShowIndicator] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalCliente, setOriginalCliente] = useState<Cliente | null>(null);

  // Reset the form when the modal opens or closes
  useEffect(() => {
    if (isOpen) {
      if (initialCliente) {
        // If we're editing an existing client, populate the form
        setCliente(initialCliente);
        setOriginalCliente(JSON.parse(JSON.stringify(initialCliente))); // Deep copy
        setIsExistingCustomer(!!initialCliente.id); // Only existing if it has an ID
        setHasChanges(false);
      } else {
        // Creating a new client
        const newCliente = {
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
        setCliente(newCliente);
        setOriginalCliente(JSON.parse(JSON.stringify(newCliente))); // Deep copy
        setIsExistingCustomer(false);
        setHasChanges(false);
      }
    }
  }, [isOpen, initialCliente]);

  // Check for changes whenever cliente changes
  useEffect(() => {
    if (cliente && originalCliente) {
      const changes = JSON.stringify(cliente) !== JSON.stringify(originalCliente);
      setHasChanges(changes);
    }
  }, [cliente, originalCliente]);

    useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

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

  // Fetch ZIP code data
  // Update the ZIP code useEffect in ClienteFormModal.tsx
useEffect(() => {
  const fetchAddressData = async (zip: string) => {
    if (!zip || zip.length !== 5) {
      if (zip && zip.length > 0) {
        setFormErrors({
          ...formErrors,
          codigo_postal: "Debe tener 5 dígitos"
        });
        setZipValidation(false);
      }
      return;
    }

    try {
      const response = await fetch(`https://enviadores.com.mx/api/zip_codes.php?zip_code=${zip}`);
      if (!response.ok) throw new Error("Código postal no encontrado");

      const data = await response.json();
      if (data?.zip_codes?.length > 0) {
        const zipData = data.zip_codes[0];
        const colonias = data.zip_codes.map((z: any) => z.d_asenta);
        
        setCliente(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            estado: zipData.d_estado,
            municipio: zipData.d_mnpio,
            ciudad: zipData.d_ciudad || zipData.d_mnpio,
            colonias,
            // Only update colonia if:
            // 1. We're creating a new client (not editing existing)
            // AND
            // 2. Current colonia is empty or not in the new list
            colonia: (isExistingCustomer && prev.colonia) 
              ? prev.colonia // Keep existing colonia for edits
              : (!prev.colonia || prev.colonia === '' || !colonias.includes(prev.colonia)) 
                ? (colonias[0] || '') 
                : prev.colonia
          };
        });
        setZipValidation(true);
        
        // Clear related errors
        const newErrors = {...formErrors};
        delete newErrors.codigo_postal;
        delete newErrors.estado;
        delete newErrors.municipio;
        setFormErrors(newErrors);
      } else {
        throw new Error("No se encontraron datos para este código postal");
      }
    } catch (error) {
      console.error("Error fetching address data:", error);
      setZipValidation(false);
      setFormErrors({
        ...formErrors,
        codigo_postal: "Código postal no válido o no encontrado"
      });
    }
  };

  // Call the fetch function when ZIP code changes
  if (cliente?.codigo_postal && cliente.codigo_postal.length === 5) {
    fetchAddressData(cliente.codigo_postal);
  }
}, [cliente?.codigo_postal]);

  // Handle customer selection
  const handleSelectCustomer = (selectedCustomer: Cliente | null) => {
    if (!selectedCustomer) {
      setSearchQuery('');
      setCustomerSuggestions([]);
      return;
    }

    setCliente(selectedCustomer);
    setOriginalCliente(JSON.parse(JSON.stringify(selectedCustomer))); // Deep copy
    setIsExistingCustomer(!!selectedCustomer.id); // Only existing if it has an ID
    setSearchQuery('');
    setCustomerSuggestions([]);
    setFormErrors({});
    setHasChanges(false);
  };

  // Handle form changes
  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (!cliente) return;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCliente(prev => {
        if (!prev) return prev;
        return { ...prev, [name]: checked ? 1 : 0 }
      });
    } else {
      setCliente(prev => {
        if (!prev) return prev;
        return { ...prev, [name]: value }
      });
    }
    
    // Clear field error when user types
    if (formErrors[name]) {
      const newErrors = {...formErrors};
      delete newErrors[name];
      setFormErrors(newErrors);
    }
  };

  // Handle ZIP code changes with auto-formatting
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setCliente(prev => {
      if (!prev) return prev;
      return { ...prev, codigo_postal: value }
    });
  };

  const validateForm = () => {
    if (!cliente) return false;
    
    const errors: Record<string, string> = {};
    
    if (!cliente.nombre?.trim()) {
      errors.nombre = "El nombre es obligatorio";
    }
    
    if (!cliente.apellido_paterno?.trim()) {
      errors.apellido_paterno = "El apellido paterno es obligatorio";
    }
    
    if (!cliente.telefono?.trim()) {
      errors.telefono = "El teléfono es obligatorio";
    }
    
    if (!cliente.email?.trim()) {
      errors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) {
      errors.email = "El formato de email no es válido";
    }
    
    if (!cliente.calle?.trim()) {
      errors.calle = "La calle es obligatoria";
    }
    
    if (!cliente.numero_exterior?.trim()) {
      errors.numero_exterior = "El número exterior es obligatorio";
    }
    
    if (!cliente.colonia?.trim()) {
      errors.colonia = "La colonia es obligatoria";
    }
    
    if (!cliente.codigo_postal?.trim()) {
      errors.codigo_postal = "El código postal es obligatorio";
    } else if (cliente.codigo_postal.length !== 5) {
      errors.codigo_postal = "El código postal debe tener 5 dígitos";
    }
    
    if (!cliente.municipio?.trim()) {
      errors.municipio = "El municipio es obligatorio";
    }
    
    if (!cliente.estado?.trim()) {
      errors.estado = "El estado es obligatorio";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = (): boolean => {
    if (!cliente) return false;
    
    return (
      !!cliente.nombre?.trim() &&
      !!cliente.apellido_paterno?.trim() &&
      !!cliente.telefono?.trim() &&
      !!cliente.email?.trim() &&
      !!cliente.calle?.trim() &&
      !!cliente.numero_exterior?.trim() &&
      !!cliente.colonia?.trim() &&
      !!cliente.codigo_postal?.trim() &&
      cliente.codigo_postal.length === 5 &&
      !!cliente.municipio?.trim() &&
      !!cliente.estado?.trim() &&
      zipValidation
    );
  };

  // Update customer in DB
  const handleSaveCustomer = async () => {
    if (!validateForm() || !cliente) {
      return;
    }

    try {
      if (isExistingCustomer && cliente.id) {
        await apiService.updateCustomer(cliente.id, cliente);
        onClientSaved(cliente);
      } else {
        const { id } = await apiService.createCustomer(cliente);
        const updatedCliente = { ...cliente, id };
        setCliente(updatedCliente);
        setIsExistingCustomer(true);
        onClientSaved(updatedCliente);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error al guardar el cliente. Por favor intenta nuevamente.');
    }
  };

  const getButtonText = () => {
    if (!isExistingCustomer) {
      return 'Crear Cliente';
    }
    return hasChanges ? 'Continuar' : 'Continuar';
  };

  const handleClose = () => {
    setSearchQuery('');
    setCustomerSuggestions([]);
    setFormErrors({});
    onClose();
  };

  if (!isOpen || !cliente) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-hidden">
      <div className="bg-white rounded-lg shadow-xl w-[70vw] min-w-[300px] max-w-[1200px] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-blue-50">
          <div>
            <h2 className="text-xl font-bold text-blue-800 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              {isExistingCustomer ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
            </h2>
            {isExistingCustomer && cliente.id && (
              <p className="text-blue-600 text-sm">ID: {cliente.id}</p>
            )}
          </div>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Client Search - Only show if not editing existing */}
            {!initialCliente && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-base font-medium text-blue-800">
                    Buscar cliente existente
                  </label>
                </div>
                <div className="bg-white border-2 border-blue-300 rounded-md shadow-sm">
                  <Combobox value={cliente} onChange={handleSelectCustomer}>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-blue-500" />
                      </div>
                      <Combobox.Input
                        displayValue={(c: Cliente) => c.nombre ? `${c.nombre} ${c.apellido_paterno || ''}`.trim() : ''}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isSearching ? "Buscando..." : "Buscar por nombre, teléfono o email..."}
                        className="w-full p-3 pl-10 border-none rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder-blue-400"
                      />

                      {isSearching && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
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
              </div>
            )}
            
            {/* Cliente Form Fields */}
            <div className="space-y-6">
              <div className="border-t pt-4 border-blue-200">
                <h4 className="font-medium mb-3 text-blue-800">Información del Cliente</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Nombre*</label>
                      {formErrors.nombre && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.nombre}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="nombre"
                      value={cliente.nombre}
                      onChange={handleClienteChange}
                      className={`mt-1 block w-full border ${formErrors.nombre ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                      required
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Apellido Paterno*</label>
                      {formErrors.apellido_paterno && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.apellido_paterno}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="apellido_paterno"
                      value={cliente.apellido_paterno}
                      onChange={handleClienteChange}
                      className={`mt-1 block w-full border ${formErrors.apellido_paterno ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Apellido Materno</label>
                      {formErrors.apellido_materno && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.apellido_materno}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="apellido_materno"
                      value={cliente.apellido_materno}
                      onChange={handleClienteChange}
                      className={`mt-1 block w-full border ${formErrors.apellido_materno ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Teléfono*</label>
                      {formErrors.telefono && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.telefono}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="telefono"
                        value={cliente.telefono}
                        onChange={handleClienteChange}
                        className={`pl-10 mt-1 block w-full border ${formErrors.telefono ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Email*</label>
                      {formErrors.email && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.email}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={cliente.email}
                        onChange={handleClienteChange}
                        className={`pl-10 mt-1 block w-full border ${formErrors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Tipo*</label>
                      {formErrors.tipo && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.tipo}
                        </span>
                      )}
                    </div>
                    <select
                      name="tipo"
                      value={cliente.tipo}
                      onChange={handleClienteChange}
                      className={`mt-1 block w-full border ${formErrors.tipo ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
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
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-medium text-gray-700">Razón Social</label>
                          {formErrors.razon_social && (
                            <span className="text-xs text-red-500 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {formErrors.razon_social}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          name="razon_social"
                          value={cliente.razon_social}
                          onChange={handleClienteChange}
                          className={`mt-1 block w-full border ${formErrors.razon_social ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-medium text-gray-700">RFC</label>
                          {formErrors.rfc && (
                            <span className="text-xs text-red-500 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {formErrors.rfc}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          name="rfc"
                          value={cliente.rfc}
                          onChange={handleClienteChange}
                          className={`mt-1 block w-full border ${formErrors.rfc ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
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
              </div>

              {/* Address Section */}
              <div className="border-t pt-4 mt-4 border-blue-100">
                <h4 className="font-medium mb-3 text-blue-800">Dirección</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Calle*</label>
                      {formErrors.calle && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.calle}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="calle"
                      value={cliente.calle}
                      onChange={handleClienteChange}
                      className={`mt-1 block w-full border ${formErrors.calle ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Número Exterior*</label>
                      {formErrors.numero_exterior && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.numero_exterior}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="numero_exterior"
                      value={cliente.numero_exterior}
                      onChange={handleClienteChange}
                      className={`mt-1 block w-full border ${formErrors.numero_exterior ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Número Interior</label>
                      {formErrors.numero_interior && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.numero_interior}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="numero_interior"
                      value={cliente.numero_interior || ''}
                      onChange={handleClienteChange}
                      className={`mt-1 block w-full border ${formErrors.numero_interior ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Código Postal*</label>
                      {(formErrors.codigo_postal || !zipValidation) && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.codigo_postal || "Código postal no válido"}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="codigo_postal"
                      value={cliente.codigo_postal}
                      onChange={handleZipChange}
                      className={`mt-1 block w-full border ${formErrors.codigo_postal || !zipValidation ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                      maxLength={5}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Colonia*</label>
                      {formErrors.colonia && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.colonia}
                        </span>
                      )}
                    </div>
                    <div className="relative">
  <select
    name="colonia"
    value={cliente.colonias?.includes(cliente.colonia) ? cliente.colonia : "custom"}
    onChange={(e) => {
      if (e.target.value === "custom") {
        // If "Otra colonia" is selected, keep the current value
        return;
      }
      setCliente(prev => {
        if (!prev) return prev;
        return { ...prev, colonia: e.target.value };
      });
    }}
    className={`mt-1 block w-full border ${formErrors.colonia ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
    required
  >
    <option value="">Escribe la colonia si no está en la lista</option>
    {cliente.colonias?.map((colonia, index) => (
      <option key={index} value={colonia}>{colonia}</option>
    ))}
    {/* Show current colonia as option if it's not in the list */}
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
      className={`mt-1 block w-full border ${formErrors.colonia ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
      required
    />
  )}
</div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Municipio*</label>
                      {formErrors.municipio && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.municipio}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="municipio"
                      value={cliente.municipio || ''}
                      onChange={handleClienteChange}
                      className={`mt-1 block w-full border ${formErrors.municipio ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                      required
                      readOnly={!!cliente.codigo_postal && zipValidation}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Estado*</label>
                      {formErrors.estado && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.estado}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="estado"
                      value={cliente.estado || ''}
                      onChange={handleClienteChange}
                      className={`mt-1 block w-full border ${formErrors.estado ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                      required
                      readOnly={!!cliente.codigo_postal && zipValidation}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">País*</label>
                      {formErrors.pais && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {formErrors.pais}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="pais"
                      value={cliente.pais || 'México'}
                      onChange={handleClienteChange}
                      className={`mt-1 block w-full border ${formErrors.pais ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                      required
                    />
                  </div>
                </div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Referencia</label>
                    {formErrors.referencia && (
                      <span className="text-xs text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.referencia}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    name="referencia"
                    value={cliente.referencia || ''}
                    onChange={handleClienteChange}
                    placeholder="Referencias para ubicar la dirección"
                    className={`mt-1 block w-full border ${formErrors.referencia ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                  />
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Notas</label>
                    {formErrors.notas && (
                      <span className="text-xs text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.notas}
                      </span>
                    )}
                  </div>
                  <textarea
                    name="notas"
                    value={cliente.notas || ''}
                    onChange={handleClienteChange}
                    rows={3}
                    placeholder="Información adicional sobre el cliente"
                    className={`mt-1 block w-full border ${formErrors.notas ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md p-2 bg-white`}
                  ></textarea>
                </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none flex justify-end items-end pb-2">
            <ArrowDown className="h-5 w-5 text-gray-500 animate-bounce" />
          </div>
        </div>
        
        {/* Fixed footer with buttons */}
        <div className="border-t bg-gray-50 p-4 flex justify-end gap-3 sticky bottom-0">
          <button
            type="button"
            onClick={() => {
              if (isExistingCustomer) {
                if (confirm("¿Estás seguro de eliminar los cambios?")) {
                  if (initialCliente) {
                    setCliente(initialCliente);
                  } else {
                    setCliente({
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
                    });
                  }
                  setFormErrors({});
                }
              } else {
                setCliente({
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
                });
                setFormErrors({});
              }
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          >
            {isExistingCustomer ? 'Restaurar' : 'Limpiar'}
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
            className={`px-4 py-2 rounded-md text-white ${isFormValid() 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-blue-300 cursor-not-allowed'
            }`}
            disabled={!isFormValid()}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}