// Streamlined Cotizador with 2 steps
'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, MapPin, Package, Check, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, Clock, DollarSign, Info, FileText } from 'lucide-react';
import { AddressSection } from './AddressSection';
import { DeliveryInfoDisplay } from './DeliveryInfoDisplay';
import { PackageDetailsSection } from './PackageDetailsSection';
import { QuoteResultsSection } from './QuoteResultsSection';
import { NotificationPopup } from './NotificationPopup';
import { useCotizador } from './hooks/useCotizador';
import DatosEnvio from '../envio/DatosEnvio';
import { UserAccount } from '../shared/UserAccount';
import { Button } from '../ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/CardComponent';
import { Badge } from '../ui/BadgeComponent';
import { Separator } from '../ui/SeparatorComponent';
import { ScrollArea } from '../ui/ScrollAreaComponent';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../services/apiService';
import { Dialog, DialogContent, DialogTitle } from '../ui/Dialog';
import { ServicioCotizado } from '../../types';
import type { ServicioCotizado as CotizadorServicioCotizado, DetallesCotizacion } from './utils/cotizadorTypes';
import { EnhancedReceiptManager } from '../envio/ThermalRecieptManager';

import { WhatsAppConfig } from './WhatsAppConfig';
import { Settings } from 'lucide-react';

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function Cotizador() {
  const router = useNavigate();
  const {
    state,
    updateField,
    estafetaResult,
    loadingEstafeta,
    reportSubmitted,
    servicios,
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
    destZipError,
    setDestZipError,
    originZipError,
    setOriginZipError,
    sameZipWarning,
    setSameZipWarning,
    handleZipCodeUpdate
  } = useCotizador();

  // User data state
  const [userData, setUserData] = useState<UserData>({
    name: 'Usuario',
    email: '',
    phone: '',
    role: 'customer_user'
  });

  const [currentTab, setCurrentTab] = useState<'details' | 'results'>('details');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [isValidatingAndQuoting, setIsValidatingAndQuoting] = useState(false);
  const [additionalChargesChanged, setAdditionalChargesChanged] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successShipmentData, setSuccessShipmentData] = useState<any>(null);


  const [showWhatsAppConfig, setShowWhatsAppConfig] = useState(false);
