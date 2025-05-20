import React from 'react';
import { CotizadorState } from './utils/cotizadorTypes';
import { motion } from 'framer-motion';
import { Package, Box, Mail, ChevronRight, Shield, Truck, DollarSign, Info, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/CardComponent';
import { Badge } from '../ui/BadgeComponent';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Separator } from '../ui/SeparatorComponent';
import { RadioGroup, RadioGroupItem } from '../ui/Radio';
import { Checkbox } from '../ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/SelectComponent';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';

interface PackageDetailsSectionProps {
  state: CotizadorState;
  updateField: (field: keyof CotizadorState, value: any) => void;
  servicios: any[] | null;
  validated: boolean;
  fetchQuote: () => void;
  onContinueToResults?: () => void;
}

export const PackageDetailsSection: React.FC<PackageDetailsSectionProps> = ({
  state,
  updateField,
  servicios,
  validated,
  fetchQuote,
  onContinueToResults
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Check if all required fields are filled
  const canQuote = (state.isInternational ? state.selectedZone : validated) && 
    state.packageType &&
    ((state.packageType === "Paquete" && 
      state.length && state.width && state.height && state.weight && 
      !isNaN(parseFloat(state.length)) && !isNaN(parseFloat(state.width)) && 
      !isNaN(parseFloat(state.height)) && !isNaN(parseFloat(state.weight))) ||
    (state.packageType === "Sobre" && state.weight && !isNaN(parseFloat(state.weight))));

  // Format package prices for display
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
      <Card>
        <CardHeader className="pb-2 bg-blue-50">
          <CardTitle className="text-base text-blue-700 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Detalles del Paquete
          </CardTitle>
          <CardDescription>
            Ingrese las dimensiones y características de su envío
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Package Type Selection */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">Tipo de Envío</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                type="button"
                onClick={() => updateField('packageType', "Sobre")}
                variant={state.packageType === "Sobre" ? "default" : "outline"}
                className={`h-auto py-3 justify-start ${
                  state.packageType === "Sobre" ? 'border-blue-500 bg-blue-50 text-blue-700' : ''
                }`}
              >
                <Mail className="h-5 w-5 min-w-5 mr-2 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Sobre</div>
                  <div className="text-xs opacity-80 break-words hyphens-auto">Documentos o artículos planos</div>
                </div>
              </Button>
              <Button
                type="button"
                onClick={() => updateField('packageType', "Paquete")}
                variant={state.packageType === "Paquete" ? "default" : "outline"}
                className={`h-auto py-3 justify-start ${
                  state.packageType === "Paquete" ? 'border-blue-500 bg-blue-50 text-blue-700' : ''
                }`}
              >
                <Box className="h-5 w-5 min-w-5 mr-2 flex-shrink-0" />
                <div className="text-left overflow-hidden">
                  <div className="font-medium">Paquete</div>
                  <div className="text-xs opacity-80 break-words hyphens-auto">Cajas y artículos con volumen</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Dimensions and Weight Section */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium mb-3">Dimensiones y Peso</h3>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Weight input - always visible */}
                <div className="md:col-span-1">
                  <Label htmlFor="weight" className="text-xs font-medium">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={state.weight}
                    onChange={(e) => updateField('weight', e.target.value)}
                    min="0.1"
                    step="0.1"
                    placeholder="0.0"
                    className="mt-1"
                  />
                </div>

                {/* Package Dimensions (only visible for Paquete) */}
                {state.packageType === "Paquete" ? (
                  <>
                    <div>
                      <Label htmlFor="length" className="text-xs font-medium">Largo (cm)</Label>
                      <Input
                        id="length"
                        type="number"
                        value={state.length}
                        onChange={(e) => updateField('length', e.target.value)}
                        min="0.1"
                        step="0.1"
                        placeholder="0.0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="width" className="text-xs font-medium">Ancho (cm)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={state.width}
                        onChange={(e) => updateField('width', e.target.value)}
                        min="0.1"
                        step="0.1"
                        placeholder="0.0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height" className="text-xs font-medium">Alto (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={state.height}
                        onChange={(e) => updateField('height', e.target.value)}
                        min="0.1"
                        step="0.1"
                        placeholder="0.0"
                        className="mt-1"
                      />
                    </div>

                    {/* Volumetric Weight Display */}
                    {servicios && state.packageType === "Paquete" && state.volumetricWeight > 0 && (
                      <div className="flex items-end">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1.5 h-9">
                                <Info className="h-3.5 w-3.5 mr-1" />
                                Peso Vol: {state.volumetricWeight.toFixed(2)} kg
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Peso volumétrico calculado a partir de las dimensiones</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>

            {/* Packaging Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Box className="h-4 w-4 mr-1.5" />
                  Opciones de Empaque
                </h3>
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
                    <Label htmlFor="customPackagingPrice" className="text-xs font-medium text-gray-500">Precio personalizado</Label>
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

              {/* Additional Options */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1.5" />
                  Servicios Adicionales
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2 bg-white p-3 rounded-md border border-gray-200">
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

                  <div className="flex items-start space-x-2 bg-white p-3 rounded-md border border-gray-200">
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
                </div>
              </div>
            </div>

            {/* Optional Panels */}
            <div className="space-y-4">
              {state.collectionRequired && (
                <motion.div 
                  className="p-3 bg-gray-50 rounded-md border border-gray-200"
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                >
                  <Label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="collectionPrice">
                    Precio de recolección (opcional)
                  </Label>
                  <Input
                    id="collectionPrice"
                    type="number"
                    placeholder="Dejar vacío para precio estándar"
                    value={state.collectionPrice || ''}
                    onChange={(e) => updateField('collectionPrice', parseFloat(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Si deja este campo vacío, se aplicará el precio estándar de recolección.</p>
                </motion.div>
              )}

              {state.insurance && (
                <motion.div 
                  className="p-3 bg-gray-50 rounded-md border border-gray-200"
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                >
                  <Label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="insuranceValue">
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
                  />
                  <p className="text-xs text-gray-500 mt-1">La prima del seguro será calculada como 1.75% del valor declarado.</p>
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cotizar Button */}
      {canQuote ? (
        <Button
          onClick={fetchQuote}
          className="fixed bottom-10 right-6 flex items-center h-12 font-medium bg-red-600 hover:bg-red-700 text-white"
          variant="default"
        >
          <DollarSign className="h-5 w-5 mr-2" />
          Cotizar Envío
        </Button>
      ) : (
        <div 
          className="fixed bottom-10 right-6 flex items-center h-12 font-medium px-4 py-2 rounded-md bg-gray-200 text-gray-700 border border-gray-300 cursor-not-allowed"
        >
          <AlertTriangle className="h-5 w-5 mr-2 text-gray-600" />
          Complete los detalles del envío
        </div>
      )}


      {servicios && servicios.length > 0 && (
  <div className="mt-4">
    <Button
      onClick={onContinueToResults}
      className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white"
    >
      <ArrowRight className="h-5 w-5 mr-2" />
      Continuar a Resultados
    </Button>
  </div>
)}
      
      {!canQuote && state.packageType && (
        <p className="mt-2 text-sm text-orange-600 flex items-center justify-center">
          <AlertTriangle className="h-4 w-4 mr-1" />
          {state.packageType === "Paquete" 
            ? "Complete todas las dimensiones y el peso del paquete"
            : "Complete el peso del sobre"}
        </p>
      )}
    </motion.div>
  );
};