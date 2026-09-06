# 🚀 BAXIO - Plataforma Web de Conexión de Servicios y Chamba

Consulta [Mantenimiento y mejoras de septiembre de 2026](MAINTENANCE.md) para la subida propia de fotos, migración, pruebas y configuración de producción.

BAXIO es una plataforma web moderna, modular y responsiva mobile-first diseñada para conectar de forma confiable a personas que ofrecen servicios con personas que necesitan contratarlos.

---

## 🌟 Características Principales (Vertical Slice 1)

1. **Cuenta Dual:** Una misma cuenta puede contratar servicios, publicar requerimientos, ofrecer servicios y enviar propuestas.
2. **Modelo Marketplace:** Explora trabajadores y servicios organizados por categorías, con filtros en vivo por oficio, ubicación, precio y calificación.
3. **Tablero de Solicitudes:** Clientes publican directamente lo que necesitan y reciben propuestas competitivas de profesionales calificados.
4. **Propuestas y Contrato Formal (`WorkOrder`):** Los trabajadores envían presupuestos y plazos. Al aceptar una propuesta, se ejecuta una transacción atómica de Prisma que cierra la solicitud y genera la `WorkOrder`.
5. **Reseñas Bidireccionales Preparadas:** El esquema vincula calificaciones a la `WorkOrder`, permitiendo que cliente y trabajador se califiquen mutuamente tras completar el trabajo.
6. **Seguridad Robusta:** Autenticación JWT mediante cookies `HttpOnly; SameSite=Lax` (cero exposición de tokens a JavaScript / localStorage).

---

## 🧭 Prioridad futura: pagos protegidos dentro de BAXIO

La integración de pagos es una prioridad de producto, pero queda deliberadamente fuera de la versión actual. Se evaluará una solución de marketplace como **Stripe Connect** (y una alternativa local como Mercado Pago) cuando el flujo de contratación esté validado.

Antes de implementarla se deben definir y probar: comisión de BAXIO, cobro al aceptar la propuesta, liberación al confirmar el trabajo, reembolsos, cancelaciones y manejo de disputas. No se debe prometer ni operar custodia de fondos sin la validación legal, operativa y técnica correspondiente.

---

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Axios.
- **Backend:** NestJS 10, TypeScript, Prisma ORM, MySQL, Class-Validator, Cookie-Parser, Passport-JWT.
- **Arquitectura:**
  - Backend: `Controller → Service → Repository → Prisma → MySQL`.
  - Frontend: `App Router → Features → Components → API Services`.

---

## 📂 Estructura del Repositorio

```text
baxio/
├── backend/                  # Servidor NestJS y ORM Prisma
│   ├── prisma/
│   │   ├── schema.prisma     # Esquema de base de datos MySQL normalizado
│   │   └── seed.ts           # Script de datos realistas de prueba
│   └── src/
│       ├── common/           # Filtros, Guards JWT, Decoradores (@CurrentUser, @Public)
│       ├── auth/             # Autenticación segura y emisión de cookies HttpOnly
│       ├── users/            # Perfil, consulta de trabajadores y reputación
│       ├── categories/       # Catálogo de categorías
│       ├── services/         # Marketplace de servicios
│       ├── job-requests/     # Tablero de solicitudes de trabajo
│       ├── proposals/        # Cotizaciones y aceptación transaccional
│       ├── work-orders/      # Órdenes de trabajo formalizadas
│       └── app.module.ts
│
├── frontend/                 # Aplicación Next.js (App Router)
│   ├── src/
│   │   ├── app/              # Rutas: Home, Explore, Services, JobRequests, Orders, Profile, Auth
│   │   ├── components/
│   │   │   ├── ui/           # Button, Input, Modal, Card, Badge, Avatar, Rating, EmptyState
│   │   │   └── layout/       # Navbar, MobileNavigation, Footer, PageContainer
│   │   ├── features/         # Módulos encapsulados por dominio
│   │   ├── services/api/     # Cliente Axios y endpoints tipados
│   │   └── styles/           # Tailwind CSS y tokens de diseño
│
└── README.md
```

