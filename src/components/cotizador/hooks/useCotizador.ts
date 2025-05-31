import { useState, useEffect } from 'react';
import {
  CotizadorState,
  DeliveryFrequency,
  EstafetaResult,
  ServicioCotizado,
  DetallesCotizacion,
  Notification
} from '../utils/cotizadorTypes';
import { calculateZone } from '../../postalUtils';
import { apiService } from '../../../services';
import { Cliente, Destino } from '../../../types';

const initialState: CotizadorState = {
  originZip: "",
  destZip: "",
  zone: null,
  selectedZone: null,
  isInternational: false,
  packageType: "",
  length: "",
  width: "",
  height: "",
  weight: "",
  insurance: false,
  insuranceValue: "",
  volumetricWeight: 0,
  packagingOption: "EMP00", // Default to SIN EMPAQUE
  customPackagingPrice: null,
  collectionRequired: false,
  collectionPrice: null,
  isValidated: false,
  flowStage: 'quote',
  // Initialize new client and destination ID fields
  clienteId: null,
  destinoId: null,

};



export function useCotizador() {
  const [state, setState] = useState<CotizadorState>(initialState);
  const [deliveryFrequency, setDeliveryFrequency] = useState<DeliveryFrequency | null>(null);
  const [loadingFrequency, setLoadingFrequency] = useState(false);
  const [estafetaResult, setEstafetaResult] = useState<EstafetaResult | null>(null);
  const [loadingEstafeta, setLoadingEstafeta] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [servicios, setServicios] = useState<ServicioCotizado[] | null>(null);
  const [detallesCotizacion, setDetallesCotizacion] = useState<DetallesCotizacion | null>(null);
  const [selectedService, setSelectedService] = useState<ServicioCotizado | null>(null);
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    details: null
  });

  const [originState, setOriginState] = useState("");
  const [originMunicipio, setOriginMunicipio] = useState("");
  const [originCiudad, setOriginCiudad] = useState("");
  const [originColonias, setOriginColonias] = useState<string[]>([]);
  const [selectedOriginColonia, setSelectedOriginColonia] = useState("");

  const [destState, setDestState] = useState("");
  const [destMunicipio, setDestMunicipio] = useState("");
  const [destCiudad, setDestCiudad] = useState("");
  const [destColonias, setDestColonias] = useState<string[]>([]);
  const [selectedDestColonia, setSelectedDestColonia] = useState("");

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

const [originZipError, setOriginZipError] = useState<string | null>(null);
const [destZipError, setDestZipError] = useState<string | null>(null);

