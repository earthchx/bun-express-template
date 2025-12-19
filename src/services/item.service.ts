/**
 * @file src/services/item.service.ts
 * @description Business Logic Layer for Item Entity
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. รวม Business Logic ทั้งหมดที่เกี่ยวกับ Items
 * 2. เป็น Single Point of Access สำหรับ database operations
 * 3. แยก Database Logic ออกจาก Controller (Separation of Concerns)
 *
 * หลักการ Service Layer:
 * - Controller: จัดการ HTTP request/response
 * - Service: จัดการ Business Logic + Database
 * - ทำให้ code testable และ reusable
 *
 * @example
 * // ใช้ใน Controller
 * import * as itemService from '@/services/item.service';
 * const items = await itemService.getAllItemsService(params);
 */

import { db } from '@/db';
import { items } from '@/db/schema';
import { eq, desc, asc, count, ilike, type AnyColumn } from 'drizzle-orm';
import type { CreateItemInput, UpdateItemInput } from '@/schemas/item.schema';
import type { PaginationParams } from '@/schemas/common.schema';

// ============================================================
// GET ALL ITEMS (with Pagination, Sorting, Filtering)
// ============================================================
/**
 * ดึงรายการ Items ทั้งหมด พร้อม Pagination, Sorting, Filtering
 *
 * Features:
 * - Pagination: page, limit → LIMIT, OFFSET
 * - Sorting: sort, order → ORDER BY
 * - Filtering: q → WHERE ILIKE (case-insensitive search)
 *
 * @param {PaginationParams} params - Query parameters ที่ผ่าน validation แล้ว
 * @returns {Promise<{ data: Item[], total: number }>} Items และจำนวนทั้งหมด
 *
 * @example
 * const { data, total } = await getAllItemsService({
 *   page: 1,
 *   limit: 10,
 *   sort: 'created_at',
 *   order: 'desc',
 *   q: 'laptop'
 * });
 * // data = [...10 items...]
 * // total = 150 (all matching items)
 */
export const getAllItemsService = async (params: PaginationParams) => {
  const { page, limit, sort, order, q } = params;

  // ─────────────────────────────────────────────────────────
  // 1. Calculate Pagination Offset
  // ─────────────────────────────────────────────────────────
  // page 1: offset 0 (items 1-10)
  // page 2: offset 10 (items 11-20)
  // page 3: offset 20 (items 21-30)
  const offset = (page - 1) * limit;

  // ─────────────────────────────────────────────────────────
  // 2. Build WHERE Clause (Filtering)
  // ─────────────────────────────────────────────────────────
  // ถ้ามี search query → ILIKE (case-insensitive partial match)
  // ไม่มี → undefined (ไม่มี WHERE clause)
  const whereClause = q ? ilike(items.name, `%${q}%`) : undefined;

  // ─────────────────────────────────────────────────────────
  // 3. Build ORDER BY Clause (Sorting)
  // ─────────────────────────────────────────────────────────
  /**
   * Whitelist mapping: ป้องกัน SQL Injection
   * - ไม่ยอมรับ field name ตรงๆ จาก user input
   * - Map เฉพาะ fields ที่อนุญาต
   * - ถ้าส่ง field ที่ไม่มี → fallback เป็น items.id
   */
  const sortMap: Record<string, AnyColumn> = {
    id: items.id,
    name: items.name,
    created_at: items.createdAt,
  };

  const sortColumn = sortMap[sort] || items.id;
  const orderByClause = order === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // ─────────────────────────────────────────────────────────
  // 4. Execute Data Query
  // ─────────────────────────────────────────────────────────
  const data = await db
    .select()
    .from(items)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(orderByClause);

  // ─────────────────────────────────────────────────────────
  // 5. Execute Count Query (for pagination metadata)
  // ─────────────────────────────────────────────────────────
  /**
   * ต้อง query แยกเพื่อนับจำนวนทั้งหมด
   * - ใช้ WHERE clause เดียวกันกับ data query
   * - ไม่ใส่ LIMIT/OFFSET
   */
  const [totalResult] = await db.select({ value: count() }).from(items).where(whereClause);

  return {
    data,
    total: totalResult!.value,
  };
};

// ============================================================
// GET ITEM BY ID
// ============================================================
/**
 * ดึง Item ตาม ID
 *
 * @param {number} id - Item ID
 * @returns {Promise<Item | undefined>} Item object หรือ undefined ถ้าไม่พบ
 *
 * @example
 * const item = await getItemByIdService(123);
 * if (!item) {
 *   throw new AppError('Item not found', 404);
 * }
 */
export const getItemByIdService = async (id: number) => {
  const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
  return result[0]; // undefined ถ้าไม่พบ
};

// ============================================================
// CREATE ITEM
// ============================================================
/**
 * สร้าง Item ใหม่
 *
 * @param {CreateItemInput} data - ข้อมูลสำหรับสร้าง Item (ผ่าน validation แล้ว)
 * @returns {Promise<Item>} Item ที่สร้างใหม่ (รวม id และ createdAt)
 *
 * @example
 * const newItem = await createItemService({ name: 'Laptop' });
 * // newItem = { id: 123, name: 'Laptop', createdAt: '2024-...' }
 */
export const createItemService = async (data: CreateItemInput) => {
  // .returning() ทำให้ได้ข้อมูลที่ insert ไปกลับมา
  const result = await db.insert(items).values(data).returning();
  return result[0];
};

// ============================================================
// UPDATE ITEM
// ============================================================
/**
 * แก้ไข Item ที่มีอยู่
 *
 * @param {number} id - Item ID ที่ต้องการแก้ไข
 * @param {UpdateItemInput} data - ข้อมูลที่ต้องการแก้ไข (partial)
 * @returns {Promise<Item | undefined>} Item ที่แก้ไขแล้ว หรือ undefined ถ้าไม่พบ
 *
 * @example
 * const updated = await updateItemService(123, { name: 'New Name' });
 * if (!updated) {
 *   throw new AppError('Item not found', 404);
 * }
 */
export const updateItemService = async (id: number, data: UpdateItemInput) => {
  const result = await db.update(items).set(data).where(eq(items.id, id)).returning();
  return result[0]; // undefined ถ้า ID ไม่มีอยู่
};

// ============================================================
// DELETE ITEM
// ============================================================
/**
 * ลบ Item
 *
 * @param {number} id - Item ID ที่ต้องการลบ
 * @returns {Promise<Item | undefined>} Item ที่ลบ หรือ undefined ถ้าไม่พบ
 *
 * @example
 * const deleted = await deleteItemService(123);
 * if (!deleted) {
 *   throw new AppError('Item not found', 404);
 * }
 */
export const deleteItemService = async (id: number) => {
  const result = await db.delete(items).where(eq(items.id, id)).returning();
  return result[0]; // undefined ถ้า ID ไม่มีอยู่
};
