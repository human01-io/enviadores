import React from 'react';
import { EstafetaResult } from './utils/cotizadorTypes';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, X, ExternalLink, Flag, Calendar, Info, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/CardComponent';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { Badge } from '../ui/BadgeComponent';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { Separator } from '../ui/SeparatorComponent';

interface DeliveryInfoDisplayProps {
  estafetaResult: EstafetaResult | null;
  loadingEstafeta: boolean;
  validateThreeTimes: () => void;
  handleReport: () => void;
  reportSubmitted: boolean;
  onContinue?: () => void;
}

export const DeliveryInfoDisplay: React.FC<DeliveryInfoDisplayProps> = ({
  estafetaResult,
  loadingEstafeta,
  validateThreeTimes,
  handleReport,
  reportSubmitted,
  onContinue
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const renderEstafetaDeliveryDays = (deliveryDays: { [key: string]: boolean } | undefined) => {
    if (!deliveryDays) return null;

    const days = [
      { name: 'Lunes', key: 'lunes' },
      { name: 'Martes', key: 'martes' },
      { name: 'Miercoles', key: 'miercoles' },
      { name: 'Jueves', key: 'jueves' },
      { name: 'Viernes', key: 'viernes' },
      { name: 'Sábado', key: 's&#225;bado' },
      { name: 'Domingo', key: 'domingo' }
    ];

    return (
      <div className="mt-3">
        <div className="flex items-center mb-2">
          <Calendar className="h-4 w-4 mr-2 text-blue-600" />
          <h4 className="text-sm font-medium">Días de entrega disponibles:</h4>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {days.map(day => (
            <TooltipProvider key={day.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={deliveryDays[day.key] ? "default" : "outline"}
                    className={`px-2.5 py-1 ${
                      deliveryDays[day.key]
                        ? 'bg-green-100 hover:bg-green-200 text-green-800 border-green-200'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-500 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      {deliveryDays[day.key] ? (
                        <Check className="w-3 h-3 mr-1 text-green-500" />
                      ) : (
                        <X className="w-3 h-3 mr-1 text-gray-400" />
                      )}
                      {day.name}
                    </div>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {deliveryDays[day.key] 
                    ? `Disponible para entrega en ${day.name}` 
                    : `No disponible para entrega en ${day.name}`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    );
  };

  if (loadingEstafeta) {
    return (
      <motion.div 
        className="flex items-center justify-center p-6 bg-blue-50 rounded-lg border border-blue-100 shadow-sm"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Loader2 className="animate-spin h-5 w-5 text-blue-500 mr-2" />
        <span className="text-blue-600 font-medium">Consultando información de entrega...</span>
      </motion.div>
    );
  }

  if (!estafetaResult) {
    return (
      <motion.div 
        className="p-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg shadow-sm"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="flex items-start">
          <Info className="h-5 w-5 mr-2 text-yellow-500 mt-0.5" />
          <div>
            <p className="font-medium">Información de entrega</p>
            <p className="text-sm mt-1">Al validar los códigos postales se mostrará la información de entrega.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card>
        <CardHeader className="pb-2 bg-blue-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base text-blue-700 flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Información de Entrega
            </CardTitle>
            <Button
              variant="ghost" 
              size="sm"
              onClick={validateThreeTimes}
              className="h-8 text-xs text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Validar en Estafeta
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Cost Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Costo de Reexpedición:</p>
              <div className={`text-sm font-medium flex items-center ${estafetaResult.reexpe === 'No' ? 'text-green-600' : 'text-blue-600'}`}>
                {estafetaResult.reexpe === 'No' ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Sin costo adicional
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {estafetaResult.reexpe}
                  </>
                )}
              </div>
            </div>

            {/* Ocurre Forzoso Information */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Ocurre Forzoso:</p>
              <div className={`text-sm font-medium flex items-center ${estafetaResult.ocurreForzoso === 'No' ? 'text-green-600' : 'text-yellow-600'}`}>
                {estafetaResult.ocurreForzoso === 'No' ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    No requerido
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4 mr-1" />
                    {estafetaResult.ocurreForzoso || 'Requerido'}
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {estafetaResult.ocurreForzoso === 'No'
                  ? 'No se requiere recolección en sucursal'
                  : 'Se requiere recolección en sucursal'}
              </p>
            </div>
          </div>

          {/* Delivery Days */}
          {renderEstafetaDeliveryDays(estafetaResult.estafetaDeliveryDays)}
        </CardContent>
        
        {estafetaResult.error && (
  <CardFooter className="pt-0">
    <Alert variant="destructive" className="w-full">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error de validación</AlertTitle>
      <AlertDescription>
        {estafetaResult.error}
      </AlertDescription>
    </Alert>
  </CardFooter>
)}
      </Card>
      
      <div className="flex justify-between items-center">
        <Button
          onClick={handleReport}
          disabled={reportSubmitted}
          variant="outline"
          size="sm"
          className={`flex items-center ${
            reportSubmitted
              ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {reportSubmitted ? (
            <>
              <Check className="h-4 w-4 mr-1 text-green-500" />
              ¡Reporte Enviado!
            </>
          ) : (
            <>
              <Flag className="h-4 w-4 mr-1" />
              Reportar Información Desactualizada
            </>
          )}
        </Button>

        {onContinue && (
          <Button
  onClick={onContinue}
  size="sm"
  className="fixed bottom-10 right-10 flex items-center bg-blue-600 hover:bg-blue-700 text-white z-50"
>
  Continuar a Paquete
  <ArrowRight className="h-4 w-4 ml-1" />
</Button>
        )}
      </div>
    </motion.div>
  );
};