# 🚀 Ultimate Setup Guide: Bun + Express + TypeScript

คู่มือการติดตั้งโปรเจกต์แบบ **Production Grade** Step-by-Step ครอบคลุมตั้งแต่เริ่มสร้างโปรเจกต์ จนถึงการ Deploy ด้วย Docker

---

## 📋 1. Prerequisites

ก่อนเริ่มต้น ต้องติดตั้งเครื่องมือเหล่านี้:

- [Bun](https://bun.sh/) (v1.0+)
- [Docker](https://www.docker.com/) & Docker Compose
- [VS Code](https://code.visualstudio.com/) (แนะนำให้ลง Extension: ESLint, Prettier, Docker)

---

## 🛠 2. Initialize Project

เริ่มสร้างโปรเจกต์และติดตั้ง Dependencies

```bash
# 1. Init Project
bun init -y
```

### 📦 Production Dependencies

```bash
bun add express helmet cors pino pino-http zod dotenv \
  drizzle-orm postgres \
  swagger-ui-express @asteasolutions/zod-to-openapi drizzle-zod \
  compression express-rate-limit
```

| Package                          | Description                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------- |
| `express`                        | Web Framework ยอดนิยมสำหรับ Node.js ใช้สร้าง REST API                            |
| `helmet`                         | Security Middleware เพิ่ม HTTP Headers ป้องกันช่องโหว่ (XSS, Clickjacking, etc.) |
| `cors`                           | Cross-Origin Resource Sharing อนุญาตให้ Frontend อื่นเรียก API ได้               |
| `pino`                           | High-performance JSON Logger เร็วกว่า Winston/Bunyan หลายเท่า                    |
| `pino-http`                      | HTTP Request Logger Middleware สำหรับ Express                                    |
| `zod`                            | TypeScript-first Schema Validation ใช้ validate request body/params              |
| `dotenv`                         | โหลด Environment Variables จากไฟล์ `.env`                                        |
| `drizzle-orm`                    | TypeScript ORM แบบ Lightweight รองรับ SQL-like syntax                            |
| `postgres`                       | PostgreSQL Client สำหรับ Node.js (ใช้คู่กับ Drizzle)                             |
| `swagger-ui-express`             | Swagger UI สำหรับแสดง API Documentation                                          |
| `@asteasolutions/zod-to-openapi` | แปลง Zod Schema เป็น OpenAPI Spec อัตโนมัติ                                      |
| `drizzle-zod`                    | สร้าง Zod Schema จาก Drizzle Table Schema                                        |
| `compression`                    | Gzip Compression ลดขนาด Response ให้เล็กลง                                       |
| `express-rate-limit`             | Rate Limiting ป้องกัน DDoS/Brute Force Attack                                    |

### 🔧 Development Dependencies

```bash
bun add -D typescript @types/bun @types/node @types/express \
  @types/cors @types/pino @types/swagger-ui-express @types/compression \
  supertest @types/supertest \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  eslint prettier eslint-config-prettier eslint-plugin-prettier \
  globals @eslint/js typescript-eslint \
  drizzle-kit pino-pretty \
  husky lint-staged \
  @faker-js/faker
```

| Package                  | Description                                                          |
| ------------------------ | -------------------------------------------------------------------- |
| `typescript`             | TypeScript Compiler                                                  |
| `@types/*`               | Type Definitions สำหรับ Libraries ต่างๆ (ช่วยให้ IDE แนะนำ code ได้) |
| `supertest`              | HTTP Testing Library ใช้ทดสอบ API โดยไม่ต้องรัน Server จริง          |
| `eslint`                 | JavaScript/TypeScript Linter ตรวจหา code ที่มีปัญหา                  |
| `prettier`               | Code Formatter จัดระเบียบ code ให้สวยงาม                             |
| `eslint-config-prettier` | ปิด ESLint rules ที่ขัดแย้งกับ Prettier                              |
| `eslint-plugin-prettier` | รัน Prettier ผ่าน ESLint                                             |
| `@typescript-eslint/*`   | ESLint plugins สำหรับ TypeScript                                     |
| `globals`                | Global Variables Definition สำหรับ ESLint                            |
| `@eslint/js`             | ESLint JavaScript Config                                             |
| `typescript-eslint`      | TypeScript ESLint Integration                                        |
| `drizzle-kit`            | Drizzle CLI Tools (generate migrations, push schema, studio)         |
| `pino-pretty`            | Pretty Print สำหรับ Pino Logs (อ่านง่ายตอน dev)                      |
| `husky`                  | Git Hooks Manager รัน script ก่อน commit/push                        |
| `lint-staged`            | รัน Linter เฉพาะไฟล์ที่ staged (เร็วกว่า lint ทั้ง project)          |
| `@faker-js/faker`        | Fake Data Generator สำหรับ Seeding Database                          |

---

## ⚙️ 3. Configuration Files

### 📦 `package.json`

แก้ไข Scripts และ Config

```json
{
  "name": "mvc-pattern-express",
  "module": "src/index.ts",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "NODE_ENV=development bun --watch src/index.ts",
    "build": "NODE_ENV=production bun build ./src/index.ts --outdir ./dist --minify --target bun --sourcemap=none",
    "start": "NODE_ENV=production bun run ./dist/index.js",
    "start:dev": "NODE_ENV=development bun run ./dist/index.js",
    "db:test:push": "bun run --env-file=.env.test drizzle-kit push",
    "test": "bun run db:test:push --yes && NODE_ENV=test bun test",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "prepare": "husky",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "bun run src/db/seed.ts"
  },
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write", "bun test --bail"]
  }
}
```

### 📐 `tsconfig.json`

ตั้งค่า TypeScript แบบ Strict Mode + Path Alias

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 🧹 `eslint.config.mjs`

Config สำหรับ Linter (ESLint v9+ Flat Config)

```javascript
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '.drizzle/'],
  },
];
```

### 💅 `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

### 🚫 `.gitignore`

```text
node_modules
dist
.env
.env.*
!.env.example
.drizzle
coverage
bun.lockb
.DS_Store
```

### 🐶 Husky Setup

```bash
# Initialize Husky
bun run prepare

# สร้างไฟล์ .husky/pre-commit
echo "bun run lint-staged" > .husky/pre-commit
```

### 🐬 `drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

### 🆚 `.vscode/settings.json` (Optional)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

---

## 🏗 4. Project Structure

สร้างโครงสร้างโฟลเดอร์แบบ MVC + Separation of Concerns

```bash
mkdir -p src/{config,controllers,db,docs,middlewares,routes,schemas,services,tests,utils}
```

```text
src/
├── index.ts              # Entry point (Server startup)
├── app.ts                # Express app configuration
├── config/
│   └── env.ts            # Environment validation
├── controllers/
│   └── item.controller.ts
├── services/
│   └── item.service.ts
├── routes/
│   └── item.routes.ts
├── db/
│   ├── index.ts          # Drizzle client
│   ├── schema.ts         # Database schema
│   └── seed.ts           # Seed data
├── schemas/
│   ├── common.schema.ts  # Pagination schema
│   └── item.schema.ts    # Item validation
├── middlewares/
│   ├── errorHandler.ts
│   └── rateLimiter.ts
├── utils/
│   ├── AppError.ts
│   ├── asyncHandler.ts
│   └── response.ts
├── docs/
│   └── openapi.ts        # Swagger definition
└── tests/
    └── app.test.ts
```

---

## 🧱 5. Essential Boilerplate Code

### 5.1 Config Layer

#### `src/config/env.ts`

Validate Environment Variables ด้วย Zod (Fail Fast Pattern)

```typescript
import dotenv from 'dotenv';
import { z } from 'zod';

// โหลดไฟล์ .env ตาม NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${nodeEnv}` });

// กำหนด Schema
const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url().describe('DATABASE_URL is required'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

// Validate & Fail Fast
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(parsedEnv.error.format(), null, 2),
  );
  process.exit(1);
}

