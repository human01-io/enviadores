import React, { useEffect, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { useManuable } from '../hooks/useManuable';
import { CSSTransition } from 'react-transition-group';

interface ManuableAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManuableAccountModal: React.FC<ManuableAccountModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isLoading, error, accountBalance, getBalance, isAuthenticated, login } = useManuable();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated) {
        // If already authenticated, get the balance
        loadBalance();
      } else {
        // If not authenticated, try to login first
        handleLogin();
      }
    }
  }, [isOpen, isAuthenticated]);

  const loadBalance = async () => {
    try {
      await getBalance();
    } catch (err) {
      console.error("Error loading balance:", err);
    }
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      await login();
      // After successful login, get the balance
      await getBalance();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al conectar con Manuable';
      setLoginError(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <CSSTransition
      in={isOpen}
      timeout={300}
      classNames="modal"
      unmountOnExit
    >
      <div className="fixed inset-0  bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0" onClick={onClose}></div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div 
            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white">
              <h3 className="text-lg font-medium">Cuenta Manuable</h3>
              <button 
                onClick={onClose}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {loginLoading || isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">
                    {loginLoading ? 'Conectando con Manuable...' : 'Cargando información...'}
                  </span>
                </div>
              ) : loginError || error ? (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                  <div className="font-medium">Error</div>
                  <div>{loginError || error}</div>
                  <button 
                    onClick={handleLogin}
                    className="mt-3 flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" /> Intentar nuevamente
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="text-lg font-semibold mb-1">Estado de la cuenta</div>
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <div>
                        <div className="text-sm text-gray-500">Saldo disponible</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {accountBalance ? (
                            new Intl.NumberFormat('es-MX', { 
                              style: 'currency', 
                              currency: accountBalance.currency || 'MXN' 
                            }).format(accountBalance.balance || 0)
                          ) : (
                            '$ 0.00 MXN'
                          )}
                        </div>
                        {process.env.NODE_ENV === 'development' && (
                          <div className="text-xs text-gray-400">
                            Raw value: {accountBalance?.balance || 0}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={loadBalance} 
                        className="text-blue-600 hover:text-blue-800"
                        title="Actualizar saldo"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                    {accountBalance?.lastUpdated && (
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        Última actualización: {new Date(accountBalance.lastUpdated).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-lg font-semibold mb-2">Acciones rápidas</div>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
                        Recargar saldo
                      </button>
                      <button className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
                        Ver historial
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 text-right">
              <button
                onClick={onClose}
                className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </CSSTransition>
  );
};