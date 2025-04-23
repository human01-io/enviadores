import { useState } from 'react';

interface ZipCodeData {
  estado: string;
  municipio: string;
  ciudad: string;
  colonias: string[];
}

export function useZipCodeLookup(initialState?: Partial<ZipCodeData>) {
  const [data, setData] = useState<ZipCodeData>({
    estado: initialState?.estado || '',
    municipio: initialState?.municipio || '',
    ciudad: initialState?.ciudad || '',
    colonias: initialState?.colonias || []
  });
  const [isValid, setIsValid] = useState(true);

  const fetchZipData = async (zip: string) => {
    if (zip.length !== 5) return;

    try {
      const response = await fetch(`https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${zip}`);
      if (!response.ok) throw new Error("Código postal no encontrado");
      
      const json = await response.json();
      if (json?.zip_codes?.length > 0) {
        const zipData = json.zip_codes[0];
        setData({
          estado: zipData.d_estado,
          municipio: zipData.d_mnpio,
          ciudad: zipData.d_ciudad || zipData.d_mnpio,
          colonias: json.zip_codes.map((z: any) => z.d_asenta)
        });
        setIsValid(true);
      } else {
        throw new Error("No data found");
      }
    } catch (error) {
      console.error("Zip code lookup failed:", error);
      setIsValid(false);
    }
  };

  return { data, isValid, fetchZipData };
}