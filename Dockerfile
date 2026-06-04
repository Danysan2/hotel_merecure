FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.js ./prisma.config.js

EXPOSE 3000

CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && node server/index.js"]
