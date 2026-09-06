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

## Consultas simultáneas y límites

El backend local usa un pool de Prisma con 10 conexiones y hasta 10 segundos de espera por conexión. Los parámetros `connection_limit` y `pool_timeout` de `DATABASE_URL` pueden ajustarse entre 1 y 100; no se admite espera ilimitada. Cada instancia del backend tiene su propio pool.

Antes de autenticar o consultar SQL, `/api` aplica un máximo de 240 peticiones por minuto y dirección IP. Login y registro comparten además un límite de 15 por minuto. Las respuestas bloqueadas usan HTTP 429, un mensaje en español y `Retry-After`. Se configuran con `API_RATE_LIMIT` y `AUTH_RATE_LIMIT` (enteros positivos). Las peticiones OPTIONS no cuentan.

Los contadores están en memoria y se reinician al reiniciar el proceso. Esta configuración corresponde a una sola instancia: antes de desplegar varias réplicas, usar un almacén compartido y sumar los pools al dimensionar MySQL. Se identifica la IP del socket, sin confiar en cabeceras enviadas por el navegador. Si se usa un proxy como Next o Nginx, sus visitantes comparten el límite de esa IP hasta configurar de forma segura la identificación del cliente en el despliegue. No habilitar `trust proxy=true` indiscriminadamente. Este control no sustituye protección de red ante DDoS.

Los buscadores de servicios, solicitudes y profesionales esperan una pausa de 350 ms antes de consultar. Las respuestas anteriores no sobrescriben búsquedas posteriores; los errores de carga se muestran al usuario. La pausa reduce llamadas, no cancela SQL que ya se esté ejecutando.

Crear y aceptar propuestas, y crear reseñas/recalcular promedios, usan transacciones Serializable. Los conflictos P2034 se reintentan hasta dos veces (tres intentos totales) con una pequeña espera variable; cada transacción tiene 5 segundos para empezar y 10 para ejecutarse. No incluir correos, cobros u otros efectos externos en estas funciones reintentables. La aceptación reclama la solicitud solo si sigue abierta y pertenece al cliente. Las actualizaciones de estado de una orden comparan su estado anterior y no permiten reabrir órdenes completadas o canceladas. Duplicados y conflictos devuelven 409; agotamiento del pool devuelve 503 sin exponer SQL.

Verificación: `npm run test:concurrency` en backend usa exclusivamente `baxio_e2e`, crea fixtures identificados y los elimina al terminar. No ejecutar al mismo tiempo que Playwright, que reinicia esa misma base. Incluye aceptación simultánea, reseñas concurrentes y duplicadas, cambios de estado y una ráfaga HTTP de 300 peticiones/20 concurrentes con consultas reales de categorías. Es una comprobación acotada del control de carga, no una medición de capacidad máxima de producción. `frontend/tests/search.spec.ts` cubre navegación y reducción de consultas al escribir.

## Verificación de correo y 2FA

Migración aditiva: ejecutar `npm run migrate:auth-security` en backend después de generar Prisma con `npx prisma generate`. Añade AccountSecurity y AuthChallenge sin modificar registros User existentes. Las cuentas nuevas requieren OTP antes de obtener sesión. Las existentes conservan acceso y pueden verificar el correo desde Perfil → Seguridad de mi cuenta; no se las marca automáticamente como verificadas.

El 2FA es opcional, con TOTP de seis dígitos cada 30 segundos, ventana ±1, secreto aleatorio de 160 bits y cifrado AES-256-GCM ligado al usuario. Activarlo requiere contraseña actual y un TOTP válido; desactivarlo requiere contraseña más TOTP o un código de recuperación. Los ocho códigos de recuperación tienen 80 bits aleatorios, se muestran una vez, se guardan como HMAC y se consumen transaccionalmente. No se pueden reutilizar códigos TOTP aceptados en el mismo intervalo. Cada cambio de 2FA incrementa la versión de sesión e invalida sesiones anteriores, renovando únicamente la sesión que hizo el cambio.

`MFA_ENCRYPTION_KEY` debe ser independiente del JWT y contener 32 bytes aleatorios expresados en 64 caracteres hexadecimales. En el entorno local se generó una clave en backend/.env, sin mostrarla ni guardarla en Git. Conservar una copia privada junto con las copias de seguridad: cambiarla directamente impide descifrar autenticadores existentes y validar códigos HMAC. La rotación requiere migrar secretos; no reemplazarla indiscriminadamente.

OTP de correo: seis dígitos aleatorios, vigencia 10 minutos, hash HMAC, 60 segundos entre envíos y hasta cinco intentos. El bloqueo de cinco minutos se guarda por cuenta; crear otra solicitud no lo elimina. El token de desafío es opaco y solo su hash se guarda en la base; no es una sesión. El reenvío invalida el desafío previo. Login con 2FA activo devuelve un desafío, sin cookie de sesión, hasta verificar el segundo factor. No registrar OTP, secretos ni códigos de recuperación en logs.

Sin proveedor se usa `MAIL_MODE=preview` únicamente en desarrollo: los correos de prueba se escriben en backend/.mail-preview/*.eml. Abrir el archivo más reciente que corresponda al correo de prueba y copiar sus seis dígitos. No se envían mensajes reales ni se exponen códigos mediante API. Los archivos de más de diez minutos se eliminan al generar el siguiente correo. Nunca publicar esta carpeta. La UI indica claramente que se trata de una prueba local.

Para envío real usar `MAIL_MODE=smtp`, `SMTP_HOST`, `SMTP_PORT` (587 con STARTTLS requerido o 465 con TLS), `SMTP_FROM`, y, si el servidor exige autenticación, `SMTP_USER` y `SMTP_PASSWORD`. No se acepta configuración preview en producción. El proveedor, sus credenciales, la verificación del remitente/dominio y la entrega real quedan pendientes de configuración; no se han enviado correos a destinatarios reales durante el desarrollo.

Todos los POST /api/auth comparten el límite de autenticación. Las respuestas con desafíos, QR y códigos llevan Cache-Control: no-store. Los datos de 2FA están en una relación separada para evitar que las consultas públicas de User los incluyan accidentalmente.

Pruebas: `npm run test:auth-security` usa baxio_e2e y fixtures con eliminación al terminar; ejecutar después de preparar el esquema aislado y nunca simultáneamente con Playwright. Comprueba expiración, intentos, reenvío, sesiones antiguas, contraseña insuficiente para entrar, QR/TOTP, reproducción de códigos y consumo concurrente de recuperación. `frontend/tests/security-otp.spec.ts` prueba el flujo visual completo con correos locales. Las pruebas funcionales Playwright elevan los límites solo en sus procesos aislados por compartir IP; `test:concurrency` verifica los límites normales por separado.

## Protección de secretos (septiembre 2026)

JWT_SECRET es obligatorio también en desarrollo y no acepta ejemplos ni valores cortos. Generar con crypto.randomBytes(64) y guardar solo en backend/.env. Rotar JWT invalida las sesiones anteriores. No rotar MFA_ENCRYPTION_KEY sin un procedimiento de recifrado: protege secretos 2FA existentes.

Antes de publicar, ejecutar `npm run check:secrets` en backend después de `git add`. Revisa el contenido exacto del índice Git contra las credenciales locales y bloquea archivos privados conocidos. CI también lo ejecuta. Es una comprobación complementaria, no un detector universal; no agregar secretos a NEXT_PUBLIC_* ni a documentación.
