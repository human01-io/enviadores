import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { apiService } from '../services/apiService';

interface ServicioCotizado {
  sku: string;
  nombre: string;
  precioBase: number;
  precioFinal: number;
  precioConIva: number;
  cargoSobrepeso: number;
  diasEstimados: number;
  pesoFacturable?: number;
  valorSeguro?: number;
  costoSeguro?: number;
  tipoPaquete?: string;
  opcionEmpaque?: string;
  requiereRecoleccion?: boolean;
}

interface Cliente {
  id?: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  razon_social?: string;
  rfc?: string;
  telefono: string;
  telefono_alternativo?: string;
  email: string;
  tipo: string;
  calle: string;
  numero_exterior: string;
  numero_interior?: string;
  colonia: string;
  municipio: string;
  estado: string;
  codigo_postal: string;
  pais?: string;
  referencia?: string;
  notas?: string;
  colonias?: string[]; // Add this
}

interface Destino {
  id?: string;
  cliente_id?: string;
  alias?: string;
  nombre_destinatario: string;
  direccion: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  pais?: string;
  telefono: string;
  email?: string;
  referencia?: string;
  instrucciones_entrega?: string;
  colonias?: string[]; // Add this
}

interface DatosClienteProps {
  selectedService: ServicioCotizado;
  onBack: () => void;
  onSubmit: (envioData: {
    cliente: Cliente;
    destino: Destino;
    shipmentId: string;
  }) => void;
  originData?: {
    estado: string;
    municipio: string;
    ciudad: string;
    colonias: string[];
  };
  destData?: {
    estado: string;
    municipio: string;
    ciudad: string;
    colonias: string[];
  };
  originZip: string;
  destZip: string;
}

interface ExternalLabelData {
  carrier: string;
  trackingNumber: string;
  labelFile: File | null;
}


