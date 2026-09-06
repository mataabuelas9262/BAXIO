require('dotenv').config();
const { PrismaClient, Role } = require('@prisma/client');
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
  console.error('Uso: npm run admin:grant -- correo@ejemplo.com'); process.exitCode = 1;
} else {
  const db = new PrismaClient();
  db.user.updateMany({ where: { email }, data: { role: Role.ADMIN } }).then(({ count }) => {
    if (count !== 1) throw new Error('No existe una cuenta con ese correo.');
    console.log(`La cuenta ${email} ahora es ADMIN. Debe cerrar e iniciar sesión para ver Moderar reportes.`);
  }).catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
}
