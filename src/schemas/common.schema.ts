/**
 * @file src/schemas/common.schema.ts
 * @description Reusable Zod Schemas for Common Patterns
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. กำหนด schemas ที่ใช้ซ้ำได้ทั่วทั้ง application
 * 2. Pagination, Sorting, Filtering schemas
 * 3. Export types สำหรับใช้ใน Services
 *
 * หลักการ DRY (Don't Repeat Yourself):
 * - สร้าง schema ครั้งเดียว ใช้ได้ทุก endpoint
 * - แก้ไขที่เดียว มีผลทั้งหมด
 *
 * @example
 * // ใช้ใน controller
 * const query = paginationSchema.parse(req.query);
 * // query = { page: 1, limit: 10, sort: 'created_at', order: 'desc', q: undefined }
 */

import { z } from 'zod';

// ============================================================
// PAGINATION SCHEMA
// ============================================================
/**
 * Zod Schema สำหรับ Pagination Query Parameters
 *
 * รองรับ:
 * - Pagination: page, limit
 * - Sorting: sort (field), order (asc/desc)
 * - Filtering: q (search query)
 *
 * Features:
 * - z.coerce.number() แปลง string "1" → number 1 อัตโนมัติ
 * - Default values สำหรับทุก field
 * - Validation (min, max) ป้องกัน abuse
 *
 * @example
 * // GET /items?page=2&limit=20&sort=name&order=asc&q=laptop
 * paginationSchema.parse(req.query)
 * // Result: { page: 2, limit: 20, sort: 'name', order: 'asc', q: 'laptop' }
 *
 * @example
 * // GET /items (ไม่ส่ง query params)
 * paginationSchema.parse({})
 * // Result: { page: 1, limit: 10, sort: 'created_at', order: 'desc', q: undefined }
 */
export const paginationSchema = z.object({
  // ─────────────────────────────────────────────────────────
  // Pagination
  // ─────────────────────────────────────────────────────────
  /**
   * หมายเลขหน้า (1-based indexing)
   * - coerce: แปลง string → number
   * - int: ต้องเป็นจำนวนเต็ม
   * - min(1): เริ่มจากหน้า 1
   * @default 1
   */
  page: z.coerce.number().int().min(1).default(1),

  /**
   * จำนวน items ต่อหน้า
   * - min(1): อย่างน้อย 1
   * - max(100): ป้องกัน user ยิง limit=1000000 (DoS protection)
   * @default 10
   */
  limit: z.coerce.number().int().min(1).max(100).default(10),

  // ─────────────────────────────────────────────────────────
  // Sorting
  // ─────────────────────────────────────────────────────────
  /**
   * Field ที่ใช้เรียงลำดับ
   * - ค่าที่ส่งมาจะถูก map กับ column จริงใน service
   * - ถ้าส่ง field ที่ไม่มี จะ fallback เป็น default
   * @default 'created_at'
   */
  sort: z.string().default('created_at'),

  /**
   * ทิศทางการเรียง
   * - asc: น้อยไปมาก / A-Z / เก่าไปใหม่
   * - desc: มากไปน้อย / Z-A / ใหม่ไปเก่า
   * @default 'desc' (ใหม่สุดขึ้นก่อน)
   */
  order: z.enum(['asc', 'desc']).default('desc'),

  // ─────────────────────────────────────────────────────────
  // Filtering
  // ─────────────────────────────────────────────────────────
  /**
   * Search query สำหรับ full-text search
   * - Optional: ไม่บังคับส่ง
   * - ใช้ ILIKE ใน PostgreSQL (case-insensitive)
   * @example q=laptop → WHERE name ILIKE '%laptop%'
   */
  q: z.string().optional(),
});

// ============================================================
// TYPE EXPORTS
// ============================================================
/**
 * TypeScript type inferred จาก paginationSchema
 *
 * ใช้สำหรับ:
 * - Service function parameters
 * - Type annotations ใน controller
 *
 * @example
 * async function getAllItems(params: PaginationParams) {
 *   const { page, limit, sort, order, q } = params;
 *   // ...
 * }
 */
export type PaginationParams = z.infer<typeof paginationSchema>;
