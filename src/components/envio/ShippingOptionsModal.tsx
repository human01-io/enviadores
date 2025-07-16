import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Truck, Upload, CheckCircle2, Download, Loader2, AlertTriangle, Clock } from 'lucide-react';
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
  }) => Promise<void>;
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

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // **NEW: Auto-submit timer state**
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null);
  const [isAutoSubmitEnabled, setIsAutoSubmitEnabled] = useState(true);
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // **NEW: Constants for timer**
  const AUTO_SUBMIT_DELAY = 60; // 60 seconds

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

  // **NEW: Auto-submit timer effect**
  useEffect(() => {
    // Only start timer if label was successfully generated and we can submit
    if (labelData && isManuableComplete() && isAutoSubmitEnabled && !isSubmitting) {
      console.log('Starting auto-submit timer for 60 seconds...');
      
      // Start countdown
      setAutoSubmitCountdown(AUTO_SUBMIT_DELAY);
      
      // Countdown timer (updates every second)
      countdownTimerRef.current = setInterval(() => {
        setAutoSubmitCountdown(prev => {
          if (prev === null || prev <= 1) {
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-submit timer (triggers after full delay)
      autoSubmitTimerRef.current = setTimeout(() => {
        console.log('Auto-submitting after 60 seconds...');
        handleSubmit();
      }, AUTO_SUBMIT_DELAY * 1000);

      // Cleanup function
      return () => {
        if (autoSubmitTimerRef.current) {
          clearTimeout(autoSubmitTimerRef.current);
          autoSubmitTimerRef.current = null;
        }
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      };
    }
  }, [labelData, isAutoSubmitEnabled, isSubmitting]);

  // **NEW: Clear timers when conditions change**
  useEffect(() => {
    return () => {
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const resetAllStates = () => {
    setStep('select');
    setSelectedOption(null);
    setExternalLabelData({ carrier: '', trackingNumber: '', labelFile: null });
    setExternalCost(null);
    setSelectedManuableService(null);
    setLabelData(null);
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    // **NEW: Reset timer states**
    setAutoSubmitCountdown(null);
    setIsAutoSubmitEnabled(true);
    
    // **NEW: Clear any running timers**
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  // **NEW: Cancel auto-submit timer**
  const cancelAutoSubmit = () => {
    setIsAutoSubmitEnabled(false);
    setAutoSubmitCountdown(null);
    
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    
    console.log('Auto-submit timer cancelled by user');
  };

  const handleLabelGenerated = (data: ManuableLabelResponse) => {
    console.log('Label generated:', data);
    setLabelData(data);
    setSubmitError(null);
    // Timer will start automatically via useEffect
  };

  const handleBack = () => {
    if (step === 'configure') {
      setStep('select');
      setSelectedOption(null);
      setSubmitError(null);
      cancelAutoSubmit(); // Cancel timer when going back
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
    if (isSubmitting) return false;
    if (selectedOption === 'external') return isExternalComplete();
    if (selectedOption === 'manuable') return isManuableComplete();
    return false;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    // **NEW: Cancel auto-submit timer when manually submitting**
    cancelAutoSubmit();

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await onSubmit({
        selectedOption: selectedOption!,
        externalLabelData: selectedOption === 'external' ? externalLabelData : undefined,
        externalCost: selectedOption === 'external' ? externalCost : undefined,
        selectedManuableService: selectedOption === 'manuable' ? selectedManuableService : undefined,
        labelData: selectedOption === 'manuable' ? labelData : undefined
      });

      setSubmitSuccess(true);
      
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error('Error submitting shipping data:', error);
      setSubmitError(error.message || 'Error al procesar el envío. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadLabel = () => {
    if (labelData?.label_url) {
      window.open(labelData.label_url, '_blank');
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    onClose();
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
              onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Loading Overlay */}
              {isSubmitting && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Procesando envío...</h3>
                    <p className="text-sm text-gray-600">
                      {selectedOption === 'external' 
                        ? 'Guardando datos de guía externa...' 
                        : 'Creando cliente y guardando información...'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Por favor no cierre esta ventana</p>
                  </div>
                </div>
              )}

              {/* Success Overlay */}
              {submitSuccess && (
                <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10">
                  <div className="text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-800 mb-2">¡Envío creado exitosamente!</h3>
                    <p className="text-sm text-green-600">Redirigiendo...</p>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  {step === 'select' ? 'Seleccionar Opción de Envío' : 'Configurar Envío'}
                </h2>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className={`p-2 rounded-lg transition-colors ${
                    isSubmitting 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* **NEW: Auto-submit countdown banner** */}
              {autoSubmitCountdown !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border-b border-blue-200 px-6 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm text-blue-800">
                        El envío se finalizará automáticamente en <strong>{autoSubmitCountdown}</strong> segundos
                      </span>
                    </div>
                    <button
                      onClick={cancelAutoSubmit}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                {/* Error Alert */}
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-800 mb-1">Error al procesar envío</h4>
                      <p className="text-sm text-red-700">{submitError}</p>
                    </div>
                    <button
                      onClick={() => setSubmitError(null)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {step === 'select' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* External Option */}
                    <button
                      onClick={() => setSelectedOption('external')}
                      disabled={isSubmitting}
                      className={`p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
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
                      disabled={isSubmitting}
                      className={`p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
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
                          disabled={isSubmitting}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
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
                          disabled={isSubmitting}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
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
                            disabled={isSubmitting}
                            className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
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
                            disabled={isSubmitting}
                            className="hidden"
                            id="file-upload"
                          />
                          <label
                            htmlFor="file-upload"
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                              isSubmitting ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''
                            }`}
                          >
                            <span className="text-sm text-gray-600">
                              {externalLabelData.labelFile ? externalLabelData.labelFile.name : 'Seleccionar archivo'}
                            </span>
                            <Upload className="w-4 h-4 text-gray-400" />
                          </label>
                        </div>
                      </div>
                    </div>

                    {isExternalComplete() && !isSubmitting && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">Datos completos. Puede finalizar el envío.</span>
                      </motion.div>
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
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div className="flex items-start">
                            <CheckCircle2 className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-green-800 mb-2">¡Etiqueta generada exitosamente!</h3>
                              <div className="space-y-2 text-sm text-green-700">
                                <p><strong>Número de guía:</strong> {labelData.tracking_number}</p>
                                <p><strong>Servicio:</strong> {selectedManuableService?.carrier} - {selectedManuableService?.service}</p>
                                <p><strong>Precio:</strong> ${labelData.price} MXN</p>
                              </div>
                              
                              {/* **NEW: Auto-submit notification** */}
                              {autoSubmitCountdown !== null && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg"
                                >
                                  <div className="flex items-center text-blue-800">
                                    <Clock className="w-4 h-4 mr-2" />
                                    <span className="text-sm">
                                      El envío se finalizará automáticamente en <strong>{autoSubmitCountdown}s</strong>
                                    </span>
                                  </div>
                                  <button
                                    onClick={cancelAutoSubmit}
                                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Cancelar finalización automática
                                  </button>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.div>

                        <div className="flex gap-3">
                          <button
                            onClick={downloadLabel}
                            disabled={isSubmitting}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <Download className="w-4 h-4" />
                            Descargar Etiqueta
                          </button>
                          <button
                            onClick={() => {
                              setLabelData(null);
                              setSelectedManuableService(null);
                              cancelAutoSubmit(); // Cancel timer when changing service
                            }}
                            disabled={isSubmitting}
                            className={`px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors ${
                              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
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
                  disabled={isSubmitting}
                  className={`px-4 py-2 transition-colors ${
                    isSubmitting 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {step === 'select' ? 'Cancelar' : 'Atrás'}
                </button>

                {step === 'configure' && (
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit()}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      canSubmit()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {autoSubmitCountdown !== null && (
                      <Clock className="w-4 h-4" />
                    )}
                    {isSubmitting ? 'Procesando...' : 
                     autoSubmitCountdown !== null ? `Finalizar (${autoSubmitCountdown}s)` : 
                     'Finalizar Envío'}
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