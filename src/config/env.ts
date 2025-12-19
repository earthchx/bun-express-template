/**
 * @file src/config/env.ts
 * @description Environment Configuration with Zod Validation
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. โหลด Environment Variables จากไฟล์ .env ตาม NODE_ENV
 * 2. Validate ค่าทั้งหมดด้วย Zod Schema (Type-safe)
 * 3. Fail Fast - หยุดทันทีถ้า config ผิดพลาด (ไม่ปล่อยให้รันแล้วพังทีหลัง)
 *
 * @example
 * // ใช้งานใน file อื่น
 * import { config } from '@/config/env';
 * console.log(config.PORT); // 3000 (type: number)
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// ============================================================
// 1. LOAD ENVIRONMENT FILE
// ============================================================
/**
 * โหลดไฟล์ .env ตาม NODE_ENV
 * - development → .env.development
 * - production  → .env.production
 * - test        → .env.test
 *
 * หมายเหตุ: ใน Production (Docker/K8s) ปกติจะ inject env vars เข้าไปตรงๆ
 * แต่บรรทัดนี้ใส่ไว้ก็ไม่เสียหาย เพราะ dotenv จะไม่ทับค่าที่มีอยู่แล้ว
 */
const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${nodeEnv}` });

// ============================================================
// 2. DEFINE VALIDATION SCHEMA
// ============================================================
/**
 * Zod Schema สำหรับ validate environment variables
 *
 * ข้อดีของการใช้ Zod:
 * - Type-safe: TypeScript รู้จัก type ของทุก field
 * - Runtime validation: ตรวจสอบค่าจริงๆ ตอน runtime
 * - Coercion: แปลง string "3000" เป็น number 3000 อัตโนมัติ
 * - Default values: กำหนดค่า default ได้
 */
const envSchema = z.object({
  // ─────────────────────────────────────────────────────────
  // Server Configuration
  // ─────────────────────────────────────────────────────────
  /**
   * Port ที่ server จะรัน
   * @default 3000
   * @example PORT=8080
   */
  PORT: z.coerce.number().default(3000),

  /**
   * Environment mode
   * - development: เปิด debug, pretty logs, stack trace
   * - production: ปิด debug, JSON logs, ไม่แสดง stack trace
   * - test: สำหรับ unit test
   * @default 'development'
   */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ─────────────────────────────────────────────────────────
  // Database Configuration
  // ─────────────────────────────────────────────────────────
  /**
   * PostgreSQL Connection URL
   * @required
   * @format postgres://user:password@host:port/database
   * @example DATABASE_URL=postgres://postgres:password@localhost:5432/mydb
   */
  DATABASE_URL: z.string().url().describe('DATABASE_URL is required'),

  // ─────────────────────────────────────────────────────────
  // Logger Configuration
  // ─────────────────────────────────────────────────────────
  /**
   * Pino log level
   * fatal > error > warn > info > debug > trace
   * @default 'info'
   */
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // ─────────────────────────────────────────────────────────
  // Security (สำหรับอนาคต)
  // ─────────────────────────────────────────────────────────
  // JWT_SECRET: z.string().min(32).optional(),
  // API_KEY: z.string().optional(),
});

// ============================================================
// 3. VALIDATE & FAIL FAST
// ============================================================
/**
 * ใช้ safeParse แทน parse เพื่อจัดการ error ได้สวยงามกว่า
 * - parse() → throw error ทันที
 * - safeParse() → return { success, data, error }
 */
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(parsedEnv.error.format(), null, 2),
  );
  // หยุดทันที! ดีกว่าปล่อยให้รันไปแล้วพังกลางทาง
  // Exit code 1 = error
  process.exit(1);
}

// ============================================================
// 4. EXPORT VALIDATED CONFIG
// ============================================================
/**
 * Config object ที่ผ่านการ validate แล้ว 100%
 * TypeScript จะรู้จัก type ของทุก field โดยอัตโนมัติ
 *
 * @example
 * config.PORT       // number
 * config.NODE_ENV   // 'development' | 'production' | 'test'
 * config.DATABASE_URL // string (url format)
 */
export const config = parsedEnv.data;
