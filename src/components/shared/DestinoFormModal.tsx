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
  Filter,
  Plus,
  ChevronsUpDown
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
    if (!clienteId) return;
    // trim off whitespace so empty string === no q parameter
    const q = destinoSearchQuery.trim();
    fetchDestinosForCliente(clienteId, q || undefined);
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
    debounce(
      async (clientId: string, q?: string) => {
        try {
          setIsSearching(true);
          const destinos = await apiService.getCustomerDestinations(clientId, q);
          setDestinoSuggestions(destinos);
        } catch (err) {
          console.error('Error fetching destinations:', err);
          setDestinoSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      },
      300
    ),
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

  const handleColoniaUpdate = (newColonia: string) => {
    // Update the state directly
    setDestino(prev => ({ ...prev, colonia: newColonia }));
    
    // Clear any validation errors for colonia
    if (formErrors.colonia) {
      const newErrors = { ...formErrors };
      delete newErrors.colonia;
      setFormErrors(newErrors);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl h-[95vh] flex flex-col overflow-hidden">

        {/* Sticky Header */}
        <div className="flex items-center justify-between p-3 border-b bg-white sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {isExistingDestino ? 'Editar Destino' : 'Nuevo Destino'}
              </h2>
              {clienteData && (
                <p className="text-xs text-gray-500">
                  {clienteData.nombre} {clienteData.apellido_paterno} • {clienteData.telefono}
                </p>
              )}
            </div>
          </div>
          <button onClick={handleClose} className="rounded-full p-2 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Destination Browser - Only for existing clients with destinations */}
        {clienteId && destinoSuggestions.length > 0 && !initialDestino && (
          <div className="p-2 bg-gray-50" ref={destinoDropdownRef}>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-gray-700">
                Destinos guardados
              </label>
              <button 
                onClick={() => setIsBrowsingDestinos(!isBrowsingDestinos)}
                className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-xs font-medium"
                type="button"
              >
                <Eye className="h-3 w-3" />
                <span>{isBrowsingDestinos ? 'Ocultar' : 'Ver destinos'}</span>
              </button>
            </div>

            {isBrowsingDestinos ? (
              <div className="border rounded-lg shadow-md bg-white">
                {/* Search and filters */}
                <div className="p-3 border-b bg-gray-50 space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar destino..."
                      className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={destinoSearchQuery}
                      onChange={(e) => setDestinoSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex space-x-1">
                    {[
                      { key: 'all', label: 'Todos', icon: <Filter className="h-3 w-3" /> },
                      { key: 'favorites', label: 'Favoritos', icon: <Star className="h-3 w-3" /> },
                      { key: 'recent', label: 'Recientes', icon: <Clock className="h-3 w-3" /> }
                    ].map(({ key, label, icon }) => (
                      <button
                        key={key}
                        type="button"
                        className={`flex items-center space-x-1 px-2 py-1 text-xs rounded-md font-medium transition-colors ${
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
                <div className="max-h-60 overflow-y-auto">
                  {Object.entries(groupedDestinos).length > 0 ? (
                    Object.entries(groupedDestinos).map(([state, destinos]) => (
                      <div key={state} className="border-b last:border-0">
                        <div className="bg-gray-50 p-2 sticky top-0 z-10 font-medium text-gray-700 text-xs flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-3 w-3 text-gray-500" />
                            <span>{state}</span>
                          </div>
                          <span className="text-xs bg-gray-200 text-gray-600 px-1 py-0.5 rounded-full">
                            {destinos.length}
                          </span>
                        </div>
                        {destinos.map((dest) => (
                          <div
                            key={dest.id}
                            className="cursor-pointer select-none p-3 hover:bg-green-50 border-t first:border-0 border-gray-100 transition-colors"
                            onClick={() => handleSelectDestino(dest)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 text-sm">{dest.nombre_destinatario}</span>
                              <div className="flex items-center space-x-1">
                                {dest.alias && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded-full">
                                    {dest.alias}
                                  </span>
                                )}
                                <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded-full">
                                  {dest.codigo_postal}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600">
                              {dest.direccion}, {dest.colonia}, {dest.ciudad}
                            </p>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      {isSearching ? (
                        <div className="flex justify-center items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                          <span className="text-sm">Buscando destinos...</span>
                        </div>
                      ) : destinoSearchQuery ? (
                        <div>
                          <p className="text-sm">No se encontraron destinos</p>
                          <button 
                            type="button"
                            className="mt-1 text-green-600 hover:text-green-800 text-xs font-medium" 
                            onClick={() => setDestinoSearchQuery('')}
                          >
                            Limpiar búsqueda
                          </button>
                        </div>
                      ) : (
                        <div>
                          <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="font-medium text-sm">No hay destinos guardados</p>
                          <p className="text-xs mt-1">Crea uno nuevo completando el formulario</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={`w-full p-3 border rounded-lg cursor-pointer flex justify-between items-center transition-colors ${
                  isExistingDestino 
                    ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setIsBrowsingDestinos(true)}
              >
                <div className="flex items-center space-x-2">
                  {isExistingDestino ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Search className="h-4 w-4 text-gray-500" />
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
        <div className="flex space-x-1 px-4 mt-2 bg-gray-50">
          <button
            onClick={() => setActiveSection('basic')}
            className={`flex-1 py-2 text-sm rounded-t-lg ${activeSection === 'basic' ? 'bg-white text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:text-green-500'}`}
          >
            Información Básica
          </button>
          <button
            onClick={() => setActiveSection('address')}
            className={`flex-1 py-2 text-sm rounded-t-lg ${activeSection === 'address' ? 'bg-white text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:text-green-500'}`}
          >
            Dirección
          </button>
          <button
            onClick={() => setActiveSection('delivery')}
            className={`flex-1 py-2 text-sm rounded-t-lg ${activeSection === 'delivery' ? 'bg-white text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:text-green-500'}`}
          >
            Entrega
          </button>
        </div>

        {/* Scrollable Form Section */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeSection === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    placeholder="Empresa, Organización, Otro Identificador..."
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
            <div className="space-y-4">
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
                    value={destino.codigo_postal || ''}
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
                    value={destino.estado || ''}
                    onChange={handleDestinoChange}
                    className={inputClassName(getFieldError('estado'))}
                    readOnly={!!destino.codigo_postal && zipValidation}
                    placeholder="Estado"
                  />
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
                    className={inputClassName(getFieldError('ciudad'))}
                    readOnly={!!destino.codigo_postal && zipValidation}
                    placeholder="Ciudad o municipio"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Colonia"
                  required
                  error={getFieldError('colonia')}
                >
                  <div className="space-y-2" data-destino-colonia-dropdown>
                    {/* Main input with dropdown button */}
                    <div className="flex gap-2">
                      {/* Input field */}
                      <input
                        type="text"
                        name="colonia"
                        value={destino.colonia || ''}
                        onChange={handleDestinoChange}
                        placeholder="Escribir colonia"
                        className={`flex-1 ${inputClassName(getFieldError('colonia'))}`}
                      />
                      
                      {/* Dropdown button */}
                      {destino.colonias && destino.colonias.length > 0 && (
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
                    {showColoniaDropdown && destino.colonias && destino.colonias.length > 0 && (
                      <div className="relative">
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
                                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                autoFocus
                              />
                            </div>
                            {/* Clear search button when there's a search query */}
                            {coloniaSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setColoniaSearchQuery('')}
                                className="mt-2 text-sm text-green-600 hover:text-green-800"
                              >
                                Mostrar todas las colonias
                              </button>
                            )}
                          </div>
                          
                          {/* Results list */}
                          <div className="max-h-48 overflow-y-auto">
                            {/* Current input as custom option (if not empty and not in list) */}
                            {destino.colonia && 
                             destino.colonia.trim() && 
                             !destino.colonias.some(colonia => 
                               colonia.toLowerCase() === destino.colonia.toLowerCase()
                             ) && 
                             (coloniaSearchQuery === '' || destino.colonia.toLowerCase().includes(coloniaSearchQuery.toLowerCase())) && (
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
                                    Usar "<strong>{destino.colonia}</strong>" (personalizada)
                                  </span>
                                </div>
                              </button>
                            )}

                            {/* Show filtered or all colonias */}
                            {(() => {
                              const filteredColonias = coloniaSearchQuery === '' 
                                ? destino.colonias // Show all if no search query
                                : destino.colonias.filter(colonia =>
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
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-green-50 transition-colors border-b last:border-b-0 ${
                                    destino.colonia === colonia ? 'bg-green-100 text-green-900 font-medium' : 'text-gray-900'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="truncate">{colonia}</span>
                                    {destino.colonia === colonia && (
                                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    )}
                                  </div>
                                </button>
                              ));
                            })()}
                            
                            {/* No results when searching */}
                            {coloniaSearchQuery !== '' && 
                             destino.colonias.filter(colonia =>
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
                                `${destino.colonias.length} colonias disponibles`
                              ) : (
                                `${destino.colonias.filter(colonia =>
                                  colonia.toLowerCase().includes(coloniaSearchQuery.toLowerCase())
                                ).length} de ${destino.colonias.length} colonias`
                              )}
                            </span>
                            <div className="flex gap-1">
                              {coloniaSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setColoniaSearchQuery('')}
                                  className="px-3 py-1 text-xs font-medium text-green-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
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
                    {!showColoniaDropdown && destino.colonias && destino.colonias.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-gray-500 mr-2">Sugerencias:</span>
                        {destino.colonias.slice(0, 3).map((colonia, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleColoniaUpdate(colonia)}
                            className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
                          >
                            {colonia}
                          </button>
                        ))}
                        {destino.colonias.length > 3 && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowColoniaDropdown(true);
                              setColoniaSearchQuery('');
                            }}
                            className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            +{destino.colonias.length - 3} más
                          </button>
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
            <div className="space-y-4">
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
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2 flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Preferencias de Entrega
                </h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• Especifica horarios preferenciales si es necesario</p>
                  <p>• Incluye números adicionales de contacto si aplica</p>
                  <p>• Menciona si hay restricciones de acceso</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-3 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
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
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              {isExistingDestino ? 'Restaurar' : 'Limpiar'}
            </button>
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
          <button
            onClick={handleSaveDestino}
            disabled={!isFormValid()}
            className={`px-4 py-1.5 text-xs font-medium rounded ${isFormValid() ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
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