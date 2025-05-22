import { useState, useEffect } from 'react';
import { ManuableRate, ManuableLabelResponse } from '../../services/manuableService';
import ManuableRatesComponent from './ManuableRatesComponent';
import ManuableLabelGenerator from './ManuableLabelGeneration';
import ManuableLabelDisplay from './ManuableLabelDisplay';
import { mapToManuableParcel } from '../../utils/manuableUtils';
import { Cliente, Destino } from '../../types';
import { Truck, FileText, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

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
  setExternalLabelData: (data: ExternalLabelData | ((prev: ExternalLabelData) => ExternalLabelData)) => void;
  externalCost: number | null;
  setExternalCost: (cost: number | null) => void;
  manuableServices: ManuableRate[];
  setManuableServices: (services: ManuableRate[]) => void;
  selectedManuableService: ManuableRate | null;
  setSelectedManuableService: (service: ManuableRate | null) => void;
  labelData: ManuableLabelResponse | null;
  setLabelData: (data: ManuableLabelResponse | null) => void;
  originZip: string;
  destZip: string;
  packageDetails: {
    peso: number;
    alto?: number;
    largo?: number;
    ancho?: number;
    valor_declarado?: number;
    content?: string;
  };
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
  destino,
  labelData,
  setLabelData
}: ShippingOptionsProps) {

  // Handler for selecting a Manuable service
  const handleSelectManuableService = (service: ManuableRate) => {
    setSelectedManuableService(service);
  };

  useEffect(() => {
    if (labelData && labelData.tracking_number) {
      setExternalLabelData({
        ...externalLabelData,
        carrier: selectedManuableService?.carrier || 'Manuable',
        trackingNumber: labelData.tracking_number
      });
      
      if (labelData.price) {
        setExternalCost(parseFloat(labelData.price));
      }
    }
  }, [labelData, selectedManuableService, setExternalLabelData, setExternalCost]);

  // Handler for successful label generation
  const handleLabelGenerated = (data: ManuableLabelResponse) => {
    console.log('Label generated with data:', data);
    setLabelData(data);
  };

  // Check if external option is complete
  const isExternalComplete = selectedOption === 'external' && 
    externalLabelData.carrier && 
    externalLabelData.trackingNumber && 
    externalLabelData.labelFile && 
    externalCost !== null;

  // Check if manuable option is complete
  const isManuableComplete = selectedOption === 'manuable' && labelData;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
          <Truck className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Opciones de Envío</h3>
          <p className="text-sm text-gray-500">Seleccione cómo desea procesar este envío</p>
        </div>
      </div>

      {/* Option Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* External Label Option */}
        <div
          className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedOption === 'external' 
              ? 'border-blue-500 bg-blue-50 shadow-md' 
              : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
          }`}
          onClick={() => setSelectedOption('external')}
        >
          <div className="flex items-start space-x-4">
            {/* Radio Button */}
            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
              selectedOption === 'external' 
                ? 'border-blue-500 bg-blue-500' 
                : 'border-gray-300'
            }`}>
              {selectedOption === 'external' && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            
            {/* Option Content */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Guía Externa</h4>
                {isExternalComplete && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                Registre un envío con guía de otra paquetería
              </p>
              
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">FedEx</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">DHL</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Estafeta</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">+más</span>
              </div>
            </div>
          </div>
        </div>

        {/* Manuable Option */}
        <div
          className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedOption === 'manuable' 
              ? 'border-blue-500 bg-blue-50 shadow-md' 
              : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
          }`}
          onClick={() => setSelectedOption('manuable')}
        >
          <div className="flex items-start space-x-4">
            {/* Radio Button */}
            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
              selectedOption === 'manuable' 
                ? 'border-blue-500 bg-blue-500' 
                : 'border-gray-300'
            }`}>
              {selectedOption === 'manuable' && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            
            {/* Option Content */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Truck className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Manuable API</h4>
                {isManuableComplete && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                Obtenga cotizaciones y genere guías automáticamente
              </p>
              
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Automatizado
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Múltiples opciones
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* External Label Form */}
      {selectedOption === 'external' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-6">
            <FileText className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">Datos de la Guía Externa</h4>
          </div>

          <div className="space-y-6">
            {/* Carrier and Tracking Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Paquetería <span className="text-red-500">*</span>
                </label>
                <select
                  value={externalLabelData.carrier}
                  onChange={(e) => setExternalLabelData({ ...externalLabelData, carrier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Número de Rastreo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={externalLabelData.trackingNumber}
                  onChange={(e) => setExternalLabelData({ ...externalLabelData, trackingNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 1234567890"
                />
              </div>
            </div>

            {/* Cost */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Costo Neto (MXN) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={externalCost ?? ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setExternalCost(isNaN(value) ? null : value);
                  }}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="250.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Etiqueta de Envío <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  id="label-upload"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setExternalLabelData({ ...externalLabelData, labelFile: e.target.files[0] });
                    }
                  }}
                />
                <label htmlFor="label-upload" className="cursor-pointer">
                  {externalLabelData.labelFile ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                      <p className="text-sm font-medium text-gray-900">{externalLabelData.labelFile.name}</p>
                      <p className="text-xs text-gray-500">Clic para cambiar archivo</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-sm font-medium text-gray-900">Subir etiqueta de envío</p>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG (máx. 10MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manuable Options Form */}
      {selectedOption === 'manuable' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Truck className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">Opciones de Manuable</h4>
          </div>
         
          {/* Display label if generated */}
          {labelData ? (
            <ManuableLabelDisplay labelData={labelData} />
          ) : (
            <>
              {/* Show label generator if service is selected */}
              {selectedManuableService && (
                <div className="mb-6">
                  <ManuableLabelGenerator 
                    cliente={cliente}
                    destino={destino}
                    selectedService={selectedManuableService}
                    onLabelGenerated={handleLabelGenerated}
                    content={packageDetails.content}
                  />
                </div>
              )}
              
              {/* Manuable Rates Component */}
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
      
      {/* Status Indicator */}
      {selectedOption !== 'none' && (
        <div className={`p-4 rounded-xl border ${
          (isExternalComplete || isManuableComplete) 
            ? 'bg-green-50 border-green-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start space-x-3">
            {(isExternalComplete || isManuableComplete) ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              {selectedOption === 'external' && (
                <>
                  {isExternalComplete ? (
                    <p className="text-sm font-medium text-green-800">
                      ✓ Guía externa configurada correctamente
                    </p>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-blue-800">Complete la información de la guía externa:</p>
                      <ul className="text-sm text-blue-700 mt-1 space-y-1">
                        {!externalLabelData.carrier && <li>• Seleccione la paquetería</li>}
                        {!externalLabelData.trackingNumber && <li>• Ingrese el número de rastreo</li>}
                        {externalCost === null && <li>• Ingrese el costo del envío</li>}
                        {!externalLabelData.labelFile && <li>• Suba la etiqueta de envío</li>}
                      </ul>
                    </div>
                  )}
                </>
              )}
              {selectedOption === 'manuable' && (
                <>
                  {isManuableComplete ? (
                    <p className="text-sm font-medium text-green-800">
                      ✓ Etiqueta de Manuable generada correctamente
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-blue-800">
                      {selectedManuableService 
                        ? 'Genere la etiqueta para completar el proceso'
                        : 'Seleccione un servicio de Manuable para continuar'
                      }
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}