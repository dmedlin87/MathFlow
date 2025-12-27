# Stage 1: Build the backend and shared code
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:server

# Stage 2: Production Runtime
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/dist ./dist

EXPOSE 3002
CMD ["node", "server/dist/index.js"]
