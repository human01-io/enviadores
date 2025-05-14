import React, { useState, useEffect } from 'react';
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
  Loader2,
  ArrowRight
} from 'lucide-react';

// UI Components
import { Button } from '../ui/Button';
import { Badge } from '../ui/BadgeComponent';
import { Card } from '../ui/CardComponent';
import { Input } from '@headlessui/react';
import { Separator } from '../ui/SeparatorComponent';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/SelectComponent';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { ChevronRight } from 'lucide-react';

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
  onContinueToPackage
}) => {
  // State for existing client search
  const [useExistingClient, setUseExistingClient] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientSuggestions, setClientSuggestions] = useState<Cliente[]>([]);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [loadingClients, setLoadingClients] = useState(false);

  // State for existing destination search
  const [useExistingDestination, setUseExistingDestination] = useState(false);
  const [destSearchQuery, setDestSearchQuery] = useState('');
  const [destSuggestions, setDestSuggestions] = useState<Destino[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destino | null>(null);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };
  
  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } }
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
        
        // If search query is empty, show all results
        if (!destSearchQuery.trim()) {
          setDestSuggestions(results);
          return;
        }
        
        // Otherwise filter results based on query
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
    
    // Update the originZip field
    updateField('originZip', client.codigo_postal);
    
    // Also store the client ID in a clienteId field
    updateField('clienteId', client.id);
  };

  // Handle destination selection
  const handleDestinationSelect = (destination: Destino) => {
    setSelectedDestination(destination);
    setDestSuggestions([]);
    setDestSearchQuery('');
    
    // Update the destZip field
    updateField('destZip', destination.codigo_postal);
    
    // Also store the destination ID in a destinoId field
    updateField('destinoId', destination.id);
  };

  // Handle toggle international
  const handleToggleInternational = () => {
    const newValue = !isInternational;
    // Only show confirmation if there are already services fetched
    if (state.servicios || state.detallesCotizacion) {
      if (!confirm("¿Está seguro? Esto reseteará toda la cotización actual.")) {
        return;
      }
    }
    updateField('isInternational', newValue);
    
    // Reset related fields when switching modes
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
    <div className="flex items-center space-x-2">
      {label && <span className="text-sm text-gray-600">{label}</span>}
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          disabled 
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
          className={`flex items-center justify-center text-xs font-bold inline-block h-5 w-5 transform rounded-full bg-white text-blue-600 transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`} 
        >
          {checked && (
            <CheckCircle className="h-3 w-3" />
          )}
        </span>
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* International Shipping Toggle with Graphics */}
      <motion.div 
        className="p-4 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <div className="flex items-center justify-between cursor-pointer" onClick={handleToggleInternational}>
          <div className="flex items-center">
            {/* Globe Icon for International Shipping */}
            <div className={`mr-3 rounded-full p-2 ${isInternational ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
              <Globe className="h-6 w-6" />
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
          className="space-y-6"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center mb-3">
              <Globe className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="font-medium text-blue-700">Zona de Envío Internacional</h3>
            </div>
          
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Selecciona la zona de destino para tu envío internacional:</p>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 bg-white p-3 rounded border border-gray-200 mb-4">
              <div>
                <div className="font-semibold mb-1">Zona 1:</div>
                <p>EE.UU, Canadá</p>
              </div>
              <div>
                <div className="font-semibold mb-1">Zona 2:</div>
                <p>Centro América, Caribe</p>
              </div>
              <div>
                <div className="font-semibold mb-1">Zona 3:</div>
                <p>Sudamérica</p>
              </div>
              <div>
                <div className="font-semibold mb-1">Zona 4:</div>
                <p>Europa, Asia Occidental</p>
              </div>
              <div className="md:col-span-2">
                <div className="font-semibold mb-1">Zona 5:</div>
                <p>Asia Oriental, Oceanía, África</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={() => {
                updateField('isValidated', true);
                if (onContinueToPackage) {
                  onContinueToPackage();
                }
              }}
              disabled={!selectedZone}
              className="w-full"
              variant={selectedZone ? "default" : "outline"}
            >
              {selectedZone ? (
                <>
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Continuar a Detalles de Paquete
                </>
              ) : (
                'Selecciona una zona para continuar'
              )}
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          {/* Origin ZIP Code */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700 mb-1">Origen</h3>
              <Toggle 
                id="useExistingClient"
                checked={useExistingClient}
                onChange={setUseExistingClient}
                label="Cliente existente"
              />
            </div>

            {useExistingClient ? (
              <div className="mb-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {loadingClients && (
                    <div className="absolute top-2 right-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                
                <AnimatePresence>
                  {clientSuggestions.length > 0 && (
                    <motion.div 
                      className="mt-1 border rounded shadow-lg max-h-48 overflow-y-auto z-10 bg-white"
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
                            <div className="font-medium">{client.nombre} {client.apellido_paterno}</div>
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
                    className="mt-2 p-2 bg-blue-50 rounded border border-blue-100"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex justify-between">
                      <div className="text-sm font-medium">
                        {selectedClient.nombre} {selectedClient.apellido_paterno}
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedClient(null);
                          updateField('clienteId', null);
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs mt-1">CP: {selectedClient.codigo_postal}</div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="flex">
                <Input
                  type="text"
                  placeholder="Código Postal"
                  value={state.originZip}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                    updateField('originZip', value);
                  }}
                  className="rounded-r-none"
                  maxLength={5}
                />
                {state.originZip.length === 5 && (
                  <div className="bg-gray-100 border-t border-r border-b rounded-r px-2 flex items-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                )}
              </div>
            )}

            {/* Only show origin ZIP validation results if not using an existing client */}
            {isValidated && originState && !selectedClient && (
              <motion.div 
                className="mt-2 p-2 bg-blue-50 rounded border border-blue-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-sm"><span className="font-semibold">Estado:</span> {originState}</p>
                <p className="text-sm"><span className="font-semibold">Municipio:</span> {originMunicipio}</p>
                {originColonias.length > 0 && (
                  <div className="mt-2">
                    <label className="text-sm font-semibold">Colonia:</label>
                    <Select
                value={selectedOriginColonia || "placeholder"}
                onValueChange={setSelectedOriginColonia}
              >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Busca una colonia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder">Busca una Colonia</SelectItem>
                        {originColonias.map((colonia, index) => (
                          <SelectItem key={index} value={colonia || `colonia-${index}`}>{colonia}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Destination ZIP Code */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700 mb-1">Destino</h3>
              {selectedClient && (
                <Toggle 
                  id="useExistingDestination"
                  checked={useExistingDestination}
                  onChange={setUseExistingDestination}
                  disabled={!selectedClient}
                  label="Usar destino existente"
                />
              )}
            </div>

            {useExistingDestination && selectedClient ? (
              <div className="mb-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Buscar destino..."
                    value={destSearchQuery}
                    onChange={(e) => setDestSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {loadingDestinations && (
                    <div className="absolute top-2 right-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                
                <AnimatePresence>
                  {destSuggestions.length > 0 && (
                    <motion.div 
                      className="mt-1 border rounded shadow-lg max-h-48 overflow-y-auto bg-white z-10"
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
                          <div className="font-medium">{destination.nombre_destinatario}</div>
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
                    className="mt-2 p-2 bg-blue-50 rounded border border-blue-100"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex justify-between">
                      <div className="text-sm font-medium">
                        {selectedDestination.nombre_destinatario}
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedDestination(null);
                          updateField('destinoId', null);
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs mt-1">
                      {selectedDestination.direccion}, {selectedDestination.colonia}, 
                      CP: {selectedDestination.codigo_postal}
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="flex">
                <Input
                  type="text"
                  placeholder="Código Postal"
                  value={state.destZip}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                    updateField('destZip', value);
                  }}
                  className="rounded-r-none"
                  maxLength={5}
                />
                {state.destZip.length === 5 && (
                  <div className="bg-gray-100 border-t border-r border-b rounded-r px-2 flex items-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                )}
              </div>
            )}

            {/* Only show destination ZIP validation results if not using an existing destination */}
            {isValidated && destState && !selectedDestination && (
              <motion.div 
                className="mt-2 p-2 bg-blue-50 rounded border border-blue-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-sm"><span className="font-semibold">Estado:</span> {destState}</p>
                <p className="text-sm"><span className="font-semibold">Municipio:</span> {destMunicipio}</p>
                {destColonias.length > 0 && (
                  <div className="mt-2">
                    <label className="text-sm font-semibold">Colonia:</label>
                    <Select
                      value={selectedDestColonia || "placeholder"}
                      onValueChange={setSelectedDestColonia}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Busca una Colonia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder">Busca una Colonia</SelectItem>
                        {destColonias.map((colonia, index) => (
                          <SelectItem key={index} value={colonia || `colonia-${index}`}>{colonia}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Zone information - displayed only when validated */}
          {isValidated && zone !== null && (
            <motion.div 
              className="md:col-span-2 p-3 bg-green-100 text-green-800 rounded-lg border border-green-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                <p className="font-semibold text-center">Zona de Envío: {zone}</p>
              </div>
            </motion.div>
          )}

          {/* Validate Button */}
          <motion.div 
            className="md:col-span-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.2 } }}
          >
            <Button
              onClick={validateZipCodes}
              disabled={!(state.originZip.length === 5 && state.destZip.length === 5)}
              className="w-full"
              variant={state.originZip.length === 5 && state.destZip.length === 5 ? "default" : "outline"}
            >
              {state.originZip.length === 5 && state.destZip.length === 5 ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Validar Códigos Postales
                </>
              ) : (
                <>
                  {state.originZip.length === 5 ? <Check className="h-4 w-4 mr-2 opacity-75" /> : <span className="h-4 w-4 mr-2 inline-flex items-center justify-center">1</span>}
                  {state.destZip.length === 5 ? <Check className="h-4 w-4 mr-2 opacity-75" /> : <span className="h-4 w-4 mr-2 inline-flex items-center justify-center">2</span>}
                  Ingresa ambos códigos postales
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}