import React, { useEffect } from 'react';
import { CotizadorState } from './utils/cotizadorTypes';
import { Cliente, Destino, ServicioCotizado, ShipmentDetails } from '../../types';
import { apiService } from '../../services/apiService';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Globe,
  MapPin,
  Search,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Check,
  Loader2
} from 'lucide-react';

// UI Components
import { Button } from '../ui/Button';
import { Badge } from '../ui/BadgeComponent';
import { Input } from '@headlessui/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/SelectComponent';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';

interface AddressSectionProps {
  state: CotizadorState;
  updateField: (field: keyof CotizadorState, value: any) => void;
  originState: string;
  originMunicipio: string;
  originCiudad: string;
  originColonias: string[];
  selectedOriginColonia: string;
  setSelectedOriginColonia: (colonia: string) => void;
  destState: string;
  destMunicipio: string;
  destCiudad: string;
  destColonias: string[];
  selectedDestColonia: string;
  setSelectedDestColonia: (colonia: string) => void;
  validateZipCodes: () => void;
  zone: number | null;
  isInternational: boolean;
  selectedZone: number | null;
  isValidated: boolean;
  servicios?: ServicioCotizado[];
  detallesCotizacion?: ShipmentDetails;
  onContinueToPackage?: () => void;
  useExistingClient: boolean;
  setUseExistingClient: (value: boolean) => void;
  clientSearchQuery: string;
  setClientSearchQuery: (value: string) => void;
  selectedClient: Cliente | null;
  setSelectedClient: (client: Cliente | null) => void;
  clientSuggestions: Cliente[];
  setClientSuggestions: (suggestions: Cliente[]) => void;
  loadingClients: boolean;
  setLoadingClients: (loading: boolean) => void;
  useExistingDestination: boolean;
  setUseExistingDestination: (value: boolean) => void;
  destSearchQuery: string;
  setDestSearchQuery: (value: string) => void;
  selectedDestination: Destino | null;
  setSelectedDestination: (destination: Destino | null) => void;
  destSuggestions: Destino[];
  setDestSuggestions: (suggestions: Destino[]) => void;
  loadingDestinations: boolean;
  setLoadingDestinations: (loading: boolean) => void;
  originZipError: string | null;
  setOriginZipError: (value: string | null) => void;
  destZipError: string | null;
  setDestZipError: (value: string | null) => void;
  sameZipWarning: string | null;
  setSameZipWarning: (value: string | null) => void;
}

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export const AddressSection: React.FC<AddressSectionProps> = ({
  state,
  updateField,
  originState,
  originMunicipio,
  originCiudad,
  originColonias,
  selectedOriginColonia,
  setSelectedOriginColonia,
  destState,
  destMunicipio,
  destCiudad,
  destColonias,
  selectedDestColonia,
  setSelectedDestColonia,
  validateZipCodes,
  zone,
  isInternational,
  selectedZone,
  isValidated,
  onContinueToPackage,
  useExistingClient,
  setUseExistingClient,
  clientSearchQuery,
  setClientSearchQuery,
  selectedClient,
  setSelectedClient,
  clientSuggestions,
  setClientSuggestions,
  loadingClients,
  setLoadingClients,
  useExistingDestination,
  setUseExistingDestination,
  destSearchQuery,
  setDestSearchQuery,
  selectedDestination,
  setSelectedDestination,
  destSuggestions,
  setDestSuggestions,
  loadingDestinations,
  setLoadingDestinations,
  originZipError,
  setOriginZipError,
  destZipError,
  setDestZipError,
  sameZipWarning,
  setSameZipWarning
}) => {

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.15 } }
  };

  // Search for client when query changes
  useEffect(() => {
    const searchClients = async () => {
      if (clientSearchQuery.trim().length < 2) {
        setClientSuggestions([]);
        return;
      }

      setLoadingClients(true);
      try {
        const results = await apiService.searchCustomers(clientSearchQuery);
        setClientSuggestions(results);
      } catch (error) {
        console.error("Error searching clients:", error);
        setClientSuggestions([]);
      } finally {
        setLoadingClients(false);
      }
    };

    const timer = setTimeout(searchClients, 300);
    return () => clearTimeout(timer);
  }, [clientSearchQuery]);

  // Search for destinations when client changes
  useEffect(() => {
    const searchDestinations = async () => {
      if (!selectedClient || !selectedClient.id) {
        setDestSuggestions([]);
        return;
      }

      setLoadingDestinations(true);
      try {
        const results = await apiService.getCustomerDestinations(selectedClient.id);

        if (!destSearchQuery.trim()) {
          setDestSuggestions(results);
          return;
        }

        const filteredResults = results.filter(dest =>
          dest.nombre_destinatario?.toLowerCase().includes(destSearchQuery.toLowerCase()) ||
          dest.direccion?.toLowerCase().includes(destSearchQuery.toLowerCase()) ||
          dest.colonia?.toLowerCase().includes(destSearchQuery.toLowerCase()) ||
          dest.codigo_postal?.includes(destSearchQuery)
        );

        setDestSuggestions(filteredResults);
      } catch (error) {
        console.error("Error searching destinations:", error);
        setDestSuggestions([]);
      } finally {
        setLoadingDestinations(false);
      }
    };

    const timer = setTimeout(searchDestinations, 300);
    return () => clearTimeout(timer);
  }, [selectedClient, destSearchQuery]);

  // Handle client selection
  const handleClientSelect = (client: Cliente) => {
    setSelectedClient(client);
    setClientSuggestions([]);
    setClientSearchQuery('');
    updateField('originZip', client.codigo_postal);
    updateField('clienteId', client.id);
  };

  // Handle destination selection
  const handleDestinationSelect = (destination: Destino) => {
    setSelectedDestination(destination);
    setDestSuggestions([]);
    setDestSearchQuery('');
    updateField('destZip', destination.codigo_postal);
    updateField('destinoId', destination.id);
  };

  // Handle toggle international
  const handleToggleInternational = () => {
    const newValue = !isInternational;
    if (state.servicios || state.detallesCotizacion) {
      if (!confirm("¿Está seguro? Esto reseteará toda la cotización actual.")) {
        return;
      }
    }
    updateField('isInternational', newValue);
    updateField('selectedZone', null);
    updateField('zone', null);
    updateField('isValidated', false);
    updateField('packageType', '');
    updateField('length', '');
    updateField('width', '');
    updateField('height', '');
    updateField('weight', '');
  };

  // Enhanced toggle component
  const Toggle: React.FC<ToggleProps> = ({ id, checked, onChange, disabled = false, label }) => (
    <div className="flex items-center space-x-1.5">
      {label && <span className="text-xs text-gray-600">{label}</span>}
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${disabled
          ? 'cursor-not-allowed bg-gray-200'
          : checked
            ? 'bg-blue-600'
            : 'bg-gray-300'
          }`}
        disabled={disabled}
        aria-pressed={checked}
        aria-labelledby={`${id}-label`}
      >
        <span
          className={`flex items-center justify-center text-xs font-bold h-4 w-4 transform rounded-full bg-white text-blue-600 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'
            }`}
        >
          {checked && (
            <CheckCircle className="h-2.5 w-2.5" />
          )}
        </span>
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Códigos Postales</h3>
      
      {/* International Shipping Toggle */}
      <motion.div
        className="p-3 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <div className="flex items-center justify-between cursor-pointer" onClick={handleToggleInternational}>
          <div className="flex items-center">
            <div className={`mr-3 rounded-full p-1.5 ${isInternational ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-700">Envío Internacional</span>
              <p className="text-xs text-gray-500">Activa para envíos fuera de México</p>
            </div>
          </div>
          <Toggle
            id="internationalShipping"
            checked={isInternational}
            onChange={handleToggleInternational}
            label=""
          />
        </div>
      </motion.div>

      {isInternational ? (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center mb-3">
              <Globe className="h-4 w-4 text-blue-500 mr-2" />
              <h3 className="font-medium text-blue-700 text-md">Zona de Envío Internacional</h3>
            </div>

            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">Selecciona la zona de destino:</p>
              <Select
                value={selectedZone ? selectedZone.toString() : "placeholder"}
                onValueChange={(value) => updateField('selectedZone', value === "placeholder" ? null : Number(value))}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Seleccione zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder">Seleccione zona</SelectItem>
                  {[1, 2, 3, 4, 5].map((zone) => (
                    <SelectItem key={zone} value={zone.toString()}>
                      Zona {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
              <div><div className="font-semibold">Zona 1:</div><p>EE.UU, Canadá</p></div>
              <div><div className="font-semibold">Zona 2:</div><p>Centro América</p></div>
              <div><div className="font-semibold">Zona 3:</div><p>Sudamérica</p></div>
              <div><div className="font-semibold">Zona 4:</div><p>Europa, Asia Occidental</p></div>
              <div className="col-span-2"><div className="font-semibold">Zona 5:</div><p>Asia Oriental, Oceanía, África</p></div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          {/* Origin ZIP Code */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700 text-md">Origen</h3>
              <Toggle
                id="useExistingClient"
                checked={useExistingClient}
                onChange={(newValue) => {
                  if (useExistingClient && !newValue) {
                    setSelectedClient(null);
                    updateField('clienteId', null);
                    setOriginZipError(null);
                    setUseExistingDestination(false);
                    setSelectedDestination(null);
                    updateField('destinoId', null);
                    setDestSearchQuery('');
                    setDestZipError(null);
                    setDestSuggestions([]);
                  }
                  setUseExistingClient(newValue);
                }}
                label="Cliente existente"
              />
            </div>

            {useExistingClient ? (
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="pl-10 pr-10 py-2 text-sm w-full"
                  />
                  {loadingClients && (
                    <div className="absolute top-2.5 right-3">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {clientSuggestions.length > 0 && (
                    <motion.div
                      className="mt-2 border rounded-lg shadow-lg max-h-40 overflow-y-auto z-10 bg-white"
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={listVariants}
                    >
                      {clientSuggestions.map((client) => (
                        <div
                          key={client.id}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                          onClick={() => handleClientSelect(client)}
                        >
                          <div>
                            <div className="font-medium text-sm">{client.nombre} {client.apellido_paterno}</div>
                            <div className="text-xs text-gray-500">CP: {client.codigo_postal}</div>
                          </div>
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            {client.id}
                          </Badge>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {selectedClient && (
                  <motion.div
                    className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-blue-800 text-sm">
                        {selectedClient.nombre} {selectedClient.apellido_paterno}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedClient(null);
                          updateField('clienteId', null);
                        }}
                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-1 text-sm flex items-center text-blue-700">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>CP: {selectedClient.codigo_postal}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Código Postal"
                    value={state.originZip}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                      updateField('originZip', value);
                    }}
                    className="pl-10 pr-10 py-2 text-sm w-full"
                    maxLength={5}
                  />
                  {state.originZip.length === 5 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <div className="bg-green-50 text-green-600 rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    </motion.div>
                  )}
                </div>

                {isValidated && originState && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                          <motion.div
                                            className="space-y-2"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                          >
                                            <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                              <div className="flex items-center mb-1">
                                                <CheckCircle className="h-3 w-3 text-blue-600 mr-1" />
                                                <h4 className="text-xs font-medium text-blue-700">CP verificado</h4>
                                              </div>
                                              <div className="grid grid-cols-3 gap-1 text-xs">
                                                <div>
                                                  <p className="text-gray-500">Estado:</p>
                                                  <p className="font-medium">{originState}</p>
                                                </div>
                                                <div>
                                                  <p className="text-gray-500">Ciudad:</p>
                                                  <p className="font-medium">{originCiudad}</p>
                                                </div>
                                                <div>
                                                  <p className="text-gray-500">Municipio:</p>
                                                  <p className="font-medium">{originMunicipio}</p>
                                                </div>
                                              </div>
                                            </div>
                                          </motion.div>
                  
                                          {originColonias.length > 0 && (
                                            <motion.div
                                              initial={{ opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ duration: 0.2 }}
                                            >
                                              <div className="bg-white rounded border border-gray-200 p-2 h-full">
                                                <label className="text-xs font-medium text-gray-700 mb-1 block">
                                                  Colonia origen (Opcional):
                                                </label>
                                                <Select
                                                  value={selectedOriginColonia || "placeholder"}
                                                  onValueChange={setSelectedOriginColonia}
                                                >
                                                  <SelectTrigger className="w-full h-7">
                                                    <div className="flex items-center">
                                                      <Search className="h-3 w-3 mr-1 text-gray-400" />
                                                      <SelectValue placeholder="Busca colonia" />
                                                    </div>
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="placeholder" disabled>Busca una Colonia</SelectItem>
                                                    {originColonias.map((colonia, index) => (
                                                      <SelectItem key={index} value={colonia || `colonia-${index}`}>
                                                        {colonia}
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                  
                                                {selectedOriginColonia && (
                                                  <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-1 p-1.5 bg-green-50 rounded border border-green-100 flex items-center"
                                                  >
                                                    <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                                                    <span className="text-xs text-green-700">
                                                      <strong>{selectedOriginColonia}</strong>
                                                    </span>
                                                  </motion.div>
                                                )}
                                              </div>
                                            </motion.div>
                                          )}
                                        </div>
                )}

                {originZipError && (
                  <motion.div
                    className="bg-red-50 p-3 rounded-lg border border-red-100"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-600 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-red-700">{originZipError}</h4>
                        <p className="text-xs text-red-600 mt-0.5">Verifica el código postal</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Destination ZIP Code */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700 text-md">Destino</h3>
              {selectedClient && (
                <Toggle
                  id="useExistingDestination"
                  checked={useExistingDestination}
                  onChange={(newValue) => {
                    if (useExistingDestination && !newValue) {
                      setSelectedDestination(null);
                      updateField('destinoId', null);
                      setDestSearchQuery('');
                      setDestZipError(null);
                    }
                    setUseExistingDestination(newValue);
                  }}
                  disabled={!selectedClient}
                  label="Destino existente"
                />
              )}
            </div>

            {useExistingDestination && selectedClient ? (
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Buscar destino..."
                    value={destSearchQuery}
                    onChange={(e) => setDestSearchQuery(e.target.value)}
                    className="pl-10 pr-10 py-2 text-sm w-full"
                  />
                  {loadingDestinations && (
                    <div className="absolute top-2.5 right-3">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {destSuggestions.length > 0 && (
                    <motion.div
                      className="mt-2 border rounded-lg shadow-lg max-h-40 overflow-y-auto bg-white z-10"
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={listVariants}
                    >
                      {destSuggestions.map((destination) => (
                        <div
                          key={destination.id}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                          onClick={() => handleDestinationSelect(destination)}
                        >
                          <div className="font-medium text-sm">{destination.nombre_destinatario}</div>
                          <div className="text-xs text-gray-500">
                            {destination.direccion}, {destination.colonia}, CP: {destination.codigo_postal}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {selectedDestination && (
                  <motion.div
                    className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-blue-800 text-sm">
                        {selectedDestination.nombre_destinatario}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDestination(null);
                          updateField('destinoId', null);
                          setDestSearchQuery('');
                        }}
                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-1 text-sm text-blue-700">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{selectedDestination.direccion}, {selectedDestination.colonia}, CP: {selectedDestination.codigo_postal}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Código Postal"
                    value={state.destZip}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                      updateField('destZip', value);
                    }}
                    className="pl-10 pr-10 py-2 text-sm w-full"
                    maxLength={5}
                  />
                  {state.destZip.length === 5 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <div className="bg-green-50 text-green-600 rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    </motion.div>
                  )}
                </div>

                {isValidated && destState && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                          <motion.div
                                            className="bg-blue-50 p-2 rounded border border-blue-100"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                          >
                                            <div className="flex items-center mb-1">
                                              <CheckCircle className="h-3 w-3 text-blue-600 mr-1" />
                                              <h4 className="text-xs font-medium text-blue-700">CP verificado (Destino)</h4>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-1 text-xs">
                                              <div>
                                                <p className="text-gray-500">Estado:</p>
                                                <p className="font-medium">{destState}</p>
                                              </div>
                                              <div>
                                                <p className="text-gray-500">Ciudad:</p>
                                                <p className="font-medium">{destCiudad}</p>
                                              </div>
                                              <div className="col-span-2 lg:col-span-1">
                                                <p className="text-gray-500">Municipio:</p>
                                                <p className="font-medium">{destMunicipio}</p>
                                              </div>
                                            </div>
                                          </motion.div>
                  
                                          {destColonias.length > 0 && (
                                            <motion.div
                                              initial={{ opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ duration: 0.2 }}
                                            >
                                              <div className="bg-white rounded border border-gray-200 p-2 h-full">
                                                <label className="text-xs font-medium text-gray-700 mb-1 block">
                                                  Colonia destino:
                                                </label>
                                                <Select
                                                  value={selectedDestColonia || "placeholder"}
                                                  onValueChange={setSelectedDestColonia}
                                                >
                                                  <SelectTrigger className="w-full h-7">
                                                    <div className="flex items-center">
                                                      <Search className="h-3 w-3 mr-1 text-gray-400" />
                                                      <SelectValue placeholder="Busca colonia" />
                                                    </div>
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="placeholder" disabled>Busca una Colonia</SelectItem>
                                                    {destColonias.map((colonia, index) => (
                                                      <SelectItem key={index} value={colonia || `colonia-${index}`}>{colonia}</SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                  
                                                {selectedDestColonia && (
                                                  <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-1 p-1.5 bg-green-50 rounded border border-green-100 flex items-center"
                                                  >
                                                    <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                                                    <span className="text-xs text-green-700"><strong>{selectedDestColonia}</strong></span>
                                                  </motion.div>
                                                )}
                                              </div>
                                            </motion.div>
                                          )}
                                        </div>
                )}

                {destZipError && (
                  <motion.div
                    className="bg-red-50 p-3 rounded-lg border border-red-100"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-600 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-red-700">{destZipError}</h4>
                        <p className="text-xs text-red-600 mt-0.5">Verifica el código postal de destino</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {sameZipWarning && !originZipError && !destZipError && (
        <motion.div
          className="bg-yellow-50 p-3 rounded-lg border border-yellow-200"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-700">Códigos postales idénticos</h4>
              <p className="text-xs text-yellow-600 mt-0.5">{sameZipWarning}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};