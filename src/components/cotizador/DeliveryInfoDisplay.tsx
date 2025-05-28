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
}

export const DeliveryInfoDisplay: React.FC<DeliveryInfoDisplayProps> = ({
  estafetaResult,
  loadingEstafeta,
  validateThreeTimes,
  handleReport,
  reportSubmitted,
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
  };

  const renderEstafetaDeliveryDays = (deliveryDays: { [key: string]: boolean } | undefined) => {
    if (!deliveryDays) return null;

    const days = [
      { name: 'Lun', key: 'lunes' },
      { name: 'Mar', key: 'martes' },
      { name: 'Mie', key: 'miercoles' },
      { name: 'Jue', key: 'jueves' },
      { name: 'Vie', key: 'viernes' },
      { name: 'Sab', key: 's&#225;bado' },
      { name: 'Dom', key: 'domingo' }
    ];

    return (
      <div className="mt-2">
        <div className="flex items-center mb-1.5">
          <Calendar className="h-3 w-3 mr-1 text-blue-600" />
          <h4 className="text-xs font-medium">Días de entrega:</h4>
        </div>
        <div className="flex flex-wrap gap-1">
          {days.map(day => (
            <TooltipProvider key={day.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={deliveryDays[day.key] ? "default" : "outline"}
                    className={`px-1.5 py-0.5 text-xs ${
                      deliveryDays[day.key]
                        ? 'bg-green-100 hover:bg-green-200 text-green-800 border-green-200'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-500 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      {deliveryDays[day.key] ? (
                        <Check className="w-2 h-2 mr-0.5 text-green-500" />
                      ) : (
                        <X className="w-2 h-2 mr-0.5 text-gray-400" />
                      )}
                      {day.name}
                    </div>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {deliveryDays[day.key] 
                    ? `Disponible para entrega` 
                    : `No disponible para entrega`}
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
        className="flex items-center justify-center p-3 bg-blue-50 rounded border border-blue-100 shadow-sm"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Loader2 className="animate-spin h-3 w-3 text-blue-500 mr-2" />
        <span className="text-blue-600 font-medium text-xs">Consultando información...</span>
      </motion.div>
    );
  }

  if (!estafetaResult) {
    return (
      <motion.div 
        className="p-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded shadow-sm"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="flex items-start">
          <Info className="h-3 w-3 mr-2 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-xs">Información de entrega</p>
            <p className="text-xs mt-0.5">Al validar los códigos postales se mostrará la información.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="shadow-sm">
        <CardHeader className="pb-1 bg-blue-50 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm text-blue-700 flex items-center">
              <Info className="h-3 w-3 mr-1" />
              Información de Entrega
            </CardTitle>
            <Button
              variant="ghost" 
              size="sm"
              onClick={validateThreeTimes}
              className="h-6 text-xs text-blue-600 hover:text-blue-800 px-2"
            >
              <ExternalLink className="h-2.5 w-2.5 mr-0.5" />
              Validar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2 pb-2">
          {/* Compact Cost Information */}
          <div className="grid grid-cols-1 gap-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Costo de Reexpedición:</p>
              <div className={`text-xs font-medium flex items-center ${estafetaResult.reexpe === 'No' ? 'text-green-600' : 'text-blue-600'}`}>
                {estafetaResult.reexpe === 'No' ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Sin costo adicional
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {estafetaResult.reexpe}
                  </>
                )}
              </div>
            </div>

            {/* Compact Ocurre Forzoso Information */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Ocurre Forzoso:</p>
              <div className={`text-xs font-medium flex items-center ${estafetaResult.ocurreForzoso === 'No' ? 'text-green-600' : 'text-yellow-600'}`}>
                {estafetaResult.ocurreForzoso === 'No' ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    No requerido
                  </>
                ) : (
                  <>
                    <Flag className="h-3 w-3 mr-1" />
                    {estafetaResult.ocurreForzoso || 'Requerido'}
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {estafetaResult.ocurreForzoso === 'No'
                  ? 'No se requiere recolección en sucursal'
                  : 'Se requiere recolección en sucursal'}
              </p>
            </div>
          </div>

          {/* Compact Delivery Days */}
          {renderEstafetaDeliveryDays(estafetaResult.estafetaDeliveryDays)}
        </CardContent>
        
        {estafetaResult.error && (
          <CardFooter className="pt-0 pb-2">
            <Alert variant="destructive" className="w-full">
              <AlertTriangle className="h-3 w-3" />
              <AlertTitle className="text-xs">Error de validación</AlertTitle>
              <AlertDescription className="text-xs">
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
          className={`flex items-center text-xs h-7 px-2 ${
            reportSubmitted
              ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {reportSubmitted ? (
            <>
              <Check className="h-3 w-3 mr-1 text-green-500" />
              ¡Enviado!
            </>
          ) : (
            <>
              <Flag className="h-3 w-3 mr-1" />
              Reportar
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};