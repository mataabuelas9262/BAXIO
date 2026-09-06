const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const dotenv = require('dotenv');
const root = path.resolve(__dirname, '../..');
const git = (...args) => execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, '-C', root, ...args], { maxBuffer: 20 * 1024 * 1024 });
const values = [];
for (const file of ['backend/.env', 'frontend/.env.local']) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  for (const [key, value] of Object.entries(dotenv.parse(fs.readFileSync(full)))) {
    if (/SECRET|PASSWORD|TOKEN|PRIVATE_KEY|API_KEY|ENCRYPTION_KEY/i.test(key) && value.length >= 8) values.push(value);
    if (key === 'DATABASE_URL') { try { const password = decodeURIComponent(new URL(value).password); if (password.length >= 8) values.push(password); } catch {} }
  }
}
const files = git('ls-files', '-z').toString().split('\0').filter(Boolean);
const problems = [];
for (const file of files) {
  if (/(^|\/)\.env($|\.)/.test(file) && !file.endsWith('.env.example')) problems.push(`${file}: archivo privado de entorno`);
  if (/\.(sql|pem|p12|pfx)$/i.test(file) || /(^|\/)\.(mail|sms)-preview/.test(file)) problems.push(`${file}: datos o claves privadas`);
  const bytes = git('show', `:${file}`);
  if (values.some(value => bytes.includes(Buffer.from(value)))) problems.push(`${file}: coincide con una credencial del entorno privado`);
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(bytes.toString())) problems.push(`${file}: clave privada`);
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`Revisión del índice Git: ${files.length} archivos, sin credenciales locales ni archivos privados detectados.`);