export const config = parsedEnv.data;
```

---

### 5.2 Database Layer

#### `src/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '@/config/env';

const client = postgres(config.DATABASE_URL, { prepare: false });
export const db = drizzle(client);
```

#### `src/db/schema.ts`

```typescript
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### `src/db/seed.ts`

```typescript
import { db } from './index';
import { items } from './schema';
import { faker } from '@faker-js/faker';

const main = async () => {
  console.log('🌱 Seeding database...');

  const mockData = [];
  for (let i = 0; i < 100; i++) {
    mockData.push({
      name: faker.commerce.productName(),
    });
  }

  await db.insert(items).values(mockData);

  console.log(`✅ Seeded ${mockData.length} items successfully!`);
  process.exit(0);
};

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
```

---

### 5.3 Schema Layer (Zod Validation)

#### `src/schemas/common.schema.ts`

Pagination Schema สำหรับใช้ร่วมกันทุก Route

```typescript
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.string().default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  q: z.string().optional(), // Search query
});

export type PaginationParams = z.infer<typeof paginationSchema>;
```

#### `src/schemas/item.schema.ts`

```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { items } from '@/db/schema';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// Schema สำหรับ Create
export const insertItemSchema = createInsertSchema(items, {
  name: z.string().min(1, 'Name is required'),
}).pick({ name: true });

// Schema สำหรับ Update (Partial)
export const updateItemSchema = insertItemSchema.partial();

// Schema สำหรับ Params (Validate ID)
export const paramIdSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

// Schema สำหรับ Response
export const selectItemSchema = createSelectSchema(items);

export type CreateItemInput = z.infer<typeof insertItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ItemParams = z.infer<typeof paramIdSchema>;
```

