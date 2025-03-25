// run this first npm install react-router-dom

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MapPin, Mail, Phone, MessageSquare } from 'lucide-react';
import EnviadoresLogo from './assets/ENVIADORES-Logo.png';
import './App.css';
import Cotizador from "./components/Cotizador";

interface HeaderProps {
  activeSection: string;
}

/**
 * Renders your keywords as a simple "chip" layout.
 */
function KeywordsCloud(): JSX.Element {
  const keywords = [
    { text: "ENVÍOS NACIONALES" },
    { text: "ENVIOS INTERNACIONALES" },
    { text: "MANEJO DE DEVOLUCIONES" },
    { text: "VENTA DE GUIAS ELECTRONICAS MULTIMARCA" },
    { text: "RECOLECCIONES" },
    { text: "TARIFAS COMPETITIVAS" },
    { text: "SOLUCIONES LOGISTICAS PERSONALIZADAS" },
  ];

  const attributes = [
    { title: "Venta de guías Multi-marcas y Guias por Volumen", description: "Ofrecemos tarifas competitivas en envíos nacionales e internacionales." },
    { title: "Gestión de devoluciones con Devuelve", description: "Estamos desarrollando Devuelve, una solución innovadora para transformar la logística inversa en México." },
    { title: "Servicios logísticos locales", description: "En Morelos y el área metropolitana, brindamos recolección, empaque y soluciones personalizadas para negocios locales." },
    { title: "Compromiso con la accesibilidad", description: "Nuestros servicios son diseñados para ser simples, eficientes y accesibles a todos." },
    { title: "Seguridad y confianza", description: "Nos aseguramos de que cada paquete viaje protegido y llegue a su destino sin contratiempos." },
    { title: "Impulsamos tu éxito", description: "Ayudamos a nuestros clientes en cada etapa de su crecimiento, asegurando envíos confiables y efectivos." },
  ];

  const whatsappBaseURL = "https://wa.me/525523187479?text=";

  return (
    <div className="keywords-section">
      <div className="keywords-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {keywords.map((k, i) => (
          <div key={i} className="keyword-card p-4 bg-[#FF3E1D] text-white rounded-lg shadow-md">
            <a
              href={`${whatsappBaseURL}${encodeURIComponent(`Hola, estoy interesado en ${k.text.toLowerCase()}. ¿Podrían darme más información?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center font-semibold hover:underline"
              title="Haz click para obtener más información"
            >
              {k.text}
            </a>
          </div>
        ))}
      </div>
      
      <div className="business-attributes mt-6">
        <h2 className="text-2xl font-bold text-center text-blue-900 mb-4">Los beneficios que obtienes con nosotros</h2>
        {attributes.map((attr, i) => (
          <div key={i} className="attribute-card p-4 bg-blue-50 rounded-lg shadow-md mb-4">
            <h3 className="text-xl font-semibold text-blue-900">{attr.title}</h3>
            <p className="text-gray-700">{attr.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * LogoSection renders the logo in its own section.
 */
function LogoSection(): JSX.Element {
  return (
    <section className="container mx-auto py-1 px-16">
      <div className="flex justify-center">
        <img
          src={EnviadoresLogo}
          alt="Enviadores logo"
          className="max-h-[500px] w-auto"
        />
      </div>
    </section>
  );
}

/**
 * Header contains the fixed navigation menu.
 */
function Header({ activeSection }: HeaderProps): JSX.Element {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow z-50">
      <div className="container mx-auto py-1 flex justify-center">
        <nav>
          <ul className="flex justify-center space-x-6">
            {[
              { id: 'home', label: 'Inicio' },
              { id: 'products', label: 'Servicios' },
              { id: 'contact', label: 'Contáctanos' },
            ].map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`hover:text-blue-600 transition-colors ${
                    activeSection === item.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/cotizador" element={<Cotizador />} />
      </Routes>
    </Router>
  );
}

/**
 * MainPage Component
 */
function MainPage() {
  const [activeSection, setActiveSection] = useState<string>('home');

  useEffect(() => {
    const sectionIds = ['home', 'products', 'contact'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-1% 0px -1% 0px', threshold: 1 }
    );

    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    
    <div id="home" className="min-h-screen bg-white text-blue-900">
      {/* Logo Section */}
      <LogoSection />

      {/* Fixed Navigation Header */}
      <Header activeSection={activeSection} />

      {/* Main Content (Home Section) */}
      
      <main className="container mx-auto px-4 pt-0 py-1 -mt-10">
      </main>

      {/* Acerca de Section */}
      <section id="products" className="container mx-auto px-4 py-4">
        <div className="bg-blue-50 rounded-xl p-6 md:p-8 mb-12 shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-center">Servicios</h2>
          <KeywordsCloud />
        </div>
      </section>

      {/* Contáctanos Section */}
      <section id="contact" className="container mx-auto px-4 py-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Contáctanos Container */}
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
        Contáctanos
      </h2>
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
    </div>

    {/* Visítanos Container */}
   
      <div className="bg-blue-50 rounded-xl p-6 hover:bg-blue-100 transition-all shadow-md">
        <div className="flex flex-col h-full">
          <h3 className="text-xl font-semibold mb-4">Visítanos</h3>
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
</section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-blue-100">
        <div className="text-center text-blue-700">
          <p className="mb-2">© {new Date().getFullYear()} Enviadores. Todos los derechos reservados.</p>
          <div className="flex flex-col md:flex-row justify-center md:space-x-6 space-y-4 md:space-y-0 mt-4">
            <div className="md:max-w-xs">
              <h3 className="font-semibold mb-1">Misión</h3>
              <p className="text-sm text-blue-600">
                Proporcionar soluciones logísticas simples, accesibles y eficientes
                adaptadas a las necesidades específicas de nuestros clientes.
              </p>
            </div>
            <div className="md:max-w-xs">
              <h3 className="font-semibold mb-1">Visión</h3>
              <p className="text-sm text-blue-600">
                Convertirnos en líderes en logística y logística inversa en México,
                ayudando a redefinir las devoluciones, la logística nacional y la
                logística para emprendedores como una herramienta clave para el
                éxito del comercio electrónico.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;