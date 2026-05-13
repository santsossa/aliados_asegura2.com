FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Recibe VITE_API_URL como build arg (Railway la inyecta desde Variables)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Instala express para el servidor estático
RUN echo '{"dependencies":{"express":"^4"}}' > package.json && npm install --omit=dev

COPY server.js .
COPY --from=builder /app/dist ./dist

CMD ["node", "server.js"]
