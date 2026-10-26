import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as os from 'node:os';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = Number(process.env.PORT) || 3001;
  const host = '0.0.0.0';

  await app.listen(port, host);

  // Get local network IPs for LAN access
  const networkInterfaces = os.networkInterfaces();
  const lanIps: string[] = [];

  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        lanIps.push(net.address);
      }
    }
  }

  logger.log(`====================================================`);
  logger.log(`🏥 Backend API Aktif di Port ${port}`);
  logger.log(`👉 Buka Aplikasi Kwitansi di Browser (PORT 3000):`);
  logger.log(`   📍 Komputer Ini: http://localhost:3000`);
  lanIps.forEach((ip) => {
    logger.log(`   🌐 Komputer Lain: http://${ip}:3000`);
  });
  logger.log(`====================================================`);
}
bootstrap();
