/**
 * @file src/middlewares/rateLimiter.ts
 * @description Rate Limiting Middleware for DDoS Protection
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. จำกัดจำนวน requests ต่อ IP address
 * 2. ป้องกัน DDoS และ Brute-force attacks
 * 3. ส่ง Rate Limit headers กลับไปบอก client
 *
 * How it works:
 * - นับจำนวน requests จากแต่ละ IP
 * - ถ้าเกิน limit ใน window → block และ return 429
 * - Reset counter หลังจาก window หมดอายุ
 *
 * Rate Limit Headers (RFC 6585):
 * - RateLimit-Limit: Maximum requests allowed
 * - RateLimit-Remaining: Remaining requests in window
 * - RateLimit-Reset: Timestamp when window resets
 *
 * @example
 * // Response headers
 * RateLimit-Limit: 100
 * RateLimit-Remaining: 95
 * RateLimit-Reset: 1705312800
 */

import rateLimit from 'express-rate-limit';

// ============================================================
// RATE LIMITER CONFIGURATION
// ============================================================
/**
 * Rate Limiter Middleware Instance
 *
 * Current Configuration:
 * - Window: 15 minutes
 * - Max requests: 100 per IP per window
 * - Headers: Standard (RFC compliant)
 *
 * Customization Tips:
 * - API-heavy apps: เพิ่ม max เป็น 500-1000
 * - Auth endpoints: สร้าง limiter แยก (เช่น 5 requests/minute)
 * - Premium users: ใช้ keyGenerator เพื่อแยก limit ตาม user
 *
 * @example
 * // Stricter limit สำหรับ login
 * const loginLimiter = rateLimit({
 *   windowMs: 60 * 1000,  // 1 minute
 *   max: 5,               // 5 attempts
 *   message: { ... }
 * });
 * app.use('/auth/login', loginLimiter);
 */
export const limiter = rateLimit({
  // ─────────────────────────────────────────────────────────
  // Time Window Configuration
  // ─────────────────────────────────────────────────────────
  /**
   * ช่วงเวลาที่นับ requests (milliseconds)
   * 15 นาที = 15 * 60 * 1000 = 900,000 ms
   */
  windowMs: 15 * 60 * 1000,

  // ─────────────────────────────────────────────────────────
  // Request Limit
  // ─────────────────────────────────────────────────────────
  /**
   * จำนวน requests สูงสุดต่อ IP ใน 1 window
   * 100 requests / 15 minutes = ~6.67 requests/minute
   */
  max: 100,

  // ─────────────────────────────────────────────────────────
  // Error Response
  // ─────────────────────────────────────────────────────────
  /**
   * Response ที่ส่งกลับเมื่อ rate limit exceeded
   * HTTP Status: 429 Too Many Requests (automatic)
   */
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },

  // ─────────────────────────────────────────────────────────
  // Headers Configuration
  // ─────────────────────────────────────────────────────────
  /**
   * standardHeaders: ส่ง RateLimit-* headers (RFC 6585)
   * legacyHeaders: ไม่ส่ง X-RateLimit-* headers (deprecated)
   */
  standardHeaders: true,
  legacyHeaders: false,
});
