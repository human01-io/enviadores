import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../auth/authUtils';
import { 
  Search, 
  Package, 
  Users, 
  TruckIcon, 
  Bell,
  FileText,
  MapPin,
  Send,
  History,
  UserPlus,
  Building2,
  Zap,
  Settings,
  BarChart3,
  User,
  Loader2
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/BadgeComponent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/CardComponent';
import { Separator } from './ui/SeparatorComponent';
import { ToastContainer, toast } from './ui/Toast';
import { Cliente, Destino } from '../types';
import logo from '../assets/logo.svg';

// Lazy load modals for better performance
const UserCreationModal = lazy(() => 
  import('./UserCreationModal').then(module => ({ 
    default: module.UserCreationModal 
  }))
);
const ClienteFormModal = lazy(() => import('./shared/ClienteFormModal'));
const DestinoFormModal = lazy(() => import('./shared/DestinoFormModal'));
const ClienteSelector = lazy(() => import('./shared/ClienteSelector'));
const ChangePasswordModal = lazy(() => 
  import('./ChangePasswordModal').then(module => ({ 
    default: module.ChangePasswordModal 
  }))
);
const AccountModal = lazy(() => 
  import('./AccountModal').then(module => ({ 
    default: module.AccountModal 
  }))
);
const ManuableAccountModal = lazy(() => 
  import('./ManuableAccountModal').then(module => ({ 
    default: module.ManuableAccountModal 
  }))
);
const ManuableLabelsModal = lazy(() => 
  import('./ManuableLabelsModal').then(module => ({ 
    default: module.ManuableLabelsModal 
  }))
);
const ManuableSurchargesModal = lazy(() => 
  import('./ManuableSurchargesModal').then(module => ({ 
    default: module.ManuableSurchargesModal 
  }))
);

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface DashboardItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: (item: string, event: React.MouseEvent) => void;
  variant?: 'default' | 'primary' | 'featured';
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
}

// Custom hook for modal management
function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return { isOpen, open, close, toggle };
}

