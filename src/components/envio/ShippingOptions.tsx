import { useState, useEffect, useRef } from 'react';
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
  setExternalLabelData: (data: ExternalLabelData | ((prev: ExternalLabelData) => ExternalLabelData)) => void;
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
  const [isDownloadingLabel, setIsDownloadingLabel] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  // Track download attempts to prevent infinite loops
  const downloadAttemptRef = useRef<number>(0);
  const maxDownloadAttempts = 3;
  const labelDownloadedRef = useRef<boolean>(false);

  // Effect to update when label data changes
  useEffect(() => {
    if (labelData && labelData.tracking_number && labelData.label_url && !labelDownloadedRef.current) {
      // First immediately update tracking number and carrier
      setExternalLabelData({
        ...externalLabelData,
        carrier: selectedManuableService?.carrier || 'Manuable',
        trackingNumber: labelData.tracking_number
      });
      
      // Reset download attempts counter
      downloadAttemptRef.current = 0;
      
      // Then try to download the label file
      setIsDownloadingLabel(true);
      setDownloadError(null);
      
      // Set a flag to prevent re-downloading
      labelDownloadedRef.current = true;
      
      downloadManuableLabel(labelData.label_url)
        .then(file => {
          if (file) {
            setExternalLabelData({
              ...externalLabelData,
              labelFile: file,
              carrier: selectedManuableService?.carrier || 'Manuable',
              trackingNumber: labelData.tracking_number
            });
            
            // Set cost if available
            if (labelData.price) {
              setExternalCost(parseFloat(labelData.price));
            }
          } else {
            setDownloadError('No se pudo descargar la etiqueta. Intente descargarla manualmente.');
          }
        })
        .catch(error => {
          console.error('Error downloading Manuable label:', error);
          setDownloadError('Error al descargar la etiqueta: ' + error.message);
        })
        .finally(() => {
          setIsDownloadingLabel(false);
        });
    }
  }, [labelData, selectedManuableService, setExternalLabelData, setExternalCost, externalLabelData]);

  // Handler for successful label generation
  const handleLabelGenerated = (data: ManuableLabelResponse) => {
    console.log('Label generated with data:', data);
    setLabelData(data);
    // Reset the download flag when a new label is generated
    labelDownloadedRef.current = false;
  };
  
  // Function to download a Manuable label and convert it to a File object
  const downloadManuableLabel = async (url: string): Promise<File | null> => {
    // Increment the attempt counter
    downloadAttemptRef.current += 1;
    
    // Check if we've exceeded max attempts
    if (downloadAttemptRef.current > maxDownloadAttempts) {
      console.warn(`Exceeded maximum download attempts (${maxDownloadAttempts})`);
      throw new Error(`Demasiados intentos fallidos. Descargue la etiqueta manualmente.`);
    }
    
    try {
      console.log(`Downloading label from URL (attempt ${downloadAttemptRef.current}/${maxDownloadAttempts}):`, url);
      
      // Set a timeout for the fetch operation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to download label: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const filename = url.split('/').pop() || 'manuable_label.pdf';
      
      const file = new File([blob], filename, {
        type: blob.type || 'application/pdf'
      });
      
      console.log('Label downloaded successfully, created file:', file.name, file.size, 'bytes');
      return file;
    } catch (error) {
      console.error(`Error downloading label (attempt ${downloadAttemptRef.current}/${maxDownloadAttempts}):`, error);
      
      // If we haven't reached max attempts, wait and try again
      if (downloadAttemptRef.current < maxDownloadAttempts) {
        console.log(`Retrying in ${downloadAttemptRef.current * 2} seconds...`);
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, downloadAttemptRef.current * 2000));
        // Recursive retry with exponential backoff
        return downloadManuableLabel(url);
      }
      
      return null;
    }
  };

  // Function to handle manual download of the label
  const handleManualDownload = () => {
    if (labelData?.label_url) {
      // Open the label URL in a new tab
      window.open(labelData.label_url, '_blank');
    }
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
            <>
              <ManuableLabelDisplay labelData={labelData} />
              
              {/* Show download status or error */}
              {isDownloadingLabel && (
                <div className="text-center py-2 bg-blue-50 rounded mt-2">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                    <p className="text-blue-600 text-sm">Descargando etiqueta, por favor espere...</p>
                  </div>
                </div>
              )}
              
              {downloadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-2">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Error al descargar la etiqueta</h3>
                      <p className="mt-1 text-xs text-red-700">{downloadError}</p>
                      
                      {/* Button for manual download */}
                      <button 
                        onClick={handleManualDownload}
                        className="mt-2 inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Descargar Manualmente
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Show label generator if service is selected */}
              {selectedManuableService ? (
                <ManuableLabelGenerator 
                  cliente={cliente}
                  destino={destino}
                  selectedService={selectedManuableService}
                  onLabelGenerated={handleLabelGenerated}
                  content={packageDetails.content}
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