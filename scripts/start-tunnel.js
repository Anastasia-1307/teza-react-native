const { spawn } = require('child_process');
const path = require('path');

console.log(' Starting localtunnel...');

const lt = spawn('lt', ['--port', '8000', '--subdomain', 'myapp'], {
  stdio: 'inherit',
  shell: true
});

lt.on('close', (code) => {
  console.log(`lt process exited with code ${code}`);
});

lt.on('error', (err) => {
  console.error('Failed to start subprocess:', err);
});
