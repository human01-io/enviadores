import React, { useState } from 'react';

// Common content suggestions
const CONTENT_SUGGESTIONS = [
  "Documentos",
  "Ropa",
  "Electrónicos",
  "Artículos personales",
  "Libros",
  "Artículos de oficina",
  "Artesanías",
  "Regalo",
  "Muestras",
  "Repuestos",
  "Accesorios",
  "Comestibles no perecederos"
];

interface ContentFieldProps {
  contenido: string;
  setContenido: (value: string) => void;
}

const ContentField: React.FC<ContentFieldProps> = ({ contenido, setContenido }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div className="bg-blue-50 p-4 rounded-lg shadow-sm mt-4">
      <h3 className="text-lg font-semibold mb-3 text-blue-700 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17a3 3 0 010-1H5zm9 9a3 3 0 10-5.237 2.236 3 3 0 10-2.764-2.236h-.001A3 3 0 100 16v-1a2 2 0 114 0h1a1 1 0 102 0v-1h5a2 2 0 100-4h-1.17a3 3 0 010-1H16a2 2 0 100 4v1z" clipRule="evenodd" />
        </svg>
        Contenido del Envío
      </h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción del Contenido*
          <span className="text-xs text-gray-500 ml-1">(Requerido para documentación y trámites aduanales)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Ej: Documentos, Ropa, Electrónicos..."
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
            required
          />
          
          {showSuggestions && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
              {CONTENT_SUGGESTIONS.map((suggestion) => (
                <div
                  key={suggestion}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                  onClick={() => {
                    setContenido(suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {CONTENT_SUGGESTIONS.slice(0, 6).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setContenido(suggestion)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
        
        <p className="text-xs text-gray-500 mt-3">
          Proporcione una descripción clara y precisa del contenido del envío. 
          Esto es necesario para los trámites de envío y aduanas.
        </p>
      </div>
    </div>
  );
};

export default ContentField;