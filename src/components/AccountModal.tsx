import { User, Settings, Key, LogOut, Mail, Phone, CreditCard } from 'lucide-react';
import '../App.css'
import { AccountModalProps } from '../types';

export function AccountModal({ user, onClose, onChangePassword, onLogout, isLoading = false }: AccountModalProps) {
  return (
    <div className="account-modal-overlay">
      <div className="account-modal-container">
        {/* Modal Header */}
        <div className="account-modal-header">
          <div className="flex items-center gap-3">
            <div className="account-modal-icon-container">
            <User className="w-5 h-5" />
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <h2 className="text-lg font-semibold">Mi Cuenta</h2>
          </div>
          <button onClick={onClose} className="account-modal-close-btn">
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="account-modal-body">
          {/* User Info Section */}
          <div className="space-y-4">
            <div className="account-modal-user-info">
              <div>
                <h3 className="font-medium">{user.name}</h3>
                <p className="text-sm text-gray-500">
                  {user.role === 'admin_user' ? 'Administrador' : 'Cliente'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              <Mail className="w-5 h-5 text-gray-400" />
              <span>{user.email}</span>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              <Phone className="w-5 h-5 text-gray-400" />
              <span>{user.phone || 'No especificado'}</span>
            </div>
          </div>

          {/* Actions Section */}
          <div className="account-modal-actions">
            <button 
              onClick={onChangePassword}
              className="account-modal-action-btn"
            >
              <Key className="w-5 h-5 text-gray-600" />
              <span>Cambiar contraseña</span>
            </button>

            <button className="account-modal-action-btn">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <span>Métodos de pago</span>
            </button>

            <button className="account-modal-action-btn">
              <Settings className="w-5 h-5 text-gray-600" />
              <span>Preferencias</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="account-modal-footer">
          <button 
            onClick={onLogout}
            className="account-modal-logout-btn"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}