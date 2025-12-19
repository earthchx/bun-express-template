/**
 * @file src/index.ts
 * @description Application Entry Point & Server Startup
 *
 * ไฟล์นี้ทำหน้าที่:
 * 1. Start HTTP server
 * 2. Handle Graceful Shutdown
 * 3. Listen for process signals (SIGTERM, SIGINT)
 *
 * Design Principle:
 * - Separation of Concerns: app.ts = configuration, index.ts = runtime
 * - ทำให้ app.ts testable (ไม่ต้อง start server จริง)
 * - Graceful shutdown สำหรับ containerized environments
 *
 * Process Signals:
 * - SIGTERM: Kubernetes sends this before killing pod
 * - SIGINT: User presses Ctrl+C
 *
 * @example
 * // Start server
 * bun run dev
 * bun run start
 */

import app from './app';
import { config } from './config/env';

// ============================================================
// START SERVER
// ============================================================
/**
 * Start HTTP server and listen on configured port
 *
 * Note: server instance ถูก store ไว้เพื่อใช้ใน graceful shutdown
 */
const server = app.listen(config.PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${config.PORT}`);
  console.log(`📚 API docs at http://localhost:${config.PORT}/api-docs`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
/**
 * Graceful Shutdown Handler
 *
 * ขั้นตอน:
 * 1. รับ signal (SIGTERM/SIGINT)
 * 2. หยุดรับ connections ใหม่ (server.close)
 * 3. รอ requests ที่กำลังทำงานอยู่ให้เสร็จ
 * 4. ปิด database connections (ถ้ามี)
 * 5. Exit process
 *
 * Timeout:
 * - ถ้า 10 วินาทีผ่านไปยังปิดไม่ได้ → Force exit
 * - ป้องกัน hanging processes
 *
 * Why Graceful Shutdown?
 * - ไม่ให้ request ที่กำลังทำงานถูก drop กลางทาง
 * - ปิด database connections อย่างถูกต้อง
 * - Kubernetes ต้องการเพื่อ rolling updates
 */
const shutdown = async () => {
  console.log('🛑 SIGTERM/SIGINT received: Closing HTTP server...');

  // ─────────────────────────────────────────────────────────
  // Step 1: Stop accepting new connections
  // ─────────────────────────────────────────────────────────
  /**
   * server.close() จะ:
   * - หยุดรับ connections ใหม่
   * - รอ connections ที่มีอยู่ให้จบก่อน
   * - เรียก callback เมื่อปิดเสร็จ
   */
  server.close(async () => {
    console.log('✅ HTTP server closed');

    // ─────────────────────────────────────────────────────────
    // Step 2: Close database connections
    // ─────────────────────────────────────────────────────────
    /**
     * Drizzle + postgres.js จัดการ connection pool ให้
     * ถ้าต้องการปิด explicit:
     *
     * import { client } from '@/db';
     * await client.end();
     */
    // await client.end();

    console.log('👋 Bye bye');
    process.exit(0);
  });

  // ─────────────────────────────────────────────────────────
  // Step 3: Force exit after timeout
  // ─────────────────────────────────────────────────────────
  /**
   * Safety timeout: ถ้า 10 วินาทีผ่านไปยังปิดไม่ได้
   * แสดงว่ามี connection ค้าง → Force exit
   *
   * Exit code 1 = error (แจ้ง orchestrator ว่ามีปัญหา)
   */
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000); // 10 seconds timeout
};

// ============================================================
// SIGNAL HANDLERS
// ============================================================
/**
 * Listen for termination signals
 *
 * SIGTERM: ส่งโดย Kubernetes, Docker, systemd
 *          ก่อนจะ kill process
 *
 * SIGINT:  ส่งโดย user กด Ctrl+C
 *          หรือ IDE stop button
 */
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
