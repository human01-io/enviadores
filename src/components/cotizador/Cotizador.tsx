// src/components/cotizador/Cotizador.tsx - Complete Fixed Version
'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, MapPin, Package, Check, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, Clock } from 'lucide-react';
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
    setSameZipWarning
  } = useCotizador();

  // User data state
  const [userData, setUserData] = useState<UserData>({
    name: 'Usuario',
    email: '',
    phone: '',
    role: 'customer_user'
  });

  const [currentTab, setCurrentTab] = useState<'address' | 'package' | 'results'>('address');
  const [allowTabNavigation, setAllowTabNavigation] = useState(true);

  const fetchQuoteAndShowResults = async () => {
    setAllowTabNavigation(false);
    await fetchQuote();
  };

  useEffect(() => {
    if (servicios && servicios.length > 0 && currentTab === 'package' && !allowTabNavigation) {
      setCurrentTab('results');
      setAllowTabNavigation(true);
    }
  }, [servicios, currentTab, allowTabNavigation]);

  // Check for abandoned quotations when component mounts
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

        // Check for abandoned quotations that can be restored
        await apiService.checkForAbandonedQuotations({
          onQuotationFound: (latestQuotation) => {
            const quotationDate = new Date(latestQuotation.created_at);
            const formattedDate = quotationDate.toLocaleString();

            const shouldRestore = confirm(
              `¿Desea continuar con su cotización anterior?\n\nCreada: ${formattedDate}\nOrigen: ${latestQuotation.origen_cp}, Destino: ${latestQuotation.destino_cp}\nTipo: ${latestQuotation.tipo_paquete}`
            );

            if (shouldRestore) {
              updateField('originZip', latestQuotation.origen_cp);
              updateField('destZip', latestQuotation.destino_cp);
              updateField('packageType', latestQuotation.tipo_paquete);

              if (latestQuotation.largo) updateField('length', latestQuotation.largo.toString());
              if (latestQuotation.ancho) updateField('width', latestQuotation.ancho.toString());
              if (latestQuotation.alto) updateField('height', latestQuotation.alto.toString());
              if (latestQuotation.peso_real) updateField('weight', latestQuotation.peso_real.toString());

              updateField('volumetricWeight', latestQuotation.peso_volumetrico || 0);
              updateField('packagingOption', latestQuotation.opcion_empaque || "EMP00");
              updateField('collectionRequired', !!latestQuotation.requiere_recoleccion);
              updateField('clienteId', latestQuotation.cliente_id || null);
              updateField('destinoId', latestQuotation.destino_id || null);
              updateField('isValidated', true);

              localStorage.setItem('current_cotizacion_id', latestQuotation.temp_id);
              validateZipCodes();

              if (latestQuotation.servicios_json) {
                try {
                  const serviciosData = JSON.parse(latestQuotation.servicios_json);
                  setServicios(serviciosData);

                  if (latestQuotation.detalles_json) {
                    const cotizacionDetails = JSON.parse(latestQuotation.detalles_json);
                    setDetallesCotizacion(cotizacionDetails);
                  }
                } catch (parseError) {
                  console.error("Error parsing saved services:", parseError);
                }
              }

              setNotification({
                show: true,
                message: 'Cotización restaurada correctamente',
                details: null
              });

              return true;
            } else {
              const skipFuture = confirm("¿Desea que no se le vuelvan a mostrar cotizaciones abandonadas?");
              if (skipFuture) {
                localStorage.setItem('skip_quotation_restore', 'true');
              }
              return false;
            }
          }
        });
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
      setCurrentTab('address');
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

  const validateZipCodesWithEstafeta = () => {
    validateZipCodes();
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

  const handleContinueToPackage = () => {
    setAllowTabNavigation(true);
    setCurrentTab('package');
  };

  const handleContinueToResults = () => {
    setAllowTabNavigation(true);
    setCurrentTab('results');
  };

  const calculateProgress = () => {
    if (state.flowStage === 'customer-data') return 100;
    if (selectedService) return 75;
    if (servicios && servicios.length > 0) return 50;
    if (state.isValidated) return 25;
    return 5;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Clean Header - Full width, minimal padding */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="px-4 sm:px-6 py-3">
          {/* Main navigation row */}
          <div className="flex items-center justify-between">
            {/* Left section with logo and back button */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={redirectToDashboard}
                aria-label="Go back"
                className="hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Button>
              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Cotizador</h1>
                  <p className="text-sm text-gray-500">Sistema de cotización de envíos</p>
                </div>
              </div>
            </div>

            {/* Right section with user account */}
            <div className="flex items-center gap-4">
              <UserAccount 
                userData={userData}
                onLogout={handleLogout}
                variant="dropdown"
                className="bg-white border border-gray-200 shadow-sm hover:shadow-md"
              />
            </div>
          </div>

          {/* Secondary row for flow stage buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {/* Flow stage buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={state.flowStage === 'quote' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => updateField('flowStage', 'quote')}
                className="rounded-md"
              >
                <span className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    state.flowStage === 'quote' ? 'bg-white text-blue-600' : 'bg-gray-300 text-gray-600'
                  }`}>
                    1
                  </span>
                  Cotización
                </span>
              </Button>
              <Button
                variant={state.flowStage === 'customer-data' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => selectedService && updateField('flowStage', 'customer-data')}
                disabled={!selectedService}
                className="rounded-md opacity-100 disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    state.flowStage === 'customer-data' ? 'bg-white text-blue-600' : 'bg-gray-300 text-gray-600'
                  }`}>
                    2
                  </span>
                  Datos del Envío
                </span>
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />

            {/* Zone display and Reset button */}
            <div className="flex items-center gap-3">
              {getZoneDisplay() && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className="block sm:hidden truncate max-w-[80px]">
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
                className="text-orange-600 border-orange-200 hover:bg-orange-50 bg-white"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                <span className="sr-only sm:not-sr-only sm:inline text-xs">Reiniciar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6">
        {state.flowStage === 'quote' ? (
          <div className="w-full">
            {/* Clean progress bar */}
            <div className="w-full h-2 bg-gray-200 mb-6 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>

            <Tabs
              value={currentTab}
              onValueChange={(value) => {
                setCurrentTab(value as 'address' | 'package' | 'results');
              }}
              className="w-full"
            >
              <Card className='overflow-hidden bg-white border-gray-200 shadow-sm'>
                <CardHeader className="pb-2 px-4 sm:px-6 bg-gray-50">
                  <TabsList className="grid grid-cols-3 mb-2 w-full bg-white">
                    <TabsTrigger
                      value="address"
                      className={`flex items-center justify-center relative transition-all duration-200
                        ${state.isValidated
                          ? 'data-[state=active]:bg-green-50 data-[state=active]:text-green-800 data-[state=active]:border-green-300 bg-green-50 text-green-700 border-green-200'
                          : 'data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-300'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <span className={`flex items-center justify-center w-5 h-5 mr-2 rounded-full text-xs font-bold
                          ${state.isValidated
                            ? 'bg-green-500 text-white'
                            : currentTab === 'address'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }
                        `}>
                          1
                        </span>
                        {state.isValidated ? (
                          <Check className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <MapPin className="h-4 w-4 mr-1" />
                        )}
                        <span>Código Postal</span>
                      </div>
                    </TabsTrigger>

                    <TabsTrigger
                      value="package"
                      disabled={!state.isValidated && !state.isInternational}
                      className={`flex items-center justify-center relative transition-all duration-200
                        ${servicios && servicios.length > 0
                          ? 'data-[state=active]:bg-green-50 data-[state=active]:text-green-800 data-[state=active]:border-green-300 bg-green-50 text-green-700 border-green-200'
                          : (state.isValidated || state.isInternational)
                            ? 'data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-300'
                            : 'opacity-50 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <span className={`flex items-center justify-center w-5 h-5 mr-2 rounded-full text-xs font-bold
                          ${servicios && servicios.length > 0
                            ? 'bg-green-500 text-white'
                            : currentTab === 'package' && (state.isValidated || state.isInternational)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }
                        `}>
                          2
                        </span>
                        {servicios && servicios.length > 0 ? (
                          <Check className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                          <Package className="h-4 w-4 mr-1" />
                        )}
                        <span>Paquete</span>
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
                          3
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

                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-semibold text-gray-900">Cotización de envío</CardTitle>
                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                      {state.flowStage === 'quote' ? (
                        selectedService
                          ? "Resultados de cotización"
                          : servicios && servicios.length > 0
                            ? "Seleccione un servicio"
                            : state.isValidated
                              ? "Ingrese detalles del paquete"
                              : "Ingrese códigos postales"
                      ) : (
                        "Ingresando datos del cliente"
                      )}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <TabsContent value="address" className="mt-0">
                    <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="w-full md:w-2/4">
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
                              validateZipCodes={validateZipCodesWithEstafeta}
                              zone={state.zone}
                              isInternational={state.isInternational}
                              selectedZone={state.selectedZone}
                              isValidated={state.isValidated}
                              onContinueToPackage={handleContinueToPackage}
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

                          {/* Right column - Zone info and DeliveryInfoDisplay */}
                          {state.isValidated && !state.isInternational && (
                            <div className="w-full md:w-2/4 flex flex-col gap-4">
                              {/* Zone information */}
                              {state.zone !== null && (
                                <div className="bg-blue-50 text-blue-800 rounded-lg border border-blue-200 p-4">
                                  <div className="flex items-center">
                                    <MapPin className="h-5 w-5 mr-2" />
                                    <p className="font-medium">Zona: {state.zone}</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Same ZIP Warning */}
                              {sameZipWarning && !originZipError && !destZipError && (
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                  <div className="flex items-start">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                                    <div>
                                      <h4 className="text-sm font-medium text-yellow-700">
                                        Advertencia: Códigos postales idénticos
                                      </h4>
                                      <p className="text-xs text-yellow-600 mt-1">
                                        {sameZipWarning}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* DeliveryInfoDisplay */}
                              <DeliveryInfoDisplay
                                estafetaResult={estafetaResult}
                                loadingEstafeta={loadingEstafeta}
                                validateThreeTimes={validateThreeTimes}
                                handleReport={handleReport}
                                reportSubmitted={reportSubmitted}
                              />
                            </div>
                          )}
                        </div>

                        {/* Continue button */}
                        {state.isValidated && (
                          <div className="flex justify-end mt-6">
                            <Button
                              onClick={handleContinueToPackage}
                              size="lg"
                              disabled={!!originZipError || !!destZipError}
                              className="fixed bottom-6 right-6 flex items-center bg-blue-600 hover:bg-blue-700 text-white z-50 shadow-lg rounded-full px-6 py-3"
                            >
                              {originZipError || destZipError ? (
                                <span className="flex items-center">
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  {originZipError && destZipError
                                    ? 'Verifique ambos códigos postales'
                                    : originZipError
                                      ? 'Verifique código postal de origen'
                                      : 'Verifique código postal de destino'}
                                </span>
                              ) : (
                                <>
                                  Continuar a Paquete
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="package" className="mt-0">
                    <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                      <div className="p-6">
                        <PackageDetailsSection
                          state={state}
                          updateField={updateField}
                          servicios={servicios}
                          validated={state.isValidated}
                          fetchQuote={fetchQuoteAndShowResults}
                          onContinueToResults={handleContinueToResults}
                        />
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="results" className="mt-0">
                    <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                      <div className="p-6">
                        {servicios && servicios.length > 0 && detallesCotizacion && (
                          <QuoteResultsSection
                            servicios={servicios}
                            detallesCotizacion={detallesCotizacion}
                            selectedService={selectedService}
                            setSelectedService={setSelectedService}
                            proceedToCustomerData={proceedToCustomerData}
                            originalWeight={state.weight}
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
                          <span className="font-medium">${selectedService.precioConIva.toFixed(2)}</span>
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
                      console.log('Datos del envío:', {
                        servicio: selectedService,
                        cliente: envioData.cliente,
                        destino: envioData.destino
                      });

                      updateField('flowStage', 'quote');
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
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

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
    </div>
  );
}