---

### 5.4 Utils Layer

#### `src/utils/AppError.ts`

Custom Error Class สำหรับ throw error แบบ controlled

```typescript
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

#### `src/utils/asyncHandler.ts`

Wrapper สำหรับ Async Controller (ไม่ต้องเขียน try-catch ทุกที่)

```typescript
import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = (fn: AsyncController): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

#### `src/utils/response.ts`

Helper Functions สำหรับ Response แบบ Consistent

```typescript
import type { Response } from 'express';

interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  message?: string;
}

export const sendSuccess = (res: Response, data: any, message?: string, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendPaginatedSuccess = (
  res: Response,
  data: any[],
  totalItems: number,
  page: number,
  limit: number,
  message?: string,
) => {
  const totalPages = Math.ceil(totalItems / limit);

  const response: PaginatedResponse<typeof data> = {
    success: true,
    message,
    data,
    meta: { page, limit, totalItems, totalPages },
  };

  res.status(200).json(response);
};
```

---

### 5.5 Middleware Layer

#### `src/middlewares/errorHandler.ts`

Global Error Handler (ต้องอยู่ล่างสุดของ middleware chain)

```typescript
import type { ErrorRequestHandler } from 'express';
import { AppError } from '@/utils/AppError';
import { ZodError } from 'zod';
import { config } from '@/config/env';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.issues;
  }

  if (statusCode >= 500) {
    req.log.error(err);
  } else {
    req.log.warn({ msg: message, errors });
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
```

#### `src/middlewares/rateLimiter.ts`

Rate Limiting สำหรับป้องกัน DDoS

```typescript
import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 100, // จำกัด 100 requests ต่อ IP
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

### 5.6 Service Layer

#### `src/services/item.service.ts`

Business Logic Layer (ไม่รู้จัก HTTP)

```typescript
import { db } from '@/db';
import { items } from '@/db/schema';
import { eq, desc, asc, ilike, count } from 'drizzle-orm';
import type { CreateItemInput, UpdateItemInput } from '@/schemas/item.schema';
import type { PaginationParams } from '@/schemas/common.schema';

export const getAllItemsService = async (params: PaginationParams) => {
  const { page, limit, sort, order, q } = params;
  const offset = (page - 1) * limit;

  // Filter
  const whereClause = q ? ilike(items.name, `%${q}%`) : undefined;

  // Sorting
  const sortMap: Record<string, any> = {
    id: items.id,
    name: items.name,
    created_at: items.createdAt,
  };
  const sortColumn = sortMap[sort] || items.id;
  const orderByClause = order === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Query Data
  const data = await db
    .select()
    .from(items)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(orderByClause);

  // Query Total Count
  const [totalResult] = await db.select({ value: count() }).from(items).where(whereClause);

  return { data, total: totalResult!.value };
};

