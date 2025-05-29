import React from 'react';
import { CotizadorState } from './utils/cotizadorTypes';
import { motion } from 'framer-motion';
import { Package, Box, Mail, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/CardComponent';
import { Badge } from '../ui/BadgeComponent';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';

interface PackageDetailsSectionProps {
  state: CotizadorState;
  updateField: (field: keyof CotizadorState, value: any) => void;
  servicios: any[] | null;
  validated: boolean;
  fetchQuote: () => void;
  onContinueToResults?: () => void;
  hideAdditionalServices?: boolean;
}

export const PackageDetailsSection: React.FC<PackageDetailsSectionProps> = ({
  state,
  updateField,
  servicios,
  validated,
  fetchQuote,
  onContinueToResults,
  hideAdditionalServices = false
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <h3 className="text-lg font-semibold text-gray-800">Detalles del Paquete</h3>
      
      <Card>
        
        <CardContent className="pt-4">
          {/* Package Type Selection */}
          <div className="mb-4">
            <Label className="text-xs font-medium mb-2 block">Tipo de Envío</Label>
            <div className="grid grid-cols-1 gap-3">
              <Button
                type="button"
                onClick={() => updateField('packageType', "Sobre")}
                variant={state.packageType === "Sobre" ? "default" : "outline"}
                className={`h-auto py-3 justify-start text-left ${
                  state.packageType === "Sobre" ? 'border-blue-500 bg-blue-50 text-blue-700' : ''
                }`}
              >
                <Mail className="h-4 w-4 min-w-4 mr-2 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Sobre</div>
                  <div className="text-xs opacity-80">Documentos</div>
                </div>
              </Button>
              <Button
                type="button"
                onClick={() => updateField('packageType', "Paquete")}
                variant={state.packageType === "Paquete" ? "default" : "outline"}
                className={`h-auto py-3 justify-start text-left ${
                  state.packageType === "Paquete" ? 'border-blue-500 bg-blue-50 text-blue-700' : ''
                }`}
              >
                <Box className="h-4 w-4 min-w-4 mr-2 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Paquete</div>
                  <div className="text-xs opacity-80">Cajas</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Dimensions and Weight Section */}
          {state.packageType && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h3 className="text-xs font-medium mb-2">Dimensiones</h3>

              <div className="space-y-2">
                {/* Weight input - always visible */}
                <div>
                  <Label htmlFor="weight" className="text-xs font-medium">Peso (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={state.weight}
                    onChange={(e) => updateField('weight', e.target.value)}
                    min="0.1"
                    step="0.1"
                    placeholder="0.0"
                    className="mt-1 h-8"
                    required
                  />
                </div>

                {/* Package Dimensions */}
                {state.packageType === "Paquete" && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="length" className="text-xs">L (cm)</Label>
                        <Input
                          id="length"
                          type="number"
                          value={state.length}
                          onChange={(e) => updateField('length', e.target.value)}
                          min="0.1"
                          step="0.1"
                          placeholder="0"
                          className="mt-1 h-8"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="width" className="text-xs">A (cm)</Label>
                        <Input
                          id="width"
                          type="number"
                          value={state.width}
                          onChange={(e) => updateField('width', e.target.value)}
                          min="0.1"
                          step="0.1"
                          placeholder="0"
                          className="mt-1 h-8"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="height" className="text-xs">Alt (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          value={state.height}
                          onChange={(e) => updateField('height', e.target.value)}
                          min="0.1"
                          step="0.1"
                          placeholder="0"
                          className="mt-1 h-8"
                          required
                        />
                      </div>
                    </div>

                    {/* Volumetric Weight Display */}
                    {state.volumetricWeight > 0 && (
                      <div className="mt-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-2 py-1 text-xs w-full justify-center">
                                <Info className="h-3 w-3 mr-1" />
                                Peso Vol: {state.volumetricWeight.toFixed(2)} kg
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Peso volumétrico calculado</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Missing fields warning */}
          {state.packageType && (
            (state.packageType === "Sobre" && !state.weight) ||
            (state.packageType === "Paquete" && (!state.weight || !state.length || !state.width || !state.height))
          ) && (
            <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start">
              <AlertTriangle className="h-3 w-3 text-yellow-600 mr-1.5 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-700">
                <p className="font-medium">Complete todos los campos</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};