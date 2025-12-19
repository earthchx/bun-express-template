/**
 * @file src/routes/item.routes.ts
 * @description Route Definitions for Item Entity
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. กำหนด HTTP endpoints สำหรับ Items
 * 2. Map HTTP methods + paths → Controllers
 * 3. จัดกลุ่ม routes ที่เกี่ยวข้องกัน
 *
 * RESTful Conventions:
 * - GET    /items      → List all items
 * - POST   /items      → Create new item
 * - GET    /items/:id  → Get single item
 * - PATCH  /items/:id  → Partial update
 * - DELETE /items/:id  → Delete item
 *
 * Note: PUT vs PATCH
 * - PUT: Replace entire resource (ต้องส่งทุก field)
 * - PATCH: Partial update (ส่งแค่ field ที่ต้องการแก้)
 * เราใช้ PATCH เพราะ flexible กว่า
 *
 * Mounted at: /api/v1/items (ดู src/routes/index.ts)
 */

import { Router } from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '@/controllers/item.controller';

const router = Router();

// ============================================================
// ITEM ROUTES
// ============================================================

/**
 * GET /api/v1/items
 * List all items with pagination, sorting, and filtering
 * @see getItems controller
 */
router.get('/', getItems);

/**
 * POST /api/v1/items
 * Create a new item
 * @see createItem controller
 */
router.post('/', createItem);

/**
 * GET /api/v1/items/:id
 * Get a single item by ID
 * @see getItemById controller
 */
router.get('/:id', getItemById);

/**
 * PATCH /api/v1/items/:id
 * Update an existing item (partial update)
 * @see updateItem controller
 */
router.patch('/:id', updateItem);

/**
 * DELETE /api/v1/items/:id
 * Delete an item
 * @see deleteItem controller
 */
router.delete('/:id', deleteItem);

export default router;
