const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  ['Electricidad', 'electricidad', 'Instalaciones eléctricas, tableros, corto circuitos, iluminación y cableado.', 'Zap'],
  ['Plomería', 'plomeria', 'Reparación de fugas, tuberías, tinacos, bombas de agua e instalación de sanitarios.', 'Wrench'],
  ['Minisplits y Climas', 'minisplits-y-climas', 'Instalación, mantenimiento preventivo, carga de gas y reparación de minisplits.', 'Wind'],
  ['Pintura y Recubrimientos', 'pintura', 'Pintura de interiores y exteriores, texturizados, acabados y recubrimientos decorativos.', 'Paintbrush'],
  ['Soporte y Computadoras', 'computadoras', 'Mantenimiento de PC/Mac, formateo, armado gamer, redes WiFi y cámaras de seguridad.', 'Laptop'],
  ['Carpintería y Muebles', 'carpinteria', 'Fabricación y reparación de puertas, closets, cocinas integrales y muebles a medida.', 'Hammer'],
  ['Cerrajería y Herrería', 'cerrajeria-y-herreria', 'Llaves, chapas, protecciones, portones, herrería y reparaciones metálicas.', 'KeyRound'],
  ['Albañilería y Construcción', 'albanileria-y-construccion', 'Muros, pisos, remodelaciones, reparaciones y obra menor.', 'HardHat'],
  ['Impermeabilización y Techos', 'impermeabilizacion-y-techos', 'Impermeabilización, goteras, reparación y mantenimiento de techos.', 'Umbrella'],
  ['Instalación de Gas', 'instalacion-de-gas', 'Instalación, revisión y reparación de líneas, boilers y tanques de gas.', 'Flame'],
  ['Jardinería y Mantenimiento Exterior', 'jardineria-y-mantenimiento-exterior', 'Poda, diseño de jardines, riego y cuidado de áreas exteriores.', 'Trees'],
  ['Limpieza Residencial y Comercial', 'limpieza-residencial-y-comercial', 'Limpieza profunda, regular y para hogares, oficinas o negocios.', 'Sparkles'],
  ['Mudanzas y Fletes', 'mudanzas-y-fletes', 'Traslado de muebles, carga, descargas y mudanzas locales.', 'Truck'],
  ['Electrodomésticos y Línea Blanca', 'electrodomesticos-y-linea-blanca', 'Reparación e instalación de lavadoras, refrigeradores, estufas y más.', 'Refrigerator'],
  ['Seguridad, Cámaras y Alarmas', 'seguridad-camaras-y-alarmas', 'Cámaras, alarmas, control de acceso y soluciones de seguridad.', 'ShieldCheck'],
  ['Automotriz y Grúas', 'automotriz-y-gruas', 'Mecánica básica, diagnóstico, asistencia vial y servicio de grúa.', 'Car'],
  ['Eventos y Servicios para Hogar', 'eventos-y-servicios-para-hogar', 'Apoyo para eventos, organización y servicios domésticos especializados.', 'CalendarDays'],
].map(([name, slug, description, iconName]) => ({ name, slug, description, iconName }));

async function main() {
  const result = await prisma.category.createMany({ data: categories, skipDuplicates: true });
  console.log(`Categorías base: ${result.count} agregadas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
