# 1. Сборка статики
FROM node:24.12-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Моки MSW можно включить на деплое, пока нет бэка: docker compose build --build-arg VITE_USE_MOCKS=true web
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_USE_MOCKS=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_USE_MOCKS=$VITE_USE_MOCKS

RUN npm run build

# 2. Caddy раздаёт dist и проксирует API. Caddyfile монтируется из корня репозитория
FROM caddy:2.11.4-alpine

COPY --from=build /app/dist /srv
