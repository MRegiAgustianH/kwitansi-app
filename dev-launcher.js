const { spawn } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');

const networkInterfaces = os.networkInterfaces();
const lanIps = [];

for (const name of Object.keys(networkInterfaces)) {
  for (const net of networkInterfaces[name] || []) {
    if (net.family === 'IPv4' && !net.internal) {
      lanIps.push(net.address);
    }
  }
}

console.log('\n' + '='.repeat(68));
console.log('  🛠️  MODE PENGEMBANGAN (DEV): SISTEM KWITANSI MCU');
console.log('='.repeat(68));
console.log('  📍 Akses Lokal:  http://localhost:3000');
lanIps.forEach((ip) => {
  console.log(`  🌐 Akses LAN:    http://${ip}:3000`);
});
console.log('='.repeat(68) + '\n');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const backend = spawn(npmCmd, ['run', 'start:dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '3001' },
});

const frontend = spawn(npmCmd, ['run', 'dev', '--', '-H', '0.0.0.0', '-p', '3000'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '3000', BACKEND_URL: 'http://localhost:3001' },
});

const cleanup = () => {
  console.log('\n🛑 Menghentikan dev server...');
  try {
    backend.kill();
  } catch (e) {}
  try {
    frontend.kill();
  } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
