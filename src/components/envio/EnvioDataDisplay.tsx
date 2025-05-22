import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, Edit, Check, AlertTriangle, Package, User, MapPinned, Trash2, X } from 'lucide-react';
import { Cliente, Destino } from '../../types';
import ClienteFormModal from './ClienteFormModal';
import DestinoFormModal from './DestinoFormModal';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/CardComponent';
import { Badge } from '../ui/BadgeComponent';
import { Separator } from '../ui/SeparatorComponent';

interface EnvioDataDisplayProps {
  cliente: Cliente | null;
  destino: Destino | null;
  onUpdateCliente: (cliente: Cliente) => void;
  onUpdateDestino: (destino: Destino) => void;
  // Add remove handlers
  onRemoveCliente: () => void;
  onRemoveDestino: () => void;
  clienteId?: string | null;
  contenido: string;
  onUpdateContenido: (contenido: string) => void;
  zipValidation: { originValid: boolean; destValid: boolean };
}

const EnvioDataDisplay: React.FC<EnvioDataDisplayProps> = ({
  cliente,
  destino,
  onUpdateCliente,
  onUpdateDestino,
  onRemoveCliente,
  onRemoveDestino,
  clienteId,
  contenido,
  onUpdateContenido,
  zipValidation
}) => {
  const [showClientModal, setShowClientModal] = useState(false);
  const [showDestinoModal, setShowDestinoModal] = useState(false);
  const [editingContenido, setEditingContenido] = useState(false);
  const [tempContenido, setTempContenido] = useState(contenido);
  
  // Confirmation states for removal
  const [showClienteRemoveConfirm, setShowClienteRemoveConfirm] = useState(false);
  const [showDestinoRemoveConfirm, setShowDestinoRemoveConfirm] = useState(false);

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

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  useEffect(() => {
    setTempContenido(contenido);
  }, [contenido]);

  const handleSaveContenido = () => {
    onUpdateContenido(tempContenido);
    setEditingContenido(false);
  };

  const handleClienteSaved = (updatedCliente: Cliente) => {
    onUpdateCliente(updatedCliente);
    setShowClientModal(false);
  };

  const handleDestinoSaved = (updatedDestino: Destino) => {
    onUpdateDestino(updatedDestino);
    setShowDestinoModal(false);
  };

  // Remove handlers with confirmation
  const handleRemoveCliente = () => {
    onRemoveCliente();
    setShowClienteRemoveConfirm(false);
    // If cliente is removed, also remove destino since it depends on cliente
    if (destino) {
      onRemoveDestino();
    }
  };

  const handleRemoveDestino = () => {
    onRemoveDestino();
    setShowDestinoRemoveConfirm(false);
  };

  // Confirmation Dialog Component
  const ConfirmationDialog = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message 
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        >
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cliente and Destino in same row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cliente Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="h-full">
            <CardHeader className="pb-2 bg-blue-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-blue-600 mr-2" />
                  <CardTitle className="text-blue-800 text-sm lg:text-base">Remitente</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-100 text-xs lg:text-sm px-2 lg:px-3"
                    onClick={() => setShowClientModal(true)}
                  >
                    <Edit className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                    {cliente ? 'Editar' : 'Agregar'}
                  </Button>
                  {cliente && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-100 px-2"
                      onClick={() => setShowClienteRemoveConfirm(true)}
                    >
                      <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 lg:p-4 flex-1">
              {cliente ? (
                <div className="space-y-2 lg:space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm lg:text-base font-medium leading-tight">
                      {cliente.nombre} {cliente.apellido_paterno} {cliente.apellido_materno}
                    </h3>
                    {!zipValidation.originValid && (
                      <Badge variant="destructive" className="flex items-center text-xs">
                        <AlertTriangle className="h-2 w-2 lg:h-3 lg:w-3 mr-1" />
                        CP no coincide
                      </Badge>
                    )}
                  </div>
                  
                  {cliente.tipo === 'empresa' && cliente.razon_social && (
                    <div className="text-xs lg:text-sm text-gray-700">
                      <span className="font-medium">Razón Social:</span> {cliente.razon_social}
                      {cliente.rfc && <span className="ml-2">({cliente.rfc})</span>}
                    </div>
                  )}
                  
                  <div className="space-y-2 text-xs lg:text-sm">
                    <div className="flex items-start">
                      <MapPin className="h-3 w-3 lg:h-4 lg:w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-gray-700 break-words">{cliente.calle} {cliente.numero_exterior}{cliente.numero_interior ? `, Int. ${cliente.numero_interior}` : ''}</div>
                        <div className="text-gray-700">{cliente.colonia}</div>
                        <div className="text-gray-700">{cliente.municipio}, {cliente.estado}, CP {cliente.codigo_postal}</div>
                        <div className="text-gray-700">{cliente.pais || 'México'}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 lg:h-4 lg:w-4 text-blue-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700 truncate">{cliente.telefono}</span>
                      </div>
                      
                      {cliente.telefono_alternativo && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 lg:h-4 lg:w-4 text-blue-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-700 truncate">{cliente.telefono_alternativo}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 lg:h-4 lg:w-4 text-blue-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700 truncate">{cliente.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  {(cliente.referencia || cliente.notas) && (
                    <div className="text-xs lg:text-sm text-gray-600 border-t pt-2 space-y-1">
                      {cliente.referencia && (
                        <div><span className="font-medium">Referencia:</span> {cliente.referencia}</div>
                      )}
                      {cliente.notas && (
                        <div><span className="font-medium">Notas:</span> {cliente.notas}</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 lg:p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 h-full min-h-32">
                  <User className="h-8 w-8 lg:h-10 lg:w-10 text-gray-400 mb-2" />
                  <h3 className="text-gray-500 text-sm lg:text-base font-medium mb-1 text-center">No hay datos del remitente</h3>
                  <p className="text-gray-400 text-xs lg:text-sm text-center mb-3">
                    Agrega los datos del cliente que envía el paquete
                  </p>
                  <Button 
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-xs lg:text-sm"
                    onClick={() => setShowClientModal(true)}
                  >
                    <User className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                    Agregar Remitente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Destino Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="h-full">
            <CardHeader className="pb-2 bg-green-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPinned className="h-5 w-5 text-green-600 mr-2" />
                  <CardTitle className="text-green-800 text-sm lg:text-base">Destinatario</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-100 text-xs lg:text-sm px-2 lg:px-3"
                    onClick={() => setShowDestinoModal(true)}
                    disabled={!cliente}
                  >
                    <Edit className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                    {destino ? 'Editar' : 'Agregar'}
                  </Button>
                  {destino && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-100 px-2"
                      onClick={() => setShowDestinoRemoveConfirm(true)}
                    >
                      <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 lg:p-4 flex-1">
              {destino ? (
                <div className="space-y-2 lg:space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm lg:text-base font-medium leading-tight">
                      {destino.nombre_destinatario}
                      {destino.alias && <span className="ml-2 text-xs lg:text-sm text-gray-500">({destino.alias})</span>}
                    </h3>
                    {!zipValidation.destValid && (
                      <Badge variant="destructive" className="flex items-center text-xs">
                        <AlertTriangle className="h-2 w-2 lg:h-3 lg:w-3 mr-1" />
                        CP no coincide
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-xs lg:text-sm">
                    <div className="flex items-start">
                      <MapPin className="h-3 w-3 lg:h-4 lg:w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-gray-700 break-words">{destino.direccion}</div>
                        <div className="text-gray-700">{destino.colonia}</div>
                        <div className="text-gray-700">{destino.ciudad}, {destino.estado}, CP {destino.codigo_postal}</div>
                        <div className="text-gray-700">{destino.pais || 'México'}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 lg:h-4 lg:w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700 truncate">{destino.telefono}</span>
                      </div>
                      
                      {destino.email && (
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 lg:h-4 lg:w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-700 truncate">{destino.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {(destino.referencia || destino.instrucciones_entrega) && (
                    <div className="text-xs lg:text-sm text-gray-600 border-t pt-2 space-y-1">
                      {destino.referencia && (
                        <div><span className="font-medium">Referencia:</span> {destino.referencia}</div>
                      )}
                      {destino.instrucciones_entrega && (
                        <div><span className="font-medium">Instrucciones de entrega:</span> {destino.instrucciones_entrega}</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 lg:p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 h-full min-h-32">
                  <MapPinned className="h-8 w-8 lg:h-10 lg:w-10 text-gray-400 mb-2" />
                  <h3 className="text-gray-500 text-sm lg:text-base font-medium mb-1 text-center">No hay datos del destinatario</h3>
                  <p className="text-gray-400 text-xs lg:text-sm text-center mb-3">
                    {cliente 
                      ? "Agrega los datos de quien recibirá el paquete" 
                      : "Primero agrega los datos del remitente"}
                  </p>
                  <Button 
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-xs lg:text-sm"
                    onClick={() => setShowDestinoModal(true)}
                    disabled={!cliente}
                  >
                    <MapPinned className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                    Agregar Destinatario
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Contenido Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <Card>
          <CardHeader className="pb-2 bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle className="text-blue-800">Contenido del Envío</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                {!editingContenido && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-100"
                    onClick={() => setEditingContenido(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
                {contenido && !editingContenido && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-100"
                    onClick={() => onUpdateContenido('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {editingContenido ? (
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={tempContenido}
                    onChange={(e) => setTempContenido(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descripción del contenido..."
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {CONTENT_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setTempContenido(suggestion)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTempContenido(contenido);
                      setEditingContenido(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveContenido}
                    disabled={!tempContenido.trim()}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {contenido ? (
                  <div className="text-lg font-medium p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {contenido}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Package className="h-10 w-10 text-gray-400 mb-2" />
                    <h3 className="text-gray-500 font-medium mb-1">No hay descripción del contenido</h3>
                    <p className="text-gray-400 text-sm text-center mb-3">
                      Agrega una descripción del contenido del paquete
                    </p>
                    <Button 
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setEditingContenido(true)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Agregar Contenido
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Client Modal */}
      <AnimatePresence>
        {showClientModal && (
          <ClienteFormModal
            isOpen={showClientModal}
            onClose={() => setShowClientModal(false)}
            onClientSaved={handleClienteSaved}
            initialCliente={cliente || undefined}
          />
        )}
      </AnimatePresence>

      {/* Destino Modal */}
      <AnimatePresence>
        {showDestinoModal && (
          <DestinoFormModal
            isOpen={showDestinoModal}
            onClose={() => setShowDestinoModal(false)}
            onDestinoSaved={handleDestinoSaved}
            initialDestino={destino || undefined}
            clienteId={cliente?.id}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Dialogs */}
      <AnimatePresence>
        <ConfirmationDialog
          isOpen={showClienteRemoveConfirm}
          onClose={() => setShowClienteRemoveConfirm(false)}
          onConfirm={handleRemoveCliente}
          title="Eliminar Remitente"
          message="¿Estás seguro de que deseas eliminar los datos del remitente? Esto también eliminará los datos del destinatario ya que dependen del remitente."
        />
      </AnimatePresence>

      <AnimatePresence>
        <ConfirmationDialog
          isOpen={showDestinoRemoveConfirm}
          onClose={() => setShowDestinoRemoveConfirm(false)}
          onConfirm={handleRemoveDestino}
          title="Eliminar Destinatario"
          message="¿Estás seguro de que deseas eliminar los datos del destinatario?"
        />
      </AnimatePresence>
    </div>
  );
};

export default EnvioDataDisplay;