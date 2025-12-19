/**
 * @file src/utils/response.ts
 * @description Standardized API Response Utilities
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. กำหนด Response format มาตรฐานสำหรับทั้ง application
 * 2. ใช้ Generic types เพื่อความ type-safe
 * 3. รองรับทั้ง Single item และ Paginated responses
 *
 * Response Format (JSON:API Style):
 * ```json
 * {
 *   "success": true,
 *   "message": "Optional message",
 *   "data": { ... },
 *   "meta": { ... }  // สำหรับ pagination
 * }
 * ```
 *
 * @example
 * // Single item response
 * sendSuccess(res, { id: 1, name: 'Item' });
 *
 * // Paginated response
 * sendPaginatedSuccess(res, items, totalCount, page, limit);
 */

import type { Response } from 'express';

// ============================================================
// TYPE DEFINITIONS
// ============================================================
/**
 * Interface สำหรับ Success Response (Single item)
 *
 * @template T - Type ของ data ที่จะส่งกลับ
 *
 * @example
 * SuccessResponse<User> = {
 *   success: true,
 *   message?: string,
 *   data: User
 * }
 */
interface SuccessResponse<T> {
  /** สถานะสำเร็จ - always true */
  success: boolean;
  /** ข้อมูลที่ส่งกลับ */
  data: T;
  /** ข้อความเพิ่มเติม (optional) */
  message?: string;
}

/**
 * Interface สำหรับ Paginated Response (Array of items)
 *
 * @template T - Type ของแต่ละ item ใน array
 *
 * @example
 * PaginatedResponse<User> = {
 *   success: true,
 *   data: User[],
 *   meta: { page: 1, limit: 10, totalItems: 100, totalPages: 10 }
 * }
 */
interface PaginatedResponse<T> {
  /** สถานะสำเร็จ - always true */
  success: boolean;
  /** Array ของข้อมูล */
  data: T[];
  /** Pagination metadata */
  meta: {
    /** หน้าปัจจุบัน (1-based) */
    page: number;
    /** จำนวน items ต่อหน้า */
    limit: number;
    /** จำนวน items ทั้งหมด (ทุกหน้ารวมกัน) */
    totalItems: number;
    /** จำนวนหน้าทั้งหมด */
    totalPages: number;
  };
  /** ข้อความเพิ่มเติม (optional) */
  message?: string;
}

// ============================================================
// RESPONSE UTILITIES
// ============================================================
/**
 * ส่ง Success Response สำหรับ Single item
 *
 * @template T - Type ของ data
 * @param {Response} res - Express Response object
 * @param {T} data - ข้อมูลที่ต้องการส่งกลับ
 * @param {string} [message] - ข้อความเพิ่มเติม (optional)
 * @param {number} [statusCode=200] - HTTP status code (default: 200)
 *
 * @example
 * // Basic usage
 * sendSuccess(res, { id: 1, name: 'Item' });
 * // Output: { success: true, data: { id: 1, name: 'Item' } }
 *
 * @example
 * // With message and custom status
 * sendSuccess(res, newItem, 'Item created successfully', 201);
 * // Output: { success: true, message: 'Item created...', data: {...} }
 */
export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode = 200) => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
};

/**
 * ส่ง Paginated Success Response สำหรับ List/Array items
 *
 * คำนวณ totalPages อัตโนมัติจาก totalItems / limit
 *
 * @template T - Type ของแต่ละ item
 * @param {Response} res - Express Response object
 * @param {T[]} data - Array ของข้อมูล (หน้าปัจจุบัน)
 * @param {number} totalItems - จำนวน items ทั้งหมดในระบบ
 * @param {number} page - หน้าปัจจุบัน (1-based)
 * @param {number} limit - จำนวน items ต่อหน้า
 * @param {string} [message] - ข้อความเพิ่มเติม (optional)
 *
 * @example
 * // ดึง items หน้าที่ 2 (10 items/page)
 * const { data, total } = await itemService.getAll({ page: 2, limit: 10 });
 * sendPaginatedSuccess(res, data, total, 2, 10);
 *
 * // Output:
 * // {
 * //   success: true,
 * //   data: [...],
 * //   meta: { page: 2, limit: 10, totalItems: 95, totalPages: 10 }
 * // }
 */
export const sendPaginatedSuccess = <T>(
  res: Response,
  data: T[],
  totalItems: number,
  page: number,
  limit: number,
  message?: string,
) => {
  // คำนวณจำนวนหน้าทั้งหมด (ปัดขึ้น)
  const totalPages = Math.ceil(totalItems / limit);

  const response: PaginatedResponse<T> = {
    success: true,
    message,
    data,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
    },
  };

  res.status(200).json(response);
};
