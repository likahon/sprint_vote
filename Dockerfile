# Dockerfile para Render (opcional, Render puede usar Node.js directamente)
FROM node:18-alpine

WORKDIR /app

# Copiar package.json files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Instalar dependencias
RUN npm run install:all

# Copiar código fuente
COPY . .

# Build la aplicación
RUN npm run build

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["npm", "start"]