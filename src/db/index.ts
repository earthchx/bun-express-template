/**
 * @file src/db/index.ts
 * @description Database Connection Setup with Drizzle ORM
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. สร้าง PostgreSQL client connection
 * 2. Wrap ด้วย Drizzle ORM สำหรับ type-safe queries
 * 3. Export `db` object สำหรับใช้ทั่วทั้ง application
 *
 * @example
 * // ใช้งานใน service
 * import { db } from '@/db';
 * const users = await db.select().from(users);
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '@/config/env';

// ============================================================
// DATABASE CLIENT CONFIGURATION
// ============================================================
/**
 * สร้าง PostgreSQL client ด้วย postgres.js
 *
 * Options:
 * - prepare: false → ปิด prepared statements
 *   - ดีสำหรับ serverless/edge environments (Vercel, Cloudflare)
 *   - ป้องกัน connection issues ใน environments ที่ connection ไม่ persistent
 *   - เพิ่ม compatibility กับ connection poolers (PgBouncer, Supabase)
 *
 * @see https://github.com/porsager/postgres#connection-options
 */
const client = postgres(config.DATABASE_URL, { prepare: false });

// ============================================================
// DRIZZLE ORM INSTANCE
// ============================================================
/**
 * Drizzle ORM instance สำหรับ type-safe database queries
 *
 * ข้อดีของ Drizzle:
 * - Type-safe: TypeScript รู้จัก schema ทั้งหมด
 * - SQL-like syntax: เขียนคล้าย SQL แต่มี autocomplete
 * - Lightweight: ไม่มี overhead เหมือน ORM อื่นๆ
 * - Zero runtime dependency: compile เป็น SQL ตรงๆ
 *
 * @example
 * // SELECT * FROM items WHERE id = 1
 * const item = await db.select().from(items).where(eq(items.id, 1));
 *
 * // INSERT INTO items (name) VALUES ('Test')
 * await db.insert(items).values({ name: 'Test' });
 */
export const db = drizzle(client);
