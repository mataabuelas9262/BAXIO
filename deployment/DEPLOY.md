# Publicar BAXIO

Este archivo prepara una sola máquina Linux con Docker. No ejecuta `seed`: la base de producción empieza sin cuentas demo.

1. Compra o asigna un dominio y apunta sus registros A/AAAA al servidor. Abre los puertos 80 y 443. Caddy solicitará y renovará HTTPS automáticamente cuando el dominio ya resuelva al servidor.
2. Instala Docker Engine y el complemento Docker Compose en el servidor. Clona el repositorio privado, copia `deployment/production.env.example` como `deployment/production.env` y genera los secretos. No uses valores de ejemplo ni reutilices las claves locales. Para contraseñas dentro de `DATABASE_URL`, codifica caracteres especiales con URL encoding.
3. Revisa que `DOMAIN`, `FRONTEND_URL`, `SMTP_*`, `DATABASE_URL`, `UPLOADS_DIR` y `BACKUP_DIR` sean de producción. Conserva `MFA_ENCRYPTION_KEY` en una bóveda: perderla impide validar los autenticadores 2FA existentes.
4. Crea el esquema sin cargar datos demo: `docker compose --env-file deployment/production.env -f docker-compose.production.yml --profile tools run --rm migrate`.
5. Inicia el sitio: `docker compose --env-file deployment/production.env -f docker-compose.production.yml up -d --build`.
6. Comprueba `https://TU_DOMINIO/api/health`. Configura un monitor externo para consultar esa dirección cada minuto y avisarte si deja de devolver 200. También revisa los logs con `docker compose ... logs -f api caddy`.
7. Programa cada día `docker compose --env-file deployment/production.env -f docker-compose.production.yml exec -T api npm run backup`. Copia el volumen `backups_data` a almacenamiento externo y practica una restauración en una base vacía.

La base, las fotos y los respaldos están en volúmenes Docker. Antes de actualizar, ejecuta un respaldo. Para actualizar: `git pull`, repite migración y usa `up -d --build`.

No expongas MySQL, la API ni los volúmenes como puertos públicos. Solo Caddy publica 80/443. Las alertas de salud requieren elegir un monitor externo al desplegar; este repositorio no envía información a terceros por defecto.