export function DatosCliente({
  selectedService,
  onBack,
  onSubmit,
  // originData,
  // destData,
  originZip,
  destZip
}: DatosClienteProps) {
  const [step, setStep] = useState<'cliente' | 'destino' | 'confirmacion'>('cliente');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Cliente[]>([]);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [isExistingDestino, setIsExistingDestino] = useState(false);
  const [destinoSearchQuery, setDestinoSearchQuery] = useState('');
  const [destinoSuggestions, setDestinoSuggestions] = useState<Destino[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [zipValidation, setZipValidation] = useState({
    originValid: true,
    destValid: true
  });
  // Form states
  const [cliente, setCliente] = useState<Cliente>({
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
    codigo_postal: originZip || '',
    pais: 'México',
    referencia: '',
    notas: ''
  });

  const [destino, setDestino] = useState<Destino>({
    alias: '',
    nombre_destinatario: '',
    direccion: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigo_postal: destZip || '',
    pais: 'México',
    telefono: '',
    email: '',
    referencia: '',
    instrucciones_entrega: ''
  });
  // LABEL CREATION VARIABLES------------------------------------------------------------------------

  const [selectedOption, setSelectedOption] = useState<'none' | 'external' | 'manuable'>('none');
  const [externalLabelData, setExternalLabelData] = useState<ExternalLabelData>({
    carrier: '',
    trackingNumber: '',
    labelFile: null
  });
  const [manuableServices, setManuableServices] = useState<any[]>([]);
  const [selectedManuableService, setSelectedManuableService] = useState<any>(null);

  const [externalCost, setExternalCost] = useState<number | null>(null);

  const CheckIcon = ({ className = "" }: { className?: string }) => (
    <svg
      className={`w-5 h-5 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );

  // END LABEL CREATION VARIABLES------------------------------------------------------------------------
  const isFormValid = (): boolean => {
    return (
      cliente.nombre.trim() !== '' &&
      cliente.apellido_paterno.trim() !== '' &&
      cliente.telefono.trim() !== '' &&
      cliente.calle.trim() !== '' &&
      cliente.colonia.trim() !== '' &&
      cliente.municipio.trim() !== '' &&
      cliente.estado.trim() !== '' &&
      cliente.codigo_postal.trim() !== ''
    );
  };

  useEffect(() => {
    const fetchAddressData = async (zip: string, isOrigin: boolean) => {
      if (zip.length === 5) {
        try {
          const response = await fetch(`https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${zip}`);
          if (!response.ok) throw new Error("Código postal no encontrado");

          const data = await response.json();
          if (data?.zip_codes?.length > 0) {
            const zipData = data.zip_codes[0];
            const colonias = data.zip_codes.map((z: any) => z.d_asenta);

            if (isOrigin) {
              setCliente(prev => ({
                ...prev,
                estado: zipData.d_estado,
                municipio: zipData.d_mnpio,
                ciudad: zipData.d_ciudad || zipData.d_mnpio,
                colonias,  // Store colonias in client state
                colonia: colonias[0] || ''
              }));
            } else {
              setDestino(prev => ({
                ...prev,
                estado: zipData.d_estado,
                ciudad: zipData.d_ciudad || zipData.d_mnpio,
                colonias,  // Store colonias in destino state
                colonia: colonias[0] || ''
              }));
            }
            setZipValidation(prev => ({ ...prev, [isOrigin ? 'originValid' : 'destValid']: true }));
          } else {
            throw new Error("No se encontraron datos para este código postal");
          }
        } catch (error) {
          console.error("Error fetching address data:", error);
          setZipValidation(prev => ({ ...prev, [isOrigin ? 'originValid' : 'destValid']: false }));
        }
      }
    };

    // Fetch origin address when cliente.codigo_postal changes
    if (cliente.codigo_postal && cliente.codigo_postal.length === 5) {
      fetchAddressData(cliente.codigo_postal, true);
    }

    // Fetch destination address when destino.codigo_postal changes
    if (destino.codigo_postal && destino.codigo_postal.length === 5) {
      fetchAddressData(destino.codigo_postal, false);
    }
  }, [cliente.codigo_postal, destino.codigo_postal]);

  // Search for customers
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        try {
          const results = await apiService.searchCustomers(searchQuery);
          setCustomerSuggestions(results);
        } catch (error) {
          console.error('Search failed:', error);
          setCustomerSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setCustomerSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const searchDestinations = setTimeout(async () => {
      if (destinoSearchQuery.trim().length > 0 && cliente.id) {
        setIsSearching(true);
        try {
          const results = await apiService.getCustomerDestinations(cliente.id, destinoSearchQuery);
          setDestinoSuggestions(results);
        } catch (error) {
          console.error('Destination search failed:', error);
          setDestinoSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setDestinoSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(searchDestinations);


  }, [destinoSearchQuery, cliente.id]);


  // Add this effect to watch for ZIP code changes
  useEffect(() => {
    if ((cliente.codigo_postal?.length === 5 && cliente.codigo_postal !== originZip) ||
      (destino.codigo_postal?.length === 5 && destino.codigo_postal !== destZip)) {
      alert("Los códigos postales han cambiado. Los precios deben ser recalculados.");
      // You might want to automatically redirect or reset the quote here
    }
  }, [cliente.codigo_postal, destino.codigo_postal, originZip, destZip]);


  const handleSaveCustomer = async () => {
    if (!isFormValid()) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      const { id } = await apiService.createCustomer(cliente);
      setCliente(prev => ({ ...prev, id }));
      setIsExistingCustomer(true);
      alert('Cliente creado correctamente');
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error al crear el cliente');
    }
  };

  const handleClienteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.id) {
      alert('Por favor guarde el cliente primero');
      return;
    }
    setStep('destino');
  };


  const handleDestinoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cliente.id) {
      alert('Primero debe guardar el cliente');
      return;
    }

    // Validate required fields
    const requiredFields: Array<keyof Destino> = [
      'nombre_destinatario', 'direccion', 'colonia',
      'ciudad', 'estado', 'codigo_postal', 'telefono'
    ];

    for (const field of requiredFields) {
      if (!destino[field]) {
        alert(`Por favor complete el campo requerido: ${field.replace('_', ' ')}`);
        return;
      }
    }

    try {
      // Prepare payload - remove UI-only fields
      const { colonias, ...cleanData } = destino;
      const payload = {
        ...cleanData,
        cliente_id: cliente.id
      };

      if (isExistingDestino && destino.id) {
        // Update existing destination
        await apiService.updateDestination(destino.id, payload);
        alert('Destino actualizado correctamente');
      } else {
        // Create new destination
        const newDestino = await apiService.createDestination(payload);
        setDestino(newDestino);
        setIsExistingDestino(true);
        alert('Destino creado correctamente');
      }
    } catch (error) {
      console.error('Error saving destination:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Ocurrió un error'}`);
    }
  };

  const handleEnvioSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate ZIP codes match original quote
    if (cliente.codigo_postal !== originZip || destino.codigo_postal !== destZip) {
      alert("Los códigos postales no coinciden con la cotización original. Por favor genere una nueva cotización.");
      return;
    }

    if (!zipValidation.originValid || !zipValidation.destValid) {
      alert("Por favor verifique los códigos postales");
      return;
    }

    // Add validation for required IDs
    if (!cliente.id || !destino.id) {
      alert("Cliente o destino no válido. Por favor verifique los datos.");
      return;
    }


  if (selectedOption === 'external' && 
    (!externalLabelData.carrier || 
     !externalLabelData.trackingNumber ||
     !externalLabelData.labelFile)) {
  alert('Por favor complete todos los campos de la guía externa');
  return;
}

    try {
      // Create shipment data
      const shipmentData = {
        cliente_id: cliente.id,
        destino_id: destino.id,
        servicio_id: selectedService.sku,
        peso_real: selectedService.pesoFacturable || 1,
        peso_volumetrico: selectedService.pesoFacturable || 1,
        valor_declarado: selectedService.valorSeguro || 0,
        costo_seguro: selectedService.costoSeguro || 0,
        costo_envio: selectedService.precioFinal,
        iva: selectedService.precioConIva - selectedService.precioFinal,
        total: selectedService.precioConIva,
        tipo_paquete: selectedService.tipoPaquete || 'paquete',
        opcion_empaque: selectedService.opcionEmpaque || undefined,
        requiere_recoleccion: selectedService.requiereRecoleccion || false,
        // New fields
        costo_neto: selectedOption === 'external'
          ? externalCost ?? 0 // Fallback to 0 if null
          : selectedManuableService
            ? parseFloat(selectedManuableService.total_amount)
            : selectedService.precioFinal,
        metodo_creacion: selectedOption === 'external' ? 'externo' :
          selectedOption === 'manuable' ? 'manuable' : 'interno',
        ...(selectedOption === 'external' && {
          paqueteria_externa: externalLabelData.carrier,
          numero_guia_externa: externalLabelData.trackingNumber,
          // In a real implementation, you'd upload the file and store the path
          ruta_etiqueta_externa: externalLabelData.labelFile?.name || null,
        }),
        ...(selectedOption === 'manuable' && selectedManuableService && {
          uuid_manuable: selectedManuableService.uuid,
          servicio_manuable: `${selectedManuableService.carrier} - ${selectedManuableService.service}`
        })
      };

      // Create the shipment record
      const { id: shipmentId } = await apiService.createShipment(
      shipmentData,
      selectedOption === 'external' 
        ? { labelFile: externalLabelData.labelFile! } 
        : undefined
    );

      // Call onSubmit with all data including shipmentId
      onSubmit({
        cliente,
        destino,
        shipmentId
      });

    } catch (error) {
      console.error('Error creating shipment:', error);
      alert('Error al registrar el envío. Por favor intente nuevamente.');
    }
  };

  const handleSelectCustomer = (selectedCustomer: Cliente | null) => {
    // Handle null case when input is cleared
    if (!selectedCustomer) {
      setSearchQuery(''); // Clear search query
      setCustomerSuggestions([]); // Clear suggestions
      return;
    }

    // Only update if we have a valid customer
    setCliente(prev => ({
      ...prev,
      ...selectedCustomer,
      nombre: selectedCustomer.nombre || prev.nombre || '',
      apellido_paterno: selectedCustomer.apellido_paterno || prev.apellido_paterno || '',
      telefono: selectedCustomer.telefono || prev.telefono || '',
      email: selectedCustomer.email || prev.email || '',
      tipo: selectedCustomer.tipo || prev.tipo || 'persona'
    }));
    setIsExistingCustomer(true);
    setSearchQuery('');
    setCustomerSuggestions([]);
  };

  const handleSelectDestino = (selectedDestino: Destino | null) => {

    if (!selectedDestino) {
      setDestinoSearchQuery(''); // Clear search query
      setDestinoSuggestions([]); // Clear suggestions
      return;
    }

    setDestino(prev => ({
      ...prev,
      ...selectedDestino,
      nombre: selectedDestino.nombre_destinatario || prev.nombre_destinatario || '',
      direccion: selectedDestino.direccion || prev.direccion || '',
      codigo_postal: selectedDestino.codigo_postal || prev.codigo_postal || '',
      colonia: selectedDestino.colonia || prev.colonia || '',
      estado: selectedDestino.estado || prev.estado || ''
    }));
    setIsExistingDestino(true);
    setSearchQuery('');
    setDestinoSuggestions([]);
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCliente(prev => ({ ...prev, [name]: value }));
  };

  const handleDestinoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDestino(prev => ({ ...prev, [name]: value }));
  };

  const updateCustomerInDB = async () => {
    if (!cliente.id) return;

    try {
      await apiService.updateCustomer(cliente.id, cliente);
      alert('Cliente actualizado correctamente');
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Error al actualizar el cliente');
    }
  };




  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-blue-600">Datos del Envío</h2>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold">Servicio seleccionado:</h3>
        <p>{selectedService.nombre} - ${selectedService.precioConIva.toFixed(2)}</p>
      </div>

      {/* Flow steps */}
      <div className="flex mb-6 border-b">
        <button
          className={`pb-2 px-4 ${step === 'cliente' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          onClick={() => setStep('cliente')}
        >
          1. Datos del Cliente
        </button>
        <button
          className={`pb-2 px-4 ${step === 'destino' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          onClick={() => step === 'destino' && setStep('destino')}
          disabled={!cliente.nombre}
        >
          2. Datos de Destino
        </button>
        <button
          className={`pb-2 px-4 ${step === 'confirmacion' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          onClick={() => step === 'confirmacion' && setStep('confirmacion')}>
          3. Confirmación
        </button>
      </div>

      {step === 'cliente' && (
        <div>
          <div className="mb-6">
            <Combobox value={cliente} onChange={(value: Cliente | null) => {
              if (value === null) {
                // Handle clear case
                setSearchQuery('');
                setCustomerSuggestions([]);
              } else {
                handleSelectCustomer(value);
              }
            }}>
              <div className="relative">
                <Combobox.Input
                  displayValue={(c: Cliente) => c.nombre ? `${c.nombre} ${c.apellido_paterno || ''}`.trim() : ''}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isSearching ? "Buscando..." : "Buscar cliente existente..."}
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
                  {customerSuggestions.length === 0 && searchQuery !== '' ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                      No se encontraron clientes
                    </div>
                  ) : (
                    customerSuggestions.map((customer) => (
                      <Combobox.Option
                        key={customer.id || customer.telefono}
                        value={customer}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
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
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
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

          <form onSubmit={(e) => {
            e.preventDefault(); // This prevents the native form submission
            handleClienteSubmit(e); // Your custom handler
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre*</label>
                <input
                  type="text"
                  name="nombre"
                  value={cliente.nombre}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido Paterno*</label>
                <input
                  type="text"
                  name="apellido_paterno"
                  value={cliente.apellido_paterno}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido Materno</label>
                <input
                  type="text"
                  name="apellido_materno"
                  value={cliente.apellido_materno}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono*</label>
                <input
                  type="tel"
                  name="telefono"
                  value={cliente.telefono}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email*</label>
                <input
                  type="email"
                  name="email"
                  value={cliente.email}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo*</label>
                <select
                  name="tipo"
                  value={cliente.tipo}
                  onChange={handleClienteChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                >
                  <option value="persona">Persona</option>
                  <option value="empresa">Empresa</option>
                  <option value="gobierno">Gobierno</option>
                </select>
              </div>

              {cliente.tipo === 'empresa' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Razón Social</label>
                    <input
                      type="text"
                      name="razon_social"
                      value={cliente.razon_social}
                      onChange={handleClienteChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">RFC</label>
                    <input
                      type="text"
                      name="rfc"
                      value={cliente.rfc}
                      onChange={handleClienteChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Dirección del Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Calle*</label>
                  <input
                    type="text"
                    name="calle"
                    value={cliente.calle}
                    onChange={handleClienteChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Número Exterior*</label>
                  <input
                    type="text"
                    name="numero_exterior"
                    value={cliente.numero_exterior}
                    onChange={handleClienteChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Número Interior</label>
                  <input
                    type="text"
                    name="numero_interior"
                    value={cliente.numero_interior}
                    onChange={handleClienteChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Colonia*</label>
                  <select
                    name="colonia"
                    value={cliente.colonia}
                    onChange={handleClienteChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    required
                  >
                    {cliente.colonias?.map((colonia, index) => (
                      <option key={index} value={colonia}>{colonia}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Municipio*</label>
                  <input
                    type="text"
                    name="municipio"
                    value={cliente.municipio || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    required
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado*</label>
                  <input
                    type="text"
                    name="estado"
                    value={cliente.estado || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    required
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Código Postal*</label>
                  <div>
                    <input
                      type="text"
                      name="codigo_postal"
                      value={cliente.codigo_postal}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                        setCliente(prev => ({ ...prev, codigo_postal: value }));
                      }}
                      className={`mt-1 block w-full border ${!zipValidation.originValid ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}
                      required
                    />
                    {!zipValidation.originValid && (
                      <p className="text-red-500 text-sm">Código postal no válido</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">País*</label>
                  <input
                    type="text"
                    name="pais"
                    value={cliente.pais}
                    onChange={handleClienteChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Regresar
              </button>
              <div className="flex gap-2">
                {isExistingCustomer ? (
                  <button
                    type="submit"
                    onClick={updateCustomerInDB}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                  >
                    Actualizar Cliente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveCustomer}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={!isFormValid()}
                  >
                    Guardar Cliente
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={!isExistingCustomer && !cliente.id}
                >
                  Continuar a Destino
                </button>
              </div>
            </div>
          </form>
        </div>)}

      {step === 'destino' && (

        <div>
          <div className="mb-6">
            <Combobox value={destino}
              onChange={(value: Destino | null) => {
                if (value === null) {
                  setDestinoSearchQuery('');
                  setDestinoSuggestions([]);
                } else {
                  handleSelectDestino(value);
                }
              }
              }>
              <div className="relative">
                <Combobox.Input
                  displayValue={(d: Destino) => {
                    if (!d) return '';
                    return `${d.nombre_destinatario || ''} ${d.telefono ? `(${d.id})` : ''}`.trim();
                  }}
                  onChange={(e) => setDestinoSearchQuery(e.target.value)}
                  placeholder={isSearching ? "Buscando..." : "Buscar cliente existente..."}
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
                  {destinoSuggestions.length === 0 && destinoSearchQuery !== '' ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                      No se encontraron destinos
                    </div>
                  ) : (
                    destinoSuggestions.map((destino) => (
                      <Combobox.Option
                        key={destino.id || destino.direccion}
                        value={destino}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {destino.nombre_destinatario && <strong>{destino.nombre_destinatario}: </strong>}
                              {destino.direccion} ({destino.colonia})
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
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


          <form onSubmit={handleDestinoSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Alias (opcional)</label>
                <input
                  type="text"
                  name="alias"
                  value={destino.alias}
                  onChange={handleDestinoChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Ej. Casa, Oficina, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Destinatario*</label>
                <input
                  type="text"
                  name="nombre_destinatario"
                  value={destino.nombre_destinatario}
                  onChange={handleDestinoChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
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
                    className={`mt-1 block w-full border ${!zipValidation.destValid ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}
                    required
                  />
                  {!zipValidation.destValid && (
                    <p className="text-red-500 text-sm">Código postal no válido</p>
                  )}

                </div>
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
                  value={destino.email}
                  onChange={handleDestinoChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Referencia (opcional)</label>
                <input
                  type="text"
                  name="referencia"
                  value={destino.referencia}
                  onChange={handleDestinoChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Puntos de referencia cercanos"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Instrucciones de Entrega (opcional)</label>
                <textarea
                  name="instrucciones_entrega"
                  value={destino.instrucciones_entrega}
                  onChange={handleDestinoChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  rows={2}
                  placeholder="Ej. Dejar con el portero, llamar antes de entregar, etc."
                />
              </div>
            </div>

            <div className="flex justify-between pt-6">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => setStep('cliente')}
                className="flex items-center gap-1 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all 
               duration-200 shadow-sm hover:shadow-md active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Regresar
              </button>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {/* Save/Update Button */}
                <button
                  type="submit"
                  onClick={handleDestinoSubmit}
                  className={`px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95
                ${isExistingDestino
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  <div className="flex items-center gap-1.5">
                    {isExistingDestino ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    )}
                    {isExistingDestino ? 'Actualizar' : 'Registrar'}
                  </div>
                </button>

                {/* Continue Button */}
                <button
                  type="button"
                  onClick={() => setStep('confirmacion')}
                  className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all 
                duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  Continuar
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {step === 'confirmacion' && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800">Resumen del Envío</h3>

          {/* Service Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-700 mb-2">Servicio seleccionado</h4>
            <div className="grid grid-cols-2 gap-2">
              <p><span className="font-medium">Servicio:</span> {selectedService.nombre}</p>
              <p><span className="font-medium">Precio:</span> ${selectedService.precioConIva.toFixed(2)}</p>
              <p><span className="font-medium">Tiempo estimado:</span> {selectedService.diasEstimados} días</p>
              <p><span className="font-medium">Peso:</span> {selectedService.pesoFacturable || 1} kg</p>
            </div>
          </div>

          {/* Customer Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">Datos del Cliente</h4>
            <p>{cliente.nombre} {cliente.apellido_paterno}</p>
            <p>{cliente.calle} {cliente.numero_exterior}{cliente.numero_interior ? ` Int. ${cliente.numero_interior}` : ''}</p>
            <p>{cliente.colonia}, {cliente.municipio}</p>
            <p>{cliente.estado}, C.P. {cliente.codigo_postal}</p>
            <p>Tel: {cliente.telefono}</p>
            {cliente.email && <p>Email: {cliente.email}</p>}
          </div>

          {/* Destination Summary */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-700 mb-2">Datos de Destino</h4>
            <p>{destino.nombre_destinatario}</p>
            <p>{destino.direccion}</p>
            <p>{destino.colonia}, {destino.ciudad}</p>
            <p>{destino.estado}, C.P. {destino.codigo_postal}</p>
            <p>Tel: {destino.telefono}</p>
            {destino.email && <p>Email: {destino.email}</p>}
            {destino.instrucciones_entrega && (
              <p className="mt-2"><span className="font-medium">Instrucciones:</span> {destino.instrucciones_entrega}</p>
            )}
          </div>

          {/* Options Selection */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Opciones de Envío</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Option 1: External Label */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedOption === 'external' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
                onClick={() => setSelectedOption('external')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${selectedOption === 'external' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
                    {selectedOption === 'external' && <CheckIcon className="w-3 h-3 text-white" />}
                  </div>
                  <h4 className="font-medium">Registrar envío con guía externa</h4>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Si ya tienes una guía de otra paquetería, puedes registrarla aquí.
                </p>
              </div>

              {/* Option 2: Manuable API */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedOption === 'manuable' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
                onClick={() => setSelectedOption('manuable')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${selectedOption === 'manuable' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
                    {selectedOption === 'manuable' && <CheckIcon className="w-3 h-3 text-white" />}
                  </div>
                  <h4 className="font-medium">Obtener opciones de Manuable</h4>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Obtén cotizaciones y genera guías directamente con nuestros socios.
                </p>
              </div>
            </div>

            {/* External Label Form */}
            {selectedOption === 'external' && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold mb-4">Datos de la Guía Externa</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paquetería</label>
                    <select
                      value={externalLabelData.carrier}
                      onChange={(e) => setExternalLabelData({ ...externalLabelData, carrier: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Seleccionar paquetería</option>
                      <option value="FEDEX">FedEx</option>
                      <option value="DHL">DHL</option>
                      <option value="ESTAFETA">Estafeta</option>
                      <option value="UPS">UPS</option>
                      <option value="REDPACK">Redpack</option>
                      <option value="OTRO">Otra</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de Rastreo/Guía</label>
                    <input
                      type="text"
                      value={externalLabelData.trackingNumber}
                      onChange={(e) => setExternalLabelData({ ...externalLabelData, trackingNumber: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Ej: 1234567890"
                    />
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo Neto (MXN)</label>
                  <input
                    type="number"
                    value={externalCost ?? ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setExternalCost(isNaN(value) ? null : value);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Ej: 250.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>


                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta de Envío (PDF o imagen)</label>
                  <div className="flex items-center">
                    <label className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setExternalLabelData({ ...externalLabelData, labelFile: e.target.files[0] });
                          }
                        }}
                      />
                      Seleccionar archivo
                    </label>
                    {externalLabelData.labelFile && (
                      <span className="ml-3 text-sm text-gray-600">{externalLabelData.labelFile.name}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Sube la etiqueta de envío en formato PDF o imagen</p>
                </div>
              </div>
            )}

            {/* Manuable Options Form */}
            {selectedOption === 'manuable' && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold mb-4">Opciones de Manuable</h4>

                {manuableServices.length === 0 ? (
                  <div className="text-center py-6">
                    <button
                      onClick={async () => {
                        // Simulate API call to get rates
                        try {
                          // This would be replaced with actual API call to Manuable
                          const mockResponse = {
                            data: [
                              {
                                carrier: "FEDEX",
                                service: "standard",
                                total_amount: "400.0",
                                shipping_type: "local",
                                currency: "MXN",
                                uuid: "9964cf5d-b248-4d26-bdd6-586c43ea8e01"
                              },
                              {
                                carrier: "FEDEX",
                                service: "express",
                                total_amount: "450.0",
                                shipping_type: "local",
                                currency: "MXN",
                                uuid: "587ca7c9-e16a-4ddb-9e1b-0e01a86ee322"
                              }
                            ]
                          };
                          setManuableServices(mockResponse.data);
                        } catch (error) {
                          alert("Error al obtener opciones de Manuable");
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Obtener opciones de envío
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      Consultaremos las opciones disponibles para tu envío
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paquetería</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {manuableServices.map((service, index) => (
                            <tr key={index} className={selectedManuableService?.uuid === service.uuid ? 'bg-blue-50' : ''}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.carrier}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.service}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.shipping_type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${service.total_amount} {service.currency}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => setSelectedManuableService(service)}
                                  className={`px-3 py-1 rounded-md ${selectedManuableService?.uuid === service.uuid ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                                >
                                  {selectedManuableService?.uuid === service.uuid ? 'Seleccionado' : 'Seleccionar'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {selectedManuableService && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h5 className="font-semibold mb-2">Servicio seleccionado:</h5>
                        <p>{selectedManuableService.carrier} - {selectedManuableService.service}</p>
                        <p className="font-medium">Precio: ${selectedManuableService.total_amount} {selectedManuableService.currency}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Validation and Submission */}
            <div className="pt-4 border-t">
              {!zipValidation.originValid || !zipValidation.destValid ? (
                <div className="text-red-500 mb-4">
                  Los códigos postales no coinciden con la cotización original
                </div>
              ) : null}

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep('destino')}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 flex items-center gap-2 font-medium shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Regresar a Destino
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedOption === 'none') {
                      alert('Por favor selecciona una opción de envío');
                      return;
                    }

                    if (selectedOption === 'external' &&
                      (!externalLabelData.carrier ||
                        !externalLabelData.trackingNumber ||
                        externalCost === null)) {  // Changed check for number
                      alert('Por favor completa todos los campos de la guía externa');
                      return;
                    }

                    if (selectedOption === 'manuable' && !selectedManuableService) {
                      alert('Por favor selecciona un servicio de Manuable');
                      return;
                    }

                    handleEnvioSubmit();
                  }}
                  disabled={!zipValidation.originValid || !zipValidation.destValid}
                  className={`px-5 py-2.5 rounded-lg text-white font-medium shadow-md flex items-center gap-2 transition-all duration-200 ${(!zipValidation.originValid || !zipValidation.destValid)
                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-green-600 hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
                    }`}
                >
                  Registrar Envío
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}