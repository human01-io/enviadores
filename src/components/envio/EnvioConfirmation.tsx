import { Cliente, Destino, ServicioCotizado } from '../../types';
import { Package, User, MapPin, Clock, DollarSign, Edit3 } from 'lucide-react';

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
  // Format the price to include commas and always show 2 decimal places
  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-MX', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className="space-y-4 p-5">
      {/* Header with Step Indicator */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
            <Package className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Confirmación de Envío</h2>
            <p className="text-sm text-gray-500">Verifique los datos antes de continuar</p>
          </div>
        </div>
        
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span>Editar</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Service Details - Takes more prominent space */}
        <div className="xl:col-span-1 order-1 xl:order-2">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 h-fit">
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg text-blue-900">Resumen del Servicio</h3>
            </div>
            
            <div className="space-y-4">
              {/* Service Name - Prominent */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-center">
                  <h4 className="font-bold text-xl text-gray-900 mb-1">{selectedService.nombre}</h4>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{selectedService.diasEstimados} día{selectedService.diasEstimados !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio base:</span>
                    <span className="font-medium">${formatCurrency(selectedService.precioBase)}</span>
                  </div>
                  
                  {selectedService.cargoSobrepeso > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cargos extra:</span>
                      <span className="font-medium">${formatCurrency(selectedService.cargoSobrepeso)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${formatCurrency(selectedService.precioFinal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA (16%):</span>
                    <span className="font-medium">${formatCurrency(selectedService.precioConIva - selectedService.precioFinal)}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-base text-gray-900">Total:</span>
                      <span className="font-bold text-xl text-blue-700">${formatCurrency(selectedService.precioConIva)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Description */}
              {contenido && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h5 className="font-medium text-gray-900 mb-2">Contenido del paquete:</h5>
                  <p className="text-sm text-gray-700 italic">"{contenido}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client and Destination - Side by side on larger screens */}
        <div className="xl:col-span-2 order-2 xl:order-1 space-y-6">
          {/* Client Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-lg text-gray-900">Remitente</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Info */}
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {cliente.nombre} {cliente.apellido_paterno} {cliente.apellido_materno}
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="w-16 text-gray-500 font-medium">Teléfono:</span>
                    <span className="text-gray-900">{cliente.telefono}</span>
                  </div>
                  
                  {cliente.email && (
                    <div className="flex items-center space-x-2">
                      <span className="w-16 text-gray-500 font-medium">Email:</span>
                      <span className="text-gray-900">{cliente.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Dirección de origen</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>{cliente.calle} {cliente.numero_exterior}
                      {cliente.numero_interior && `, Int. ${cliente.numero_interior}`}
                    </p>
                    <p>{cliente.colonia}</p>
                    <p>{cliente.municipio}, {cliente.estado}</p>
                    <p className="font-medium">C.P. {cliente.codigo_postal}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Destination Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-lg text-gray-900">Destinatario</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Info */}
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{destino.nombre_destinatario}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="w-16 text-gray-500 font-medium">Teléfono:</span>
                    <span className="text-gray-900">{destino.telefono}</span>
                  </div>
                  
                  {destino.email && (
                    <div className="flex items-center space-x-2">
                      <span className="w-16 text-gray-500 font-medium">Email:</span>
                      <span className="text-gray-900">{destino.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Dirección de destino</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>{destino.direccion}</p>
                    <p>{destino.colonia}</p>
                    <p>{destino.ciudad}, {destino.estado}</p>
                    <p className="font-medium">C.P. {destino.codigo_postal}</p>
                  </div>
                </div>

                {/* Delivery Instructions */}
                {destino.instrucciones_entrega && (
                  <div className="mt-4 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <h5 className="font-medium text-yellow-800 text-sm mb-1">Instrucciones de entrega:</h5>
                    <p className="text-sm text-yellow-700 italic">{destino.instrucciones_entrega}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Important Notice - More compact and actionable */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-amber-900 mb-1">Siguiente paso: Seleccionar opción de envío</h4>
            <p className="text-sm text-amber-800">
              Una vez que confirme estos datos, podrá elegir entre registrar una guía externa o generar una nueva a través de nuestros socios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}