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
  RefreshCw,
  Percent,
  Tag,
  Gift
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/CardComponent';
import { Badge } from '../ui/BadgeComponent';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Checkbox } from '../ui/Checkbox';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/SelectComponent';
import { Input } from '../ui/Input';
import { apiService } from '../../services/apiService';
import ProviderCostsView from './ProviderCostsView';

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

interface DiscountState {
  tipo: 'porcentaje' | 'fijo' | 'codigo' | '';
  valor: number;
  codigo: string;
  aplicado: boolean;
  isValidating?: boolean;
  error?: string;
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

  // Discount state
  const [discount, setDiscount] = useState<DiscountState>({
    tipo: '',
    valor: 0,
    codigo: '',
    aplicado: false
  });

  // Track if any changes were made that require requoting
  const [hasChanges, setHasChanges] = useState(false);
  
  // Track original discount state to detect changes
  const [originalDiscountState, setOriginalDiscountState] = useState<DiscountState>({
    tipo: '',
    valor: 0,
    codigo: '',
    aplicado: false
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
      ? (state.collectionPrice || 100)
      : 0;

    const newCharges = {
      empaque: empaqueCharge,
      seguro: seguroCharge,
      recoleccion: recoleccionCharge
    };

    setLocalAdditionalCharges(newCharges);

    // Check if charges have changed from original
    if (detallesCotizacion) {
      const hasChargeChanges = 
        newCharges.empaque !== detallesCotizacion.empaque ||
        newCharges.seguro !== detallesCotizacion.seguro ||
        newCharges.recoleccion !== detallesCotizacion.recoleccion;
      
      // Check if discount has changed from original state
      const hasDiscountChanges = 
        discount.aplicado !== originalDiscountState.aplicado ||
        discount.tipo !== originalDiscountState.tipo ||
        discount.valor !== originalDiscountState.valor ||
        discount.codigo !== originalDiscountState.codigo;
      
      setHasChanges(hasChargeChanges || hasDiscountChanges);
    }
  }, [
    state.packagingOption, 
    state.customPackagingPrice, 
    state.insurance, 
    state.insuranceValue, 
    state.collectionRequired, 
    state.collectionPrice,
    detallesCotizacion,
    discount.aplicado,
    discount.tipo,
    discount.valor,
    discount.codigo,
    originalDiscountState
  ]);

  // Initialize original discount state when component mounts or when additionalChargesChanged prop changes
  useEffect(() => {
    if (!additionalChargesChanged) {
      // Reset original discount state when starting fresh (no changes from parent)
      setOriginalDiscountState({
        tipo: '',
        valor: 0,
        codigo: '',
        aplicado: false
      });
      setHasChanges(false);
    }
  }, [additionalChargesChanged]);

  // Calculate total additional charges
  const calculateTotalAdditionalCharges = () => {
    if (!detallesCotizacion) return 0;
    
    const empaque = hasChanges ? localAdditionalCharges.empaque : detallesCotizacion.empaque;
    const seguro = hasChanges ? localAdditionalCharges.seguro : detallesCotizacion.seguro;
    const recoleccion = hasChanges ? localAdditionalCharges.recoleccion : detallesCotizacion.recoleccion;
    
    return empaque + seguro + recoleccion + detallesCotizacion.reexpedicion;
  };

  // Calculate discount amount
  const calculateDiscountAmount = (subtotal: number): number => {
    if (!discount.aplicado || !discount.tipo || discount.valor <= 0) return 0;
    
    switch (discount.tipo) {
      case 'porcentaje':
        return subtotal * (discount.valor / 100);
      case 'fijo':
        return Math.min(discount.valor, subtotal);
      case 'codigo':
        return Math.min(discount.valor, subtotal);
      default:
        return 0;
    }
  };

  // Calculate service prices with local charges and discount
  const getServicePriceWithLocalChargesAndDiscount = (servicio: ServicioCotizado) => {
    // If no changes have been made, use original server prices
    if (!hasChanges && !discount.aplicado) {
      return {
        subtotalBeforeDiscount: servicio.precioTotal,
        discountAmount: 0,
        subtotalAfterDiscount: servicio.precioTotal,
        total: servicio.precioConIva
      };
    }

    // Calculate with current state (local charges and/or discounts)
    const localChargesTotal = localAdditionalCharges.empaque + localAdditionalCharges.seguro + localAdditionalCharges.recoleccion;
    const subtotalBeforeDiscount = servicio.precioBase + servicio.cargoSobrepeso + localChargesTotal + (detallesCotizacion?.reexpedicion || 0);
    
    const discountAmount = calculateDiscountAmount(subtotalBeforeDiscount);
    const subtotalAfterDiscount = subtotalBeforeDiscount - discountAmount;
    const total = subtotalAfterDiscount * 1.16; // 16% IVA

    return {
      subtotalBeforeDiscount,
      discountAmount,
      subtotalAfterDiscount,
      total
    };
  };

