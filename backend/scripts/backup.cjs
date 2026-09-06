/* Creates a local, restorable snapshot of MySQL plus uploads. It never prints secrets. */
require('dotenv').config();
const { createWriteStream, existsSync, mkdirSync, readdirSync, rmSync, statSync, copyFileSync, mkdtempSync, writeFileSync, unlinkSync } = require('fs');
const { basename, join, resolve } = require('path');
const { spawnSync } = require('child_process');
const { tmpdir } = require('os');
const { randomBytes } = require('crypto');
const { pipeline } = require('stream/promises');
const { createGzip } = require('zlib');

async function main() {
const database = new URL(process.env.DATABASE_URL || '');
if (database.protocol !== 'mysql:' || !database.hostname || !database.pathname || !database.username) throw new Error('DATABASE_URL debe apuntar a MySQL con usuario y base de datos.');
const target = resolve(process.env.BACKUP_DIR || join(process.cwd(), 'backups'));
const retention = Number(process.env.BACKUP_RETENTION_DAYS || 14);
if (!Number.isInteger(retention) || retention < 1 || retention > 365) throw new Error('BACKUP_RETENTION_DAYS debe estar entre 1 y 365.');
mkdirSync(target, { recursive: true, mode: 0o700 });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const snapshot = join(target, `baxio-${stamp}`); mkdirSync(snapshot, { mode: 0o700 });
const configDir = mkdtempSync(join(tmpdir(), 'baxio-backup-'));
const configFile = join(configDir, 'mysql.cnf');
const password = decodeURIComponent(database.password);
writeFileSync(configFile, `[client]\nuser=${decodeURIComponent(database.username)}\npassword=${password}\nhost=${database.hostname}\nport=${database.port || '3306'}\n`, { mode: 0o600 });
const candidates = [process.env.MYSQLDUMP_PATH, 'mysqldump', 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqldump.exe'].filter(Boolean);
let dump; for (const candidate of candidates) { dump = spawnSync(candidate, [`--defaults-extra-file=${configFile}`, '--single-transaction', '--routines', '--events', '--hex-blob', database.pathname.slice(1)], { encoding: null, windowsHide: true }); if (!dump.error) break; }
try {
  if (!dump || dump.error || dump.status !== 0) throw new Error('mysqldump no pudo crear el respaldo. Verifica MYSQLDUMP_PATH y el acceso a MySQL.');
  const sqlPath = join(snapshot, 'database.sql.gz');
  await pipeline(require('stream').Readable.from(dump.stdout), createGzip({ level: 9 }), createWriteStream(sqlPath, { mode: 0o600 }));
  const uploads = resolve(process.env.UPLOADS_DIR || join(process.cwd(), 'uploads'));
  let uploadFiles = 0;
  function copyTree(source, destination) { mkdirSync(destination, { recursive: true, mode: 0o700 }); for (const entry of readdirSync(source, { withFileTypes: true })) { if (entry.name.startsWith('.')) continue; const from = join(source, entry.name), to = join(destination, entry.name); if (entry.isDirectory()) copyTree(from, to); else if (entry.isFile()) { copyFileSync(from, to); uploadFiles++; } } }
  if (existsSync(uploads)) copyTree(uploads, join(snapshot, 'uploads'));
  writeFileSync(join(snapshot, 'manifest.json'), JSON.stringify({ createdAt: new Date().toISOString(), database: database.pathname.slice(1), uploadsIncluded: existsSync(uploads), uploadFiles, restore: 'gunzip -c database.sql.gz | mysql --defaults-extra-file=<private-config> <database>' }, null, 2), { mode: 0o600 });
  const cutoff = Date.now() - retention * 86_400_000;
  for (const entry of readdirSync(target, { withFileTypes: true })) { const full = join(target, entry.name); if (entry.isDirectory() && entry.name.startsWith('baxio-') && statSync(full).mtimeMs < cutoff) rmSync(full, { recursive: true, force: true }); }
  console.log(`Respaldo creado en ${snapshot}. Base de datos y ${uploadFiles} archivo(s) de uploads incluidos.`);
} finally { try { unlinkSync(configFile); } catch {} try { rmSync(configDir, { recursive: true, force: true }); } catch {} }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : 'No se pudo crear el respaldo.'); process.exitCode = 1; });
