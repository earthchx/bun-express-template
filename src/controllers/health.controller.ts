/**
 * @file src/controllers/health.controller.ts
 * @description Health Check Endpoints for Server Monitoring
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. ตรวจสอบสถานะของ Application
 * 2. รองรับ Kubernetes Probes (Liveness & Readiness)
 * 3. ตรวจสอบ Database connectivity
 *
 * Endpoints:
 * - GET /health      → Full health check (server + DB)
 * - GET /health/live → Liveness probe (server only)
 * - GET /health/ready → Readiness probe (server + DB)
 *
 * Use Cases:
 * - Load balancer health checks
 * - Kubernetes liveness/readiness probes
 * - Monitoring systems (Datadog, New Relic, etc.)
 * - Uptime monitoring (UptimeRobot, Pingdom)
 *
 * @example
 * // Kubernetes deployment
 * livenessProbe:
 *   httpGet:
 *     path: /health/live
 *     port: 3000
 * readinessProbe:
 *   httpGet:
 *     path: /health/ready
 *     port: 3000
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/response';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// ============================================================
// TYPE DEFINITIONS
// ============================================================
/**
 * Health check response data structure
 */
interface HealthCheckData {
  /** Overall status: 'ok' or 'error' */
  status: 'ok' | 'error';
  /** ISO timestamp */
  timestamp: string;
  /** Server uptime in seconds */
  uptime: number;
  /** Current environment (development/production/test) */
  environment: string | undefined;
  /** Individual service checks */
  checks: {
    /** Database connectivity status */
    database: 'ok' | 'error';
  };
}

// ============================================================
// FULL HEALTH CHECK
// ============================================================
/**
 * GET /health
 *
 * Full health check endpoint - ตรวจสอบสถานะทั้งหมด
 *
 * ตรวจสอบ:
 * - Server: ทำงานอยู่หรือไม่
 * - Database: connect ได้หรือไม่
 *
 * Response:
 * - 200: ทุกอย่างปกติ
 * - 503: Database เชื่อมต่อไม่ได้
 *
 * @example
 * // Success (200)
 * {
 *   "success": true,
 *   "data": {
 *     "status": "ok",
 *     "timestamp": "2024-01-15T10:30:00.000Z",
 *     "uptime": 12345.67,
 *     "environment": "production",
 *     "checks": { "database": "ok" }
 *   }
 * }
 *
 * // Database down (503)
 * {
 *   "success": false,
 *   "data": {
 *     "status": "error",
 *     "checks": { "database": "error" }
 *   }
 * }
 */
export const getHealth = asyncHandler(async (req: Request, res: Response) => {
  // Prepare health check data
  const healthData: HealthCheckData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(), // seconds since server started
    environment: process.env.NODE_ENV,
    checks: {
      database: 'ok',
    },
  };

  // ─────────────────────────────────────────────────────────
  // Database Health Check
  // ─────────────────────────────────────────────────────────
  // ใช้ try-catch เพราะเราต้องการ graceful degradation
  // ถ้า DB ล่ม เราต้องการ return 503 ไม่ใช่ crash
  try {
    // Simple query เพื่อเช็ค connection
    await db.execute(sql`SELECT 1`);
    healthData.checks.database = 'ok';
  } catch (error) {
    // DB connection failed
    healthData.status = 'error';
    healthData.checks.database = 'error';
    req.log.error(error, 'Database health check failed');

    // Return 503 Service Unavailable
    return res.status(503).json({
      success: false,
      data: healthData,
    });
  }

  // All checks passed
  sendSuccess(res, healthData);
});

// ============================================================
// LIVENESS PROBE (Kubernetes)
// ============================================================
/**
 * GET /health/live
 *
 * Liveness Probe - เช็คว่า server ยังทำงานอยู่หรือไม่
 *
 * Purpose:
 * - Kubernetes ใช้เพื่อตรวจสอบว่า container ยัง "alive" อยู่ไหม
 * - ถ้า fail → Kubernetes จะ restart container
 *
 * ไม่ต้องเช็ค:
 * - Database (เพราะ DB ล่มไม่ได้หมายความว่า server ตาย)
 * - External services
 *
 * Best Practice:
 * - ควรเร็วมาก (< 100ms)
 * - ไม่ควรมี dependencies ภายนอก
 *
 * @example
 * { "success": true, "data": { "status": "alive" } }
 */
export const getLiveness = (req: Request, res: Response) => {
  // ถ้า function นี้ถูกเรียกได้ แสดงว่า server ยังทำงานอยู่
  sendSuccess(res, { status: 'alive' });
};

// ============================================================
// READINESS PROBE (Kubernetes)
// ============================================================
/**
 * GET /health/ready
 *
 * Readiness Probe - เช็คว่า server พร้อมรับ traffic หรือยัง
 *
 * Purpose:
 * - Kubernetes ใช้เพื่อตรวจสอบว่า pod พร้อมรับ traffic หรือยัง
 * - ถ้า fail → Kubernetes จะไม่ route traffic มาที่ pod นี้
 *
 * ต้องเช็ค:
 * - Database connection
 * - External services ที่จำเป็น (ถ้ามี)
 *
 * Use Cases:
 * - Server เพิ่งเริ่มต้น ยังไม่ได้ connect DB
 * - Database กำลัง maintenance
 * - Migration กำลังรัน
 *
 * Response:
 * - 200: พร้อมรับ traffic
 * - 503: ยังไม่พร้อม
 *
 * @example
 * // Ready
 * { "success": true, "data": { "status": "ready" } }
 *
 * // Not ready
 * { "success": false, "data": { "status": "not ready" } }
 */
export const getReadiness = asyncHandler(async (req: Request, res: Response) => {
  try {
    // เช็ค Database connection
    await db.execute(sql`SELECT 1`);

    // Ready to receive traffic
    sendSuccess(res, { status: 'ready' });
  } catch {
    // Not ready - return 503
    res.status(503).json({
      success: false,
      data: { status: 'not ready' },
    });
  }
});
