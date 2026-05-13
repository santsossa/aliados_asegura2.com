FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Instala express para el servidor estático
RUN echo '{"dependencies":{"express":"^4"}}' > package.json && npm install --omit=dev

COPY server.js .
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "server.js"]
