import { useEffect, useState } from "react";
import { calculateZone } from "./postalUtils";

interface DeliveryFrequency {
    lunes: boolean;
    martes: boolean;
    miercoles: boolean;
    jueves: boolean;
    viernes: boolean;
    sabado: boolean;
    domingo: boolean;
    frecuencia: string;
    ocurre_forzoso: boolean;
    zona_extendida: boolean;
    garantia_maxima: string;
    error?: string;
  }

function Cotizador() {
    const [originZip, setOriginZip] = useState("");
    const [destZip, setDestZip] = useState("");
    const [zone, setZone] = useState<number | null>(null);

    const [deliveryFrequency, setDeliveryFrequency] = useState<DeliveryFrequency | null>(null);
    const [loadingFrequency, setLoadingFrequency] = useState(false);
    
    const [originState, setOriginState] = useState("");
    const [originMunicipio, setOriginMunicipio] = useState("");
    const [originCiudad, setOriginCiudad] = useState("");
    const [originColonias, setOriginColonias] = useState<string[]>([]);
    const [selectedOriginColonia, setSelectedOriginColonia] = useState("");

    const [destState, setDestState] = useState("");
    const [destMunicipio, setDestMunicipio] = useState("");
    const [destCiudad, setDestCiudad] = useState("");
    const [destColonias, setDestColonias] = useState<string[]>([]);
    const [selectedDestColonia, setSelectedDestColonia] = useState("");

    const [packageType, setPackageType] = useState("");
    const [length, setLength] = useState("");
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [insurance, setInsurance] = useState(false);
    const [volumetricWeight, setVolumetricWeight] = useState(0);

    const [isValidated, setIsValidated] = useState(false);
    const [services, setServices] = useState<{ name: string; price: number }[] | null>(null);

    // Function to fetch ZIP code data
    const fetchZipCodeData = async (zip: string, isOrigin: boolean) => {
        if (zip.length === 5) {  
            try {
                const response = await fetch(`https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${zip}`);
                if (!response.ok) throw new Error("ZIP Code not found");
                const data = await response.json();
    
                if (data && data.zip_codes.length > 0) {
                    const zipData = data.zip_codes[0];
    
                    if (isOrigin) {
                        setOriginState(zipData.d_estado);
                        setOriginMunicipio(zipData.d_mnpio);
                        setOriginCiudad(zipData.d_ciudad || "");
                        setOriginColonias(data.zip_codes.map((z: any) => z.d_asenta));
                        setSelectedOriginColonia("");
                    } else {
                        setDestState(zipData.d_estado);
                        setDestMunicipio(zipData.d_mnpio);
                        setDestCiudad(zipData.d_ciudad || "");
                        setDestColonias(data.zip_codes.map((z: any) => z.d_asenta));
                        setSelectedDestColonia("");
                    }
                } else {
                    // Reset values if no data found
                    if (isOrigin) {
                        setOriginState("");
                        setOriginMunicipio("");
                        setOriginCiudad("");
                        setOriginColonias([]);
                    } else {
                        setDestState("");
                        setDestMunicipio("");
                        setDestCiudad("");
                        setDestColonias([]);
                    }
                }
            } catch (error) {
                console.error("Error fetching ZIP code data:", error);
                // Reset on error
                if (isOrigin) {
                    setOriginState("");
                    setOriginMunicipio("");
                    setOriginCiudad("");
                    setOriginColonias([]);
                } else {
                    setDestState("");
                    setDestMunicipio("");
                    setDestCiudad("");
                    setDestColonias([]);
                }
            }
        }
    };

    // Function to fetch deliveryfrequency
    const fetchDeliveryFrequency = async (postalCode: string) => {
        if (postalCode.length !== 5) return;
        
        setLoadingFrequency(true);
        try {
            const response = await fetch(`https://enviadores.com.mx/api/delivery-frequency.php?postal_code=${postalCode}`);
            const data: DeliveryFrequency = await response.json();
            setDeliveryFrequency(data.error ? null : data);
        } catch (error) {
            console.error("Error fetching delivery frequency:", error);
            setDeliveryFrequency(null);
        } finally {
            setLoadingFrequency(false);
        }
    };

    // Function to validate both ZIP codes
    const validateZipCodes = () => {
        if (originZip.length === 5 && destZip.length === 5) {
            // Reset the zone before new validation
            setZone(null);
            
            // Set validation state first
            setIsValidated(true);
            
            // Fetch both ZIP codes
            fetchZipCodeData(originZip, true);
            fetchZipCodeData(destZip, false);
            
            // Calculate zone based on postal codes
            const originPostal = parseInt(originZip);
            const destPostal = parseInt(destZip);
            
            if (!isNaN(originPostal) && !isNaN(destPostal)) {
                const calculatedZone = calculateZone(originPostal, destPostal);
                setZone(calculatedZone);
            }
            // Fetch delivery frequency for destination
            fetchDeliveryFrequency(destZip);
        }
    };

    const validateOnExternalSite = () => {
        // Create a form dynamically
        const form = document.createElement('form');
        form.action = 'https://frecuenciaentregasitecorecms.azurewebsites.net/';
        form.method = 'POST';
        form.target = '_blank'; // Open in new tab
        form.style.display = 'none';
      
        // Add origin ZIP
        const originInput = document.createElement('input');
        originInput.type = 'hidden';
        originInput.name = 'originZipCode';
        originInput.value = originZip;
        form.appendChild(originInput);
      
        // Add destination ZIP
        const destInput = document.createElement('input');
        destInput.type = 'hidden';
        destInput.name = 'destinationZipCode';
        destInput.value = destZip;
        form.appendChild(destInput);
      
        // Add country
        const countryInput = document.createElement('input');
        countryInput.type = 'hidden';
        countryInput.name = 'country';
        countryInput.value = 'MEX';
        form.appendChild(countryInput);
      
        // Add language
        const langInput = document.createElement('input');
        langInput.type = 'hidden';
        langInput.name = 'language';
        langInput.value = '0';
        form.appendChild(langInput);
      
        // Add to DOM and submit
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      };

      const renderDeliveryDays = (frequency: DeliveryFrequency) => {
        const days = [
            { name: 'Lunes', key: 'lunes', short: 'L' },
            { name: 'Martes', key: 'martes', short: 'M' },
            { name: 'Miércoles', key: 'miercoles', short: 'MI' },
            { name: 'Jueves', key: 'jueves', short: 'J' },
            { name: 'Viernes', key: 'viernes', short: 'V' },
            { name: 'Sábado', key: 'sabado', short: 'S' },
            { name: 'Domingo', key: 'domingo', short: 'D' },
        ];
    
        return (
            <div className="mt-4">
                <h4 className="font-semibold mb-2">Días de entrega:</h4>
                <div className="flex flex-wrap items-center gap-4">
                    {/* Days circles */}
                    <div className="flex gap-2">
                        {days.map(day => (
                            <div 
                                key={day.key}
                                className={`w-8 h-8 rounded-full flex items-center justify-center 
                                    ${frequency[day.key as keyof DeliveryFrequency] 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-gray-200 text-gray-600'}`}
                                title={day.name}
                            >
                                {day.short}
                            </div>
                        ))}
                    </div>
    
                </div>
            </div>
        );
    };

    // Add this component to render frequency info
    const renderFrequencyInfo = () => {
        if (loadingFrequency) {
            return <div className="mt-4 text-gray-500">Cargando información de entrega...</div>;
        }
        
        if (!deliveryFrequency) {
            return <div className="mt-4 text-yellow-600">No se encontró información de entrega para este código postal</div>;
        }
        
        return (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Información de Entrega</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p><span className="font-semibold">Frecuencia:</span> {deliveryFrequency.frecuencia}</p>
                        <p><span className="font-semibold">Garantía máxima:</span> {deliveryFrequency.garantia_maxima}</p>
                    </div>
                    <div>
                        <p>
                            <span className="font-semibold">Zona extendida:</span> 
                            {deliveryFrequency.zona_extendida ? (
                                <span className="text-red-600 ml-1">Sí (puede tener costo adicional)</span>
                            ) : (
                                <span className="text-green-600 ml-1">No</span>
                            )}
                        </p>
                        <p>
                            <span className="font-semibold">Recolección en sucursal:</span> 
                            {deliveryFrequency.ocurre_forzoso ? (
                                <span className="text-red-600 ml-1">Requerida</span>
                            ) : (
                                <span className="text-green-600 ml-1">No requerida</span>
                            )}
                        </p>
                    </div>
                </div>
                
                {renderDeliveryDays(deliveryFrequency)}
            </div>
        );
    };

    // Function to fetch available shipping services
    const fetchQuote = () => {
        if (!isValidated) return;

        // Base prices based on zone
        let basePrice = 0;
        if (zone) {
            // Example pricing logic - adjust based on your actual pricing model
            basePrice = zone * 50; // $50 per zone as an example
        }

        // Mocked service data (Replace with real API logic later)
        const baseServices = [
            { name: "Día Siguiente", price: Math.round(basePrice * 1.5) }, // 50% more for next day
            { name: "Terrestre", price: basePrice },
        ];

        let finalServices = baseServices;

        // Add insurance cost if selected
        if (insurance) {
            finalServices = finalServices.map(service => ({
                ...service,
                price: service.price + 50, // Example insurance cost
            }));
        }

        setServices(finalServices);
    };
    
    useEffect(() => {
        if (packageType === "Paquete") {
            const parsedLength = parseFloat(length);
            const parsedWidth = parseFloat(width);
            const parsedHeight = parseFloat(height);
    
            // Check if all values are valid before calculating
            if (!isNaN(parsedLength) && !isNaN(parsedWidth) && !isNaN(parsedHeight) && parsedLength > 0 && parsedWidth > 0 && parsedHeight > 0) {
                const volWeight = (parsedLength * parsedWidth * parsedHeight) / 5000;
                setVolumetricWeight(parseFloat(volWeight.toFixed(2)));  // Update volumetric weight
            } else {
                setVolumetricWeight(0); // Reset if any value is invalid
            }
        }
    }, [length, width, height, packageType]);  // Reacts to changes in these values

    return (
        <div className="p-6 bg-gray-100 rounded-lg shadow-md max-w-4xl w-full sm:w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 mx-auto">
            <h2 className="text-xl text-blue-600 font-semibold mb-4">ENVIADORES - COTIZADOR DE ENVIOS</h2>

            {/* Origin ZIP Code */}
            <div className="mb-6">
                <h3 className="font-semibold">Código Postal de Origen</h3>
                <input 
                    type="text" 
                    placeholder="Código Postal de Origen" 
                    value={originZip} 
                    onChange={(e) => setOriginZip(e.target.value)} 
                    className="border p-2 w-full"
                />
                {isValidated && (
                    <>
                        <p>Estado: {originState}</p>
                        <p>Municipio: {originMunicipio}</p>
                        <p>Ciudad: {originCiudad}</p>
                        <select 
                            value={selectedOriginColonia} 
                            onChange={(e) => setSelectedOriginColonia(e.target.value)} 
                            className="border p-2 w-full"
                        >
                            <option value="">Selecciona una Colonia</option>
                            {originColonias.map((colonia, index) => (
                                <option key={index} value={colonia}>{colonia}</option>
                            ))}
                        </select>
                    </>
                )}
            </div>

            {/* Destination ZIP Code */}
            <div className="mb-6">
                <h3 className="font-semibold">Código Postal de Destino</h3>
                <input 
                    type="text" 
                    placeholder="Código Postal de Destino" 
                    value={destZip} 
                    onChange={(e) => setDestZip(e.target.value)} 
                    className="border p-2 w-full"
                />
                {isValidated && (
                    <>
                        <p>Estado: {destState}</p>
                        <p>Municipio: {destMunicipio}</p>
                        <p>Ciudad: {destCiudad}</p>
                        <select 
                            value={selectedDestColonia} 
                            onChange={(e) => setSelectedDestColonia(e.target.value)} 
                            className="border p-2 w-full"
                        >
                            <option value="">Selecciona una Colonia</option>
                            {destColonias.map((colonia, index) => (
                                <option key={index} value={colonia}>{colonia}</option>
                            ))}
                        </select>
                        {/* Display Calculated Zone */}
                        {zone !== null && (
                        <div className="mt-5 p-4 bg-green-100 text-green-800 rounded-lg">
                            <p className="font-semibold">Zona: {zone}</p>
                        </div>
                         )}
                         {renderFrequencyInfo()}
                    </>
                )}
                
            </div>

            {/* Validate Button */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
    {/* Existing validation button */}
    <button 
        onClick={validateZipCodes} 
        className={`text-white px-4 py-2 rounded ${originZip.length === 5 && destZip.length === 5 ? "bg-red-500" : "bg-gray-500 cursor-not-allowed"}`} 
        disabled={!(originZip.length === 5 && destZip.length === 5)}
    >
        Validar Códigos Postales
    </button>

    {/* External validation button - only shows after validation */}
    {isValidated && destZip && (
        <button
            onClick={validateOnExternalSite}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center"
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                viewBox="0 0 20 20" 
                fill="currentColor"
            >
                <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" 
                    clipRule="evenodd" 
                />
            </svg>
            Verificar en Estafeta
        </button>
    )}
</div>

            {/* Package Details */}
            {isValidated && (
                <>
                    <h2 className="text-xl font-semibold mt-6">Detalles del Paquete</h2>
                    <select value={packageType} onChange={(e) => setPackageType(e.target.value)} className="border p-2 w-full mt-2">
                        <option value="">Selecciona tipo de Envio</option>
                        <option value="Paquete">Paquete</option>
                        <option value="Sobre">Sobre</option>
                    </select>

                    {packageType === "Paquete" && (
                        <>
                            <div className="relative w-full">
                                <input 
                                    type="number" 
                                    id="length" 
                                    value={length} 
                                    onChange={(e) => setLength(e.target.value)}
                                    placeholder="0" 
                                    className="border p-2 w-full mt-2"
                                />
                                <label 
                                    htmlFor="length" 
                                    className="absolute right-10 top-7 transform -translate-y-1/2 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
                                    >
                                    Largo (cm)
                                </label>
                            </div>
                            <div className="relative w-full">    
                                <input 
                                    type="number" 
                                    placeholder="0" 
                                    value={width} 
                                    onChange={(e) => setWidth(e.target.value)}    
                                    className="border p-2 w-full mt-2"
                                 />
                                <label 
                                    htmlFor="width" 
                                    className="absolute right-10 top-7 transform -translate-y-1/2 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
                                    >
                                    Ancho (cm)
                                </label>                            
                            </div>
                            <div className="relative w-full">
                                <input 
                                    type="number" 
                                    placeholder="0" 
                                    value={height} 
                                    onChange={(e) => setHeight(e.target.value)} 
                                    className="border p-2 w-full mt-2" />
                                <label 
                                    htmlFor="height" 
                                    className="absolute right-10 top-7 transform -translate-y-1/2 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
                                    >
                                    Alto (cm)
                                </label>                             
                            </div>
                            <div className="relative w-full">
                                <input 
                                type="number" 
                                placeholder="0" 
                                value={weight} 
                                onChange={(e) => setWeight(e.target.value)} 
                                className="border p-2 w-full mt-2" />
                                <label 
                                    htmlFor="weight" 
                                    className="absolute right-10 top-7 transform -translate-y-1/2 text-gray-500 text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 transition-all"
                                    >
                                    Peso (kg)
                                </label>
                            </div>
                            {/* Flex container to align the insurance and volumetric weight text side by side */}
                            <div className="flex items-center mt-2">
                                <label className="flex items-center">
                                    <input type="checkbox" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} className="mr-2" />
                                Seguro de Envío
                                </label>

                            {/* Display Volumetric Weight Only After Clicking Cotizar */}
                                {services && (
                                    <p className="text-green-600 ml-4">Peso Volumétrico: {volumetricWeight.toFixed(2)} kg</p>
                                )}
                            </div>      
                        </>
                    )}

                    {packageType === "Sobre" && (
                        <>
                            <input type="number" placeholder="Peso (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} className="border p-2 w-full mt-2" />
                            <label className="block mt-2">
                                <input type="checkbox" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} /> Seguro de Envío
                            </label>
                        </>
                    )}

                    {/* Cotizar Button */}
                    <button 
                        onClick={fetchQuote}
                        className={`text-white px-4 py-2 rounded mt-2 ${
                            packageType &&
                            ((packageType === "Paquete" && length && width && height && weight && !isNaN(parseFloat(length)) && !isNaN(parseFloat(width)) && !isNaN(parseFloat(height)) && !isNaN(parseFloat(weight))) ||
                            (packageType === "Sobre" && weight && !isNaN(parseFloat(weight))))
                            ? "bg-blue-500" 
                            : "bg-gray-500 cursor-not-allowed"
                        }`}
                        disabled={
                            !packageType ||
                            (packageType === "Paquete" && (!length || !width || !height || !weight || isNaN(parseFloat(length)) || isNaN(parseFloat(width)) || isNaN(parseFloat(height)) || isNaN(parseFloat(weight)))) ||
                            (packageType === "Sobre" && (!weight || isNaN(parseFloat(weight))))
                        }
                            >
                                Cotizar
                    </button>
                </>
            )}

            {/* Display Available Services */}
            {services && (
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-2">Servicios Disponibles</h3>
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border border-gray-300 p-2">Servicio</th>
                                <th className="border border-gray-300 p-2">Precio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((service, index) => (
                                <tr key={index}>
                                    <td className="border border-gray-300 p-2">{service.name}</td>
                                    <td className="border border-gray-300 p-2">${service.price}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Cotizador;