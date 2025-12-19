/**
 * @file src/middlewares/errorHandler.ts
 * @description Global Error Handler Middleware
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. จับ errors ทั้งหมดที่ throw ออกมาจาก routes/controllers
 * 2. แปลง errors เป็น standardized JSON response
 * 3. Log errors อย่างเหมาะสม (แยก severity)
 * 4. ซ่อน sensitive information ใน production
 *
 * Error Types ที่ handle:
 * - AppError: Custom operational errors (400, 404, etc.)
 * - ZodError: Validation errors จาก Zod
 * - Unknown: Programming errors / bugs (500)
 *
 * Response Format:
 * {
 *   "success": false,
 *   "message": "Error message",
 *   "errors": [...],  // Zod validation details
 *   "stack": "..."    // Development only
 * }
 *
 * @example
 * // ใน app.ts (ต้องอยู่ล่างสุด!)
 * app.use(errorHandler);
 */

import type { ErrorRequestHandler } from 'express';
import { AppError } from '@/utils/AppError';
import { ZodError } from 'zod';
import { config } from '@/config/env';

// ============================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================
/**
 * Global Error Handler Middleware
 *
 * Express จะเรียก middleware นี้เมื่อ:
 * 1. มี error ถูก throw ใน route handler
 * 2. มีการเรียก next(error)
 *
 * สำคัญ: ต้องมี 4 parameters (err, req, res, next)
 * ถ้าไม่มี Express จะไม่รู้ว่าเป็น error handler
 *
 * @param err - Error object ที่ถูก throw
 * @param req - Express Request object
 * @param res - Express Response object
 * @param _next - Next function (ไม่ได้ใช้ แต่ต้องมีสำหรับ type)
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Default values สำหรับ unknown errors
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = undefined;

  // ─────────────────────────────────────────────────────────
  // 1. Handle AppError (Custom Operational Errors)
  // ─────────────────────────────────────────────────────────
  /**
   * AppError เป็น errors ที่เราตั้งใจ throw
   * - User ส่งข้อมูลผิด (400)
   * - ไม่พบข้อมูล (404)
   * - ไม่มีสิทธิ์ (401, 403)
   */
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // ─────────────────────────────────────────────────────────
  // 2. Handle ZodError (Validation Errors)
  // ─────────────────────────────────────────────────────────
  /**
   * ZodError เกิดจาก schema.parse() ที่ fail
   * ส่ง validation issues กลับไปให้ client
   * เพื่อบอกว่า field ไหนผิดอย่างไร
   */
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.issues; // รายละเอียด validation errors
  }

  // ─────────────────────────────────────────────────────────
  // 3. Log Error (แยก severity)
  // ─────────────────────────────────────────────────────────
  /**
   * Logging Strategy:
   * - 5xx errors: log.error() → ต้องรีบแก้ไข, alert team
   * - 4xx errors: log.warn() → user error, ไม่ต้อง alert
   *
   * ใช้ req.log (Pino logger) เพื่อ:
   * - Auto-attach request ID
   * - Structured logging format
   */
  if (statusCode >= 500) {
    req.log.error(err); // Full error with stack trace
  } else {
    req.log.warn({ msg: message, errors }); // Warning level
  }

  // ─────────────────────────────────────────────────────────
  // 4. Send Error Response
  // ─────────────────────────────────────────────────────────
  /**
   * Response format:
   * - success: false (always)
   * - message: Human-readable error message
   * - errors: Zod validation details (if applicable)
   * - stack: Stack trace (development only)
   *
   * Security: ไม่ส่ง stack trace ใน production
   * Security: ไม่ส่ง stack trace ไป client เด็ดขาด
   * เพราะเปิดเผย internal paths และ implementation details
   * Stack trace ถูก log ไว้ใน server แล้ว (ดู step 3)
   */
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    // ❌ ไม่ส่ง stack trace ไป client (security risk)
    // stack trace ถูก log ไว้ฝั่ง server แล้ว
  });
};
