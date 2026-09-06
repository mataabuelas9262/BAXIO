import { validateJwtSecret } from './validate-jwt-secret';
import { validateProduction } from './validate-production';
export default () => {
  validateJwtSecret(process.env.JWT_SECRET);
  validateProduction(process.env);
  return ({
  port: parseInt(process.env.PORT || '4000', 10),
  database: {
    url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/baxio_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  });
};
