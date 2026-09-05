import { spawn } from 'child_process';
import { resetE2eDatabase, getE2eEnvironment } from './e2e-database';

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

resetE2eDatabase();

const server = spawn(npxCommand, ['nest', 'start'], {
  cwd: process.cwd(),
  env: getE2eEnvironment(),
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

server.on('exit', (code) => process.exit(code ?? 0));
