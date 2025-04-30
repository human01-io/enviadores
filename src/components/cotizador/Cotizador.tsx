import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, RefreshCw } from 'lucide-react';
import { AddressSection } from './AddressSection'; // Make sure to use the updated version
import { DeliveryInfoDisplay } from './DeliveryInfoDisplay'; // Use the simplified version
import { PackageDetailsSection } from './PackageDetailsSection';
import { QuoteResultsSection } from './QuoteResultsSection';
import { NotificationPopup } from './NotificationPopup';
import DatosEnvio from '../envio/DatosEnvio';
import { useCotizador } from './hooks/useCotizador';
import { AccountModal } from '../AccountModal';
import { ChangePasswordModal } from '../ChangePasswordModal';
import { apiService } from '../../services/apiService';
import logo from '../../assets/logo.svg';

function Cotizador() {
  const navigate = useNavigate();
  const {
    state,
    updateField,
    // We'll still use the deliveryFrequency in the hook, but not display it
    deliveryFrequency,
    loadingFrequency,
    estafetaResult,
    loadingEstafeta,
    reportSubmitted,
    servicios,
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
    // We'll not display this button anymore
    // validateOnExternalSite,
    validateThreeTimes,
    handleReport,
    fetchQuote,
    resetForm,
    proceedToCustomerData,
    backToQuote
  } = useCotizador();

  // Account management states
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Usuario',
    email: '',
    phone: '',
    role: 'customer_user'
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiService.getUserProfile();
        setUserData({
          name: response.name || 'Usuario',
          email: response.email,
          phone: response.phone,
          role: response.role
        });
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      if (confirm("¿Está seguro que desea cerrar sesión?")) {
        if (import.meta.env.PROD) {
          window.location.href = 'https://login.enviadores.com.mx?logout=' + Date.now();
        } else {
          navigate('/login?logout=' + Date.now());
        }
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleResetCotizacion = () => {
    if (confirm("¿Está seguro que desea reiniciar la cotización? Se perderán todos los datos ingresados.")) {
      resetForm();
      setNotification({
        show: true,
        message: 'Cotización reiniciada correctamente',
        details: null
      });
    }
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordModal(false);
    setNotification({
      show: true,
      message: 'Contraseña actualizada correctamente',
      details: null
    });
  };

  const redirectToDashboard = () => {
    if (import.meta.env.PROD) {
      window.location.href = 'https://app.enviadores.com.mx';
    } else {
      navigate('/dashboard');
    }
  };

  // Modified validateZipCodesWithEstafeta function
  // This will call both the original validateZipCodes function 
  // and automatically fetch Estafeta info if needed
  const validateZipCodesWithEstafeta = () => {
    validateZipCodes();
    // We could add logic here to automatically call the Estafeta validation
    // But it's better to let the existing code handle it since it may already be
    // doing this in the validateZipCodes function
  };

  // Helper function to display zone in header
  const getZoneDisplay = () => {
    if (state.isInternational && state.selectedZone) {
      // For international zones
      return {
        full: `Zona Internacional: ${state.selectedZone}`,
        short: `Z-I: ${state.selectedZone}`
      };
    } else if (!state.isInternational && state.zone) {
      // For national zones
      return {
        full: `Zona Nacional: ${state.zone}`,
        short: `Z: ${state.zone}`
      };
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Fixed Header */}
      <header className="bg-white shadow-md sticky top-0 z-10 border-b">
        <div className="px-3 py-2 sm:p-4">
          {/* Main navigation row */}
          <div className="flex items-center justify-between">
            {/* Left section with logo and back button */}
            <div className="flex items-center gap-2">
              <button
                onClick={redirectToDashboard}
                className="text-blue-600 hover:text-blue-800 p-1"
                aria-label="Go back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="flex items-center">
                <img src={logo} alt="Logo" className="w-6 h-6 sm:w-7 sm:h-7" />
                <h1 className="ml-2 text-base sm:text-lg font-bold whitespace-nowrap">Cotizador</h1>
              </div>
            </div>

            {/* Right section with account and logout */}
            <div className="flex items-center gap-2 sm:gap-4">

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAccountModal(true)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 p-1"
                  aria-label="Mi cuenta"
                >
                  <User className="w-5 h-5" />
                  <span className="sr-only sm:not-sr-only sm:inline text-sm">Mi cuenta</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1 p-1"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="sr-only sm:not-sr-only sm:inline">Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>

          {/* Secondary row for flow stage buttons (always visible but responsive) */}
          <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-3 sm:gap-4">
  {/* Flow stage buttons */}
  <div className="flex">
    <button
      className={`px-3 py-1 text-xs sm:text-sm whitespace-nowrap rounded-l-md ${state.flowStage === 'quote'
        ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
        : 'bg-gray-50 text-gray-500 border border-gray-200'}`}
      onClick={() => updateField('flowStage', 'quote')}
    >
      1. Cotización
    </button>
    <button
      className={`px-3 py-1 text-xs sm:text-sm whitespace-nowrap rounded-r-md ${state.flowStage === 'customer-data'
        ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
        : 'bg-gray-50 text-gray-500 border border-gray-200'}`}
      style={{ opacity: selectedService ? 1 : 0.5 }}
      disabled={!selectedService}
    >
      2. Datos del Cliente
    </button>
  </div>
  
  {/* Divider - only visible on larger screens */}
  <div className="hidden sm:block h-5 w-px bg-gray-300 mx-1"></div>
  
  {/* Zone display and Reset button */}
  <div className="flex items-center gap-2">
    {/* Zone display - only shown if available */}
    {getZoneDisplay() && (
  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded-md text-xs sm:text-sm font-medium flex items-center shadow-sm">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
    {/* Short version on small screens, full version on larger screens */}
    <span className="block sm:hidden truncate max-w-[80px]">
      {getZoneDisplay().short}
    </span>
    <span className="hidden sm:block">
      {getZoneDisplay().full}
    </span>
  </div>
)}

    <button
      onClick={handleResetCotizacion}
      className="flex items-center gap-1 bg-orange-50 text-orange-600 hover:bg-orange-100 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md transition-colors shadow-sm"
      title="Reiniciar cotización"
    >
      <RefreshCw className="w-4 h-4" />
      <span className="sr-only sm:not-sr-only sm:inline text-sm font-medium">Reiniciar Cotizacion</span>
    </button>
  </div>
</div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-4" >
        <div className="max-w-screen-2xl mx-auto">
          {/* Main Container */}
          <div className="bg-white rounded-lg shadow p-4 md:p-4">
            {state.flowStage === 'quote' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Address & Delivery Info */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Codigos Postales
                    </h2>

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
                    />
                  </div>

                  {/* Delivery Info Section - Simplified */}
                  {state.isValidated && !state.isInternational && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100 shadow-sm">
                      <h2 className="text-lg font-semibold mb-4 flex items-center text-green-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H14a1 1 0 001-1v-3h2a1 1 0 001-1V8a1 1 0 00-.416-.789l-2-1.666A1 1 0 0014 5.333V4a1 1 0 00-1-1H3zM16 8.8V8l-2-1.667V5H14v3.8l2 .8z" />
                        </svg>
                        Información de Entrega
                      </h2>
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

                {/* Right Column - Package Details & Quote Results */}
                <div className="space-y-6">
                  {/* Package Details Section */}
                  {(state.isValidated || state.isInternational) && (
                    <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                      <h2 className="text-lg font-semibold mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        Detalles del Paquete
                      </h2>
                      <PackageDetailsSection
                        state={state}
                        updateField={updateField}
                        servicios={servicios}
                        validated={state.isValidated}
                        fetchQuote={fetchQuote}
                      />
                    </div>
                  )}

                  {/* Quote Results Section */}
                  {servicios && servicios.length > 0 && detallesCotizacion && (
                    <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                      <h2 className="text-lg font-semibold mb-3 flex items-center text-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                        </svg>
                        Resultados
                      </h2>

                      {/* Visual help for selecting a service */}
                      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-4 text-sm flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-medium text-yellow-800">Seleccione un servicio</p>
                          <p className="text-yellow-700">Elija una de las opciones y haga clic en el botón "Continuar" para proceder con los datos del cliente.</p>
                        </div>
                      </div>

                      <QuoteResultsSection
                        servicios={servicios}
                        detallesCotizacion={detallesCotizacion}
                        selectedService={selectedService}
                        setSelectedService={setSelectedService}
                        proceedToCustomerData={proceedToCustomerData}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              state.flowStage === 'customer-data' && (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-4 border-b flex justify-between items-center bg-blue-50">
                    <div className="flex items-center">
                      <button
                        onClick={backToQuote}
                        className="mr-3 p-1 rounded-full hover:bg-blue-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h2 className="text-xl font-bold text-gray-800">Datos del Envío</h2>
                    </div>
                    <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      <span className="font-semibold">{selectedService?.nombre}</span> - ${selectedService?.precioConIva.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-4">
                    <DatosEnvio
                      selectedService={selectedService!}
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
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>

      {/* Notification Popup */}
      <NotificationPopup
        notification={notification}
        setNotification={setNotification}
      />

      {/* Account Modal */}
      {showAccountModal && (
        <AccountModal
          user={{
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            role: userData.role
          }}
          onClose={() => setShowAccountModal(false)}
          onChangePassword={() => {
            setShowAccountModal(false);
            setShowPasswordModal(true);
          }}
          onLogout={handleLogout}
          isLoading={!userData.email}
        />
      )}

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

export default Cotizador;