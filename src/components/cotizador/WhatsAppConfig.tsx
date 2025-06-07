import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle2, AlertTriangle, MessageCircle, Send, Loader2, Eye, EyeOff } from 'lucide-react';
import { whatsAppService, validatePhoneNumber } from '../../services/whatsappService';

interface WhatsAppConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppConfig: React.FC<WhatsAppConfigProps> = ({ isOpen, onClose }) => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  
  // Test message state
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('🧪 Mensaje de prueba desde Enviadores\n\nEste es un mensaje de prueba para verificar la configuración de WhatsApp Business API.\n\n✅ Si recibes este mensaje, la configuración es correcta.');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; messageId?: string } | null>(null);

  // Environment variables display
  const [showTokens, setShowTokens] = useState(false);
  const phoneNumberId = import.meta.env.VITE_WAPI_PHONE_ID;
  const accessToken = import.meta.env.VITE_WAPI_PERMANENT_KEY;
  const businessId = import.meta.env.VITE_WAPI_BUSINESS_ID;

  // Test connection when modal opens
  useEffect(() => {
    if (isOpen) {
      testConnection();
    }
  }, [isOpen]);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setConnectionError(null);
    setBusinessProfile(null);

    try {
      const result = await whatsAppService.testConnection();
      
      if (result.success) {
        setConnectionStatus('success');
        // Try to get business profile
        try {
          const profile = await whatsAppService.getBusinessProfile();
          setBusinessProfile(profile);
        } catch (profileError) {
          console.warn('Could not fetch business profile:', profileError);
        }
      } else {
        setConnectionStatus('error');
        setConnectionError(result.error || 'Error de conexión desconocido');
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Error de conexión');
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone.trim() || !testMessage.trim()) {
      setTestResult({
        success: false,
        message: 'Por favor ingrese un número de teléfono y mensaje'
      });
      return;
    }

    if (!validatePhoneNumber(testPhone)) {
      setTestResult({
        success: false,
        message: 'Número de teléfono inválido'
      });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const result = await whatsAppService.sendTextMessage({
        phoneNumber: testPhone,
        message: testMessage,
        recipientName: 'Prueba'
      });

      setTestResult({
        success: result.success,
        message: result.success 
          ? `✅ Mensaje enviado exitosamente` 
          : `❌ Error: ${result.error}`,
        messageId: result.messageId
      });

    } catch (error) {
      setTestResult({
        success: false,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'testing': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'testing': return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'success': return <CheckCircle2 className="w-5 h-5" />;
      case 'error': return <AlertTriangle className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const maskToken = (token: string) => {
    if (!token || token.length < 8) return token;
    return token.substring(0, 4) + '*'.repeat(token.length - 8) + token.substring(token.length - 4);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Configuración WhatsApp Business API
              </h3>
              <p className="text-sm text-gray-600">
                Estado de conexión y pruebas del servicio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          
          {/* Connection Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Estado de Conexión</h4>
              <button
                onClick={testConnection}
                disabled={connectionStatus === 'testing'}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {connectionStatus === 'testing' ? 'Probando...' : 'Probar Conexión'}
              </button>
            </div>
            
            <div className={`flex items-center gap-3 ${getStatusColor(connectionStatus)}`}>
              {getStatusIcon(connectionStatus)}
              <div>
                <p className="font-medium">
                  {connectionStatus === 'testing' && 'Probando conexión...'}
                  {connectionStatus === 'success' && 'Conexión exitosa'}
                  {connectionStatus === 'error' && 'Error de conexión'}
                  {connectionStatus === 'idle' && 'Sin probar'}
                </p>
                {connectionError && (
                  <p className="text-sm text-red-600 mt-1">{connectionError}</p>
                )}
                {businessProfile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Cuenta: {businessProfile.name || businessProfile.id}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Variables de Entorno</h4>
              <button
                onClick={() => setShowTokens(!showTokens)}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showTokens ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded border">
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    VITE_WAPI_PHONE_ID
                  </label>
                  <p className="text-sm font-mono text-gray-900 break-all">
                    {phoneNumberId ? (showTokens ? phoneNumberId : maskToken(phoneNumberId)) : '❌ No configurado'}
                  </p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    VITE_WAPI_BUSINESS_ID
                  </label>
                  <p className="text-sm font-mono text-gray-900 break-all">
                    {businessId ? (showTokens ? businessId : maskToken(businessId)) : '❌ No configurado'}
                  </p>
                </div>
                
                <div className="bg-white p-3 rounded border md:col-span-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    VITE_WAPI_PERMANENT_KEY
                  </label>
                  <p className="text-sm font-mono text-gray-900 break-all">
                    {accessToken ? (showTokens ? accessToken : maskToken(accessToken)) : '❌ No configurado'}
                  </p>
                </div>
              </div>
              
              {(!phoneNumberId || !businessId || !accessToken) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Faltan variables de entorno. Agregue las siguientes variables a su archivo .env:
                  </p>
                  <pre className="text-xs text-yellow-700 mt-2 font-mono">
{`VITE_WAPI_PHONE_ID=your_phone_number_id
VITE_WAPI_BUSINESS_ID=your_business_id  
VITE_WAPI_PERMANENT_KEY=your_access_token`}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Test Message */}
          {connectionStatus === 'success' && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-gray-900 mb-4">Enviar Mensaje de Prueba</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de teléfono
                  </label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="5551234567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Formato: números mexicanos sin +52 (ej: 5551234567)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={sendTestMessage}
                  disabled={isSendingTest || !testPhone.trim() || !testMessage.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Mensaje de Prueba
                    </>
                  )}
                </button>
                
                {testResult && (
                  <div className={`p-3 rounded-md ${
                    testResult.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`text-sm ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.message}
                    </p>
                    {testResult.messageId && (
                      <p className="text-xs text-green-600 mt-1">
                        ID del mensaje: {testResult.messageId}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documentation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">📚 Documentación</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• <strong>Phone Number ID:</strong> ID del número de teléfono de WhatsApp Business</p>
              <p>• <strong>Business ID:</strong> ID de la cuenta de WhatsApp Business</p>
              <p>• <strong>Access Token:</strong> Token permanente de acceso a la API</p>
              <p>• Los números de teléfono deben ser válidos y estar registrados en WhatsApp</p>
              <p>• Para México, use formato: 5551234567 (sin +52)</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};