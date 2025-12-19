/**
 * @file src/routes/index.ts
 * @description Central Route Aggregator & API Versioning
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. รวม routes ทั้งหมดมาไว้ที่เดียว
 * 2. จัดการ API Versioning (v1, v2, ...)
 * 3. Export routes สำหรับใช้ใน app.ts
 *
 * API Structure:
 * /health/*     → Health check routes (ไม่มี version)
 * /api/v1/*     → API version 1 routes
 *
 * การเพิ่ม API Version ใหม่:
 * 1. สร้าง routes ใหม่ (เช่น item.routes.v2.ts)
 * 2. สร้าง router ใหม่ (apiV2Routes)
 * 3. Mount ใน app.ts: app.use('/api/v2', apiV2Routes)
 *
 * @example
 * // ใน app.ts
 * import apiV1Routes, { healthRoutes } from '@/routes';
 * app.use('/health', healthRoutes);
 * app.use('/api/v1', apiV1Routes);
 */

import { Router } from 'express';
import itemRoutes from './item.routes';
import healthRoutes from './health.routes';

// ============================================================
// API VERSION 1 ROUTER
// ============================================================
/**
 * Router สำหรับ API v1
 *
 * รวม routes ทั้งหมดที่เป็น versioned API
 * Mount ที่ /api/v1 ใน app.ts
 *
 * Current Routes:
 * - /api/v1/items → Item CRUD
 *
 * เพิ่ม routes ใหม่:
 * router.use('/users', userRoutes);
 * router.use('/orders', orderRoutes);
 */
const router = Router();

/**
 * Item Routes
 * Full path: /api/v1/items/*
 */
router.use('/items', itemRoutes);

// เพิ่ม routes อื่นๆ ตรงนี้:
// router.use('/users', userRoutes);
// router.use('/auth', authRoutes);

// ============================================================
// EXPORTS
// ============================================================
/**
 * Health Routes - Export แยก เพราะไม่มี version prefix
 * Mount ที่ /health ใน app.ts
 */
export { healthRoutes };

/**
 * Default export: API v1 Routes
 * Mount ที่ /api/v1 ใน app.ts
 */
export default router;
