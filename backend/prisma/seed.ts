import { PrismaClient, Role, ServicePricingType, ServiceStatus, JobRequestStatus, ProposalStatus, WorkOrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed para BAXIO...');

  // Limpiar base de datos si ya tiene datos
  await prisma.review.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.jobRequestImage.deleteMany();
  await prisma.jobRequest.deleteMany();
  await prisma.serviceImage.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.favoriteService.deleteMany();
  await prisma.favoriteWorker.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Crear Usuarios de prueba
  console.log('👤 Creando usuarios...');
  const userKevin = await prisma.user.create({
    data: {
      email: 'kevin@baxio.com',
      passwordHash,
      fullName: 'Kevin Ramos',
      professionalHeadline: 'Ingeniero de Software y Entusiasta de la Tecnología',
      phone: '+52 81 1234 5678',
      whatsapp: '+52 81 1234 5678',
      telegram: 'kevin_baxio',
      instagram: 'kevin.dev',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      bio: 'Desarrollador y aficionado a la tecnología. Me encanta contratar expertos de confianza y ocasionalmente brindar soporte técnico.',
      location: 'Monterrey, NL',
      serviceArea: 'Área Metropolitana de Monterrey',
      // Punto de referencia de cobertura; no representa un domicilio personal.
      baseLatitude: 25.6866,
      baseLongitude: -100.3161,
      serviceRadiusKm: 25,
      experienceYears: 5,
      role: Role.USER,
      workerRatingAvg: 4.90,
      workerRatingCnt: 12,
      clientRatingAvg: 5.00,
      clientRatingCnt: 8,
    },
  });

  const userJuan = await prisma.user.create({
    data: {
      email: 'juan.electricista@baxio.com',
      passwordHash,
      fullName: 'Juan Pérez García',
      professionalHeadline: 'Técnico Electricista Residencial y Comercial Certificado',
      phone: '+52 81 8765 4321',
      whatsapp: '+52 81 8765 4321',
      telegram: 'juan_electricista_mty',
      instagram: 'juanperez_electricidad',
      facebook: 'JuanPerezElectricistaOficial',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      bio: 'Técnico electricista certificado con más de 10 años de experiencia en instalaciones residenciales, comerciales y diagnóstico de fallas eléctricas.',
      location: 'San Pedro Garza García, NL',
      serviceArea: 'San Pedro, Monterrey Sur y Poniente',
      baseLatitude: 25.6600,
      baseLongitude: -100.3550,
      serviceRadiusKm: 20,
      experienceYears: 10,
      role: Role.USER,
      workerRatingAvg: 4.95,
      workerRatingCnt: 28,
      clientRatingAvg: 4.80,
      clientRatingCnt: 5,
    },
  });

  const userMaria = await prisma.user.create({
    data: {
      email: 'maria.reparaciones@baxio.com',
      passwordHash,
      fullName: 'María González',
      professionalHeadline: 'Especialista en Plomería Hidrosanitaria y Detección de Fugas',
      phone: '+52 81 9988 7766',
      whatsapp: '+52 81 9988 7766',
      telegram: 'maria_plomeria',
      instagram: 'maria_hidrosanitaria',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      bio: 'Especialista en plomería residencial, detección de fugas no visibles e instalación de calentadores solares y boilers de paso.',
      location: 'Guadalupe, NL',
      serviceArea: 'Guadalupe, San Nicolás, Apodaca',
      baseLatitude: 25.6770,
      baseLongitude: -100.2580,
      serviceRadiusKm: 20,
      experienceYears: 7,
      role: Role.USER,
      workerRatingAvg: 4.88,
      workerRatingCnt: 19,
      clientRatingAvg: 5.00,
      clientRatingCnt: 4,
    },
  });

  const userCarlos = await prisma.user.create({
    data: {
      email: 'carlos.climas@baxio.com',
      passwordHash,
      fullName: 'Carlos Mendoza',
      professionalHeadline: 'Técnico Especialista en Climatización y Minisplits Inverter',
      phone: '+52 81 3344 5566',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      bio: 'Técnico certificado en refrigeración y aire acondicionado. Mantenimiento preventivo, correctivo e instalación de minisplits inverter.',
      location: 'Apodaca, NL',
      serviceArea: 'Toda la zona metropolitana',
      baseLatitude: 25.7310,
      baseLongitude: -100.2910,
      serviceRadiusKm: 25,
      experienceYears: 8,
      role: Role.USER,
      workerRatingAvg: 4.92,
      workerRatingCnt: 34,
      clientRatingAvg: 4.90,
      clientRatingCnt: 6,
    },
  });

  // Credenciales y Certificaciones de Juan Pérez
  console.log('📜 Creando credenciales y certificaciones...');
  await prisma.credential.createMany({
    data: [
      {
        userId: userJuan.id,
        type: 'CERTIFICATION',
        title: 'DC-3 Seguridad en Trabajos Eléctricos y en Alturas',
        issuer: 'Secretaría del Trabajo y Previsión Social (STPS)',
        credentialId: 'STPS-DC3-NL-2023-88912',
        status: 'VERIFIED',
        issueDate: new Date('2023-04-15'),
        verifiedAt: new Date('2024-01-10'),
      },
      {
        userId: userJuan.id,
        type: 'CERTIFICATION',
        title: 'Certificación NOM-001-SEDE Instalaciones Eléctricas',
        issuer: 'Colegio de Ingenieros y Técnicos Electricistas',
        credentialId: 'CITE-NOM-49102',
        status: 'VERIFIED',
        issueDate: new Date('2022-08-20'),
        verifiedAt: new Date('2024-01-12'),
      },
      {
        userId: userJuan.id,
        type: 'DEGREE',
        title: 'Técnico Superior en Mantenimiento Eléctrico Industrial',
        issuer: 'Universidad Tecnológica de Nuevo León',
        credentialId: 'CED-TEC-992381',
        status: 'VERIFIED',
        issueDate: new Date('2018-06-30'),
        verifiedAt: new Date('2024-01-15'),
      },
      {
        userId: userJuan.id,
        type: 'COURSE',
        title: 'Especialidad en Iluminación LED y Automatización Residencial',
        issuer: 'Instituto Tecnológico del Norte',
        status: 'PENDING', // Declarada por el profesional, aún en revisión
        issueDate: new Date('2024-02-10'),
      },
      // Credenciales de Carlos Mendoza
      {
        userId: userCarlos.id,
        type: 'CERTIFICATION',
        title: 'Certificación en Manejo Seguro de Refrigerantes Ecológicos R-410A / R-32',
        issuer: 'Asociación Nacional de Climatización y Refrigeración',
        credentialId: 'ANCR-REF-2023-77',
        status: 'VERIFIED',
        issueDate: new Date('2023-09-01'),
        verifiedAt: new Date('2024-02-01'),
      },
      {
        userId: userCarlos.id,
        type: 'DIPLOMA',
        title: 'Diplomado en Diagnóstico Electrónico de Tarjetas Inverter',
        issuer: 'Centro de Capacitación Técnica Industrial',
        status: 'PENDING',
        issueDate: new Date('2024-05-15'),
      },
    ],
  });

  // 1.2 Experiencias Laborales Previas
  console.log('💼 Creando experiencias laborales previas...');
  await prisma.experience.createMany({
    data: [
      {
        userId: userJuan.id,
        roleTitle: 'Técnico Electricista Independiente',
        isFreelance: true,
        startYear: 2018,
        isCurrent: true,
        description: 'Instalaciones residenciales y comerciales, balanceo de cargas y automatización de iluminación.',
      },
      {
        userId: userJuan.id,
        roleTitle: 'Técnico de Mantenimiento Eléctrico',
        companyName: 'Constructora Regiomontana S.A.',
        isFreelance: false,
        startYear: 2015,
        endYear: 2018,
        isCurrent: false,
        description: 'Supervisión e instalación de cableado de fuerza y tableros en desarrollos residenciales.',
      },
      {
        userId: userCarlos.id,
        roleTitle: 'Especialista en Minisplits e Inverter',
        isFreelance: true,
        startYear: 2019,
        isCurrent: true,
        description: 'Instalación, carga de gas R410A y mantenimiento preventivo en Monterrey y San Pedro.',
      },
    ],
  });

  // 2. Crear Categorías
  console.log('📂 Creando categorías...');
  const catElectricidad = await prisma.category.create({
    data: {
      name: 'Electricidad',
      slug: 'electricidad',
      description: 'Instalaciones eléctricas, tableros, corto circuitos, iluminación y cableado.',
      iconName: 'Zap',
      imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
    },
  });

  const catPlomeria = await prisma.category.create({
    data: {
      name: 'Plomería',
      slug: 'plomeria',
      description: 'Reparación de fugas, tuberías, tinacos, bombas de agua e instalación de sanitarios.',
      iconName: 'Wrench',
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
    },
  });

  const catClimas = await prisma.category.create({
    data: {
      name: 'Minisplits y Climas',
      slug: 'minisplits-y-climas',
      description: 'Instalación, mantenimiento preventivo, carga de gas y reparación de minisplits.',
      iconName: 'Wind',
      imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&auto=format&fit=crop&q=80',
    },
  });

  const catPintura = await prisma.category.create({
    data: {
      name: 'Pintura y Recubrimientos',
      slug: 'pintura',
      description: 'Pintura de interiores y exteriores, texturizados, acabados y recubrimientos decorativos.',
      iconName: 'Paintbrush',
      imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    },
  });

  const catSoporte = await prisma.category.create({
    data: {
      name: 'Soporte y Computadoras',
      slug: 'computadoras',
      description: 'Mantenimiento de PC/Mac, formateo, armado gamer, redes WiFi y cámaras de seguridad.',
      iconName: 'Laptop',
      imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
    },
  });

  const catCarpinteria = await prisma.category.create({
    data: {
      name: 'Carpintería y Muebles',
      slug: 'carpinteria',
      description: 'Fabricación y reparación de puertas, closets, cocinas integrales y muebles a medida.',
      iconName: 'Hammer',
      imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop&q=80',
    },
  });

  await prisma.category.createMany({
    data: [
      { name: 'Cerrajería y Herrería', slug: 'cerrajeria-y-herreria', description: 'Llaves, chapas, protecciones, portones, herrería y reparaciones metálicas.', iconName: 'KeyRound' },
      { name: 'Albañilería y Construcción', slug: 'albanileria-y-construccion', description: 'Muros, pisos, remodelaciones, reparaciones y obra menor.', iconName: 'HardHat' },
      { name: 'Impermeabilización y Techos', slug: 'impermeabilizacion-y-techos', description: 'Impermeabilización, goteras, reparación y mantenimiento de techos.', iconName: 'Umbrella' },
      { name: 'Instalación de Gas', slug: 'instalacion-de-gas', description: 'Instalación, revisión y reparación de líneas, boilers y tanques de gas.', iconName: 'Flame' },
      { name: 'Jardinería y Mantenimiento Exterior', slug: 'jardineria-y-mantenimiento-exterior', description: 'Poda, diseño de jardines, riego y cuidado de áreas exteriores.', iconName: 'Trees' },
      { name: 'Limpieza Residencial y Comercial', slug: 'limpieza-residencial-y-comercial', description: 'Limpieza profunda, regular y para hogares, oficinas o negocios.', iconName: 'Sparkles' },
      { name: 'Mudanzas y Fletes', slug: 'mudanzas-y-fletes', description: 'Traslado de muebles, carga, descargas y mudanzas locales.', iconName: 'Truck' },
      { name: 'Electrodomésticos y Línea Blanca', slug: 'electrodomesticos-y-linea-blanca', description: 'Reparación e instalación de lavadoras, refrigeradores, estufas y más.', iconName: 'Refrigerator' },
      { name: 'Seguridad, Cámaras y Alarmas', slug: 'seguridad-camaras-y-alarmas', description: 'Cámaras, alarmas, control de acceso y soluciones de seguridad.', iconName: 'ShieldCheck' },
      { name: 'Automotriz y Grúas', slug: 'automotriz-y-gruas', description: 'Mecánica básica, diagnóstico, asistencia vial y servicio de grúa.', iconName: 'Car' },
      { name: 'Eventos y Servicios para Hogar', slug: 'eventos-y-servicios-para-hogar', description: 'Apoyo para eventos, organización y servicios domésticos especializados.', iconName: 'CalendarDays' },
    ],
  });

  // 3. Crear Servicios
  console.log('🛠️ Creando servicios...');
  const srv1 = await prisma.service.create({
    data: {
      userId: userJuan.id,
      categoryId: catElectricidad.id,
      title: 'Instalación Eléctrica Residencial y Balanceo de Cargas',
      description: 'Servicio profesional de diagnóstico, cableado, instalación de centros de carga, contactos 110V/220V e iluminación LED. Garantía por escrito en mano de obra.',
      pricingType: ServicePricingType.STARTING_AT,
      price: 450.00,
      location: 'Monterrey y San Pedro',
      serviceArea: 'Zona Metropolitana',
      latitude: 25.6600,
      longitude: -100.3550,
      serviceRadiusKm: 20,
      status: ServiceStatus.ACTIVE,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80', order: 0 },
          { imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80', order: 1 }
        ]
      },
      portfolioItems: {
        create: [
          {
            userId: userJuan.id,
            title: 'Modernización de tablero principal en casa habitación',
            description: 'Sustitución de caja de fusibles obsoleta por centro de carga QOD con pastillas termomagnéticas Square D.',
            imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'
          }
        ]
      }
    },
  });

  const srv2 = await prisma.service.create({
    data: {
      userId: userMaria.id,
      categoryId: catPlomeria.id,
      title: 'Detección de Fugas e Instalación de Boiler de Paso',
      description: 'Solución rápida a problemas de baja presión, fugas en tubería de cobre y CPVC, reemplazo de mezcladoras y mantenimiento a bombas presurizadoras.',
      pricingType: ServicePricingType.FIXED,
      price: 650.00,
      location: 'Guadalupe y Monterrey',
      serviceArea: 'Toda la zona urbana',
      latitude: 25.6770,
      longitude: -100.2580,
      serviceRadiusKm: 20,
      status: ServiceStatus.ACTIVE,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80', order: 0 }
        ]
      }
    },
  });

  const srv3 = await prisma.service.create({
    data: {
      userId: userCarlos.id,
      categoryId: catClimas.id,
      title: 'Mantenimiento Preventivo e Instalación de Minisplit Inverter',
      description: 'Lavado a presión con hidrolavadora y químicos desengrasantes, revisión de presión de refrigerante R410A/R32, limpieza de turbina y drenaje.',
      pricingType: ServicePricingType.FIXED,
      price: 550.00,
      location: 'Apodaca y San Nicolás',
      serviceArea: 'Zona Metropolitana de Monterrey',
      latitude: 25.7310,
      longitude: -100.2910,
      serviceRadiusKm: 25,
      status: ServiceStatus.ACTIVE,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80', order: 0 }
        ]
      }
    },
  });

  // 4. Crear Solicitudes de Trabajo (JobRequests)
  console.log('📋 Creando solicitudes de trabajo...');
  const req1 = await prisma.jobRequest.create({
    data: {
      userId: userKevin.id,
      categoryId: catClimas.id,
      title: 'Instalación de 2 Minisplits Inverter de 1.5 Toneladas',
      description: 'Requiero la instalación de dos minisplits nuevos en segunda planta. Ya cuento con los equipos y las bases de herrería. Se requiere cableado calibre 10 hasta el centro de carga.',
      location: 'Col. Cumbres 4to Sector, Monterrey',
      exactAddress: 'Paseo de los Leones #2301, Cumbres 4to Sector, Monterrey',
      latitude: 25.7150,
      longitude: -100.3800,
      budgetMin: 1800.00,
      budgetMax: 2600.00,
      status: JobRequestStatus.OPEN,
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80' }
        ]
      }
    }
  });

  const req2 = await prisma.jobRequest.create({
    data: {
      userId: userKevin.id,
      categoryId: catElectricidad.id,
      title: 'Revisión por caída de voltaje en recámara principal',
      description: 'Al encender el minisplit la luz parpadea. Sospecho que hay un falso contacto o cableado delgado en el circuito.',
      location: 'Col. Cumbres, Monterrey',
      exactAddress: 'Av. Paseo de Cumbres #980, Col. Cumbres, Monterrey',
      latitude: 25.7090,
      longitude: -100.3850,
      budgetMin: 500.00,
      budgetMax: 1000.00,
      status: JobRequestStatus.ASSIGNED,
    }
  });

  // 5. Crear Propuesta y WorkOrder demostrativa
  console.log('🤝 Creando propuestas y órdenes de trabajo...');
  // Propuesta abierta para req1
  await prisma.proposal.create({
    data: {
      jobRequestId: req1.id,
      workerId: userCarlos.id,
      price: 2200.00,
      message: 'Hola Kevin, con gusto puedo realizar la instalación este sábado por la mañana. Incluyo tubería aislada adicional, vacío con bomba de vacío de 2 etapas y garantía de 6 meses.',
      estimatedDays: 1,
      status: ProposalStatus.PENDING,
    }
  });

  // Propuesta aceptada para req2 con WorkOrder generada
  const propAceptada = await prisma.proposal.create({
    data: {
      jobRequestId: req2.id,
      workerId: userJuan.id,
      price: 750.00,
      message: 'Qué tal Kevin, puedo revisar el circuito hoy mismo a las 4pm. Cuento con amperímetro de gancho y probador de aislamiento para identificar la falla rápidamente.',
      estimatedDays: 1,
      status: ProposalStatus.ACCEPTED,
    }
  });

  const order2 = await prisma.workOrder.create({
    data: {
      jobRequestId: req2.id,
      proposalId: propAceptada.id,
      clientId: userKevin.id,
      workerId: userJuan.id,
      agreedPrice: 750.00,
      status: WorkOrderStatus.COMPLETED,
      completedDate: new Date(),
    }
  });

  // 6. Reseñas bidireccionales en order2
  console.log('⭐ Creando reseñas bidireccionales de prueba...');
  // Kevin califica a Juan (como trabajador)
  await prisma.review.create({
    data: {
      workOrderId: order2.id,
      authorId: userKevin.id,
      targetUserId: userJuan.id,
      rating: 5,
      comment: 'Excelente servicio por parte de Juan. Llegó puntual, detectó que el neutro estaba flojo en el registro y dejó todo funcionando impecable. 100% recomendado.',
    }
  });

  // Juan califica a Kevin (como cliente)
  await prisma.review.create({
    data: {
      workOrderId: order2.id,
      authorId: userJuan.id,
      targetUserId: userKevin.id,
      rating: 5,
      comment: 'Excelente cliente Kevin, muy claro con las especificaciones del problema y trato muy amable.',
    }
  });

  console.log('✅ Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
