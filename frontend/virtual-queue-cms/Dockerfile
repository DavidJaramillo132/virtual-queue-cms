# Imagen base
FROM node:22

# Carpeta de trabajo
WORKDIR /app

# Copiar dependencias
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar el resto del código
COPY . .

# Compilar si es necesario (React, Angular)
RUN npm run build

# Exponer puerto (por ejemplo 3000)
EXPOSE 3000

# Comando para iniciar la app
CMD ["ng", "serve"]
