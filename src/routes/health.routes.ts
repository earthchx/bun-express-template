/**
 * @file src/routes/health.routes.ts
 * @description Route Definitions for Health Check Endpoints
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. กำหนด health check endpoints
 * 2. รองรับ Kubernetes liveness/readiness probes
 * 3. Server monitoring endpoints
 *
 * Endpoints:
 * - GET /health       → Full health check (server + dependencies)
 * - GET /health/live  → Liveness probe (is server running?)
 * - GET /health/ready → Readiness probe (can server handle traffic?)
 *
 * Mounted at: /health (ไม่มี version prefix)
 * เหตุผล: Health checks ควรมี path คงที่ ไม่เปลี่ยนตาม API version
 */

import { Router } from 'express';
import { getHealth, getLiveness, getReadiness } from '@/controllers/health.controller';

const router = Router();

// ============================================================
// HEALTH CHECK ROUTES
// ============================================================

/**
 * GET /health
 * Full health check - ตรวจสอบ server และ database
 * @see getHealth controller
 */
router.get('/', getHealth);

/**
 * GET /health/live
 * Kubernetes Liveness Probe
 * ใช้เพื่อเช็คว่า container ยังทำงานอยู่
 * @see getLiveness controller
 */
router.get('/live', getLiveness);

/**
 * GET /health/ready
 * Kubernetes Readiness Probe
 * ใช้เพื่อเช็คว่า pod พร้อมรับ traffic
 * @see getReadiness controller
 */
router.get('/ready', getReadiness);

export default router;
