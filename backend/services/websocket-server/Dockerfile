# Build stage
FROM golang:1.25.4-alpine AS builder

WORKDIR /app

# Copiar archivos de módulos
COPY go.mod go.sum ./
RUN go mod download

# Copiar el código fuente
COPY . .

# Compilar la aplicación
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o websocket-server ./cmd/main.go

# Production stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copiar el binario compilado
COPY --from=builder /app/websocket-server .

# Copiar el archivo .env
COPY --from=builder /app/.env .env

# Exponer el puerto
EXPOSE 8080

# Comando para ejecutar la aplicación
CMD ["./websocket-server"]
