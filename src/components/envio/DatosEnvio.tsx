// Fixed DatosEnvio.tsx with proper debouncing and rate limiting for 429 errors

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '../../services/apiService';
import { Cliente, Destino, ServicioCotizado } from '../../types';
import type { ServicioCotizado as CotizadorServicioCotizado, DetallesCotizacion } from '../cotizador/utils/cotizadorTypes';
import EnvioDataDisplay from './EnvioDataDisplay';
import EnvioConfirmation from './EnvioConfirmation';
import ShippingOptionsModal from './ShippingOptionsModal';
import { Check, AlertTriangle, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import {
  updateDestinationWithRetry,
  createShipmentData
} from './utils/envioUtils';
import { calculateZone } from '../postalUtils';

interface DatosEnvioProps {
  selectedService: ServicioCotizado;
  onBack: () => void;
  onSubmit: (envioData: {
    cliente: Cliente;
    destino: Destino;
    shipmentId: string;
  }) => void;
  originData?: {
    estado: string;
    municipio: string;
    ciudad: string;
    colonias: string[];
  };
  destData?: {
    estado: string;
    municipio: string;
    ciudad: string;
    colonias: string[];
  };
  originZip: string;
  destZip: string;
  clienteId?: string | null;
  destinoId?: string | null;
  onUpdateSelectedService?: (service: ServicioCotizado, newQuoteData?: {
    servicios: CotizadorServicioCotizado[];
    detallesCotizacion: DetallesCotizacion;
    newOriginZip?: string;
    newDestZip?: string;
    newZone?: number;
    newClienteId?: string | null;
    newDestinoId?: string | null;
  }) => void;
  originalCotizadorState?: {
    packageType: string;
    weight: string;
    length?: string;
    width?: string;
    height?: string;
    volumetricWeight: number;
    insurance: boolean;
    insuranceValue: string;
    packagingOption: string;
    customPackagingPrice?: number | null;
    collectionRequired: boolean;
    collectionPrice?: number | null;
  };
  discountData?: {
    tipo: 'porcentaje' | 'fijo' | 'codigo' | '';
    valor: number;
    codigo?: string;
    aplicado: boolean;
    subtotalBeforeDiscount?: number;
    discountAmount?: number;
  };
}

export default function DatosEnvio({
  selectedService,
  onBack,
  onSubmit,
  originZip,
  destZip,
  clienteId,
  destinoId,
  onUpdateSelectedService,
  originalCotizadorState,
  discountData
}: DatosEnvioProps) {
  // Main UI state
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [showShippingModal, setShowShippingModal] = useState(false);

  // Content state
  const [contenido, setContenido] = useState<string>('');

  // Client and destination state
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [destino, setDestino] = useState<Destino | null>(null);
  
  // Track the currently active cliente and destino IDs
  const [currentClienteId, setCurrentClienteId] = useState<string | null>(clienteId || null);
  const [currentDestinoId, setCurrentDestinoId] = useState<string | null>(destinoId || null);

  // Track original ZIP codes from the initial quote
  const [originalOriginZip] = useState<string>(originZip);
  const [originalDestZip] = useState<string>(destZip);

  // Validation state
  const [zipValidation, setZipValidation] = useState({
    originValid: true,
    destValid: true
  });

  // New state for tracking if we need a new quote
  const [needsNewQuote, setNeedsNewQuote] = useState(false);
  const [isGeneratingNewQuote, setIsGeneratingNewQuote] = useState(false);

  // Package details for Manuable API
  const [packageDetails] = useState({
    peso: selectedService.peso || 1,
    alto: selectedService.alto || 10,
    largo: selectedService.largo || 30,
    ancho: selectedService.ancho || 25,
    valor_declarado: selectedService.valorSeguro || 1,
    content: contenido || "GIFT",
    tipo_paquete: selectedService.tipoPaquete || 'paquete'
  });

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // **NEW: Rate limiting and debouncing refs**
  const loadDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastApiCallRef = useRef<number>(0);
  const isLoadingDataRef = useRef<boolean>(false);
  const loadedIdsRef = useRef<{ clienteId: string | null; destinoId: string | null }>({ 
    clienteId: null, 
    destinoId: null 
  });

  // **NEW: Rate limiting constants**
  const API_RATE_LIMIT_MS = 1000; // Minimum 1 second between API calls
  const DEBOUNCE_DELAY_MS = 500; // 500ms debounce delay

  // **NEW: Debounced and rate-limited loadExistingData function**
  const debouncedLoadExistingData = useCallback((useClienteId?: string | null, useDestinoId?: string | null) => {
    const targetClienteId = useClienteId !== undefined ? useClienteId : currentClienteId;
    const targetDestinoId = useDestinoId !== undefined ? useDestinoId : currentDestinoId;
    
    // Check if we already loaded this exact combination
    if (loadedIdsRef.current.clienteId === targetClienteId && 
        loadedIdsRef.current.destinoId === targetDestinoId) {
      console.log('Data already loaded for these IDs, skipping');
      return;
    }

    // Clear any existing timeout
    if (loadDataTimeoutRef.current) {
      clearTimeout(loadDataTimeoutRef.current);
    }

    // If already loading, don't start another load
    if (isLoadingDataRef.current) {
      console.log('Data load already in progress, skipping');
      return;
    }

    // Only proceed if we have valid IDs
    if (!targetClienteId && !targetDestinoId) {
      console.log('No clienteId or destinoId provided, skipping data load');
      return;
    }

    // Set up debounced execution
    loadDataTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      const timeSinceLastCall = now - lastApiCallRef.current;
      
      if (timeSinceLastCall < API_RATE_LIMIT_MS) {
        // If we're within rate limit, schedule for later
        const delay = API_RATE_LIMIT_MS - timeSinceLastCall;
        console.log(`Rate limiting API call, delaying by ${delay}ms`);
        
        loadDataTimeoutRef.current = setTimeout(() => {
          loadExistingDataInternal(targetClienteId, targetDestinoId);
        }, delay);
      } else {
        // Safe to make API call
        loadExistingDataInternal(targetClienteId, targetDestinoId);
      }
    }, DEBOUNCE_DELAY_MS);
  }, [currentClienteId, currentDestinoId]);

  // **NEW: Internal function that actually loads the data**
  const loadExistingDataInternal = async (targetClienteId: string | null, targetDestinoId: string | null) => {
    // Prevent concurrent calls
    if (isLoadingDataRef.current) {
      console.log('Load already in progress, aborting');
      return;
    }

    isLoadingDataRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);
    lastApiCallRef.current = Date.now();

    try {
      console.log('Starting data load for:', { targetClienteId, targetDestinoId });

      // Load cliente data if clienteId is provided
      if (targetClienteId) {
        console.log('Loading cliente data for ID:', targetClienteId);
        
        // **ENHANCED: Add retry logic for 429 errors**
        let retryCount = 0;
        const maxRetries = 3;
        let clienteData = null;

        while (retryCount < maxRetries && !clienteData) {
          try {
            const results = await apiService.searchCustomers(targetClienteId);
            if (results && results.length > 0) {
              clienteData = results[0];
              console.log('Loaded cliente:', clienteData);
              setCliente(clienteData);
            } else {
              console.warn('No cliente found for ID:', targetClienteId);
              setCliente(null);
            }
            break; // Success, exit retry loop
          } catch (error: any) {
            retryCount++;
            console.warn(`Cliente API call failed (attempt ${retryCount}/${maxRetries}):`, error);
            
            if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
              // Wait longer for rate limit errors
              const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
              console.log(`Rate limited, waiting ${backoffDelay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
            } else if (retryCount >= maxRetries) {
              throw error; // Re-throw if not rate limit error or max retries reached
            }
          }
        }
      }

      // Load destino data if both clienteId and destinoId are provided
      if (targetClienteId && targetDestinoId) {
        console.log('Loading destino data for clienteId:', targetClienteId, 'destinoId:', targetDestinoId);
        
        // **ENHANCED: Add retry logic for destino as well**
        let retryCount = 0;
        const maxRetries = 3;
        let destinoData = null;

        while (retryCount < maxRetries && !destinoData) {
          try {
            // Add small delay between cliente and destino calls to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const results = await apiService.getCustomerDestinations(targetClienteId);
            if (results && results.length > 0) {
              destinoData = results.find((d: Destino) => d.id === targetDestinoId);
              if (destinoData) {
                console.log('Loaded destino:', destinoData);
                setDestino(destinoData);
              } else {
                console.warn('No destino found for ID:', targetDestinoId);
                setDestino(null);
              }
            } else {
              console.warn('No destinations found for clienteId:', targetClienteId);
              setDestino(null);
            }
            break; // Success, exit retry loop
          } catch (error: any) {
            retryCount++;
            console.warn(`Destino API call failed (attempt ${retryCount}/${maxRetries}):`, error);
            
            if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
              // Wait longer for rate limit errors
              const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
              console.log(`Rate limited, waiting ${backoffDelay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
            } else if (retryCount >= maxRetries) {
              throw error; // Re-throw if not rate limit error or max retries reached
            }
          }
        }
      }

      // Update the loaded IDs reference
      loadedIdsRef.current = { 
        clienteId: targetClienteId, 
        destinoId: targetDestinoId 
      };

    } catch (error: any) {
      console.error('Error loading cliente/destino data:', error);
      
      // **ENHANCED: Better error messages based on error type**
      if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        setErrorMessage('Demasiadas solicitudes. Por favor espere un momento e intente nuevamente.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setErrorMessage('Error de conexión. Verifique su conexión a internet e intente nuevamente.');
      } else {
        setErrorMessage('Error al cargar los datos del cliente/destino. Por favor intente nuevamente.');
      }
      
      // Don't clear data on error, keep what we have
    } finally {
      setIsLoading(false);
      isLoadingDataRef.current = false;
    }
  };

  // **UPDATED: Enhanced remove handlers that update current IDs and clear loaded refs**
  const handleRemoveCliente = () => {
    setCliente(null);
    setDestino(null);
    setCurrentClienteId(null);
    setCurrentDestinoId(null);
    setErrorMessage(null);
    setNeedsNewQuote(false);
    
    // Clear loaded IDs reference
    loadedIdsRef.current = { clienteId: null, destinoId: null };
    
    // Notify parent component about the ID changes
    if (onUpdateSelectedService) {
      onUpdateSelectedService(selectedService, {
        servicios: [],
        detallesCotizacion: {} as DetallesCotizacion,
        newOriginZip: originZip,
        newDestZip: destZip,
        newClienteId: null,
        newDestinoId: null
      });
    }
  };

  const handleRemoveDestino = () => {
    setDestino(null);
    setCurrentDestinoId(null);
    setErrorMessage(null);
    
    // Update loaded IDs reference
    loadedIdsRef.current = { 
      clienteId: loadedIdsRef.current.clienteId, 
      destinoId: null 
    };
    
    // Check if we still need a new quote based on client ZIP
    if (cliente && cliente.codigo_postal !== originZip) {
      setNeedsNewQuote(true);
    } else {
      setNeedsNewQuote(false);
    }
    
    // Notify parent component about the destino ID change
    if (onUpdateSelectedService) {
      onUpdateSelectedService(selectedService, {
        servicios: [],
        detallesCotizacion: {} as DetallesCotizacion,
        newOriginZip: cliente?.codigo_postal || originZip,
        newDestZip: destZip,
        newClienteId: currentClienteId,
        newDestinoId: null
      });
    }
  };

  // **UPDATED: Effects with better dependency management**
  useEffect(() => {
    // Initial load when component mounts
    if (currentClienteId || currentDestinoId) {
      console.log('Initial data load on mount with:', { 
        currentClienteId, 
        currentDestinoId,
        propsClienteId: clienteId,
        propsDestinoId: destinoId 
      });
      debouncedLoadExistingData();
    }
  }, []); // Empty dependency array for mount only

  // **UPDATED: Monitor changes to prop IDs with debouncing**
  useEffect(() => {
    const propClienteId = clienteId || null;
    const propDestinoId = destinoId || null;
    
    console.log('Props changed:', {
      propClienteId,
      propDestinoId,
      currentClienteId,
      currentDestinoId,
      propsChanged: propClienteId !== currentClienteId || propDestinoId !== currentDestinoId
    });
    
    // Only update if the props actually changed
    if (propClienteId !== currentClienteId || propDestinoId !== currentDestinoId) {
      console.log('Syncing IDs from props to current state');
      
      // Update our tracked IDs
      setCurrentClienteId(propClienteId);
      setCurrentDestinoId(propDestinoId);
      
      // Clear existing data if IDs changed
      if (propClienteId !== currentClienteId) {
        setCliente(null);
        setDestino(null); // Also clear destino since it depends on cliente
        loadedIdsRef.current = { clienteId: null, destinoId: null };
      } else if (propDestinoId !== currentDestinoId) {
        setDestino(null); // Only clear destino
        loadedIdsRef.current.destinoId = null;
      }
      
      // Load with new IDs if they exist (debounced)
      if (propClienteId || propDestinoId) {
        debouncedLoadExistingData(propClienteId, propDestinoId);
      }
      
      // Reset validation state since we have new data
      setNeedsNewQuote(false);
      setErrorMessage(null);
    }
  }, [clienteId, destinoId, debouncedLoadExistingData]); // Include debouncedLoadExistingData in dependencies

  // **UPDATED: ZIP validation effect**
  useEffect(() => {
    if (cliente?.codigo_postal || destino?.codigo_postal) {
      validateZipCodes();
    }
  }, [cliente?.codigo_postal, destino?.codigo_postal, originZip, destZip]);

  // **NEW: Cleanup effect**
  useEffect(() => {
    return () => {
      // Cleanup timeout on unmount
      if (loadDataTimeoutRef.current) {
        clearTimeout(loadDataTimeoutRef.current);
      }
    };
  }, []);

  function validateZipCodes() {
    if (cliente && destino) {
      // Compare against ORIGINAL quote ZIP codes, not current ones
      const originValid = cliente.codigo_postal === originalOriginZip;
      const destValid = destino.codigo_postal === originalDestZip;
      
      setZipValidation({
        originValid,
        destValid
      });

      // Set needsNewQuote if any ZIP doesn't match the ORIGINAL quote
      setNeedsNewQuote(!originValid || !destValid);
      
      console.log('ZIP Validation:', {
        clienteZip: cliente.codigo_postal,
        destinoZip: destino.codigo_postal,
        originalOriginZip,
        originalDestZip,
        originValid,
        destValid,
        needsNewQuote: !originValid || !destValid
      });
    } else if (cliente) {
      // Compare client ZIP against ORIGINAL origin ZIP
      const originValid = cliente.codigo_postal === originalOriginZip;
      setZipValidation({
        originValid,
        destValid: true // No destination yet
      });
      setNeedsNewQuote(!originValid);
      
      console.log('ZIP Validation (cliente only):', {
        clienteZip: cliente.codigo_postal,
        originalOriginZip,
        originValid,
        needsNewQuote: !originValid
      });
    }
  }

  // Enhanced handleGenerateNewQuote with rate limiting
  const handleGenerateNewQuote = async () => {
    if (!cliente || !destino) {
      setErrorMessage('Por favor complete los datos del remitente y destinatario');
      return;
    }

    if (!originalCotizadorState) {
      setErrorMessage('No se encontró información de la cotización original');
      return;
    }

    if (!onUpdateSelectedService) {
      setErrorMessage('No se puede actualizar el servicio seleccionado');
      return;
    }

    // **NEW: Check rate limiting for quote generation**
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallRef.current;
    
    if (timeSinceLastCall < API_RATE_LIMIT_MS) {
      setErrorMessage(`Por favor espere ${Math.ceil((API_RATE_LIMIT_MS - timeSinceLastCall) / 1000)} segundos antes de generar otra cotización.`);
      return;
    }

    setIsGeneratingNewQuote(true);
    setErrorMessage(null);
    lastApiCallRef.current = Date.now();

    try {
      // First, validate the new ZIP codes and calculate zone
      const originPostal = parseInt(cliente.codigo_postal);
      const destPostal = parseInt(destino.codigo_postal);

      if (isNaN(originPostal) || isNaN(destPostal)) {
        setErrorMessage('Códigos postales inválidos');
        setIsGeneratingNewQuote(false);
        return;
      }

      // Calculate zone using the same function as cotizador
      const calculatedZone = calculateZone(originPostal, destPostal);

      // Check if we need reexpedition cost
      let requiereReexpedicion = false;
      try {
        const formData = new FormData();
        formData.append('originZipCode', cliente.codigo_postal);
        formData.append('destinationZipCode', destino.codigo_postal);
        formData.append('country', 'MEX');
        formData.append('language', '0');

        const estafetaResponse = await fetch('https://eproxy.alejandro-sarmiento-pa.workers.dev/', {
          method: 'POST',
          body: new URLSearchParams(formData as any),
        });

        const estafetaData = await estafetaResponse.json();
        
        const parseReexpeditionCost = (value: string | undefined): boolean => {
          if (!value) return false;
          const normalizedValue = value.trim().toLowerCase();
          if (normalizedValue === "no") return false;
          const numericValue = parseFloat(normalizedValue.replace(/[^0-9.]/g, ''));
          return !isNaN(numericValue) && numericValue > 0;
        };

        requiereReexpedicion = estafetaData?.reexpe ? parseReexpeditionCost(estafetaData.reexpe) : false;
      } catch (error) {
        console.warn('Could not fetch Estafeta data, proceeding without reexpedition check');
      }

      // Create the payload using the original cotizador state
      const payload = {
        zona: calculatedZone,
        tipoPaquete: originalCotizadorState.packageType,
        peso: parseFloat(originalCotizadorState.weight),
        pesoVolumetrico: originalCotizadorState.volumetricWeight,
        esInternacional: false,
        valorSeguro: originalCotizadorState.insurance ? parseFloat(originalCotizadorState.insuranceValue) || 0 : 0,
        opcionEmpaque: originalCotizadorState.packagingOption,
        precioEmpaquePersonalizado: originalCotizadorState.packagingOption === 'EMP05' ? originalCotizadorState.customPackagingPrice : null,
        requiereRecoleccion: originalCotizadorState.collectionRequired,
        precioRecoleccion: originalCotizadorState.collectionRequired ? originalCotizadorState.collectionPrice : null,
        requiereReexpedicion: requiereReexpedicion
      };

      console.log('Generating new quote with payload:', payload);

      const response = await fetch('https://enviadores.com.mx/api/get-prices.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.exito && data.servicios?.length > 0) {
        console.log('New quote data received:', data);
        
        // Process all services with proper pricing calculations
        const ivaRate = data.iva || 0.16;
        const additionalChargesTotal = 
          data.cargosAdicionales.empaque + 
          data.cargosAdicionales.seguro + 
          data.cargosAdicionales.recoleccion + 
          (data.cargosAdicionales.reexpedicion || 0);

        const serviciosConTotales: CotizadorServicioCotizado[] = data.servicios.map((servicio: any): CotizadorServicioCotizado => {
          const precioCompleto = servicio.precioFinal + additionalChargesTotal;
          const iva = precioCompleto * ivaRate;
          
          return {
            sku: servicio.sku,
            nombre: servicio.nombre,
            precioBase: typeof servicio.precioBase === 'string' 
              ? parseFloat(servicio.precioBase) 
              : servicio.precioBase || 0,
            precioFinal: servicio.precioFinal || 0,
            precioTotal: precioCompleto,
            precioConIva: precioCompleto + iva,
            iva: iva,
            cargoSobrepeso: servicio.cargoSobrepeso || 0,
            diasEstimados: servicio.diasEstimados || 1,
            peso: parseFloat(originalCotizadorState.weight),
            pesoVolumetrico: originalCotizadorState.volumetricWeight,
            esInternacional: false,
            pesoFacturable: data.pesoFacturable
          };
        });

        // Create detallesCotizacion
        const calcularConIva = (amount: number) => amount + (amount * ivaRate);
        const detallesCotizacion = {
          empaque: data.cargosAdicionales.empaque,
          empaqueConIva: calcularConIva(data.cargosAdicionales.empaque),
          seguro: data.cargosAdicionales.seguro,
          seguroConIva: calcularConIva(data.cargosAdicionales.seguro),
          recoleccion: data.cargosAdicionales.recoleccion,
          recoleccionConIva: calcularConIva(data.cargosAdicionales.recoleccion),
          reexpedicion: data.cargosAdicionales.reexpedicion || 0,
          reexpedicionConIva: calcularConIva(data.cargosAdicionales.reexpedicion || 0),
          pesoTotal: data.pesoTotal,
          pesoVolumetrico: data.pesoVolumetrico,
          pesoFacturable: data.pesoFacturable,
          iva: ivaRate,
          totalConIva: serviciosConTotales.reduce((sum: number, s: any) => sum + s.precioConIva, 0) +
            calcularConIva(data.cargosAdicionales.empaque) +
            calcularConIva(data.cargosAdicionales.seguro) +
            calcularConIva(data.cargosAdicionales.recoleccion) +
            calcularConIva(data.cargosAdicionales.reexpedicion || 0)
        };

        // Smart service matching strategy
        let matchingService = null;

        // 1. Try exact SKU match first
        matchingService = serviciosConTotales.find((s: any) => s.sku === selectedService.sku);

        if (!matchingService) {
          console.log(`Exact service ${selectedService.sku} not found, looking for similar service...`);
          
          // 2. Try to match by service type (first part of name)
          const originalServiceType = selectedService.nombre.split(' ')[0]; // e.g., "DIA" from "DIA SIGUIENTE 01"
          
          matchingService = serviciosConTotales.find((s: any) => 
            s.nombre.startsWith(originalServiceType)
          );
          
          if (matchingService) {
            console.log(`Found similar service: ${matchingService.nombre} (${matchingService.sku}) for original ${selectedService.nombre} (${selectedService.sku})`);
          }
        }

        if (!matchingService) {
          console.log('No similar service found, looking for fastest delivery...');
          
          // 3. Fallback: find service with fastest delivery (lowest diasEstimados)
          matchingService = serviciosConTotales.reduce((fastest: any, current: any) => 
            (current.diasEstimados || 999) < (fastest.diasEstimados || 999) ? current : fastest
          );
          
          if (matchingService) {
            console.log(`Selected fastest service as fallback: ${matchingService.nombre} (${matchingService.sku})`);
          }
        }

        if (!matchingService) {
          // 4. Last resort: pick the first service
          matchingService = serviciosConTotales[0];
          console.log(`Using first available service as last resort: ${matchingService.nombre} (${matchingService.sku})`);
        }

        if (matchingService) {
          console.log('Final selected service:', matchingService);

          // Create the updated service object
          const updatedService: ServicioCotizado = {
            ...selectedService,
            // Update service identification
            sku: matchingService.sku,
            nombre: matchingService.nombre,
            // Update pricing
            precioBase: matchingService.precioBase,
            cargoSobrepeso: matchingService.cargoSobrepeso,
            precioFinal: matchingService.precioFinal || 0,
            precioTotal: matchingService.precioTotal,
            precioConIva: matchingService.precioConIva,
            iva: matchingService.iva,
            diasEstimados: matchingService.diasEstimados || 1,
            pesoFacturable: data.pesoFacturable || selectedService.pesoFacturable,
            // Keep original package details
            peso: parseFloat(originalCotizadorState.weight),
            pesoVolumetrico: originalCotizadorState.volumetricWeight,
            alto: originalCotizadorState.packageType === "Paquete" ? parseFloat(originalCotizadorState.height || '0') : 1,
            largo: originalCotizadorState.packageType === "Paquete" ? parseFloat(originalCotizadorState.length || '0') : 30,
            ancho: originalCotizadorState.packageType === "Paquete" ? parseFloat(originalCotizadorState.width || '0') : 25,
            valorSeguro: originalCotizadorState.insurance ? parseFloat(originalCotizadorState.insuranceValue || '0') : 1,
          };

          // Include current IDs in the update
          onUpdateSelectedService(updatedService, {
            servicios: serviciosConTotales,
            detallesCotizacion: detallesCotizacion,
            newOriginZip: cliente.codigo_postal,
            newDestZip: destino.codigo_postal,
            newZone: calculatedZone,
            newClienteId: cliente.id || null,
            newDestinoId: destino.id || null
          });

          // Update local ZIP validation
          setZipValidation({
            originValid: true,
            destValid: true
          });
          setNeedsNewQuote(false);

          // Show success message
          setErrorMessage(null);
          console.log('Quote updated successfully');

        } else {
          setErrorMessage('No se encontraron servicios disponibles para estos códigos postales');
        }

      } else {
        setErrorMessage(data.error || 'No se encontraron servicios disponibles para estos códigos postales');
        console.log('API Error or no services:', data);
      }

    } catch (error) {
      console.error('Error generating new quote:', error);
      setErrorMessage('Error al generar nueva cotización. Por favor intente nuevamente.');
    } finally {
      setIsGeneratingNewQuote(false);
    }
  };

  // Enhanced update handlers that track current IDs
  const handleUpdateCliente = (updatedCliente: Cliente) => {
    setCliente(updatedCliente);
    setCurrentClienteId(updatedCliente.id || null);
    
    // Update loaded IDs reference
    loadedIdsRef.current.clienteId = updatedCliente.id || null;
    
    validateZipCodes();
    
    // Notify parent of the cliente ID change
    if (onUpdateSelectedService && updatedCliente.id) {
      onUpdateSelectedService(selectedService, {
        servicios: [],
        detallesCotizacion: {} as DetallesCotizacion,
        newOriginZip: updatedCliente.codigo_postal,
        newDestZip: destino?.codigo_postal || destZip,
        newClienteId: updatedCliente.id,
        newDestinoId: currentDestinoId
      });
    }
  };

  const handleUpdateDestino = (updatedDestino: Destino) => {
    setDestino(updatedDestino);
    setCurrentDestinoId(updatedDestino.id || null);
    
    // Update loaded IDs reference
    loadedIdsRef.current.destinoId = updatedDestino.id || null;
    
    validateZipCodes();
    
    // Notify parent of the destino ID change
    if (onUpdateSelectedService && updatedDestino.id) {
      onUpdateSelectedService(selectedService, {
        servicios: [],
        detallesCotizacion: {} as DetallesCotizacion,
        newOriginZip: cliente?.codigo_postal || originZip,
        newDestZip: updatedDestino.codigo_postal,
        newClienteId: currentClienteId,
        newDestinoId: updatedDestino.id
      });
    }
  };

  const handleUpdateContenido = (newContenido: string) => {
    setContenido(newContenido);
  };

  const handleContinueToConfirmation = () => {
    if (!isFormValid()) {
      if (!cliente) {
        setErrorMessage('Por favor complete los datos del remitente');
      } else if (!destino) {
        setErrorMessage('Por favor complete los datos del destinatario');
      } else if (!contenido.trim()) {
        setErrorMessage('Por favor describa el contenido del envío');
      }
      return;
    }

    if (needsNewQuote) {
      setErrorMessage('Los códigos postales no coinciden con la cotización. Por favor genere una nueva cotización.');
      return;
    }

    setStep('confirmation');
  };

  const handleBackToForm = () => {
    setStep('form');
  };

  const isFormValid = (): boolean => {
    return !!cliente && !!destino && contenido.trim() !== '';
  };

  const isZipValidationPassing = (): boolean => {
    return zipValidation.originValid && zipValidation.destValid;
  };

  const handleShippingModalSubmit = async (shippingData: any) => {
    if (!isFormValid()) {
      setErrorMessage('Por favor complete todos los campos requeridos');
      return;
    }

    if (!isZipValidationPassing()) {
      setErrorMessage("Los códigos postales no coinciden con la cotización original. Por favor genere una nueva cotización.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Process the shipment
      const { clienteId, destinoId, shipmentId } = await processShipment(shippingData);

      // Close modal
      setShowShippingModal(false);

      // Call onSubmit with all data
      onSubmit({
        cliente: cliente!,
        destino: destino!,
        shipmentId
      });

    } catch (error) {
      console.error('Error saving data:', error);
      setErrorMessage('Error al guardar los datos. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  async function processShipment(shippingData: any) {
    if (!cliente || !destino) {
      throw new Error('Missing cliente or destino data');
    }

    // Save or update client
    let clientId = cliente.id;
    if (!clientId) {
      const { id } = await apiService.createCustomer(cliente);
      clientId = id;
    } else {
      await apiService.updateCustomer(clientId, cliente);
    }

    // Save or update destination
    let destId = destino.id;
    const destinoPayload = {
      ...destino,
      cliente_id: clientId
    };

    if (!destId) {
      try {
        const newDestino = await apiService.createDestination(destinoPayload);
        destId = newDestino.id;
      } catch (error) {
        console.error('Error creating destination:', error);
        throw new Error('Failed to create destination. Please try again.');
      }
    } else {
      await updateDestinationWithRetry(destId, destinoPayload);
    }

    // Get the temporary ID from localStorage
    const tempCotizacionId = localStorage.getItem('current_cotizacion_id');

    // Update quotation status if needed
    if (tempCotizacionId) {
      await updateQuotationStatus(tempCotizacionId, shippingData);
    }

    // Extract data based on shipping option
    let externalLabelData = undefined;
    let externalCost = undefined;
    let selectedManuableService = undefined;
    let manuableLabelData = undefined;

    if (shippingData.selectedOption === 'external') {
      externalLabelData = shippingData.externalLabelData;
      externalCost = shippingData.externalCost;
    } else if (shippingData.selectedOption === 'manuable') {
      selectedManuableService = shippingData.selectedManuableService;
      if (shippingData.labelData) {
        manuableLabelData = {
          tracking_number: shippingData.labelData.tracking_number,
          label_url: shippingData.labelData.label_url,
          price: shippingData.labelData.price
        };
      }
    }

    let empaqueCharge = 0;
  let seguroCharge = 0;
  let recoleccionCharge = 0;
  let reexpedicionCharge = 0;

  if (originalCotizadorState) {
    // Calculate empaque charge
    switch (originalCotizadorState.packagingOption) {
      case 'EMP00': empaqueCharge = 0; break;
      case 'EMP01': empaqueCharge = 10; break;
      case 'EMP02': empaqueCharge = 25; break;
      case 'EMP03': empaqueCharge = 70; break;
      case 'EMP04': empaqueCharge = 170; break;
      case 'EMP05': empaqueCharge = originalCotizadorState.customPackagingPrice || 0; break;
    }

    // Calculate seguro charge
    if (originalCotizadorState.insurance && originalCotizadorState.insuranceValue) {
      seguroCharge = parseFloat(originalCotizadorState.insuranceValue) * 0.0175;
    }

    // Calculate recoleccion charge
    if (originalCotizadorState.collectionRequired) {
      recoleccionCharge = originalCotizadorState.collectionPrice || 100;
    }
  }

  let finalDiscountData = discountData;
  
  // If no discount data passed from parent, try to get it from the quotation state
  if (!finalDiscountData && originalCotizadorState?.discount) {
    finalDiscountData = originalCotizadorState.discount;
  }

    // Create shipment data
    const shipmentData = createShipmentData(
      clientId,
      destId,
      selectedService,
      contenido,
      shippingData.selectedOption,
      externalLabelData,
      externalCost,
      selectedManuableService,
      tempCotizacionId || '',
      manuableLabelData,
      empaqueCharge,
      seguroCharge,
      recoleccionCharge,
      reexpedicionCharge 
    );

    // Create the shipment with options
    const shipmentOptions: { labelFile?: File } = {};
    if (shippingData.selectedOption === 'external' && externalLabelData?.labelFile) {
      shipmentOptions.labelFile = externalLabelData.labelFile;
    }

    // Create the shipment
    const { id: shipmentId } = await apiService.createShipment(shipmentData, shipmentOptions);

    // Clear the temporary quotation ID
    localStorage.removeItem('current_cotizacion_id');

    return { clienteId: clientId, destinoId: destId, shipmentId };
  }

  async function updateQuotationStatus(tempCotizacionId: string, shippingData: any) {
    if (shippingData.selectedOption === 'external') {
      try {
        await apiService.updateQuotationStatus({
          temp_id: tempCotizacionId,
          status_update: 'external_selected',
          carrier: shippingData.externalLabelData.carrier,
          tracking_number: shippingData.externalLabelData.trackingNumber,
          service_id: selectedService.sku,
          price: shippingData.externalCost ?? undefined
        });
      } catch (updateError) {
        console.error("Error updating quotation status:", updateError);
      }
    } else if (shippingData.selectedOption === 'manuable' && shippingData.labelData) {
      try {
        await apiService.updateQuotationStatus({
          temp_id: tempCotizacionId,
          status_update: 'manuable_label_generated',
          service_id: shippingData.selectedManuableService.uuid,
          carrier: shippingData.selectedManuableService.carrier,
          service_name: shippingData.selectedManuableService.service,
          tracking_number: shippingData.labelData.tracking_number,
          label_url: shippingData.labelData.label_url,
          price: parseFloat(shippingData.labelData.price)
        });
      } catch (updateError) {
        console.error("Error updating quotation status:", updateError);
      }
    }
  }

  // **NEW: Add a manual retry function for users**
  const handleRetryDataLoad = () => {
    setErrorMessage(null);
    loadedIdsRef.current = { clienteId: null, destinoId: null }; // Reset loaded IDs
    debouncedLoadExistingData();
  };

  // Render component based on current step
  return (
    <div className="w-full">
      {/* Loading Overlay */}
      {(isLoading || isGeneratingNewQuote) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">
              {isGeneratingNewQuote ? 'Generando nueva cotización...' : 'Procesando envío...'}
            </span>
          </div>
        </div>
      )}

      {step === 'form' ? (
        <div className="space-y-6">
          {/* Error Message with Retry Option */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <AlertDescription className="flex justify-between items-center">
                  <span>{errorMessage}</span>
                  {errorMessage.includes('cargar los datos') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryDataLoad}
                      className="ml-4"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reintentar
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* ZIP Validation Warning - Enhanced */}
          {needsNewQuote && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4"
            >
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    Códigos postales no coinciden con la cotización
                  </h3>
                  <div className="text-sm text-yellow-700 space-y-2">
                    {!zipValidation.originValid && (
                      <p>• Código postal de origen: {cliente?.codigo_postal} (cotización original: {originalOriginZip})</p>
                    )}
                    {!zipValidation.destValid && (
                      <p>• Código postal de destino: {destino?.codigo_postal} (cotización original: {originalDestZip})</p>
                    )}
                  </div>
                  <p className="text-sm text-yellow-700 mt-3">
                    Los precios de envío pueden variar según los códigos postales. 
                    Es necesario generar una nueva cotización con los códigos postales actualizados.
                  </p>
                  <Button
                    onClick={handleGenerateNewQuote}
                    className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white"
                    disabled={!cliente || !destino}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generar Nueva Cotización
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Data Display */}
          <EnvioDataDisplay
            cliente={cliente}
            destino={destino}
            onUpdateCliente={handleUpdateCliente}
            onUpdateDestino={handleUpdateDestino}
            onRemoveCliente={handleRemoveCliente}
            onRemoveDestino={handleRemoveDestino}
            clienteId={currentClienteId} // Use current tracked ID
            contenido={contenido}
            onUpdateContenido={handleUpdateContenido}
            zipValidation={zipValidation}
            originZip={originalOriginZip} // Pass original ZIP for display
            destZip={originalDestZip} // Pass original ZIP for display
          />

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Regresar a cotización
            </Button>
            
            <Button
              onClick={handleContinueToConfirmation}
              disabled={!isFormValid() || needsNewQuote}
              className={`flex items-center ${
                (!isFormValid() || needsNewQuote) ? 'opacity-50' : ''
              }`}
            >
              {needsNewQuote ? (
                <>
                  Generar nueva cotización primero
                  <AlertTriangle className="h-4 w-4 ml-2" />
                </>
              ) : isFormValid() ? (
                <>
                  Continuar a confirmación
                  <Check className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Completar información
                  <AlertTriangle className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Confirmation View */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <EnvioConfirmation
              cliente={cliente!}
              destino={destino!}
              selectedService={selectedService}
              onBack={handleBackToForm}
              contenido={contenido}
            />
          </div>

          {/* Single Action Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => setShowShippingModal(true)}
              className="px-8 py-3 text-lg"
            >
              Finalizar y Confirmar Envío
              <CheckCircle2 className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Shipping Options Modal */}
      <ShippingOptionsModal
        isOpen={showShippingModal}
        onClose={() => setShowShippingModal(false)}
        onSubmit={handleShippingModalSubmit}
        originZip={originZip}
        destZip={destZip}
        packageDetails={{
          ...packageDetails,
          content: contenido
        }}
        cliente={cliente!}
        destino={destino!}
      />
    </div>
  );
}