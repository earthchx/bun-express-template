/**
 * @file src/db/schema.ts
 * @description Database Schema Definitions with Drizzle ORM
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. กำหนดโครงสร้างตาราง (Tables) ทั้งหมดในระบบ
 * 2. เป็น Single Source of Truth สำหรับ database schema
 * 3. ใช้สร้าง migrations และ Zod schemas อัตโนมัติ
 *
 * การเพิ่มตารางใหม่:
 * 1. สร้าง pgTable ใหม่ในไฟล์นี้
 * 2. รัน `bun run db:generate` เพื่อสร้าง migration
 * 3. รัน `bun run db:migrate` เพื่อ apply migration
 *
 * @example
 * // สร้างตารางใหม่
 * export const users = pgTable('users', {
 *   id: serial('id').primaryKey(),
 *   email: text('email').notNull().unique(),
 * });
 */

import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// ============================================================
// ITEMS TABLE
// ============================================================
/**
 * Items Table - ตารางหลักสำหรับเก็บข้อมูล items
 *
 * Columns:
 * - id: Primary Key (Auto-increment)
 * - name: ชื่อ item (ห้ามเป็น null)
 * - createdAt: วันที่สร้าง (auto-set เมื่อ insert)
 *
 * SQL Equivalent:
 * ```sql
 * CREATE TABLE items (
 *   id SERIAL PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 * ```
 */
export const items = pgTable('items', {
  /** Primary Key - Auto-increment integer */
  id: serial('id').primaryKey(),

  /** ชื่อของ item - Required field */
  name: text('name').notNull(),

  /** Timestamp เมื่อสร้าง record - Auto-set by database */
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================
// TYPE EXPORTS (Optional - for direct usage)
// ============================================================
/**
 * TypeScript types inferred จาก schema
 * ใช้สำหรับกรณีที่ต้องการ type โดยไม่ผ่าน Zod
 *
 * @example
 * import { Item, NewItem } from '@/db/schema';
 * const item: Item = { id: 1, name: 'Test', createdAt: new Date() };
 */
// export type Item = typeof items.$inferSelect;
// export type NewItem = typeof items.$inferInsert;