const [shipmentCliente, setShipmentCliente] = useState<any>(null);
const [shipmentDestino, setShipmentDestino] = useState<any>(null);
  // Track changes to additional services
  useEffect(() => {
    if (servicios && servicios.length > 0) {
      setAdditionalChargesChanged(true);
    }
  }, [state.packagingOption, state.customPackagingPrice, state.collectionRequired, state.collectionPrice, state.insurance, state.insuranceValue]);

  // Function to re-quote with additional charges
  const handleReQuote = async () => {
    setAdditionalChargesChanged(false);
    await fetchQuote();
  };

  // Auto-validate zip codes when both are 5 digits
  useEffect(() => {
    if (state.originZip.length === 5 && state.destZip.length === 5 && !state.isValidated) {
      validateZipCodes();
    }
  }, [state.originZip, state.destZip]);

  // Check if ready to quote
  const canQuote = (state.isInternational ? state.selectedZone : state.isValidated) &&
    state.packageType &&
    ((state.packageType === "Paquete" &&
      state.length && state.width && state.height && state.weight &&
      !isNaN(parseFloat(state.length)) && !isNaN(parseFloat(state.width)) &&
      !isNaN(parseFloat(state.height)) && !isNaN(parseFloat(state.weight))) ||
      (state.packageType === "Sobre" && state.weight && !isNaN(parseFloat(state.weight)))) &&
    !originZipError && !destZipError;

  // Handle the combined validation and quote process
  const handleCotizar = async () => {
    setIsValidatingAndQuoting(true);

    try {
      // If not validated yet, validate first
      if (!state.isValidated && !state.isInternational) {
        await validateZipCodes();
        // Wait a bit for validation to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Show delivery info modal if national shipping
      if (!state.isInternational && estafetaResult) {
        setShowDeliveryModal(true);
        // Wait for user to close modal before continuing
        return;
      }

      // If international or no delivery info needed, proceed directly
      await proceedWithQuote();
    } catch (error) {
      console.error("Error during quotation:", error);
      setNotification({
        show: true,
        message: 'Error al cotizar',
        details: 'Por favor intente nuevamente'
      });
    } finally {
      setIsValidatingAndQuoting(false);
    }
  };

  const proceedWithQuote = async () => {
    setShowDeliveryModal(false);
    await fetchQuote();
    setCurrentTab('results');
  };

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Fetch user data
        const response = await apiService.getUserProfile();
        setUserData({
          name: response.name || 'Usuario',
          email: response.email,
          phone: response.phone,
          role: response.role
        });

        // Check URL parameters for re-quote scenario
        const urlParams = new URLSearchParams(window.location.search);
        const isRequote = urlParams.get('requote') === 'true';

        if (isRequote) {
          // Handle re-quote from DatosEnvio
          const originZip = urlParams.get('originZip');
          const destZip = urlParams.get('destZip');
          const packageType = urlParams.get('packageType');
          const weight = urlParams.get('weight');
          const length = urlParams.get('length');
          const width = urlParams.get('width');
          const height = urlParams.get('height');
          const insurance = urlParams.get('insurance') === 'true';
          const insuranceValue = urlParams.get('insuranceValue');
          const clienteId = urlParams.get('clienteId');
          const destinoId = urlParams.get('destinoId');

          // Set all the values
          if (originZip) updateField('originZip', originZip);
          if (destZip) updateField('destZip', destZip);
          if (packageType) updateField('packageType', packageType);
          if (weight) updateField('weight', weight);
          if (length) updateField('length', length);
          if (width) updateField('width', width);
          if (height) updateField('height', height);
          updateField('insurance', insurance);
          if (insuranceValue) updateField('insuranceValue', insuranceValue);
          if (clienteId) updateField('clienteId', clienteId);
          if (destinoId) updateField('destinoId', destinoId);

          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        console.error("Error initializing component:", error);
      }
    };

    initializeComponent();
  }, []);

  const handleLogout = async () => {
    if (confirm("¿Está seguro que desea cerrar sesión?")) {
      if (import.meta.env.PROD) {
        window.location.href = 'https://login.enviadores.com.mx?logout=' + Date.now();
      } else {
        router('/login?logout=' + Date.now());
      }
    }
  };

  const handleResetCotizacion = () => {
    if (confirm("¿Está seguro que desea reiniciar la cotización? Se perderán todos los datos ingresados.")) {
      localStorage.removeItem('current_cotizacion_id');
      resetForm();
      setCurrentTab('details');
      setNotification({
        show: true,
        message: 'Cotización reiniciada correctamente',
        details: null
      });
    }
  };

  const redirectToDashboard = () => {
    if (import.meta.env.PROD) {
      window.location.href = 'https://app.enviadores.com.mx';
    } else {
      router('/dashboard');
    }
  };

  const getZoneDisplay = () => {
    if (state.isInternational && state.selectedZone) {
      return {
        full: `Zona Internacional: ${state.selectedZone}`,
        short: `Z-I: ${state.selectedZone}`
      };
    } else if (!state.isInternational && state.zone) {
      return {
        full: `Zona Nacional: ${state.zone}`,
        short: `Z: ${state.zone}`
      };
    }
    return null;
  };


  // Update the handleUpdateSelectedService function to call this when ZIP codes change:
  // Updated handleUpdateSelectedService function in Cotizador.tsx

  // Update the handleUpdateSelectedService function to properly handle all state updates:
  const handleUpdateSelectedService = (updatedService: ServicioCotizado, newQuoteData?: {
    servicios: CotizadorServicioCotizado[];
    detallesCotizacion: DetallesCotizacion;
    newOriginZip?: string;
    newDestZip?: string;
    newZone?: number;
    newClienteId?: string | null;
    newDestinoId?: string | null;
  }) => {
    console.log('Updating service with:', updatedService);
    console.log('New quote data:', newQuoteData);

    // Convert the main ServicioCotizado to the internal cotizador type
    const cotizadorService: CotizadorServicioCotizado = {
      sku: updatedService.sku || '',
      nombre: updatedService.nombre || '',
      precioBase: typeof updatedService.precioBase === 'number' ? updatedService.precioBase : 0,
      precioFinal: typeof updatedService.precioFinal === 'number' ? updatedService.precioFinal : 0,
      precioTotal: typeof updatedService.precioTotal === 'number' ? updatedService.precioTotal : 0,
      precioConIva: typeof updatedService.precioConIva === 'number' ? updatedService.precioConIva : 0,
      iva: typeof updatedService.iva === 'number' ? updatedService.iva : 0,
      cargoSobrepeso: typeof updatedService.cargoSobrepeso === 'number' ? updatedService.cargoSobrepeso : 0,
      diasEstimados: typeof updatedService.diasEstimados === 'number' ? updatedService.diasEstimados : 1,
      peso: typeof updatedService.peso === 'number' ? updatedService.peso : 1,
      pesoVolumetrico: typeof updatedService.pesoVolumetrico === 'number' ? updatedService.pesoVolumetrico : 0,
      esInternacional: updatedService.esInternacional || false,
      // Copy optional fields if they exist
      pesoFacturable: updatedService.pesoFacturable
    };

    console.log('Converted cotizador service:', cotizadorService);
    setSelectedService(cotizadorService);

    // If new quote data is provided, update the full quote state AND the core state
    if (newQuoteData) {
      console.log('Updating full quote data');

      // Only update services and details if they're provided and not empty
      if (newQuoteData.servicios && newQuoteData.servicios.length > 0) {
        setServicios(newQuoteData.servicios);
      }

      if (newQuoteData.detallesCotizacion && Object.keys(newQuoteData.detallesCotizacion).length > 0) {
        setDetallesCotizacion(newQuoteData.detallesCotizacion);
      }

      // Update the core ZIP codes and zone if provided
      if (newQuoteData.newOriginZip && newQuoteData.newDestZip) {
        updateField('originZip', newQuoteData.newOriginZip);
        updateField('destZip', newQuoteData.newDestZip);
        updateField('isValidated', true); // Mark as validated since we just generated a successful quote

        // Update location data asynchronously using the hook function
        handleZipCodeUpdate(newQuoteData.newOriginZip, newQuoteData.newDestZip);
      }

      if (newQuoteData.newZone !== undefined) {
        updateField('zone', newQuoteData.newZone);
      }

      // CRITICAL: Update the cliente and destino IDs in the core state
      if (newQuoteData.newClienteId !== undefined) {
        updateField('clienteId', newQuoteData.newClienteId);
        console.log('Updated clienteId in core state:', newQuoteData.newClienteId);
      }

      if (newQuoteData.newDestinoId !== undefined) {
        updateField('destinoId', newQuoteData.newDestinoId);
        console.log('Updated destinoId in core state:', newQuoteData.newDestinoId);
      }

      console.log('Updated core state with new data:', {
        originZip: newQuoteData.newOriginZip,
        destZip: newQuoteData.newDestZip,
        zone: newQuoteData.newZone,
        clienteId: newQuoteData.newClienteId,
        destinoId: newQuoteData.newDestinoId
      });
    }
  };

  const getZoneStyles = (zone: number) => {
    const styles = {
      1: {
        bg: 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200',
        iconBg: 'bg-emerald-600',
        text: 'text-emerald-700',
        description: 'text-emerald-600',
        badge: 'bg-emerald-600'
      },
      2: {
        bg: 'bg-gradient-to-r from-green-50 to-green-100 border-green-200',
        iconBg: 'bg-green-600',
        text: 'text-green-700',
        description: 'text-green-600',
        badge: 'bg-green-600'
      },
      3: {
        bg: 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200',
        iconBg: 'bg-blue-600',
        text: 'text-blue-700',
        description: 'text-blue-600',
        badge: 'bg-blue-600'
      },
      4: {
        bg: 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200',
        iconBg: 'bg-purple-600',
        text: 'text-purple-700',
        description: 'text-purple-600',
        badge: 'bg-purple-600'
      },
      5: {
        bg: 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200',
        iconBg: 'bg-orange-600',
        text: 'text-orange-700',
        description: 'text-orange-600',
        badge: 'bg-orange-600'
      },
      6: {
        bg: 'bg-gradient-to-r from-red-50 to-red-100 border-red-200',
        iconBg: 'bg-red-600',
        text: 'text-red-700',
        description: 'text-red-600',
        badge: 'bg-red-600'
      },
      7: {
        bg: 'bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200',
        iconBg: 'bg-rose-600',
        text: 'text-rose-700',
        description: 'text-rose-600',
        badge: 'bg-rose-600'
      }
    };

    return styles[zone as keyof typeof styles] || styles[3]; // Default to zone 3 styling
  };

  const getZoneDescription = (zone: number) => {
    const descriptions = {
      1: 'Zona metropolitana - Costo mínimo',
      2: 'Área urbana cercana - Costo bajo',
      3: 'Zona urbana - Costo estándar',
      4: 'Área semi-urbana - Costo moderado',
      5: 'Zona foránea - Costo elevado',
      6: 'Área remota - Costo alto',
      7: 'Zona más lejana - Costo máximo'
    };

    return descriptions[zone as keyof typeof descriptions] || 'Zona estándar';
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Clean Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left section */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={redirectToDashboard}
                aria-label="Go back"
                className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Button>
              <div className="flex items-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center mr-2 sm:mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Cotizador</h1>
                  <p className="text-xs sm:text-sm text-gray-500">Sistema de cotización de envíos</p>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-sm font-semibold text-gray-900">Cotizador</h1>
                </div>
              </div>
            </div>

            {/* Center section */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-center min-w-0">
              <div className="flex bg-gray-100 rounded-lg p-0.5 sm:p-1">
                <Button
                  variant={state.flowStage === 'quote' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => updateField('flowStage', 'quote')}
                  className="rounded-md px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm"
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-xs font-bold bg-white text-blue-600">
                      1
                    </span>
                    <span className="hidden sm:inline">Cotización</span>
                  </span>
                </Button>
                <Button
                  variant={state.flowStage === 'customer-data' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => selectedService && updateField('flowStage', 'customer-data')}
                  disabled={!selectedService}
                  className="rounded-md px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm opacity-100 disabled:opacity-50"
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-xs font-bold bg-gray-300 text-gray-600">
                      2
                    </span>
                    <span className="hidden sm:inline">Datos del Envío</span>
                  </span>
                </Button>
              </div>

              <Separator orientation="vertical" className="h-4 sm:h-6 mx-1 sm:mx-2 hidden md:block" />

              {/* Zone display and Reset button */}
              <div className="flex items-center gap-2 sm:gap-3">
                {getZoneDisplay() && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200 text-xs sm:text-sm px-2 py-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="block sm:hidden truncate max-w-[50px]">
                      {getZoneDisplay()!.short}
                    </span>
                    <span className="hidden sm:block">
                      {getZoneDisplay()!.full}
                    </span>
                  </Badge>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetCotizacion}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 bg-white px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  <span className="sr-only sm:not-sr-only sm:inline">Reiniciar</span>
                </Button>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setShowWhatsAppConfig(true)}
    className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
    title="Configuración WhatsApp"
  >
    <Settings className="h-4 w-4" />
    <span className="sr-only sm:not-sr-only sm:inline ml-1">WhatsApp</span>
  </Button>
  
  <UserAccount
    userData={userData}
    onLogout={handleLogout}
    variant="dropdown"
    className="bg-white border border-gray-200 shadow-sm hover:shadow-md"
  />
</div>
            

          </div>
        </div>
      </header>

      <main className="flex-1 px-2 sm:px-2 lg:px-2 py-2 sm:py-2">
        {state.flowStage === 'quote' ? (
          <div className="w-full">
            <Tabs
              value={currentTab}
              onValueChange={(value) => {
                setCurrentTab(value as 'details' | 'results');
              }}
              className="w-full"
            >
              <Card className='relative bg-white border-gray-200'>
                <CardHeader className="sticky top-0 py-1 px-1 sm:px-1 bg-gray-50 border-b border-gray-200 shadow-md z-10">
                  <TabsList className="grid grid-cols-2 mb-auto w-full h-auto p-0 bg-white">
                    <TabsTrigger
                      value="details"
                      className={`flex items-center justify-center relative transition-all duration-200 text-xs sm:text-sm px-2 py-2 h-auto min-h-[36px]
                        ${servicios && servicios.length > 0
                          ? 'data-[state=active]:bg-green-50 data-[state=active]:text-green-800 data-[state=active]:border-green-300 bg-green-50 text-green-700 border-green-200'
                          : 'data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-300'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <span className={`flex items-center justify-center w-5 h-5 mr-2 rounded-full text-xs font-bold
                          ${servicios && servicios.length > 0
                            ? 'bg-green-500 text-white'
                            : currentTab === 'details'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }
                        `}>
                          1
                        </span>
                        {servicios && servicios.length > 0 ? (
                          <Check className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <Package className="h-4 w-4 mr-1" />
                        )}
                        <span>Detalles del Envío</span>
                      </div>
                    </TabsTrigger>

                    <TabsTrigger
                      value="results"
                      disabled={!servicios || servicios.length === 0}
                      className={`flex items-center justify-center relative transition-all duration-200
                        ${selectedService
                          ? 'data-[state=active]:bg-green-50 data-[state=active]:text-green-800 data-[state=active]:border-green-300 bg-green-50 text-green-700 border-green-200'
                          : servicios && servicios.length > 0
                            ? 'data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-300'
                            : 'opacity-50 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <span className={`flex items-center justify-center w-5 h-5 mr-2 rounded-full text-xs font-bold
                          ${selectedService
                            ? 'bg-green-500 text-white'
                            : currentTab === 'results' && servicios && servicios.length > 0
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }
                        `}>
                          2
                        </span>
                        {selectedService ? (
                          <Check className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        <span>Resultados</span>
                      </div>
                    </TabsTrigger>
                  </TabsList>

                  <div className="justify-between items-center hidden 2xl:flex">
                    <CardTitle className="text-xl font-semibold text-gray-900 px-4">Cotización de envío</CardTitle>
                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                      {selectedService
                        ? "Resultados de cotización"
                        : servicios && servicios.length > 0
                          ? "Seleccione un servicio"
                          : "Ingrese detalles del envío"}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-0 flex-1 overflow-hidden">
                  <TabsContent value="details" className="mt-0">
                    <ScrollArea className="h-[calc(100vh-150px)] pr-4">
                      <div className="p-3 sm:p-4">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                          {/* Left Column - Address Section */}
                          <div className="xl:col-span-2">
                            <AddressSection
                              state={state}
                              updateField={updateField}
                              originState={originState}
                              originMunicipio={originMunicipio}
                              originCiudad={originCiudad}
                              originColonias={originColonias}
                              selectedOriginColonia={selectedOriginColonia}
                              setSelectedOriginColonia={setSelectedOriginColonia}
                              destState={destState}
                              destMunicipio={destMunicipio}
                              destCiudad={destCiudad}
                              destColonias={destColonias}
                              selectedDestColonia={selectedDestColonia}
                              setSelectedDestColonia={setSelectedDestColonia}
                              validateZipCodes={validateZipCodes}
                              zone={state.zone}
                              isInternational={state.isInternational}
                              selectedZone={state.selectedZone}
                              isValidated={state.isValidated}
                              onContinueToPackage={() => { }}
                              useExistingClient={useExistingClient}
                              setUseExistingClient={setUseExistingClient}
                              clientSearchQuery={clientSearchQuery}
                              setClientSearchQuery={setClientSearchQuery}
                              selectedClient={selectedClient}
                              setSelectedClient={setSelectedClient}
                              clientSuggestions={clientSuggestions}
                              setClientSuggestions={setClientSuggestions}
                              loadingClients={loadingClients}
                              setLoadingClients={setLoadingClients}
                              useExistingDestination={useExistingDestination}
                              setUseExistingDestination={setUseExistingDestination}
                              destSearchQuery={destSearchQuery}
                              setDestSearchQuery={setDestSearchQuery}
                              selectedDestination={selectedDestination}
                              setSelectedDestination={setSelectedDestination}
                              destSuggestions={destSuggestions}
                              setDestSuggestions={setDestSuggestions}
                              loadingDestinations={loadingDestinations}
                              setLoadingDestinations={setLoadingDestinations}
                              originZipError={originZipError}
                              setOriginZipError={setOriginZipError}
                              destZipError={destZipError}
                              setDestZipError={setDestZipError}
                              sameZipWarning={sameZipWarning}
                              setSameZipWarning={setSameZipWarning}
                            />
                          </div>

                          {/* Right Column - Package Details */}
                          <div className="xl:col-span-1">
                            <PackageDetailsSection
                              state={state}
                              updateField={updateField}
                              servicios={servicios}
                              validated={state.isValidated}
                              fetchQuote={() => { }}
                              onContinueToResults={() => { }}
                              hideAdditionalServices={true}
                            />
                          </div>
                        </div>

                        {/* Cotizar Button */}
                        {canQuote ? (
                          <Button
                            onClick={handleCotizar}
                            disabled={isValidatingAndQuoting}
                            className="fixed bottom-6 right-6 flex items-center bg-red-600 hover:bg-red-700 text-white z-50 shadow-lg rounded-full px-6 py-3"
                          >
                            {isValidatingAndQuoting ? (
                              <>
                                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                                Cotizando...
                              </>
                            ) : (
                              <>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Cotizar Envío
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="fixed bottom-6 right-6 flex items-center px-6 py-3 rounded-full bg-gray-200 text-gray-700 border border-gray-300 cursor-not-allowed shadow-lg">
                            <AlertTriangle className="h-4 w-4 mr-2 text-gray-600" />
                            {!state.originZip || !state.destZip || state.originZip.length !== 5 || state.destZip.length !== 5
                              ? 'Ingrese códigos postales'
                              : !state.packageType
                                ? 'Seleccione tipo de envío'
                                : 'Complete los detalles del paquete'}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="results" className="mt-0">
                    <ScrollArea className="h-[calc(100vh-160px)] pr-4">
                      <div className="p-6">
                        {servicios && servicios.length > 0 && detallesCotizacion && (
                          <QuoteResultsSection
                            servicios={servicios}
                            detallesCotizacion={detallesCotizacion}
                            selectedService={selectedService}
                            setSelectedService={setSelectedService}
                            proceedToCustomerData={proceedToCustomerData}
                            originalWeight={state.weight}
                            state={state}
                            updateField={updateField}
                            additionalChargesChanged={additionalChargesChanged}
                            onReQuote={handleReQuote}
                          />
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </CardContent>
              </Card>
            </Tabs>
          </div>
        ) : (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={backToQuote}
                    className="hover:bg-white -ml-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Volver</span>
                  </Button>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">Datos del Envío</h3>
                      {selectedService && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{selectedService.nombre}</span>
                          <span>•</span>
                          <span className="font-medium">${selectedService?.precioConIva?.toFixed(2) || '0.00'}</span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{selectedService.diasEstimados}d</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Paso 2 de 2</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4">
                {selectedService && (
                  <DatosEnvio
  selectedService={selectedService}
  onBack={backToQuote}
  onSubmit={(envioData) => {
  console.log('Datos del envío:', envioData);

  // NEW: Store cliente and destino data for receipt
  setShipmentCliente(envioData.cliente);
  setShipmentDestino(envioData.destino);

  // NEW: Prepare receipt data
  const receiptData = {
    shipmentId: envioData.shipmentId || `ENV-${Date.now()}`,
    clienteId: envioData.cliente.id || state.clienteId || 'N/A',
    destinoId: envioData.destino.id || state.destinoId || 'N/A',
    destinoCiudad: destCiudad || envioData.destino.ciudad || 'N/A',
    servicio: {
      nombre: selectedService.nombre,
      precioConIva: selectedService.precioConIva,
      diasEstimados: selectedService.diasEstimados
    },
    fecha: new Date().toLocaleDateString('es-MX')
  };

  // NEW: Show success modal instead of notification
  setSuccessShipmentData(receiptData);
  setShowSuccessModal(true);

  // EXISTING: Reset cotizador state
  setCurrentTab('details');
  updateField('flowStage', 'quote');
  setServicios([]);
  setDetallesCotizacion(null);
  setSelectedService(null);
  setAdditionalChargesChanged(false);
  resetForm();
  localStorage.removeItem('current_cotizacion_id');

  // Success notification
  setNotification({
    show: true,
    message: `✅ Envío registrado exitosamente para ${envioData.cliente.nombre}`,
    details: envioData.shipmentId ? `ID: ${envioData.shipmentId}` : null
  });
}}
                    originData={{
                      estado: originState || '',
                      municipio: originMunicipio || '',
                      ciudad: originCiudad || '',
                      colonias: originColonias.length > 0 ? originColonias : ['']
                    }}
                    destData={{
                      estado: destState || '',
                      municipio: destMunicipio || '',
                      ciudad: destCiudad || '',
                      colonias: destColonias.length > 0 ? destColonias : ['']
                    }}
                    originZip={state.originZip}
                    destZip={state.destZip}
                    clienteId={state.clienteId || null}
                    destinoId={state.destinoId || null}
                    onUpdateSelectedService={handleUpdateSelectedService}
                    originalCotizadorState={{
                      packageType: state.packageType,
                      weight: state.weight,
                      length: state.length,
                      width: state.width,
                      height: state.height,
                      volumetricWeight: state.volumetricWeight,
                      insurance: state.insurance,
                      insuranceValue: state.insuranceValue,
                      packagingOption: state.packagingOption,
                      customPackagingPrice: state.customPackagingPrice,
                      collectionRequired: state.collectionRequired,
                      collectionPrice: state.collectionPrice
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Delivery Info Modal - Redesigned */}
      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 flex flex-col">
          {/* Sticky Header */}
          <div className="flex items-center justify-between p-3 border-b bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Info className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-gray-800">
                  Información de Entrega
                </DialogTitle>
                <p className="text-xs text-gray-500">
                  Detalles y validación de zona de entrega
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeliveryModal(false)}
              className="rounded-full p-1.5 hover:bg-gray-100 transition-colors"
            >

            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {/* Main Content Grid with Zone and Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

              {/* Zone Display - Big Square */}
              {state.zone !== null && (
                <div className={`${getZoneStyles(state.zone).bg} border rounded-lg p-6 flex flex-col items-center justify-center text-center min-h-[140px]`}>
                  {/* Big Zone Number */}
                  <div className={`text-6xl font-bold ${getZoneStyles(state.zone).text} mb-2`}>
                    {state.zone}
                  </div>

                  {/* Zone Label */}
                  <div className={`text-sm font-medium ${getZoneStyles(state.zone).text} mb-3`}>
                    Zona Nacional
                  </div>

                  {/* Description */}
                  <div className={`text-xs ${getZoneStyles(state.zone).description} leading-tight max-w-[140px]`}>
                    {getZoneDescription(state.zone)}
                  </div>
                </div>
              )}

              {/* Cards Container */}
              <div className={`${state.zone !== null ? 'lg:col-span-2' : 'lg:col-span-3'} grid grid-cols-1 md:grid-cols-2 gap-3`}>

                {/* Enhanced Delivery Info Display */}
                <DeliveryInfoDisplay
                  estafetaResult={estafetaResult}
                  loadingEstafeta={loadingEstafeta}
                  validateThreeTimes={validateThreeTimes}
                  handleReport={handleReport}
                  reportSubmitted={reportSubmitted}
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 bg-gray-50 border-t p-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Info className="h-3 w-3" />
              <span>Información actualizada automáticamente</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeliveryModal(false)}
                className="px-4 py-1.5 text-sm"
                size="sm"
              >
                Cerrar
              </Button>
              <Button
                onClick={proceedWithQuote}
                className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                size="sm"
              >
                Continuar con Cotización
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Popup */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="fixed top-4 right-4 z-50 max-w-md"
          >
            <NotificationPopup
              notification={notification}
              setNotification={setNotification}
            />
          </motion.div>
        )}
      </AnimatePresence>

{showSuccessModal && successShipmentData && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🎉 ¡Envío Registrado Exitosamente!</h3>
          <p className="text-sm text-gray-600">ID: {successShipmentData.shipmentId}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
        {/* Shipment Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Resumen del Envío
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div><span className="text-blue-700">Servicio:</span></div>
              <div><span className="text-blue-700">Total:</span></div>
              <div><span className="text-blue-700">Entrega:</span></div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-blue-900">{successShipmentData.servicio.nombre}</div>
              <div className="font-bold text-green-700">${successShipmentData.servicio.precioConIva.toFixed(2)} MXN</div>
              <div className="font-medium text-blue-900">{successShipmentData.servicio.diasEstimados} días</div>
            </div>
          </div>
        </div>

        {/* Route Info */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Ruta de Envío
          </h4>
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <div className="font-medium text-purple-900">Origen</div>
              <div className="text-purple-700">{originCiudad || 'Ciudad origen'}</div>
              <div className="text-purple-600 text-xs">{state.originZip}</div>
            </div>
            <div className="flex-1 px-4">
              <div className="h-px bg-purple-300 relative">
                <ArrowRight className="h-4 w-4 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-50 rounded-full p-1" />
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium text-purple-900">Destino</div>
              <div className="text-purple-700">{successShipmentData.destinoCiudad}</div>
              <div className="text-purple-600 text-xs">{state.destZip}</div>
            </div>
          </div>
        </div>

        {/* Enhanced Receipt Manager with Cliente and Destino data */}
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            📄 Comprobante de Envío
          </h4>
          <EnhancedReceiptManager 
            receiptData={successShipmentData}
            onComplete={(recordId) => {
              console.log('Digital record created:', recordId);
            }}
            className="w-full"
            cliente={shipmentCliente}
            destino={shipmentDestino}
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-gray-50 flex gap-3">
        <button
          onClick={() => {
            setShowSuccessModal(false);
            setSuccessShipmentData(null);
            setShipmentCliente(null);
            setShipmentDestino(null);
          }}
          className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
        >
          Nueva Cotización
        </button>
        <button
          onClick={() => {
            setShowSuccessModal(false);
            setSuccessShipmentData(null);
            setShipmentCliente(null);
            setShipmentDestino(null);
            redirectToDashboard();
          }}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Ver Dashboard
        </button>
      </div>
    </div>
  </div>
)}

<WhatsAppConfig
  isOpen={showWhatsAppConfig}
  onClose={() => setShowWhatsAppConfig(false)}
/>

    </div>
  );
}