export const getItemByIdService = async (id: number) => {
  const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
  return result[0];
};

export const createItemService = async (data: CreateItemInput) => {
  const result = await db.insert(items).values(data).returning();
  return result[0];
};

export const updateItemService = async (id: number, data: UpdateItemInput) => {
  const result = await db.update(items).set(data).where(eq(items.id, id)).returning();
  return result[0];
};

export const deleteItemService = async (id: number) => {
  const result = await db.delete(items).where(eq(items.id, id)).returning();
  return result[0];
};
```

---

### 5.7 Controller Layer

#### `src/controllers/item.controller.ts`

HTTP Handler (รู้จัก Request/Response)

```typescript
import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/utils/AppError';
import { sendPaginatedSuccess, sendSuccess } from '@/utils/response';
import { paginationSchema } from '@/schemas/common.schema';
import { insertItemSchema, updateItemSchema, paramIdSchema } from '@/schemas/item.schema';
import * as itemService from '@/services/item.service';

export const getItems = asyncHandler(async (req: Request, res: Response) => {
  const query = paginationSchema.parse(req.query);
  const { data, total } = await itemService.getAllItemsService(query);
  sendPaginatedSuccess(res, data, total, query.page, query.limit);
});

export const getItemById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = paramIdSchema.parse(req.params);
  const item = await itemService.getItemByIdService(id);

  if (!item) {
    throw new AppError(`Item with ID ${id} not found`, 404);
  }

  sendSuccess(res, item);
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const body = insertItemSchema.parse(req.body);
  const newItem = await itemService.createItemService(body);
  sendSuccess(res, newItem, 'Item created successfully', 201);
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = paramIdSchema.parse(req.params);
  const body = updateItemSchema.parse(req.body);
  const updatedItem = await itemService.updateItemService(id, body);

  if (!updatedItem) {
    throw new AppError(`Item with ID ${id} not found`, 404);
  }

  sendSuccess(res, updatedItem, 'Item updated successfully');
});

export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = paramIdSchema.parse(req.params);
  const deletedItem = await itemService.deleteItemService(id);

  if (!deletedItem) {
    throw new AppError(`Item with ID ${id} not found`, 404);
  }

  sendSuccess(res, deletedItem, 'Item deleted successfully');
});
```

---

### 5.8 Route Layer

#### `src/routes/item.routes.ts`

```typescript
import { Router } from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '@/controllers/item.controller';

const router = Router();

router.get('/', getItems);
router.post('/', createItem);
router.get('/:id', getItemById);
router.patch('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
```

---

### 5.9 OpenAPI Documentation

#### `src/docs/openapi.ts`

Auto-generate Swagger จาก Zod Schema

```typescript
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  insertItemSchema,
  selectItemSchema,
  updateItemSchema,
  paramIdSchema,
} from '@/schemas/item.schema';
import { paginationSchema } from '@/schemas/common.schema';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Helper Schemas
const createSuccessResponse = (dataSchema: z.ZodTypeAny) => {
  return z.object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().optional(),
    data: dataSchema,
  });
};

const createPaginatedResponse = (itemSchema: z.ZodTypeAny) => {
  return z.object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().optional(),
    data: z.array(itemSchema),
    meta: z.object({
      page: z.number().openapi({ example: 1 }),
      limit: z.number().openapi({ example: 10 }),
      totalItems: z.number().openapi({ example: 50 }),
      totalPages: z.number().openapi({ example: 5 }),
    }),
  });
};

const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  message: z.string().openapi({ example: 'Something went wrong' }),
});

// Register Schemas
registry.register('Item', selectItemSchema);
registry.register('NewItem', insertItemSchema);
registry.register('UpdateItem', updateItemSchema);

