// src/components/envio/ZipMismatchAlert.tsx
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ZipMismatchAlertProps {
  type: 'origin' | 'destination';
  currentZip: string;
  expectedZip: string;
  onGenerateNewQuote?: () => void;
}

export const ZipMismatchAlert: React.FC<ZipMismatchAlertProps> = ({
  type,
  currentZip,
  expectedZip,
  onGenerateNewQuote
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200"
    >
      <div className="flex items-start">
        <AlertTriangle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-700">
            Código postal no coincide
          </h4>
          <p className="text-xs text-red-600 mt-1">
            CP {type === 'origin' ? 'origen' : 'destino'}: {currentZip} 
            <span className="mx-1">≠</span>
            Cotización: {expectedZip}
          </p>
          {onGenerateNewQuote && (
            <button
              onClick={onGenerateNewQuote}
              className="mt-2 text-xs text-red-700 underline hover:text-red-800"
            >
              Generar nueva cotización
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Also create a combined component for both validations
interface ZipValidationStatusProps {
  originZip: string;
  destZip: string;
  clienteZip?: string;
  destinoZip?: string;
  onGenerateNewQuote?: () => void;
}

export const ZipValidationStatus: React.FC<ZipValidationStatusProps> = ({
  originZip,
  destZip,
  clienteZip,
  destinoZip,
  onGenerateNewQuote
}) => {
  const hasOriginMismatch = clienteZip && clienteZip !== originZip;
  const hasDestMismatch = destinoZip && destinoZip !== destZip;
  
  if (!hasOriginMismatch && !hasDestMismatch) {
    return null;
  }

  return (
    <div className="space-y-2">
      {hasOriginMismatch && (
        <ZipMismatchAlert
          type="origin"
          currentZip={clienteZip}
          expectedZip={originZip}
          onGenerateNewQuote={onGenerateNewQuote}
        />
      )}
      {hasDestMismatch && (
        <ZipMismatchAlert
          type="destination"
          currentZip={destinoZip}
          expectedZip={destZip}
          onGenerateNewQuote={onGenerateNewQuote}
        />
      )}
    </div>
  );
};