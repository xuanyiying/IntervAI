import 'reflect-metadata';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { MonitoringGuard } from '@/infrastructure/monitoring/guards/monitoring.guard';
import { MonitoringInterceptor } from '@/infrastructure/monitoring/interceptors/monitoring.interceptor';
import { initOpenTelemetry } from '@/infrastructure/monitoring/utils/otel';
import { RedisIoAdapter } from '@/modules/chat/gateways/redis-io.adapter';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import * as express from 'express';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';

async function bootstrap() {
  // Voiceprint enrollment uploads raw PCM as base64 JSON (~400KB for 9s),
  // exceeding the default 100kb JSON limit — register parsers explicitly.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bodyParser: false,
  });

  // Caddy 是唯一一跳反代，且用 {remote_host} 覆写 X-Forwarded-For。
  // 不设 trust proxy 时 req.ip 恒为 Caddy 容器 IP，全局限流会退化成全站共享配额。
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '4mb' }));
  app.use(express.urlencoded({ extended: true, limit: '4mb' }));

  // Initialize OpenTelemetry (optional, env controlled)
  await initOpenTelemetry();

  // Enable WebSocket support with Redis adapter (fallback to default)
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;
  const redisPassword = process.env.REDIS_PASSWORD;
  if (redisHost && redisPort) {
    const redisUrl =
      redisPassword && redisPassword.length > 0
        ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
        : `redis://${redisHost}:${redisPort}`;
    app.useWebSocketAdapter(new RedisIoAdapter(app, redisUrl));
  } else {
    app.useWebSocketAdapter(new IoAdapter(app));
  }

  // Initialize Sentry for error tracking
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(
        process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'
      ),
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.OnUncaughtException(),
        new Sentry.Integrations.OnUnhandledRejection(),
      ],
    });

    // Use Sentry request handler
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.errorHandler());
  }

  // Use Winston logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Apply global monitoring interceptor
  const monitoringInterceptor = app.get(MonitoringInterceptor);
  app.useGlobalInterceptors(monitoringInterceptor);

  // Apply global monitoring guard
  const monitoringGuard = app.get(MonitoringGuard);
  app.useGlobalGuards(monitoringGuard);

  // Apply global exception filter
  const httpExceptionFilter = app.get(HttpExceptionFilter);
  app.useGlobalFilters(httpExceptionFilter);

  // Security: Helmet middleware for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    })
  );

  // Global validation pipe with enhanced security
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    })
  );

  // CORS configuration with security
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const allowedOrigins = corsOrigin.split(',').map((origin) => origin.trim());
  const isProduction = process.env.NODE_ENV === 'production';

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (isProduction) {
        callback(new Error(`CORS rejected origin: ${origin}`), false);
        return;
      }

      console.warn(`CORS rejected origin: ${origin}`);
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 3600,
  });

  // API prefix
  const apiPrefix = process.env.API_PREFIX || '/api/v1';
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health', '/'],
  });

  // Swagger 文档：生产默认关闭，需显式 ENABLE_SWAGGER=true 才暴露
  const enableSwagger = !isProduction || process.env.ENABLE_SWAGGER === 'true';
  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Interview AI API')
      .setDescription(
        'AI-powered interview preparation and resume optimization platform API'
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('resumes', 'Resume management endpoints')
      .addTag('jobs', 'Job management endpoints')
      .addTag('optimizations', 'Resume optimization endpoints')
      .addTag('generate', 'PDF generation endpoints')
      .addTag('interview', 'Interview preparation endpoints')
      .addTag('account', 'Account endpoints')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // SIGTERM/SIGINT 时排水 Bull 队列、Prisma 连接与 Socket.IO，避免滚动发布掐断进行中的面试
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.warn(`🚀 [DEBUG] STARTING SERVER ON PORT ${port}`);
  await app.listen(port);

  logger.log(
    `Application is running on: http://localhost:${port}`,
    'Bootstrap'
  );
  if (enableSwagger) {
    logger.log(
      `Swagger documentation available at: http://localhost:${port}/api/docs`,
      'Bootstrap'
    );
  }
}

bootstrap();