// Register Paths
registry.registerPath({
  method: 'get',
  path: '/items',
  tags: ['Items'],
  summary: 'Get all items (Paginated)',
  request: { query: paginationSchema },
  responses: {
    200: {
      description: 'List of items with pagination info',
      content: { 'application/json': { schema: createPaginatedResponse(selectItemSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/items',
  tags: ['Items'],
  summary: 'Create a new item',
  request: {
    body: { content: { 'application/json': { schema: insertItemSchema } } },
  },
  responses: {
    201: {
      description: 'Item created successfully',
      content: { 'application/json': { schema: createSuccessResponse(selectItemSchema) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/items/{id}',
  tags: ['Items'],
  summary: 'Get item by ID',
  request: { params: paramIdSchema },
  responses: {
    200: {
      description: 'Item details',
      content: { 'application/json': { schema: createSuccessResponse(selectItemSchema) } },
    },
    404: {
      description: 'Item not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/items/{id}',
  tags: ['Items'],
  summary: 'Update item',
  request: {
    params: paramIdSchema,
    body: { content: { 'application/json': { schema: updateItemSchema } } },
  },
  responses: {
    200: {
      description: 'Item updated successfully',
      content: { 'application/json': { schema: createSuccessResponse(selectItemSchema) } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/items/{id}',
  tags: ['Items'],
  summary: 'Delete item',
  request: { params: paramIdSchema },
  responses: {
    200: {
      description: 'Item deleted successfully',
      content: { 'application/json': { schema: createSuccessResponse(selectItemSchema) } },
    },
  },
});

// Generate OpenAPI Document
export const generateOpenAPI = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Items API',
      version: '1.0.0',
      description: 'RESTful API with Express + Drizzle + Zod',
    },
    servers: [{ url: '/' }],
  });
};
```

---

### 5.10 App & Server

#### `src/app.ts`

Express App Configuration (Middlewares + Routes)

```typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import compression from 'compression';
import { randomUUID } from 'crypto';

import { generateOpenAPI } from '@/docs/openapi';
import itemRoutes from '@/routes/item.routes';
import { errorHandler } from '@/middlewares/errorHandler';
import { config } from '@/config/env';
import { limiter } from '@/middlewares/rateLimiter';

const app = express();
const openApiDocument = generateOpenAPI();

// =========================================
// 1. Global Middlewares
// =========================================
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(compression());
app.use(
  pinoHttp({
    genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID(),
    transport:
      config.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
          }
        : undefined,
    autoLogging: config.NODE_ENV !== 'test', // ปิด log ตอน test
  }),
);
app.use((req, res, next) => {
  const reqId = req.id as string;
  res.setHeader('X-Request-ID', reqId);
  next();
});
app.use(limiter);

// =========================================
// 2. Documentation
// =========================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// =========================================
// 3. Application Routes
// =========================================
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/items', itemRoutes);

// =========================================
// 4. Error Handling (ต้องอยู่ล่างสุด!)
// =========================================
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});
app.use(errorHandler);

export default app;
```

#### `src/index.ts`

Entry Point + Graceful Shutdown

```typescript
import app from './app';
import { config } from './config/env';

const server = app.listen(config.PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${config.PORT}`);
  console.log(`📚 API docs at http://localhost:${config.PORT}/api-docs`);
  console.log(`DB Mode: ${config.NODE_ENV}`);
});

// Graceful Shutdown
const shutdown = async () => {
  console.log('🛑 SIGTERM received: Closing HTTP server...');

  server.close(async () => {
    console.log('✅ HTTP server closed');
    console.log('👋 Bye bye');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

---

### 5.11 Testing

#### `src/tests/app.test.ts`

Integration Tests ด้วย Bun Test + Supertest

```typescript
import { describe, it, expect, beforeAll } from 'bun:test';
import request from 'supertest';
import app from '@/app';
import { db } from '@/db';
import { items } from '@/db/schema';
import { sql } from 'drizzle-orm';

describe('API Integration Testing (CRUD)', () => {
  let createdItemId: number;

  // ล้างข้อมูลก่อนเริ่ม
  beforeAll(async () => {
    await db.execute(sql`TRUNCATE TABLE ${items} RESTART IDENTITY CASCADE`);
  });

  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('POST /items should create a new item', async () => {
    const newItem = { name: 'Test Item' };
    const res = await request(app).post('/items').send(newItem);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Item');

    createdItemId = res.body.data.id;
  });

  it('GET /items should return paginated list', async () => {
    const res = await request(app).get('/items?page=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
  });

  it('GET /items/:id should return the specific item', async () => {
    const res = await request(app).get(`/items/${createdItemId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdItemId);
  });

  it('PATCH /items/:id should update item', async () => {
    const res = await request(app).patch(`/items/${createdItemId}`).send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated');
  });

  it('DELETE /items/:id should delete item', async () => {
    const res = await request(app).delete(`/items/${createdItemId}`);
    expect(res.status).toBe(200);
  });

  it('GET /items/:id should return 404 for deleted item', async () => {
    const res = await request(app).get(`/items/${createdItemId}`);
    expect(res.status).toBe(404);
  });
});
```

---

## 🐳 6. Docker Setup

### `.dockerignore`

```text
node_modules
dist
.git
.env*
.drizzle
.husky
coverage
README.md
SETUP.md
docker-compose.yml
```

### `Dockerfile`

Multi-stage build สำหรับ Production

```dockerfile
# Stage 1: Builder
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ENV NODE_ENV=production
RUN bun run build

# Stage 2: Runner
FROM oven/bun:1-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
```

### `docker-compose.yml`

```yaml
name: my-express-stack

services:
  db:
    image: postgres:16-alpine
    restart: always
    container_name: my-postgres-db
    environment:
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: mypassword
      POSTGRES_DB: mydb
    ports:
      - '5432:5432'
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U myuser -d mydb']
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build: .
    container_name: my-express-app
    restart: always
    expose:
      - '3000'
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://myuser:mypassword@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy

volumes:
  pg_data:
```

### `init.sql`

สร้าง Test Database อัตโนมัติ

```sql
CREATE DATABASE mydb_test;
```

---

## 🚀 7. How to Run

### 1️⃣ Setup Git Hooks (ครั้งแรกครั้งเดียว)

```bash
bun run prepare
```

### 2️⃣ Start Database

```bash
docker compose up db -d
```

### 3️⃣ Setup Environment Variables

สร้างไฟล์ `.env.development`:

```properties
PORT=3000
NODE_ENV=development
DATABASE_URL="postgres://myuser:mypassword@localhost:5432/mydb"
LOG_LEVEL=info
```

สร้างไฟล์ `.env.test`:

```properties
PORT=3000
NODE_ENV=test
DATABASE_URL="postgres://myuser:mypassword@localhost:5432/mydb_test"
LOG_LEVEL=error
```

### 4️⃣ Sync Database Schema

```bash
bun run db:push
```

### 5️⃣ (Optional) Seed Data

```bash
bun run db:seed
```

### 6️⃣ Start Dev Server

```bash
bun run dev
```

### 7️⃣ Run Tests

```bash
bun run test
```

### 8️⃣ Access Points

| URL                              | Description  |
| -------------------------------- | ------------ |
| `http://localhost:3000`          | API Server   |
| `http://localhost:3000/api-docs` | Swagger UI   |
| `http://localhost:3000/health`   | Health Check |

---

## 📚 API Endpoints Summary

| Method   | Endpoint     | Description               |
| -------- | ------------ | ------------------------- |
| `GET`    | `/health`    | Health check              |
| `GET`    | `/items`     | Get all items (paginated) |
| `GET`    | `/items/:id` | Get item by ID            |
| `POST`   | `/items`     | Create new item           |
| `PATCH`  | `/items/:id` | Update item               |
| `DELETE` | `/items/:id` | Delete item               |

### Query Parameters (GET /items)

| Param   | Type   | Default    | Description               |
| ------- | ------ | ---------- | ------------------------- |
| `page`  | number | 1          | Page number               |
| `limit` | number | 10         | Items per page (max: 100) |
| `sort`  | string | created_at | Sort field                |
| `order` | string | desc       | Sort order (asc/desc)     |
| `q`     | string | -          | Search by name            |
