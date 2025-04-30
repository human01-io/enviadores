import { useEffect, useState } from "react";
import { calculateZone } from "./postalUtils";
import { DatosCliente } from './DatosCliente';
import '../App.css'


interface DeliveryFrequency {
  lunes: boolean;
  martes: boolean;
  miercoles: boolean;
  jueves: boolean;
  viernes: boolean;
  sabado: boolean;
  domingo: boolean;
  frecuencia: string;
  ocurre_forzoso: boolean;
  zona_extendida: boolean;
  garantia_maxima: string;
  error?: string;
}
interface EstafetaResult {
  reexpe: string;
  success: boolean;
  error?: string;
  ocurreForzoso?: string;
  estafetaDeliveryDays?: {
    [key: string]: boolean;
  };
  htmlSnippet?: string;
}

interface ServicioCotizado {
  sku: string;
  nombre: string;
  precioBase: number;
  precioFinal: number;
  cargoSobrepeso: number;
  diasEstimados: number;
  precioTotal: number;
  precioConIva: number;
  iva: number;
  pesoFacturable?: number;
  esInternacional: boolean;
}

interface DetallesCotizacion {
  empaque: number;
  empaqueConIva: number;
  seguro: number;
  seguroConIva: number;
  recoleccion: number;
  recoleccionConIva: number;
  reexpedicion: number;
  reexpedicionConIva: number;
  pesoTotal: number;
  pesoVolumetrico: number;
  pesoFacturable: number;
  iva: number;
  totalConIva: number;
}

interface Notification {
  show: boolean;
  message: string;
  details?: any; // You can make this more specific based on what details you want to show
}

