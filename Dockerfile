FROM node:20-alpine AS base

FROM base AS builder

RUN apk add --no-cache gcompat
WORKDIR /app

COPY package*.json tsconfig.json ./
COPY src/ ./src
COPY drizzle/ ./drizzle
COPY bin/ ./bin

RUN npm ci && \
  npm run build && \
  npm prune --omit=dev

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 jdna


COPY --from=builder --chown=jdna:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=jdna:nodejs /app/bin ./bin
COPY --from=builder --chown=jdna:nodejs /app/dist ./dist
COPY --from=builder --chown=jdna:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=jdna:nodejs /app/package.json ./package.json

USER jdna
ENV APP_PORT=3000

EXPOSE ${APP_PORT}

CMD ["/app/bin/run.js", "serve"]
