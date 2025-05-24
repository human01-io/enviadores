import { Cliente, Destino, ServicioCotizado } from '../../types';
import { Package, Clock, DollarSign } from 'lucide-react';

interface EnvioConfirmationProps {
  cliente: Cliente;
  destino: Destino;
  selectedService: ServicioCotizado;
  contenido: string;
  onBack: () => void;
}

export default function EnvioConfirmation({
  cliente,
  destino,
  selectedService,
  contenido,
  onBack
}: EnvioConfirmationProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-MX', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Package className="w-5 h-5 mr-2 text-blue-600" />
          Resumen del Envío
        </h2>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Modificar datos
        </button>
      </div>

      {/* Compact Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Origin/Destination Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">De:</p>
            <p className="font-medium text-sm">{cliente.nombre} {cliente.apellido_paterno}</p>
            <p className="text-xs text-gray-600">{cliente.municipio}, {cliente.estado}</p>
            <p className="text-xs text-gray-600">CP: {cliente.codigo_postal}</p>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-1">Para:</p>
            <p className="font-medium text-sm">{destino.nombre_destinatario}</p>
            <p className="text-xs text-gray-600">{destino.ciudad}, {destino.estado}</p>
            <p className="text-xs text-gray-600">CP: {destino.codigo_postal}</p>
          </div>
        </div>

        {/* Service Summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">Servicio:</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="font-semibold text-sm text-gray-900">{selectedService.nombre}</p>
          <p className="text-xs text-gray-600 mt-1">
            Tiempo estimado: {selectedService.diasEstimados} día{selectedService.diasEstimados !== 1 ? 's' : ''}
          </p>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-gray-600">Contenido:</p>
            <p className="text-sm font-medium text-gray-900 italic">"{contenido}"</p>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">Total a pagar:</span>
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${formatCurrency(selectedService.precioConIva)}
          </p>
          <p className="text-xs text-gray-500 mt-1">MXN (IVA incluido)</p>
          
          <div className="mt-3 pt-3 border-t border-green-200 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Subtotal:</span>
              <span>${formatCurrency(selectedService.precioFinal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">IVA (16%):</span>
              <span>${formatCurrency(selectedService.precioConIva - selectedService.precioFinal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}