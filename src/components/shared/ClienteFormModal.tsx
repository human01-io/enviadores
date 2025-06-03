// src/components/shared/ClienteFormModal.tsx
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
  ChevronDown,
  Plus,
  ChevronsUpDown
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
          const newErrors = { ...prev };
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
      const newErrors = { ...formErrors };
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

  const handleColoniaUpdate = (newColonia: string) => {
    // Update the state directly
    setCliente(prev => prev ? { ...prev, colonia: newColonia } : prev);
    
    // Clear any validation errors for colonia
    if (formErrors.colonia) {
      const newErrors = { ...formErrors };
      delete newErrors.colonia;
      setFormErrors(newErrors);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl h-[95vh] flex flex-col overflow-hidden">

        {/* Sticky Header */}
        <div className="flex items-center justify-between p-3 border-b bg-white sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {isExistingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              {isExistingCustomer && cliente.id && (
                <p className="text-xs text-gray-500">ID Cliente: {cliente.id}</p>
              )}
            </div>
          </div>
          <button onClick={handleClose} className="rounded-full p-2 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search Box */}
        {!initialCliente && (
          <div className="p-2 bg-gray-50">
            <Combobox value={cliente} onChange={handleSelectCustomer}>
              <div className="relative">
                <Combobox.Input
                  displayValue={(c: Cliente) => c?.nombre ? `${c.nombre} ${c.apellido_paterno || ''}`.trim() : ''}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar cliente por nombre, teléfono o email..."
                  className="w-full pl-10 pr-10 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                {isSearching && (
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  </div>
                )}

                <Combobox.Options className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {customerSuggestions.length === 0 && searchQuery !== '' ? (
                    <div className="relative cursor-default select-none py-3 px-3 text-gray-700 text-center text-sm">
                      No se encontraron clientes
                    </div>
                  ) : (
                    customerSuggestions.map((customer) => (
                      <Combobox.Option
                        key={customer.id || customer.telefono}
                        value={customer}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-8 pr-4 text-sm ${active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
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
                              <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-blue-600">
                                <Check className="h-3 w-3" />
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
        <div className="flex space-x-1 px-4 mt-2 bg-gray-50">
          <button
            onClick={() => setActiveSection('personal')}
            className={`flex-1 py-2 text-sm rounded-t-lg ${activeSection === 'personal' ? 'bg-white text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
          >
            Información Personal
          </button>
          <button
            onClick={() => setActiveSection('address')}
            className={`flex-1 py-2 text-sm rounded-t-lg ${activeSection === 'address' ? 'bg-white text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
          >
            Dirección
          </button>
        </div>

        {/* Scrollable Form Section */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeSection === 'personal' ? (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <div className="space-y-3">
                <FormField label="Tipo de Cliente" required>
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
</FormField>

                {cliente.tipo === 'empresa' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg">
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
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={isClienteActive(cliente)}
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
            <div className="space-y-4">
              {/* Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

              {/* Enhanced Colonia Field */}
              <FormField
                label="Colonia"
                required
                error={getFieldError('colonia')}
              >
                <div className="space-y-2">
                  {/* Main input with dropdown button */}
                  <div className="flex gap-2">
                    {/* Input field */}
                    <input
                      type="text"
                      name="colonia"
                      value={cliente.colonia || ''}
                      onChange={handleClienteChange}
                      placeholder="Escribir colonia"
                      className={`flex-1 ${inputClassName(getFieldError('colonia'))}`}
                    />
                    
                    {/* Dropdown button */}
                    {cliente.colonias && cliente.colonias.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowColoniaDropdown(!showColoniaDropdown);
                          setColoniaSearchQuery('');
                        }}
                        className="rounded-full p-2 hover:bg-gray-100 border border-gray-300"
                      >
                        <ChevronsUpDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown menu */}
                  {showColoniaDropdown && cliente.colonias && cliente.colonias.length > 0 && (
                    <div className="relative" data-colonia-dropdown="true">
                      <div className="absolute z-[60] w-full bg-white border rounded-lg shadow-lg">
                        {/* Search header */}
                        <div className="p-2 border-b bg-gray-50">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                              <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              placeholder="Buscar colonia..."
                              value={coloniaSearchQuery}
                              onChange={(e) => setColoniaSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                            />
                          </div>
                          {/* Clear search button when there's a search query */}
                          {coloniaSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setColoniaSearchQuery('')}
                              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                              Mostrar todas las colonias
                            </button>
                          )}
                        </div>
                        
                        {/* Results list */}
                        <div className="max-h-48 overflow-y-auto">
                          {/* Current input as custom option (if not empty and not in list) */}
                          {cliente.colonia && 
                           cliente.colonia.trim() && 
                           !cliente.colonias.some(colonia => 
                             colonia.toLowerCase() === cliente.colonia.toLowerCase()
                           ) && 
                           (coloniaSearchQuery === '' || cliente.colonia.toLowerCase().includes(coloniaSearchQuery.toLowerCase())) && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowColoniaDropdown(false);
                                setColoniaSearchQuery('');
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 transition-colors border-b bg-green-25"
                            >
                              <div className="flex items-center">
                                <Plus className="h-4 w-4 text-green-600 mr-2" />
                                <span className="text-green-800">
                                  Usar "<strong>{cliente.colonia}</strong>" (personalizada)
                                </span>
                              </div>
                            </button>
                          )}

                          {/* Show filtered or all colonias */}
                          {(() => {
                            const filteredColonias = coloniaSearchQuery === '' 
                              ? cliente.colonias // Show all if no search query
                              : cliente.colonias.filter(colonia =>
                                  colonia.toLowerCase().includes(coloniaSearchQuery.toLowerCase())
                                );

                            return filteredColonias.map((colonia, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  handleColoniaUpdate(colonia);
                                  setShowColoniaDropdown(false);
                                  setColoniaSearchQuery('');
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors border-b last:border-b-0 ${
                                  cliente.colonia === colonia ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-900'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{colonia}</span>
                                  {cliente.colonia === colonia && (
                                    <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            ));
                          })()}
                          
                          {/* No results when searching */}
                          {coloniaSearchQuery !== '' && 
                           cliente.colonias.filter(colonia =>
                             colonia.toLowerCase().includes(coloniaSearchQuery.toLowerCase())
                           ).length === 0 && (
                            <div className="px-3 py-6 text-sm text-gray-500 text-center">
                              <Search className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                              <p>No se encontraron colonias con "{coloniaSearchQuery}"</p>
                              <p className="text-xs mt-1">
                                Puedes escribir "{coloniaSearchQuery}" directamente en el campo de arriba
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Footer with better info */}
                        <div className="p-2 border-t bg-gray-50 flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {coloniaSearchQuery === '' ? (
                              `${cliente.colonias.length} colonias disponibles`
                            ) : (
                              `${cliente.colonias.filter(colonia =>
                                colonia.toLowerCase().includes(coloniaSearchQuery.toLowerCase())
                              ).length} de ${cliente.colonias.length} colonias`
                            )}
                          </span>
                          <div className="flex gap-1">
                            {coloniaSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setColoniaSearchQuery('')}
                                className="px-3 py-1 text-xs font-medium text-blue-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                              >
                                Ver todas
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setShowColoniaDropdown(false);
                                setColoniaSearchQuery('');
                              }}
                              className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                              Cerrar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick suggestions when dropdown is closed */}
                  {!showColoniaDropdown && cliente.colonias && cliente.colonias.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-gray-500 mr-2">Sugerencias:</span>
                      {cliente.colonias.slice(0, 3).map((colonia, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleColoniaUpdate(colonia)}
                          className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          {colonia}
                        </button>
                      ))}
                      {cliente.colonias.length > 3 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowColoniaDropdown(true);
                            setColoniaSearchQuery('');
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          +{cliente.colonias.length - 3} más
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-3 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCliente(defaultCliente)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              {isExistingCustomer ? 'Restaurar' : 'Limpiar'}
            </button>
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
          <button
            onClick={handleSaveCustomer}
            disabled={!isFormValid()}
            className={`px-4 py-1.5 text-xs font-medium rounded ${isFormValid() ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            {!isExistingCustomer ? 'Crear Cliente' : hasChanges ? 'Guardar Cambios' : 'Continuar'}
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
        <p className="flex items-center text-sm text-red-600 mt-1">
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// Input styling consistent with base
function inputClassName(error?: string | boolean) {
  return `w-full px-3 py-2 text-sm border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${error
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

const isClienteActive = (cliente: Cliente): boolean => {
  if (typeof cliente.activo === 'number') {
    return cliente.activo === 1;
  }
  if (typeof cliente.activo === 'boolean') {
    return cliente.activo;
  }
  return false;
};