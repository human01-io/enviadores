import React from 'react';
import { CotizadorState } from './utils/cotizadorTypes';

interface AddressSectionProps {
  state: CotizadorState;
  updateField: (field: keyof CotizadorState, value: any) => void;
  originState: string;
  originMunicipio: string;
  originCiudad: string;
  originColonias: string[];
  selectedOriginColonia: string;
  setSelectedOriginColonia: (colonia: string) => void;
  destState: string;
  destMunicipio: string;
  destCiudad: string;
  destColonias: string[];
  selectedDestColonia: string;
  setSelectedDestColonia: (colonia: string) => void;
  validateZipCodes: () => void;
  zone: number | null;
  isInternational: boolean;
  selectedZone: number | null;
  isValidated: boolean;
}

export const AddressSection: React.FC<AddressSectionProps> = ({
  state,
  updateField,
  originState,
  originMunicipio,
  originCiudad,
  originColonias,
  selectedOriginColonia,
  setSelectedOriginColonia,
  destState,
  destMunicipio,
  destCiudad,
  destColonias,
  selectedDestColonia,
  setSelectedDestColonia,
  validateZipCodes,
  zone,
  isInternational,
  selectedZone,
  isValidated
}) => {
  return (
    <>
      {isInternational ? (
        <div className="mb-6">
          <h3 className="font-semibold">Zona de Envío Internacional</h3>
          <select
            value={selectedZone || ''}
            onChange={(e) => updateField('selectedZone', Number(e.target.value))}
            className="border p-2 w-full"
            required
          >
            <option value="">Seleccione zona</option>
            {[1, 2, 3, 4, 5].map((zone) => (
              <option key={zone} value={zone}>
                Zona {zone}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          {/* Origin ZIP Code */}
          <div className="mb-6">
            <h3 className="font-semibold">Código Postal de Origen</h3>
            <input
              type="text"
              placeholder="Código Postal de Origen"
              value={state.originZip}
              onChange={(e) => updateField('originZip', e.target.value)}
              className="border p-2 w-full"
              maxLength={5}
              pattern="\d*"
            />
            {isValidated && (
              <>
                <p>Estado: {originState}</p>
                <p>Municipio: {originMunicipio}</p>
                <p>Ciudad: {originCiudad}</p>
                <select
                  value={selectedOriginColonia}
                  onChange={(e) => setSelectedOriginColonia(e.target.value)}
                  className="border p-2 w-full"
                >
                  <option value="">Selecciona una Colonia</option>
                  {originColonias.map((colonia, index) => (
                    <option key={index} value={colonia}>{colonia}</option>
                  ))}
                </select>
              </>
            )}
          </div>

          {/* Destination ZIP Code */}
          <div className="mb-6">
            <h3 className="font-semibold">Código Postal de Destino</h3>
            <input
              type="text"
              placeholder="Código Postal de Destino"
              value={state.destZip}
              onChange={(e) => updateField('destZip', e.target.value)}
              className="border p-2 w-full"
              maxLength={5}
              pattern="\d*"
            />
            {isValidated && (
              <>
                <p>Estado: {destState}</p>
                <p>Municipio: {destMunicipio}</p>
                <p>Ciudad: {destCiudad}</p>
                <select
                  value={selectedDestColonia}
                  onChange={(e) => setSelectedDestColonia(e.target.value)}
                  className="border p-2 w-full"
                >
                  <option value="">Selecciona una Colonia</option>
                  {destColonias.map((colonia, index) => (
                    <option key={index} value={colonia}>{colonia}</option>
                  ))}
                </select>
                
                {/* Display Calculated Zone */}
                {zone !== null && (
                  <div className="mt-5 p-4 bg-green-100 text-green-800 rounded-lg">
                    <p className="font-semibold">Zona: {zone}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      <div className={`mb-4 p-3 rounded-lg ${isInternational ? 'bg-blue-50' : 'bg-gray-50'}`}>
        <label className="flex items-center">
          <input
            type="checkbox"
            id="internationalShipping"
            checked={isInternational}
            onChange={(e) => {
              const isChecked = e.target.checked;
              if ((!isChecked || isChecked) && (state.servicios || state.detallesCotizacion)) {
                if (!confirm("¿Está seguro? Esto reseteará toda la cotización actual.")) {
                  return;
                }
              }
              updateField('isInternational', isChecked);
            }}
            className="mr-2"
          />
          <span className="font-medium">Envío Internacional</span>
        </label>
      </div>

      {/* Validate Button */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {!isInternational ? (
          <button
            onClick={validateZipCodes}
            className={`text-white px-4 py-2 rounded ${state.originZip.length === 5 && state.destZip.length === 5
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gray-500 cursor-not-allowed"
              }`}
            disabled={!(state.originZip.length === 5 && state.destZip.length === 5)}
          >
            Validar Códigos Postales
          </button>
        ) : (
          <button
            onClick={() => updateField('isValidated', true)}
            className={`text-white px-4 py-2 rounded ${selectedZone
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-500 cursor-not-allowed"
              }`}
            disabled={!selectedZone}
          >
            Continuar a Detalles de Paquete
          </button>
        )}
      </div>
    </>
  );
};