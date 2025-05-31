import React, { useState, useEffect } from 'react';
import { ServicioCotizado, DetallesCotizacion, CotizadorState } from './utils/cotizadorTypes';
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
  Info,
  Box,
  Shield,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/CardComponent';
import { Badge } from '../ui/BadgeComponent';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Checkbox } from '../ui/Checkbox';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/SelectComponent';
import { Input } from '../ui/Input';

interface QuoteResultsSectionProps {
  servicios: ServicioCotizado[];
  detallesCotizacion: DetallesCotizacion | null;
  selectedService: ServicioCotizado | null;
  setSelectedService: (service: ServicioCotizado | null) => void;
  proceedToCustomerData: () => void;
  originalWeight: string;
  state: CotizadorState;
  updateField: (field: keyof CotizadorState, value: any) => void;
  additionalChargesChanged?: boolean;
  onReQuote?: () => void;
}

export const QuoteResultsSection: React.FC<QuoteResultsSectionProps> = ({
  servicios,
  detallesCotizacion,
  selectedService,
  setSelectedService,
  proceedToCustomerData,
  originalWeight,
  state,
  updateField,
  additionalChargesChanged = false,
  onReQuote
}) => {
  const [localAdditionalCharges, setLocalAdditionalCharges] = useState({
    empaque: 0,
    seguro: 0,
    recoleccion: 0
  });

  // Calculate local additional charges when state changes
  useEffect(() => {
    let empaqueCharge = 0;
    switch (state.packagingOption) {
      case 'EMP00': empaqueCharge = 0; break;
      case 'EMP01': empaqueCharge = 10; break;
      case 'EMP02': empaqueCharge = 25; break;
      case 'EMP03': empaqueCharge = 70; break;
      case 'EMP04': empaqueCharge = 170; break;
      case 'EMP05': empaqueCharge = state.customPackagingPrice || 0; break;
    }

    const seguroCharge = state.insurance && state.insuranceValue 
      ? parseFloat(state.insuranceValue) * 0.0175 
      : 0;

    const recoleccionCharge = state.collectionRequired 
      ? (state.collectionPrice || 100) // Default collection price if not specified
      : 0;

    setLocalAdditionalCharges({
      empaque: empaqueCharge,
      seguro: seguroCharge,
      recoleccion: recoleccionCharge
    });
  }, [state.packagingOption, state.customPackagingPrice, state.insurance, state.insuranceValue, state.collectionRequired, state.collectionPrice]);

  // Calculate total additional charges (from server + local changes)
  const calculateTotalAdditionalCharges = () => {
    if (!detallesCotizacion) return 0;
    
    // If there are local changes, use local calculations, otherwise use server values
    const empaque = additionalChargesChanged ? localAdditionalCharges.empaque : detallesCotizacion.empaque;
    const seguro = additionalChargesChanged ? localAdditionalCharges.seguro : detallesCotizacion.seguro;
    const recoleccion = additionalChargesChanged ? localAdditionalCharges.recoleccion : detallesCotizacion.recoleccion;
    
    return empaque + seguro + recoleccion + detallesCotizacion.reexpedicion;
  };

  // Calculate service prices with local additional charges
  const getServicePriceWithLocalCharges = (servicio: ServicioCotizado) => {
    if (!additionalChargesChanged) {
      return {
        subtotal: servicio.precioTotal,
        total: servicio.precioConIva
      };
    }

    const localChargesTotal = localAdditionalCharges.empaque + localAdditionalCharges.seguro + localAdditionalCharges.recoleccion;
    const subtotal = servicio.precioBase + servicio.cargoSobrepeso + localChargesTotal + detallesCotizacion.reexpedicion;
    const total = subtotal * 1.16; // 16% IVA

    return {
      subtotal,
      total
    };
  };

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

  // Get packaging option label
  const getPackagingOptionLabel = (id: string) => {
    switch (id) {
      case 'EMP00': return 'Sin empaque ($0)';
      case 'EMP01': return 'Sobre ($10)';
      case 'EMP02': return 'Chico ($25)';
      case 'EMP03': return 'Mediano ($70)';
      case 'EMP04': return 'Grande ($170)';
      case 'EMP05': return 'Personalizado';
      default: return id;
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Additional Services Card */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-blue-600" />
                Servicios Adicionales
              </CardTitle>
              <CardDescription>
                Configure los servicios adicionales para su envío
              </CardDescription>
            </div>
            {additionalChargesChanged && (
              <Button
                onClick={onReQuote}
                variant="default"
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recotizar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Packaging Option */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center mb-3">
              <Box className="h-4 w-4 mr-2 text-gray-600" />
              <Label className="text-sm font-medium">Empaque</Label>
            </div>
            <Select
              value={state.packagingOption}
              onValueChange={(value) => updateField('packagingOption', value)}
            >
              <SelectTrigger className={`w-full ${
                state.packagingOption === 'EMP00' ? 'bg-green-50 border-green-300 text-green-800' : ''
              }`}>
                <SelectValue placeholder="Seleccione empaque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMP00">Sin empaque ($0)</SelectItem>
                <SelectItem value="EMP01">Sobre ($10)</SelectItem>
                <SelectItem value="EMP02">Chico ($25)</SelectItem>
                <SelectItem value="EMP03">Mediano ($70)</SelectItem>
                <SelectItem value="EMP04">Grande ($170)</SelectItem>
                <SelectItem value="EMP05">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {state.packagingOption === 'EMP05' && (
              <div className="mt-3">
                <Label htmlFor="customPackagingPrice" className="text-xs font-medium text-gray-500">
                  Precio personalizado
                </Label>
                <Input
                  id="customPackagingPrice"
                  type="number"
                  placeholder="Ingrese precio"
                  value={state.customPackagingPrice || ''}
                  onChange={(e) => updateField('customPackagingPrice', parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Collection Service */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="collectionRequired" 
                checked={state.collectionRequired}
                onCheckedChange={(checked) => updateField('collectionRequired', checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="collectionRequired" className="text-sm cursor-pointer flex items-center">
                  <Truck className="h-3.5 w-3.5 mr-1.5" />
                  Requiere recolección
                </Label>
                <p className="text-xs text-muted-foreground">
                  Servicio de recolección en origen
                </p>
              </div>
            </div>

            {state.collectionRequired && (
              <div className="mt-3">
                <Label className="text-xs font-medium text-gray-500" htmlFor="collectionPrice">
                  Precio de recolección
                </Label>
                <Input
                  id="collectionPrice"
                  type="number"
                  placeholder="Precio estándar"
                  value={state.collectionPrice || ''}
                  onChange={(e) => updateField('collectionPrice', parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Insurance */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="insurance" 
                checked={state.insurance}
                onCheckedChange={(checked) => updateField('insurance', checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="insurance" className="text-sm cursor-pointer flex items-center">
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  Seguro de envío (1.75%)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Protección contra pérdida o daño
                </p>
              </div>
            </div>

            {state.insurance && (
              <div className="mt-3">
                <Label className="text-xs font-medium text-gray-500" htmlFor="insuranceValue">
                  Valor declarado ($)
                </Label>
                <Input
                  id="insuranceValue"
                  type="number"
                  placeholder="Valor del contenido"
                  value={state.insuranceValue}
                  onChange={(e) => updateField('insuranceValue', e.target.value)}
                  min="0"
                  step="0.01"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Prima: ${state.insuranceValue ? (parseFloat(state.insuranceValue) * 0.0175).toFixed(2) : '0.00'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
              {servicios.map((servicio, index) => {
                const prices = getServicePriceWithLocalCharges(servicio);
                const totalAdditionalCharges = calculateTotalAdditionalCharges();
                
                return (
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
                      ${formatCurrency(totalAdditionalCharges)}
                      {additionalChargesChanged && (
                        <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-700 border-orange-300 text-xs">
                          Actualizado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${formatCurrency(prices.subtotal)}
                    </TableCell>
                    <TableCell className="font-medium text-blue-700">
                      ${formatCurrency(prices.total)}
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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {servicios.map((servicio, index) => {
          const prices = getServicePriceWithLocalCharges(servicio);
          const totalAdditionalCharges = calculateTotalAdditionalCharges();
          
          return (
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
                  <div className="text-right">
                    <Badge className="text-lg font-semibold bg-blue-100 text-blue-700 border-blue-200 px-3 py-1">
                      ${formatCurrency(prices.total)}
                    </Badge>
                    {additionalChargesChanged && (
                      <Badge variant="outline" className="mt-1 bg-orange-100 text-orange-700 border-orange-300 text-xs">
                        Actualizado
                      </Badge>
                    )}
                  </div>
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
                      <p className="font-medium text-blue-600">
                        ${formatCurrency(totalAdditionalCharges)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Subtotal:</span>
                      <p className="font-medium">${formatCurrency(prices.subtotal)}</p>
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
          );
        })}
      </div>

      {/* Weight and Additional Charges Summary */}
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
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-blue-600" />
                <CardTitle className="text-base">Resumen de Cargos Adicionales</CardTitle>
              </div>
              {additionalChargesChanged && (
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                  <Info className="h-3 w-3 mr-1" />
                  Pendiente recotizar
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Empaque:</p>
                <p className="text-base font-medium">
                  <DollarSign className="h-3.5 w-3.5 inline mr-1 text-blue-600" />
                  {formatCurrency(additionalChargesChanged ? localAdditionalCharges.empaque : detallesCotizacion.empaque)}
                  {additionalChargesChanged && localAdditionalCharges.empaque !== detallesCotizacion.empaque && (
                    <span className="text-xs text-orange-600 ml-1">
                      (era: ${formatCurrency(detallesCotizacion.empaque)})
                    </span>
                  )}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Seguro:</p>
                <p className="text-base font-medium">
                  <DollarSign className="h-3.5 w-3.5 inline mr-1 text-blue-600" />
                  {formatCurrency(additionalChargesChanged ? localAdditionalCharges.seguro : detallesCotizacion.seguro)}
                  {additionalChargesChanged && localAdditionalCharges.seguro !== detallesCotizacion.seguro && (
                    <span className="text-xs text-orange-600 ml-1">
                      (era: ${formatCurrency(detallesCotizacion.seguro)})
                    </span>
                  )}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Recolección:</p>
                <p className="text-base font-medium">
                  <DollarSign className="h-3.5 w-3.5 inline mr-1 text-blue-600" />
                  {formatCurrency(additionalChargesChanged ? localAdditionalCharges.recoleccion : detallesCotizacion.recoleccion)}
                  {additionalChargesChanged && localAdditionalCharges.recoleccion !== detallesCotizacion.recoleccion && (
                    <span className="text-xs text-orange-600 ml-1">
                      (era: ${formatCurrency(detallesCotizacion.recoleccion)})
                    </span>
                  )}
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
            <div className="mt-4 flex justify-between items-center">
              <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-200">
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Total cargos adicionales: ${formatCurrency(calculateTotalAdditionalCharges())}
              </Badge>
              {additionalChargesChanged && onReQuote && (
                <Button
                  onClick={onReQuote}
                  size="sm"
                  variant="outline"
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Aplicar cambios
                </Button>
              )}
            </div>
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