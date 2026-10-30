FROM node:24-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @ogre/web build

FROM node:24-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
COPY --from=build /app /app
ENV NODE_ENV=production \
    DATA_DIR=/data \
    WEB_DIST=/app/apps/web/dist \
    PORT=3000
VOLUME /data
EXPOSE 3000
WORKDIR /app/apps/server
CMD ["node_modules/.bin/tsx", "src/main.ts"]
