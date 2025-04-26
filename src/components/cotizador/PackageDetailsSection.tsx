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
  return (
    <>
      <h2 className="text-xl font-semibold mt-6">Detalles del Paquete</h2>
      <select 
        value={state.packageType} 
        onChange={(e) => updateField('packageType', e.target.value)} 
        className="border p-2 w-full mt-2"
      >
        <option value="">Selecciona tipo de Envio</option>
        <option value="Paquete">Paquete</option>
        <option value="Sobre">Sobre</option>
      </select>

      {state.packageType === "Paquete" && (
        <>
          <div className="relative w-full">
            <input
              type="number"
              id="length"
              value={state.length}
              onChange={(e) => updateField('length', e.target.value)}
              placeholder="0"
              className="border p-2 w-full mt-2"
            />
            <label
              htmlFor="length"
              className="absolute right-10 top-7 transform -translate-y-1/2 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
            >
              Largo (cm)
            </label>
          </div>
          <div className="relative w-full">
            <input
              type="number"
              placeholder="0"
              value={state.width}
              onChange={(e) => updateField('width', e.target.value)}
              className="border p-2 w-full mt-2"
            />
            <label
              htmlFor="width"
              className="absolute right-10 top-7 transform -translate-y-1/2 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
            >
              Ancho (cm)
            </label>
          </div>
          <div className="relative w-full">
            <input
              type="number"
              placeholder="0"
              value={state.height}
              onChange={(e) => updateField('height', e.target.value)}
              className="border p-2 w-full mt-2" 
            />
            <label
              htmlFor="height"
              className="absolute right-10 top-7 transform -translate-y-1/2 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
            >
              Alto (cm)
            </label>
          </div>
        </>
      )}

      <div className="relative w-full">
        <input
          type="number"
          placeholder="0"
          value={state.weight}
          onChange={(e) => updateField('weight', e.target.value)}
          className="border p-2 w-full mt-2" 
        />
        <label
          htmlFor="weight"
          className="absolute right-10 top-7 transform -translate-y-1/2 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
        >
          Peso (kg)
        </label>
      </div>

      {/* Display Volumetric Weight Only After Clicking Cotizar */}
      {servicios && state.packageType === "Paquete" && (
        <p className="text-green-600 mt-2">Peso Volumétrico: {state.volumetricWeight.toFixed(2)} kg</p>
      )}

      {/* Packaging Options */}
      <div className="mb-4 mt-6">
        <h3 className="font-semibold mb-2">Empaque</h3>
        <select
          value={state.packagingOption}
          onChange={(e) => updateField('packagingOption', e.target.value)}
          className={`border p-2 w-full ${state.packagingOption === 'EMP00' ? 'bg-green-50 border-green-200' : ''}`}
        >
          <option value="EMP00">Sin empaque ($0)</option>
          <option value="EMP01">Sobre ($10)</option>
          <option value="EMP02">Chico ($25)</option>
          <option value="EMP03">Mediano ($70)</option>
          <option value="EMP04">Grande ($170)</option>
          <option value="EMP05">Personalizado</option>
        </select>

        {state.packagingOption === 'EMP05' && (
          <input
            type="number"
            placeholder="Precio personalizado"
            value={state.customPackagingPrice || ''}
            onChange={(e) => updateField('customPackagingPrice', parseFloat(e.target.value))}
            className="border p-2 w-full mt-2"
            min="0"
            step="0.01"
          />
        )}
      </div>

      {/* Collection Service */}
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={state.collectionRequired}
            onChange={(e) => updateField('collectionRequired', e.target.checked)}
            className="mr-2"
          />
          Requiere recolección
        </label>

        {state.collectionRequired && (
          <input
            type="number"
            placeholder="Precio de recolección (dejar vacío para precio estándar)"
            value={state.collectionPrice || ''}
            onChange={(e) => updateField('collectionPrice', parseFloat(e.target.value))}
            className="border p-2 w-full mt-2"
            min="0"
            step="0.01"
          />
        )}
      </div>

      {/* Insurance */}
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={state.insurance}
            onChange={(e) => updateField('insurance', e.target.checked)}
            className="mr-2"
          />
          Seguro de envío (1.75% del valor declarado)
        </label>

        {state.insurance && (
          <input
            type="number"
            placeholder="Valor declarado"
            value={state.insuranceValue}
            onChange={(e) => updateField('insuranceValue', e.target.value)}
            className="border p-2 w-full mt-2"
            min="0"
            step="0.01"
          />
        )}
      </div>

      {/* Cotizar Button */}
      <button
        onClick={fetchQuote}
        className={`text-white px-4 py-2 rounded mt-2 ${(state.isInternational ? state.selectedZone : validated) && state.packageType &&
          ((state.packageType === "Paquete" && state.length && state.width && state.height && state.weight && 
            !isNaN(parseFloat(state.length)) && !isNaN(parseFloat(state.width)) && 
            !isNaN(parseFloat(state.height)) && !isNaN(parseFloat(state.weight))) ||
            (state.packageType === "Sobre" && state.weight && !isNaN(parseFloat(state.weight))))
          ? "bg-blue-600 hover:bg-blue-700"
          : "bg-gray-500 cursor-not-allowed"
          }`}
        disabled={!(state.isInternational ? state.selectedZone : validated) ||
          !state.packageType ||
          (state.packageType === "Paquete" && (!state.length || !state.width || !state.height || !state.weight || 
            isNaN(parseFloat(state.length)) || isNaN(parseFloat(state.width)) || 
            isNaN(parseFloat(state.height)) || isNaN(parseFloat(state.weight)))) ||
          (state.packageType === "Sobre" && (!state.weight || isNaN(parseFloat(state.weight))))
        }
      >
        Cotizar
      </button>
    </>
  );
};