function Cotizador() {
  const [originZip, setOriginZip] = useState("");
  const [destZip, setDestZip] = useState("");
  const [zone, setZone] = useState<number | null>(null);

  const [isInternational, setIsInternational] = useState(false);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);

  const [deliveryFrequency, setDeliveryFrequency] = useState<DeliveryFrequency | null>(null);
  const [loadingFrequency, setLoadingFrequency] = useState(false);

  const [estafetaResult, setEstafetaResult] = useState<EstafetaResult | null>(null);
  const [loadingEstafeta, setLoadingEstafeta] = useState(false);

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

  const [packageType, setPackageType] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [insurance, setInsurance] = useState(false);
  const [volumetricWeight, setVolumetricWeight] = useState(0);

  const [isValidated, setIsValidated] = useState(false);

  const [reportSubmitted, setReportSubmitted] = useState(false);

  const [packagingOption, setPackagingOption] = useState("EMP00"); // Default to SIN EMPAQUE
  const [customPackagingPrice, setCustomPackagingPrice] = useState<number | null>(null);
  const [collectionRequired, setCollectionRequired] = useState(false);
  const [collectionPrice, setCollectionPrice] = useState<number | null>(null);
  const [insuranceValue, setInsuranceValue] = useState("");

  const [servicios, setServicios] = useState<ServicioCotizado[] | null>(null);
  const [detallesCotizacion, setDetallesCotizacion] = useState<DetallesCotizacion | null>(null);

  const [selectedService, setSelectedService] = useState<ServicioCotizado | null>(null);

  const [flowStage, setFlowStage] = useState<'quote' | 'customer-data'>('quote');

  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    details: null
  });

  const resetForm = () => {
    setOriginZip("");
    setDestZip("");
    setZone(null);
    setSelectedZone(null);
    setPackageType("");
    setLength("");
    setWidth("");
    setHeight("");
    setWeight("");
    setInsurance(false);
    setVolumetricWeight(0);
    setPackagingOption("EMP00"); // Reset to "Sin empaque"
    setCustomPackagingPrice(null);
    setCollectionRequired(false);
    setCollectionPrice(null);
    setInsuranceValue("");
    setServicios(null);
    setDetallesCotizacion(null);
    setIsValidated(false);
    setDeliveryFrequency(null);
    setEstafetaResult(null);
  };

  // Add to your component file
  const ArrowRightIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );

  const FlagIcon = ({ className = "" }) => (
    <svg
      className={`w-4 h-4 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z"
      />
    </svg>
  );

  const Spinner = ({ className }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const ExclamationTriangleIcon = ({ className = "" }: { className?: string }) => (
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
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );

  const ArrowPathIcon = ({ className = "" }: { className?: string }) => (
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
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );

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

  // Function to fetch deliveryfrequency
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

  // Function to validate both ZIP codes
  const validateZipCodes = () => {
    // Reset Estafeta results when validating new ZIP codes
    setEstafetaResult(null);
    setLoadingEstafeta(false);

    if (originZip.length === 5 && destZip.length === 5) {
      // Reset the zone before new validation
      setZone(null);

      // Set validation state first
      setIsValidated(true);

      // Fetch both ZIP codes
      fetchZipCodeData(originZip, true);
      fetchZipCodeData(destZip, false);

      // Calculate zone based on postal codes
      const originPostal = parseInt(originZip);
      const destPostal = parseInt(destZip);

      if (!isNaN(originPostal) && !isNaN(destPostal)) {
        const calculatedZone = calculateZone(originPostal, destPostal);
        setZone(calculatedZone);
      }
      // Fetch delivery frequency for destination
      fetchDeliveryFrequency(destZip);
    }
  };

  const validateOnExternalSite = async () => {
    setLoadingEstafeta(true);
    setEstafetaResult(null);

    try {
      const formData = new FormData();
      formData.append('originZipCode', originZip);
      formData.append('destinationZipCode', destZip);
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
    originInput.value = originZip;
    form.appendChild(originInput);

    // Add destination ZIP
    const destInput = document.createElement('input');
    destInput.type = 'hidden';
    destInput.name = 'destinationZipCode';
    destInput.value = destZip;
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

  const handleReport = async () => {
    try {

      const apiUrl = import.meta.env.DEV
        ? `https://${location.hostname.replace('5173', '3000')}/api/report-outdated`
        : '/api/report-outdated'; // cambiar a 'https://enviadores.com.mx/api/report-outdated.php' para produccion
      console.log("Making API call with:", {
        originZip,
        destZip,
        estafetaData: {
          reexpe: estafetaResult?.reexpe,
          ocurreForzoso: estafetaResult?.ocurreForzoso,
          deliveryDays: estafetaResult?.estafetaDeliveryDays
        }
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          originZip,
          destZip,
          estafetaData: {
            reexpe: estafetaResult?.reexpe || 'N/A',
            ocurreForzoso: estafetaResult?.ocurreForzoso || 'N/A',
            deliveryDays: estafetaResult?.estafetaDeliveryDays || {}
          }
        })
      });

      console.log("Response status:", response.status);
      const responseBody = await response.text(); // First get as text
      console.log("Raw response:", responseBody);

      try {
        const jsonData = JSON.parse(responseBody);
        console.log("Parsed JSON:", jsonData);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
      }

      setReportSubmitted(true);
      setTimeout(() => setReportSubmitted(false), 3000);
    } catch (error) {
      console.error("Full error:", error);
    }
  };


  const renderDeliveryDays = (frequency: DeliveryFrequency) => {
    const days = [
      { name: 'Lunes', key: 'lunes', short: 'L' },
      { name: 'Martes', key: 'martes', short: 'M' },
      { name: 'Miércoles', key: 'miercoles', short: 'MI' },
      { name: 'Jueves', key: 'jueves', short: 'J' },
      { name: 'Viernes', key: 'viernes', short: 'V' },
      { name: 'Sábado', key: 'sabado', short: 'S' },
      { name: 'Domingo', key: 'domingo', short: 'D' },
    ];



    return (
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Días de entrega:</h4>
        <div className="flex flex-wrap items-center gap-4">
          {/* Days circles */}
          <div className="flex gap-2">
            {days.map(day => (
              <div
                key={day.key}
                className={`w-8 h-8 rounded-full flex items-center justify-center 
                                    ${frequency[day.key as keyof DeliveryFrequency]
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'}`}
                title={day.name}
              >
                {day.short}
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  };

  // Add this component to render frequency info
  const renderFrequencyInfo = () => {
    if (loadingFrequency) {
      return <div className="mt-4 text-gray-500">Cargando información de entrega...</div>;
    }

    if (!deliveryFrequency) {
      return <div className="mt-4 text-yellow-600">No se encontró información de entrega para este código postal</div>;
    }

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Información de Entrega</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><span className="font-semibold">Frecuencia:</span> {deliveryFrequency.frecuencia}</p>
            <p><span className="font-semibold">Garantía máxima:</span> {deliveryFrequency.garantia_maxima}</p>
          </div>
          <div>
            <p>
              <span className="font-semibold">Zona extendida:</span>
              {deliveryFrequency.zona_extendida ? (
                <span className="text-red-600 ml-1">Sí (puede tener costo adicional)</span>
              ) : (
                <span className="text-green-600 ml-1">No</span>
              )}
            </p>
            <p>
              <span className="font-semibold">Recolección en sucursal:</span>
              {deliveryFrequency.ocurre_forzoso ? (
                <span className="text-red-600 ml-1">Requerida</span>
              ) : (
                <span className="text-green-600 ml-1">No requerida</span>
              )}
            </p>
          </div>
        </div>

        {renderDeliveryDays(deliveryFrequency)}
      </div>
    );
  };

  const renderEstafetaDeliveryDays = (deliveryDays: { [key: string]: boolean } | undefined) => {
    if (!deliveryDays) return null;

    const days = [
      { name: 'Lunes', key: 'lunes' },
      { name: 'Martes', key: 'martes' },
      { name: 'Miercoles', key: 'miercoles' },
      { name: 'Jueves', key: 'jueves' },
      { name: 'Viernes', key: 'viernes' },
      { name: 'Sábado', key: 's&#225;bado' },
      { name: 'Domingo', key: 'domingo' }
    ];

    return (
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Días de entrega disponibles:</h4>
        <div className="flex flex-wrap gap-2">
          {days.map(day => (
            <div
              key={day.key}
              className={`px-3 py-1 rounded-full ${deliveryDays[day.key]
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-500'
                }`}
            >
              <div className="flex items-center">
                {deliveryDays[day.key] ? (
                  <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {day.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };


  const renderEstafetaResults = () => {
    if (loadingEstafeta) {
      return <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-600">Consultando Estafeta...</p>
      </div>;
    }

    if (!estafetaResult) return null;

    return (
      <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 relative">
        <h3 className="font-semibold text-lg mb-3 text-blue-600">Resultados de Estafeta</h3>

        {/* Cost Information */}
        <div className="mb-3">
          <p className="font-medium">Costo de Reexpedición:</p>
          <p className={`text-lg ${estafetaResult.reexpe === 'No' ? 'text-green-600' : 'text-blue-600'
            }`}>
            {estafetaResult.reexpe === 'No' ? 'Sin costo adicional' : estafetaResult.reexpe}
          </p>
        </div>

        {/* NEW: Ocurre Forzoso Information */}
        <div>
          <p className="font-medium">Ocurre Forzoso:</p>
          <p className={`${estafetaResult.ocurreForzoso === 'No' ? 'text-green-600' : 'text-yellow-600'
            }`}>
            {estafetaResult.ocurreForzoso || 'No disponible'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {estafetaResult.ocurreForzoso === 'No'
              ? 'No se requiere recolección en sucursal'
              : 'Se requiere recolección en sucursal'}
          </p>
        </div>
        {renderEstafetaDeliveryDays(estafetaResult.estafetaDeliveryDays)}

        {/* Added validation button */}
        <button
          onClick={validateThreeTimes}
          className="absolute bottom-2 right-2 text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Validar tres veces
        </button>
      </div>
    );
  };

  // Filtra servicios internacionales
  const filteredServicios = servicios?.filter(servicio =>
    isInternational
      ? servicio.sku.match(/^G(E[DN]0[1-5])$/) // Only show GED/GEN services
      : !servicio.esInternacional // Show only national services
  ) || [];

  const parseReexpeditionCost = (value: string | undefined): boolean => {
    if (!value) return false;

    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === "no") return false;

    const numericValue = parseFloat(normalizedValue.replace(/[^0-9.]/g, ''));
    return !isNaN(numericValue) && numericValue > 0;
  };

  // Function to fetch available shipping services
  const fetchQuote = async () => {
    if (isInternational && !selectedZone) {
      alert("Por favor seleccione una zona para envío internacional");
      return;
    }

    const parsedWeight = parseFloat(weight);
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
          zona: isInternational ? selectedZone : zone,
          tipoPaquete: packageType,  // Changed from packageType
          peso: parsedWeight,  // Changed from weight
          pesoVolumetrico: volumetricWeight,  // Changed from volumetricWeight
          esInternacional: isInternational,
          valorSeguro: insurance ? parseFloat(insuranceValue) || 0 : 0,  // Changed from insuranceValue
          opcionEmpaque: packagingOption,  // Changed from packagingOption
          precioEmpaquePersonalizado: packagingOption === 'EMP05' ? customPackagingPrice : null,  // Changed from customPackagingPrice
          requiereRecoleccion: collectionRequired,  // Changed from collectionRequired
          precioRecoleccion: collectionRequired ? collectionPrice : null,
          requiereReexpedicion: requiereReexpedicion //  // Changed from collectionPrice
        })
      });

      const data = await response.json();
      console.log('Received response:', data);
      if (data.exito) {
        const ivaRate = data.iva || 0.16; // Default to 16% if not provided

        const serviciosConTotales = data.servicios.map((servicio: any) => {
          const iva = servicio.precioFinal * ivaRate;
          return {
            ...servicio,
            precioTotal: servicio.precioFinal,
            precioConIva: servicio.precioFinal + iva,
            iva: iva
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


  useEffect(() => {
    if (packageType === "Paquete") {
      const parsedLength = parseFloat(length);
      const parsedWidth = parseFloat(width);
      const parsedHeight = parseFloat(height);

      // Check if all values are valid before calculating
      if (!isNaN(parsedLength) && !isNaN(parsedWidth) && !isNaN(parsedHeight) && parsedLength > 0 && parsedWidth > 0 && parsedHeight > 0) {
        const volWeight = (parsedLength * parsedWidth * parsedHeight) / 5000;
        setVolumetricWeight(parseFloat(volWeight.toFixed(2)));  // Update volumetric weight
      } else {
        setVolumetricWeight(0); // Reset if any value is invalid
      }
    }
  }, [length, width, height, packageType]);  // Reacts to changes in these values

  const NotificationPopup = () => {
    if (!notification.show) return null;

    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-lg max-w-xs">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-bold">{notification.message}</p>
              <button
                onClick={() => {
                  // Here you could show more details in a modal or expand the notification
                  console.log("Details:", notification.details);
                }}
                className="mt-2 text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Ver detalles →
              </button>
            </div>
            <button
              onClick={() => setNotification({ ...notification, show: false })}
              className="ml-4 text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="p-6 bg-gray-100 rounded-lg shadow-md max-w-4xl w-full sm:w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 mx-auto">

        <h2 className="text-xl text-blue-600 font-semibold mb-4">ENVIADORES - COTIZADOR DE ENVIOS</h2>

        {/* Flow Indicator */}
        <div className="flex mb-6 border-b">
          <div
            className={`pb-2 px-4 ${flowStage === 'quote' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
            onClick={() => setFlowStage('quote')}
          >
            1. Cotización
          </div>
          <div
            className={`pb-2 px-4 ${flowStage === 'customer-data' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
            style={{ opacity: selectedService ? 1 : 0.5 }}
          >
            2. Datos del Cliente
          </div>
        </div>
        {flowStage === 'quote' ? (
          <>
            {isInternational ? (
              <div className="mb-6">
                <h3 className="font-semibold">Zona de Envío Internacional</h3>
                <select
                  value={selectedZone || ''}
                  onChange={(e) => setSelectedZone(Number(e.target.value))}
                  className="border p-2 w-full"
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
            ) : (
              <>
                {/* Origin ZIP Code */}
                <div className="mb-6">
                  <h3 className="font-semibold">Código Postal de Origen</h3>
                  <input
                    type="text"
                    placeholder="Código Postal de Origen"
                    value={originZip}
                    onChange={(e) => setOriginZip(e.target.value)}
                    className="border p-2 w-full"
                  />
                  {isValidated && (
                    <>
                      <p>Estado: {originState}</p>
                      <p>Municipio: {originMunicipio}</p>
                      <p>Ciudad: {originCiudad}</p>
                      <select
                        value={selectedOriginColonia}
                        onChange={(e) => setSelectedOriginColonia(e.target.value)}
                        className="border p-2 w-full"
                      >
                        <option value="">Selecciona una Colonia</option>
                        {originColonias.map((colonia, index) => (
                          <option key={index} value={colonia}>{colonia}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

                {/* Destination ZIP Code */}
                <div className="mb-6">
                  <h3 className="font-semibold">Código Postal de Destino</h3>
                  <input
                    type="text"
                    placeholder="Código Postal de Destino"
                    value={destZip}
                    onChange={(e) => setDestZip(e.target.value)}
                    className="border p-2 w-full"
                  />
                  {isValidated && (
                    <>
                      <p>Estado: {destState}</p>
                      <p>Municipio: {destMunicipio}</p>
                      <p>Ciudad: {destCiudad}</p>
                      <select
                        value={selectedDestColonia}
                        onChange={(e) => setSelectedDestColonia(e.target.value)}
                        className="border p-2 w-full"
                      >
                        <option value="">Selecciona una Colonia</option>
                        {destColonias.map((colonia, index) => (
                          <option key={index} value={colonia}>{colonia}</option>
                        ))}
                      </select>
                      {/* Display Calculated Zone */}
                      {zone !== null && (
                        <div className="mt-5 p-4 bg-green-100 text-green-800 rounded-lg">
                          <p className="font-semibold">Zona: {zone}</p>
                        </div>
                      )}
                      {renderFrequencyInfo()}
                      {renderEstafetaResults()}
                    </>
                  )}
                </div>
              </>
            )}

            <div className={`mb-4 p-3 rounded-lg ${isInternational ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <input
                type="checkbox"
                id="internationalShipping"
                checked={isInternational}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  if (!isChecked && (servicios || detallesCotizacion)) {
                    if (!confirm("¿Está seguro? Esto reseteará toda la cotización actual.")) {
                      return;
                    }
                  }
                  if (isChecked && (servicios || detallesCotizacion)) {
                    if (!confirm("¿Está seguro? Esto reseteará toda la cotización actual.")) {
                      return;
                    }
                  }
                  setIsInternational(isChecked);
                  if (!isChecked) resetForm(); // Use your existing function
                  else {
                    // When checking, just clear the ZIP-specific fields
                    setOriginZip("");
                    setDestZip("");
                    setZone(null);
                    setIsValidated(false);
                    setServicios(null);
                    setDetallesCotizacion(null);
                    setDeliveryFrequency(null);
                    setEstafetaResult(null);
                  }
                }}
                className="mr-2"
              />
              <label htmlFor="internationalShipping" className="font-medium">
                Envío Internacional
              </label>
            </div>


            {/* Validate Button */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {!isInternational ? (
                <button
                  onClick={validateZipCodes}
                  className={`text-white px-4 py-2 rounded ${originZip.length === 5 && destZip.length === 5
                      ? "bg-red-500"
                      : "bg-gray-500 cursor-not-allowed"
                    }`}
                  disabled={!(originZip.length === 5 && destZip.length === 5)}
                >
                  Validar Códigos Postales
                </button>
              ) : (
                <button
                  onClick={() => setIsValidated(true)}
                  className={`text-white px-4 py-2 rounded ${selectedZone
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-gray-500 cursor-not-allowed"
                    }`}
                  disabled={!selectedZone}
                >
                  Continuar a Detalles de Paquete
                </button>
              )}

              {/* External validation button - only shows after validation */}
              {isValidated && destZip && (
                <button
                  onClick={validateOnExternalSite}
                  disabled={loadingEstafeta}
                  className={`px-4 py-2 text-white rounded flex items-center ${loadingEstafeta ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
                    } transition-colors`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {loadingEstafeta ? 'Consultando...' : 'Verificar en Estafeta'}
                </button>
              )}
              {estafetaResult && (
                <div className="mt-4">
                  <button
                    onClick={handleReport}
                    disabled={reportSubmitted}
                    className={`flex items-center px-4 py-2 rounded ${reportSubmitted
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                  >
                    {reportSubmitted ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Reporte Enviado!
                      </>
                    ) : (
                      <>
                        <FlagIcon className="h-4 w-4 mr-2" />
                        Reportar Información Desactualizada
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Verificaremos y actualizaremos la información de la base de datos para el codigo postal de destino.
                  </p>
                </div>
              )}
            </div>

            {/* Package Details */}
            {(isValidated || isInternational) && (
              <>
                <h2 className="text-xl font-semibold mt-6">Detalles del Paquete</h2>
                <select value={packageType} onChange={(e) => setPackageType(e.target.value)} className="border p-2 w-full mt-2">
                  <option value="">Selecciona tipo de Envio</option>
                  <option value="Paquete">Paquete</option>
                  <option value="Sobre">Sobre</option>
                </select>

                {packageType === "Paquete" && (
                  <>
                    <div className="relative w-full">
                      <input
                        type="number"
                        id="length"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        placeholder="0"
                        className="border p-2 w-full mt-2"
                      />
                      <label
                        htmlFor="length"
                        className="absolute right-10 top-7 transform -translate-y-1/2 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
                      >
                        Largo (cm)
                      </label>
                    </div>
                    <div className="relative w-full">
                      <input
                        type="number"
                        placeholder="0"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        className="border p-2 w-full mt-2"
                      />
                      <label
                        htmlFor="width"
                        className="absolute right-10 top-7 transform -translate-y-1/2 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
                      >
                        Ancho (cm)
                      </label>
                    </div>
                    <div className="relative w-full">
                      <input
                        type="number"
                        placeholder="0"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="border p-2 w-full mt-2" />
                      <label
                        htmlFor="height"
                        className="absolute right-10 top-7 transform -translate-y-1/2 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
                      >
                        Alto (cm)
                      </label>
                    </div>
                    <div className="relative w-full">
                      <input
                        type="number"
                        placeholder="0"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="border p-2 w-full mt-2" />
                      <label
                        htmlFor="weight"
                        className="absolute right-10 top-7 transform -translate-y-1/2 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
                      >
                        Peso (kg)
                      </label>
                    </div>
                    {/* Flex container to align the insurance and volumetric weight text side by side */}
                    <div className="flex items-center mt-2">
                      {/* Display Volumetric Weight Only After Clicking Cotizar */}
                      {servicios && (
                        <p className="text-green-600 ml-4">Peso Volumétrico: {volumetricWeight.toFixed(2)} kg</p>
                      )}
                    </div>
                  </>
                )}

                {packageType === "Sobre" && (
                  <>
                    <input type="number" placeholder="Peso (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} className="border p-2 w-full mt-2" />
                  </>
                )}

                {/* Packaging Options */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Empaque</h3>
                  <select
                    value={packagingOption}
                    onChange={(e) => setPackagingOption(e.target.value)}
                    className={`border p-2 w-full ${packagingOption === 'EMP00' ? 'bg-green-50 border-green-200' : ''
                      }`}
                  >
                    <option value="EMP00">Sin empaque ($0)</option>
                    <option value="EMP01">Sobre ($10)</option>
                    <option value="EMP02">Chico ($25)</option>
                    <option value="EMP03">Mediano ($70)</option>
                    <option value="EMP04">Grande ($170)</option>
                    <option value="EMP05">Personalizado</option>
                  </select>

                  {packagingOption === 'EMP05' && (
                    <input
                      type="number"
                      placeholder="Precio personalizado"
                      value={customPackagingPrice || ''}
                      onChange={(e) => setCustomPackagingPrice(parseFloat(e.target.value))}
                      className="border p-2 w-full mt-2"
                      min="0"
                      step="0.01"
                    />
                  )}
                </div>

                {/* Collection Service */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={collectionRequired}
                      onChange={(e) => setCollectionRequired(e.target.checked)}
                      className="mr-2"
                    />
                    Requiere recolección
                  </label>

                  {collectionRequired && (
                    <input
                      type="number"
                      placeholder="Precio de recolección (dejar vacío para precio estándar)"
                      value={collectionPrice || ''}
                      onChange={(e) => setCollectionPrice(parseFloat(e.target.value))}
                      className="border p-2 w-full mt-2"
                      min="0"
                      step="0.01"
                    />
                  )}
                </div>

                {/* Insurance */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={insurance}
                      onChange={(e) => setInsurance(e.target.checked)}
                      className="mr-2"
                    />
                    Seguro de envío (1.75% del valor declarado)
                  </label>

                  {insurance && (
                    <input
                      type="number"
                      placeholder="Valor declarado"
                      value={insuranceValue}
                      onChange={(e) => setInsuranceValue(e.target.value)}
                      className="border p-2 w-full mt-2"
                      min="0"
                      step="0.01"
                    />
                  )}
                </div>

                {/* Cotizar Button */}
                <button
                  onClick={fetchQuote}
                  className={`text-white px-4 py-2 rounded mt-2 ${(isInternational ? selectedZone : isValidated) && packageType &&
                    ((packageType === "Paquete" && length && width && height && weight && !isNaN(parseFloat(length)) && !isNaN(parseFloat(width)) && !isNaN(parseFloat(height)) && !isNaN(parseFloat(weight))) ||
                      (packageType === "Sobre" && weight && !isNaN(parseFloat(weight))))
                    ? "bg-blue-500"
                    : "bg-gray-500 cursor-not-allowed"
                    }`}
                  disabled={!(isInternational ? selectedZone : isValidated) ||
                    !packageType ||
                    (packageType === "Paquete" && (!length || !width || !height || !weight || isNaN(parseFloat(length)) || isNaN(parseFloat(width)) || isNaN(parseFloat(height)) || isNaN(parseFloat(weight)))) ||
                    (packageType === "Sobre" && (!weight || isNaN(parseFloat(weight))))
                  }
                >
                  Cotizar
                </button>
              </>
            )}



            {/* Display Available Services */}
            {servicios && detallesCotizacion && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-2">Servicios Disponibles</h3>
                <div className="overflow-x-auto">
                  {detallesCotizacion?.reexpedicion > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Precio estándar de reexpedición aplicado
                    </div>
                  )}

                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-200">{/* 
            */}<th className="border border-gray-300 p-2">Servicio</th>{/* 
            */}<th className="border border-gray-300 p-2">Precio Base</th>{/* 
            */}<th className="border border-gray-300 p-2">Sobrepeso</th>{/* 
            */}<th className="border border-gray-300 p-2">Peso Facturable</th>{/* 
            */}<th className="border border-gray-300 p-2">Reexpedición</th>{/*
            */}<th className="border border-gray-300 p-2">Empaque</th>{/*
            */}<th className="border border-gray-300 p-2">Seguro</th>{/*  
            */}<th className="border border-gray-300 p-2">Recoleccion</th>{/* 
            */}<th className="border border-gray-300 p-2">IVA (16%)</th>{/* 
            */}<th className="border border-gray-300 p-2">Subtotal</th>{/* 
            */}<th className="border border-gray-300 p-2">Total</th>{/* 
            */}<th className="border border-gray-300 p-2">Tiempo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredServicios.map((servicio) => (
                        <tr key={servicio.sku}
                          className={`cursor-pointer hover:bg-blue-50 ${selectedService?.sku === servicio.sku ? 'bg-blue-100 border-2 border-blue-400' : ''
                            }`}
                          onClick={() => setSelectedService(servicio)}>{/* 
                */}<td className="border border-gray-300 p-2">{servicio.nombre}</td>{/* 
                */}<td className="border border-gray-300 p-2">${servicio.precioBase.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>{/* 
                */}<td className="border border-gray-300 p-2">${servicio.cargoSobrepeso.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>{/*
                */}<td className="border border-gray-300 p-2">{servicio.pesoFacturable} kg</td>{/* 
                */}<td className="border border-gray-300 p-2">${detallesCotizacion.reexpedicion.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>{/*   
                */}<td className="border border-gray-300 p-2">${detallesCotizacion.empaque.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>{/* 
                */}<td className="border border-gray-300 p-2">${detallesCotizacion.seguro.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>{/* 
                */}<td className="border border-gray-300 p-2">${detallesCotizacion.recoleccion.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>{/* 
                */}<td className="border border-gray-300 p-2">${servicio.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>{/*
                */}<td className="border border-gray-300 p-2 font-semibold">${servicio.precioTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>{/*
                */}<td className="border border-gray-300 p-2 font-semibold">${servicio.precioConIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>{/*  
                */}<td className="border border-gray-300 p-2">{servicio.diasEstimados} día{servicio.diasEstimados !== 1 ? 's' : ''}</td>{/*
                */}<td className="border border-gray-300 p-2 text-center">
                            <input
                              type="radio"
                              name="selectedService"
                              checked={selectedService?.sku === servicio.sku}
                              onChange={() => { }}
                              className="cursor-pointer"
                            /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {selectedService && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setFlowStage('customer-data')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Continuar con {selectedService.nombre}
                      </button>
                    </div>
                  )}
                </div>

              </div>

            )}

          </>

        ) : (
          <DatosCliente
            selectedService={selectedService!}
            onBack={() => setFlowStage('quote')}
            onSubmit={(envioData) => {
              // Handle form submission
              console.log('Datos del envío:', {
                servicio: selectedService,
                cliente: envioData.cliente,
                destino: envioData.destino
              });

              // Reset or proceed to next step
              setFlowStage('quote');
              resetForm();

              setNotification({
                show: true,
                message: `Envío registrado para ${envioData.cliente.nombre}`,
                details: {
                  service: selectedService,
                  client: envioData.cliente,
                  destination: envioData.destino
                }
              });
            }}
            originData={{
              estado: destState || '',
              municipio: destMunicipio || '',
              ciudad: destCiudad || '',
              colonias: destColonias.length > 0 ? destColonias : ['']
            }}
            destData={{
              estado: destState || '',
              municipio: destMunicipio || '',
              ciudad: destCiudad || '',
              colonias: destColonias.length > 0 ? destColonias : ['']
            }}

            originZip={originZip}
            destZip={destZip}
          />
        )}
      </div>
      <NotificationPopup />
    </div>
  );
}

export default Cotizador;