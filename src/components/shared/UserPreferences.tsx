// src/components/shared/UserPreferencesModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Settings,
  LogOut,
  Key,
  Sun,
  Moon,
  Monitor,
  Globe,
  BellRing,
  Shield
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/BadgeComponent';
import { Separator } from '../ui/SeparatorComponent';
import { Switch } from '../ui/Switch';
import { apiService } from '../../services/apiService';

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
  emailNotifications: boolean;
}

interface UserPreferencesModalProps {
  userData: UserData;
  onClose: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
}

export function UserPreferencesModal({
  userData,
  onClose,
  onChangePassword,
  onLogout
}: UserPreferencesModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    language: 'es',
    emailNotifications: true
  });
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Fetch user preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoadingPreferences(true);
        const userPrefs = await apiService.getUserPreferences();
        setPreferences(userPrefs);
        applyTheme(userPrefs.theme);
      } catch (error) {
        console.error('Failed to load preferences:', error);
        // Fallback to localStorage
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
        const storedLanguage = localStorage.getItem('language') as 'es' | 'en' || 'es';
        const storedNotifications = localStorage.getItem('emailNotifications') === 'true';
        
        setPreferences({
          theme: storedTheme,
          language: storedLanguage,
          emailNotifications: storedNotifications
        });
        applyTheme(storedTheme);
      } finally {
        setLoadingPreferences(false);
      }
    };
    
    fetchPreferences();
  }, []);

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    try {
      applyTheme(theme);
      setPreferences(prev => ({ ...prev, theme }));
      localStorage.setItem('theme', theme);
      await savePreferences({ ...preferences, theme });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const handleLanguageChange = async (language: 'es' | 'en') => {
    try {
      setPreferences(prev => ({ ...prev, language }));
      localStorage.setItem('language', language);
      await savePreferences({ ...preferences, language });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  const handleNotificationChange = async (checked: boolean) => {
    try {
      setPreferences(prev => ({ ...prev, emailNotifications: checked }));
      localStorage.setItem('emailNotifications', checked.toString());
      await savePreferences({ ...preferences, emailNotifications: checked });
    } catch (error) {
      console.error('Failed to save notification preference:', error);
    }
  };

  const savePreferences = async (prefs: UserPreferences) => {
    try {
      setSavingPreferences(true);
      await apiService.saveUserPreferences(prefs);
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de cuenta
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              &times;
            </button>
          </div>

          {loadingPreferences ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Info Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{userData.name}</h3>
                    <p className="text-sm text-gray-500">{userData.email}</p>
                    {userData.phone && (
                      <p className="text-sm text-gray-500">{userData.phone}</p>
                    )}
                    <Badge variant={userData.role === 'admin_user' ? 'default' : 'secondary'} className="mt-1">
                      <Shield className="h-3 w-3 mr-1" />
                      {userData.role === 'admin_user' ? 'Administrador' : 'Cliente'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Theme Settings */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Apariencia</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'light', label: 'Claro', icon: Sun },
                    { value: 'dark', label: 'Oscuro', icon: Moon },
                    { value: 'system', label: 'Sistema', icon: Monitor }
                  ].map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={preferences.theme === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleThemeChange(value as any)}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Language Settings */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Idioma</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'es', label: 'Español', flag: '🇪🇸' },
                    { value: 'en', label: 'English', flag: '🇺🇸' }
                  ].map(({ value, label, flag }) => (
                    <Button
                      key={value}
                      variant={preferences.language === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleLanguageChange(value as any)}
                      className="flex items-center gap-2"
                    >
                      <span>{flag}</span>
                      <span className="text-sm">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Notification Settings */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Notificaciones</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BellRing className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Notificaciones por email</span>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={handleNotificationChange}
                  />
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={onChangePassword}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Cambiar contraseña
                </Button>

                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={onLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </Button>
              </div>

              {/* Saving indicator */}
              {savingPreferences && (
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                  Guardando preferencias...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}