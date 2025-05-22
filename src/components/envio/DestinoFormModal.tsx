import { useState, useEffect, useRef } from 'react';
import { Combobox } from '@headlessui/react';
import { apiService } from '../../services/apiService';
import { Destino } from '../../types';
import { MapPin, Search, ArrowDown, X, Check, Globe, ChevronDown, ChevronUp, Eye, Phone, Mail, MapPinned, AlertCircle } from 'lucide-react';

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
  const [clienteData, setClienteData] = useState<any>(null);
  const [isBrowsingDestinos, setIsBrowsingDestinos] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | 'recent'>('all');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showIndicator, setShowIndicator] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const destinoDropdownRef = useRef<HTMLDivElement>(null);

  // Filter destinations based on search query
  const filteredDestinos = destinoSuggestions.filter(dest => {
    // Apply text search filter
    const matchesSearch = destinoSearchQuery.trim() === '' || 
      `${dest.nombre_destinatario || ''} ${dest.direccion || ''} ${dest.colonia || ''} ${dest.ciudad || ''} ${dest.codigo_postal || ''}`
        .toLowerCase()
        .includes(destinoSearchQuery.toLowerCase());
    
    // Apply category filter
    if (filterMode === 'favorites') {
      return matchesSearch && dest.favorite === true;
    } else if (filterMode === 'recent') {
      return matchesSearch && dest.recent === true;
    }
    
    return matchesSearch;
  });

  // Group destinations by state for better browsing
  const groupedDestinos = filteredDestinos.reduce((groups: Record<string, Destino[]>, dest) => {
    const state = dest.estado || 'Sin Estado';
    if (!groups[state]) {
      groups[state] = [];
    }
    groups[state].push(dest);
    return groups;
  }, {});

  // Update scroll indicator visibility
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handler = () => {
      const isAtBottom =
        container.scrollHeight - container.scrollTop <= container.clientHeight - 1;
      setShowIndicator(!isAtBottom);
    };

    container.addEventListener('scroll', handler);
    return () => container.removeEventListener('scroll', handler);
  }, []);

  // Reset the form when the modal opens or closes
  useEffect(() => {
    if (isOpen) {
      if (initialDestino) {
        setDestino(initialDestino);
        setIsExistingDestino(true);
        if (initialDestino.cliente_id) {
          fetchCliente(initialDestino.cliente_id);
        }
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialDestino, clienteId]);

  // Close dropdown when clicking outside
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

  // Fetch client and destinations when needed
  useEffect(() => {
    if (clienteId) {
      fetchCliente(clienteId);
      fetchDestinosForCliente(clienteId);
    }
  }, [clienteId]);

  // Fetch address data when ZIP code changes
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
        
        setDestino(prev => ({
          ...prev,
          estado: zipData.d_estado,
          ciudad: zipData.d_ciudad || zipData.d_mnpio,
          colonias,
          // Only update colonia if:
          // 1. We're creating a new destination (not editing existing)
          // AND
          // 2. Current colonia is empty or not in the new list
          colonia: (isExistingDestino && prev.colonia) 
            ? prev.colonia // Keep existing colonia for edits
            : (!prev.colonia || prev.colonia === '' || !colonias.includes(prev.colonia)) 
              ? (colonias[0] || '') 
              : prev.colonia
        }));
        setZipValidation(true);
        
        // Clear related errors
        const newErrors = {...formErrors};
        delete newErrors.codigo_postal;
        delete newErrors.estado;
        delete newErrors.ciudad;
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

  // Only fetch if we don't already have colonias for this ZIP code, or if ZIP code changed
  if (destino.codigo_postal && destino.codigo_postal.length === 5) {
    // Check if we already have colonias for this ZIP code
    const hasColoniasForThisZip = destino.colonias && destino.colonias.length > 0;
    
    // Only fetch if we don't have colonias or if this is a different ZIP code
    if (!hasColoniasForThisZip) {
      fetchAddressData(destino.codigo_postal);
    }
  }
}, [destino.codigo_postal]);

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

  const fetchDestinosForCliente = async (clientId: string) => {
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
  };

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
    
    if (!destino.cliente_id) {
      errors.cliente_id = "Es necesario seleccionar un cliente";
    }
    
    if (!destino.nombre_destinatario?.trim()) {
      errors.nombre_destinatario = "El nombre es obligatorio";
    }
    
    if (!destino.direccion?.trim()) {
      errors.direccion = "La dirección es obligatoria";
    }
    
    if (!destino.colonia?.trim()) {
      errors.colonia = "La colonia es obligatoria";
    }
    
    if (!destino.ciudad?.trim()) {
      errors.ciudad = "La ciudad es obligatoria";
    }
    
    if (!destino.estado?.trim()) {
      errors.estado = "El estado es obligatorio";
    }
    
    if (!destino.codigo_postal?.trim()) {
      errors.codigo_postal = "El código postal es obligatorio";
    } else if (destino.codigo_postal.length !== 5) {
      errors.codigo_postal = "El código postal debe tener 5 dígitos";
    }
    
    if (!destino.telefono?.trim()) {
      errors.telefono = "El teléfono es obligatorio";
    }
    
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
    setIsExistingDestino(true);
    setIsBrowsingDestinos(false);
    setFormErrors({});
  };

  const handleDestinoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDestino(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user types
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
    if (!validateForm()) {
      return;
    }

    try {
      if (isExistingDestino && destino.id) {
        await apiService.updateDestination(destino.id, destino);
        onDestinoSaved(destino);
      } else {
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

  const handleClearForm = () => {
    if (isExistingDestino) {
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
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-[70vw] min-w-[300px] max-w-[1200px] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-green-50">
          <div>
            <h2 className="text-xl font-bold text-green-800 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-600" />
              {isExistingDestino ? 'Editar Destino' : 'Crear Nuevo Destino'}
            </h2>
            {clienteData && (
              <p className="text-green-700 font-medium">
                {clienteData.nombre} {clienteData.apellido_paterno} ({clienteData.telefono})
              </p>
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
        <div className="flex-1 overflow-y-auto p-4" ref={scrollContainerRef}>
          <div className="max-h-[60vh] overflow-y-auto">
            {/* Only show destination search/browse if client exists and we have multiple destinations */}
            {clienteId && destinoSuggestions.length > 0 && !initialDestino && (
              <div className="mb-6 relative" ref={destinoDropdownRef}>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {isExistingDestino ? 'Destino seleccionado' : 'Buscar un destino existente'}
                  </label>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setIsBrowsingDestinos(!isBrowsingDestinos)}
                      className="text-green-600 text-xs flex items-center hover:text-green-800"
                      type="button"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {isBrowsingDestinos ? 'Ocultar lista' : 'Ver todos'}
                    </button>
                  </div>
                </div>

                {isBrowsingDestinos ? (
                  <div className="border rounded-md shadow-md bg-white mb-6">
                    {/* Search and filter controls */}
                    <div className="p-3 border-b bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Buscar destino..."
                          className="w-full p-2 pl-10 border border-gray-300 rounded-md text-sm"
                          value={destinoSearchQuery}
                          onChange={(e) => setDestinoSearchQuery(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          className={`px-2 py-1 text-xs rounded-md ${filterMode === 'all' 
                            ? 'bg-green-100 text-green-800 font-medium' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          onClick={() => setFilterMode('all')}
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          className={`px-2 py-1 text-xs rounded-md ${filterMode === 'favorites' 
                            ? 'bg-green-100 text-green-800 font-medium' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          onClick={() => setFilterMode('favorites')}
                        >
                          Favoritos
                        </button>
                        <button
                          type="button"
                          className={`px-2 py-1 text-xs rounded-md ${filterMode === 'recent' 
                            ? 'bg-green-100 text-green-800 font-medium' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          onClick={() => setFilterMode('recent')}
                        >
                          Recientes
                        </button>
                      </div>
                    </div>
                    
                    {/* Results list grouped by state */}
                    <div className="max-h-[300px] overflow-y-auto">
                      {Object.entries(groupedDestinos).length > 0 ? (
                        Object.entries(groupedDestinos).map(([state, destinos]) => (
                          <div key={state} className="border-b last:border-0">
                            <div className="bg-gray-50 p-2 sticky top-0 z-10 font-medium text-gray-700 text-sm flex items-center">
                              <Globe className="h-3 w-3 mr-1 text-gray-500" />
                              {state}
                              <span className="text-xs ml-2 text-gray-500">
                                ({destinos.length} {destinos.length === 1 ? 'destino' : 'destinos'})
                              </span>
                            </div>
                            {destinos.map((dest) => (
                              <div
                                key={dest.id}
                                className="cursor-pointer select-none py-2 px-3 hover:bg-green-50 border-t first:border-0 border-gray-100"
                                onClick={() => handleSelectDestino(dest)}
                              >
                                <div className="font-medium flex items-center justify-between">
                                  <span>{dest.nombre_destinatario}</span>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                    CP: {dest.codigo_postal}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {dest.direccion}, {dest.colonia}, {dest.ciudad}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-gray-500">
                          {isSearching ? (
                            <div className="flex justify-center items-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500 mr-2"></div>
                              <span>Buscando destinos...</span>
                            </div>
                          ) : destinoSearchQuery ? (
                            <div>
                              <p>No se encontraron destinos con "{destinoSearchQuery}"</p>
                              <button 
                                type="button"
                                className="mt-2 text-green-600 hover:text-green-800 text-sm" 
                                onClick={() => setDestinoSearchQuery('')}
                              >
                                Limpiar búsqueda
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p>No hay destinos guardados para este cliente</p>
                              <p className="text-sm mt-1">Puedes crear uno nuevo completando el formulario</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Close button */}
                    <div className="p-2 border-t text-right">
                      <button
                        type="button"
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        onClick={() => setIsBrowsingDestinos(false)}
                      >
                        Cerrar lista
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-full p-3 border ${isExistingDestino ? 'bg-green-50 border-green-200' : 'border-gray-300'} rounded-md cursor-pointer mb-4 flex justify-between items-center`}
                    onClick={() => setIsBrowsingDestinos(true)}
                  >
                    <div className="flex items-center">
                      {isExistingDestino ? (
                        <Check className="h-4 w-4 text-green-600 mr-2" />
                      ) : (
                        <Search className="h-4 w-4 text-gray-500 mr-2" />
                      )}
                      <span>
                        {isExistingDestino 
                          ? destino.nombre_destinatario
                          : 'Seleccionar destino existente...'}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            )}

            {/* Destination Form */}
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Alias field */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Alias</label>
                    {formErrors.alias && (
                      <span className="text-xs text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.alias}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    name="alias"
                    value={destino.alias || ''}
                    onChange={handleDestinoChange}
                    className={`block w-full px-3 py-2 border ${formErrors.alias ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} rounded-md shadow-sm`}
                    placeholder="Casa, Oficina, etc."
                  />
                </div>

                {/* Nombre Destinatario field */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Nombre Destinatario*</label>
                    {formErrors.nombre_destinatario && (
                      <span className="text-xs text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.nombre_destinatario}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPinned className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="nombre_destinatario"
                      value={destino.nombre_destinatario || ''}
                      onChange={handleDestinoChange}
                      className={`pl-10 block w-full px-3 py-2 border ${formErrors.nombre_destinatario ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} rounded-md shadow-sm`}
                      placeholder="Nombre completo del destinatario"
                      required
                    />
                  </div>
                </div>

                {/* Teléfono field */}
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
                      value={destino.telefono || ''}
                      onChange={handleDestinoChange}
                      className={`pl-10 block w-full px-3 py-2 border ${formErrors.telefono ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} rounded-md shadow-sm`}
                      placeholder="Número de teléfono (10 dígitos)"
                      required
                      maxLength={10}
                    />
                  </div>
                </div>

                {/* Email field */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Email</label>
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
                      value={destino.email || ''}
                      onChange={handleDestinoChange}
                      className={`pl-10 block w-full px-3 py-2 border ${formErrors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} rounded-md shadow-sm`}
                      placeholder="Correo electrónico"
                    />
                  </div>
                </div>

                {/* Dirección field - full width */}
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Dirección*</label>
                    {formErrors.direccion && (
                      <span className="text-xs text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.direccion}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="direccion"
                      value={destino.direccion || ''}
                      onChange={handleDestinoChange}
                      className={`pl-10 block w-full px-3 py-2 border ${formErrors.direccion ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} rounded-md shadow-sm`}
                      placeholder="Calle y número"
                      required
                    />
                  </div>
                </div>

                {/* Código Postal field */}
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
                    value={destino.codigo_postal || ''}
                    onChange={handleZipChange}
                    className={`block w-full px-3 py-2 border ${formErrors.codigo_postal || !zipValidation ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} rounded-md shadow-sm`}
                    placeholder="5 dígitos"
                    required
                    maxLength={5}
                  />
                </div>

                {/* Colonia field */}
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
  value={destino.colonia || ''}
  onChange={(e) => {
    setDestino(prev => ({ ...prev, colonia: e.target.value }));
  }}
  className={`block w-full px-3 py-2 border ${formErrors.colonia ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} rounded-md shadow-sm`}
  required
>
  <option value="">Escribe la colonia si no está en la lista</option>
  {destino.colonias && destino.colonias.length > 0 ? (
    destino.colonias.map((colonia, index) => (
      <option key={index} value={colonia}>{colonia}</option>
    ))
  ) : (
    <option value="">Ingrese un código postal válido</option>
  )}
  {/* Show current colonia as option if it's not in the list */}
  {destino.colonia && (!destino.colonias || !destino.colonias.includes(destino.colonia)) && (
    <option value={destino.colonia}>{destino.colonia}</option>
  )}
</select>
                    
                    {/* Show input field if "Otra colonia" is selected or if current value is not in the list */}
                    {(!destino.colonias?.includes(destino.colonia) || destino.colonia === "custom") && (
                      <input
                        type="text"
                        name="colonia"
                        value={destino.colonia === "custom" ? "" : destino.colonia}
                        onChange={handleDestinoChange}
                        placeholder="Escribir nombre de colonia"
                        className={`mt-1 block w-full px-3 py-2 border ${formErrors.colonia ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} rounded-md shadow-sm`}
                        required
                      />
                    )}
                  </div>
                </div>

                {/* Ciudad field */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Ciudad*</label>
                    {formErrors.ciudad && (
                      <span className="text-xs text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.ciudad}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    name="ciudad"
                    value={destino.ciudad || ''}
                    onChange={handleDestinoChange}
                    className={`block w-full px-3 py-2 border ${formErrors.ciudad ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} rounded-md shadow-sm`}
                    placeholder="Ciudad o municipio"
                    required
                    readOnly={!!destino.codigo_postal && zipValidation}
                  />
                </div>

                {/* Estado field */}
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
                    value={destino.estado || ''}
                    onChange={handleDestinoChange}
                    className={`block w-full px-3 py-2 border ${formErrors.estado ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} rounded-md shadow-sm`}
                    placeholder="Estado"
                    required
                    readOnly={!!destino.codigo_postal && zipValidation}
                  />
                </div>

                {/* País field */}
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
                    value={destino.pais || 'México'}
                    onChange={handleDestinoChange}
                    className={`block w-full px-3 py-2 border ${formErrors.pais ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} rounded-md shadow-sm`}
                    placeholder="País"
                    required
                  />
                </div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Referencia field */}
                <div className="md:col-span-2">
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
                    value={destino.referencia || ''}
                    onChange={handleDestinoChange}
                    className={`block w-full px-3 py-2 border ${formErrors.referencia ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} rounded-md shadow-sm`}
                    placeholder="Puntos de referencia cercanos"
                  />
                </div>

                {/* Instrucciones de Entrega field */}
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Instrucciones de Entrega</label>
                    {formErrors.instrucciones_entrega && (
                      <span className="text-xs text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {formErrors.instrucciones_entrega}
                      </span>
                    )}
                  </div>
                  <textarea
                    name="instrucciones_entrega"
                    value={destino.instrucciones_entrega || ''}
                    onChange={handleDestinoChange}
                    rows={3}
                    className={`block w-full px-3 py-2 border ${formErrors.instrucciones_entrega ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} rounded-md shadow-sm`}
                    placeholder="Ej. Dejar con el portero, llamar antes de entregar, etc."
                  ></textarea>
                </div>
                </div>
              </div>
            </form>

            {/* Scroll indicator */}
            {showIndicator && (
              <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none flex justify-end items-end pb-2">
                <ArrowDown className="h-5 w-5 text-gray-500 animate-bounce" />
              </div>
            )}
          </div>
        </div>

        {/* Fixed footer with buttons */}
        <div className="border-t bg-gray-50 p-4 flex justify-end gap-3 sticky bottom-0">
          <button
            type="button"
            onClick={handleClearForm}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          >
            {isExistingDestino ? 'Restaurar' : 'Limpiar'}
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
            onClick={handleSaveDestino}
            className={`px-4 py-2 rounded-md text-white ${isFormValid()
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-green-300 cursor-not-allowed'
              }`}
            disabled={!isFormValid()}
          >
            {isExistingDestino ? 'Continuar' : 'Guardar Destino'}
          </button>
        </div>
      </div>
    </div>
  );
}