  // Handle discount type change
  const handleDiscountTypeChange = (tipo: string) => {
    const newTipo = tipo === "none" ? '' : tipo as 'porcentaje' | 'fijo' | 'codigo' | '';
    setDiscount(prev => ({
      ...prev,
      tipo: newTipo,
      aplicado: newTipo !== '',
      valor: 0,
      codigo: '',
      error: undefined
    }));
  };

  // Handle discount value change
  const handleDiscountValueChange = (valor: number) => {
    const validValue = Math.max(0, valor);
    setDiscount(prev => ({
      ...prev,
      valor: validValue
    }));
  };

  // Handle discount code change
  const handleDiscountCodeChange = (codigo: string) => {
    setDiscount(prev => ({
      ...prev,
      codigo,
      error: undefined
    }));
  };

  // Validate discount code
  const validateDiscountCode = async (codigo: string): Promise<{ valid: boolean; valor?: number; tipo?: string; error?: string }> => {
    try {
      // Mock validation - replace with actual API call
      const mockCodes = {
        'DESCUENTO10': { valid: true, valor: 10, tipo: 'porcentaje' },
        'AHORRO50': { valid: true, valor: 50, tipo: 'fijo' },
        'ENVIOGRATIS': { valid: true, valor: 100, tipo: 'fijo' }
      };

      const code = mockCodes[codigo.toUpperCase() as keyof typeof mockCodes];
      
      if (code) {
        return code;
      } else {
        return {
          valid: false,
          error: 'Código de descuento inválido'
        };
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      return {
        valid: false,
        error: 'Error al validar el código de descuento'
      };
    }
  };

  // Apply discount code
  const applyDiscountCodeHandler = async () => {
    if (!discount.codigo.trim()) return;

    setDiscount(prev => ({ ...prev, isValidating: true, error: undefined }));

    try {
      const validation = await validateDiscountCode(discount.codigo);
      
      if (validation.valid && validation.valor && validation.tipo) {
        setDiscount(prev => ({
          ...prev,
          tipo: validation.tipo as 'porcentaje' | 'fijo',
          valor: validation.valor!,
          aplicado: true,
          isValidating: false,
          error: undefined
        }));
      } else {
        setDiscount(prev => ({
          ...prev,
          aplicado: false,
          isValidating: false,
          error: validation.error || 'Código de descuento inválido'
        }));
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      setDiscount(prev => ({
        ...prev,
        aplicado: false,
        isValidating: false,
        error: 'Error al validar el código de descuento'
      }));
    }
  };

  // Handle requote
  const handleReQuote = () => {
    if (onReQuote) {
      onReQuote();
      
      // After requoting, update the original state to match current state
      // so we can track future changes properly
      setOriginalDiscountState({
        tipo: discount.tipo,
        valor: discount.valor,
        codigo: discount.codigo,
        aplicado: discount.aplicado
      });
      
      setHasChanges(false);
    }
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

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Additional Services and Discounts Card */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-blue-600" />
                Servicios Adicionales y Descuentos
              </CardTitle>
              <CardDescription>
                Configure los servicios adicionales y descuentos para su envío
              </CardDescription>
            </div>
            {hasChanges && (
              <Button
                onClick={handleReQuote}
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
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Discount Section */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center mb-3">
              <Gift className="h-4 w-4 mr-2 text-green-600" />
              <Label className="text-sm font-medium">Descuento</Label>
            </div>
            
            <Select
              value={discount.tipo || "none"}
              onValueChange={handleDiscountTypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tipo de descuento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin descuento</SelectItem>
                <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                <SelectItem value="fijo">Cantidad fija ($)</SelectItem>
                <SelectItem value="codigo">Código promocional</SelectItem>
              </SelectContent>
            </Select>

            {discount.tipo === 'porcentaje' && (
              <div className="mt-3 space-y-2">
                <Label className="text-xs font-medium text-gray-500">
                  Porcentaje de descuento
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    value={discount.valor || ''}
                    onChange={(e) => handleDiscountValueChange(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="pr-8"
                  />
                  <Percent className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            )}

            {discount.tipo === 'fijo' && (
              <div className="mt-3 space-y-2">
                <Label className="text-xs font-medium text-gray-500">
                  Cantidad de descuento
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={discount.valor || ''}
                    onChange={(e) => handleDiscountValueChange(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="pl-8"
                  />
                </div>
              </div>
            )}

            {discount.tipo === 'codigo' && (
              <div className="mt-3 space-y-2">
                <Label className="text-xs font-medium text-gray-500">
                  Código promocional
                </Label>
                <div className="flex space-x-1">
                  <Input
                    type="text"
                    placeholder="Ingrese código"
                    value={discount.codigo}
                    onChange={(e) => handleDiscountCodeChange(e.target.value)}
                    className={`flex-1 ${discount.error ? 'border-red-300' : ''}`}
                    disabled={discount.isValidating}
                  />
                  <Button
                    onClick={applyDiscountCodeHandler}
                    size="sm"
                    variant="outline"
                    disabled={!discount.codigo.trim() || discount.isValidating}
                  >
                    {discount.isValidating ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Tag className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                
                {/* Error message */}
                {discount.error && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {discount.error}
                  </p>
                )}
                
                {/* Success message */}
                {discount.aplicado && discount.valor > 0 && !discount.error && (
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Descuento aplicado: {discount.tipo === 'porcentaje' ? `${discount.valor}%` : `$${discount.valor}`}
                  </p>
                )}
              </div>
            )}

            {discount.aplicado && discount.valor > 0 && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-xs text-green-700 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Descuento aplicado
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
                {discount.aplicado && <TableHead className="text-green-600">Descuento</TableHead>}
                <TableHead>Total (con IVA)</TableHead>
                <TableHead>Tiempo</TableHead>
                <TableHead className="text-right">Seleccionar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicios.map((servicio, index) => {
                const prices = getServicePriceWithLocalChargesAndDiscount(servicio);
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
                      {hasChanges && (
                        <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-700 border-orange-300 text-xs">
                          Actualizado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${formatCurrency(prices.subtotalBeforeDiscount)}
                    </TableCell>
                    {discount.aplicado && (
                      <TableCell className="font-medium text-green-600">
                        -${formatCurrency(prices.discountAmount)}
                      </TableCell>
                    )}
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
          const prices = getServicePriceWithLocalChargesAndDiscount(servicio);
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
                    {hasChanges && (
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
                      <p className="font-medium">${formatCurrency(prices.subtotalBeforeDiscount)}</p>
                    </div>
                    {discount.aplicado && prices.discountAmount > 0 && (
                      <div>
                        <span className="text-gray-500">Descuento:</span>
                        <p className="font-medium text-green-600">-${formatCurrency(prices.discountAmount)}</p>
                      </div>
                    )}
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

      <ProviderCostsView
  originZip={state.originZip}
  destZip={state.destZip}
  packageDetails={{
    peso: parseFloat(state.weight),
    alto: state.height ? parseFloat(state.height) : undefined,
    largo: state.length ? parseFloat(state.length) : undefined,
    ancho: state.width ? parseFloat(state.width) : undefined,
    valor_declarado: state.insurance && state.insuranceValue ? parseFloat(state.insuranceValue) : undefined,
    content: "GIFT" // or whatever default content you use
  }}
/>
      

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
                      ${formatCurrency(selectedService.cargoSobrepeso)}
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
              {hasChanges && (
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
                  ${formatCurrency(hasChanges ? localAdditionalCharges.empaque : detallesCotizacion.empaque)}
                  {hasChanges && localAdditionalCharges.empaque !== detallesCotizacion.empaque && (
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
                  ${formatCurrency(hasChanges ? localAdditionalCharges.seguro : detallesCotizacion.seguro)}
                  {hasChanges && localAdditionalCharges.seguro !== detallesCotizacion.seguro && (
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
                  ${formatCurrency(hasChanges ? localAdditionalCharges.recoleccion : detallesCotizacion.recoleccion)}
                  {hasChanges && localAdditionalCharges.recoleccion !== detallesCotizacion.recoleccion && (
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
                  ${formatCurrency(detallesCotizacion.reexpedicion)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-200">
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Total cargos adicionales: ${formatCurrency(calculateTotalAdditionalCharges())}
              </Badge>
              {hasChanges && (
                <Button
                  onClick={handleReQuote}
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

      {/* Discount Summary Card */}
      {discount.aplicado && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <Gift className="h-5 w-5 mr-2 text-green-600" />
              <CardTitle className="text-base">Resumen de Descuento</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded-lg border border-green-200">
                <p className="text-xs text-gray-500 mb-1">Tipo de Descuento:</p>
                <p className="text-base font-medium text-green-700">
                  {discount.tipo === 'porcentaje' && <Percent className="h-3.5 w-3.5 inline mr-1" />}
                  {discount.tipo === 'fijo' && <DollarSign className="h-3.5 w-3.5 inline mr-1" />}
                  {discount.tipo === 'codigo' && <Tag className="h-3.5 w-3.5 inline mr-1" />}
                  {discount.tipo === 'porcentaje' ? `${discount.valor}%` : 
                   discount.tipo === 'fijo' ? `${formatCurrency(discount.valor)}` :
                   `Código: ${discount.codigo}`}
                </p>
              </div>
              {selectedService && (
                <>
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-xs text-gray-500 mb-1">Ahorro en {selectedService.nombre}:</p>
                    <p className="text-base font-medium text-green-700">
                      ${formatCurrency(getServicePriceWithLocalChargesAndDiscount(selectedService).discountAmount)}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-xs text-gray-500 mb-1">Precio Final:</p>
                    <p className="text-base font-medium text-green-700">
                      ${formatCurrency(getServicePriceWithLocalChargesAndDiscount(selectedService).total)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                {discount.aplicado && (
                  <span className="ml-2 px-2 py-1 bg-green-700 rounded text-xs">
                    Descuento aplicado
                  </span>
                )}
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