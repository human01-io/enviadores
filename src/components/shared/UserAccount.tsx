// src/components/shared/UserAccount.tsx
import { useState, useRef, useEffect } from 'react';
import {
  Settings,
  LogOut,
  Key,
  Mail,
  Phone,
  ChevronDown,
  Shield
} from 'lucide-react';
import { Badge } from '../ui/BadgeComponent';
import { ChangePasswordModal } from '../ChangePasswordModal';
import { UserPreferencesModal } from './UserPreferences';

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface UserAccountProps {
  userData: UserData;
  onLogout: () => void;
  variant?: 'dropdown' | 'button';
  className?: string;
}

export function UserAccount({ 
  userData, 
  onLogout, 
  variant = 'dropdown',
  className = '' 
}: UserAccountProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleDisplay = (role: string) => {
    return role === 'admin_user' ? 'Administrador' : 'Cliente';
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin_user' ? 'default' : 'secondary';
  };

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={() => setShowPreferences(true)}
          className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 ${className}`}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {userData.name.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline-block font-medium text-gray-900">{userData.name}</span>
        </button>

        {/* Preferences Modal */}
        {showPreferences && (
          <UserPreferencesModal
            userData={userData}
            onClose={() => setShowPreferences(false)}
            onChangePassword={() => {
              setShowPreferences(false);
              setShowPasswordModal(true);
            }}
            onLogout={onLogout}
          />
        )}

        {/* Password Modal */}
        {showPasswordModal && (
          <ChangePasswordModal
            onClose={() => setShowPasswordModal(false)}
            onSuccess={() => setShowPasswordModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 ${className}`}
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {userData.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col items-start text-left">
          <span className="text-sm font-medium text-gray-900">
            {userData.name}
          </span>
          <Badge variant={getRoleBadgeVariant(userData.role)} className="text-xs">
            {getRoleDisplay(userData.role)}
          </Badge>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {userData.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{userData.name}</p>
                <Badge variant={getRoleBadgeVariant(userData.role)} className="mt-1">
                  {getRoleDisplay(userData.role)}
                </Badge>
              </div>
            </div>
            
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <span className="truncate">{userData.email}</span>
              </div>
              {userData.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{userData.phone}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="py-1">
            <button
              onClick={() => {
                setShowPreferences(true);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-gray-700"
            >
              <Settings className="mr-2 h-4 w-4" />
              Preferencias
            </button>
            
            <button
              onClick={() => {
                setShowPasswordModal(true);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-gray-700"
            >
              <Key className="mr-2 h-4 w-4" />
              Cambiar contraseña
            </button>
            
            <hr className="my-1" />
            
            <button
              onClick={() => {
                onLogout();
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <UserPreferencesModal
          userData={userData}
          onClose={() => setShowPreferences(false)}
          onChangePassword={() => {
            setShowPreferences(false);
            setShowPasswordModal(true);
          }}
          onLogout={onLogout}
        />
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
}