const [sameZipWarning, setSameZipWarning] = useState<string | null>(null);

  // Calculate volumetric weight when dimensions change
  useEffect(() => {
    if (state.packageType === "Paquete") {
      const parsedLength = parseFloat(state.length);
      const parsedWidth = parseFloat(state.width);
      const parsedHeight = parseFloat(state.height);

      // Check if all values are valid before calculating
      if (!isNaN(parsedLength) && !isNaN(parsedWidth) && !isNaN(parsedHeight)
        && parsedLength > 0 && parsedWidth > 0 && parsedHeight > 0) {
        const volWeight = (parsedLength * parsedWidth * parsedHeight) / 5000;
        setState(prev => ({
          ...prev,
          volumetricWeight: parseFloat(volWeight.toFixed(2))
        }));
      } else {
        setState(prev => ({
          ...prev,
          volumetricWeight: 0
        }));
      }
    }
  }, [state.length, state.width, state.height, state.packageType]);

  // Function to update form fields
  const updateField = (field: keyof CotizadorState, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  const resetLocationData = (isOrigin: boolean) => {
  if (isOrigin) {
    setOriginState("");
    setOriginMunicipio("");
    setOriginCiudad("");
    setOriginColonias([]);
    setSelectedOriginColonia("");
  } else {
    setDestState("");
    setDestMunicipio("");
    setDestCiudad("");
    setDestColonias([]);
    setSelectedDestColonia("");
  }
};

  // Function to fetch ZIP code data
  const fetchZipCodeData = async (zip: string, isOrigin: boolean) => {
  if (zip.length === 5) {
    try {
      // Reset the appropriate error state before new request
      if (isOrigin) {
        setOriginZipError(null);
      } else {
        setDestZipError(null);
      }
      
      // Make the API request
      const response = await fetch(`https://enviadores.com.mx/api/zip_codes.php?zip_code=${zip}`);
      
      // Check if response is OK (200-299)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      // Check if we actually got valid data (non-empty zip_codes array)
      if (data?.zip_codes?.length > 0) {
        const zipData = data.zip_codes[0];

        if (isOrigin) {
          // Set origin location data
          setOriginState(zipData.d_estado);
          setOriginMunicipio(zipData.d_mnpio);
          setOriginCiudad(zipData.d_ciudad || "");
          setOriginColonias(data.zip_codes.map((z: any) => z.d_asenta));
          setSelectedOriginColonia("");
        } else {
          // Set destination location data
          setDestState(zipData.d_estado);
          setDestMunicipio(zipData.d_mnpio);
          setDestCiudad(zipData.d_ciudad || "");
          setDestColonias(data.zip_codes.map((z: any) => z.d_asenta));
          setSelectedDestColonia("");
        }
      } else {
        // No data found case - empty zip_codes array
        if (isOrigin) {
          setOriginZipError("Código Postal de origen inexistente");
          console.log('Set originZipError');
        } else {
          setDestZipError("Código Postal de destino inexistente");
          console.log('Set destZipError');
        }
        resetLocationData(isOrigin);
      }
    } catch (error) {
      console.error(`Error fetching ${isOrigin ? 'origin' : 'destination'} ZIP code data:`, error);
      if (isOrigin) {
        setOriginZipError("Error al validar el código postal de origen");
      } else {
        setDestZipError("Error al validar el código postal de destino");
      }
      resetLocationData(isOrigin);
    }
  } else {
    // ZIP code not complete (not 5 digits)
    if (isOrigin) {
      setOriginZipError(null);
    } else {
      setDestZipError(null);
    }
    
    // Clear location data if input is empty
    if (zip.length === 0) {
      resetLocationData(isOrigin);
    }
  }
};

const checkSameZipCodes = () => {
  // Only check when both ZIPs are provided and valid
  if (state.originZip.length === 5 && state.destZip.length === 5) {
    if (state.originZip === state.destZip) {
      setSameZipWarning("¿Estás seguro de esta acción?");
    } else {
      setSameZipWarning(null);
    }
  } else {
    setSameZipWarning(null);
  }
};

  // Function to fetch delivery frequency
  const fetchDeliveryFrequency = async (postalCode: string) => {
    if (postalCode.length !== 5) return;

    setLoadingFrequency(true);
    try {
      const response = await fetch(`https://enviadores.com.mx/api/delivery-frequency.php?postal_code=${postalCode}`);
      const data: DeliveryFrequency = await response.json();
      setDeliveryFrequency(data.error ? null : data);
    } catch (error) {
      console.error("Error fetching delivery frequency:", error);
      setDeliveryFrequency(null);
    } finally {
      setLoadingFrequency(false);
    }
  };

  // Function to validate ZIP codes
  const validateZipCodes = () => {
    // Reset Estafeta results when validating new ZIP codes
    setOriginZipError(null);
    setDestZipError(null);
    setEstafetaResult(null);
    setLoadingEstafeta(false);

    

    if (state.originZip.length === 5 && state.destZip.length === 5) {
      // Reset the zone before new validation
      setState(prev => ({ ...prev, zone: null, isValidated: true }));

      // Fetch both ZIP codes
      fetchZipCodeData(state.originZip, true);
      fetchZipCodeData(state.destZip, false);

      // Calculate zone based on postal codes
      const originPostal = parseInt(state.originZip);
      const destPostal = parseInt(state.destZip);

      if (!isNaN(originPostal) && !isNaN(destPostal)) {
        const calculatedZone = calculateZone(originPostal, destPostal);
        setState(prev => ({ ...prev, zone: calculatedZone }));
      }

      // Fetch delivery frequency for destination
      fetchDeliveryFrequency(state.destZip);

      // Automatically trigger the Estafeta validation as well
      validateOnExternalSite();
      checkSameZipCodes();
    }
  };

  useEffect(() => {
  if (state.isValidated) {
    checkSameZipCodes();
  }
}, [state.originZip, state.destZip, state.isValidated]);

  // Function to validate with Estafeta
  const validateOnExternalSite = async () => {
    setLoadingEstafeta(true);
    setEstafetaResult(null);

    try {
      const formData = new FormData();
      formData.append('originZipCode', state.originZip);
      formData.append('destinationZipCode', state.destZip);
      formData.append('country', 'MEX');
      formData.append('language', '0');

      const response = await fetch('https://eproxy.alejandro-sarmiento-pa.workers.dev/', {
        method: 'POST',
        body: new URLSearchParams(formData as any),
      });

      const data = await response.json();
      setEstafetaResult(data);
      //console.log("Estafeta API Response:", data);
    } catch (error) {
      setEstafetaResult({
        reexpe: 'No',
        success: false,
        error: 'Error al conectar con Estafeta'
      });
    } finally {
      setLoadingEstafeta(false);
    }
  };

  // Function to validate on Estafeta site
  const validateThreeTimes = () => {
    // Create a form dynamically
    const form = document.createElement('form');
    form.action = 'https://frecuenciaentregasitecorecms.azurewebsites.net/';
    form.method = 'POST';
    form.target = '_blank'; // Open in new tab
    form.style.display = 'none';

    // Add origin ZIP
    const originInput = document.createElement('input');
    originInput.type = 'hidden';
    originInput.name = 'originZipCode';
    originInput.value = state.originZip;
    form.appendChild(originInput);

    // Add destination ZIP
    const destInput = document.createElement('input');
    destInput.type = 'hidden';
    destInput.name = 'destinationZipCode';
    destInput.value = state.destZip;
    form.appendChild(destInput);

    // Add country
    const countryInput = document.createElement('input');
    countryInput.type = 'hidden';
    countryInput.name = 'country';
    countryInput.value = 'MEX';
    form.appendChild(countryInput);

    // Add language
    const langInput = document.createElement('input');
    langInput.type = 'hidden';
    langInput.name = 'language';
    langInput.value = '0';
    form.appendChild(langInput);

    // Add to DOM and submit
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  // Function to handle report submission
  const handleReport = async () => {
    try {
      const apiUrl = import.meta.env.DEV
        ? `https://${location.hostname.replace('5173', '3000')}/api/report-outdated`
        : '/api/report-outdated'; // cambiar a 'https://enviadores.com.mx/api/report-outdated.php' para produccion

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          originZip: state.originZip,
          destZip: state.destZip,
          estafetaData: {
            reexpe: estafetaResult?.reexpe || 'N/A',
            ocurreForzoso: estafetaResult?.ocurreForzoso || 'N/A',
            deliveryDays: estafetaResult?.estafetaDeliveryDays || {}
          }
        })
      });

      setReportSubmitted(true);
      setTimeout(() => setReportSubmitted(false), 3000);
    } catch (error) {
      console.error("Full error:", error);
    }
  };

  const parseReexpeditionCost = (value: string | undefined): boolean => {
    if (!value) return false;

    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === "no") return false;

    const numericValue = parseFloat(normalizedValue.replace(/[^0-9.]/g, ''));
    return !isNaN(numericValue) && numericValue > 0;
  };

  // Function to fetch available shipping services
  const fetchQuote = async () => {
    if (state.isInternational && !state.selectedZone) {
      alert("Por favor seleccione una zona para envío internacional");
      return;
    }

    const parsedWeight = parseFloat(state.weight);
    if (isNaN(parsedWeight)) {
      alert("Por favor ingrese un peso válido");
      return;
    }

    try {
      const requiereReexpedicion = estafetaResult?.reexpe
        ? parseReexpeditionCost(estafetaResult.reexpe)
        : false;

      // Create the payload for price estimation
      const payload = {
        zona: state.isInternational ? state.selectedZone : state.zone,
        tipoPaquete: state.packageType,
        peso: parsedWeight,
        pesoVolumetrico: state.volumetricWeight,
        esInternacional: state.isInternational,
        valorSeguro: state.insurance ? parseFloat(state.insuranceValue) || 0 : 0,
        opcionEmpaque: state.packagingOption,
        precioEmpaquePersonalizado: state.packagingOption === 'EMP05' ? state.customPackagingPrice : null,
        requiereRecoleccion: state.collectionRequired,
        precioRecoleccion: state.collectionRequired ? state.collectionPrice : null,
        requiereReexpedicion: requiereReexpedicion
      };

      console.log('Fetching shipping quotes with payload:', JSON.stringify(payload));

      const response = await fetch('https://enviadores.com.mx/api/get-prices.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.exito) {
        const ivaRate = data.iva || 0.16; // Default to 16% if not provided

        const serviciosConTotales = data.servicios.map((servicio: any): ServicioCotizado => {
  const additionalChargesTotal = 
    data.cargosAdicionales.empaque + 
    data.cargosAdicionales.seguro + 
    data.cargosAdicionales.recoleccion + 
    (data.cargosAdicionales.reexpedicion || 0);
  
  const precioCompleto = servicio.precioFinal + additionalChargesTotal;
  const iva = precioCompleto * ivaRate;
  
  return {
    sku: servicio.sku,
    nombre: servicio.nombre,
    precioBase: servicio.precioBase,
    precioFinal: servicio.precioFinal,
    precioTotal: precioCompleto,
    precioConIva: precioCompleto + iva,
    iva: iva,
    cargoSobrepeso: servicio.cargoSobrepeso,
    diasEstimados: servicio.diasEstimados,
    peso: parsedWeight,
    pesoVolumetrico: state.volumetricWeight,
    esInternacional: state.isInternational,
    pesoFacturable: data.pesoFacturable,
    alto: state.packageType === "Paquete" ? parseFloat(state.height) || 0 : 1,
    largo: state.packageType === "Paquete" ? parseFloat(state.length) || 0 : 30,
    ancho: state.packageType === "Paquete" ? parseFloat(state.width) || 0 : 25,
    valorSeguro: state.insurance ? parseFloat(state.insuranceValue) || 1 : 1,
  };
});

        const calcularConIva = (amount: number) => amount + (amount * ivaRate);

        // Prepare quote details for storage
        const detallesCotizacion = {
          empaque: data.cargosAdicionales.empaque,
          empaqueConIva: calcularConIva(data.cargosAdicionales.empaque),
          seguro: data.cargosAdicionales.seguro,
          seguroConIva: calcularConIva(data.cargosAdicionales.seguro),
          recoleccion: data.cargosAdicionales.recoleccion,
          recoleccionConIva: calcularConIva(data.cargosAdicionales.recoleccion),
          reexpedicion: data.cargosAdicionales.reexpedicion || 0,
          reexpedicionConIva: calcularConIva(data.cargosAdicionales.reexpedicion || 0),
          pesoTotal: data.pesoTotal,
          pesoVolumetrico: data.pesoVolumetrico,
          pesoFacturable: data.pesoFacturable,
          iva: ivaRate,
          totalConIva: serviciosConTotales.reduce((sum: number, s: any) => sum + s.precioConIva, 0) +
            calcularConIva(data.cargosAdicionales.empaque) +
            calcularConIva(data.cargosAdicionales.seguro) +
            calcularConIva(data.cargosAdicionales.recoleccion) +
            calcularConIva(data.cargosAdicionales.reexpedicion || 0)
        };

        // Update state with the quote results
        setServicios(serviciosConTotales);
        setDetallesCotizacion(detallesCotizacion);

        console.log('Quote results retrieved successfully:', {
          services: serviciosConTotales.length,
          details: detallesCotizacion
        });

      } else {
        alert(data.error || "Error al obtener cotización");
      }
    } catch (error) {
      console.error("Error al obtener cotización:", error);
      alert("Error al conectar con el servidor");
    }
  };

  const resetForm = () => {
    setState(initialState);
    setDeliveryFrequency(null);
    setEstafetaResult(null);
    setServicios(null);
    setDetallesCotizacion(null);
    setSelectedService(null);
    setOriginState("");
    setOriginMunicipio("");
    setOriginCiudad("");
    setOriginColonias([]);
    setSelectedOriginColonia("");
    setDestState("");
    setDestMunicipio("");
    setDestCiudad("");
    setDestColonias([]);
    setSelectedDestColonia("");
    setUseExistingClient(false);
    setClientSearchQuery('');
    setClientSuggestions([]);
    setSelectedClient(null);
    setLoadingClients(false)
    setUseExistingDestination(false);
    setDestSearchQuery('');
    setDestSuggestions([]);
    setSelectedDestination(null);
    setLoadingDestinations(false);
    setDestZipError(null);
    setOriginZipError(null);
    setDetallesCotizacion(null);
  };

  // Function to continue to customer data entry
  const proceedToCustomerData = async () => {
    if (selectedService) {
      try {
        // Generate a unique temporary ID for the quotation
        const tempId = localStorage.getItem('current_cotizacion_id') ||
          `COT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Store the quotation ID in localStorage for retrieval
        localStorage.setItem('current_cotizacion_id', tempId);

        // Prepare quotation data with detailed information including all pricing
        const quotationData = {
          temp_id: tempId,
          origen_cp: state.originZip,
          destino_cp: state.destZip,
          tipo_paquete: state.packageType,

          // Selected service information with detailed pricing
          servicio_id: selectedService.sku,
          servicio_nombre: selectedService.nombre,
          precio_base: selectedService.precioBase,
          precio_sobrepeso: selectedService.cargoSobrepeso, // Added explicitly
          precio_final: selectedService.precioTotal,
          precio_total: selectedService.precioConIva,
          dias_estimados: selectedService.diasEstimados,

          // Package details with proper types
          peso_real: parseFloat(state.weight) || 0,
          peso_volumetrico: state.volumetricWeight || 0,
          peso_facturable: detallesCotizacion?.pesoFacturable ||
            Math.max(parseFloat(state.weight) || 0, state.volumetricWeight || 0),

          // Dimensions based on package type
          largo: state.packageType === "Paquete" ? parseFloat(state.length) || 0 : 0,
          ancho: state.packageType === "Paquete" ? parseFloat(state.width) || 0 : 0,
          alto: state.packageType === "Paquete" ? parseFloat(state.height) || 0 : 0,

          // Additional options
          valor_declarado: state.insurance ? parseFloat(state.insuranceValue) || 0 : 0,
          requiere_recoleccion: state.collectionRequired,
          opcion_empaque: state.packagingOption,

          // Additional charges
          empaque: detallesCotizacion?.empaque || 0,
          seguro: detallesCotizacion?.seguro || 0,
          recoleccion: detallesCotizacion?.recoleccion || 0,
          reexpedicion: detallesCotizacion?.reexpedicion || 0,

          // Content field initialized as empty
          contenido: '',

          // Customer and destination IDs
          cliente_id: state.clienteId || '',
          destino_id: state.destinoId || ''
        };

        console.log('Saving quotation before proceeding to customer data:',
          JSON.stringify(quotationData));

        try {
          // Use apiService to save the quotation
          const saveResult = await apiService.saveQuotation(quotationData);

          if (saveResult && saveResult.temp_id) {
            console.log("Quotation record created with temp_id:", saveResult.temp_id);
          }
        } catch (error) {
          console.error("Error saving quotation:", error);
          // We'll still proceed even if saving fails
        }

        // Move to customer data screen
        setState(prev => ({ ...prev, flowStage: 'customer-data' }));

      } catch (error) {
        console.error("Error in proceedToCustomerData:", error);
        // Still proceed even if there's an error
        setState(prev => ({ ...prev, flowStage: 'customer-data' }));
      }
    }
  };

  // Function to go back to quotation page
  const backToQuote = () => {
    setState(prev => ({ ...prev, flowStage: 'quote' }));
  };

  // Get filtered services based on international flag
  const filteredServicios = servicios?.filter(servicio =>
    state.isInternational
      ? servicio.sku.match(/^G(E[DN]0[1-5])$/) // Only show GED/GEN services
      : !servicio.esInternacional // Show only national services
  ) || [];

  const handleZipCodeUpdate = async (newOriginZip: string, newDestZip: string) => {
  console.log('Updating ZIP codes and location data:', { newOriginZip, newDestZip });
  
  try {
    // Fetch new location data for both ZIP codes
    const [originResponse, destResponse] = await Promise.all([
      fetch(`https://enviadores.com.mx/api/zip_codes.php?zip_code=${newOriginZip}`),
      fetch(`https://enviadores.com.mx/api/zip_codes.php?zip_code=${newDestZip}`)
    ]);
    
    const [originData, destData] = await Promise.all([
      originResponse.json(),
      destResponse.json()
    ]);
    
    // Update origin location data
    if (originData?.zip_codes?.length > 0) {
      const zipData = originData.zip_codes[0];
      setOriginState(zipData.d_estado);
      setOriginMunicipio(zipData.d_mnpio);
      setOriginCiudad(zipData.d_ciudad || "");
      setOriginColonias(originData.zip_codes.map((z: any) => z.d_asenta));
      setSelectedOriginColonia("");
    }
    
    // Update destination location data
    if (destData?.zip_codes?.length > 0) {
      const zipData = destData.zip_codes[0];
      setDestState(zipData.d_estado);
      setDestMunicipio(zipData.d_mnpio);
      setDestCiudad(zipData.d_ciudad || "");
      setDestColonias(destData.zip_codes.map((z: any) => z.d_asenta));
      setSelectedDestColonia("");
    }
    
    console.log('Location data updated successfully');
  } catch (error) {
    console.error('Error updating location data:', error);
  }
};


  return {
    state,
    updateField,
    deliveryFrequency,
    loadingFrequency,
    estafetaResult,
    loadingEstafeta,
    reportSubmitted,
    servicios: filteredServicios,
    setServicios,
    detallesCotizacion,
    setDetallesCotizacion,
    selectedService,
    setSelectedService,
    notification,
    setNotification,
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
    validateOnExternalSite,
    validateThreeTimes,
    handleReport,
    fetchQuote,
    resetForm,
    proceedToCustomerData,
    backToQuote,
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
  setSameZipWarning,
  handleZipCodeUpdate,
  };
}