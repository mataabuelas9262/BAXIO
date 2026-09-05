import { validateProduction } from './validate-production';
export default () => {
  validateProduction(process.env);
  return ({
  port: parseInt(process.env.PORT || '4000', 10),
  database: {
    url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/baxio_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'baxio_default_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  });
};
