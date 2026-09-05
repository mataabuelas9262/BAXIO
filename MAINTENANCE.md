# Mantenimiento y mejoras — septiembre de 2026

## Entorno local

Node.js 24, MySQL 8.4. Frontend en 3000 y API en 4000. Las pruebas utilizan 3001, 4001, la base `baxio_e2e`, `backend/uploads-e2e` y `.next-e2e`. Los archivos y datos normales no se reinician al ejecutar las pruebas.

La carpeta ya tiene Git local. Las credenciales, SQL, archivos subidos, dependencias y resultados generados están excluidos. No hay un remoto ni publicación automática configurados.

## Fotos

Servicios y solicitudes admiten hasta seis fotografías con vista previa. Cada imagen puede marcarse como **Imagen ilustrativa (IA o referencia)**. La marca se conserva al editar y se muestra en el detalle; también aparece en las tarjetas de servicios.

Las imágenes nuevas deben subirse mediante el selector: JPG, PNG o WebP, máximo 5 MB, entre 32 y 8000 píxeles por lado y hasta 24 megapíxeles. El servidor comprueba el formato real, rechaza animaciones, decodifica y convierte a WebP, corrige orientación, limita la salida a 2000 píxeles (512 para avatar) y elimina metadatos. Solo el dueño puede asociar una subida nueva a su publicación.

Los PDF de credenciales admiten hasta 10 MB, se comprueba su firma y terminación y se sirven como descarga. Esto no equivale a un análisis antivirus. Si falla una subida, se informa el error y se conserva el formulario para reintentar; no se inventa una ruta de archivo.

Las imágenes antiguas mediante URL siguen disponibles y pueden conservarse al editar. La CSP mantiene `https:` para no romperlas. `IMAGE_SOURCE_ORIGINS` permite limitar los orígenes cuando se haya revisado o migrado el contenido antiguo; una cadena vacía permite solo imágenes del propio sitio, data y blob. No se descargan automáticamente archivos externos.

Los uploads viven en `UPLOADS_DIR` o, en desarrollo, en `backend/uploads`. `/uploads` se redirige desde Next al backend para que fotos y avatares funcionen con rutas relativas. Al quitar una foto de una publicación se elimina su asociación; el archivo se conserva para evitar borrar archivos que se estén usando. La depuración de archivos sin referencias deberá hacerse con un inventario y respaldo.

## Migración desde un respaldo SQL anterior

Con los servidores apagados y un respaldo reciente:

```powershell
cd backend
npm ci
npm run prisma:generate
npm run migrate:images
npm run build
```

`migrate:images` añade únicamente `isIllustrative` a ServiceImage y JobRequestImage si falta, sin resetear tablas. No usar `seed` para migrar datos existentes. El seed borra datos y está bloqueado en producción.

## Verificación

```powershell
cd backend
npm test
npm run build
cd ../frontend
$env:PLAYWRIGHT_CHANNEL='msedge' # Opcional en Windows si Chromium no está instalado
npm run test:e2e
```

Para el navegador predeterminado: `npx playwright install chromium`. Para ver el informe: `npx playwright show-report`. Se guardan capturas de cinco rutas móviles en claro/oscuro y de la galería móvil. Las pruebas comprueban desbordamiento, visibilidad y comportamiento; las capturas son para revisión visual, no una comparación de píxeles con un patrón aprobado.

Para compilar sin interferir con el servidor local:

```powershell
$env:NEXT_DIST_DIR='.next-build'
npm run build
```

El flujo `.github/workflows/ci.yml` prepara MySQL y ejecuta pruebas y compilaciones en un entorno aislado cuando se publique en GitHub. Se ha preparado localmente; no se ha ejecutado en GitHub.

## Preparación para producción

- Copiar las plantillas `.env.example` y configurar valores propios. Backend: `NODE_ENV=production`, usuario MySQL distinto de root con permisos limitados, `JWT_SECRET` aleatorio de al menos 48 caracteres, `FRONTEND_URL` con orígenes HTTPS exactos y `UPLOADS_DIR` absoluto en un volumen persistente. El backend rechaza configuraciones inseguras.
- Frontend: usar `NEXT_PUBLIC_API_URL=/api` y `API_INTERNAL_URL` con la dirección interna del backend. Configurar HTTPS y respaldos del volumen de archivos junto con la base de datos.
- La interfaz no muestra las credenciales demo en producción. Esto no elimina cuentas demo de una base ya poblada: usar una base de producción preparada sin el seed de demostración.
- Se mantiene la CSP con nonce y sin `unsafe-inline`/`unsafe-eval` en producción. Antes de restringir imágenes, inventariar sus orígenes.
- El arranque compilado del backend es `npm run start:prod` (usa `dist/src/main.js`).

## Decisiones pendientes

Los pagos siguen pospuestos: requieren definición de proveedor, comisión, reembolsos y disputas. La recuperación por correo aún no está implementada; sus pruebas se añadirán cuando exista ese flujo y un proveedor de correo. No se ha contratado alojamiento ni desplegado el proyecto.
