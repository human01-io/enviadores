import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../../services/apiService';
import { Destino } from '../../types';
import { 
  MapPin, 
  Search, 
  X, 
  Check, 
  Globe, 
  Eye, 
  Phone, 
  Mail, 
  MapPinned, 
  AlertCircle,
  Building,
  Hash,
  FileText,
  Loader2,
  ChevronDown,
  Star,
  Clock,
  Filter
} from 'lucide-react';

interface DestinoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDestinoSaved: (destino: Destino) => void;
  initialDestino?: Destino | null;
  clienteId?: string | null;
}

export default function DestinoFormModal({
  isOpen,
  onClose,
  onDestinoSaved,
  initialDestino,
  clienteId
}: DestinoFormModalProps) {
  const DEFAULT_DESTINO: Destino = {
    cliente_id: clienteId || '',
    alias: '',
    nombre_destinatario: '',
    direccion: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigo_postal: '',
    pais: 'México',
    telefono: '',
    email: '',
    referencia: '',
    instrucciones_entrega: '',
    colonias: []
  };

  const [destinoSearchQuery, setDestinoSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [destinoSuggestions, setDestinoSuggestions] = useState<Destino[]>([]);
  const [isExistingDestino, setIsExistingDestino] = useState(false);
  const [destino, setDestino] = useState<Destino>(DEFAULT_DESTINO);
  const [zipValidation, setZipValidation] = useState(true);
  const [isLoadingZip, setIsLoadingZip] = useState(false);
  const [clienteData, setClienteData] = useState<any>(null);
  const [isBrowsingDestinos, setIsBrowsingDestinos] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | 'recent'>('all');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<'basic' | 'address' | 'delivery'>('basic');
  const [showColoniaDropdown, setShowColoniaDropdown] = useState(false);
  const [coloniaSearchQuery, setColoniaSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalDestino, setOriginalDestino] = useState<Destino>(DEFAULT_DESTINO);

  const destinoDropdownRef = useRef<HTMLDivElement>(null);
  const lastProcessedZip = useRef<string>('');

  // Filter destinations based on search query and filter mode
  const filteredDestinos = destinoSuggestions.filter(dest => {
    const matchesSearch = destinoSearchQuery.trim() === '' || 
      `${dest.nombre_destinatario || ''} ${dest.direccion || ''} ${dest.colonia || ''} ${dest.ciudad || ''} ${dest.codigo_postal || ''}`
        .toLowerCase()
        .includes(destinoSearchQuery.toLowerCase());
    
    if (filterMode === 'favorites') {
      return matchesSearch && dest.favorite === true;
    } else if (filterMode === 'recent') {
      return matchesSearch && dest.recent === true;
    }
    
    return matchesSearch;
  });

  // Group destinations by state
  const groupedDestinos = filteredDestinos.reduce((groups: Record<string, Destino[]>, dest) => {
    const state = dest.estado || 'Sin Estado';
    if (!groups[state]) {
      groups[state] = [];
    }
    groups[state].push(dest);
    return groups;
  }, {});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (initialDestino) {
        setDestino(initialDestino);
        setOriginalDestino(JSON.parse(JSON.stringify(initialDestino))); // Deep copy
        setIsExistingDestino(true);
        setHasChanges(false);
        if (initialDestino.cliente_id) {
          fetchCliente(initialDestino.cliente_id);
        }
      } else {
        const newDestino = {
          ...DEFAULT_DESTINO,
          cliente_id: clienteId || ''
        };
        setDestino(newDestino);
        setOriginalDestino(JSON.parse(JSON.stringify(newDestino))); // Deep copy
        resetForm();
      }
      setActiveSection('basic');
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialDestino, clienteId]);

  // Track changes - improved to exclude auto-populated fields from ZIP lookup
  useEffect(() => {
    if (destino && originalDestino) {
      // Create copies without auto-populated fields to compare only user changes
      const destinoForComparison = { ...destino };
      const originalForComparison = { ...originalDestino };
      
      // Remove auto-populated fields that shouldn't count as user changes
      const autoPopulatedFields = ['estado', 'ciudad', 'colonias'];
      autoPopulatedFields.forEach(field => {
        delete destinoForComparison[field];
        delete originalForComparison[field];
      });
      
      // Only consider it a change if user manually modified non-auto-populated fields
      const hasUserChanges = JSON.stringify(destinoForComparison) !== JSON.stringify(originalForComparison);
      setHasChanges(hasUserChanges);
    }
  }, [destino, originalDestino]);

  // Close destination dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (destinoDropdownRef.current && !destinoDropdownRef.current.contains(event.target as Node)) {
        setIsBrowsingDestinos(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close colonia dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-destino-colonia-dropdown]')) {
        setShowColoniaDropdown(false);
        setColoniaSearchQuery('');
      }
    };

    if (showColoniaDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColoniaDropdown]);

  // Fetch client and destinations when needed
  useEffect(() => {
    if (clienteId) {
      fetchCliente(clienteId);
      fetchDestinosForCliente(clienteId);
    }
  }, [clienteId, destinoSearchQuery]);

  // ZIP code validation - Fixed to prevent infinite loops
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
        
        setDestino(prev => ({
          ...prev,
          estado: zipData.d_estado,
          ciudad: zipData.d_ciudad || zipData.d_mnpio,
          colonias,
          colonia: (isExistingDestino && prev.colonia) 
            ? prev.colonia
            : (!prev.colonia || prev.colonia === '' || !colonias.includes(prev.colonia)) 
              ? (colonias[0] || '') 
              : prev.colonia
        }));
        
        // Also update the original destino to include auto-populated data
        // so it doesn't count as user changes
        setOriginalDestino(prev => ({
          ...prev,
          estado: zipData.d_estado,
          ciudad: zipData.d_ciudad || zipData.d_mnpio,
          colonias,
          // Only update original colonia if it was empty or we're creating new
          colonia: (!isExistingDestino && (!prev.colonia || prev.colonia === '')) 
            ? (colonias[0] || '') 
            : prev.colonia
        }));
        setZipValidation(true);
        
        // Clear related errors without depending on formErrors state
        setFormErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.codigo_postal;
          delete newErrors.estado;
          delete newErrors.ciudad;
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
      
      // Clear the fields on error
      setDestino(prev => ({
        ...prev,
        estado: '',
        ciudad: '',
        colonias: [],
        colonia: ''
      }));
    } finally {
      setIsLoadingZip(false);
    }
  }, [isExistingDestino]);

  useEffect(() => {
    if (destino.codigo_postal && destino.codigo_postal.length === 5) {
      // Always fetch if ZIP code changed, regardless of existing colonias
      if (destino.codigo_postal !== lastProcessedZip.current) {
        lastProcessedZip.current = destino.codigo_postal;
        fetchAddressData(destino.codigo_postal);
      }
    } else {
      // Clear colonias if ZIP is incomplete
      if (destino.codigo_postal && destino.codigo_postal.length > 0 && destino.codigo_postal.length < 5) {
        setDestino(prev => ({
          ...prev,
          colonias: [],
          estado: '',
          ciudad: '',
          colonia: ''
        }));
      }
    }
  }, [destino.codigo_postal, fetchAddressData]);

  const fetchCliente = async (clienteId: string) => {
    try {
      const response = await apiService.searchCustomers(clienteId);
      if (response.length > 0) {
        setClienteData(response[0]);
      }
    } catch (error) {
      console.error('Error fetching client:', error);
    }
  };

