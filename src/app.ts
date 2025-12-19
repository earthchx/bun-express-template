/**
 * @file src/app.ts
 * @description Express Application Configuration & Middleware Setup
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. สร้างและ configure Express application
 * 2. ลงทะเบียน middlewares ตามลำดับที่ถูกต้อง
 * 3. Mount routes และ documentation
 * 4. Setup error handling
 *
 * Middleware Order (สำคัญมาก!):
 * 1. Security middlewares (helmet, cors)
 * 2. Body parsers (json, urlencoded)
 * 3. Logging & Request ID (pino-http)
 * 4. Rate limiting
 * 5. Routes
 * 6. 404 handler
 * 7. Error handler (ต้องอยู่ล่างสุดเสมอ!)
 *
 * @example
 * // ใช้ใน index.ts
 * import app from './app';
 * app.listen(3000);
 *
 * // ใช้ใน tests
 * import app from '@/app';
 * const res = await request(app).get('/health');
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { generateOpenAPI } from '@/docs/openapi';
import apiV1Routes, { healthRoutes } from '@/routes';
import { errorHandler } from '@/middlewares/errorHandler';
import { config } from '@/config/env';
import { limiter } from './middlewares/rateLimiter';
import { randomUUID } from 'crypto';
import compression from 'compression';

// ============================================================
// APPLICATION SETUP
// ============================================================
const app = express();

/** Generate OpenAPI documentation once at startup */
const openApiDocument = generateOpenAPI();

// ============================================================
// 1. SECURITY MIDDLEWARES
// ============================================================
/**
 * Helmet: ตั้งค่า HTTP security headers
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - X-XSS-Protection: 1; mode=block
 * - และอื่นๆ อีกมาก
 */
app.use(helmet());

/**
 * CORS: Cross-Origin Resource Sharing
 * Default config อนุญาตทุก origins (เหมาะสำหรับ development)
 *
 * Production: ควร configure ให้เฉพาะเจาะจง
 * @example
 * app.use(cors({
 *   origin: ['https://myapp.com', 'https://admin.myapp.com'],
 *   credentials: true
 * }));
 */
app.use(cors());

// ============================================================
// 2. BODY PARSERS
// ============================================================
/**
 * Parse JSON request bodies
 * ทำให้ req.body เป็น JavaScript object
 *
 * Limit: default 100kb (ป้องกัน large payload attacks)
 */
app.use(express.json());

/**
 * Compression: gzip/deflate response bodies
 * ลดขนาด response 60-80% สำหรับ JSON
 */
app.use(compression());

// ============================================================
// 3. LOGGING & REQUEST ID
// ============================================================
/**
 * Pino HTTP Logger
 *
 * Features:
 * - Structured JSON logging (production)
 * - Pretty printing (development)
 * - Auto request/response logging
 * - Request ID generation
 */
app.use(
  pinoHttp({
    /**
     * Generate unique Request ID
     * - ใช้ X-Request-ID จาก header ถ้ามี (สำหรับ distributed tracing)
     * - ถ้าไม่มี generate UUID ใหม่
     */
    genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID(),

    /**
     * Log Transport Configuration
     * - Production: JSON format (parseable by log aggregators)
     * - Development/Test: Pretty format (human-readable)
     */
    transport:
      config.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,

    /**
     * Disable auto logging in test environment
     * เพื่อไม่ให้ output รกตอนรัน tests
     * (ยังสามารถ log.error(), log.warn() ได้อยู่)
     */
    autoLogging: config.NODE_ENV !== 'test',
  }),
);

/**
 * Set X-Request-ID Response Header
 * ทำให้ client สามารถ reference request ID ได้ในการ debug
 */
app.use((req, res, next) => {
  const reqId = req.id as string;
  res.setHeader('X-Request-ID', reqId);
  next();
});

// ============================================================
// 4. RATE LIMITING
// ============================================================
/**
 * Rate Limiter Middleware
 * จำกัด 100 requests ต่อ IP ต่อ 15 นาที
 * @see src/middlewares/rateLimiter.ts
 */
app.use(limiter);

// ============================================================
// 5. API DOCUMENTATION
// ============================================================
/**
 * Swagger UI
 * Interactive API documentation
 * URL: /api-docs
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// ============================================================
// 6. ROUTES
// ============================================================
/**
 * Health Check Routes (ไม่มี version prefix)
 * - GET /health
 * - GET /health/live
 * - GET /health/ready
 */
app.use('/health', healthRoutes);

/**
 * API Version 1 Routes
 * - /api/v1/items/*
 * - เพิ่ม routes อื่นๆ ใน src/routes/index.ts
 */
app.use('/api/v1', apiV1Routes);

// ============================================================
// 7. ERROR HANDLING
// ============================================================
/**
 * 404 Handler - Route Not Found
 * ต้องอยู่หลัง routes ทั้งหมด แต่ก่อน error handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

/**
 * Global Error Handler
 * จับ errors ทั้งหมด และส่ง standardized response
 * ต้องอยู่ล่างสุดเสมอ!
 * @see src/middlewares/errorHandler.ts
 */
app.use(errorHandler);

// ============================================================
// EXPORT
// ============================================================
export default app;
