import React from 'react';
import { AddressSection } from './AddressSection';
import { DeliveryInfoDisplay } from './DeliveryInfoDisplay';
import { PackageDetailsSection } from './PackageDetailsSection';
import { QuoteResultsSection } from './QuoteResultsSection';
import { NotificationPopup } from './NotificationPopup';
import { DatosCliente } from '../DatosCliente';
import { useCotizador } from './hooks/useCotizador';

function Cotizador() {
  const {
    state,
    updateField,
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
    validateOnExternalSite,
    validateThreeTimes,
    handleReport,
    fetchQuote,
    resetForm,
    proceedToCustomerData,
    backToQuote
  } = useCotizador();

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="p-6 bg-gray-100 rounded-lg shadow-md max-w-4xl w-full sm:w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 mx-auto">
        <h2 className="text-xl text-blue-600 font-semibold mb-4">ENVIADORES - COTIZADOR DE ENVIOS</h2>

        {/* Flow Indicator */}
        <div className="flex mb-6 border-b">
          <div
            className={`pb-2 px-4 ${state.flowStage === 'quote' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
            onClick={() => updateField('flowStage', 'quote')}
          >
            1. Cotización
          </div>
          <div
            className={`pb-2 px-4 ${state.flowStage === 'customer-data' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
            style={{ opacity: selectedService ? 1 : 0.5 }}
          >
            2. Datos del Cliente
          </div>
        </div>

        {state.flowStage === 'quote' ? (
          <>
            {/* Address Section */}
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
            />

            {/* Show delivery info only when validated */}
            {state.isValidated && !state.isInternational && (
              <DeliveryInfoDisplay
                deliveryFrequency={deliveryFrequency}
                loadingFrequency={loadingFrequency}
                estafetaResult={estafetaResult}
                loadingEstafeta={loadingEstafeta}
                validateOnExternalSite={validateOnExternalSite}
                validateThreeTimes={validateThreeTimes}
                handleReport={handleReport}
                reportSubmitted={reportSubmitted}
              />
            )}

            {/* Package Details Section (only shown after validation) */}
            {(state.isValidated || state.isInternational) && (
              <PackageDetailsSection
                state={state}
                updateField={updateField}
                servicios={servicios}
                validated={state.isValidated}
                fetchQuote={fetchQuote}
              />
            )}

            {/* Quote Results Section */}
            {servicios && servicios.length > 0 && detallesCotizacion && (
              <QuoteResultsSection
                servicios={servicios}
                detallesCotizacion={detallesCotizacion}
                selectedService={selectedService}
                setSelectedService={setSelectedService}
                proceedToCustomerData={proceedToCustomerData}
              />
            )}
          </>
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
      <NotificationPopup 
        notification={notification} 
        setNotification={setNotification} 
      />
    </div>
  );
}

export default Cotizador;