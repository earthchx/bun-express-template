/**
 * @file src/controllers/item.controller.ts
 * @description HTTP Request Handlers for Item Entity (CRUD)
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. รับ HTTP Request และส่ง Response
 * 2. Validate input (ผ่าน Zod schemas)
 * 3. เรียก Service layer สำหรับ business logic
 * 4. จัดการ Error cases (not found, validation, etc.)
 *
 * Controller Responsibilities:
 * ✅ Parse & Validate request (body, params, query)
 * ✅ Call appropriate service
 * ✅ Format & send response
 * ✅ Handle "not found" cases
 * ❌ Business logic (อยู่ใน Service)
 * ❌ Database queries (อยู่ใน Service)
 *
 * Pattern Used:
 * - asyncHandler: wrap async functions เพื่อ catch errors อัตโนมัติ
 * - Zod parse: validate input แบบ fail-fast
 * - AppError: throw custom errors พร้อม HTTP status code
 */

import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/utils/AppError';
import { sendPaginatedSuccess, sendSuccess } from '@/utils/response';
import { paginationSchema } from '@/schemas/common.schema';
import { insertItemSchema, updateItemSchema, paramIdSchema } from '@/schemas/item.schema';
import * as itemService from '@/services/item.service';

// ============================================================
// GET ALL ITEMS
// ============================================================
/**
 * GET /api/v1/items
 *
 * ดึงรายการ Items ทั้งหมด พร้อม Pagination
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 10, max: 100)
 * - sort: string (default: 'created_at')
 * - order: 'asc' | 'desc' (default: 'desc')
 * - q: string (optional, search query)
 *
 * @example
 * GET /api/v1/items?page=2&limit=20&sort=name&order=asc&q=laptop
 *
 * Response:
 * {
 *   "success": true,
 *   "data": [...],
 *   "meta": { "page": 2, "limit": 20, "totalItems": 150, "totalPages": 8 }
 * }
 */
export const getItems = asyncHandler(async (req: Request, res: Response) => {
  // 1. Validate & parse query params (with defaults)
  const query = paginationSchema.parse(req.query);

  // 2. Call service with validated params
  const { data, total } = await itemService.getAllItemsService(query);

  // 3. Send paginated response
  sendPaginatedSuccess(res, data, total, query.page, query.limit);
});

// ============================================================
// GET ITEM BY ID
// ============================================================
/**
 * GET /api/v1/items/:id
 *
 * ดึง Item ตาม ID
 *
 * URL Parameters:
 * - id: number (positive integer)
 *
 * @example
 * GET /api/v1/items/123
 *
 * Success Response (200):
 * { "success": true, "data": { "id": 123, "name": "...", ... } }
 *
 * Error Response (404):
 * { "success": false, "message": "Item with ID 123 not found" }
 */
export const getItemById = asyncHandler(async (req: Request, res: Response) => {
  // 1. Validate URL param (string → number)
  const { id } = paramIdSchema.parse(req.params);

  // 2. Call service
  const item = await itemService.getItemByIdService(id);

  // 3. Handle not found case
  if (!item) {
    throw new AppError(`Item with ID ${id} not found`, 404);
  }

  // 4. Send response
  sendSuccess(res, item);
});

// ============================================================
// CREATE ITEM
// ============================================================
/**
 * POST /api/v1/items
 *
 * สร้าง Item ใหม่
 *
 * Request Body:
 * - name: string (required, min 1 char)
 *
 * @example
 * POST /api/v1/items
 * Body: { "name": "New Laptop" }
 *
 * Success Response (201):
 * {
 *   "success": true,
 *   "message": "Item created successfully",
 *   "data": { "id": 124, "name": "New Laptop", "createdAt": "..." }
 * }
 *
 * Error Response (400):
 * { "success": false, "message": "Validation Error", "errors": [...] }
 */
export const createItem = asyncHandler(async (req: Request, res: Response) => {
  // 1. Validate request body
  const body = insertItemSchema.parse(req.body);

  // 2. Call service to create
  const newItem = await itemService.createItemService(body);

  // 3. Send response with 201 Created
  sendSuccess(res, newItem, 'Item created successfully', 201);
});

// ============================================================
// UPDATE ITEM
// ============================================================
/**
 * PATCH /api/v1/items/:id
 *
 * แก้ไข Item ที่มีอยู่ (Partial Update)
 *
 * URL Parameters:
 * - id: number (positive integer)
 *
 * Request Body (all fields optional):
 * - name: string
 *
 * @example
 * PATCH /api/v1/items/123
 * Body: { "name": "Updated Name" }
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "message": "Item updated successfully",
 *   "data": { "id": 123, "name": "Updated Name", ... }
 * }
 */
export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  // 1. Validate URL param
  const { id } = paramIdSchema.parse(req.params);

  // 2. Validate request body (partial - all fields optional)
  const body = updateItemSchema.parse(req.body);

  // 3. Call service to update
  const updatedItem = await itemService.updateItemService(id, body);

  // 4. Handle not found case
  if (!updatedItem) {
    throw new AppError(`Item with ID ${id} not found`, 404);
  }

  // 5. Send response
  sendSuccess(res, updatedItem, 'Item updated successfully');
});

// ============================================================
// DELETE ITEM
// ============================================================
/**
 * DELETE /api/v1/items/:id
 *
 * ลบ Item
 *
 * URL Parameters:
 * - id: number (positive integer)
 *
 * @example
 * DELETE /api/v1/items/123
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "message": "Item deleted successfully",
 *   "data": { "id": 123, "name": "...", ... }  // deleted item
 * }
 */
export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  // 1. Validate URL param
  const { id } = paramIdSchema.parse(req.params);

  // 2. Call service to delete
  const deletedItem = await itemService.deleteItemService(id);

  // 3. Handle not found case
  if (!deletedItem) {
    throw new AppError(`Item with ID ${id} not found`, 404);
  }

  // 4. Send response with deleted item data
  sendSuccess(res, deletedItem, 'Item deleted successfully');
});
