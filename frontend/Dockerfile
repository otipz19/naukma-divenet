# syntax=docker/dockerfile:1
# Web image for compose.yaml: the SPA build served by nginx, which proxies the API.
# Build context: the repository root (the lockfile and design/system/tokens.css live there).

FROM node:24-alpine AS build
RUN npm install -g pnpm@12.15.0
WORKDIR /src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --filter @divenet/frontend
COPY design/system/ design/system/
COPY frontend/ frontend/
RUN pnpm --filter @divenet/frontend build

FROM nginx:1.29-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/frontend/dist/ /usr/share/nginx/html/
