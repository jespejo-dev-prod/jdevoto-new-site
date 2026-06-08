import fs from 'fs';

function main() {
  const rawContent = fs.readFileSync('C:/Users/jespejo/.gemini/antigravity/brain/8b95b1e1-e236-40f0-81a1-9a53b0d73120/.system_generated/steps/1403/content.md', 'utf8');
  const jsonStartIndex = rawContent.indexOf('{');
  if (jsonStartIndex === -1) {
    console.error("Could not find JSON in content.md");
    process.exit(1);
  }
  const jsonContent = rawContent.substring(jsonStartIndex);
  const data = JSON.parse(jsonContent);

  const removeAccents = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/’/g, "'")
      .trim();
  };

  const regionsMap: Record<string, { id: string; name: string }> = {
    "ARICA Y PARINACOTA": { id: "15", name: "ARICA Y PARINACOTA" },
    "TARAPACA": { id: "01", name: "TARAPACA" },
    "ANTOFAGASTA": { id: "02", name: "ANTOFAGASTA" },
    "ATACAMA": { id: "03", name: "ATACAMA" },
    "COQUIMBO": { id: "04", name: "COQUIMBO" },
    "VALPARAISO": { id: "05", name: "VALPARAISO" },
    "REGION DEL LIBERTADOR GRAL. BERNARDO O'HIGGINS": { id: "06", name: "LIBERTADOR GENERAL BERNARDO O'HIGGINS" },
    "REGION DEL MAULE": { id: "07", name: "MAULE" },
    "REGION DE NUBLE": { id: "16", name: "NUBLE" },
    "REGION DEL BIOBIO": { id: "08", name: "BIOBIO" },
    "REGION DE LA ARAUCANIA": { id: "09", name: "LA ARAUCANIA" },
    "REGION DE LOS RIOS": { id: "14", name: "LOS RIOS" },
    "REGION DE LOS LAGOS": { id: "10", name: "LOS LAGOS" },
    "REGION AISEN DEL GRAL. CARLOS IBANEZ DEL CAMPO": { id: "11", name: "AYSEN DEL GENERAL CARLOS IBAÑEZ DEL CAMPO" },
    "REGION DE MAGALLANES Y DE LA ANTARTICA CHILENA": { id: "12", name: "MAGALLANES Y DE LA ANTARTICA CHILENA" },
    "REGION METROPOLITANA DE SANTIAGO": { id: "13", name: "METROPOLITANA DE SANTIAGO" }
  };

  const getCourierInfo = (regionName: string, comunaName: string) => {
    const r = regionName;
    const c = comunaName;

    // Specific mappings from the PDF list
    if (c === "ARICA") return { transport: "FEDEX", deliveryTime: "24 a 96hrs" };
    if (c === "IQUIQUE" || c === "ALTO HOSPICIO") return { transport: "FEDEX", deliveryTime: "24 a 96hrs" };
    if (c === "CALAMA" || c === "ANTOFAGASTA") return { transport: "G Y G (viernes)", deliveryTime: "lun-mart" };
    if (c === "MEJILLONES") return { transport: "FEDEX", deliveryTime: "JUEVES" };
    if (c === "COPIAPO" || c === "VALLENAR") return { transport: "FEDEX", deliveryTime: "24 a 96hrs" };
    if (c === "CALDERA") return { transport: "FEDEX", deliveryTime: "MARTES" };
    if (c === "LA SERENA" || c === "COQUIMBO" || c === "OVALLE" || c === "ILLAPEL" || c === "SALAMANCA" || c === "LOS VILOS") return { transport: "FEDEX", deliveryTime: "24 a 96hrs" };
    if (c === "VICUNA") return { transport: "FEDEX", deliveryTime: "lun/mier/vier" };
    if (c === "LA LIGUA") return { transport: "FEDEX", deliveryTime: "MARTES/JUEVES" };
    if (c === "LOS ANDES") return { transport: "FEDEX", deliveryTime: "24 a 96hrs" };
    
    // Metropolitana de Santiago
    if (r === "METROPOLITANA DE SANTIAGO") return { transport: "T.ESPINOZA", deliveryTime: "24-48hrs" };

    // Valparaiso Region V
    if (r === "VALPARAISO") return { transport: "DOMICILIO", deliveryTime: "12-48hrs según destino" };

    // O'Higgins
    if (c === "RANCAGUA" || c === "SAN FERNANDO" || c === "SANTA CRUZ") return { transport: "FEDEX", deliveryTime: "24 a 96hrs" };

    // Maule
    if (c === "TALCA" || c === "CURICO" || c === "CONSTITUCION" || c === "SAN JAVIER" || c === "MAULE" || c === "LINARES" || c === "MOLINA" || c === "PARRAL" || c === "CAUQUENES") return { transport: "FEDEX", deliveryTime: "24 a 96hrs" };

    // Nuble
    if (c === "CHILLAN") return { transport: "ECOEX", deliveryTime: "24hrs" };
    if (c === "YUNGAY") return { transport: "FEDEX", deliveryTime: "Viernes" };

    // Biobio
    if (c === "CONCEPCION" || c === "TALCAHUANO") return { transport: "ECOEX", deliveryTime: "24hrs" };
    if (c === "TOME" || c === "PENCO" || c === "SAN PEDRO DE LA PAZ" || c === "LOS ANGELES" || c === "CORONEL" || c === "CHIGUAYANTE") return { transport: "ECOEX", deliveryTime: "48hrs" };
    if (c === "LOTA") return { transport: "FEDEX", deliveryTime: "Mart/Vier" };
    if (c === "LAJA") return { transport: "FEDEX", deliveryTime: "Miercoles" };
    if (c === "LEBU") return { transport: "FEDEX", deliveryTime: "Miercoles" };
    if (c === "SANTA BARBARA") return { transport: "FEDEX", deliveryTime: "Lun/Mier" };
    if (c === "CANETE") return { transport: "FEDEX", deliveryTime: "Lunes" };

    // Araucania
    if (c === "TEMUCO" || c === "PADRE LAS CASAS" || c === "ANGOL" || c === "VICTORIA" || c === "VILLARRICA" || c === "PUCON") return { transport: "ECOEX", deliveryTime: "48hrs" };
    if (c === "TRAIGUEN") return { transport: "FEDEX", deliveryTime: "24 a 96hrs" };
    if (c === "LAUTARO") return { transport: "FEDEX", deliveryTime: "Mart/Jue" };
    if (c === "GORBEA") return { transport: "FEDEX", deliveryTime: "Lun/Mier/Vier" };

    // Los Rios
    if (c === "VALDIVIA") return { transport: "ECOEX", deliveryTime: "48hrs" };
    if (c === "S. JOSE DE LA MARIQUINA") return { transport: "FEDEX", deliveryTime: "Lun/Mier/Vier" };
    if (c === "PANGUIPULLI") return { transport: "FEDEX", deliveryTime: "Lun/Juev" };
    if (c === "PAILLACO" || c === "LOS LAGOS") return { transport: "FEDEX", deliveryTime: "Mar/Juev" };
    if (c === "LA UNION" || c === "RIO BUENO") return { transport: "FEDEX", deliveryTime: "24 a 96hrs" };

    // Los Lagos
    if (c === "PUERTO MONTT" || c === "PUERTO VARAS" || c.includes("CASTRO") || c.includes("ANCUD") || c.includes("QUELLON") || c.includes("CHONCHI") || c.includes("CHILOE")) return { transport: "FEDEX", deliveryTime: "24 a 96hrs" };
    if (c === "OSORNO") return { transport: "ECOEX", deliveryTime: "48hrs" };
    if (c === "FRUTILLAR" || c === "LLANQUIHUE") return { transport: "FEDEX", deliveryTime: "Lun/Mier/Vier" };

    // Aysen
    if (c === "COIHAIQUE" || c === "AISEN" || c === "AYSEN") return { transport: "A.T.E.", deliveryTime: "6-8 dias" };
    if (c === "CISNES" || c === "PUERTO CISNE" || c === "COCHRANE") return { transport: "ATE OFIC.", deliveryTime: "6-8 dias" };

    // Magallanes
    if (c === "PUNTA ARENAS" || c === "PORVENIR") return { transport: "SWISSLOG", deliveryTime: "Sale lunes de 5-7 dias" };
    if (c === "NATALES" || c === "PUERTO NATALES") return { transport: "FEDEX", deliveryTime: "Mier/Vier" };

    // General Fallback by region or default
    if (r === "AYSEN DEL GENERAL CARLOS IBAÑEZ DEL CAMPO") return { transport: "A.T.E.", deliveryTime: "6-8 dias" };
    if (r === "MAGALLANES Y DE LA ANTARTICA CHILENA") return { transport: "SWISSLOG", deliveryTime: "Sale lunes de 5-7 dias" };

    // Default fallback for any other commune in regions
    return { transport: "FEDEX", deliveryTime: "24 a 96hrs" };
  };

  const outputRegions = data.regiones.map((reg: any, index: number) => {
    const normRegion = removeAccents(reg.region);
    const matched = regionsMap[normRegion] || { id: String(index + 1).padStart(2, '0'), name: normRegion };

    const comunas = reg.comunas.map((com: string, cIndex: number) => {
      const normComuna = removeAccents(com);
      const courier = getCourierInfo(matched.name, normComuna);
      return {
        id: `${matched.id}${String(cIndex + 1).padStart(3, '0')}`,
        name: normComuna,
        ...courier
      };
    });

    return {
      id: matched.id,
      name: matched.name,
      comunas
    };
  });

  // Sort by ID
  outputRegions.sort((a: any, b: any) => a.id.localeCompare(b.id));

  const code = `/**
 * lib/chile-data.ts
 * 
 * Lista de Regiones y Comunas de Chile con Transportistas y Tiempos de Entrega asociados.
 * Generado automáticamente para incluir las 346 comunas de Chile.
 */

export interface Comuna {
  id: string;
  name: string;
  transport?: string;
  deliveryTime?: string;
}

export interface Region {
  id: string;
  name: string;
  comunas: Comuna[];
}

export const CHILE_REGIONS: Region[] = ${JSON.stringify(outputRegions, null, 2)};
`;

  fs.writeFileSync('src/lib/chile-data.ts', code);
  console.log("Generated chile-data.ts successfully with", outputRegions.length, "regions.");
}

main();
