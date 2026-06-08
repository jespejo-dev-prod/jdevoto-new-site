/**
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

export const CHILE_REGIONS: Region[] = [
  {
    "id": "01",
    "name": "TARAPACA",
    "comunas": [
      {
        "id": "01001",
        "name": "IQUIQUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "01002",
        "name": "ALTO HOSPICIO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "01003",
        "name": "POZO ALMONTE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "01004",
        "name": "CAMINA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "01005",
        "name": "COLCHANE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "01006",
        "name": "HUARA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "01007",
        "name": "PICA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      }
    ]
  },
  {
    "id": "02",
    "name": "ANTOFAGASTA",
    "comunas": [
      {
        "id": "02001",
        "name": "ANTOFAGASTA",
        "transport": "G Y G (viernes)",
        "deliveryTime": "lun-mart"
      },
      {
        "id": "02002",
        "name": "MEJILLONES",
        "transport": "FEDEX",
        "deliveryTime": "JUEVES"
      },
      {
        "id": "02003",
        "name": "SIERRA GORDA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "02004",
        "name": "TALTAL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "02005",
        "name": "CALAMA",
        "transport": "G Y G (viernes)",
        "deliveryTime": "lun-mart"
      },
      {
        "id": "02006",
        "name": "OLLAGUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "02007",
        "name": "SAN PEDRO DE ATACAMA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "02008",
        "name": "TOCOPILLA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "02009",
        "name": "MARIA ELENA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      }
    ]
  },
  {
    "id": "03",
    "name": "ATACAMA",
    "comunas": [
      {
        "id": "03001",
        "name": "COPIAPO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "03002",
        "name": "CALDERA",
        "transport": "FEDEX",
        "deliveryTime": "MARTES"
      },
      {
        "id": "03003",
        "name": "TIERRA AMARILLA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "03004",
        "name": "CHANARAL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "03005",
        "name": "DIEGO DE ALMAGRO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "03006",
        "name": "VALLENAR",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "03007",
        "name": "ALTO DEL CARMEN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "03008",
        "name": "FREIRINA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "03009",
        "name": "HUASCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      }
    ]
  },
  {
    "id": "04",
    "name": "COQUIMBO",
    "comunas": [
      {
        "id": "04001",
        "name": "LA SERENA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "04002",
        "name": "COQUIMBO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "04003",
        "name": "ANDACOLLO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "04004",
        "name": "LA HIGUERA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "04005",
        "name": "PAIGUANO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "04006",
        "name": "VICUNA",
        "transport": "FEDEX",
        "deliveryTime": "lun/mier/vier"
      },
      {
        "id": "04007",
        "name": "ILLAPEL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "04008",
        "name": "CANELA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "04009",
        "name": "LOS VILOS",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "04010",
        "name": "SALAMANCA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "04011",
        "name": "OVALLE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "04012",
        "name": "COMBARBALA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "04013",
        "name": "MONTE PATRIA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "04014",
        "name": "PUNITAQUI",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "04015",
        "name": "RIO HURTADO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      }
    ]
  },
  {
    "id": "05",
    "name": "VALPARAISO",
    "comunas": [
      {
        "id": "05001",
        "name": "VALPARAISO",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05002",
        "name": "CASABLANCA",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05003",
        "name": "CONCON",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05004",
        "name": "JUAN FERNANDEZ",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05005",
        "name": "PUCHUNCAVI",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05006",
        "name": "QUINTERO",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05007",
        "name": "VINA DEL MAR",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05008",
        "name": "ISLA DE PASCUA",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05009",
        "name": "LOS ANDES",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "05010",
        "name": "CALLE LARGA",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05011",
        "name": "RINCONADA",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05012",
        "name": "SAN ESTEBAN",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05013",
        "name": "LA LIGUA",
        "transport": "FEDEX",
        "deliveryTime": "MARTES/JUEVES"
      },
      {
        "id": "05014",
        "name": "CABILDO",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05015",
        "name": "PAPUDO",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05016",
        "name": "PETORCA",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05017",
        "name": "ZAPALLAR",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05018",
        "name": "QUILLOTA",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05019",
        "name": "CALERA",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05020",
        "name": "HIJUELAS",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05021",
        "name": "LA CRUZ",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05022",
        "name": "NOGALES",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05023",
        "name": "SAN ANTONIO",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05024",
        "name": "ALGARROBO",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05025",
        "name": "CARTAGENA",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05026",
        "name": "EL QUISCO",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05027",
        "name": "EL TABO",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05028",
        "name": "SANTO DOMINGO",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05029",
        "name": "SAN FELIPE",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05030",
        "name": "CATEMU",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05031",
        "name": "LLAILLAY",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05032",
        "name": "PANQUEHUE",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05033",
        "name": "PUTAENDO",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05034",
        "name": "SANTA MARIA",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05035",
        "name": "QUILPUE",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05036",
        "name": "LIMACHE",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05037",
        "name": "OLMUE",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      },
      {
        "id": "05038",
        "name": "VILLA ALEMANA",
        "transport": "DOMICILIO",
        "deliveryTime": "12-48hrs según destino"
      }
    ]
  },
  {
    "id": "06",
    "name": "LIBERTADOR GENERAL BERNARDO O'HIGGINS",
    "comunas": [
      {
        "id": "06001",
        "name": "RANCAGUA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06002",
        "name": "CODEGUA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06003",
        "name": "COINCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06004",
        "name": "COLTAUCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06005",
        "name": "DONIHUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06006",
        "name": "GRANEROS",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06007",
        "name": "LAS CABRAS",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06008",
        "name": "MACHALI",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06009",
        "name": "MALLOA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06010",
        "name": "MOSTAZAL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06011",
        "name": "OLIVAR",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06012",
        "name": "PEUMO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06013",
        "name": "PICHIDEGUA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06014",
        "name": "QUINTA DE TILCOCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06015",
        "name": "RENGO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06016",
        "name": "REQUINOA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06017",
        "name": "SAN VICENTE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06018",
        "name": "PICHILEMU",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06019",
        "name": "LA ESTRELLA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06020",
        "name": "LITUECHE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06021",
        "name": "MARCHIHUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06022",
        "name": "NAVIDAD",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06023",
        "name": "PAREDONES",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06024",
        "name": "SAN FERNANDO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06025",
        "name": "CHEPICA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06026",
        "name": "CHIMBARONGO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06027",
        "name": "LOLOL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06028",
        "name": "NANCAGUA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06029",
        "name": "PALMILLA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06030",
        "name": "PERALILLO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06031",
        "name": "PLACILLA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06032",
        "name": "PUMANQUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "06033",
        "name": "SANTA CRUZ",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      }
    ]
  },
  {
    "id": "07",
    "name": "MAULE",
    "comunas": [
      {
        "id": "07001",
        "name": "TALCA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07002",
        "name": "CONSTITUCION",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07003",
        "name": "CUREPTO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07004",
        "name": "EMPEDRADO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07005",
        "name": "MAULE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07006",
        "name": "PELARCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07007",
        "name": "PENCAHUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07008",
        "name": "RIO CLARO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07009",
        "name": "SAN CLEMENTE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07010",
        "name": "SAN RAFAEL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07011",
        "name": "CAUQUENES",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07012",
        "name": "CHANCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07013",
        "name": "PELLUHUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07014",
        "name": "CURICO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07015",
        "name": "HUALANE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07016",
        "name": "LICANTEN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07017",
        "name": "MOLINA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07018",
        "name": "RAUCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07019",
        "name": "ROMERAL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07020",
        "name": "SAGRADA FAMILIA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07021",
        "name": "TENO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07022",
        "name": "VICHUQUEN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07023",
        "name": "LINARES",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07024",
        "name": "COLBUN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07025",
        "name": "LONGAVI",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07026",
        "name": "PARRAL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07027",
        "name": "RETIRO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07028",
        "name": "SAN JAVIER",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07029",
        "name": "VILLA ALEGRE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "07030",
        "name": "YERBAS BUENAS",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      }
    ]
  },
  {
    "id": "08",
    "name": "BIOBIO",
    "comunas": [
      {
        "id": "08001",
        "name": "CONCEPCION",
        "transport": "ECOEX",
        "deliveryTime": "24hrs"
      },
      {
        "id": "08002",
        "name": "CORONEL",
        "transport": "ECOEX",
        "deliveryTime": "48hrs"
      },
      {
        "id": "08003",
        "name": "CHIGUAYANTE",
        "transport": "ECOEX",
        "deliveryTime": "48hrs"
      },
      {
        "id": "08004",
        "name": "FLORIDA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08005",
        "name": "HUALQUI",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08006",
        "name": "LOTA",
        "transport": "FEDEX",
        "deliveryTime": "Mart/Vier"
      },
      {
        "id": "08007",
        "name": "PENCO",
        "transport": "ECOEX",
        "deliveryTime": "48hrs"
      },
      {
        "id": "08008",
        "name": "SAN PEDRO DE LA PAZ",
        "transport": "ECOEX",
        "deliveryTime": "48hrs"
      },
      {
        "id": "08009",
        "name": "SANTA JUANA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08010",
        "name": "TALCAHUANO",
        "transport": "ECOEX",
        "deliveryTime": "24hrs"
      },
      {
        "id": "08011",
        "name": "TOME",
        "transport": "ECOEX",
        "deliveryTime": "48hrs"
      },
      {
        "id": "08012",
        "name": "HUALPEN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08013",
        "name": "LEBU",
        "transport": "FEDEX",
        "deliveryTime": "Miercoles"
      },
      {
        "id": "08014",
        "name": "ARAUCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08015",
        "name": "CANETE",
        "transport": "FEDEX",
        "deliveryTime": "Lunes"
      },
      {
        "id": "08016",
        "name": "CONTULMO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08017",
        "name": "CURANILAHUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08018",
        "name": "LOS ALAMOS",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08019",
        "name": "TIRUA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08020",
        "name": "LOS ANGELES",
        "transport": "ECOEX",
        "deliveryTime": "48hrs"
      },
      {
        "id": "08021",
        "name": "ANTUCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08022",
        "name": "CABRERO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08023",
        "name": "LAJA",
        "transport": "FEDEX",
        "deliveryTime": "Miercoles"
      },
      {
        "id": "08024",
        "name": "MULCHEN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08025",
        "name": "NACIMIENTO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08026",
        "name": "NEGRETE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08027",
        "name": "QUILACO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08028",
        "name": "QUILLECO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08029",
        "name": "SAN ROSENDO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08030",
        "name": "SANTA BARBARA",
        "transport": "FEDEX",
        "deliveryTime": "Lun/Mier"
      },
      {
        "id": "08031",
        "name": "TUCAPEL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08032",
        "name": "YUMBEL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "08033",
        "name": "ALTO BIOBIO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      }
    ]
  },
  {
    "id": "09",
    "name": "LA ARAUCANIA",
    "comunas": [
      {
        "id": "09001",
        "name": "TEMUCO",
        "transport": "ECOEX",
        "deliveryTime": "48hrs"
      },
      {
        "id": "09002",
        "name": "CARAHUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09003",
        "name": "CUNCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09004",
        "name": "CURARREHUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09005",
        "name": "FREIRE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09006",
        "name": "GALVARINO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09007",
        "name": "GORBEA",
        "transport": "FEDEX",
        "deliveryTime": "Lun/Mier/Vier"
      },
      {
        "id": "09008",
        "name": "LAUTARO",
        "transport": "FEDEX",
        "deliveryTime": "Mart/Jue"
      },
      {
        "id": "09009",
        "name": "LONCOCHE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09010",
        "name": "MELIPEUCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09011",
        "name": "NUEVA IMPERIAL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09012",
        "name": "PADRE LAS CASAS",
        "transport": "ECOEX",
        "deliveryTime": "48hrs"
      },
      {
        "id": "09013",
        "name": "PERQUENCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09014",
        "name": "PITRUFQUEN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09015",
        "name": "PUCON",
        "transport": "ECOEX",
        "deliveryTime": "48hrs"
      },
      {
        "id": "09016",
        "name": "SAAVEDRA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09017",
        "name": "TEODORO SCHMIDT",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09018",
        "name": "TOLTEN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09019",
        "name": "VILCUN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09020",
        "name": "VILLARRICA",
        "transport": "ECOEX",
        "deliveryTime": "48hrs"
      },
      {
        "id": "09021",
        "name": "CHOLCHOL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09022",
        "name": "ANGOL",
        "transport": "ECOEX",
        "deliveryTime": "48hrs"
      },
      {
        "id": "09023",
        "name": "COLLIPULLI",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09024",
        "name": "CURACAUTIN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09025",
        "name": "ERCILLA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09026",
        "name": "LONQUIMAY",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09027",
        "name": "LOS SAUCES",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09028",
        "name": "LUMACO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09029",
        "name": "PUREN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09030",
        "name": "RENAICO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09031",
        "name": "TRAIGUEN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "09032",
        "name": "VICTORIA",
        "transport": "ECOEX",
        "deliveryTime": "48hrs"
      }
    ]
  },
  {
    "id": "10",
    "name": "LOS LAGOS",
    "comunas": [
      {
        "id": "10001",
        "name": "PUERTO MONTT",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10002",
        "name": "CALBUCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10003",
        "name": "COCHAMO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10004",
        "name": "FRESIA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10005",
        "name": "FRUTILLAR",
        "transport": "FEDEX",
        "deliveryTime": "Lun/Mier/Vier"
      },
      {
        "id": "10006",
        "name": "LOS MUERMOS",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10007",
        "name": "LLANQUIHUE",
        "transport": "FEDEX",
        "deliveryTime": "Lun/Mier/Vier"
      },
      {
        "id": "10008",
        "name": "MAULLIN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10009",
        "name": "PUERTO VARAS",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10010",
        "name": "CASTRO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10011",
        "name": "ANCUD",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10012",
        "name": "CHONCHI",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10013",
        "name": "CURACO DE VELEZ",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10014",
        "name": "DALCAHUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10015",
        "name": "PUQUELDON",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10016",
        "name": "QUEILEN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10017",
        "name": "QUELLON",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10018",
        "name": "QUEMCHI",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10019",
        "name": "QUINCHAO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10020",
        "name": "OSORNO",
        "transport": "ECOEX",
        "deliveryTime": "48hrs"
      },
      {
        "id": "10021",
        "name": "PUERTO OCTAY",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10022",
        "name": "PURRANQUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10023",
        "name": "PUYEHUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10024",
        "name": "RIO NEGRO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10025",
        "name": "SAN JUAN DE LA COSTA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10026",
        "name": "SAN PABLO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10027",
        "name": "CHAITEN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10028",
        "name": "FUTALEUFU",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10029",
        "name": "HUALAIHUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "10030",
        "name": "PALENA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      }
    ]
  },
  {
    "id": "11",
    "name": "AYSEN DEL GENERAL CARLOS IBAÑEZ DEL CAMPO",
    "comunas": [
      {
        "id": "11001",
        "name": "COIHAIQUE",
        "transport": "A.T.E.",
        "deliveryTime": "6-8 dias"
      },
      {
        "id": "11002",
        "name": "LAGO VERDE",
        "transport": "A.T.E.",
        "deliveryTime": "6-8 dias"
      },
      {
        "id": "11003",
        "name": "AISEN",
        "transport": "A.T.E.",
        "deliveryTime": "6-8 dias"
      },
      {
        "id": "11004",
        "name": "CISNES",
        "transport": "ATE OFIC.",
        "deliveryTime": "6-8 dias"
      },
      {
        "id": "11005",
        "name": "GUAITECAS",
        "transport": "A.T.E.",
        "deliveryTime": "6-8 dias"
      },
      {
        "id": "11006",
        "name": "COCHRANE",
        "transport": "ATE OFIC.",
        "deliveryTime": "6-8 dias"
      },
      {
        "id": "11007",
        "name": "O'HIGGINS",
        "transport": "A.T.E.",
        "deliveryTime": "6-8 dias"
      },
      {
        "id": "11008",
        "name": "TORTEL",
        "transport": "A.T.E.",
        "deliveryTime": "6-8 dias"
      },
      {
        "id": "11009",
        "name": "CHILE CHICO",
        "transport": "A.T.E.",
        "deliveryTime": "6-8 dias"
      },
      {
        "id": "11010",
        "name": "RIO IBANEZ",
        "transport": "A.T.E.",
        "deliveryTime": "6-8 dias"
      }
    ]
  },
  {
    "id": "12",
    "name": "MAGALLANES Y DE LA ANTARTICA CHILENA",
    "comunas": [
      {
        "id": "12001",
        "name": "PUNTA ARENAS",
        "transport": "SWISSLOG",
        "deliveryTime": "Sale lunes de 5-7 dias"
      },
      {
        "id": "12002",
        "name": "LAGUNA BLANCA",
        "transport": "SWISSLOG",
        "deliveryTime": "Sale lunes de 5-7 dias"
      },
      {
        "id": "12003",
        "name": "RIO VERDE",
        "transport": "SWISSLOG",
        "deliveryTime": "Sale lunes de 5-7 dias"
      },
      {
        "id": "12004",
        "name": "SAN GREGORIO",
        "transport": "SWISSLOG",
        "deliveryTime": "Sale lunes de 5-7 dias"
      },
      {
        "id": "12005",
        "name": "CABO DE HORNOS (EX NAVARINO)",
        "transport": "SWISSLOG",
        "deliveryTime": "Sale lunes de 5-7 dias"
      },
      {
        "id": "12006",
        "name": "ANTARTICA",
        "transport": "SWISSLOG",
        "deliveryTime": "Sale lunes de 5-7 dias"
      },
      {
        "id": "12007",
        "name": "PORVENIR",
        "transport": "SWISSLOG",
        "deliveryTime": "Sale lunes de 5-7 dias"
      },
      {
        "id": "12008",
        "name": "PRIMAVERA",
        "transport": "SWISSLOG",
        "deliveryTime": "Sale lunes de 5-7 dias"
      },
      {
        "id": "12009",
        "name": "TIMAUKEL",
        "transport": "SWISSLOG",
        "deliveryTime": "Sale lunes de 5-7 dias"
      },
      {
        "id": "12010",
        "name": "NATALES",
        "transport": "FEDEX",
        "deliveryTime": "Mier/Vier"
      },
      {
        "id": "12011",
        "name": "TORRES DEL PAINE",
        "transport": "SWISSLOG",
        "deliveryTime": "Sale lunes de 5-7 dias"
      }
    ]
  },
  {
    "id": "13",
    "name": "METROPOLITANA DE SANTIAGO",
    "comunas": [
      {
        "id": "13001",
        "name": "CERRILLOS",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13002",
        "name": "CERRO NAVIA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13003",
        "name": "CONCHALI",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13004",
        "name": "EL BOSQUE",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13005",
        "name": "ESTACION CENTRAL",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13006",
        "name": "HUECHURABA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13007",
        "name": "INDEPENDENCIA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13008",
        "name": "LA CISTERNA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13009",
        "name": "LA FLORIDA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13010",
        "name": "LA GRANJA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13011",
        "name": "LA PINTANA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13012",
        "name": "LA REINA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13013",
        "name": "LAS CONDES",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13014",
        "name": "LO BARNECHEA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13015",
        "name": "LO ESPEJO",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13016",
        "name": "LO PRADO",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13017",
        "name": "MACUL",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13018",
        "name": "MAIPU",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13019",
        "name": "NUNOA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13020",
        "name": "PEDRO AGUIRRE CERDA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13021",
        "name": "PENALOLEN",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13022",
        "name": "PROVIDENCIA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13023",
        "name": "PUDAHUEL",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13024",
        "name": "QUILICURA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13025",
        "name": "QUINTA NORMAL",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13026",
        "name": "RECOLETA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13027",
        "name": "RENCA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13028",
        "name": "SANTIAGO",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13029",
        "name": "SAN JOAQUIN",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13030",
        "name": "SAN MIGUEL",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13031",
        "name": "SAN RAMON",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13032",
        "name": "VITACURA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13033",
        "name": "PUENTE ALTO",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13034",
        "name": "PIRQUE",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13035",
        "name": "SAN JOSE DE MAIPO",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13036",
        "name": "COLINA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13037",
        "name": "LAMPA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13038",
        "name": "TILTIL",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13039",
        "name": "SAN BERNARDO",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13040",
        "name": "BUIN",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13041",
        "name": "CALERA DE TANGO",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13042",
        "name": "PAINE",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13043",
        "name": "MELIPILLA",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13044",
        "name": "ALHUE",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13045",
        "name": "CURACAVI",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13046",
        "name": "MARIA PINTO",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13047",
        "name": "SAN PEDRO",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13048",
        "name": "TALAGANTE",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13049",
        "name": "EL MONTE",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13050",
        "name": "ISLA DE MAIPO",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13051",
        "name": "PADRE HURTADO",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      },
      {
        "id": "13052",
        "name": "PENAFLOR",
        "transport": "T.ESPINOZA",
        "deliveryTime": "24-48hrs"
      }
    ]
  },
  {
    "id": "14",
    "name": "LOS RIOS",
    "comunas": [
      {
        "id": "14001",
        "name": "VALDIVIA",
        "transport": "ECOEX",
        "deliveryTime": "48hrs"
      },
      {
        "id": "14002",
        "name": "CORRAL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "14003",
        "name": "LANCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "14004",
        "name": "LOS LAGOS",
        "transport": "FEDEX",
        "deliveryTime": "Mar/Juev"
      },
      {
        "id": "14005",
        "name": "MAFIL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "14006",
        "name": "MARIQUINA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "14007",
        "name": "PAILLACO",
        "transport": "FEDEX",
        "deliveryTime": "Mar/Juev"
      },
      {
        "id": "14008",
        "name": "PANGUIPULLI",
        "transport": "FEDEX",
        "deliveryTime": "Lun/Juev"
      },
      {
        "id": "14009",
        "name": "LA UNION",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "14010",
        "name": "FUTRONO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "14011",
        "name": "LAGO RANCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "14012",
        "name": "RIO BUENO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      }
    ]
  },
  {
    "id": "15",
    "name": "ARICA Y PARINACOTA",
    "comunas": [
      {
        "id": "15001",
        "name": "ARICA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "15002",
        "name": "CAMARONES",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "15003",
        "name": "PUTRE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "15004",
        "name": "GENERAL LAGOS",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      }
    ]
  },
  {
    "id": "16",
    "name": "NUBLE",
    "comunas": [
      {
        "id": "16001",
        "name": "COBQUECURA",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16002",
        "name": "COELEMU",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16003",
        "name": "NINHUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16004",
        "name": "PORTEZUELO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16005",
        "name": "QUIRIHUE",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16006",
        "name": "RANQUIL",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16007",
        "name": "TREGUACO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16008",
        "name": "BULNES",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16009",
        "name": "CHILLAN VIEJO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16010",
        "name": "CHILLAN",
        "transport": "ECOEX",
        "deliveryTime": "24hrs"
      },
      {
        "id": "16011",
        "name": "EL CARMEN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16012",
        "name": "PEMUCO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16013",
        "name": "PINTO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16014",
        "name": "QUILLON",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16015",
        "name": "SAN IGNACIO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16016",
        "name": "YUNGAY",
        "transport": "FEDEX",
        "deliveryTime": "Viernes"
      },
      {
        "id": "16017",
        "name": "COIHUECO",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16018",
        "name": "NIQUEN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16019",
        "name": "SAN CARLOS",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16020",
        "name": "SAN FABIAN",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      },
      {
        "id": "16021",
        "name": "SAN NICOLAS",
        "transport": "FEDEX",
        "deliveryTime": "24 a 96hrs"
      }
    ]
  }
];
