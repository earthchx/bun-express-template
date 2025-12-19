import { describe, it, expect, beforeAll } from 'bun:test';
import request from 'supertest';
import app from '../app';
import { db } from '@/db';
import { items } from '@/db/schema';
import { sql } from 'drizzle-orm';

describe('API Integration Testing (CRUD)', () => {
  // ตัวแปรสำหรับเก็บ ID ที่ถูกสร้างขึ้น เพื่อเอาไปใช้ใน Test ข้ออื่นๆ
  let createdItemId: number;

  // 🧹 ล้างข้อมูลก่อนเริ่ม
  beforeAll(async () => {
    await db.execute(sql`TRUNCATE TABLE ${items} RESTART IDENTITY CASCADE`);
  });

  // ----------------------------------------------------------------
  // 1. Health Check Endpoints
  // ----------------------------------------------------------------
  it('GET /health should return 200 with DB status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.checks.database).toBe('ok');
    expect(res.body.data.uptime).toBeDefined();
  });

  it('GET /health/live should return 200', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('alive');
  });

  it('GET /health/ready should return 200 when DB is connected', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ready');
  });

  // ----------------------------------------------------------------
  // 2. CREATE (POST)
  // ----------------------------------------------------------------
  it('POST /api/v1/items should create a new item', async () => {
    const newItem = { name: 'Original Name' };
    const res = await request(app).post('/api/v1/items').send(newItem);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Original Name');

    // เก็บ ID ไว้ใช้ต่อใน Test ข้ออื่น
    createdItemId = res.body.data.id;
  });

  it('POST /api/v1/items should return 400 if validation fails', async () => {
    const res = await request(app).post('/api/v1/items').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ----------------------------------------------------------------
  // 3. READ LIST (GET) - 🔥 อัปเกรดรองรับ Pagination
  // ----------------------------------------------------------------
  it('GET /api/v1/items should return paginated list', async () => {
    // ลองยิงแบบระบุ page และ limit
    const page = 1;
    const limit = 10;
    const res = await request(app).get(`/api/v1/items?page=${page}&limit=${limit}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // 1. เช็ค Data
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // เช็คว่าเจอ Item ที่เราเพิ่งสร้าง
    const found = res.body.data.find((i: { id: number }) => i.id === createdItemId);
    expect(found).toBeDefined();

    // 2. 🔥 เช็ค Meta (Pagination)
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.page).toBe(page);
    expect(res.body.meta.limit).toBe(limit);
    expect(typeof res.body.meta.totalItems).toBe('number');
    expect(typeof res.body.meta.totalPages).toBe('number');
  });

  // ----------------------------------------------------------------
  // 4. READ ONE (GET /:id)
  // ----------------------------------------------------------------
  it('GET /api/v1/items/:id should return the specific item', async () => {
    const res = await request(app).get(`/api/v1/items/${createdItemId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdItemId);
  });

  it('GET /api/v1/items/:id should return 404 for non-existent ID', async () => {
    const res = await request(app).get('/api/v1/items/99999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/items/:id should return 400 for invalid ID format', async () => {
    const res = await request(app).get('/api/v1/items/abc');
    expect(res.status).toBe(400);
  });

  // ----------------------------------------------------------------
  // 5. UPDATE (PATCH)
  // ----------------------------------------------------------------
  it('PATCH /api/v1/items/:id should update item name', async () => {
    const updateData = { name: 'Updated Name' };
    const res = await request(app).patch(`/api/v1/items/${createdItemId}`).send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Name');
  });

  it('PATCH /api/v1/items/:id should return 404 if item does not exist', async () => {
    const res = await request(app).patch('/api/v1/items/99999').send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });

  // ----------------------------------------------------------------
  // 6. DELETE (DELETE)
  // ----------------------------------------------------------------
  it('DELETE /api/v1/items/:id should delete the item', async () => {
    const res = await request(app).delete(`/api/v1/items/${createdItemId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/v1/items/:id should return 404 if item already deleted', async () => {
    const res = await request(app).delete(`/api/v1/items/${createdItemId}`);
    expect(res.status).toBe(404);
  });

  // ----------------------------------------------------------------
  // 7. VERIFY
  // ----------------------------------------------------------------
  it('GET /api/v1/items/:id should return 404 after deletion', async () => {
    const res = await request(app).get(`/api/v1/items/${createdItemId}`);
    expect(res.status).toBe(404);
  });
});
