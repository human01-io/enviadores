import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { apiService } from '../../services/apiService';
import { Destino } from '../../types';

interface DestinoFormProps {
  destino: Destino;
  setDestino: (destino: Destino) => void;
  isExistingDestino: boolean;
  setIsExistingDestino: (isExisting: boolean) => void;
  isValid: boolean;
  clienteId?: string;
  destData?: {
    estado: string;
    municipio: string;
    ciudad: string;
    colonias: string[];
  };
  zipValidation: boolean;
}

export default function DestinoForm({
  destino,
  setDestino,
  isExistingDestino,
  setIsExistingDestino,
  isValid,
  clienteId,
  destData,
  zipValidation
}: DestinoFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [destinoSuggestions, setDestinoSuggestions] = useState<Destino[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search for destinations when query changes
  useEffect(() => {
    const searchDestinos = async () => {
      if (!clienteId || searchQuery.trim().length < 2) {
        setDestinoSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await apiService.getCustomerDestinations(clienteId, searchQuery);
        setDestinoSuggestions(results);
      } catch (error) {
        console.error('Destination search failed:', error);
        setDestinoSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchDestinos, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, clienteId]);

  useEffect(() => {
    const fetchAddressData = async (zip: string) => {
      if (zip.length === 5) {
        try {
          const response = await fetch(`https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${zip}`);
          if (!response.ok) throw new Error("Código postal no encontrado");
  
          const data = await response.json();
          if (data?.zip_codes?.length > 0) {
            const zipData = data.zip_codes[0];
            const colonias = data.zip_codes.map((z: any) => z.d_asenta);
            
            // Update the destino state with the fetched data
            setDestino(prev => ({
              ...prev,
              estado: zipData.d_estado,
              ciudad: zipData.d_ciudad || zipData.d_mnpio,
              colonias,
              colonia: colonias[0] || ''
            }));
          }
        } catch (error) {
          console.error("Error fetching address data:", error);
        }
      }
    };
  
    // Call the fetch function when ZIP code changes
    if (destino.codigo_postal && destino.codigo_postal.length === 5) {
      fetchAddressData(destino.codigo_postal);
    }
  }, [destino.codigo_postal]);

  // Handle destino selection
  const handleSelectDestino = (selectedDestino: Destino | null) => {
    if (!selectedDestino) {
      setSearchQuery('');
      setDestinoSuggestions([]);
      return;
    }

    setDestino(selectedDestino);
    setIsExistingDestino(true);
    setSearchQuery('');
    setDestinoSuggestions([]);
  };

  // Handle form changes
  const handleDestinoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDestino(prev => ({ ...prev, [name]: value }));
  };

  // Handle ZIP code changes with auto-formatting
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setDestino(prev => ({ ...prev, codigo_postal: value }));
  };

  // Update destino in DB
  const handleSaveDestino = async () => {
    if (!clienteId) {
      alert('Es necesario guardar el cliente primero');
      return;
    }

    try {
      if (isExistingDestino && destino.id) {
        await apiService.updateDestination(destino.id, {
          ...destino,
          cliente_id: clienteId
        });
        alert('Destino actualizado correctamente');
      } else {
        const newDestino = await apiService.createDestination({
          ...destino,
          cliente_id: clienteId
        });
        setDestino(prev => ({
          ...prev,
          ...newDestino,
          id: newDestino.id
        }));
        setIsExistingDestino(true);
        alert('Destino creado correctamente');
      }
    } catch (error) {
      console.error('Error saving destination:', error);
      alert('Error al guardar el destino');
    }
  };

  return (
    <div className="bg-green-50 p-4 rounded-lg shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4 text-green-700 flex items-center sticky top-0 bg-green-50 py-2 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        Datos del Destinatario
      </h3>
      
      {/* Only show if client ID exists */}
      {clienteId && (
        <div className="mb-4">
          <Combobox value={destino} onChange={handleSelectDestino}>
            <div className="relative">
              <Combobox.Input
                displayValue={(d: Destino) => d.nombre_destinatario || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isSearching ? "Buscando..." : "Buscar destino existente..."}
                className="w-full p-2 border border-gray-300 rounded-md"
              />

              {isSearching && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}

              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {destinoSuggestions.length === 0 && searchQuery !== '' ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                    No se encontraron destinos
                  </div>
                ) : (
                  destinoSuggestions.map((destino) => (
                    <Combobox.Option
                      key={destino.id || destino.telefono}
                      value={destino}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-green-100 text-green-900' : 'text-gray-900'}`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {destino.nombre_destinatario}
                          </span>
                          <span className="block text-xs text-gray-500 truncate">
                            {destino.direccion}, {destino.colonia}, {destino.ciudad}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-600">
                              ✓
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
      
      {/* Destino Form Fields */}
      <div className="space-y-4 overflow-y-auto pr-2 flex-grow max-h-[calc(100vh-16rem)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nombre Destinatario*</label>
            <input
              type="text"
              name="nombre_destinatario"
              value={destino.nombre_destinatario}
              onChange={handleDestinoChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono*</label>
            <input
              type="tel"
              name="telefono"
              value={destino.telefono}
              onChange={handleDestinoChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={destino.email || ''}
              onChange={handleDestinoChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Alias</label>
            <input
              type="text"
              name="alias"
              value={destino.alias || ''}
              onChange={handleDestinoChange}
              placeholder="Ej. Casa, Oficina, etc."
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>

        {/* Address Section */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-3">Dirección de Entrega</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Dirección*</label>
              <input
                type="text"
                name="direccion"
                value={destino.direccion}
                onChange={handleDestinoChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Código Postal*</label>
              <input
                type="text"
                name="codigo_postal"
                value={destino.codigo_postal}
                onChange={handleZipChange}
                className={`mt-1 block w-full border ${!zipValidation ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}
                required
              />
              {!zipValidation && (
                <p className="text-xs text-red-500 mt-1">
                  El código postal no coincide con la cotización
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Colonia*</label>
              <select
                name="colonia"
                value={destino.colonia}
                onChange={handleDestinoChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              >
                <option value="">Seleccionar colonia</option>
                {destino.colonias?.map((colonia, index) => (
                  <option key={index} value={colonia}>{colonia}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Ciudad*</label>
              <input
                type="text"
                name="ciudad"
                value={destino.ciudad}
                onChange={handleDestinoChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Estado*</label>
              <input
                type="text"
                name="estado"
                value={destino.estado}
                onChange={handleDestinoChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">País*</label>
              <input
                type="text"
                name="pais"
                value={destino.pais || 'México'}
                onChange={handleDestinoChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700">Referencia</label>
            <input
              type="text"
              name="referencia"
              value={destino.referencia || ''}
              onChange={handleDestinoChange}
              placeholder="Referencias para ubicar la dirección"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700">Instrucciones de Entrega</label>
            <textarea
              name="instrucciones_entrega"
              value={destino.instrucciones_entrega || ''}
              onChange={handleDestinoChange}
              placeholder="Ej. Dejar con el portero, llamar antes de entregar, etc."
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              rows={3}
            ></textarea>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-3">
          {isExistingDestino ? (
            <button
              type="button"
              onClick={handleSaveDestino}
              className="px-3 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
              disabled={!clienteId}
            >
              Actualizar Destino
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveDestino}
              className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              disabled={!isValid || !clienteId}
            >
              Guardar Destino
            </button>
          )}
        </div>
      </div>
    </div>
  );
}