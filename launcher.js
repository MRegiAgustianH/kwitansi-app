const { spawn, execSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// Fungsi otomatis membersihkan port jika masih tersisa proses lama
function freePort(port) {
  if (!isWin) return;
  try {
    const stdout = execSync(`netstat -ano | findstr :${port}`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const lines = stdout.split('\n');
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && pid !== String(process.pid)) {
          console.log(`  🔄 Membersihkan proses lama pada port ${port} (PID: ${pid})...`);
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        }
      }
    }
  } catch (e) {
    // Port sudah bebas
  }
}

// Bersihkan port 3000 & 3001 sebelum menjalankan server
freePort(3000);
freePort(3001);
// Ambil daftar alamat IP LAN komputer ini
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
console.log('  🏥 SISTEM KWITANSI MCU RUMAH SAKIT');
console.log('     Klinik Utama Dr. H. A. Rotinsulu Cianjur');
console.log('='.repeat(68));
console.log('  📍 Akses di Komputer Ini (Server Kasir):');
console.log('     http://localhost:3000\n');
console.log('  🌐 Akses dari Komputer Lain di Jaringan LAN RS:');
if (lanIps.length > 0) {
  lanIps.forEach((ip) => {
    console.log(`     👉 http://${ip}:3000`);
  });
} else {
  console.log('     (Hubungkan komputer ke kabel LAN atau WiFi RS untuk melihat IP)');
}
console.log('='.repeat(68));
console.log('  Menjalankan Backend (NestJS :3001) & Frontend (Next.js :3000)...\n');
// Jalankan backend
const backend = spawn(npmCmd, ['run', 'start:prod'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '3001' },
});

// Jalankan frontend
const frontend = spawn(npmCmd, ['run', 'start', '--', '-H', '0.0.0.0', '-p', '3000'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '3000', BACKEND_URL: 'http://localhost:3001' },
});

const cleanup = () => {
  console.log('\n🛑 Menghentikan server aplikasi...');
  try {
    if (backend && backend.pid) {
      if (isWin) {
        execSync(`taskkill /F /T /PID ${backend.pid}`, { stdio: 'ignore' });
      } else {
        backend.kill('SIGTERM');
      }
    }
  } catch (e) {}
  try {
    if (frontend && frontend.pid) {
      if (isWin) {
        execSync(`taskkill /F /T /PID ${frontend.pid}`, { stdio: 'ignore' });
      } else {
        frontend.kill('SIGTERM');
      }
    }
  } catch (e) {}
  freePort(3000);
  freePort(3001);
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
