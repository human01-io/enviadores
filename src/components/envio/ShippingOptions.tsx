import React, { useState } from 'react';
import { ManuableRate, ManuableLabelResponse } from '../../services/manuableService';
import ManuableRatesComponent from './ManuableRatesComponent';
import ManuableLabelGenerator from './ManuableLabelGeneration';
import ManuableLabelDisplay from './ManuableLabelDisplay';
import { mapToManuableParcel } from '../../utils/manuableUtils';
import { Cliente, Destino } from '../../types';

// Types
interface ExternalLabelData {
  carrier: string;
  trackingNumber: string;
  labelFile: File | null;
}

interface ShippingOptionsProps {
  selectedOption: 'none' | 'external' | 'manuable';
  setSelectedOption: (option: 'none' | 'external' | 'manuable') => void;
  externalLabelData: ExternalLabelData;
  setExternalLabelData: (data: ExternalLabelData) => void;
  externalCost: number | null;
  setExternalCost: (cost: number | null) => void;
  manuableServices: ManuableRate[];
  setManuableServices: (services: ManuableRate[]) => void;
  selectedManuableService: ManuableRate | null;
  setSelectedManuableService: (service: ManuableRate | null) => void;
  // Additional props for Manuable integration
  originZip: string;
  destZip: string;
  packageDetails: {
    peso: number;
    alto?: number;
    largo?: number;
    ancho?: number;
    valor_declarado?: number;
  };
  // Cliente and Destino data for label generation
  cliente: Cliente;
  destino: Destino;
}

export default function ShippingOptions({
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
  originZip,
  destZip,
  packageDetails,
  cliente,
  destino
}: ShippingOptionsProps) {
  // Helper component for checkmark icon
  const CheckIcon = ({ className = "w-3 h-3 text-white" }: { className?: string }) => (
    <svg
      className={className}
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

  // Handler for selecting a Manuable service
  const handleSelectManuableService = (service: ManuableRate) => {
    setSelectedManuableService(service);
  };

  // State for storing the generated label
  const [labelData, setLabelData] = useState<ManuableLabelResponse | null>(null);

  // Handler for successful label generation
  const handleLabelGenerated = (data: ManuableLabelResponse) => {
    setLabelData(data);
  };

  return (
    <div className="border-t pt-4">
      <h3 className="font-semibold mb-4">Opciones de Envío</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Option 1: External Label */}
        <div
          className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedOption === 'external' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
          onClick={() => setSelectedOption('external')}
        >
          <div className="flex items-center">
            <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${selectedOption === 'external' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
              {selectedOption === 'external' && <CheckIcon />}
            </div>
            <h4 className="font-medium">Registrar envío con guía externa</h4>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Si ya tienes una guía de otra paquetería, puedes registrarla aquí.
          </p>
        </div>

        {/* Option 2: Manuable API */}
        <div
          className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedOption === 'manuable' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
          onClick={() => setSelectedOption('manuable')}
        >
          <div className="flex items-center">
            <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${selectedOption === 'manuable' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
              {selectedOption === 'manuable' && <CheckIcon />}
            </div>
            <h4 className="font-medium">Obtener opciones de Manuable</h4>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Obtén cotizaciones y genera guías directamente con nuestros socios.
          </p>
        </div>
      </div>

      {/* External Label Form */}
      {selectedOption === 'external' && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-semibold mb-4">Datos de la Guía Externa</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paquetería</label>
              <select
                value={externalLabelData.carrier}
                onChange={(e) => setExternalLabelData({ ...externalLabelData, carrier: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar paquetería</option>
                <option value="FEDEX">FedEx</option>
                <option value="DHL">DHL</option>
                <option value="ESTAFETA">Estafeta</option>
                <option value="UPS">UPS</option>
                <option value="REDPACK">Redpack</option>
                <option value="OTRO">Otra</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Rastreo/Guía</label>
              <input
                type="text"
                value={externalLabelData.trackingNumber}
                onChange={(e) => setExternalLabelData({ ...externalLabelData, trackingNumber: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Ej: 1234567890"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo Neto (MXN)</label>
            <input
              type="number"
              value={externalCost ?? ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setExternalCost(isNaN(value) ? null : value);
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Ej: 250.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta de Envío (PDF o imagen)</label>
            <div className="flex items-center">
              <label className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setExternalLabelData({ ...externalLabelData, labelFile: e.target.files[0] });
                    }
                  }}
                />
                Seleccionar archivo
              </label>
              {externalLabelData.labelFile && (
                <span className="ml-3 text-sm text-gray-600">{externalLabelData.labelFile.name}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Sube la etiqueta de envío en formato PDF o imagen</p>
          </div>
        </div>
      )}

      {/* Manuable Options Form */}
      {selectedOption === 'manuable' && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-semibold mb-4">Opciones de Manuable</h4>
          
          {/* Display label if generated */}
          {labelData ? (
            <ManuableLabelDisplay labelData={labelData} />
          ) : (
            <>
              {/* Show label generator if service is selected */}
              {selectedManuableService ? (
                <ManuableLabelGenerator 
                  cliente={cliente}
                  destino={destino}
                  selectedService={selectedManuableService}
                  onLabelGenerated={handleLabelGenerated}
                />
              ) : null}
              
              {/* Use our ManuableRatesComponent */}
              <ManuableRatesComponent
                originZip={originZip}
                destZip={destZip}
                packageDetails={packageDetails}
                onSelectService={handleSelectManuableService}
                selectedService={selectedManuableService}
              />
            </>
          )}
        </div>
      )}
      
      {/* Validation Section */}
      {selectedOption !== 'none' && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              {selectedOption === 'external' && (
                <p className="text-sm text-blue-700">
                  <strong>Guía externa:</strong> Complete todos los campos incluyendo la etiqueta para registrar su envío con una guía externa.
                </p>
              )}
              {selectedOption === 'manuable' && (
                <p className="text-sm text-blue-700">
                  <strong>Manuable:</strong> Seleccione una opción de servicio para generar su envío a través de nuestros socios.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}