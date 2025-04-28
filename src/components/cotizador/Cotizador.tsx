import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { AddressSection } from './AddressSection'; // Make sure to use the updated version
import { DeliveryInfoDisplay } from './DeliveryInfoDisplay'; // Use the simplified version
import { PackageDetailsSection } from './PackageDetailsSection';
import { QuoteResultsSection } from './QuoteResultsSection';
import { NotificationPopup } from './NotificationPopup';
import { DatosCliente } from '../DatosCliente';
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header styled like in Clientes and Destinos */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-4">
          <button 
            onClick={redirectToDashboard}
            className="text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <h1 className="text-xl font-bold">Cotizador de Envíos</h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowAccountModal(true)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <User className="w-5 h-5" />
            <span className="hidden sm:inline">Mi cuenta</span>
          </button>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            <span className="hidden sm:inline">Cerrar sesión</span>
            <LogOut className="w-5 h-5 sm:hidden" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Main Container */}
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            {/* Flow Indicator - Always visible */}
            <div className="flex mb-6 border-b overflow-x-auto no-scrollbar">
              <button
                className={`pb-2 px-4 whitespace-nowrap ${state.flowStage === 'quote' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
                onClick={() => updateField('flowStage', 'quote')}
              >
                1. Cotización
              </button>
              <button
                className={`pb-2 px-4 whitespace-nowrap ${state.flowStage === 'customer-data' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
                style={{ opacity: selectedService ? 1 : 0.5 }}
                disabled={!selectedService}
              >
                2. Datos del Cliente
              </button>
            </div>

            {state.flowStage === 'quote' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Address & Delivery Info */}
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-4">Ubicación</h2>
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
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h2 className="text-lg font-semibold mb-4">Información de Entrega</h2>
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
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h2 className="text-lg font-semibold mb-4">Detalles del Paquete</h2>
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
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h2 className="text-lg font-semibold mb-4">Resultados</h2>
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
              <DatosCliente
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
                originZip={state.originZip}
                destZip={state.destZip}
              />
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