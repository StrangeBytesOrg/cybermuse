FROM oven/bun AS build

COPY ./src /app/src
COPY ./package.json /app/package.json
COPY ./vite.config.ts /app/vite.config.ts
COPY ./bun.lock /app/bun.lock
WORKDIR /app

RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile
RUN bun run build

FROM caddy AS serve
COPY ./Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /app/dist
