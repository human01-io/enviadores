import { useState, useEffect, useRef } from 'react';
import { Combobox } from '@headlessui/react';
import { apiService } from '../services/apiService';
import { Cliente, Destino } from '../types';

interface DestinoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDestinoSaved: (destino: Destino) => void;
    initialDestino?: Destino | null;
}

const DEFAULT_DESTINO: Destino = {
    cliente_id: '',
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

export function DestinoModal({ isOpen, onClose, onDestinoSaved, initialDestino }: DestinoModalProps) {
    const [clienteSearchQuery, setClienteSearchQuery] = useState('');
    const [clienteSuggestions, setClienteSuggestions] = useState<Cliente[]>([]);
    const [destinoSuggestions, setDestinoSuggestions] = useState<Destino[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isExistingDestino, setIsExistingDestino] = useState(false);
    const [destino, setDestino] = useState<Destino>(DEFAULT_DESTINO);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [showDestinoDropdown, setShowDestinoDropdown] = useState(false);
    const [zipValidation, setZipValidation] = useState(true);

    const [showIndicator, setShowIndicator] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [destinoSearchQuery, setDestinoSearchQuery] = useState('');
    const filteredDestinos = destinoSuggestions.filter(dest => 
        `${dest.nombre_destinatario} ${dest.direccion} ${dest.colonia} ${dest.ciudad}`
          .toLowerCase()
          .includes(destinoSearchQuery.toLowerCase())
      );

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
    }, [isOpen, initialDestino]);

    // Fetch destinations when client is selected
    useEffect(() => {
        if (selectedCliente?.id) {
            fetchDestinosForCliente(selectedCliente.id);
        }
    }, [selectedCliente]);

    const modalTitle = selectedCliente
        ? `${isExistingDestino ? 'Modificando' : 'Creando'} destino para:`
        : 'Crea o Modifica un destino';

    const fetchCliente = async (clienteId: string) => {
        try {
            const response = await apiService.searchCustomers(clienteId);
            if (response.length > 0) {
                setSelectedCliente(response[0]);
            }
        } catch (error) {
            console.error('Error fetching client:', error);
        }
    };

    const fetchDestinosForCliente = async (clienteId: string) => {
        try {
            const destinos = await apiService.getCustomerDestinations(clienteId);
            setDestinoSuggestions(destinos);
        } catch (error) {
            console.error('Error fetching destinations:', error);
            setDestinoSuggestions([]);
        }
    };

    const resetForm = () => {
    setDestino(DEFAULT_DESTINO);
    setSelectedCliente(null);
    setIsExistingDestino(false);
    setClienteSearchQuery('');
    setClienteSuggestions([]);
    setDestinoSuggestions([]);  // Make sure this is included
    setZipValidation(true);
    setDestinoSearchQuery('');  // Reset the destination search query too
};

    const handleSelectDestino = (selectedDestino: Destino) => {
        setDestino(selectedDestino);
        setIsExistingDestino(true);
        setShowDestinoDropdown(false);
    };

    const isFormValid = (): boolean => {
        return (
            !!selectedCliente &&
            destino.nombre_destinatario.trim() !== '' &&
            destino.direccion.trim() !== '' &&
            destino.colonia.trim() !== '' &&
            destino.ciudad.trim() !== '' &&
            destino.estado.trim() !== '' &&
            destino.codigo_postal.trim() !== '' &&
            destino.telefono.trim() !== ''
        );
    };

    useEffect(() => {
        const fetchAddressData = async (zip: string) => {
            if (zip.length === 5) {
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
                            colonia: colonias[0] || ''
                        }));
                        setZipValidation(true);
                    } else {
                        throw new Error("No se encontraron datos para este código postal");
                    }
                } catch (error) {
                    console.error("Error fetching address data:", error);
                    setZipValidation(false);
                }
            }
        };

        if (destino.codigo_postal && destino.codigo_postal.length === 5) {
            fetchAddressData(destino.codigo_postal);
        }
    }, [destino.codigo_postal]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (clienteSearchQuery.trim().length > 0) {
                setIsSearching(true);
                try {
                    const results = await apiService.searchCustomers(clienteSearchQuery);
                    setClienteSuggestions(results);
                } catch (error) {
                    console.error('Search failed:', error);
                    setClienteSuggestions([]);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setClienteSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [clienteSearchQuery]);

    const handleSelectCliente = (cliente: Cliente | null) => {
        if (!cliente) {
            setClienteSearchQuery('');
            setClienteSuggestions([]);
            return;
        }

        setSelectedCliente(cliente);
        setDestino(prev => ({
            ...prev,
            cliente_id: cliente.id || ''
        }));
        setClienteSearchQuery('');
        setClienteSuggestions([]);
    };

    const handleDestinoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDestino(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveDestino = async () => {
        if (!isFormValid()) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }

        try {
            if (isExistingDestino && destino.id) {
                await apiService.updateDestination(destino.id, destino);
                alert('Destino actualizado correctamente');
            } else {
                const newDestino = await apiService.createDestination(destino);
                setDestino(newDestino);
                setIsExistingDestino(true);
                alert('Destino creado correctamente');
            }
            onDestinoSaved(destino);
        } catch (error) {
            console.error('Error saving destination:', error);
            alert('Error al guardar el destino');
        }
    };

    const handleClearForm = () => {
        setDestino(DEFAULT_DESTINO);
    setSelectedCliente(null);
    setIsExistingDestino(false);
    setClienteSearchQuery('');
    setClienteSuggestions([]);
    setDestinoSuggestions([]);  // Make sure this is included
    setZipValidation(true);
    setDestinoSearchQuery('');
    };

    const handleClose = () => {
        handleClearForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {modalTitle}
                        </h2>
                        {selectedCliente ? (
                            <p className="text-gray-600">
                                {selectedCliente.nombre} {selectedCliente.apellido_paterno} ({selectedCliente.telefono})
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 mt-1">Primero selecciona el cliente</p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable content */}
                <div  className="flex-1 overflow-y-auto p-4" ref={scrollContainerRef}>
                    <div className="relative max-h-[60vh] overflow-y-auto">
                        {/* Client Search - Always visible */}
                        <div className="mb-6">
                            <Combobox value={selectedCliente} onChange={setSelectedCliente}>
                                <div className="relative">
                                    <Combobox.Input
                                        displayValue={(c: Cliente | null) => c ? `${c.nombre} ${c.apellido_paterno} - ${c.telefono}` : ''}
                                        onChange={(e) => setClienteSearchQuery(e.target.value)}
                                        placeholder="Buscar cliente..."
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        {clienteSuggestions.map((cliente) => (
                                            <Combobox.Option
                                                key={cliente.id}
                                                value={cliente}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                                                }
                                            >
                                                {({ selected }) => (
                                                    <>
                                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                            {cliente.nombre} {cliente.apellido_paterno} - {cliente.telefono}
                                                        </span>
                                                        {selected && (
                                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                                                ✓
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </Combobox.Option>
                                        ))}
                                    </Combobox.Options>
                                </div>
                            </Combobox>
                        </div>


                        {/* Only show the rest if client is selected */}
                        {selectedCliente && (
                            <div className="mb-6 relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Busca un destino si quieres modificarlo
                            </label>
                            <div
                              className="w-full p-2 border border-gray-300 rounded-md cursor-pointer"
                              onClick={() => setShowDestinoDropdown(!showDestinoDropdown)}
                            >
                              {destino.nombre_destinatario || 'Seleccionar destino existente...'}
                            </div>
                          
                            {showDestinoDropdown && (
                              <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                                {/* Search input */}
                                <div className="sticky top-0 bg-white p-2 border-b">
                                  <input
                                    type="text"
                                    placeholder="Buscar destino..."
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={destinoSearchQuery}
                                    onChange={(e) => setDestinoSearchQuery(e.target.value)}
                                    autoFocus
                                  />
                                </div>
                          
                                {/* Results list */}
                                <div className="py-1">
                                  {filteredDestinos.length > 0 ? (
                                    filteredDestinos.map((dest) => (
                                      <div
                                        key={dest.id}
                                        className="cursor-pointer select-none py-2 px-4 hover:bg-blue-100"
                                        onClick={() => {
                                          handleSelectDestino(dest);
                                          setDestinoSearchQuery('');
                                        }}
                                      >
                                        <div className="font-medium">{dest.nombre_destinatario}</div>
                                        <div className="text-sm text-gray-500">
                                          {dest.direccion}, {dest.colonia}, {dest.ciudad}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="py-2 px-4 text-gray-500 text-sm">
                                      No se encontraron destinos
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}



                        <form className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alias
                  </label>
                  <input
                    type="text"
                    name="alias"
                    value={destino.alias || ''}
                    onChange={handleDestinoChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Casa, Oficina, etc."
                  />
                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre Destinatario*</label>
                                    <input
                                        type="text"
                                        name="nombre_destinatario"
                                        value={destino.nombre_destinatario}
                                        onChange={handleDestinoChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        placeholder="Nombre completo del destinatario"
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
                                        placeholder="Número de teléfono (10 dígitos)"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Dirección*</label>
                                    <input
                                        type="text"
                                        name="direccion"
                                        value={destino.direccion}
                                        onChange={handleDestinoChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        placeholder="Calle y número"
                                        required
                                    />
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
                                        placeholder="Ciudad o municipio"
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
                                        placeholder="Estado"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Código Postal*</label>
                                    <div>
                                        <input
                                            type="text"
                                            name="codigo_postal"
                                            value={destino.codigo_postal}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                                                setDestino(prev => ({ ...prev, codigo_postal: value }));
                                            }}
                                            className={`mt-1 block w-full border ${!zipValidation ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}
                                            placeholder="5 dígitos"
                                            required
                                        />
                                        {!zipValidation && (
                                            <p className="text-red-500 text-sm">Código postal no válido</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">País*</label>
                                    <input
                                        type="text"
                                        name="pais"
                                        value={destino.pais}
                                        onChange={handleDestinoChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        placeholder="País"
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
                                        placeholder="Correo electrónico del destinatario"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Referencia</label>
                                    <input
                                        type="text"
                                        name="referencia"
                                        value={destino.referencia || ''}
                                        onChange={handleDestinoChange}
                                        placeholder="Puntos de referencia cercanos"
                                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Instrucciones de Entrega</label>
                                    <textarea
                                        name="instrucciones_entrega"
                                        value={destino.instrucciones_entrega || ''}
                                        onChange={handleDestinoChange}
                                        rows={3}
                                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        placeholder="Ej. Dejar con el portero, llamar antes de entregar, etc."
                                    ></textarea>
                                </div>
                            </div>
                        </form>
                        {showIndicator && (
                            <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none flex justify-end items-end pb-2">
                                <svg
                                    className="w-5 h-5 text-gray-500 animate-bounce"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
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
                        disabled={!selectedCliente}
                    >
                        Limpiar
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
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-blue-300 cursor-not-allowed'
                            }`}
                        disabled={!isFormValid()}
                    >
                        {isExistingDestino ? 'Actualizar Destino' : 'Guardar Destino'}
                    </button>
                </div>
            </div>
        </div>
    );
}