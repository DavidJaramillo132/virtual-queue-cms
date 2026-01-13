FROM node:18-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Crear directorio para persistencia de BD
RUN mkdir -p /app/data

# Copiar dependencias primero (mejor cache de Docker)
COPY package.json package-lock.json* ./
RUN npm install

# Copiar codigo fuente y tsconfig
COPY tsconfig.json ./
COPY src ./src

# Compilar TypeScript
RUN npm run build

# Eliminar devDependencies para reducir tamaño de imagen
RUN npm prune --production

# Variables de entorno por defecto
ENV PORT=4000
ENV DB_PATH=/app/data/token.db
ENV ACCESS_EXPIRES=30m
ENV REFRESH_EXPIRES_DAYS=30

EXPOSE 4000

# Healthcheck para verificar que el servicio esta corriendo
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/ || exit 1

CMD ["npm","start"]
