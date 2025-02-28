import React, { useEffect, useState } from 'react';
import { MapPin, Mail, Phone, MessageSquare } from 'lucide-react';
import './App.css';

/**
 * Renders your keywords as a simple "chip" layout.
 */
function KeywordsCloud() {
  const keywords = [
    { text: "ENVÍOS NACIONALES", color: "#FF3E1D" },
    { text: "ENVIOS INTERNACIONALES", color: "#001F54" },
    { text: "MANEJO DEVOLUCIONES", color: "#FFD60A" },
    { text: "VENTA DE GUIAS ELECTRONICAS MULTIMARCA", color: "#001F54" },
    { text: "RECOLECCIONES", color: "#FF3E1D" },
    { text: "LOGÍSTICA PARA PYMES", color: "#001F54" },
    { text: "TARIFAS COMPETITIVAS", color: "#001F54" },
    { text: "SOLUCIONES LOGISTICAS PERSONALIZADAS", color: "#001F54" },
    { text: "CONFIABLE", color: "#FF3E1D" },
    { text: "EFICIENTE", color: "#FFD60A" },
    { text: "ASEQUIBLE", color: "#001F54" },
    { text: "RÁPIDO", color: "#FF3E1D" },
    { text: "SEGURO", color: "#FFD60A" },
    { text: "NACIONAL", color: "#001F54" },
    { text: "FACIL", color: "#FF3E1D" },
  ];

  return (
    <div className="keywords-cloud">
      {keywords.map((k, i) => (
        <span
        key={i}
        className="keyword-chip"
        style={{ '--chip-color': k.color } as React.CSSProperties}
      >
        {k.text}
      </span>
      ))}
    </div>
  );
}

function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-white text-blue-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center">
          <div className={`logo-container ${isLoaded ? 'loaded' : ''}`}>
            <div className="logo-wrapper enviadores">
              <div className="logo-placeholder bg-blue-50 rounded-lg flex items-center justify-center p-4">
                <div className="text-3xl font-bold text-white">
                  <span className="text-blue-900">E</span>
                  <span className="text-blue-900">D</span>
                  <span className="text-red-500">→</span>
                </div>
              </div>
              <p className="text-center mt-2 font-semibold">ENVIADORES</p>
            </div>
            <div className="logo-wrapper devuelve">
              <div className="logo-placeholder bg-blue-50 rounded-lg flex items-center justify-center p-4">
                <div className="text-3xl font-bold text-yellow-300">
                  <span>D</span>
                  <span className="text-yellow-300">←</span>
                </div>
              </div>
              <p className="text-center mt-2 font-semibold text-yellow-300">DEVUELVE</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className={`text-center max-w-3xl mx-auto fade-in ${isLoaded ? 'loaded' : ''}`}>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Estamos construyendo algo increíble para ti
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-blue-700">
            Nuestro sitio web estará en línea pronto
          </p>
          
          <div className="bg-blue-50 rounded-xl p-6 md:p-8 mb-12 shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Servicios</h2>

            {/* Simple Keyword Chips */}
            <KeywordsCloud />
          </div>
        </div>

        {/* Contact Information */}
        <div className={`max-w-3xl mx-auto fade-in delay-300 ${isLoaded ? 'loaded' : ''}`}>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Contáctanos</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-xl p-6 hover:bg-blue-100 transition-all shadow-md">
              <div className="flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Ponte en Contacto</h3>
                
                <div className="space-y-4 flex-grow">
                  <a
                    href="mailto:contacto@enviadores.com.mx"
                    className="flex items-center gap-3 hover:text-blue-600 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span>contacto@enviadores.com.mx</span>
                  </a>
                  
                  <a
                    href="https://wa.me/525523187479"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:text-green-600 transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>WhatsApp: +52 55 2318 7479</span>
                  </a>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5" />
                      <span>Teléfono:</span>
                    </div>
                    <div className="pl-8 space-y-1">
                      <a
                        href="tel:+527773184838"
                        className="block hover:text-blue-600 transition-colors"
                      >
                        +52 777 318 4838
                      </a>
                      <a
                        href="tel:+527773116555"
                        className="block hover:text-blue-600 transition-colors"
                      >
                        +52 777 311 6555
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-6 hover:bg-blue-100 transition-all shadow-md">
              <div className="flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Visítanos</h3>
                
                <div className="flex-grow">
                  <a 
                    href="https://maps.app.goo.gl/Mez56cUDKXTJ9XTA6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full"
                  >
                    <div className="flex items-center gap-3 mb-4 hover:text-blue-600 transition-colors">
                      <MapPin className="w-5 h-5" />
                      <span>Encuéntranos en Google Maps</span>
                    </div>
                    
                    <div className="map-container rounded-lg overflow-hidden h-48 flex items-center justify-center">
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d471.77883567564305!2d-99.22684238544433!3d18.921180660063214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85cdde31062fd69b%3A0xe02d3d0f88e7b968!2sENVIADORES-%20ESTAFETA%2C%20DHL%2C%20FEDEX!5e0!3m2!1sen!2smx!4v1740681739529!5m2!1sen!2smx"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Ubicación de Enviadores"
                      ></iframe>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-blue-100">
        <div className="text-center text-blue-700">
          <p className="mb-2">© {new Date().getFullYear()} Enviadores. Todos los derechos reservados.</p>
          <div className="flex flex-col md:flex-row justify-center md:space-x-6 space-y-4 md:space-y-0 mt-4">
            <div className="md:max-w-xs">
              <h3 className="font-semibold mb-1">Misión</h3>
              <p className="text-sm text-blue-600">
                Proporcionar soluciones logísticas simples, accesibles y eficientes adaptadas a las necesidades específicas de nuestros clientes.
              </p>
            </div>
            <div className="md:max-w-xs">
              <h3 className="font-semibold mb-1">Visión</h3>
              <p className="text-sm text-blue-600">
                Convertirnos en líderes en logística y logística inversa en México, ayudando a redefinir las devoluciones, la logística nacional y la logística para emprendedores como una herramienta clave para el éxito del comercio electrónico.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;