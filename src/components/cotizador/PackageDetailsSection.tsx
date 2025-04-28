import React from 'react';
import { CotizadorState } from './utils/cotizadorTypes';

interface PackageDetailsSectionProps {
  state: CotizadorState;
  updateField: (field: keyof CotizadorState, value: any) => void;
  servicios: any[] | null;
  validated: boolean;
  fetchQuote: () => void;
}

export const PackageDetailsSection: React.FC<PackageDetailsSectionProps> = ({
  state,
  updateField,
  servicios,
  validated,
  fetchQuote
}) => {
  const canQuote = (state.isInternational ? state.selectedZone : validated) && 
    state.packageType &&
    ((state.packageType === "Paquete" && 
      state.length && state.width && state.height && state.weight && 
      !isNaN(parseFloat(state.length)) && !isNaN(parseFloat(state.width)) && 
      !isNaN(parseFloat(state.height)) && !isNaN(parseFloat(state.weight))) ||
    (state.packageType === "Sobre" && state.weight && !isNaN(parseFloat(state.weight))));

  return (
    <div className="space-y-4">
      {/* Package Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Envío</label>
        <div className="grid grid-cols-2 gap-3">
          <label className={`
            flex items-center p-3 rounded-lg border cursor-pointer transition-colors
            ${state.packageType === "Sobre" 
              ? "bg-blue-50 border-blue-500 text-blue-700" 
              : "border-gray-300 hover:bg-gray-50"}
          `}>
            <input
              type="radio"
              name="packageType"
              value="Sobre"
              checked={state.packageType === "Sobre"}
              onChange={() => updateField('packageType', "Sobre")}
              className="h-4 w-4 text-blue-600 mr-2"
            />
            <span>Sobre</span>
          </label>
          
          <label className={`
            flex items-center p-3 rounded-lg border cursor-pointer transition-colors
            ${state.packageType === "Paquete" 
              ? "bg-blue-50 border-blue-500 text-blue-700" 
              : "border-gray-300 hover:bg-gray-50"}
          `}>
            <input
              type="radio"
              name="packageType"
              value="Paquete"
              checked={state.packageType === "Paquete"}
              onChange={() => updateField('packageType', "Paquete")}
              className="h-4 w-4 text-blue-600 mr-2"
            />
            <span>Paquete</span>
          </label>
        </div>
      </div>

      {/* Package Dimensions (only for Paquete) */}
      {state.packageType === "Paquete" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Largo (cm)</label>
            <input
              type="number"
              value={state.length}
              onChange={(e) => updateField('length', e.target.value)}
              className="border rounded p-2 w-full"
              min="0.1"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ancho (cm)</label>
            <input
              type="number"
              value={state.width}
              onChange={(e) => updateField('width', e.target.value)}
              className="border rounded p-2 w-full"
              min="0.1"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alto (cm)</label>
            <input
              type="number"
              value={state.height}
              onChange={(e) => updateField('height', e.target.value)}
              className="border rounded p-2 w-full"
              min="0.1"
              step="0.1"
            />
          </div>
        </div>
      )}

      {/* Weight Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
        <input
          type="number"
          value={state.weight}
          onChange={(e) => updateField('weight', e.target.value)}
          className="border rounded p-2 w-full"
          min="0.1"
          step="0.1"
        />
      </div>

      {/* Display Volumetric Weight After Calculation */}
      {servicios && state.packageType === "Paquete" && state.volumetricWeight > 0 && (
        <div className="p-2 bg-blue-50 rounded border border-blue-100">
          <p className="text-sm font-medium text-blue-800">
            Peso Volumétrico: {state.volumetricWeight.toFixed(2)} kg
          </p>
        </div>
      )}

      {/* Packaging Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Opciones de Empaque</label>
        <select
          value={state.packagingOption}
          onChange={(e) => updateField('packagingOption', e.target.value)}
          className={`border rounded p-2 w-full ${state.packagingOption === 'EMP00' ? 'bg-green-50 border-green-200' : ''}`}
        >
          <option value="EMP00">Sin empaque ($0)</option>
          <option value="EMP01">Sobre ($10)</option>
          <option value="EMP02">Chico ($25)</option>
          <option value="EMP03">Mediano ($70)</option>
          <option value="EMP04">Grande ($170)</option>
          <option value="EMP05">Personalizado</option>
        </select>

        {state.packagingOption === 'EMP05' && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio personalizado ($)</label>
            <input
              type="number"
              placeholder="Ingrese precio"
              value={state.customPackagingPrice || ''}
              onChange={(e) => updateField('customPackagingPrice', parseFloat(e.target.value))}
              className="border rounded p-2 w-full"
              min="0"
              step="0.01"
            />
          </div>
        )}
      </div>

      {/* Collection Service */}
      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="collectionRequired"
            checked={state.collectionRequired}
            onChange={(e) => updateField('collectionRequired', e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="collectionRequired" className="ml-2 block text-sm text-gray-700">
            Requiere recolección
          </label>
        </div>

        {state.collectionRequired && (
          <div className="mt-2 pl-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio de recolección (opcional)
            </label>
            <input
              type="number"
              placeholder="Dejar vacío para precio estándar"
              value={state.collectionPrice || ''}
              onChange={(e) => updateField('collectionPrice', parseFloat(e.target.value))}
              className="border rounded p-2 w-full"
              min="0"
              step="0.01"
            />
          </div>
        )}
      </div>

      {/* Insurance */}
      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="insurance"
            checked={state.insurance}
            onChange={(e) => updateField('insurance', e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="insurance" className="ml-2 block text-sm text-gray-700">
            Seguro de envío (1.75% del valor declarado)
          </label>
        </div>

        {state.insurance && (
          <div className="mt-2 pl-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor declarado ($)
            </label>
            <input
              type="number"
              placeholder="Valor del contenido"
              value={state.insuranceValue}
              onChange={(e) => updateField('insuranceValue', e.target.value)}
              className="border rounded p-2 w-full"
              min="0"
              step="0.01"
            />
          </div>
        )}
      </div>

      {/* Cotizar Button */}
      <div className="mt-6">
        <button
          onClick={fetchQuote}
          className={`w-full text-white px-4 py-3 rounded-lg font-medium transition-colors ${
            canQuote
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!canQuote}
        >
          Cotizar Envío
        </button>
        
        {!canQuote && state.packageType && (
          <p className="mt-2 text-xs text-orange-600">
            {state.packageType === "Paquete" 
              ? "Complete todas las dimensiones y el peso del paquete"
              : "Complete el peso del sobre"}
          </p>
        )}
      </div>
    </div>
  );
};