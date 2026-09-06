import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { createApiLimiters } from './common/api-rate-limit';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import { join } from 'path';
import { getUploadsDir } from './uploads/uploads.storage';

async function bootstrap() {
  const logger = new Logger('BAXIO_Bootstrap');
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable('x-powered-by');

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    );
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const frontendOrigins = frontendUrl.split(',').map(origin => origin.trim()).filter(Boolean);

  // Habilitar CORS con soporte de cookies y credenciales
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? frontendOrigins
      : [...frontendOrigins, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  const limiters = createApiLimiters();
  app.use('/api', limiters.api);
  app.use('/api/auth', (req: Request, res: Response, next: NextFunction) => req.method === 'POST' ? limiters.auth(req, res, next) : next());

  // Parseo de cookies para autenticación JWT segura
  app.use(cookieParser());

  // Servir archivos estáticos de uploads de forma segura
  app.use('/uploads', express.static(getUploadsDir(), {
    dotfiles: 'deny',
    setHeaders: (res, path) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (path.toLowerCase().endsWith('.pdf')) res.setHeader('Content-Disposition', 'attachment');
    },
  }));

  // Prefijo global de la API REST
  app.setGlobalPrefix('api');

  // Validación estricta global con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 BAXIO API Server running on: http://localhost:${port}/api`);
}

bootstrap();
