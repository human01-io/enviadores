
import React from 'react';
import { ServicioCotizado, DetallesCotizacion } from './utils/cotizadorTypes';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Package, 
  ShoppingBag,
  Truck,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/CardComponent';
import { Badge } from '../ui/BadgeComponent';
import { Separator } from '../ui/SeparatorComponent';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { ScrollArea } from '../ui/ScrollAreaComponent';

interface QuoteResultsSectionProps {
  servicios: ServicioCotizado[];
  detallesCotizacion: DetallesCotizacion | null;
  selectedService: ServicioCotizado | null;
  setSelectedService: (service: ServicioCotizado | null) => void;
  proceedToCustomerData: () => void;
  originalWeight: string;
}

export const QuoteResultsSection: React.FC<QuoteResultsSectionProps> = ({
  servicios,
  detallesCotizacion,
  selectedService,
  setSelectedService,
  proceedToCustomerData,
  originalWeight
}) => {
  if (!servicios || !detallesCotizacion) {
    return null;
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.3 }
    })
  };

  // Format numbers with comma separators
  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-MX', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Calculate additional charges total
  const additionalChargesTotal = 
    detallesCotizacion.empaque + 
    detallesCotizacion.seguro + 
    detallesCotizacion.recoleccion + 
    detallesCotizacion.reexpedicion;

  // These functions are no longer needed since the hook now provides correct values
  // const getFullSubtotal = (servicio: ServicioCotizado) => {
  //   return servicio.precioBase + servicio.cargoSobrepeso + additionalChargesTotal;
  // };

  // const getFullTotal = (servicio: ServicioCotizado) => {
  //   const fullSubtotal = getFullSubtotal(servicio);
  //   // Assuming IVA is 16% for Mexico
  //   const ivaRate = 0.16;
  //   return fullSubtotal * (1 + ivaRate);
  // };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Servicios Disponibles</h2>
          <p className="text-sm text-gray-500">Seleccione un servicio para continuar con su envío</p>
        </div>
        
        {detallesCotizacion.reexpedicion > 0 && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 px-2 py-1">
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Precio estándar de reexpedición aplicado
          </Badge>
        )}
      </div>

      {/* Desktop table view */}
      <Card className="hidden md:block overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[200px]">Servicio</TableHead>
                <TableHead>Precio Base</TableHead>
                <TableHead>Cargo Sobrepeso</TableHead>
                <TableHead>Cargos Adicionales</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Total (con IVA)</TableHead>
                <TableHead>Tiempo</TableHead>
                <TableHead className="text-right">Seleccionar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicios.map((servicio, index) => (
                <TableRow 
                  key={servicio.sku}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedService?.sku === servicio.sku ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => setSelectedService(servicio)}
                >
                  <TableCell className="font-medium">{servicio.nombre}</TableCell>
                  <TableCell>${formatCurrency(servicio.precioBase)}</TableCell>
                  <TableCell className={servicio.cargoSobrepeso > 0 ? 'font-medium text-amber-600' : ''}>
                    ${formatCurrency(servicio.cargoSobrepeso)}
                  </TableCell>
                  <TableCell className="font-medium text-blue-600">
                    ${formatCurrency(additionalChargesTotal)}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${formatCurrency(servicio.precioTotal)}
                  </TableCell>
                  <TableCell className="font-medium text-blue-700">
                    ${formatCurrency(servicio.precioConIva)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-gray-100">
                      <Clock className="h-3 w-3 mr-1" />
                      {servicio.diasEstimados} día{servicio.diasEstimados !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant={selectedService?.sku === servicio.sku ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSelectedService(servicio)}
                    >
                      {selectedService?.sku === servicio.sku ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Seleccionado
                        </>
                      ) : (
                        'Seleccionar'
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {servicios.map((servicio, index) => (
          <motion.div
            key={servicio.sku}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={itemVariants}
          >
            <Card 
              className={`border-2 overflow-hidden transition-all ${
                selectedService?.sku === servicio.sku
                  ? 'border-blue-500 shadow-md bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow'
              }`}
              onClick={() => setSelectedService(servicio)}
            >
              <CardHeader className="p-3 pb-0 flex flex-row justify-between items-center space-y-0">
                <div>
                  <CardTitle className="text-base">{servicio.nombre}</CardTitle>
                  <Badge variant="outline" className="bg-gray-100 mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {servicio.diasEstimados} día{servicio.diasEstimados !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <Badge className="text-lg font-semibold bg-blue-100 text-blue-700 border-blue-200 px-3 py-1">
                  ${formatCurrency(servicio.precioConIva)}
                </Badge>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Precio Base:</span>
                    <p className="font-medium">${formatCurrency(servicio.precioBase)}</p>
                  </div>
                  {servicio.cargoSobrepeso > 0 && (
                    <div>
                      <span className="text-gray-500">Cargo Sobrepeso:</span>
                      <p className="font-medium text-amber-600">${formatCurrency(servicio.cargoSobrepeso)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Cargos Adicionales:</span>
                    <p className="font-medium text-blue-600">${formatCurrency(additionalChargesTotal)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Subtotal:</span>
                    <p className="font-medium">${formatCurrency(servicio.precioTotal)}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-3 pt-0 flex justify-end">
                <Button 
                  variant={selectedService?.sku === servicio.sku ? "default" : "outline"} 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedService(servicio);
                  }}
                >
                  {selectedService?.sku === servicio.sku ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Seleccionado
                    </>
                  ) : (
                    'Seleccionar'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Mobile-only scroll indicator */}
<div className="md:hidden mt-6 mb-8 text-center">
  <motion.div
    className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex flex-col items-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
  >
    <p className="text-sm text-blue-700 font-medium flex items-center mb-2">
      <Info className="h-4 w-4 mr-1.5" />
      Deslice hacia abajo para ver más información
    </p>
    <motion.div
      animate={{ y: [0, 6, 0] }}
      transition={{ repeat: Infinity, duration: 1.2 }}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-6 w-6 text-blue-500" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M19 13l-7 7-7-7m14-8l-7 7-7-7" 
        />
      </svg>
    </motion.div>
  </motion.div>
</div>

      {/* Weight and Additional Charges in the same row */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
  {/* Weight and Overweight Breakdown */}
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center">
        <TrendingUp className="h-5 w-5 mr-2 text-amber-600" />
        <CardTitle className="text-base">Detalles de Peso y Sobrepeso</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Peso Real:</p>
          <p className="text-base font-medium">
            <Package className="h-3.5 w-3.5 inline mr-1 text-amber-600" />
            {parseFloat(originalWeight).toFixed(2)} kg
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Peso Volumétrico:</p>
          <p className="text-base font-medium">
            <Package className="h-3.5 w-3.5 inline mr-1 text-amber-600" />
            {detallesCotizacion.pesoVolumetrico} kg
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 bg-amber-50 border-amber-200">
          <p className="text-xs text-gray-500 mb-1">Peso Facturable:</p>
          <p className="text-base font-medium text-amber-700">
            <Package className="h-3.5 w-3.5 inline mr-1 text-amber-600" />
            {detallesCotizacion.pesoFacturable} kg
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {detallesCotizacion.pesoFacturable > detallesCotizacion.pesoTotal
              ? "Se factura según peso volumétrico" 
              : "Se factura según peso real"}
          </p>
        </div>
      </div>
      
      {servicios.some(s => s.cargoSobrepeso > 0) && (
        <>
          <div className="my-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
              <p className="text-sm font-medium text-amber-800">Información de Sobrepeso</p>
            </div>
            <p className="text-xs text-amber-700">
              Se aplica cargo por sobrepeso cuando el peso facturable excede el límite básico del servicio. 
              El cargo varía según el servicio y el excedente de peso.
            </p>
          </div>
          
          {selectedService?.cargoSobrepeso > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 mb-1">
                <strong>Cargo por sobrepeso para {selectedService.nombre}:</strong>
              </p>
              <p className="text-base font-bold text-amber-700">
                <DollarSign className="h-4 w-4 inline mr-1" />
                {formatCurrency(selectedService.cargoSobrepeso)}
              </p>
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>

  {/* Additional charges summary */}
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center">
        <ShoppingBag className="h-5 w-5 mr-2 text-blue-600" />
        <CardTitle className="text-base">Cargos adicionales</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Empaque:</p>
          <p className="text-base font-medium">
            <DollarSign className="h-3.5 w-3.5 inline mr-1 text-blue-600" />
            {formatCurrency(detallesCotizacion.empaque)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Seguro:</p>
          <p className="text-base font-medium">
            <DollarSign className="h-3.5 w-3.5 inline mr-1 text-blue-600" />
            {formatCurrency(detallesCotizacion.seguro)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Recolección:</p>
          <p className="text-base font-medium">
            <DollarSign className="h-3.5 w-3.5 inline mr-1 text-blue-600" />
            {formatCurrency(detallesCotizacion.recoleccion)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Reexpedición:</p>
          <p className="text-base font-medium">
            <DollarSign className="h-3.5 w-3.5 inline mr-1 text-blue-600" />
            {formatCurrency(detallesCotizacion.reexpedicion)}
          </p>
        </div>
      </div>
      {additionalChargesTotal > 0 && (
        <div className="mt-4 flex justify-end">
          <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-200">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            Total cargos adicionales: ${formatCurrency(additionalChargesTotal)}
          </Badge>
        </div>
      )}
    </CardContent>
  </Card>
</div>

      {/* Continue button - fixed to the bottom of the screen */}
<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
  <div className="container mx-auto max-w-5xl">
    {selectedService ? (
      <motion.div className="relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Animated arrow to highlight the continue button */}
        <motion.div 
          className="absolute -top-8 right-6 text-green-500 hidden md:block"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
        
        <Button
          onClick={proceedToCustomerData}
          className="text-white w-full px-4 py-3 gap-2 bg-green-600 hover:bg-green-700 h-12"
        >
          Continuar con {selectedService.nombre}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </motion.div>
    ) : (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
        <p className="text-sm text-yellow-700 flex items-center justify-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Seleccione un servicio para continuar
        </p>
      </div>
    )}
  </div>
</div>

{/* Add extra space at the bottom to prevent content from being hidden by the fixed button */}
<div className="h-20 md:h-24"></div>
    </motion.div>
  );
};