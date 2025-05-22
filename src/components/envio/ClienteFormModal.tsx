import { useState, useEffect, useCallback, useRef } from 'react';
import { Combobox } from '@headlessui/react';
import { apiService } from '../../services/apiService';
import { Cliente } from '../../types';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  X, 
  Search, 
  Check, 
  AlertCircle, 
  Building2,
  Hash,
  FileText,
  Globe,
  Loader2,
  ChevronDown
} from 'lucide-react';

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
  const [isLoadingZip, setIsLoadingZip] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalCliente, setOriginalCliente] = useState<Cliente | null>(null);
  const [activeSection, setActiveSection] = useState<'personal' | 'address'>('personal');
  const [showColoniaDropdown, setShowColoniaDropdown] = useState(false);
  const [coloniaSearchQuery, setColoniaSearchQuery] = useState('');
  
  const lastProcessedZip = useRef<string>('');

  const defaultCliente: Cliente = {
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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (initialCliente) {
        setCliente(initialCliente);
        setOriginalCliente(JSON.parse(JSON.stringify(initialCliente)));
        setIsExistingCustomer(!!initialCliente.id);
        setHasChanges(false);
      } else {
        setCliente(defaultCliente);
        setOriginalCliente(JSON.parse(JSON.stringify(defaultCliente)));
        setIsExistingCustomer(false);
        setHasChanges(false);
      }
      setActiveSection('personal');
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialCliente]);

  // Track changes - improved to exclude auto-populated fields from ZIP lookup
  useEffect(() => {
    if (cliente && originalCliente) {
      // Create copies without auto-populated fields to compare only user changes
      const clienteForComparison = { ...cliente };
      const originalForComparison = { ...originalCliente };
      
      // Remove auto-populated fields that shouldn't count as user changes
      const autoPopulatedFields = ['estado', 'municipio', 'ciudad', 'colonias'];
      autoPopulatedFields.forEach(field => {
        delete clienteForComparison[field];
        delete originalForComparison[field];
      });
      
      // Only consider it a change if user manually modified non-auto-populated fields
      // or if they changed colonia to something different from what was auto-selected
      const hasUserChanges = JSON.stringify(clienteForComparison) !== JSON.stringify(originalForComparison);
      setHasChanges(hasUserChanges);
    }
  }, [cliente, originalCliente]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setCustomerSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await apiService.searchCustomers(query);
        setCustomerSuggestions(results);
      } catch (error) {
        console.error('Customer search failed:', error);
        setCustomerSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Close colonia dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-colonia-dropdown]')) {
        setShowColoniaDropdown(false);
        setColoniaSearchQuery('');
      }
    };

    if (showColoniaDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColoniaDropdown]);

  // ZIP code validation - Fixed to prevent infinite loops and not trigger hasChanges
  const fetchAddressData = useCallback(async (zip: string) => {
    if (!zip || zip.length !== 5) {
      if (zip && zip.length > 0) {
        setFormErrors(prev => ({
          ...prev,
          codigo_postal: "Debe tener 5 dígitos"
        }));
        setZipValidation(false);
      }
      return;
    }

    setIsLoadingZip(true);
    try {
      const response = await fetch(`https://enviadores.com.mx/api/zip_codes.php?zip_code=${zip}`);
      if (!response.ok) throw new Error("Código postal no encontrado");

      const data = await response.json();
      if (data?.zip_codes?.length > 0) {
        const zipData = data.zip_codes[0];
        const colonias = data.zip_codes.map((z: any) => z.d_asenta);
        
        setCliente(prev => {
          if (!prev) return prev;
          
          const updatedCliente = {
            ...prev,
            estado: zipData.d_estado,
            municipio: zipData.d_mnpio,
            ciudad: zipData.d_ciudad || zipData.d_mnpio,
            colonias,
            colonia: (isExistingCustomer && prev.colonia) 
              ? prev.colonia
              : (!prev.colonia || prev.colonia === '' || !colonias.includes(prev.colonia)) 
                ? (colonias[0] || '') 
                : prev.colonia
          };
          
          return updatedCliente;
        });
        
        // Also update the original cliente to include auto-populated data
        // so it doesn't count as user changes
        setOriginalCliente(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            estado: zipData.d_estado,
            municipio: zipData.d_mnpio,
            ciudad: zipData.d_ciudad || zipData.d_mnpio,
            colonias,
            // Only update original colonia if it was empty or we're creating new
            colonia: (!isExistingCustomer && (!prev.colonia || prev.colonia === '')) 
              ? (colonias[0] || '') 
              : prev.colonia
          };
        });
        
        setZipValidation(true);
        
        // Clear related errors without depending on formErrors state
        setFormErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.codigo_postal;
          delete newErrors.estado;
          delete newErrors.municipio;
          return newErrors;
        });
      } else {
        throw new Error("No se encontraron datos para este código postal");
      }
    } catch (error) {
      console.error("Error fetching address data:", error);
      setZipValidation(false);
      setFormErrors(prev => ({
        ...prev,
        codigo_postal: "Código postal no válido o no encontrado"
      }));
    } finally {
      setIsLoadingZip(false);
    }
  }, [isExistingCustomer]);

  useEffect(() => {
    if (cliente?.codigo_postal && 
        cliente.codigo_postal.length === 5 && 
        cliente.codigo_postal !== lastProcessedZip.current) {
      
      lastProcessedZip.current = cliente.codigo_postal;
      fetchAddressData(cliente.codigo_postal);
    }
  }, [cliente?.codigo_postal, fetchAddressData]);

  const handleSelectCustomer = (selectedCustomer: Cliente | null) => {
    if (!selectedCustomer) {
      setSearchQuery('');
      setCustomerSuggestions([]);
      return;
    }

    setCliente(selectedCustomer);
    setOriginalCliente(JSON.parse(JSON.stringify(selectedCustomer)));
    setIsExistingCustomer(!!selectedCustomer.id);
    setSearchQuery('');
    setCustomerSuggestions([]);
    setFormErrors({});
    setHasChanges(false);
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (!cliente) return;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCliente(prev => prev ? { ...prev, [name]: checked ? 1 : 0 } : prev);
    } else {
      setCliente(prev => prev ? { ...prev, [name]: value } : prev);
    }
    
    // Clear field error
    if (formErrors[name]) {
      const newErrors = {...formErrors};
      delete newErrors[name];
      setFormErrors(newErrors);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setCliente(prev => prev ? { ...prev, codigo_postal: value } : prev);
  };

  const validateForm = () => {
    if (!cliente) return false;
    
    const errors: Record<string, string> = {};
    
    if (!cliente.nombre?.trim()) errors.nombre = "El nombre es obligatorio";
    if (!cliente.apellido_paterno?.trim()) errors.apellido_paterno = "El apellido paterno es obligatorio";
    if (!cliente.telefono?.trim()) errors.telefono = "El teléfono es obligatorio";
    if (!cliente.email?.trim()) {
      errors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) {
      errors.email = "El formato de email no es válido";
    }
    if (!cliente.calle?.trim()) errors.calle = "La calle es obligatoria";
    if (!cliente.numero_exterior?.trim()) errors.numero_exterior = "El número exterior es obligatorio";
    if (!cliente.colonia?.trim()) errors.colonia = "La colonia es obligatoria";
    if (!cliente.codigo_postal?.trim()) {
      errors.codigo_postal = "El código postal es obligatorio";
    } else if (cliente.codigo_postal.length !== 5) {
      errors.codigo_postal = "El código postal debe tener 5 dígitos";
    }
    if (!cliente.municipio?.trim()) errors.municipio = "El municipio es obligatorio";
    if (!cliente.estado?.trim()) errors.estado = "El estado es obligatorio";
    
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
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email) &&
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

  const handleSaveCustomer = async () => {
    if (!validateForm() || !cliente) return;

    try {
      // If it's an existing customer but no changes were made, just continue
      if (isExistingCustomer && !hasChanges) {
        onClientSaved(cliente);
        return;
      }

      // Save changes for existing customers or create new customer
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

  const handleClose = () => {
    setSearchQuery('');
    setCustomerSuggestions([]);
    setFormErrors({});
    onClose();
  };

  const getFieldError = (fieldName: string) => formErrors[fieldName];

  if (!isOpen || !cliente) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isExistingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              {isExistingCustomer && cliente.id && (
                <p className="text-sm text-gray-600">ID: {cliente.id}</p>
              )}
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search Section - Only for new clients */}
          {!initialCliente && (
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar cliente existente
              </label>
              <Combobox value={cliente} onChange={handleSelectCustomer}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Combobox.Input
                    displayValue={(c: Cliente) => c?.nombre ? `${c.nombre} ${c.apellido_paterno || ''}`.trim() : ''}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre, teléfono o email..."
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />

                  {isSearching && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    </div>
                  )}

                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {customerSuggestions.length === 0 && searchQuery !== '' ? (
                      <div className="relative cursor-default select-none py-4 px-4 text-gray-700 text-center">
                        No se encontraron clientes
                      </div>
                    ) : (
                      customerSuggestions.map((customer) => (
                        <Combobox.Option
                          key={customer.id || customer.telefono}
                          value={customer}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-3 pl-10 pr-4 ${
                              active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                            }`
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
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setActiveSection('personal')}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'personal'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Información Personal
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('address')}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'address'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MapPin className="h-4 w-4 inline mr-2" />
              Dirección
            </button>
          </div>

          {/* Form Content */}
          <div className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${
            showColoniaDropdown ? 'pb-80' : 'pb-6'
          }`}>
            {activeSection === 'personal' ? (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="Nombre"
                    required
                    error={getFieldError('nombre')}
                    icon={<User className="h-4 w-4" />}
                  >
                    <input
                      type="text"
                      name="nombre"
                      value={cliente.nombre}
                      onChange={handleClienteChange}
                      className={inputClassName(getFieldError('nombre'))}
                      placeholder="Nombre completo"
                    />
                  </FormField>

                  <FormField
                    label="Apellido Paterno"
                    required
                    error={getFieldError('apellido_paterno')}
                  >
                    <input
                      type="text"
                      name="apellido_paterno"
                      value={cliente.apellido_paterno}
                      onChange={handleClienteChange}
                      className={inputClassName(getFieldError('apellido_paterno'))}
                      placeholder="Apellido paterno"
                    />
                  </FormField>

                  <FormField
                    label="Apellido Materno"
                    error={getFieldError('apellido_materno')}
                  >
                    <input
                      type="text"
                      name="apellido_materno"
                      value={cliente.apellido_materno}
                      onChange={handleClienteChange}
                      className={inputClassName(getFieldError('apellido_materno'))}
                      placeholder="Apellido materno"
                    />
                  </FormField>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Teléfono"
                    required
                    error={getFieldError('telefono')}
                    icon={<Phone className="h-4 w-4" />}
                  >
                    <input
                      type="tel"
                      name="telefono"
                      value={cliente.telefono}
                      onChange={handleClienteChange}
                      className={inputClassName(getFieldError('telefono'))}
                      placeholder="10 dígitos"
                      maxLength={10}
                    />
                  </FormField>

                  <FormField
                    label="Email"
                    required
                    error={getFieldError('email')}
                    icon={<Mail className="h-4 w-4" />}
                  >
                    <input
                      type="email"
                      name="email"
                      value={cliente.email}
                      onChange={handleClienteChange}
                      className={inputClassName(getFieldError('email'))}
                      placeholder="correo@ejemplo.com"
                    />
                  </FormField>
                </div>

                {/* Business Info */}
                <div className="space-y-4">
                  <FormField label="Tipo de Cliente" required>
                    <div className="relative">
                      <select
                        name="tipo"
                        value={cliente.tipo}
                        onChange={handleClienteChange}
                        className={inputClassName(getFieldError('tipo'))}
                      >
                        <option value="persona">Persona Física</option>
                        <option value="empresa">Empresa</option>
                        <option value="gobierno">Gobierno</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </FormField>

                  {cliente.tipo === 'empresa' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                      <FormField
                        label="Razón Social"
                        icon={<Building2 className="h-4 w-4" />}
                      >
                        <input
                          type="text"
                          name="razon_social"
                          value={cliente.razon_social}
                          onChange={handleClienteChange}
                          className={inputClassName(getFieldError('razon_social'))}
                          placeholder="Nombre de la empresa"
                        />
                      </FormField>

                      <FormField
                        label="RFC"
                        icon={<Hash className="h-4 w-4" />}
                      >
                        <input
                          type="text"
                          name="rfc"
                          value={cliente.rfc}
                          onChange={handleClienteChange}
                          className={inputClassName(getFieldError('rfc'))}
                          placeholder="RFC de la empresa"
                        />
                      </FormField>
                    </div>
                  )}
                </div>

                {/* Status - only for existing customers */}
                {isExistingCustomer && (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <input 
                      type="checkbox"
                      name="activo"
                      checked={cliente.activo === 1 || cliente.activo === true}
                      onChange={handleClienteChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Cliente Activo
                    </label>
                  </div>
                )}

                {/* Notes */}
                <FormField
                  label="Notas"
                  icon={<FileText className="h-4 w-4" />}
                >
                  <textarea
                    name="notas"
                    value={cliente.notas || ''}
                    onChange={handleClienteChange}
                    rows={3}
                    className={inputClassName(getFieldError('notas'))}
                    placeholder="Información adicional sobre el cliente"
                  />
                </FormField>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Address Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="Código Postal"
                    required
                    error={getFieldError('codigo_postal')}
                    icon={isLoadingZip ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hash className="h-4 w-4" />}
                  >
                    <input
                      type="text"
                      name="codigo_postal"
                      value={cliente.codigo_postal}
                      onChange={handleZipChange}
                      className={inputClassName(getFieldError('codigo_postal') || !zipValidation)}
                      placeholder="5 dígitos"
                      maxLength={5}
                    />
                  </FormField>

                  <FormField
                    label="Estado"
                    required
                    error={getFieldError('estado')}
                    icon={<Globe className="h-4 w-4" />}
                  >
                    <input
                      type="text"
                      name="estado"
                      value={cliente.estado || ''}
                      onChange={handleClienteChange}
                      className={inputClassName(getFieldError('estado'))}
                      readOnly={!!cliente.codigo_postal && zipValidation}
                      placeholder="Estado"
                    />
                  </FormField>

                  <FormField
                    label="Municipio"
                    required
                    error={getFieldError('municipio')}
                    icon={<MapPin className="h-4 w-4" />}
                  >
                    <input
                      type="text"
                      name="municipio"
                      value={cliente.municipio || ''}
                      onChange={handleClienteChange}
                      className={inputClassName(getFieldError('municipio'))}
                      readOnly={!!cliente.codigo_postal && zipValidation}
                      placeholder="Municipio"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Calle"
                    required
                    error={getFieldError('calle')}
                    icon={<MapPin className="h-4 w-4" />}
                  >
                    <input
                      type="text"
                      name="calle"
                      value={cliente.calle}
                      onChange={handleClienteChange}
                      className={inputClassName(getFieldError('calle'))}
                      placeholder="Nombre de la calle"
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      label="Núm. Ext."
                      required
                      error={getFieldError('numero_exterior')}
                    >
                      <input
                        type="text"
                        name="numero_exterior"
                        value={cliente.numero_exterior}
                        onChange={handleClienteChange}
                        className={inputClassName(getFieldError('numero_exterior'))}
                        placeholder="123"
                      />
                    </FormField>

                    <FormField label="Núm. Int.">
                      <input
                        type="text"
                        name="numero_interior"
                        value={cliente.numero_interior || ''}
                        onChange={handleClienteChange}
                        className={inputClassName(getFieldError('numero_interior'))}
                        placeholder="A, B, 2"
                      />
                    </FormField>
                  </div>
                </div>

                <FormField
                  label="Colonia"
                  required
                  error={getFieldError('colonia')}
                >
                  <div className="space-y-2">
                    {/* Main input field */}
                    <div className="relative">
                      <input
                        type="text"
                        name="colonia"
                        value={cliente.colonia || ''}
                        onChange={(e) => {
                          handleClienteChange(e);
                          // Show dropdown when typing
                          if (cliente.colonias && cliente.colonias.length > 0) {
                            setShowColoniaDropdown(true);
                          }
                        }}
                        onFocus={() => {
                          if (cliente.colonias && cliente.colonias.length > 0) {
                            setShowColoniaDropdown(true);
                          }
                        }}
                        placeholder="Escribir o seleccionar colonia"
                        className={inputClassName(getFieldError('colonia'))}
                      />
                      
                      {/* Dropdown toggle button */}
                      {cliente.colonias && cliente.colonias.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowColoniaDropdown(!showColoniaDropdown)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${showColoniaDropdown ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                    
                    {/* Custom dropdown */}
                    {showColoniaDropdown && cliente.colonias && cliente.colonias.length > 0 && (
                      <div className="relative">
                        <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-2xl">
                          {/* Search within colonias */}
                          <div className="p-3 border-b border-gray-100 bg-gray-50">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                placeholder="Buscar colonia..."
                                value={coloniaSearchQuery}
                                onChange={(e) => setColoniaSearchQuery(e.target.value)}
                                className="w-full pl-10 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                              />
                            </div>
                          </div>
                          
                          {/* Filtered colonias list - increased height when dropdown is open */}
                          <div className="max-h-60 overflow-y-auto">
                            {cliente.colonias
                              .filter(colonia => 
                                colonia.toLowerCase().includes((coloniaSearchQuery || cliente.colonia || '').toLowerCase())
                              )
                              .map((colonia, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => {
                                    setCliente(prev => prev ? { ...prev, colonia } : prev);
                                    setShowColoniaDropdown(false);
                                    setColoniaSearchQuery('');
                                  }}
                                  className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                                    cliente.colonia === colonia ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-900'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{colonia}</span>
                                    {cliente.colonia === colonia && (
                                      <Check className="h-4 w-4 text-blue-600" />
                                    )}
                                  </div>
                                </button>
                              ))
                            }
                            
                            {/* No results message */}
                            {cliente.colonias.filter(colonia => 
                              colonia.toLowerCase().includes((coloniaSearchQuery || cliente.colonia || '').toLowerCase())
                            ).length === 0 && (
                              <div className="px-4 py-8 text-sm text-gray-500 text-center">
                                <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p>No se encontraron colonias</p>
                                <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Footer with close button and count */}
                          <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {cliente.colonias.filter(colonia => 
                                colonia.toLowerCase().includes((coloniaSearchQuery || cliente.colonia || '').toLowerCase())
                              ).length} de {cliente.colonias.length} colonias
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowColoniaDropdown(false);
                                setColoniaSearchQuery('');
                              }}
                              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              Cerrar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Quick suggestion chips - only show when dropdown is closed */}
                    {!showColoniaDropdown && cliente.colonias && cliente.colonias.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-gray-500 mr-2">Sugerencias:</span>
                        {cliente.colonias.slice(0, 3).map((colonia, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setCliente(prev => prev ? { ...prev, colonia } : prev)}
                            className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                          >
                            {colonia}
                          </button>
                        ))}
                        {cliente.colonias.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setShowColoniaDropdown(true)}
                            className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            Ver todas ({cliente.colonias.length})
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="País"
                    required
                    error={getFieldError('pais')}
                    icon={<Globe className="h-4 w-4" />}
                  >
                    <input
                      type="text"
                      name="pais"
                      value={cliente.pais || 'México'}
                      onChange={handleClienteChange}
                      className={inputClassName(getFieldError('pais'))}
                      placeholder="País"
                    />
                  </FormField>

                  <FormField
                    label="Referencia"
                    error={getFieldError('referencia')}
                  >
                    <input
                      type="text"
                      name="referencia"
                      value={cliente.referencia || ''}
                      onChange={handleClienteChange}
                      className={inputClassName(getFieldError('referencia'))}
                      placeholder="Referencias para ubicar"
                    />
                  </FormField>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                if (isExistingCustomer && hasChanges) {
                  if (confirm("¿Estás seguro de eliminar los cambios?")) {
                    if (initialCliente) {
                      setCliente(initialCliente);
                    } else {
                      setCliente(defaultCliente);
                    }
                    setFormErrors({});
                  }
                } else {
                  setCliente(defaultCliente);
                  setFormErrors({});
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {isExistingCustomer ? 'Restaurar' : 'Limpiar'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancelar
            </button>
          </div>
          
          <button
            type="button"
            onClick={handleSaveCustomer}
            disabled={!isFormValid()}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isFormValid()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {/* Context-aware button text for shipping process */}
            {!isExistingCustomer 
              ? 'Crear Cliente'
              : hasChanges 
                ? 'Guardar Cambios'
                : 'Continuar'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function FormField({ label, required = false, error, icon, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <div className={icon ? "pl-10" : ""}>{children}</div>
      </div>
      {error && (
        <p className="flex items-center text-xs text-red-600 mt-1">
          <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function inputClassName(error?: string | boolean) {
  return `w-full px-3 py-2.5 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${
    error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
  } disabled:bg-gray-50 disabled:text-gray-500 read-only:bg-gray-50 read-only:text-gray-600`;
}

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}