/**
 * @file src/schemas/item.schema.ts
 * @description Zod Schemas for Item Entity (CRUD Operations)
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. กำหนด validation schemas สำหรับ Item entity
 * 2. Auto-generate จาก Drizzle schema (drizzle-zod)
 * 3. รองรับ OpenAPI documentation (zod-to-openapi)
 *
 * Schema Types:
 * - insertItemSchema: สำหรับ CREATE (POST)
 * - updateItemSchema: สำหรับ UPDATE (PATCH) - partial
 * - selectItemSchema: สำหรับ Response (GET)
 * - paramIdSchema: สำหรับ validate URL params
 *
 * @example
 * // Validate request body
 * const body = insertItemSchema.parse(req.body);
 *
 * // Validate URL params
 * const { id } = paramIdSchema.parse(req.params);
 */

import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { items } from '@/db/schema';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// เปิดใช้งาน .openapi() method สำหรับ Swagger documentation
extendZodWithOpenApi(z);

// ============================================================
// CREATE (INSERT) SCHEMA
// ============================================================
/**
 * Schema สำหรับ CREATE operation (POST /items)
 *
 * Generated from:
 * - Drizzle schema (items table)
 * - Override ด้วย custom validation
 *
 * Fields:
 * - name: required, min 1 character
 *
 * @example
 * // Valid
 * insertItemSchema.parse({ name: 'Laptop' }); // ✅
 *
 * // Invalid
 * insertItemSchema.parse({ name: '' });       // ❌ Name is required
 * insertItemSchema.parse({});                 // ❌ Name is required
 */
export const insertItemSchema = createInsertSchema(items, {
  // Override default validation ด้วย custom rules
  name: z.string().min(1, 'Name is required'),
}).pick({ name: true }); // เลือกเฉพาะ field ที่ต้องการ (ไม่เอา id, createdAt)

// ============================================================
// UPDATE SCHEMA
// ============================================================
/**
 * Schema สำหรับ UPDATE operation (PATCH /items/:id)
 *
 * ใช้ .partial() เพื่อให้ทุก field เป็น optional
 * - User สามารถส่งมาแค่บาง field ได้
 * - ไม่ต้องส่งครบทุก field
 *
 * @example
 * // Valid - ส่งแค่ name
 * updateItemSchema.parse({ name: 'New Name' }); // ✅
 *
 * // Valid - ส่ง empty object (ไม่แก้ไขอะไร)
 * updateItemSchema.parse({});                   // ✅
 */
export const updateItemSchema = insertItemSchema.partial();

// ============================================================
// URL PARAMS SCHEMA
// ============================================================
/**
 * Schema สำหรับ validate URL parameters
 *
 * ใช้สำหรับ:
 * - GET /items/:id
 * - PATCH /items/:id
 * - DELETE /items/:id
 *
 * Features:
 * - z.coerce.number(): แปลง string "123" → number 123
 * - int(): ต้องเป็นจำนวนเต็ม
 * - positive(): ต้องมากกว่า 0
 *
 * @example
 * // Valid
 * paramIdSchema.parse({ id: '123' }); // { id: 123 } ✅
 *
 * // Invalid
 * paramIdSchema.parse({ id: 'abc' }); // ❌ Invalid number
 * paramIdSchema.parse({ id: '-1' });  // ❌ Must be positive
 * paramIdSchema.parse({ id: '1.5' }); // ❌ Must be integer
 */
export const paramIdSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

// ============================================================
// SELECT (RESPONSE) SCHEMA
// ============================================================
/**
 * Schema สำหรับ Response (SELECT query results)
 *
 * Auto-generated จาก Drizzle schema
 * ใช้สำหรับ OpenAPI documentation
 *
 * Fields:
 * - id: number
 * - name: string
 * - createdAt: Date | null
 */
export const selectItemSchema = createSelectSchema(items);

// ============================================================
// TYPE EXPORTS
// ============================================================
/**
 * TypeScript types inferred from Zod schemas
 *
 * ใช้สำหรับ:
 * - Service function parameters
 * - Controller type annotations
 */

/** Type สำหรับ Create Item request body */
export type CreateItemInput = z.infer<typeof insertItemSchema>;

/** Type สำหรับ Update Item request body */
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

/** Type สำหรับ URL params (id) */
export type ItemParams = z.infer<typeof paramIdSchema>;
