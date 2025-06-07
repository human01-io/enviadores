import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, X, Check, AlertTriangle, Loader2, Phone, User, Trash2, Send, CheckCircle2 } from 'lucide-react';
import { whatsAppService, SendMessageResult, validatePhoneNumber } from '../../services/whatsappService';

interface ReceiptData {
  shipmentId: string;
  clienteId: string;
  destinoId: string;
  destinoCiudad: string;
  servicio: {
    nombre: string;
    precioConIva: number;
    diasEstimados: number;
  };
  fecha: string;
}

interface Cliente {
  id?: string;
  nombre: string;
  telefono?: string;
  email?: string;
}

interface Destino {
  id?: string;
  nombre: string;
  telefono?: string;
  email?: string;
}

interface Recipient {
  id: string;
  name: string;
  phoneNumber: string;
  type: 'cliente' | 'destino' | 'custom';
  isValid: boolean;
}

interface EnhancedWhatsAppSenderProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData;
  cliente?: Cliente;
  destino?: Destino;
}

export const EnhancedWhatsAppSender: React.FC<EnhancedWhatsAppSenderProps> = ({
  isOpen,
  onClose,
  receiptData,
  cliente,
  destino
}) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<SendMessageResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  // Initialize recipients when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialRecipients: Recipient[] = [];

      // Add cliente if has phone
      if (cliente?.telefono && validatePhoneNumber(cliente.telefono)) {
        initialRecipients.push({
          id: `cliente-${cliente.id || 'temp'}`,
          name: `Cliente: ${cliente.nombre}`,
          phoneNumber: cliente.telefono,
          type: 'cliente',
          isValid: true
        });
      }

      // Add destino if has phone
      if (destino?.telefono && validatePhoneNumber(destino.telefono)) {
        initialRecipients.push({
          id: `destino-${destino.id || 'temp'}`,
          name: `Destinatario: ${destino.nombre}`,
          phoneNumber: destino.telefono,
          type: 'destino',
          isValid: true
        });
      }

      setRecipients(initialRecipients);
      setSendResults([]);
      setShowResults(false);
      setProgress({ completed: 0, total: 0 });
    }
  }, [isOpen, cliente, destino]);

  // Generate WhatsApp message
  const generateWhatsAppMessage = (): string => {
    return `🚚 *COMPROBANTE DE ENVÍO - ENVIADORES*

📦 *ID de Envío:* ${receiptData.shipmentId}
📅 *Fecha:* ${receiptData.fecha}

🔹 *SERVICIO*
• ${receiptData.servicio.nombre}
• Precio: $${receiptData.servicio.precioConIva.toFixed(2)} MXN
• Entrega: ${receiptData.servicio.diasEstimados} días

🔹 *DETALLES DEL ENVÍO*
• Cliente: ${receiptData.clienteId}
• Destino: ${receiptData.destinoId}
• Ciudad: ${receiptData.destinoCiudad}

---
✅ Envío registrado exitosamente
🌐 Enviadores - Sistema de Envíos Profesional`;
  };

  // Add custom recipient
  const addCustomRecipient = () => {
    if (!customName.trim() || !customPhone.trim()) {
      return;
    }

    const isValid = validatePhoneNumber(customPhone);
    const newRecipient: Recipient = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      phoneNumber: customPhone.trim(),
      type: 'custom',
      isValid
    };

    setRecipients(prev => [...prev, newRecipient]);
    setCustomName('');
    setCustomPhone('');
  };

  // Remove recipient
  const removeRecipient = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  // Update recipient phone
  const updateRecipientPhone = (id: string, newPhone: string) => {
    setRecipients(prev => prev.map(r => 
      r.id === id 
        ? { ...r, phoneNumber: newPhone, isValid: validatePhoneNumber(newPhone) }
        : r
    ));
  };

  // Check if WhatsApp service is configured
  const isServiceConfigured = whatsAppService.isConfigured();

  // Send messages
  const handleSendMessages = async () => {
    const validRecipients = recipients.filter(r => r.isValid);
    
    if (validRecipients.length === 0) {
      return;
    }

    setIsSending(true);
    setProgress({ completed: 0, total: validRecipients.length });
    setSendResults([]);
    setShowResults(true);

    const message = generateWhatsAppMessage();

    try {
      const results = await whatsAppService.sendToMultipleRecipients(
        validRecipients.map(r => ({
          phoneNumber: r.phoneNumber,
          name: r.name
        })),
        message,
        (completed, total, currentResults) => {
          setProgress({ completed, total });
          setSendResults([...currentResults]);
        }
      );

      setSendResults(results);
    } catch (error) {
      console.error('Error sending messages:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Close modal and reset state
  const handleClose = () => {
    if (!isSending) {
      onClose();
      setCustomName('');
      setCustomPhone('');
      setSendResults([]);
      setShowResults(false);
    }
  };

  if (!isOpen) return null;

  const validRecipientsCount = recipients.filter(r => r.isValid).length;
  const successCount = sendResults.filter(r => r.success).length;
  const errorCount = sendResults.filter(r => !r.success).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Enviar por WhatsApp
              </h3>
              <p className="text-sm text-gray-600">
                Comprobante de envío #{receiptData.shipmentId}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSending}
            className={`p-2 rounded-lg transition-colors ${
              isSending 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!isServiceConfigured ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                WhatsApp API no configurada
              </h3>
              <p className="text-sm text-gray-600">
                Es necesario configurar las credenciales de WhatsApp Business API
              </p>
            </div>
          ) : showResults ? (
            /* Results View */
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Resultados del Envío
                </h4>
                {isSending ? (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando {progress.completed} de {progress.total}...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{successCount} exitosos</span>
                    </div>
                    {errorCount > 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{errorCount} errores</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {isSending && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                  />
                </div>
              )}

              {/* Results List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sendResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="font-medium text-sm">
                          {result.recipient}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {result.phoneNumber}
                      </span>
                    </div>
                    {!result.success && result.error && (
                      <p className="text-xs text-red-600 mt-1">{result.error}</p>
                    )}
                    {result.success && result.messageId && (
                      <p className="text-xs text-green-600 mt-1">
                        ID: {result.messageId}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {!isSending && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResults(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Configuration View */
            <div className="space-y-6">
              {/* Recipients List */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Destinatarios ({validRecipientsCount})
                </h4>
                
                {recipients.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                    <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay números de teléfono disponibles</p>
                    <p className="text-xs">Agregue contactos manualmente</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recipients.map((recipient) => (
                      <div
                        key={recipient.id}
                        className={`p-3 border rounded-lg ${
                          recipient.isValid 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              recipient.type === 'cliente' ? 'bg-blue-100' :
                              recipient.type === 'destino' ? 'bg-purple-100' : 'bg-gray-100'
                            }`}>
                              <User className={`w-4 h-4 ${
                                recipient.type === 'cliente' ? 'text-blue-600' :
                                recipient.type === 'destino' ? 'text-purple-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">
                                {recipient.name}
                              </p>
                              <input
                                type="tel"
                                value={recipient.phoneNumber}
                                onChange={(e) => updateRecipientPhone(recipient.id, e.target.value)}
                                className={`w-full text-xs border rounded px-2 py-1 mt-1 ${
                                  recipient.isValid 
                                    ? 'border-gray-300 bg-white' 
                                    : 'border-red-300 bg-red-50'
                                }`}
                                placeholder="Número de teléfono"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {recipient.isValid ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                            {recipient.type === 'custom' && (
                              <button
                                onClick={() => removeRecipient(recipient.id)}
                                className="p-1 text-red-500 hover:bg-red-100 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Custom Contact */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Agregar contacto personalizado
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nombre del contacto"
                  />
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Número de teléfono (ej: 5551234567)"
                  />
                  <button
                    onClick={addCustomRecipient}
                    disabled={!customName.trim() || !customPhone.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar contacto
                  </button>
                </div>
              </div>

              {/* Message Preview */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Vista previa del mensaje
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                    {generateWhatsAppMessage()}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showResults && isServiceConfigured && (
          <div className="flex gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={handleClose}
              disabled={isSending}
              className={`flex-1 px-4 py-2 transition-colors rounded-md ${
                isSending 
                  ? 'text-gray-400 bg-gray-200 cursor-not-allowed' 
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSendMessages}
              disabled={validRecipientsCount === 0 || isSending}
              className={`flex-1 px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
                validRecipientsCount > 0 && !isSending
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar a {validRecipientsCount} contacto{validRecipientsCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};