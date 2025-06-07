import React, { useState } from 'react';
import { Download, Check, Printer, Eye, FileText, MessageCircle } from 'lucide-react';
import { EnhancedWhatsAppSender } from './EnhancedWhatsAppSender';

// Type declaration for html2pdf
declare global {
  interface Window {
    html2pdf: any;
  }
}

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

// Enhanced digital receipt manager with PDF support
class DigitalReceiptManager {
  private static STORAGE_KEY = 'enviadores_receipts';

  static saveReceipt(receiptData: ReceiptData): string {
    const records = this.getRecords();
    const recordId = `receipt_${Date.now()}`;
    
    const record = {
      id: recordId,
      shipmentId: receiptData.shipmentId,
      receiptData,
      createdAt: new Date().toISOString(),
      receiptHTML: this.generateReceiptHTML(receiptData),
      thermalCommands: this.generateThermalCommands(receiptData),
      professionalHTML: this.generateProfessionalHTML(receiptData)
    };

    records.push(record);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    
    if (records.length > 50) {
      const trimmed = records.slice(-50);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    }

    return recordId;
  }

  static getRecords() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static generateProfessionalHTML(data: ReceiptData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Comprobante ${data.shipmentId} - Enviadores</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" fill="rgba(255,255,255,0.1)"><polygon points="1000,100 0,100 0,0 800,100"/></svg>');
            background-size: cover;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
        }
        
        .logo::before {
            content: '📦';
            margin-right: 10px;
        }
        
        .tagline {
            font-size: 14px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        
        .receipt-title {
            font-size: 24px;
            font-weight: 600;
            margin-top: 20px;
            position: relative;
            z-index: 1;
        }
        
        .content {
            padding: 40px;
        }
        
        .shipment-id {
            text-align: center;
            background: linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%);
            border: 2px dashed #667eea;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .shipment-id h2 {
            color: #667eea;
            font-size: 20px;
            margin-bottom: 5px;
        }
        
