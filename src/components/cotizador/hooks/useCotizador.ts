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
  destinoId: null
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

  // Function to fetch ZIP code data
  const fetchZipCodeData = async (zip: string, isOrigin: boolean) => {
    if (zip.length === 5) {
      try {
        const response = await fetch(`https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${zip}`);
        if (!response.ok) throw new Error("ZIP Code not found");
        const data = await response.json();

        if (data && data.zip_codes.length > 0) {
          const zipData = data.zip_codes[0];

          if (isOrigin) {
            setOriginState(zipData.d_estado);
            setOriginMunicipio(zipData.d_mnpio);
            setOriginCiudad(zipData.d_ciudad || "");
            setOriginColonias(data.zip_codes.map((z: any) => z.d_asenta));
            setSelectedOriginColonia("");
          } else {
            setDestState(zipData.d_estado);
            setDestMunicipio(zipData.d_mnpio);
            setDestCiudad(zipData.d_ciudad || "");
            setDestColonias(data.zip_codes.map((z: any) => z.d_asenta));
            setSelectedDestColonia("");
          }
        } else {
          // Reset values if no data found
          if (isOrigin) {
            setOriginState("");
            setOriginMunicipio("");
            setOriginCiudad("");
            setOriginColonias([]);
          } else {
            setDestState("");
            setDestMunicipio("");
            setDestCiudad("");
            setDestColonias([]);
          }
        }
      } catch (error) {
        console.error("Error fetching ZIP code data:", error);
        // Reset on error
        if (isOrigin) {
          setOriginState("");
          setOriginMunicipio("");
          setOriginCiudad("");
          setOriginColonias([]);
        } else {
          setDestState("");
          setDestMunicipio("");
          setDestCiudad("");
          setDestColonias([]);
        }
      }
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
    }
  };

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

      const response = await fetch('https://enviadores.com.mx/api/get-prices.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
        })
      });

      const data = await response.json();
      
      if (data.exito) {
        const ivaRate = data.iva || 0.16; // Default to 16% if not provided

        const serviciosConTotales = data.servicios.map((servicio: any) => {
          const iva = servicio.precioFinal * ivaRate;
          return {
            ...servicio,
            precioTotal: servicio.precioFinal,
            precioConIva: servicio.precioFinal + iva,
            iva: iva,
            esInternacional: state.isInternational
          };
        });

        const calcularConIva = (amount: number) => amount + (amount * ivaRate);

        setServicios(serviciosConTotales);
        setDetallesCotizacion({
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
  };

  // Function to continue to customer data entry
  const proceedToCustomerData = () => {
    if (selectedService) {
      setState(prev => ({ ...prev, flowStage: 'customer-data' }));
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

  return {
    state,
    updateField,
    deliveryFrequency,
    loadingFrequency,
    estafetaResult,
    loadingEstafeta,
    reportSubmitted,
    servicios: filteredServicios,
    detallesCotizacion,
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
    backToQuote
  };
}