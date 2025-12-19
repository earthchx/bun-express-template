import { describe, it, expect, beforeAll } from 'bun:test';
import * as itemService from '@/services/item.service';
import { db } from '@/db';
import { items } from '@/db/schema';
import { sql } from 'drizzle-orm';

describe('Item Service Unit Tests', () => {
  beforeAll(async () => {
    // เคลียร์ข้อมูลก่อนเทส
    await db.execute(sql`TRUNCATE TABLE ${items} RESTART IDENTITY CASCADE`);
  });

  it('should create and retrieve an item', async () => {
    // 1. Test Create
    const created = await itemService.createItemService({ name: 'Service Test Item' });
    expect(created).toBeDefined();

    // 2. Test Get By ID
    // ใส่ ! เพื่อบอก TS ว่ามีค่าแน่ๆ
    const found = await itemService.getItemByIdService(created!.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe('Service Test Item');
  });

  // 🔥 เพิ่ม Test case สำหรับ Pagination ที่เราเพิ่งทำ
  it('should get all items with pagination', async () => {
    // สร้างของเพิ่มอีกสัก 2 ชิ้น
    await itemService.createItemService({ name: 'Item A' });
    await itemService.createItemService({ name: 'Item B' });

    // เรียก Service แบบส่ง Params (เพราะเราบังคับส่งแล้ว)
    const result = await itemService.getAllItemsService({
      page: 1,
      limit: 10,
      sort: 'id',
      order: 'asc',
      q: undefined,
    });

    expect(result.data.length).toBeGreaterThanOrEqual(3); // Service Test Item + A + B
    expect(result.total).toBeGreaterThanOrEqual(3);
  });

  it('should return undefined when item not found', async () => {
    const found = await itemService.getItemByIdService(9999);
    expect(found).toBeUndefined();
  });
});
