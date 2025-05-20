import React from 'react';
import { Cliente, Destino, ServicioCotizado } from '../../../types';
import { ManuableRate, ManuableLabelResponse } from '../../../services/manuableService';
import ClienteForm from '../ClienteForm';
import DestinoForm from '../DestinoForm';
import ContentField from '../ContentField';
import EnvioConfirmation from '../EnvioConfirmation';
import ShippingOptions from '../ShippingOptions';
import FormActions from '../FormActions';

// Form View Component
interface FormViewProps {
  cliente: Cliente;
  setCliente: (cliente: Cliente | ((prev: Cliente) => Cliente)) => void;
  isExistingCustomer: boolean;
  setIsExistingCustomer: (value: boolean) => void;
  isClientFormValid: boolean;
  destino: Destino;
  setDestino: (destino: Destino | ((prev: Destino) => Destino)) => void;
  isExistingDestino: boolean;
  setIsExistingDestino: (value: boolean) => void;
  isDestinoFormValid: boolean;
  contenido: string;
  setContenido: (value: string) => void;
  originData?: { estado: string; municipio: string; ciudad: string; colonias: string[] };
  destData?: { estado: string; municipio: string; ciudad: string; colonias: string[] };
  zipValidation: { originValid: boolean; destValid: boolean };
  isFormValid: boolean;
  onContinue: () => void;
  onBack: () => void;
}

export function FormView({
  cliente,
  setCliente,
  isExistingCustomer,
  setIsExistingCustomer,
  isClientFormValid,
  destino,
  setDestino,
  isExistingDestino,
  setIsExistingDestino,
  isDestinoFormValid,
  contenido,
  setContenido,
  originData,
  destData,
  zipValidation,
  isFormValid,
  onContinue,
  onBack
}: FormViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Cliente Form */}
      <div className="lg:block">
        <ClienteForm
          cliente={cliente}
          setCliente={setCliente}
          isExistingCustomer={isExistingCustomer}
          setIsExistingCustomer={setIsExistingCustomer}
          isValid={isClientFormValid}
          originData={originData}
          zipValidation={zipValidation.originValid}
        />
      </div>
      
      {/* Right Column - Destino Form */}
      <div className="lg:block">
        <DestinoForm
          destino={destino}
          setDestino={setDestino}
          isExistingDestino={isExistingDestino}
          setIsExistingDestino={setIsExistingDestino}
          isValid={isDestinoFormValid}
          clienteId={cliente.id}
          destData={destData}
          zipValidation={zipValidation.destValid}
        />
      </div>
      
      {/* Content Field */}
      <div className="lg:col-span-2">
        <ContentField contenido={contenido} setContenido={setContenido} />
      </div>

      {/* Form Actions */}
      <div className="lg:col-span-2 mt-6 flex justify-between border-t pt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Regresar
        </button>
        
        <button
          onClick={onContinue}
          className={`px-4 py-2 rounded-md flex items-center ${
            isFormValid
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!isFormValid}
        >
          Revisar y Confirmar
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Confirmation View Component
interface ConfirmationViewProps {
  cliente: Cliente;
  destino: Destino;
  selectedService: ServicioCotizado;
  contenido: string;
  selectedOption: 'none' | 'external' | 'manuable';
  setSelectedOption: (option: 'none' | 'external' | 'manuable') => void;
  externalLabelData: { carrier: string; trackingNumber: string; labelFile: File | null; };
  setExternalLabelData: (data: any) => void;
  externalCost: number | null;
  setExternalCost: (cost: number | null) => void;
  manuableServices: ManuableRate[];
  setManuableServices: (services: ManuableRate[]) => void;
  selectedManuableService: ManuableRate | null;
  setSelectedManuableService: (service: ManuableRate | null) => void;
  packageDetails: any;
  originZip: string;
  destZip: string;
  onBack: () => void;
  onSubmit: () => void;
  labelData: ManuableLabelResponse | null;
  setLabelData: (data: ManuableLabelResponse | null) => void;
}

export function ConfirmationView({
  cliente,
  destino,
  selectedService,
  contenido,
  selectedOption,
  setSelectedOption,
  externalLabelData,
  setExternalLabelData,
  externalCost,
  setExternalCost,
  manuableServices,
  setManuableServices,
  selectedManuableService,
  setSelectedManuableService,
  packageDetails,
  originZip,
  destZip,
  onBack,
  onSubmit,
  labelData,
  setLabelData
}: ConfirmationViewProps) {
  return (
    <div>
      <EnvioConfirmation
        cliente={cliente}
        destino={destino}
        selectedService={selectedService}
        onBack={onBack}
        contenido={contenido}
      />

      <div className="mt-6">
        <ShippingOptions
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          externalLabelData={externalLabelData}
          setExternalLabelData={setExternalLabelData}
          externalCost={externalCost}
          setExternalCost={setExternalCost}
          manuableServices={manuableServices}
          setManuableServices={setManuableServices}
          selectedManuableService={selectedManuableService}
          setSelectedManuableService={setSelectedManuableService}
          originZip={originZip}
          destZip={destZip}
          packageDetails={{
            ...packageDetails,
            content: contenido
          }}
          cliente={cliente}
          destino={destino}
           labelData={labelData}
          setLabelData={setLabelData}
        />
      </div>

      {/* Form Actions */}
      <FormActions 
        step="confirmation"
        onBack={onBack}
        onContinue={() => {}} // Not used in confirmation
        onSubmit={onSubmit}
        isFormValid={true} // Not used in confirmation
        selectedOption={selectedOption}
      />
    </div>
  );
}