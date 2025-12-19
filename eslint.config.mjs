import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // 1. กำหนดว่าให้ตรวจไฟล์ประเภทไหนบ้าง
  { files: ['**/*.{js,mjs,cjs,ts}'] },

  // 2. กำหนด Environment (Node.js) เพื่อไม่ให้ฟ้องว่า process หรือ console ไม่รู้จัก
  { languageOptions: { globals: globals.node } },

  // 3. โหลด Config มาตรฐานที่ควรมี (Production Grade)
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  // 4. ผนวก Prettier เข้าไป (ให้ ESLint แจ้ง Error ถ้าจัดหน้าไม่สวย)
  eslintPluginPrettier,

  // 5. Custom Rules (ปรับแต่งกฎเพิ่มเติมตามใจชอบ)
  {
    rules: {
      // เตือนถ้าใช้ any (Production ไม่ควรใช้ any พร่ำเพรื่อ)
      '@typescript-eslint/no-explicit-any': 'warn',

      // บังคับให้ใส่ type return ของ function เสมอ (ช่วยให้อ่านโค้ดง่าย)
      // "@typescript-eslint/explicit-function-return-type": "warn", // เปิดบรรทัดนี้ถ้าอยากเข้มงวดสุดๆ

      // ถ้ามีตัวแปรประกาศแล้วไม่ได้ใช้ ให้แจ้งเตือน (ช่วยลดขยะในโค้ด)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
];