        .shipment-id .id {
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        
        .section {
            margin-bottom: 30px;
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            border-left: 4px solid #667eea;
        }
        
        .section-title {
            color: #667eea;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        
        .section-title::before {
            content: '';
            width: 6px;
            height: 6px;
            background: #667eea;
            border-radius: 50%;
            margin-right: 10px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-value {
            font-size: 16px;
            color: #1e293b;
            font-weight: 600;
        }
        
        .price-highlight {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: bold;
        }
        
        .footer {
            background: #f1f5f9;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            color: #64748b;
            font-size: 12px;
            margin-bottom: 10px;
        }
        
        .qr-placeholder {
            width: 80px;
            height: 80px;
            background: #e2e8f0;
            border-radius: 8px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            font-size: 10px;
        }
        
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Enviadores</div>
            <div class="tagline">Sistema de Envíos Profesional</div>
            <div class="receipt-title">Comprobante de Envío</div>
        </div>
        
        <div class="content">
            <div class="shipment-id">
                <h2>ID de Envío</h2>
                <div class="id">${data.shipmentId}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Información del Servicio</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Servicio</div>
                        <div class="info-value">${data.servicio.nombre}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Precio Total</div>
                        <div class="info-value price-highlight">$${data.servicio.precioConIva.toFixed(2)} MXN</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Tiempo de Entrega</div>
                        <div class="info-value">${data.servicio.diasEstimados} días hábiles</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Fecha de Registro</div>
                        <div class="info-value">${data.fecha}</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Detalles del Envío</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Cliente ID</div>
                        <div class="info-value">${data.clienteId}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Destino ID</div>
                        <div class="info-value">${data.destinoId}</div>
                    </div>
                    <div class="info-item" style="grid-column: 1 / -1;">
                        <div class="info-label">Ciudad de Destino</div>
                        <div class="info-value">${data.destinoCiudad}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Generado automáticamente el ${new Date().toLocaleString('es-MX')}<br>
                Para consultas: soporte@enviadores.com.mx
            </div>
            <div class="qr-placeholder">
                QR Code<br>
                ${data.shipmentId}
            </div>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        }
    </script>
</body>
</html>`;
  }

  static generateReceiptHTML(data: ReceiptData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Comprobante ${data.shipmentId}</title>
    <style>
        @media print { body { margin: 0; } }
        body { 
            font-family: 'Courier New', monospace; 
            max-width: 280px; 
            margin: 0 auto; 
            padding: 10px; 
            font-size: 12px;
            line-height: 1.3;
        }
        .header { text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 8px; }
        .line { border-bottom: 1px dashed #000; margin: 8px 0; }
        .section { margin: 10px 0; }
        .label { font-weight: bold; }
        .footer { text-align: center; font-size: 10px; margin-top: 15px; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
    </style>
</head>
<body>
    <div class="header">COMPROBANTE DE ENVIO</div>
    <div class="line"></div>
    
    <div class="section">
        <div class="row"><span class="label">ID Envio:</span> <span>${data.shipmentId}</span></div>
        <div class="row"><span class="label">Fecha:</span> <span>${data.fecha}</span></div>
    </div>
    
    <div class="line"></div>
    <div class="section">
        <div class="label">SERVICIO</div>
        <div>${data.servicio.nombre}</div>
        <div class="row"><span>Precio:</span> <span>$${data.servicio.precioConIva.toFixed(2)}</span></div>
        <div class="row"><span>Entrega:</span> <span>${data.servicio.diasEstimados} dias</span></div>
    </div>
    
    <div class="line"></div>
    <div class="section">
        <div class="label">ENVIO</div>
        <div class="row"><span>Cliente:</span> <span>${data.clienteId}</span></div>
        <div class="row"><span>Destino:</span> <span>${data.destinoId}</span></div>
        <div class="row"><span>Ciudad:</span> <span>${data.destinoCiudad}</span></div>
    </div>
    
    <div class="line"></div>
    <div class="footer">
        Generado automaticamente<br>
        ${new Date().toLocaleString('es-MX')}
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        }
    </script>
</body>
</html>`;
  }

  static generateThermalCommands(data: ReceiptData): string {
    const ESC = '\x1B';
    const GS = '\x1D';
    const LF = '\x0A';
    
    let commands = '';
    commands += ESC + '@';
    commands += ESC + 'a' + '\x01';
    commands += ESC + 'E' + '\x01';
    commands += GS + '!' + '\x11';
    commands += 'COMPROBANTE DE ENVIO' + LF;
    commands += ESC + 'E' + '\x00';
    commands += GS + '!' + '\x00';
    commands += ESC + 'a' + '\x00';
    commands += '================================' + LF;
    commands += ESC + 'E' + '\x01';
    commands += 'ID Envio: ' + data.shipmentId + LF;
    commands += ESC + 'E' + '\x00';
    commands += 'Fecha: ' + data.fecha + LF + LF;
    commands += ESC + 'E' + '\x01';
    commands += 'SERVICIO' + LF;
    commands += ESC + 'E' + '\x00';
    commands += '--------------------------------' + LF;
    commands += data.servicio.nombre + LF;
    commands += 'Precio: $' + data.servicio.precioConIva.toFixed(2) + ' MXN' + LF;
    commands += 'Entrega: ' + data.servicio.diasEstimados + ' dias' + LF + LF;
    commands += ESC + 'E' + '\x01';
    commands += 'ENVIO' + LF;
    commands += ESC + 'E' + '\x00';
    commands += '--------------------------------' + LF;
    commands += 'Cliente: ' + data.clienteId + LF;
    commands += 'Destino: ' + data.destinoId + LF;
    commands += 'Ciudad: ' + data.destinoCiudad + LF + LF;
    commands += '================================' + LF;
    commands += ESC + 'a' + '\x01';
    commands += 'Generado automaticamente' + LF;
    commands += new Date().toLocaleString('es-MX') + LF + LF;
    commands += GS + 'V' + '\x41' + '\x03';
    
    return commands;
  }

  static async generatePDF(receiptData: ReceiptData): Promise<void> {
    // Load html2pdf library if not already loaded
    if (!(window as any).html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      document.head.appendChild(script);
      
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    // Create temporary div with professional HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.generateProfessionalHTML(receiptData);
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    const options = {
      margin: 0,
      filename: `comprobante-${receiptData.shipmentId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    try {
      await (window as any).html2pdf().set(options).from(tempDiv).save();
    } finally {
      document.body.removeChild(tempDiv);
    }
  }
}

// Main enhanced receipt component
export const EnhancedReceiptManager: React.FC<{
  receiptData: ReceiptData;
  onComplete?: (recordId: string) => void;
  className?: string;
  cliente?: Cliente;
  destino?: Destino;
}> = ({ receiptData, onComplete, className = "", cliente, destino }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleGenerateReceipt = async () => {
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newRecordId = DigitalReceiptManager.saveReceipt(receiptData);
      setRecordId(newRecordId);
      onComplete?.(newRecordId);
    } catch (error) {
      console.error('Error generating receipt:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await DigitalReceiptManager.generatePDF(receiptData);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar PDF. Por favor intente nuevamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadThermalFile = () => {
    if (!recordId) return;
    
    const record = DigitalReceiptManager.getRecords().find((r: any) => r.id === recordId);
    if (!record) return;

    const blob = new Blob([record.thermalCommands], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thermal-${receiptData.shipmentId}.prn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printToDefaultPrinter = () => {
    if (!recordId) return;
    
    const record = DigitalReceiptManager.getRecords().find((r: any) => r.id === recordId);
    if (!record) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(record.receiptHTML);
      printWindow.document.close();
    }
  };

  const viewProfessionalReceipt = () => {
    if (!recordId) return;
    
    const record = DigitalReceiptManager.getRecords().find((r: any) => r.id === recordId);
    if (!record) return;

    const viewWindow = window.open('', '_blank');
    if (viewWindow) {
      viewWindow.document.write(record.professionalHTML);
      viewWindow.document.close();
    }
  };

  if (!recordId) {
    return (
      <div className={`space-y-3 ${className}`}>
        <button
          onClick={handleGenerateReceipt}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md transition-all disabled:opacity-50 transform hover:scale-105"
        >
          {isGenerating ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generando Comprobante...</span>
            </>
          ) : (
            <>
              <FileText className="h-5 w-5" />
              <span>Generar Comprobante</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Success message */}
      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-md">
        <Check className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-green-700">✨ Comprobante generado exitosamente</span>
      </div>

      {/* Primary actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={downloadPDF}
          disabled={isGeneratingPDF}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-md transition-all transform hover:scale-105 disabled:opacity-50"
        >
          {isGeneratingPDF ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">PDF Profesional</span>
        </button>
        
        <button
          onClick={() => setShowWhatsAppModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-md transition-all transform hover:scale-105"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm font-medium">WhatsApp</span>
        </button>
      </div>

      {/* Secondary actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={printToDefaultPrinter}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Printer className="h-4 w-4" />
          <span className="text-xs font-medium">Imprimir</span>
        </button>
        
        <button
          onClick={viewProfessionalReceipt}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
        >
          <Eye className="h-4 w-4" />
          <span className="text-xs font-medium">Ver</span>
        </button>

        <button
          onClick={downloadThermalFile}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-md hover:bg-orange-100 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span className="text-xs font-medium">.prn</span>
        </button>
      </div>

      {/* Instructions toggle */}
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="w-full text-left px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-yellow-800">💡 Instrucciones de uso</span>
          <span className="text-yellow-600">{showInstructions ? '−' : '+'}</span>
        </div>
      </button>

      {showInstructions && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800 space-y-3">
          <div>
            <strong>📄 PDF Profesional:</strong>
            <p>• Descarga un PDF con diseño completo, colores y logo</p>
            <p>• Perfecto para enviar por email o imprimir en papel</p>
          </div>
          
          <div>
            <strong>📱 WhatsApp:</strong>
            <p>• Envía el comprobante via WhatsApp Business API</p>
            <p>• Soporta múltiples destinatarios simultáneos</p>
            <p>• Incluye cliente, destinatario y contactos personalizados</p>
          </div>
          
          <div>
            <strong>🖨️ Impresora térmica (.prn):</strong>
            <p>• Windows: <code>copy archivo.prn LPT1:</code></p>
            <p>• Mac: <code>cat archivo.prn {'>'} /dev/cu.usbserial</code></p>
          </div>
        </div>
      )}

      {/* Enhanced WhatsApp Modal */}
      <EnhancedWhatsAppSender
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        receiptData={receiptData}
        cliente={cliente}
        destino={destino}
      />
    </div>
  );
};

// Export component for easy integration
export const USBThermalReceipt = EnhancedReceiptManager;