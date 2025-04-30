import React, { useState, useEffect } from 'react';
import { CotizadorState } from './utils/cotizadorTypes';
import { apiService } from '../../services/apiService';

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
  isValidated
}) => {
  // State for existing client search
  const [useExistingClient, setUseExistingClient] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);

  // State for existing destination search
  const [useExistingDestination, setUseExistingDestination] = useState(false);
  const [destSearchQuery, setDestSearchQuery] = useState('');
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

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

  useEffect(() => {
    const searchDestinations = async () => {
      // Show all destinations when search box is focused (empty query)
      // Or when query is less than 2 characters (if you want to keep that)
      if (!selectedClient) {
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
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setClientSuggestions([]);
    setClientSearchQuery('');
    
    // Update the originZip field
    updateField('originZip', client.codigo_postal);
    
    // Also store the client ID in a clienteId field
    updateField('clienteId', client.id);
  };

  // Handle destination selection
  const handleDestinationSelect = (destination) => {
    setSelectedDestination(destination);
    setDestSuggestions([]);
    setDestSearchQuery('');
    
    // Update the destZip field
    updateField('destZip', destination.codigo_postal);
    
    // Also store the destination ID in a destinoId field
    updateField('destinoId', destination.id);
  };

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
  const Toggle = ({ id, checked, onChange, disabled = false, label }) => (
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
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </span>
      </button>
    </div>
  );

  const CheckIcon = ({ className = "h-4 w-4 text-green-600" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="space-y-2">
      {/* International Shipping Toggle with Graphics */}
      <div className="p-3 rounded-lg bg-gray-100 mb-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between cursor-pointer" onClick={handleToggleInternational}>
          <div className="flex items-center">
            {/* Globe Icon for International Shipping */}
            <div className={`mr-3 rounded-full p-2 ${isInternational ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-700">Envío Internacional</span>
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
      </div>

      {isInternational ? (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <h3 className="font-medium text-blue-700">Zona de Envío Internacional</h3>
            </div>
          
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Selecciona la zona de destino para tu envío internacional:</p>
              <select
                value={selectedZone || ''}
                onChange={(e) => updateField('selectedZone', Number(e.target.value))}
                className="border p-2 w-full rounded bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                required
              >
                <option value="">Seleccione zona</option>
                {[1, 2, 3, 4, 5].map((zone) => (
                  <option key={zone} value={zone}>
                    Zona {zone}
                  </option>
                ))}
              </select>
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

          {/* Continue button for international */}
          <div className="mt-4">
            <button
              onClick={() => updateField('isValidated', true)}
              className={`w-full text-white px-4 py-2.5 rounded-lg flex items-center justify-center ${selectedZone
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!selectedZone}
            >
              {selectedZone ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  Continuar a Detalles de Paquete
                </>
              ) : (
                'Selecciona una zona para continuar'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Origin ZIP Code */}
          <div>
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
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="border p-2 pr-8 w-full rounded"
                  />
                  {loadingClients && (
                    <div className="absolute top-2 right-2">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                
                {clientSuggestions.length > 0 && (
                  <div className="mt-1 border rounded shadow-lg max-h-48 overflow-y-auto z-10 bg-white">
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
                        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {client.id}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedClient && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
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
                        ✕
                      </button>
                    </div>
                    <div className="text-xs mt-1">CP: {selectedClient.codigo_postal}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex">
                <input
                  type="text"
                  placeholder="Código Postal"
                  value={state.originZip}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                    updateField('originZip', value);
                  }}
                  className="border p-2 w-full rounded-l"
                  maxLength={5}
                  pattern="\d*"
                />
                {state.originZip.length === 5 && (
                  <div className="bg-gray-100 border-t border-r border-b rounded-r px-2 flex items-center">
                    <CheckIcon />
                  </div>
                )}
              </div>
            )}

            {/* Only show origin ZIP validation results if not using an existing client */}
            {isValidated && originState && !selectedClient && (
              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                <p className="text-sm"><span className="font-semibold">Estado:</span> {originState}</p>
                <p className="text-sm"><span className="font-semibold">Municipio:</span> {originMunicipio}</p>
                {originColonias.length > 0 && (
                  <div className="mt-2">
                    <label className="text-sm font-semibold">Colonia:</label>
                    <select
                      value={selectedOriginColonia}
                      onChange={(e) => setSelectedOriginColonia(e.target.value)}
                      className="w-full mt-1 p-1.5 text-sm border border-gray-300 rounded"
                    >
                      <option value="">Selecciona una Colonia</option>
                      {originColonias.map((colonia, index) => (
                        <option key={index} value={colonia}>{colonia}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Destination ZIP Code */}
          <div>
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
                  <input
                    type="text"
                    placeholder="Buscar destino..."
                    value={destSearchQuery}
                    onChange={(e) => setDestSearchQuery(e.target.value)}
                    className="border p-2 pr-8 w-full rounded"
                  />
                  {loadingDestinations && (
                    <div className="absolute top-2 right-2">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                
                {destSuggestions.length > 0 && (
                  <div className="mt-1 border rounded shadow-lg max-h-48 overflow-y-auto bg-white z-10">
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
                  </div>
                )}

                {selectedDestination && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
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
                        ✕
                      </button>
                    </div>
                    <div className="text-xs mt-1">
                      {selectedDestination.direccion}, {selectedDestination.colonia}, 
                      CP: {selectedDestination.codigo_postal}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex">
                <input
                  type="text"
                  placeholder="Código Postal"
                  value={state.destZip}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                    updateField('destZip', value);
                  }}
                  className="border p-2 w-full rounded-l"
                  maxLength={5}
                  pattern="\d*"
                />
                {state.destZip.length === 5 && (
                  <div className="bg-gray-100 border-t border-r border-b rounded-r px-2 flex items-center">
                    <CheckIcon />
                  </div>
                )}
              </div>
            )}

            {/* Only show destination ZIP validation results if not using an existing destination */}
            {isValidated && destState && !selectedDestination && (
              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                <p className="text-sm"><span className="font-semibold">Estado:</span> {destState}</p>
                <p className="text-sm"><span className="font-semibold">Municipio:</span> {destMunicipio}</p>
                {destColonias.length > 0 && (
                  <div className="mt-2">
                    <label className="text-sm font-semibold">Colonia:</label>
                    <select
                      value={selectedDestColonia}
                      onChange={(e) => setSelectedDestColonia(e.target.value)}
                      className="w-full mt-1 p-1.5 text-sm border border-gray-300 rounded"
                    >
                      <option value="">Selecciona una Colonia</option>
                      {destColonias.map((colonia, index) => (
                        <option key={index} value={colonia}>{colonia}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Zone information - displayed only when validated */}
          {isValidated && zone !== null && (
            <div className="mt-2 p-3 bg-green-100 text-green-800 rounded-lg border border-green-200">
              <p className="font-semibold text-center">Zona de Envío: {zone}</p>
            </div>
          )}

          {/* Validate Button */}
          <div className="mt-6">
            <button
              onClick={validateZipCodes}
              className={`w-full text-white px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center ${state.originZip.length === 5 && state.destZip.length === 5
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!(state.originZip.length === 5 && state.destZip.length === 5)}
            >
              {state.originZip.length === 5 && state.destZip.length === 5 ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Validar Códigos Postales
                </>
              ) : (
                <>
                  {state.originZip.length === 5 ? <CheckIcon className="h-4 w-4 mr-2 text-white opacity-75" /> : <span className="h-4 w-4 mr-2 inline-flex items-center justify-center">1</span>}
                  {state.destZip.length === 5 ? <CheckIcon className="h-4 w-4 mr-2 text-white opacity-75" /> : <span className="h-4 w-4 mr-2 inline-flex items-center justify-center">2</span>}
                  Ingresa ambos códigos postales
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};