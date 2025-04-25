// Update Dashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../auth/authUtils';
import { DashboardCardProps } from '../types';
import { UserCreationModal } from './UserCreationModal';
import { User } from 'lucide-react';
import { AccountModal } from './AccountModal';
import { CSSTransition } from 'react-transition-group';
import { apiService } from '../services/apiService';
import { ClientModal } from './ClientModal';
import { DestinoModal } from './DestinoModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [createdUserId, setCreatedUserId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showClientOptions, setShowClientOptions] = useState(false);
  const [clientOptionsPosition, setClientOptionsPosition] = useState({ top: 0, left: 0 });
  const [showDestinoModal, setShowDestinoModal] = useState(false);
  const [showDestinoOptions, setShowDestinoOptions] = useState(false);
  const [destinoOptionsPosition, setDestinoOptionsPosition] = useState({ top: 0, left: 0 });

  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    phone: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
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
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await logout(); // Call the logout function and wait for it to complete
    // No need to navigate here as the logout function handles it
  };

  const handleClientItemClick = (item: string, event: React.MouseEvent) => {
    if (item === "Clientes / Remitentes") {
      const rect = event.currentTarget.getBoundingClientRect();
      setClientOptionsPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX
      });
      setShowClientOptions(prev => !prev);
    } else {
      switch (item) {
        case "Cotizar envío":
          navigate('/cotizador');
          break;
        case "Rastrear envío":
          navigate('/tracking');
          break;
        case "Recibir guías externas":
          // Handle receive guides action
          break;
        case "Historial de envíos":
          const isProd = window.location.hostname === 'app.enviadores.com.mx';


          if (isProd) {
            window.location.href = 'https://app.enviadores.com.mx/envios';
          } else {
            navigate('/dashboard/envios');
          }
          break;
        case "Destinatarios":
          navigate('/destinos');
          break;
      }
    }
  };

  const handleDestinatariosClick = (item: string, event: React.MouseEvent) => {
    if (item === "Destinatarios") {
      const rect = event.currentTarget.getBoundingClientRect();
      setDestinoOptionsPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX
      });
      setShowDestinoOptions(prev => !prev);
    } else {
      // Handle other items
    }
  };

  const handleClientSaved = (client: any) => {
    setSuccessMessage(`Cliente ${client.id ? 'actualizado' : 'creado'} correctamente`);
    setShowClientModal(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
          <h1 className="text-xl font-bold">
            Centro de Envíos
            <span className="text-sm font-light ml-2">
              ({role === 'admin_user' ? 'Admin' : 'Cliente'})
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowAccountModal(true)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <User className="w-5 h-5" />
            <span>Mi cuenta</span>
          </button>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar envíos, clientes..."
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard
            title="Envíos"
            items={[
              "Cotizar envío",
              "Clientes / Remitentes",
              "Destinatarios",
              "Historial de envíos",
              "Recibir guías externas",
              "Rastrear envío",
            ]}
            onItemClick={(item, e) => {
              if (item === "Destinatarios") {
                handleDestinatariosClick(item, e);
              } else if (item === "Clientes / Remitentes") {
                handleClientItemClick(item, e);
              } else {
                handleClientItemClick(item, e)
              }
            }}
          />
          <DashboardCard
            title="Proveedores"
            items={["Manuales", "Otros"]}
            onItemClick={(item) => console.log(item)}
          />
          <DashboardCard
            title="Usuarios"
            items={role === 'admin_user' ? ["Administrar", "Crear nuevo"] : ["Mi perfil"]}
            onItemClick={(item) => {
              if (item === "Crear nuevo") {
                setShowUserModal(true);
              } else if (item === "Administrar") {
                navigate('/user-management');
              }
            }}
          />
        </div>
      </main>

      {/* Client Options Dropdown */}
      {showClientOptions && (
        <div
          className="fixed z-40 bg-white shadow-lg rounded-md py-1 w-48"
          style={{
            top: `${clientOptionsPosition.top}px`,
            left: `${clientOptionsPosition.left}px`
          }}
        >
          <button
            onClick={() => {
              setShowClientModal(true);
              setShowClientOptions(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Crear o Modificar rápido
          </button>
          <button
            onClick={() => {
              // Check if we're in production (subdomain app.enviadores.com.mx)
              const isProd = window.location.hostname === 'app.enviadores.com.mx';

              // Navigate to the appropriate path based on environment
              if (isProd) {
                navigate('/clientes'); // In production, just use /clientes since we're already on app subdomain
              } else {
                navigate('/dashboard/clientes'); // In development, use the full path
              }

              setShowClientOptions(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Ver todos los remitentes
          </button>
        </div>
      )}

      {/* Client Modal */}
      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onClientSaved={handleClientSaved}
      />

      {/* Destino Options Dropdown */}
      {showDestinoOptions && (
        <div
          className="fixed z-40 bg-white shadow-lg rounded-md py-1 w-48"
          style={{
            top: `${destinoOptionsPosition.top}px`,
            left: `${destinoOptionsPosition.left}px`
          }}
        >
          <button
            onClick={() => {
              setShowDestinoModal(true);
              setShowDestinoOptions(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Crear o Modificar rápido
          </button>
          <button
            onClick={() => {
              navigate('/dashboard/destinos');
              setShowDestinoOptions(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Ver todos los destinos
          </button>
        </div>
      )}

      {/* Destino Modal */}
      <DestinoModal
        isOpen={showDestinoModal}
        onClose={() => setShowDestinoModal(false)}
        onDestinoSaved={(destino) => {
          // Handle success (show notification, etc.)
          setSuccessMessage(`Destino ${destino.id ? 'actualizado' : 'creado'} correctamente`);
          setShowDestinoModal(false);
        }}
      />

      {/* User Creation Modal */}
      {showUserModal && (
        <UserCreationModal
          onClose={() => setShowUserModal(false)}
          onCreate={(userId) => {
            setCreatedUserId(userId);
            setSuccessMessage(`Usuario creado con ID: ${userId}`);
            setShowUserModal(false);
          }}
          onError={(error) => setError(error)}
        />
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          {successMessage}
          <button
            onClick={() => setSuccessMessage('')}
            className="ml-2 text-white hover:text-gray-200"
          >
            &times;
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-2 text-white hover:text-gray-200"
          >
            &times;
          </button>
        </div>
      )}

      <CSSTransition
        in={showAccountModal}
        timeout={200}
        classNames="modal"
        unmountOnExit
      >
        {showAccountModal ? (
          <AccountModal
            user={{
              name: userData?.name || 'Usuario',
              email: userData?.email || '',
              phone: userData?.phone || '',
              role: userData?.role || 'customer_user'
            }}
            onClose={() => setShowAccountModal(false)}
            onChangePassword={() => {
              setShowAccountModal(false);
              navigate('/change-password');
            }}
            onLogout={handleLogout}
            isLoading={!userData}
          />
        ) : <></>}
      </CSSTransition>
    </div>
  );
}

function DashboardCard({ title, items, onItemClick }: DashboardCardProps) {
  return (
    <div className="bg-white shadow rounded p-4 relative group">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li
            key={i}
            className="p-2 hover:bg-gray-100 cursor-pointer rounded"
            onClick={(e) => onItemClick?.(item, e)}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}