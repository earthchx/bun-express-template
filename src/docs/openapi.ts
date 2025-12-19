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

// 1. ยังต้องสั่งบรรทัดนี้อยู่นะครับ เพื่อเปิดใช้ฟีเจอร์ .openapi()
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// ---------------------------------------------------------
// 2. Helper Schemas (แก้ตรงนี้: ใช้ .openapi({ example: ... }) แทน)
// ---------------------------------------------------------

const createSuccessResponse = (dataSchema: z.ZodTypeAny) => {
  return z.object({
    // ❌ แบบเก่า: .example(true) -> TypeScript บางทีหาไม่เจอ
    // ✅ แบบใหม่: .openapi({ example: true }) -> ชัวร์กว่า
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

// ---------------------------------------------------------
// 3. Register Schemas & Paths (ส่วนที่เหลือเหมือนเดิม)
// ---------------------------------------------------------
registry.register('Item', selectItemSchema);
registry.register('NewItem', insertItemSchema);
registry.register('UpdateItem', updateItemSchema);

registry.registerPath({
  method: 'get',
  path: '/api/v1/items',
  tags: ['Items'],
  summary: 'Get all items (Paginated)',
  request: {
    query: paginationSchema,
  },
  responses: {
    200: {
      description: 'List of items with pagination info',
      content: {
        'application/json': {
          schema: createPaginatedResponse(selectItemSchema),
        },
      },
    },
    400: {
      description: 'Validation Error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/items',
  tags: ['Items'],
  summary: 'Create a new item',
  request: {
    body: {
      content: {
        'application/json': {
          schema: insertItemSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Item created successfully',
      content: {
        'application/json': {
          schema: createSuccessResponse(selectItemSchema),
        },
      },
    },
    400: { description: 'Validation Error' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/items/{id}',
  tags: ['Items'],
  summary: 'Get item by ID',
  request: {
    params: paramIdSchema,
  },
  responses: {
    200: {
      description: 'Item details',
      content: {
        'application/json': {
          schema: createSuccessResponse(selectItemSchema),
        },
      },
    },
    404: { description: 'Item not found' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/items/{id}',
  tags: ['Items'],
  summary: 'Update an item',
  request: {
    params: paramIdSchema,
    body: {
      content: {
        'application/json': {
          schema: updateItemSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Item updated successfully',
      content: {
        'application/json': {
          schema: createSuccessResponse(selectItemSchema),
        },
      },
    },
    404: { description: 'Item not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/items/{id}',
  tags: ['Items'],
  summary: 'Delete an item',
  request: {
    params: paramIdSchema,
  },
  responses: {
    200: {
      description: 'Item deleted successfully',
      content: {
        'application/json': {
          schema: createSuccessResponse(selectItemSchema),
        },
      },
    },
    404: { description: 'Item not found' },
  },
});

export function generateOpenAPI() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'My Express API',
      version: '1.0.0',
      description: 'Production Grade API with Pagination, Filtering & Sorting',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server',
      },
    ],
  });
}
