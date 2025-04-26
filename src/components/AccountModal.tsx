import { useState, useEffect } from 'react';
import { User, Settings, Key, LogOut, Mail, Phone, Moon, Sun, Monitor, Globe, BellRing } from 'lucide-react';
import { apiService } from '../services/apiService';
import '../App.css';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
  emailNotifications: boolean;
}

interface AccountModalProps {
  user: {
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  onClose: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  isLoading?: boolean;
}

export function AccountModal({ 
  user, 
  onClose, 
  onChangePassword, 
  onLogout, 
  isLoading = false 
}: AccountModalProps) {
  const [view, setView] = useState<'account' | 'preferences'>('account');
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    language: 'es',
    emailNotifications: true
  });
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch user preferences when component mounts
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoadingPreferences(true);
        const userPrefs = await apiService.getUserPreferences();
        setPreferences(userPrefs);
        
        // Apply theme immediately
        applyTheme(userPrefs.theme);
      } catch (error) {
        console.error('Failed to load preferences:', error);
        setError('No se pudieron cargar las preferencias');
        
        // Use localStorage as fallback
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
        const storedLanguage = localStorage.getItem('language') as 'es' | 'en' || 'es';
        const storedNotifications = localStorage.getItem('emailNotifications') === 'true';
        
        setPreferences({
          theme: storedTheme,
          language: storedLanguage,
          emailNotifications: storedNotifications
        });
        
        // Apply theme from localStorage
        applyTheme(storedTheme);
      } finally {
        setLoadingPreferences(false);
      }
    };
    
    fetchPreferences();
  }, []);

  // Apply theme function
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

  // Handle theme change
  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    try {
      // Apply theme immediately
      applyTheme(theme);
      
      // Update state
      setPreferences(prev => ({ ...prev, theme }));
      
      // Save to localStorage as fallback
      localStorage.setItem('theme', theme);
      
      // Save to server
      await savePreferences({ ...preferences, theme });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      setError('No se pudo guardar la preferencia de tema');
    }
  };

  // Handle language change
  const handleLanguageChange = async (language: 'es' | 'en') => {
    try {
      // Update state
      setPreferences(prev => ({ ...prev, language }));
      
      // Save to localStorage as fallback
      localStorage.setItem('language', language);
      
      // Save to server
      await savePreferences({ ...preferences, language });
    } catch (error) {
      console.error('Failed to save language preference:', error);
      setError('No se pudo guardar la preferencia de idioma');
    }
  };

  // Handle notification change
  const handleNotificationChange = async (checked: boolean) => {
    try {
      // Update state
      setPreferences(prev => ({ ...prev, emailNotifications: checked }));
      
      // Save to localStorage as fallback
      localStorage.setItem('emailNotifications', checked.toString());
      
      // Save to server
      await savePreferences({ ...preferences, emailNotifications: checked });
    } catch (error) {
      console.error('Failed to save notification preference:', error);
      setError('No se pudo guardar la preferencia de notificaciones');
    }
  };

  // Save all preferences to server
  const savePreferences = async (prefs: UserPreferences) => {
    try {
      setSavingPreferences(true);
      await apiService.saveUserPreferences(prefs);
      setSuccessMessage('Preferencias guardadas correctamente');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <div className="account-modal-overlay">
      <div className="account-modal-container">
        {/* Modal Header */}
        <div className="account-modal-header">
          <div className="flex items-center gap-3">
            <div className="account-modal-icon-container">
              {view === 'account' ? (
                <User className="w-5 h-5" />
              ) : (
                <Settings className="w-5 h-5" />
              )}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <h2 className="text-lg font-semibold">
              {view === 'account' ? 'Mi Cuenta' : 'Preferencias'}
            </h2>
          </div>
          <button onClick={onClose} className="account-modal-close-btn">
            &times;
          </button>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="mx-4 mt-2 p-2 bg-green-100 text-green-800 rounded-md text-sm">
            {successMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mx-4 mt-2 p-2 bg-red-100 text-red-800 rounded-md text-sm">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 text-red-700 hover:text-red-900"
            >
              &times;
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="account-modal-body">
          {view === 'account' ? (
            /* Account Info View */
            <>
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

                <button 
                  onClick={() => setView('preferences')}
                  className="account-modal-action-btn"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span>Preferencias</span>
                </button>
              </div>
            </>
          ) : (
            /* Preferences View */
            <div className="space-y-6">
              {loadingPreferences ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  <div>
                    <button 
                      onClick={() => setView('account')}
                      className="mb-4 text-blue-600 flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Volver
                    </button>

                    {/* Theme Preferences */}
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Tema</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={preferences.theme === 'light'}
                          onChange={() => handleThemeChange('light')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <Sun className="w-5 h-5 text-yellow-500" />
                        <span>Claro</span>
                      </label>

                      <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={preferences.theme === 'dark'}
                          onChange={() => handleThemeChange('dark')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <Moon className="w-5 h-5 text-blue-900" />
                        <span>Oscuro</span>
                      </label>

                      <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="system"
                          checked={preferences.theme === 'system'}
                          onChange={() => handleThemeChange('system')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <Monitor className="w-5 h-5 text-gray-500" />
                        <span>Sistema</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Language Preferences */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Idioma</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="language"
                          value="es"
                          checked={preferences.language === 'es'}
                          onChange={() => handleLanguageChange('es')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <Globe className="w-5 h-5 text-gray-500" />
                        <span>Español</span>
                      </label>

                      <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="language"
                          value="en"
                          checked={preferences.language === 'en'}
                          onChange={() => handleLanguageChange('en')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <Globe className="w-5 h-5 text-gray-500" />
                        <span>English</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Notification Preferences */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Notificaciones</h3>
                    <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) => handleNotificationChange(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <BellRing className="w-5 h-5 text-gray-500" />
                      <span>Recibir notificaciones por email</span>
                    </label>
                  </div>

                  {/* Saving indicator */}
                  {savingPreferences && (
                    <div className="flex items-center justify-center text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                      Guardando preferencias...
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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