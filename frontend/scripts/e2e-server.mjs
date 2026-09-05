import { spawn } from 'node:child_process';

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const server = spawn(npxCommand, ['next', 'dev', '-p', '3001'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_PUBLIC_API_URL: 'http://localhost:4001/api',
  },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

server.on('exit', (code) => process.exit(code ?? 0));