---

## ⚙️ Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MySQL Server** (puerto 3306)

---

## 🚀 Puesta en Marcha Local

### 1. Configuración de Base de Datos y Backend

1. Entra a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Configura las variables de entorno en `.env`:
   ```env
   PORT=4000
   NODE_ENV=development
   DATABASE_URL="mysql://root:TU_PASSWORD_MYSQL@localhost:3306/baxio_db"
   JWT_SECRET="REPLACE_WITH_A_RANDOM_SECRET"
   JWT_EXPIRES_IN="7d"
   FRONTEND_URL="http://localhost:3000"
   ```
Genera un secreto privado para JWT con `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` y cópialo únicamente a `backend/.env`. Nunca reutilices ejemplos ni lo publiques.

3. Instala dependencias y genera el cliente Prisma:
   ```bash
   npm install
   npx prisma generate
   ```
4. Aplica el esquema a MySQL y ejecuta el seed con datos de prueba:
   ```bash
   npx prisma db push
   npm run seed
   ```
5. Inicia el servidor NestJS en modo desarrollo:
   ```bash
   npm run start:dev
   ```
   *El backend estará disponible en `http://localhost:4000/api`.*

---

### 2. Configuración y Ejecución del Frontend

1. En una nueva terminal, entra a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Verifica el archivo `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:4000/api"
   ```
4. Inicia el servidor de desarrollo Next.js:
   ```bash
   npm run dev
   ```
5. Abre en tu navegador `http://localhost:3000`.

---

## 🔑 Cuentas de Prueba (Seed)

| Usuario | Correo | Contraseña | Rol / Descripción |
|---|---|---|---|
| **Kevin Ramos** | `kevin@baxio.com` | `password123` | Cliente / Creador de Solicitudes |
| **Juan Pérez** | `juan.electricista@baxio.com` | `password123` | Técnico Electricista Pro (4.95 ★) |
| **María González** | `maria.reparaciones@baxio.com` | `password123` | Especialista en Plomería (4.88 ★) |
| **Carlos Mendoza** | `carlos.climas@baxio.com` | `password123` | Técnico en Minisplits (4.92 ★) |

---

## 📱 Vistas Incluidas en esta Base

- **Home (`/`):** Hero con buscador dinámico, carrusel de categorías, servicios destacados, solicitudes de trabajo recientes y llamadas a la acción.
- **Explorar (`/explore`):** Vista con pestañas interactivas para *Servicios*, *Solicitudes* y *Trabajadores*, filtros por categoría y ordenamiento.
- **Detalle de Servicio (`/services/[id]`):** Galería fotográfica, información del prestador, modalidad de cobro y modal de cotización directa.
- **Publicar Servicio (`/services/new`):** Formulario modular para ofertar servicios en el marketplace.
- **Tablero de Solicitudes (`/job-requests`):** Listado de trabajos abiertos que necesitan atención.
- **Detalle de Solicitud (`/job-requests/[id]`):** Vista de requerimiento con modal para enviar propuestas y panel del cliente para aceptar propuestas y formalizar la orden.
- **Publicar Trabajo (`/job-requests/new`):** Formulario para solicitar trabajos con presupuesto y fecha requerida.
- **Mis Trabajos Contratados (`/my-orders`):** Panel de seguimiento de órdenes de trabajo generadas.
- **Perfil de Trabajador (`/workers/[id]`):** Perfil público con biografía, portafolio y reseñas verificadas.
- **Perfil Privado (`/profile`):** Edición de información personal y estadísticas de reputación dual (como trabajador y como cliente).
- **Autenticación (`/auth/login` y `/auth/register`):** Flujos de acceso seguros con cookies HttpOnly.
