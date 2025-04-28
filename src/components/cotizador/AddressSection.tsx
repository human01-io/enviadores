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

  // Search for destinations when client and query changes
  useEffect(() => {
    const searchDestinations = async () => {
      if (!selectedClient || destSearchQuery.trim().length < 2) {
        setDestSuggestions([]);
        return;
      }

      setLoadingDestinations(true);
      try {
        // Fix: Ensure we're passing customer_id as per API requirements
        // The parameter name in the API is customer_id, not cliente_id
        const results = await apiService.getCustomerDestinations(selectedClient.id);
        
        // Apply local filtering with the search query instead of using API filtering
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
    updateField('originZip', client.codigo_postal);
  };

  // Handle destination selection
  const handleDestinationSelect = (destination) => {
    setSelectedDestination(destination);
    setDestSuggestions([]);
    setDestSearchQuery('');
    updateField('destZip', destination.codigo_postal);
  };

  const handleToggleInternational = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    if ((!isChecked || isChecked) && (state.servicios || state.detallesCotizacion)) {
      if (!confirm("¿Está seguro? Esto reseteará toda la cotización actual.")) {
        return;
      }
    }
    updateField('isInternational', isChecked);
  };

  // Simplified toggle component
  const Toggle = ({ id, checked, onChange, disabled = false, label }) => (
    <div className="flex items-center space-x-2">
      {label && <span className="text-sm text-gray-600">{label}</span>}
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`} 
        />
      </button>
    </div>
  );

  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="space-y-4">
      {/* International Shipping Toggle */}
      <div className="p-3 rounded-lg bg-gray-100 mb-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">Envío Internacional</span>
          <Toggle 
            id="internationalShipping"
            checked={isInternational}
            onChange={handleToggleInternational}
            label=""
          />
        </div>
      </div>

      {isInternational ? (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">Zona de Envío Internacional</h3>
          <select
            value={selectedZone || ''}
            onChange={(e) => updateField('selectedZone', Number(e.target.value))}
            className="border p-2 w-full rounded"
            required
          >
            <option value="">Seleccione zona</option>
            {[1, 2, 3, 4, 5].map((zone) => (
              <option key={zone} value={zone}>
                Zona {zone}
              </option>
            ))}
          </select>

          {/* Continue button for international */}
          <div className="mt-4">
            <button
              onClick={() => updateField('isValidated', true)}
              className={`w-full text-white px-4 py-2.5 rounded ${selectedZone
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!selectedZone}
            >
              Continuar a Detalles de Paquete
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Origin ZIP Code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700">Código Postal de Origen</h3>
              <Toggle 
                id="useExistingClient"
                checked={useExistingClient}
                onChange={setUseExistingClient}
                label="Usar cliente existente"
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
                        onClick={() => setSelectedClient(null)}
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

            {isValidated && originState && (
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
              <h3 className="font-medium text-gray-700">Código Postal de Destino</h3>
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
                        onClick={() => setSelectedDestination(null)}
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

            {isValidated && destState && (
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
          <div className="mt-4">
            <button
              onClick={validateZipCodes}
              className={`w-full text-white px-4 py-2.5 rounded transition-colors ${state.originZip.length === 5 && state.destZip.length === 5
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!(state.originZip.length === 5 && state.destZip.length === 5)}
            >
              Validar Códigos Postales
            </button>
          </div>
        </div>
      )}
    </div>
  );
};