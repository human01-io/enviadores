// File: src/app/cotizador/page.tsx
'use server';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, RefreshCw, MapPin, Package, Check, CheckCircle } from 'lucide-react';
import { AddressSection } from './AddressSection';
import { DeliveryInfoDisplay } from './DeliveryInfoDisplay';
import { PackageDetailsSection } from './PackageDetailsSection';
import { QuoteResultsSection } from './QuoteResultsSection';
import { NotificationPopup } from './NotificationPopup';
import { useCotizador } from './hooks/useCotizador';
import DatosEnvio from '../envio/DatosEnvio';
import { ChangePasswordModal } from '../ChangePasswordModal';
import { Button } from '../ui/Button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription
} from '../ui/SheetComponent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/CardComponent';
import { Badge } from '../ui/BadgeComponent';
import { Separator } from '../ui/SeparatorComponent';
import { ScrollArea } from '../ui/ScrollAreaComponent';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../services/apiService';

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
    backToQuote
  } = useCotizador();

  // Account management states
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Usuario',
    email: '',
    phone: '',
    role: 'customer_user'
  });

  const [currentTab, setCurrentTab] = useState<'address' | 'package' | 'results'>('address');
  const [allowTabNavigation, setAllowTabNavigation] = useState(true);



  const fetchQuoteAndShowResults = async () => {
    // Disable tab navigation until quotes are fetched
    setAllowTabNavigation(false);
    await fetchQuote();
    // Tab switching will be handled by the useEffect
  };

  useEffect(() => {
    // When services are loaded and we're on the package tab, move to results
    // but only for the initial fetch, not when returning from results to package
    if (servicios && servicios.length > 0 && currentTab === 'package' && !allowTabNavigation) {
      setCurrentTab('results');
      // Re-enable tab navigation after we've switched
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
            // Format date for display
            const quotationDate = new Date(latestQuotation.created_at);
            const formattedDate = quotationDate.toLocaleString();

            // Ask user if they want to restore
            const shouldRestore = confirm(
              `¿Desea continuar con su cotización anterior?\n\nCreada: ${formattedDate}\nOrigen: ${latestQuotation.origen_cp}, Destino: ${latestQuotation.destino_cp}\nTipo: ${latestQuotation.tipo_paquete}`
            );

            if (shouldRestore) {
              // Restore the quotation data to the state
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
              updateField('isValidated', true); // Set as validated so the package details section shows

              // Store the quotation ID for later updates
              localStorage.setItem('current_cotizacion_id', latestQuotation.temp_id);

              // Trigger ZIP code validation to fetch location data
              validateZipCodes();

              // If there are services available, parse and set them
              if (latestQuotation.servicios_json) {
                try {
                  const serviciosData = JSON.parse(latestQuotation.servicios_json);
                  setServicios(serviciosData);

                  // Also set cotización details if available
                  if (latestQuotation.detalles_json) {
                    const cotizacionDetails = JSON.parse(latestQuotation.detalles_json);
                    setDetallesCotizacion(cotizacionDetails);
                  }
                } catch (parseError) {
                  console.error("Error parsing saved services:", parseError);
                }
              }

              // Show notification that quotation was restored
              setNotification({
                show: true,
                message: 'Cotización restaurada correctamente',
                details: null
              });

              return true; // Indicate we restored a quotation
            } else {
              // User declined to restore, ask if they want to be prompted again
              const skipFuture = confirm("¿Desea que no se le vuelvan a mostrar cotizaciones abandonadas?");
              if (skipFuture) {
                localStorage.setItem('skip_quotation_restore', 'true');
              }
              return false; // Indicate we did not restore a quotation
            }
          }
        });
      } catch (error) {
        console.error("Error initializing component:", error);
      }
    };

    initializeComponent();
  }, []);

  const handlePasswordChangeSuccess = () => {
    setShowPasswordModal(false);
    setNotification({
      show: true,
      message: 'Contraseña actualizada correctamente',
      details: null
    });
  };

  const handleOpenPasswordModal = () => {
    setShowAccountSheet(false); // Close account sheet first
    setShowPasswordModal(true);
  };

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

  // Helper function to display zone in header
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
      {/* Fixed Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b">
        <div className="container mx-auto px-4 py-3 sm:px-6 lg:px-8">
          {/* Main navigation row */}
          <div className="flex items-center justify-between">
            {/* Left section with logo and back button */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={redirectToDashboard}
                aria-label="Go back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Button>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <h1 className="ml-2 text-lg font-semibold">Cotizador</h1>
              </div>
            </div>

            {/* Right section with account and logout */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setShowAccountSheet(true)}
              >
                <User className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:inline text-sm">{userData.name}</span>
              </Button>
            </div>
          </div>

          {/* Secondary row for flow stage buttons (always visible but responsive) */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {/* Flow stage buttons */}
            <div className="flex">
              <Button
                variant={state.flowStage === 'quote' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => updateField('flowStage', 'quote')}
                className="rounded-r-none"
              >
                1. Cotización
              </Button>
              <Button
                variant={state.flowStage === 'customer-data' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => selectedService && updateField('flowStage', 'customer-data')}
                disabled={!selectedService}
                className="rounded-l-none opacity-100 disabled:opacity-50"
              >
                2. Datos del Cliente
              </Button>
            </div>

            <Separator orientation="vertical" className="h-5 mx-2 hidden sm:block" />

            {/* Zone display and Reset button */}
            <div className="flex items-center gap-2">
              {/* Zone display - only shown if available */}
              {getZoneDisplay() && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
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
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                <span className="sr-only sm:not-sr-only sm:inline text-xs">Reiniciar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {state.flowStage === 'quote' ? (
          <div className="w-full">
            {/* Simple progress bar */}
            <div className="w-full h-1.5 bg-gray-200 mb-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{
                  width: `${calculateProgress()}%`
                }}
              ></div>
            </div>

            <Tabs
              value={currentTab}
              onValueChange={(value) => {
                setCurrentTab(value as 'address' | 'package' | 'results');
              }}
              className="w-full"
            >
              <Card>
                <CardHeader className="pb-4">
                  <TabsList className="grid grid-cols-3 mb-2">
                    <TabsTrigger
                      value="address"
                      className={`flex items-center justify-center relative
                        ${state.isValidated
                          ? 'data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:border-green-300 bg-green-50 text-green-700 border-green-200'
                          : 'data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:border-blue-300'
                        }
                      `}
                    >
                      <div className="flex items-center ">
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
                        <span>Dirección</span>
                      </div>
                    </TabsTrigger>

                    <TabsTrigger
                      value="package"
                      disabled={!state.isValidated && !state.isInternational}
                      className={`flex items-center justify-center relative
                        ${servicios && servicios.length > 0
                          ? 'data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:border-green-300 bg-green-50 text-green-700 border-green-200'
                          : (state.isValidated || state.isInternational)
                            ? 'data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:border-blue-300'
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
                      className={`flex items-center justify-center relative
                        ${selectedService
                          ? 'data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:border-green-300 bg-green-50 text-green-700 border-green-200'
                          : servicios && servicios.length > 0
                            ? 'data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:border-blue-300'
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
                    <CardTitle>Cotización de envío</CardTitle>

                    {/* Optional: Add a text indicator of progress */}
                    <span className="text-sm text-gray-500">
                      {state.flowStage === 'quote' ? (
                        selectedService
                          ? "Listo para proceder a datos del cliente"
                          : servicios && servicios.length > 0
                            ? "Seleccione un servicio"
                            : state.isValidated
                              ? "Ingrese detalles del paquete"
                              : "Ingrese direcciones"
                      ) : (
                        "Ingresando datos del cliente"
                      )}
                    </span>
                  </div>
                </CardHeader>

                <CardContent>
                  <TabsContent value="address" className="mt-0">
                    <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                      <div className="space-y-6">
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
                        />

                        {state.isValidated && !state.isInternational && (
                          <DeliveryInfoDisplay
                            estafetaResult={estafetaResult}
                            loadingEstafeta={loadingEstafeta}
                            validateThreeTimes={validateThreeTimes}
                            handleReport={handleReport}
                            reportSubmitted={reportSubmitted}
                            onContinue={handleContinueToPackage}
                          />
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="package" className="mt-0">
                    <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                      <PackageDetailsSection
                        state={state}
                        updateField={updateField}
                        servicios={servicios}
                        validated={state.isValidated}
                        fetchQuote={fetchQuoteAndShowResults}
                        onContinueToResults={handleContinueToResults}
                      />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="results" className="mt-0">
                    <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                      {servicios && servicios.length > 0 && detallesCotizacion && (
                        <QuoteResultsSection
                          servicios={servicios}
                          detallesCotizacion={detallesCotizacion}
                          selectedService={selectedService}
                          setSelectedService={setSelectedService}
                          proceedToCustomerData={proceedToCustomerData}
                        />
                      )}
                    </ScrollArea>
                  </TabsContent>
                </CardContent>
              </Card>
            </Tabs>
          </div>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between bg-blue-50">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2"
                  onClick={backToQuote}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <CardTitle>Datos del Envío</CardTitle>
              </div>
              {selectedService && (
                <Badge className="text-sm bg-blue-100 text-blue-800 hover:bg-blue-200">
                  <span className="font-semibold">{selectedService.nombre}</span> - ${selectedService.precioConIva.toFixed(2)}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4">
                {selectedService && (
                  <DatosEnvio
                    selectedService={selectedService}
                    onBack={backToQuote}
                    onSubmit={(envioData) => {
                      // Handle form submission
                      console.log('Datos del envío:', {
                        servicio: selectedService,
                        cliente: envioData.cliente,
                        destino: envioData.destino
                      });

                      // Reset or proceed to next step
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
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-4 right-4 z-50 max-w-md"
          >
            <NotificationPopup
              notification={notification}
              setNotification={setNotification}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Sheet */}
      <Sheet open={showAccountSheet} onOpenChange={setShowAccountSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Mi cuenta</SheetTitle>
            <SheetDescription>
              Gestionar información de la cuenta
            </SheetDescription>
          </SheetHeader>

          <div className="py-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Nombre</h3>
                <p className="text-base">{userData.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="text-base">{userData.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Teléfono</h3>
                <p className="text-base">{userData.phone}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Rol</h3>
                <p className="text-base">{userData.role === 'customer_user' ? 'Cliente' : 'Administrador'}</p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <SheetFooter className="flex flex-col space-y-3 sm:space-y-0">
            <Button
              variant="outline"
              onClick={handleOpenPasswordModal}
              className="w-full sm:w-auto"
            >
              Cambiar contraseña
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}
    </div>
  );
}