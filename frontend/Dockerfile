FROM node:24.12.0-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_USE_MOCKS=false
ARG VITE_DEV_USER_ID=1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_USE_MOCKS=$VITE_USE_MOCKS VITE_DEV_USER_ID=$VITE_DEV_USER_ID
RUN npm run build && if [ "$VITE_USE_MOCKS" != "true" ]; then rm -f dist/mockServiceWorker.js; fi

FROM caddy:2.11.4-alpine AS runtime
RUN addgroup -g 10001 app && adduser -D -H -u 10001 -G app app \
    && chown -R app:app /data /config
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
USER 10001:10001
EXPOSE 8080 8443
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=6 \
    CMD wget -q -O /dev/null http://127.0.0.1:8081/healthz || exit 1
