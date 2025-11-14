# Build stage
FROM node:20-bullseye AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y openssl libssl1.1 libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run gen
RUN npm run build
RUN chmod +x ./entrypoint.sh

# Production stage
FROM node:20-alpine

WORKDIR /app

# Alpine needs extra libs for Prisma runtime
RUN apk add --no-cache openssl libstdc++ libc6-compat

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/entrypoint.sh ./

EXPOSE 5000

ENTRYPOINT ["./entrypoint.sh"]
