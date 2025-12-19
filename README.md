# 🚀 MVC Pattern Express API

RESTful API แบบ Production Grade ด้วย **Bun + Express 5 + TypeScript + Drizzle ORM + PostgreSQL**

## ✨ Features

- ⚡ **Bun** - Runtime ที่เร็วกว่า Node.js
- 🌐 **Express 5** - Web Framework ยอดนิยม
- 🔷 **TypeScript** - Type-safe ตลอดทั้ง Project (ไม่มี `any`)
- 🗃️ **Drizzle ORM** - Modern ORM สำหรับ PostgreSQL
- ✅ **Zod** - Schema Validation
- 📚 **Swagger UI** - Auto-generated API Documentation
- 🔒 **Security** - Helmet, CORS, Rate Limiting, No Stack Trace Leak
- 📦 **Compression** - Gzip response
- 📝 **Pino** - Fast structured logging with Request ID
- 🏥 **Health Checks** - Liveness & Readiness probes (K8s ready)
- 🔄 **Graceful Shutdown** - ปิด server อย่างถูกต้อง
- 🔢 **API Versioning** - `/api/v1/*` pattern
- 🧪 **Bun Test** - Built-in testing (17 tests)
- 🐳 **Docker** - Container ready
- 📖 **JSDoc** - Comments ทุกไฟล์
- 🔧 **ESLint + Prettier** - Code linting & formatting
- 🪝 **Husky + lint-staged** - Git hooks (pre-commit)

---

## 📁 Project Structure

```
src/
├── index.ts              # Entry point (Server startup + Graceful shutdown)
├── app.ts                # Express app configuration (middlewares, routes)
├── config/
│   └── env.ts            # Environment validation with Zod
├── controllers/
│   ├── health.controller.ts  # Health check handlers
│   └── item.controller.ts    # Item CRUD handlers
├── services/
│   └── item.service.ts   # Business logic layer
├── routes/
│   ├── index.ts          # Route aggregator + API versioning
│   ├── health.routes.ts  # Health check routes (/health)
│   └── item.routes.ts    # Item routes (/api/v1/items)
├── db/
│   ├── index.ts          # Drizzle client
│   ├── schema.ts         # Database schema
│   └── seed.ts           # Seed data with Faker
├── schemas/
│   ├── common.schema.ts  # Pagination schema
│   └── item.schema.ts    # Item validation schemas
├── middlewares/
│   ├── errorHandler.ts   # Global error handler
│   └── rateLimiter.ts    # Rate limiting config
├── utils/
│   ├── AppError.ts       # Custom error class
│   ├── asyncHandler.ts   # Async wrapper (no try-catch needed)
│   └── response.ts       # Response helpers (sendSuccess, sendPaginatedSuccess)
├── docs/
│   └── openapi.ts        # Swagger/OpenAPI definition
└── tests/
    ├── app.test.ts       # Integration tests
    └── service.test.ts   # Unit tests
```

---