const fetchDestinosForCliente = useCallback(
  debounce(async (clientId: string) => {
    try {
      setIsSearching(true);
      const destinos = await apiService.getCustomerDestinations(clientId);
      setDestinoSuggestions(destinos);
    } catch (error) {
      console.error('Error fetching destinations:', error);
      setDestinoSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, 300),
  []
);


  const resetForm = () => {
    setDestino({
      ...DEFAULT_DESTINO,
      cliente_id: clienteId || ''
    });
    setIsExistingDestino(false);
    setZipValidation(true);
    setDestinoSearchQuery('');
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!destino.cliente_id) errors.cliente_id = "Es necesario seleccionar un cliente";
    if (!destino.nombre_destinatario?.trim()) errors.nombre_destinatario = "El nombre es obligatorio";
    if (!destino.direccion?.trim()) errors.direccion = "La dirección es obligatoria";
    if (!destino.colonia?.trim()) errors.colonia = "La colonia es obligatoria";
    if (!destino.ciudad?.trim()) errors.ciudad = "La ciudad es obligatoria";
    if (!destino.estado?.trim()) errors.estado = "El estado es obligatorio";
    if (!destino.codigo_postal?.trim()) {
      errors.codigo_postal = "El código postal es obligatorio";
    } else if (destino.codigo_postal.length !== 5) {
      errors.codigo_postal = "El código postal debe tener 5 dígitos";
    }
    if (!destino.telefono?.trim()) errors.telefono = "El teléfono es obligatorio";
    if (destino.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destino.email)) {
      errors.email = "El email no es válido";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = (): boolean => {
    return (
      !!destino.cliente_id &&
      !!destino.nombre_destinatario?.trim() &&
      !!destino.direccion?.trim() &&
      !!destino.colonia?.trim() &&
      !!destino.ciudad?.trim() &&
      !!destino.estado?.trim() &&
      !!destino.codigo_postal?.trim() &&
      destino.codigo_postal.length === 5 &&
      !!destino.telefono?.trim() &&
      zipValidation
    );
  };

  const handleSelectDestino = (selectedDestino: Destino) => {
    setDestino(selectedDestino);
    setOriginalDestino(JSON.parse(JSON.stringify(selectedDestino))); // Deep copy
    setIsExistingDestino(true);
    setIsBrowsingDestinos(false);
    setFormErrors({});
    setHasChanges(false);
  };

  const handleDestinoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDestino(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      const newErrors = {...formErrors};
      delete newErrors[name];
      setFormErrors(newErrors);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setDestino(prev => ({ ...prev, codigo_postal: value }));
  };

  const handleSaveDestino = async () => {
    if (!validateForm()) return;

    try {
      if (isExistingDestino && destino.id) {
        // If there are changes, save them; otherwise just continue
        if (hasChanges) {
          await apiService.updateDestination(destino.id, destino);
        }
        onDestinoSaved(destino);
      } else {
        // Create new destination
        const newDestino = await apiService.createDestination(destino);
        setDestino(newDestino);
        setIsExistingDestino(true);
        onDestinoSaved(newDestino);
      }
    } catch (error) {
      console.error('Error saving destination:', error);
      alert('Error al guardar el destino. Por favor intenta de nuevo.');
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getFieldError = (fieldName: string) => formErrors[fieldName];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col transition-all duration-300 ${
        showColoniaDropdown ? 'max-h-[98vh]' : 'max-h-[95vh]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isExistingDestino ? 'Editar Destino' : 'Nuevo Destino'}
              </h2>
              {clienteData && (
                <p className="text-sm text-gray-600">
                  {clienteData.nombre} {clienteData.apellido_paterno} • {clienteData.telefono}
                </p>
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
          {/* Destination Browser - Only for existing clients with destinations */}
          {clienteId && destinoSuggestions.length > 0 && !initialDestino && (
            <div className="p-6 border-b border-gray-100 bg-gray-50" ref={destinoDropdownRef}>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Destinos guardados
                </label>
                <button 
                  onClick={() => setIsBrowsingDestinos(!isBrowsingDestinos)}
                  className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm font-medium"
                  type="button"
                >
                  <Eye className="h-4 w-4" />
                  <span>{isBrowsingDestinos ? 'Ocultar' : 'Ver destinos'}</span>
                </button>
              </div>

              {isBrowsingDestinos ? (
                <div className="border rounded-lg shadow-md bg-white">
                  {/* Search and filters */}
                  <div className="p-4 border-b bg-gray-50 space-y-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar destino..."
                        className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={destinoSearchQuery}
                        onChange={(e) => setDestinoSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      {[
                        { key: 'all', label: 'Todos', icon: <Filter className="h-3 w-3" /> },
                        { key: 'favorites', label: 'Favoritos', icon: <Star className="h-3 w-3" /> },
                        { key: 'recent', label: 'Recientes', icon: <Clock className="h-3 w-3" /> }
                      ].map(({ key, label, icon }) => (
                        <button
                          key={key}
                          type="button"
                          className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                            filterMode === key
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                          onClick={() => setFilterMode(key as any)}
                        >
                          {icon}
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Results */}
                  <div className="max-h-80 overflow-y-auto">
                    {Object.entries(groupedDestinos).length > 0 ? (
                      Object.entries(groupedDestinos).map(([state, destinos]) => (
                        <div key={state} className="border-b last:border-0">
                          <div className="bg-gray-50 p-3 sticky top-0 z-10 font-medium text-gray-700 text-sm flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4 text-gray-500" />
                              <span>{state}</span>
                            </div>
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                              {destinos.length}
                            </span>
                          </div>
                          {destinos.map((dest) => (
                            <div
                              key={dest.id}
                              className="cursor-pointer select-none p-4 hover:bg-green-50 border-t first:border-0 border-gray-100 transition-colors"
                              onClick={() => handleSelectDestino(dest)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">{dest.nombre_destinatario}</span>
                                <div className="flex items-center space-x-2">
                                  {dest.alias && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                      {dest.alias}
                                    </span>
                                  )}
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                    {dest.codigo_postal}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">
                                {dest.direccion}, {dest.colonia}, {dest.ciudad}
                              </p>
                            </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-gray-500">
                        {isSearching ? (
                          <div className="flex justify-center items-center space-x-2">
                            <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                            <span>Buscando destinos...</span>
                          </div>
                        ) : destinoSearchQuery ? (
                          <div>
                            <p>No se encontraron destinos</p>
                            <button 
                              type="button"
                              className="mt-2 text-green-600 hover:text-green-800 text-sm font-medium" 
                              onClick={() => setDestinoSearchQuery('')}
                            >
                              Limpiar búsqueda
                            </button>
                          </div>
                        ) : (
                          <div>
                            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="font-medium">No hay destinos guardados</p>
                            <p className="text-sm mt-1">Crea uno nuevo completando el formulario</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={`w-full p-4 border rounded-lg cursor-pointer flex justify-between items-center transition-colors ${
                    isExistingDestino 
                      ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsBrowsingDestinos(true)}
                >
                  <div className="flex items-center space-x-3">
                    {isExistingDestino ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Search className="h-5 w-5 text-gray-500" />
                    )}
                    <span className="text-sm">
                      {isExistingDestino 
                        ? `${destino.nombre_destinatario} - ${destino.direccion}`
                        : 'Seleccionar destino existente'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            {[
              { key: 'basic', label: 'Información Básica', icon: <MapPinned className="h-4 w-4" /> },
              { key: 'address', label: 'Dirección', icon: <MapPin className="h-4 w-4" /> },
              { key: 'delivery', label: 'Entrega', icon: <FileText className="h-4 w-4" /> }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key as any)}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center space-x-2 ${
                  activeSection === key
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${
            showColoniaDropdown ? 'pb-80' : 'pb-6'
          }`}>
            {activeSection === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Alias"
                    error={getFieldError('alias')}
                    icon={<Building className="h-4 w-4" />}
                  >
                    <input
                      type="text"
                      name="alias"
                      value={destino.alias || ''}
                      onChange={handleDestinoChange}
                      className={inputClassName(getFieldError('alias'))}
                      placeholder="Casa, Oficina, Sucursal..."
                    />
                  </FormField>

                  <FormField
                    label="Nombre del Destinatario"
                    required
                    error={getFieldError('nombre_destinatario')}
                    icon={<MapPinned className="h-4 w-4" />}
                  >
                    <input
                      type="text"
                      name="nombre_destinatario"
                      value={destino.nombre_destinatario || ''}
                      onChange={handleDestinoChange}
                      className={inputClassName(getFieldError('nombre_destinatario'))}
                      placeholder="Nombre completo del destinatario"
                    />
                  </FormField>
                </div>

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
                      value={destino.telefono || ''}
                      onChange={handleDestinoChange}
                      className={inputClassName(getFieldError('telefono'))}
                      placeholder="10 dígitos"
                      maxLength={10}
                    />
                  </FormField>

                  <FormField
                    label="Email"
                    error={getFieldError('email')}
                    icon={<Mail className="h-4 w-4" />}
                  >
                    <input
                      type="email"
                      name="email"
                      value={destino.email || ''}
                      onChange={handleDestinoChange}
                      className={inputClassName(getFieldError('email'))}
                      placeholder="correo@ejemplo.com"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {activeSection === 'address' && (
              <div className="space-y-6">
                <FormField
                  label="Dirección"
                  required
                  error={getFieldError('direccion')}
                  icon={<MapPin className="h-4 w-4" />}
                >
                  <input
                    type="text"
                    name="direccion"
                    value={destino.direccion || ''}
                    onChange={handleDestinoChange}
                    className={inputClassName(getFieldError('direccion'))}
                    placeholder="Calle y número completo"
                  />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="Código Postal"
                    required
                    error={getFieldError('codigo_postal')}
                    icon={isLoadingZip ? <Loader2 className="h-4 w-4 animate-spin text-green-500" /> : <Hash className="h-4 w-4" />}
                  >
                    <input
                      type="text"
                      name="codigo_postal"
                      value={destino.codigo_postal || ''}
                      onChange={handleZipChange}
                      className={`${inputClassName(getFieldError('codigo_postal') || !zipValidation)} ${isLoadingZip ? 'bg-green-50' : ''}`}
                      placeholder="5 dígitos"
                      maxLength={5}
                    />
                    {isLoadingZip && (
                      <div className="mt-1 text-xs text-green-600 flex items-center">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Buscando información del código postal...
                      </div>
                    )}
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
                      value={destino.estado || ''}
                      onChange={handleDestinoChange}
                      className={`${inputClassName(getFieldError('estado'))} ${!!destino.codigo_postal && zipValidation ? 'bg-green-50' : ''}`}
                      readOnly={!!destino.codigo_postal && zipValidation}
                      placeholder="Estado"
                    />
                    {!!destino.codigo_postal && zipValidation && destino.estado && (
                      <div className="mt-1 text-xs text-green-600 flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        Auto-completado desde código postal
                      </div>
                    )}
                  </FormField>

                  <FormField
                    label="Ciudad"
                    required
                    error={getFieldError('ciudad')}
                    icon={<Building className="h-4 w-4" />}
                  >
                    <input
                      type="text"
                      name="ciudad"
                      value={destino.ciudad || ''}
                      onChange={handleDestinoChange}
                      className={`${inputClassName(getFieldError('ciudad'))} ${!!destino.codigo_postal && zipValidation ? 'bg-green-50' : ''}`}
                      readOnly={!!destino.codigo_postal && zipValidation}
                      placeholder="Ciudad o municipio"
                    />
                    {!!destino.codigo_postal && zipValidation && destino.ciudad && (
                      <div className="mt-1 text-xs text-green-600 flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        Auto-completado desde código postal
                      </div>
                    )}
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Colonia"
                    required
                    error={getFieldError('colonia')}
                  >
                    <div className="space-y-2" data-destino-colonia-dropdown>
                      {/* Main input field */}
                      <div className="relative">
                        <input
                          type="text"
                          name="colonia"
                          value={destino.colonia || ''}
                          onChange={(e) => {
                            handleDestinoChange(e);
                            // Show dropdown when typing
                            if (destino.colonias && destino.colonias.length > 0) {
                              setShowColoniaDropdown(true);
                            }
                          }}
                          onFocus={() => {
                            if (destino.colonias && destino.colonias.length > 0) {
                              setShowColoniaDropdown(true);
                            }
                          }}
                          placeholder="Escribir o seleccionar colonia"
                          className={inputClassName(getFieldError('colonia'))}
                        />
                        
                        {/* Dropdown toggle button */}
                        {destino.colonias && destino.colonias.length > 0 && (
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
                      {showColoniaDropdown && destino.colonias && destino.colonias.length > 0 && (
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
                                  className="w-full pl-10 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  autoFocus
                                />
                              </div>
                            </div>
                            
                            {/* Filtered colonias list - increased height when dropdown is open */}
                            <div className="max-h-60 overflow-y-auto">
                              {destino.colonias
                                .filter(colonia => 
                                  colonia.toLowerCase().includes((coloniaSearchQuery || destino.colonia || '').toLowerCase())
                                )
                                .map((colonia, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                      setDestino(prev => ({ ...prev, colonia }));
                                      setShowColoniaDropdown(false);
                                      setColoniaSearchQuery('');
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-green-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                                      destino.colonia === colonia ? 'bg-green-100 text-green-900 font-medium' : 'text-gray-900'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{colonia}</span>
                                      {destino.colonia === colonia && (
                                        <Check className="h-4 w-4 text-green-600" />
                                      )}
                                    </div>
                                  </button>
                                ))
                              }
                              
                              {/* No results message */}
                              {destino.colonias.filter(colonia => 
                                colonia.toLowerCase().includes((coloniaSearchQuery || destino.colonia || '').toLowerCase())
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
                                {destino.colonias.filter(colonia => 
                                  colonia.toLowerCase().includes((coloniaSearchQuery || destino.colonia || '').toLowerCase())
                                ).length} de {destino.colonias.length} colonias
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
                      {!showColoniaDropdown && destino.colonias && destino.colonias.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-gray-500 mr-2">Sugerencias:</span>
                            {destino.colonias.slice(0, 3).map((colonia, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setDestino(prev => ({ ...prev, colonia }))}
                                className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
                              >
                                {colonia}
                              </button>
                            ))}
                            {destino.colonias.length > 3 && (
                              <button
                                type="button"
                                onClick={() => setShowColoniaDropdown(true)}
                                className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                              >
                                Ver todas ({destino.colonias.length})
                              </button>
                            )}
                          </div>
                          {!!destino.codigo_postal && zipValidation && (
                            <div className="text-xs text-green-600 flex items-center">
                              <Check className="h-3 w-3 mr-1" />
                              {destino.colonias.length} colonias disponibles para CP {destino.codigo_postal}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </FormField>

                  <FormField
                    label="País"
                    required
                    error={getFieldError('pais')}
                    icon={<Globe className="h-4 w-4" />}
                  >
                    <input
                      type="text"
                      name="pais"
                      value={destino.pais || 'México'}
                      onChange={handleDestinoChange}
                      className={inputClassName(getFieldError('pais'))}
                      placeholder="País"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {activeSection === 'delivery' && (
              <div className="space-y-6">
                <FormField
                  label="Referencia"
                  error={getFieldError('referencia')}
                  icon={<MapPin className="h-4 w-4" />}
                >
                  <input
                    type="text"
                    name="referencia"
                    value={destino.referencia || ''}
                    onChange={handleDestinoChange}
                    className={inputClassName(getFieldError('referencia'))}
                    placeholder="Puntos de referencia cercanos (tienda, parque, etc.)"
                  />
                </FormField>

                <FormField
                  label="Instrucciones de Entrega"
                  error={getFieldError('instrucciones_entrega')}
                  icon={<FileText className="h-4 w-4" />}
                >
                  <textarea
                    name="instrucciones_entrega"
                    value={destino.instrucciones_entrega || ''}
                    onChange={handleDestinoChange}
                    rows={4}
                    className={inputClassName(getFieldError('instrucciones_entrega'))}
                    placeholder="Ej. Dejar con el portero, llamar antes de entregar, horario preferido, etc."
                  />
                </FormField>

                {/* Delivery preferences */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Preferencias de Entrega
                  </h4>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>• Especifica horarios preferenciales si es necesario</p>
                    <p>• Incluye números adicionales de contacto si aplica</p>
                    <p>• Menciona si hay restricciones de acceso</p>
                  </div>
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
                if (isExistingDestino && hasChanges) {
                  if (initialDestino && confirm("¿Estás seguro de eliminar los cambios?")) {
                    setDestino(initialDestino);
                    setFormErrors({});
                  }
                } else {
                  setDestino({
                    ...DEFAULT_DESTINO,
                    cliente_id: clienteId || ''
                  });
                  setFormErrors({});
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              {isExistingDestino ? 'Restaurar' : 'Limpiar'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Cancelar
            </button>
          </div>
          
          <button
            type="button"
            onClick={handleSaveDestino}
            disabled={!isFormValid()}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              isFormValid()
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {!isExistingDestino 
              ? 'Guardar Destino'
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
      : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
  } disabled:bg-gray-50 disabled:text-gray-500 read-only:bg-gray-50 read-only:text-gray-600`;
}

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}