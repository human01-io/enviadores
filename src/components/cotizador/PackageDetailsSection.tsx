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
      {/* Package Type Selection and Dimensions in the same row */}
      <div className="bg-blue-50 p-2 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 gap-4 md:flex md:flex-wrap md:items-end">
          {/* Package Type Selection - More compact buttons */}
          <div className="md:mr-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Envío</label>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => updateField('packageType', "Sobre")}
                className={`px-4 py-2 text-sm font-medium border rounded-l-lg flex items-center ${
                  state.packageType === "Sobre"
                    ? "bg-blue-50 text-blue-700 border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Sobre
              </button>
              <button
                type="button"
                onClick={() => updateField('packageType', "Paquete")}
                className={`px-4 py-2 text-sm font-medium border rounded-r-lg flex items-center ${
                  state.packageType === "Paquete"
                    ? "bg-blue-50 text-blue-700 border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" clipRule="evenodd" />
                </svg>
                Paquete
              </button>
            </div>
          </div>

          {/* Weight input - always visible */}
          <div className="md:w-20 md:mr-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Peso (kg)</label>
            <input
              type="number"
              value={state.weight}
              onChange={(e) => updateField('weight', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
              min="0.1"
              step="0.1"
              placeholder="0.0"
            />
          </div>

          {/* Package Dimensions (only visible for Paquete) */}
          {state.packageType === "Paquete" ? (
            <>
              <div className="md:w-20 md:mr-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Largo (cm)</label>
                <input
                  type="number"
                  value={state.length}
                  onChange={(e) => updateField('length', e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                  min="0.1"
                  step="0.1"
                  placeholder="0.0"
                />
              </div>
              <div className="md:w-20 md:mr-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Ancho (cm)</label>
                <input
                  type="number"
                  value={state.width}
                  onChange={(e) => updateField('width', e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                  min="0.1"
                  step="0.1"
                  placeholder="0.0"
                />
              </div>
              <div className="md:w-20 md:mr-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Alto (cm)</label>
                <input
                  type="number"
                  value={state.height}
                  onChange={(e) => updateField('height', e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                  min="0.1"
                  step="0.1"
                  placeholder="0.0"
                />
              </div>
            </>
          ) : null}

          {/* Volumetric Weight Display */}
          {servicios && state.packageType === "Paquete" && state.volumetricWeight > 0 && (
            <div className="md:self-end md:mb-2">
              <div className="p-2 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-xs font-medium text-blue-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Vol: {state.volumetricWeight.toFixed(2)} kg
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Packaging Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Opciones de Empaque</label>
            <select
              value={state.packagingOption}
              onChange={(e) => updateField('packagingOption', e.target.value)}
              className={`border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-blue-500 focus:border-blue-500 ${
                state.packagingOption === 'EMP00' ? 'bg-green-50 border-green-300' : ''
              }`}
            >
              <option value="EMP00">Sin empaque ($0)</option>
              <option value="EMP01">Sobre ($10)</option>
              <option value="EMP02">Chico ($25)</option>
              <option value="EMP03">Mediano ($70)</option>
              <option value="EMP04">Grande ($170)</option>
              <option value="EMP05">Personalizado</option>
            </select>

            {state.packagingOption === 'EMP05' && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">Precio personalizado</label>
                <input
                  type="number"
                  placeholder="Ingrese precio"
                  value={state.customPackagingPrice || ''}
                  onChange={(e) => updateField('customPackagingPrice', parseFloat(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Servicios Adicionales</label>
            
            <div className="flex items-center bg-gray-50 p-3 rounded-md border border-gray-200">
              <input
                type="checkbox"
                id="collectionRequired"
                checked={state.collectionRequired}
                onChange={(e) => updateField('collectionRequired', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="collectionRequired" className="ml-3 block text-sm text-gray-700">
                Requiere recolección
              </label>
            </div>

            <div className="flex items-center bg-gray-50 p-3 rounded-md border border-gray-200">
              <input
                type="checkbox"
                id="insurance"
                checked={state.insurance}
                onChange={(e) => updateField('insurance', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="insurance" className="ml-3 block text-sm text-gray-700">
                Seguro de envío (1.75%)
              </label>
            </div>
          </div>
        </div>

        {/* Optional Panels */}
        <div className="space-y-4">
          {state.collectionRequired && (
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio de recolección (opcional)
              </label>
              <input
                type="number"
                placeholder="Dejar vacío para precio estándar"
                value={state.collectionPrice || ''}
                onChange={(e) => updateField('collectionPrice', parseFloat(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
          )}

          {state.insurance && (
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor declarado ($)
              </label>
              <input
                type="number"
                placeholder="Valor del contenido"
                value={state.insuranceValue}
                onChange={(e) => updateField('insuranceValue', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
          )}
        </div>
      </div>

      {/* Cotizar Button */}
      <div>
        <button
          onClick={fetchQuote}
          className={`w-full text-white px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            canQuote
              ? "bg-blue-600 hover:bg-blue-700 shadow-sm"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!canQuote}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          Cotizar Envío
        </button>
        
        {!canQuote && state.packageType && (
          <p className="mt-2 text-xs text-orange-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {state.packageType === "Paquete" 
              ? "Complete todas las dimensiones y el peso del paquete"
              : "Complete el peso del sobre"}
          </p>
        )}
      </div>
    </div>
  );
};