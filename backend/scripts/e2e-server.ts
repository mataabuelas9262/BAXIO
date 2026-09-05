import { resetE2eDatabase, getE2eEnvironment } from './e2e-database';

resetE2eDatabase();

Object.assign(process.env, getE2eEnvironment());
void import('../src/main');
