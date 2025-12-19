/**
 * @file src/utils/AppError.ts
 * @description Custom Error Class สำหรับ Application Errors
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. สร้าง Custom Error class ที่มี HTTP status code
 * 2. แยกแยะ "Operational Errors" (คาดการณ์ได้) vs "Programming Errors" (bugs)
 * 3. ใช้ร่วมกับ errorHandler middleware
 *
 * Operational Errors (ใช้ AppError):
 * - User ส่งข้อมูลผิด (400)
 * - ไม่พบข้อมูล (404)
 * - ไม่มีสิทธิ์เข้าถึง (401, 403)
 *
 * Programming Errors (throw Error ปกติ):
 * - TypeError, ReferenceError
 * - Database connection failed
 * - Third-party API errors
 *
 * @example
 * // ใช้ใน Controller
 * if (!item) {
 *   throw new AppError('Item not found', 404);
 * }
 */

// ============================================================
// APPERROR CLASS
// ============================================================
/**
 * Custom Error class สำหรับ HTTP errors ที่คาดการณ์ได้
 *
 * @extends Error
 *
 * @property {number} statusCode - HTTP status code (400, 404, 500, etc.)
 * @property {boolean} isOperational - true = error ที่คาดการณ์ได้, ไม่ใช่ bug
 *
 * @example
 * // 404 Not Found
 * throw new AppError('User not found', 404);
 *
 * // 400 Bad Request
 * throw new AppError('Invalid email format', 400);
 *
 * // 401 Unauthorized
 * throw new AppError('Please login first', 401);
 *
 * // 403 Forbidden
 * throw new AppError('You do not have permission', 403);
 */
export class AppError extends Error {
  /**
   * HTTP Status Code
   * @example 400, 401, 403, 404, 500
   */
  public statusCode: number;

  /**
   * Flag บอกว่าเป็น Error ที่คาดการณ์ได้ (Operational)
   *
   * - true: Error ที่เราตั้งใจ throw (user input ผิด, ไม่พบข้อมูล)
   * - false: Bug หรือ unexpected error (null reference, DB connection)
   *
   * ใช้ใน errorHandler เพื่อตัดสินใจว่าจะ:
   * - แสดง error message ให้ user เห็นไหม
   * - ส่ง alert ไป monitoring system ไหม
   */
  public isOperational: boolean;

  /**
   * Creates an instance of AppError
   *
   * @param {string} message - Error message ที่จะแสดงให้ user
   * @param {number} statusCode - HTTP status code
   *
   * @example
   * throw new AppError('Item with ID 123 not found', 404);
   */
  constructor(message: string, statusCode: number) {
    // เรียก parent constructor (Error)
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;

    // Capture stack trace โดยไม่รวม constructor นี้ใน stack
    // ทำให้ stack trace อ่านง่ายขึ้น
    Error.captureStackTrace(this, this.constructor);
  }
}
