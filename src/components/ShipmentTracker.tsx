import { useState } from 'react';
import { apiService } from '../services/apiService';

interface ShipmentDetails {
  id: string;
  estatus: string;
  cliente_nombre: string;
  nombre_destinatario: string;
  peso_facturable: number;
  total: number;
  fecha_entrega_estimada?: string;
  guia?: string;
  // Add other fields from your envio table as needed
}

export function ShipmentTracker() {
  const [shipmentId, setShipmentId] = useState('');
  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trackShipment = async () => {
    if (!shipmentId.trim()) {
      setError('Por favor ingrese un ID de envío');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await apiService.getShipmentDetails(shipmentId);
      setShipment(data);
    } catch (err) {
      setError('No se encontró el envío. Verifique el ID.');
      setShipment(null);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    cotizado: 'bg-blue-100 text-blue-800',
    preparacion: 'bg-yellow-100 text-yellow-800',
    transito: 'bg-purple-100 text-purple-800',
    entregado: 'bg-green-100 text-green-800',
    incidencia: 'bg-red-100 text-red-800'
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Rastreo de Envíos</h2>
      
      <div className="mb-6">
        <label htmlFor="shipmentId" className="block text-sm font-medium text-gray-700 mb-2">
          Número de Envío
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="shipmentId"
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
            placeholder="Ej: 202405123456"
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={trackShipment}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Buscando...' : 'Rastrear'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {shipment && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">Envío #{shipment.id}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusColors[shipment.estatus] || 'bg-gray-100 text-gray-800'
            }`}>
              {shipment.estatus.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Cliente</p>
              <p className="font-medium">{shipment.cliente_nombre}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Destinatario</p>
              <p className="font-medium">{shipment.nombre_destinatario}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Peso</p>
                <p className="font-medium">{shipment.peso_facturable} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-medium">${shipment.total.toFixed(2)}</p>
              </div>
            </div>

            {shipment.guia && (
              <div>
                <p className="text-sm text-gray-500">Guía de paquetería</p>
                <p className="font-medium">{shipment.guia}</p>
              </div>
            )}

            {shipment.fecha_entrega_estimada && (
              <div>
                <p className="text-sm text-gray-500">Entrega estimada</p>
                <p className="font-medium">
                  {new Date(shipment.fecha_entrega_estimada).toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {shipment && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setShipmentId('');
              setShipment(null);
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Realizar nueva búsqueda
          </button>
        </div>
      )}
    </div>
  );
}