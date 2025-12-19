import { defineConfig } from 'drizzle-kit';
// เพิ่มบรรทัดนี้ลงไป เพื่อบังคับโหลดไฟล์ .env.development ทันที
import 'dotenv/config';
// หรือถ้าอยากระบุไฟล์ชัดเจน (กรณีใช้ .env.development):
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // ใส่ ! ด้านหลัง เพื่อยืนยันกับ TS ว่ามีค่าแน่ๆ
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
