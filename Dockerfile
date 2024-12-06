FROM node:20-alpine AS base

FROM base AS builder

RUN apk add --no-cache gcompat
WORKDIR /app

COPY package*.json tsconfig.json ./
COPY src/ ./src

RUN npm ci && \
    npm run build && \
    npm prune --production

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 jdna


COPY --from=builder --chown=jdna:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=jdna:nodejs /app/bin ./bin
COPY --from=builder --chown=jdna:nodejs /app/dist ./dist
COPY --from=builder --chown=jdna:nodejs /app/package.json ./package.json

USER jdna
ENV APP_PORT=3000

EXPOSE ${APP_PORT}

CMD ["/app/bin/run.js", "serve"]
