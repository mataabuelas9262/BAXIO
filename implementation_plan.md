# Plan de Implementación: Geolocalización Progresiva, "Cerca de Mí" y Privacidad de Direcciones

## Objetivo
Implementar geolocalización por proximidad en BAXIO sin comprometer la privacidad:
1. **Público:** Se muestra únicamente la **zona aproximada** (ej. *"San Pedro • Valle Oriente"*) y la **distancia estimada en KM** (ej. *"A 2.4 km de ti"*) calculada mediante la fórmula de Haversine al activar el botón **`📍 Cerca de Mí`**.
2. **Privado:** La **dirección exacta** (calle, número interior/exterior y referencias) se mantiene estrictamente oculta y **solo se revela al profesional asignado una vez formalizada la `WorkOrder`**.

---

## Decisiones de Arquitectura y Privacidad

1. **Privacidad por Diseño (Cero Direcciones Expuestas Públicamente):**
   * El modelo `JobRequest` se dividirá en:
     * `location` / `approxLocation`: Nombre de colonia, zona o municipio visible públicamente.
     * `exactAddress`: Calle, número, código postal y referencias. **Oculto en búsquedas públicas.**
     * `latitude` / `longitude`: Coordenadas para cálculo matemático de distancia.
2. **Desbloqueo de Dirección en `WorkOrder`:**
   * Solo cuando el cliente acepta una propuesta y se crea la `WorkOrder` (`IN_PROGRESS`), el backend expone `exactAddress` al trabajador contratado.
3. **Cálculo de Distancia Ligero (Fórmula de Haversine):**
   * El botón `📍 Cerca de Mí` obtiene `(lat, lng)` del navegador con `navigator.geolocation.getCurrentPosition()`.
   * El backend calcula la distancia `distanceKm = haversine(userLat, userLng, itemLat, itemLng)`.
   * Ordena de menor a mayor distancia y permite filtrar por radio (**5 km**, **10 km**, **25 km**, **Toda la ciudad**).
4. **Sin rastreo invasivo continuo:**
   * La ubicación solo se solicita cuando el usuario decide presionar activamente `📍 Cerca de Mí`.

---

## User Review Required

> [!IMPORTANT]
> **Privacidad:** La dirección exacta de una casa o negocio jamás aparecerá en el tablero público de solicitudes ni en el catálogo de servicios. Solo el técnico con un contrato activo (`WorkOrder`) tendrá acceso a la dirección completa y referencias para acudir a realizar la chamba.

---

## Proposed Changes

### Backend (NestJS + Prisma + MySQL)

#### [MODIFY] [schema.prisma](file:///c:/Users/kevin/Downloads/Chambalink/backend/prisma/schema.prisma)
* En `model User`:
  * `latitude Float?`
  * `longitude Float?`
  * `serviceRadiusKm Int? @default(15)`
* En `model JobRequest`:
  * `latitude Float?`
  * `longitude Float?`
  * `exactAddress String? @db.Text` (Privada)
* En `model Service`:
  * `latitude Float?`
  * `longitude Float?`
  * `serviceRadiusKm Int? @default(15)`

#### [NEW] [geo.utils.ts](file:///c:/Users/kevin/Downloads/Chambalink/backend/src/common/utils/geo.utils.ts)
* Función `calculateDistanceKm(lat1, lon1, lat2, lon2)` basada en la fórmula de Haversine.

#### [MODIFY] [job-requests.repository.ts](file:///c:/Users/kevin/Downloads/Chambalink/backend/src/job-requests/job-requests.repository.ts)
* En `findAll`: aceptar `userLat`, `userLng`, `maxRadiusKm`. Omitir `exactAddress`.
* Si se proporcionan coordenadas, calcular `distanceKm`, filtrar por radio y ordenar por cercanía.

#### [MODIFY] [work-orders.repository.ts](file:///c:/Users/kevin/Downloads/Chambalink/backend/src/work-orders/work-orders.repository.ts)
* En `findById` y `findMyWorkOrders`: incluir `jobRequest.exactAddress` para el cliente y el trabajador contratado.

#### [MODIFY] [services.repository.ts](file:///c:/Users/kevin/Downloads/Chambalink/backend/src/services/services.repository.ts)
* En `findAll`: permitir ordenar por cercanía si se activa `userLat` / `userLng`.

---

### Frontend (Next.js 14 App Router + Tailwind)

#### [MODIFY] [types/common.types.ts](file:///c:/Users/kevin/Downloads/Chambalink/frontend/src/types/common.types.ts)
* Actualizar interfaces `JobRequest`, `Service`, `User` con `latitude`, `longitude`, `distanceKm?`, `exactAddress?`.

#### [MODIFY] [job-requests/page.tsx](file:///c:/Users/kevin/Downloads/Chambalink/frontend/src/app/job-requests/page.tsx)
* Botón destacado **`[ 📍 Cerca de Mí ]`** con selector de radio (**5 km | 10 km | 25 km**).
* Badges de proximidad en tarjetas:  
  **`📍 San Pedro • A 1.8 km de ti`**.

#### [MODIFY] [explore/page.tsx](file:///c:/Users/kevin/Downloads/Chambalink/frontend/src/app/explore/page.tsx)
* Soporte para `📍 Cerca de Mí` en el catálogo de servicios y trabajadores.

#### [MODIFY] [job-requests/new/page.tsx](file:///c:/Users/kevin/Downloads/Chambalink/frontend/src/app/job-requests/new/page.tsx)
* Formulario con separación clara:
  1. **Zona / Colonia o Municipio (Público):** *"ej. San Pedro Garza García • Zona Valle"*.
  2. **Dirección Exacta (Privada y Protegida):** *"Calle Río Mississippi #123 Int 4. Solo visible para el técnico contratado"*.
  3. Botón opcional: **`[ 📍 Usar mi ubicación actual para calcular distancia ]`**.

#### [MODIFY] [my-orders/page.tsx](file:///c:/Users/kevin/Downloads/Chambalink/frontend/src/app/my-orders/page.tsx)
* Caja destacada de **"📍 Dirección del Servicio"** con la dirección exacta, referencias y botón de abrir en Google Maps / Waze para el profesional contratado.

---

## Plan de Verificación

### Compilación y Tipado
* `npm run build` en backend y frontend sin errores.

### Pruebas de Flujo y Privacidad
1. **Publicar Solicitud con Dirección Privada:**
   * Entrar como cliente (`kevin@baxio.com`) y publicar una solicitud indicando Zona: *"Monterrey Sur"* y Dirección exacta: *"Av. Eugenio Garza Sada #2501, Col. Tecnológico"*.
2. **Verificar Ocultamiento Público:**
   * Entrar como técnico (`juan.electricista@baxio.com`) en `/job-requests`: verificar que solo ve *"Monterrey Sur"* y la distancia *"A X.X km"*, pero **NO** la dirección exacta.
3. **Verificar Activación de `📍 Cerca de Mí`:**
   * Probar el botón de cercanía con permisos del navegador y validar el ordenamiento de más cercano a más lejano.
4. **Verificar Desbloqueo tras Contratar (`WorkOrder`):**
   * Aceptar la propuesta de Juan y abrir `/my-orders`: verificar que Juan ahora sí ve la caja privada con la dirección exacta para acudir al trabajo.
