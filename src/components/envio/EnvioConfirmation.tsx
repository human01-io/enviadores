import { Cliente, Destino, ServicioCotizado } from '../../types';

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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-6 text-center text-blue-700">Confirmación de Envío</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Service Details */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-lg mb-3 text-blue-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H14a1 1 0 001-1v-3h2a1 1 0 001-1V8a1 1 0 00-.416-.789l-2-1.666A1 1 0 0014 5.333V4a1 1 0 00-1-1H3zM16 8.8V8l-2-1.667V5H14v3.8l2 .8z" />
            </svg>
            Detalles del Servicio
          </h3>
          
          <div className="bg-white p-4 rounded border border-blue-100">
            <div className="grid grid-cols-2 gap-y-2">
              <div className="font-medium">Servicio:</div>
              <div>{selectedService.nombre}</div>
              
              <div className="font-medium">Precio Base:</div>
              <div>${formatCurrency(selectedService.precioBase)}</div>
              
              <div className="font-medium">Cargos Extra:</div>
              <div>${formatCurrency(selectedService.cargoSobrepeso)}</div>
              
              <div className="font-medium">Subtotal:</div>
              <div>${formatCurrency(selectedService.precioFinal)}</div>
              
              <div className="font-medium">IVA:</div>
              <div>${formatCurrency(selectedService.precioConIva - selectedService.precioFinal)}</div>
              
              <div className="col-span-2 border-t pt-2 mt-1">
                <div className="flex justify-between">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-blue-700">${formatCurrency(selectedService.precioConIva)}</span>
                </div>
              </div>
              
              <div className="font-medium">Tiempo estimado:</div>
              <div>{selectedService.diasEstimados} día{selectedService.diasEstimados !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
        
        {/* Client and Destination Summary */}
        <div className="space-y-6">
          {/* Client Details */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-lg mb-3 text-blue-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Remitente
            </h3>
            
            <div className="space-y-1">
              <p className="font-medium">{cliente.nombre} {cliente.apellido_paterno} {cliente.apellido_materno}</p>
              <p>{cliente.calle} {cliente.numero_exterior}{cliente.numero_interior ? `, Int. ${cliente.numero_interior}` : ''}</p>
              <p>{cliente.colonia}, {cliente.municipio}, {cliente.estado}</p>
              <p>C.P. {cliente.codigo_postal}</p>
              <p>Tel: {cliente.telefono}</p>
              {cliente.email && <p>Email: {cliente.email}</p>}
            </div>
          </div>
          
          {/* Destination Details */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-semibold text-lg mb-3 text-green-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Destinatario
            </h3>
            
            <div className="space-y-1">
              <p className="font-medium">{destino.nombre_destinatario}</p>
              <p>{destino.direccion}</p>
              <p>{destino.colonia}, {destino.ciudad}, {destino.estado}</p>
              <p>C.P. {destino.codigo_postal}</p>
              <p>Tel: {destino.telefono}</p>
              {destino.email && <p>Email: {destino.email}</p>}
              
              {destino.instrucciones_entrega && (
                <div className="mt-3 pt-2 border-t">
                  <p className="font-medium">Instrucciones:</p>
                  <p className="text-sm italic">{destino.instrucciones_entrega}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Notice */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Verifique que todos los datos sean correctos antes de confirmar el envío.
              Una vez confirmado, se generará la guía de envío y no podrá modificarse esta información.
            </p>
          </div>
        </div>
      </div>

          {/* Notice for Shipping Options - added to encourage users to choose a shipping option */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H14a1 1 0 001-1v-3h2a1 1 0 001-1V8a1 1 0 00-.416-.789l-2-1.666A1 1 0 0014 5.333V4a1 1 0 00-1-1H3zM16 8.8V8l-2-1.667V5H14v3.8l2 .8z" />
          </svg>
          <div>
            <p className="text-sm text-blue-800">
              <strong>Siguiente paso:</strong> A continuación, seleccione una opción de envío entre las opciones disponibles.
            </p>
          </div>
        </div>
      </div>
      
      {/* Back Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center mx-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Editar Información
        </button>
      </div>
    </div>
  );
}