## 📋 Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Docker](https://www.docker.com/) & Docker Compose
- [VS Code](https://code.visualstudio.com/) (แนะนำ Extensions: ESLint, Prettier, Docker)

---

## 🛠️ Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd mvc-pattern-express
bun install
```

### 2. Setup Environment Variables

สร้างไฟล์ `.env.development`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://myuser:mypassword@localhost:5432/mydb
LOG_LEVEL=info
```

สร้างไฟล์ `.env.test`:

```env
NODE_ENV=test
PORT=3000
DATABASE_URL=postgres://myuser:mypassword@localhost:5432/mydb_test
LOG_LEVEL=error
```

### 3. Start Database

```bash
docker compose up db -d
```

### 4. Push Schema to Database

```bash
bun run db:push
```

### 5. (Optional) Seed Data

```bash
bun run db:seed
```

### 6. Start Development Server

```bash
bun run dev
```

🚀 Server จะรันที่ `http://localhost:3000`
📚 API Docs ที่ `http://localhost:3000/api-docs`

---

## 📜 Available Scripts

| Script                | Description                              |
| --------------------- | ---------------------------------------- |
| `bun run dev`         | Start development server with hot-reload |
| `bun run build`       | Build for production                     |
| `bun run start`       | Run production build                     |
| `bun run test`        | Run tests (auto-push test schema)        |
| `bun run lint`        | Check code with ESLint                   |
| `bun run lint:fix`    | Fix ESLint errors                        |
| `bun run db:generate` | Generate Drizzle migrations              |
| `bun run db:push`     | Push schema to database                  |
| `bun run db:studio`   | Open Drizzle Studio (GUI)                |
| `bun run db:seed`     | Seed database with fake data             |

---

## 🔌 API Endpoints

### Health Check (ไม่มี version prefix)

| Method | Endpoint        | Description                     |
| ------ | --------------- | ------------------------------- |
| `GET`  | `/health`       | Full health check (server + DB) |
| `GET`  | `/health/live`  | Liveness probe (K8s)            |
| `GET`  | `/health/ready` | Readiness probe (K8s)           |

### Items API (v1)

| Method   | Endpoint            | Description               |
| -------- | ------------------- | ------------------------- |
| `GET`    | `/api/v1/items`     | Get all items (paginated) |
| `GET`    | `/api/v1/items/:id` | Get item by ID            |
| `POST`   | `/api/v1/items`     | Create new item           |
| `PATCH`  | `/api/v1/items/:id` | Update item               |
| `DELETE` | `/api/v1/items/:id` | Delete item               |

### Query Parameters (GET /api/v1/items)

| Param   | Type   | Default    | Description                       |
| ------- | ------ | ---------- | --------------------------------- |
| `page`  | number | 1          | Page number                       |
| `limit` | number | 10         | Items per page (max: 100)         |
| `sort`  | string | created_at | Sort field (id, name, created_at) |
| `order` | string | desc       | Sort order (asc, desc)            |
| `q`     | string | -          | Search by name                    |

**Example:**

```
GET /api/v1/items?page=1&limit=20&sort=name&order=asc&q=keyboard
```

---

## 🧪 Testing

```bash
bun run db:test:push
# Run all tests
bun test
```

---

## 🐳 Docker

### Development (Database only)

```bash
docker compose up db -d
```

### Production (Full stack)

```bash
# Build image
docker build -t my-express-app .
docker run -d -p 3000:3000 --env-file .env.production --name my-app my-express-app

# Run with docker compose
docker compose up -d # กรณี setup ghcr เรียบร้อย และอยู่บนเครื่อง server แล้ว
```

### Dockerfile Features

- Multi-stage build (smaller image)
- Uses `bun:1-alpine` for minimal size
- Production optimized

---

## ⚙️ Configuration Files

| File                 | Purpose                                 |
| -------------------- | --------------------------------------- |
| `tsconfig.json`      | TypeScript config with path alias `@/*` |
| `drizzle.config.ts`  | Drizzle ORM config                      |
| `eslint.config.mjs`  | ESLint flat config                      |
| `.prettierrc`        | Prettier formatting rules               |
| `docker-compose.yml` | Docker services                         |
| `Dockerfile`         | Production container                    |

---

## 🔐 Security Features

- **Helmet** - HTTP security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Zod Validation** - Input validation on all endpoints
- **Compression** - Gzip response compression
- **No Stack Trace Leak** - Stack trace ไม่ถูกส่งไป client (ป้องกัน path disclosure)

---

## 📝 Environment Variables

| Variable       | Required | Default     | Description                  |
| -------------- | -------- | ----------- | ---------------------------- |
| `NODE_ENV`     | No       | development | Environment mode             |
| `PORT`         | No       | 3000        | Server port                  |
| `DATABASE_URL` | **Yes**  | -           | PostgreSQL connection string |
| `LOG_LEVEL`    | No       | info        | Pino log level               |

---

## 🏗️ Architecture

```
Request → Middleware → Route → Controller → Service → Database
                                    ↓
                              Zod Validation
                                    ↓
                              Error Handler → Response
```

### Layer Responsibilities

- **Routes** - Define endpoints, connect to controllers
- **Controllers** - Handle HTTP, validate input, call services
- **Services** - Business logic, database operations
- **Middlewares** - Cross-cutting concerns (auth, logging, errors)
- **Schemas** - Validation rules with Zod

---

## 🤝 Git Hooks (Husky + lint-staged)

Pre-commit จะรัน:

1. `eslint --fix` - Fix linting issues
2. `prettier --write` - Format code
3. `bun test --bail` - Run tests (stop on first fail)

---

## 📚 Tech Stack

| Category      | Technology                  |
| ------------- | --------------------------- |
| Runtime       | Bun 1.x                     |
| Framework     | Express 5.x                 |
| Language      | TypeScript 5.x              |
| Database      | PostgreSQL 16               |
| ORM           | Drizzle ORM                 |
| Validation    | Zod 4.x                     |
| Documentation | Swagger UI + zod-to-openapi |
| Logging       | Pino                        |
| Testing       | Bun Test + Supertest        |
| Linting       | ESLint 9 + Prettier         |

---

## 📄 License

MIT
