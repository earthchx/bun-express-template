# ==========================================
# Stage 1: Builder (ติดตั้ง Dependencies และ Build)
# ==========================================
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ENV NODE_ENV=production
RUN bun run build

# ==========================================
# Stage 2: Runner
# ==========================================
FROM oven/bun:1-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]