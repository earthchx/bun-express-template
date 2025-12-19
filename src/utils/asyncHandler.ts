/**
 * @file src/utils/asyncHandler.ts
 * @description Async Error Handler Wrapper for Express Controllers
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. Wrap async controller functions เพื่อ catch errors อัตโนมัติ
 * 2. ส่ง errors ไปยัง Express error handler โดยไม่ต้องเขียน try-catch
 * 3. ทำให้ code สะอาดและลด boilerplate
 *
 * ทำไมต้องใช้:
 * - Express ไม่ handle async errors โดยอัตโนมัติ
 * - ถ้าไม่ wrap, unhandled promise rejection จะไม่ถูกส่งไป error handler
 * - ต้องเขียน try-catch ทุก controller (ซ้ำซ้อน)
 *
 * @example
 * // ❌ แบบเดิม (ต้องเขียน try-catch เอง)
 * export const getUser = async (req, res, next) => {
 *   try {
 *     const user = await userService.findById(req.params.id);
 *     res.json(user);
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 *
 * // ✅ แบบใช้ asyncHandler (สะอาดกว่า)
 * export const getUser = asyncHandler(async (req, res) => {
 *   const user = await userService.findById(req.params.id);
 *   res.json(user);
 * });
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';

// ============================================================
// TYPE DEFINITIONS
// ============================================================
/**
 * Type สำหรับ async controller function
 *
 * - รับ req, res, next เหมือน Express middleware ปกติ
 * - Return Promise<unknown> (Express ไม่สนใจค่า return)
 */
type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// ============================================================
// ASYNC HANDLER WRAPPER
// ============================================================
/**
 * Wrapper function สำหรับ async Express controllers
 *
 * วิธีทำงาน:
 * 1. รับ async function เข้ามา
 * 2. Return middleware function ใหม่ที่ wrap ด้วย Promise.resolve
 * 3. ถ้ามี error, จะ catch และส่งไปยัง next() อัตโนมัติ
 *
 * @param {AsyncController} fn - Async controller function ที่ต้องการ wrap
 * @returns {RequestHandler} - Express middleware ที่ handle errors อัตโนมัติ
 *
 * @example
 * // ใช้กับ controller
 * export const createItem = asyncHandler(async (req: Request, res: Response) => {
 *   const item = await itemService.create(req.body);
 *   sendSuccess(res, item, 'Created', 201);
 * });
 *
 * @example
 * // Error จะถูก catch และส่งไป errorHandler อัตโนมัติ
 * export const getItem = asyncHandler(async (req: Request, res: Response) => {
 *   const item = await itemService.findById(req.params.id);
 *   if (!item) {
 *     throw new AppError('Item not found', 404); // จะถูก catch และส่งไป errorHandler
 *   }
 *   sendSuccess(res, item);
 * });
 */
export const asyncHandler = (fn: AsyncController): RequestHandler => {
  return (req, res, next) => {
    // Promise.resolve รับประกันว่าแม้ fn จะ return ค่าปกติ (ไม่ใช่ Promise)
    // ก็จะถูก wrap เป็น Promise เสมอ ทำให้ .catch() ทำงานได้
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
