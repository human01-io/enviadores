import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Truck, Upload, CheckCircle2, Download, AlertCircle } from 'lucide-react';
import { Cliente, Destino } from '../../types';
import { ManuableRate, ManuableLabelResponse } from '../../services/manuableService';
import ManuableRatesComponent from './ManuableRatesComponent';
import ManuableLabelGenerator from './ManuableLabelGeneration';

interface ShippingOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    selectedOption: 'external' | 'manuable';
    externalLabelData?: { carrier: string; trackingNumber: string; labelFile: File | null };
    externalCost?: number | null;
    selectedManuableService?: ManuableRate | null;
    labelData?: ManuableLabelResponse | null;
  }) => void;
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

export default function ShippingOptionsModal({
  isOpen,
  onClose,
  onSubmit,
  originZip,
  destZip,
  packageDetails,
  cliente,
  destino
}: ShippingOptionsModalProps) {
  // State management
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedOption, setSelectedOption] = useState<'external' | 'manuable' | null>(null);
  
  // External option state
  const [externalLabelData, setExternalLabelData] = useState({
    carrier: '',
    trackingNumber: '',
    labelFile: null as File | null
  });
  const [externalCost, setExternalCost] = useState<number | null>(null);
  
  // Manuable option state
  const [selectedManuableService, setSelectedManuableService] = useState<ManuableRate | null>(null);
  const [labelData, setLabelData] = useState<ManuableLabelResponse | null>(null);

  // Reset states when modal opens/closes or option changes
  useEffect(() => {
    if (!isOpen) {
      resetAllStates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedOption) {
      // Reset states when switching options
      if (selectedOption === 'external') {
        setSelectedManuableService(null);
        setLabelData(null);
      } else if (selectedOption === 'manuable') {
        setExternalLabelData({ carrier: '', trackingNumber: '', labelFile: null });
        setExternalCost(null);
      }
      setStep('configure');
    }
  }, [selectedOption]);

  const resetAllStates = () => {
    setStep('select');
    setSelectedOption(null);
    setExternalLabelData({ carrier: '', trackingNumber: '', labelFile: null });
    setExternalCost(null);
    setSelectedManuableService(null);
    setLabelData(null);
  };

  const handleLabelGenerated = (data: ManuableLabelResponse) => {
    console.log('Label generated:', data);
    setLabelData(data);
  };

  const handleBack = () => {
    if (step === 'configure') {
      setStep('select');
      setSelectedOption(null);
    } else {
      onClose();
    }
  };

  const isExternalComplete = () => {
    return externalLabelData.carrier && 
           externalLabelData.trackingNumber && 
           externalLabelData.labelFile && 
           externalCost !== null;
  };

  const isManuableComplete = () => {
    return selectedManuableService !== null && labelData !== null;
  };

  const canSubmit = () => {
    if (selectedOption === 'external') return isExternalComplete();
    if (selectedOption === 'manuable') return isManuableComplete();
    return false;
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;

    onSubmit({
      selectedOption: selectedOption!,
      externalLabelData: selectedOption === 'external' ? externalLabelData : undefined,
      externalCost: selectedOption === 'external' ? externalCost : undefined,
      selectedManuableService: selectedOption === 'manuable' ? selectedManuableService : undefined,
      labelData: selectedOption === 'manuable' ? labelData : undefined
    });
  };

  const downloadLabel = () => {
    if (labelData?.label_url) {
      window.open(labelData.label_url, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  {step === 'select' ? 'Seleccionar Opción de Envío' : 'Configurar Envío'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                {step === 'select' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* External Option */}
                    <button
                      onClick={() => setSelectedOption('external')}
                      className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left"
                    >
                      <FileText className="w-8 h-8 text-blue-600 mb-3" />
                      <h3 className="font-semibold text-lg mb-2">Guía Externa</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Ya tengo una guía de otra paquetería
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">FedEx</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">DHL</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">Estafeta</span>
                      </div>
                    </button>

                    {/* Manuable Option */}
                    <button
                      onClick={() => setSelectedOption('manuable')}
                      className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left"
                    >
                      <Truck className="w-8 h-8 text-green-600 mb-3" />
                      <h3 className="font-semibold text-lg mb-2">Generar con Manuable</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Cotizar y generar guía automáticamente
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Automatizado</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Mejores precios</span>
                      </div>
                    </button>
                  </div>
                )}

                {step === 'configure' && selectedOption === 'external' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paquetería <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={externalLabelData.carrier}
                          onChange={(e) => setExternalLabelData({...externalLabelData, carrier: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número de Guía <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={externalLabelData.trackingNumber}
                          onChange={(e) => setExternalLabelData({...externalLabelData, trackingNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ej: 1234567890"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Costo Neto (MXN) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <input
                            type="number"
                            value={externalCost ?? ''}
                            onChange={(e) => setExternalCost(e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Etiqueta <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setExternalLabelData({...externalLabelData, labelFile: e.target.files[0]});
                              }
                            }}
                            className="hidden"
                            id="file-upload"
                          />
                          <label
                            htmlFor="file-upload"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                          >
                            <span className="text-sm text-gray-600">
                              {externalLabelData.labelFile ? externalLabelData.labelFile.name : 'Seleccionar archivo'}
                            </span>
                            <Upload className="w-4 h-4 text-gray-400" />
                          </label>
                        </div>
                      </div>
                    </div>

                    {isExternalComplete() && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">Datos completos. Puede finalizar el envío.</span>
                      </div>
                    )}
                  </div>
                )}

                {step === 'configure' && selectedOption === 'manuable' && (
                  <div className="space-y-6">
                    {!labelData ? (
                      <>
                        {/* Manuable Rates */}
                        <ManuableRatesComponent
                          originZip={originZip}
                          destZip={destZip}
                          packageDetails={packageDetails}
                          onSelectService={setSelectedManuableService}
                          selectedService={selectedManuableService}
                        />

                        {/* Label Generator - Only show when service is selected */}
                        {selectedManuableService && (
                          <div className="border-t pt-6">
                            <ManuableLabelGenerator
                              cliente={cliente}
                              destino={destino}
                              selectedService={selectedManuableService}
                              onLabelGenerated={handleLabelGenerated}
                              content={packageDetails.content}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      /* Label Generated Success */
                      <div className="space-y-4">
                        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start">
                            <CheckCircle2 className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-green-800 mb-2">¡Etiqueta generada exitosamente!</h3>
                              <div className="space-y-2 text-sm text-green-700">
                                <p><strong>Número de guía:</strong> {labelData.tracking_number}</p>
                                <p><strong>Servicio:</strong> {selectedManuableService?.carrier} - {selectedManuableService?.service}</p>
                                <p><strong>Precio:</strong> ${labelData.price} MXN</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={downloadLabel}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Download className="w-4 h-4" />
                            Descargar Etiqueta
                          </button>
                          <button
                            onClick={() => {
                              setLabelData(null);
                              setSelectedManuableService(null);
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            Cambiar servicio
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t bg-gray-50">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  {step === 'select' ? 'Cancelar' : 'Atrás'}
                </button>

                {step === 'configure' && (
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit()}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      canSubmit()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Finalizar Envío
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}