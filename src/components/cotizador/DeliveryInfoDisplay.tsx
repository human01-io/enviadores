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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const renderEstafetaDeliveryDays = (deliveryDays: { [key: string]: boolean } | undefined) => {
    if (!deliveryDays) return null;

    const days = [
      { name: 'Lun', key: 'lunes', full: 'Lunes' },
      { name: 'Mar', key: 'martes', full: 'Martes' },
      { name: 'Mié', key: 'miercoles', full: 'Miércoles' },
      { name: 'Jue', key: 'jueves', full: 'Jueves' },
      { name: 'Vie', key: 'viernes', full: 'Viernes' },
      { name: 'Sáb', key: 's&#225;bado', full: 'Sábado' },
      { name: 'Dom', key: 'domingo', full: 'Domingo' }
    ];

    return (
      <motion.div variants={itemVariants}>
        <Card className="border hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1 bg-blue-100 rounded">
                <Calendar className="h-3 w-3 text-blue-600" />
              </div>
              Días de Entrega Disponibles
            </CardTitle>
            <CardDescription className="text-xs">
              Días de la semana en que se realizan entregas en esta zona
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map(day => (
                <TooltipProvider key={day.key}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`
                        p-2 rounded text-center transition-all cursor-default border
                        ${deliveryDays[day.key]
                          ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }
                      `}>
                        <div className="flex flex-col items-center gap-0.5">
                          {deliveryDays[day.key] ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <X className="w-3 h-3 text-gray-400" />
                          )}
                          <span className="text-xs font-medium">{day.name}</span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{day.full}: {deliveryDays[day.key] 
                        ? 'Disponible para entrega' 
                        : 'No disponible para entrega'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loadingEstafeta) {
    return (
      <motion.div 
        className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-100"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="text-center space-y-2">
          <Loader2 className="animate-spin h-6 w-6 text-blue-500 mx-auto" />
          <div>
            <p className="text-blue-700 font-medium text-sm">Consultando información</p>
            <p className="text-blue-600 text-xs">Validando códigos postales...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!estafetaResult) {
    return (
      <motion.div 
        className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="flex items-start gap-2">
          <div className="p-1.5 bg-yellow-100 rounded-lg">
            <Info className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-yellow-800 mb-1 text-sm">
              Información pendiente
            </h3>
            <p className="text-yellow-700 text-xs mb-3">
              Al validar los códigos postales se mostrará la información detallada de entrega.
            </p>
            <Button
              onClick={validateThreeTimes}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              size="sm"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Validar Códigos Postales
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

return (
    <motion.div 
      className="contents"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Main Information Cards Only */}
      {!estafetaResult ? (
        <div className="md:col-span-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-yellow-100 rounded-lg">
              <Info className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-yellow-800 mb-1 text-sm">
                Información pendiente
              </h3>
              <p className="text-yellow-700 text-xs mb-3">
                Al validar los códigos postales se mostrará la información detallada de entrega.
              </p>
              <Button
                onClick={validateThreeTimes}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                size="sm"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Validar Códigos Postales
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Reexpedition Cost Card */}
          <motion.div variants={itemVariants}>
            <Card className="border hover:shadow-md transition-all duration-200 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {estafetaResult.reexpe === 'No' ? (
                    <div className="p-1 bg-green-100 rounded">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-1 bg-orange-100 rounded">
                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                    </div>
                  )}
                  Costo de Reexpedición
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`text-base font-semibold mb-1 ${
                  estafetaResult.reexpe === 'No' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {estafetaResult.reexpe === 'No' ? 'Sin costo adicional' : estafetaResult.reexpe}
                </div>
                <p className="text-xs text-gray-600">
                  {estafetaResult.reexpe === 'No' 
                    ? 'No se aplicarán cargos por reenvío'
                    : 'Se aplicarán cargos por reenvío'
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Forced Pickup Card */}
          <motion.div variants={itemVariants}>
            <Card className="border hover:shadow-md transition-all duration-200 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {estafetaResult.ocurreForzoso === 'No' ? (
                    <div className="p-1 bg-green-100 rounded">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-1 bg-yellow-100 rounded">
                      <Flag className="h-3 w-3 text-yellow-600" />
                    </div>
                  )}
                  Ocurre Forzoso
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`text-base font-semibold mb-1 ${
                  estafetaResult.ocurreForzoso === 'No' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {estafetaResult.ocurreForzoso === 'No' ? 'No requerido' : 'Requerido'}
                </div>
                <p className="text-xs text-gray-600">
                  {estafetaResult.ocurreForzoso === 'No'
                    ? 'Entrega directa al domicilio'
                    : 'Recolección en sucursal necesaria'
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* Delivery Days Section - Full Width */}
      {estafetaResult?.estafetaDeliveryDays && (
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="border hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="p-1 bg-blue-100 rounded">
                  <Calendar className="h-3 w-3 text-blue-600" />
                </div>
                Días de Entrega Disponibles
              </CardTitle>
              <CardDescription className="text-xs">
                Días de la semana en que se realizan entregas en esta zona
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1.5">
                {[
                  { name: 'Lun', key: 'lunes', full: 'Lunes' },
                  { name: 'Mar', key: 'martes', full: 'Martes' },
                  { name: 'Mié', key: 'miercoles', full: 'Miércoles' },
                  { name: 'Jue', key: 'jueves', full: 'Jueves' },
                  { name: 'Vie', key: 'viernes', full: 'Viernes' },
                  { name: 'Sáb', key: 's&#225;bado', full: 'Sábado' },
                  { name: 'Dom', key: 'domingo', full: 'Domingo' }
                ].map(day => (
                  <TooltipProvider key={day.key}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`
                          p-2 rounded text-center transition-all cursor-default border
                          ${estafetaResult.estafetaDeliveryDays?.[day.key]
                            ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                          }
                        `}>
                          <div className="flex flex-col items-center gap-0.5">
                            {estafetaResult.estafetaDeliveryDays?.[day.key] ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <X className="w-3 h-3 text-gray-400" />
                            )}
                            <span className="text-xs font-medium">{day.name}</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{day.full}: {estafetaResult.estafetaDeliveryDays?.[day.key] 
                          ? 'Disponible para entrega' 
                          : 'No disponible para entrega'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error Alert */}
      {estafetaResult?.error && (
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Alert variant="destructive" className="border">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-sm">Error de validación</AlertTitle>
            <AlertDescription className="text-xs">
              {estafetaResult.error}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Action Buttons */}
      {estafetaResult && (
        <motion.div variants={itemVariants} className="md:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1">
            <Button
              onClick={validateThreeTimes}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 w-full sm:w-auto text-xs"
            >
              <ExternalLink className="h-3 w-3" />
              Revalidar Información
            </Button>
            
            <Button
              onClick={handleReport}
              disabled={reportSubmitted}
              variant="outline"
              size="sm"
              className={`flex items-center gap-1 w-full sm:w-auto text-xs ${
                reportSubmitted
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  : 'hover:bg-gray-50'
              }`}
            >
              {reportSubmitted ? (
                <>
                  <Check className="h-3 w-3 text-green-600" />
                  ¡Enviado!
                </>
              ) : (
                <>
                  <Flag className="h-3 w-3" />
                  Reportar Problema
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};