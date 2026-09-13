# Imagem única para os dois serviços; a variável SERVICE escolhe o modo no entrypoint:
#   SERVICE=studio  -> Remotion Studio atrás do Caddy com Basic Auth (STUDIO_USER, STUDIO_PASSWORD)
#   SERVICE=api     -> API de render em server/index.ts (RENDER_API_KEY, volume em /app/renders)
FROM node:24-bookworm-slim

# Bibliotecas do Chrome Headless Shell (lista oficial do Remotion) e fontes básicas do sistema.
RUN apt-get update && apt-get install -y --no-install-recommends \
  libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 libxkbcommon-dev \
  libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 \
  fonts-liberation ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Caddy faz o Basic Auth e o proxy do Studio.
COPY --from=caddy:2 /usr/bin/caddy /usr/bin/caddy

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY tsconfig.json remotion.config.ts ./
COPY src ./src
COPY public ./public
COPY server ./server

# Chrome Headless Shell dentro da imagem e bundle do projeto para a API.
RUN npx remotion browser ensure
RUN npx remotion bundle

# NODE_ENV fica por conta do entrypoint: production só na API; o Studio precisa do bundle de
# desenvolvimento (React Refresh) e quebra com NODE_ENV=production.
COPY docker ./docker
ENV PORT=3000
ENV RENDERS_DIR=/app/renders
ENV REMOTION_SERVE_URL=/app/build
RUN mkdir -p /app/renders

EXPOSE 3000
CMD ["sh", "/app/docker/entrypoint.sh"]