export default function ImprovedDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use custom hook for modal state management
  const clientModal = useModal();
  const destinoModal = useModal();
  const manuableAccountModal = useModal();
  const manuableLabelsModal = useModal();
  const manuableSurchargesModal = useModal();
  const userModal = useModal();
  const accountModal = useModal();
  const passwordModal = useModal();

  // Reference for the dashboard container (for keyboard handling)
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // State for customer selection in destino modal
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  
  // Additional state for the client selection flow
  const [showClienteSelector, setShowClienteSelector] = useState(false);
  
  // Other state variables
  const [createdUserId, setCreatedUserId] = useState('');
  const [showClientOptions, setShowClientOptions] = useState(false);
  const [clientOptionsPosition, setClientOptionsPosition] = useState({ top: 0, left: 0 });
  const [showDestinoOptions, setShowDestinoOptions] = useState(false);
  const [destinoOptionsPosition, setDestinoOptionsPosition] = useState({ top: 0, left: 0 });
  const [showManuableOptions, setShowManuableOptions] = useState(false);
  const [manuableOptionsPosition, setManuableOptionsPosition] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const [userData, setUserData] = useState<UserData>({
    name: 'Usuario',
    email: '',
    phone: '',
    role: 'customer_user'
  });

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getUserProfile();
        setUserData({
          name: response.name || 'Usuario',
          email: response.email,
          phone: response.phone,
          role: response.role
        });
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUserData({
          name: 'Usuario',
          email: '',
          phone: '',
          role: 'customer_user'
        });
        toast.error("No se pudo cargar la información del usuario");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated]);

  // Handle successful password change
  const handlePasswordChangeSuccess = useCallback(() => {
    passwordModal.close();
    toast.success('Contraseña actualizada correctamente');
  }, [passwordModal]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error('Error al cerrar sesión');
    }
  }, []);

  // Client item click handler
  const handleClientItemClick = useCallback((item: string, event: React.MouseEvent) => {
    if (item === "Clientes / Remitentes") {
      const rect = event.currentTarget.getBoundingClientRect();
      setClientOptionsPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX
      });
      setShowClientOptions(prev => !prev);
      // Close other dropdowns
      setShowDestinoOptions(false);
      setShowManuableOptions(false);
    } else {
      switch (item) {
        case "Cotizar envío":
          navigate('/cotizador');
          break;
        case "Rastrear envío":
          navigate('/tracking');
          break;
        case "Recibir guías externas":
          toast.info("Funcionalidad en desarrollo");
          break;
        case "Historial de envíos":
          const isProd = window.location.hostname === 'app.enviadores.com.mx';
          if (isProd) {
            window.location.href = 'https://app.enviadores.com.mx/envios';
          } else {
            navigate('/dashboard/envios');
          }
          break;
      }
    }
  }, [navigate]);

  // Provider item click handler
  const handleProviderItemClick = useCallback((item: string, event: React.MouseEvent) => {
    if (item === "Manuable") {
      const rect = event.currentTarget.getBoundingClientRect();
      setManuableOptionsPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX
      });
      setShowManuableOptions(prev => !prev);
      // Close other dropdowns
      setShowClientOptions(false);
      setShowDestinoOptions(false);
    } else {
      console.log(`Selected provider: ${item}`);
      toast.info("Otros proveedores estarán disponibles próximamente");
    }
  }, []);

  // Update destination selection to handle the client selector flow
  const handleDestinatariosClick = useCallback((item: string, event: React.MouseEvent) => {
    if (item === "Destinatarios") {
      const rect = event.currentTarget.getBoundingClientRect();
      setDestinoOptionsPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX
      });
      setShowDestinoOptions(prev => !prev);
      // Close other dropdowns
      setShowClientOptions(false);
      setShowManuableOptions(false);
    }
  }, []);

  const handleClientSaved = useCallback((cliente: Cliente) => {
    toast.success(`Cliente ${cliente.id ? 'actualizado' : 'creado'} correctamente`);
    clientModal.close();
    
    // Set the selected client ID for potential destination operations
    if (cliente.id) {
      setSelectedClienteId(cliente.id);
    }
  }, [clientModal]);
  
  // Handle cliente selection for destino modal
  const handleClienteSelected = useCallback((cliente: Cliente) => {
    if (cliente && cliente.id) {
      setSelectedClienteId(cliente.id);
      setShowClienteSelector(false);
      // Open destino modal immediately after selecting a client
      destinoModal.open();
    }
  }, [destinoModal]);

  // Keyboard event handler for accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close modals with Escape key
      if (event.key === 'Escape') {
        if (clientModal.isOpen) clientModal.close();
        if (destinoModal.isOpen) destinoModal.close();
        if (manuableAccountModal.isOpen) manuableAccountModal.close();
        if (manuableLabelsModal.isOpen) manuableLabelsModal.close();
        if (manuableSurchargesModal.isOpen) manuableSurchargesModal.close();
        if (userModal.isOpen) userModal.close();
        if (accountModal.isOpen) accountModal.close();
        if (passwordModal.isOpen) passwordModal.close();
        
        // Close dropdowns
        setShowClientOptions(false);
        setShowDestinoOptions(false);
        setShowManuableOptions(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    clientModal, 
    destinoModal, 
    manuableAccountModal, 
    manuableLabelsModal, 
    manuableSurchargesModal, 
    userModal, 
    accountModal, 
    passwordModal
  ]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if click is outside dropdown elements
      if (showClientOptions || showDestinoOptions || showManuableOptions) {
        const targetElement = event.target as HTMLElement;
        // Check if the click is outside of dropdown areas
        const isOutsideClick = !targetElement.closest('.dropdown-menu');
        
        if (isOutsideClick) {
          setShowClientOptions(false);
          setShowDestinoOptions(false);
          setShowManuableOptions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showClientOptions, showDestinoOptions, showManuableOptions]);

  if (!isAuthenticated) {
    return null;
  }

  // Render loading spinner when data is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="mt-2 text-gray-600">Cargando su información...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={dashboardRef} className="min-h-screen bg-gray-50">
      {/* Header - Full width, minimal padding */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Left section */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img src={logo} alt="Logo" className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Centro de Envíos
                  </h1>
                  <Badge variant={role === 'admin_user' ? 'default' : 'secondary'} className="text-xs">
                    {role === 'admin_user' ? 'Administrador' : 'Cliente'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative transition-transform hover:scale-110 focus:ring-2 focus:ring-blue-300"
                aria-label="Notificaciones"
                title="Notificaciones"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <button
                onClick={accountModal.open}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-md px-2 py-1"
                aria-label="Mi cuenta"
              >
                <User className="w-5 h-5" />
                <span>Mi cuenta</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 rounded-md px-2 py-1"
                aria-label="Cerrar sesión"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full width, minimal padding */}
      <main className="px-4 sm:px-6 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar envíos, clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-300 focus:border-blue-500 transition-shadow duration-200"
              aria-label="Buscar"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  toast.info(`Buscando: ${searchQuery}`);
                }
              }}
            />
          </div>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Envíos Card */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900">Envíos</CardTitle>
                  <CardDescription className="text-gray-600">Gestiona tus envíos y cotizaciones</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <DashboardItem 
                icon={Send} 
                label="Cotizar envío" 
                onClick={(item, e) => handleClientItemClick(item, e)}
                variant="primary"
              />
              <DashboardItem 
                icon={Building2} 
                label="Clientes / Remitentes" 
                onClick={(item, e) => handleClientItemClick(item, e)}
              />
              <DashboardItem 
                icon={MapPin} 
                label="Destinatarios" 
                onClick={(item, e) => handleDestinatariosClick(item, e)}
              />
              <DashboardItem 
                icon={History} 
                label="Historial de envíos" 
                onClick={(item, e) => handleClientItemClick(item, e)}
              />
              <DashboardItem 
                icon={FileText} 
                label="Recibir guías externas" 
                onClick={(item, e) => handleClientItemClick(item, e)}
              />
              <DashboardItem 
                icon={Search} 
                label="Rastrear envío" 
                onClick={(item, e) => handleClientItemClick(item, e)}
              />
            </CardContent>
          </Card>

          {/* Proveedores Card */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <TruckIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900">Proveedores</CardTitle>
                  <CardDescription className="text-gray-600">Gestiona servicios de paquetería</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <DashboardItem 
                icon={Zap} 
                label="Manuable" 
                onClick={(item, e) => handleProviderItemClick(item, e)}
                variant="featured"
              />
              <DashboardItem 
                icon={TruckIcon} 
                label="Otros" 
                onClick={(item, e) => handleProviderItemClick(item, e)}
              />
            </CardContent>
          </Card>

          {/* Usuarios Card */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900">Usuarios</CardTitle>
                  <CardDescription className="text-gray-600">Administra usuarios del sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {role === 'admin_user' ? (
                <>
                  <DashboardItem 
                    icon={Settings} 
                    label="Administrar" 
                    onClick={() => {
                      const isProd = window.location.hostname === 'app.enviadores.com.mx';
                      if (isProd) {
                        navigate('/usuarios');
                      } else {
                        navigate('/dashboard/usuarios');
                      }
                    }}
                  />
                  <DashboardItem 
                    icon={UserPlus} 
                    label="Crear nuevo" 
                    onClick={() => userModal.open()}
                    variant="primary"
                  />
                </>
              ) : (
                <DashboardItem 
                  icon={Users} 
                  label="Mi perfil" 
                  onClick={() => accountModal.open()}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Section - Full width */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Envíos este mes" value="127" change="+12%" />
          <StatCard title="Ahorro total" value="$15,420" change="+8%" />
          <StatCard title="Clientes activos" value="48" change="+3%" />
          <StatCard title="Envíos pendientes" value="12" change="-5%" />
        </div>
      </main>

      {/* Client Options Dropdown */}
      {showClientOptions && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setShowClientOptions(false);
            }}
            aria-hidden="true"
          ></div>
          <div
            className="fixed z-50 bg-white shadow-lg rounded-lg border border-gray-200 py-1 w-48 dropdown-menu"
            style={{
              top: `${clientOptionsPosition.top}px`,
              left: `${clientOptionsPosition.left}px`
            }}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="client-options-menu"
          >
            <button
              onClick={() => {
                clientModal.open();
                setShowClientOptions(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors duration-150"
              role="menuitem"
            >
              Crear o Modificar rápido
            </button>
            <button
              onClick={() => {
                const isProd = window.location.hostname === 'app.enviadores.com.mx';
                if (isProd) {
                  navigate('/clientes');
                } else {
                  navigate('/dashboard/clientes');
                }
                setShowClientOptions(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors duration-150"
              role="menuitem"
            >
              Ver todos los remitentes
            </button>
          </div>
        </>
      )}

      {/* Destino Options Dropdown */}
      {showDestinoOptions && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setShowDestinoOptions(false);
            }}
            aria-hidden="true"
          ></div>
          <div
            className="fixed z-50 bg-white shadow-lg rounded-lg border border-gray-200 py-1 w-48 dropdown-menu"
            style={{
              top: `${destinoOptionsPosition.top}px`,
              left: `${destinoOptionsPosition.left}px`
            }}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="destino-options-menu"
          >
            <button
              onClick={() => {
                setShowClienteSelector(true);
                setShowDestinoOptions(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors duration-150"
              role="menuitem"
            >
              Crear o Modificar rápido
            </button>
            <button
              onClick={() => {
                const isProd = window.location.hostname === 'app.enviadores.com.mx';
                if (isProd) {
                  navigate('/destinos');
                } else {
                  navigate('/dashboard/destinos');
                }
                setShowDestinoOptions(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors duration-150"
              role="menuitem"
            >
              Ver todos los destinos
            </button>
          </div>
        </>
      )}

      {/* Manuable Options Dropdown */}
      {showManuableOptions && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setShowManuableOptions(false);
            }}
            aria-hidden="true"
          ></div>
          <div
            className="fixed z-50 bg-white shadow-lg rounded-lg border border-gray-200 py-1 w-48 dropdown-menu"
            style={{
              top: `${manuableOptionsPosition.top}px`,
              left: `${manuableOptionsPosition.left}px`
            }}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="manuable-options-menu"
          >
            <button
              onClick={() => {
                manuableAccountModal.open();
                setShowManuableOptions(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors duration-150"
              role="menuitem"
            >
              Ver saldo de cuenta
            </button>
            <button
              onClick={() => {
                manuableLabelsModal.open();
                setShowManuableOptions(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors duration-150"
              role="menuitem"
            >
              Ver guías generadas
            </button>
            <button
              onClick={() => {
                manuableSurchargesModal.open();
                setShowManuableOptions(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors duration-150"
              role="menuitem"
            >
              Ver sobrecargos
            </button>
          </div>
        </>
      )}

      {/* All Modals - Using Suspense for lazy loading */}
      <Suspense fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
            <p className="mt-2 text-gray-600">Cargando...</p>
          </div>
        </div>
      }>
        {/* Client Selector */}
        {showClienteSelector && (
          <ClienteSelector
            onClienteSelected={handleClienteSelected}
            onCancel={() => setShowClienteSelector(false)}
          />
        )}
        {/* Client Modal */}
        {clientModal.isOpen && (
          <ClienteFormModal
            isOpen={clientModal.isOpen}
            onClose={clientModal.close}
            onClientSaved={handleClientSaved}
            initialCliente={null}
          />
        )}

        {/* Destino Modal */}
        {destinoModal.isOpen && (
          <DestinoFormModal
            isOpen={destinoModal.isOpen}
            onClose={destinoModal.close}
            onDestinoSaved={(destino: Destino) => {
              toast.success(`Destino ${destino.id ? 'actualizado' : 'creado'} correctamente`);
              destinoModal.close();
            }}
            initialDestino={null}
            clienteId={selectedClienteId}
          />
        )}

        {/* Manuable Account Modal */}
        {manuableAccountModal.isOpen && (
          <ManuableAccountModal 
            isOpen={manuableAccountModal.isOpen}
            onClose={manuableAccountModal.close}
          />
        )}

        {/* Manuable Labels Modal */}
        {manuableLabelsModal.isOpen && (
          <ManuableLabelsModal
            isOpen={manuableLabelsModal.isOpen}
            onClose={manuableLabelsModal.close}
          />
        )}
        
        {/* Manuable Surcharges Modal */}
        {manuableSurchargesModal.isOpen && (
          <ManuableSurchargesModal
            isOpen={manuableSurchargesModal.isOpen}
            onClose={manuableSurchargesModal.close}
          />
        )}

        {/* User Creation Modal */}
        {userModal.isOpen && (
          <UserCreationModal
            onClose={userModal.close}
            onCreate={(userId) => {
              setCreatedUserId(userId);
              toast.success(`Usuario creado con ID: ${userId}`);
              userModal.close();
            }}
            onError={(error) => {
              toast.error(error);
            }}
          />
        )}

        {/* Account Modal */}
        {accountModal.isOpen && (
          <AccountModal
            user={{
              name: userData?.name || 'Usuario',
              email: userData?.email || '',
              phone: userData?.phone || '',
              role: userData?.role || 'customer_user'
            }}
            onClose={accountModal.close}
            onChangePassword={() => {
              accountModal.close();
              passwordModal.open();
            }}
            onLogout={handleLogout}
            isLoading={!userData}
          />
        )}

        {/* Change Password Modal */}
        {passwordModal.isOpen && (
          <ChangePasswordModal
            onClose={passwordModal.close}
            onSuccess={handlePasswordChangeSuccess}
          />
        )}
      </Suspense>

      {/* Toast Container for notifications */}
      <ToastContainer 
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />
    </div>
  );
}

// Memoized Dashboard Item component for better performance
const DashboardItem = React.memo(function DashboardItem({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'default' 
}: DashboardItemProps) {
  const baseClasses = "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 cursor-pointer group";
  const variantClasses = {
    default: "hover:bg-gray-50 text-gray-700 hover:text-gray-900 focus:ring-2 focus:ring-gray-200",
    primary: "hover:bg-blue-50 text-blue-700 hover:text-blue-800 border border-blue-100 focus:ring-2 focus:ring-blue-200",
    featured: "bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200 focus:ring-2 focus:ring-yellow-200"
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]}`}
      onClick={(e) => onClick(label, e)}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(label, e as unknown as React.MouseEvent);
        }
      }}
    >
      <Icon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
      <span className="text-sm font-medium">
        {label}
      </span>
    </div>
  );
});

// Memoized Stat Card component for better performance
const StatCard = React.memo(function StatCard({ title, value, change }: StatCardProps) {
  const isPositive = change.startsWith('+');
  
  return (
    <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
          <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-medium">{change}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});