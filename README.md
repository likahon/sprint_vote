# 🃏 Sprint Vote - Planning Poker

Una aplicación web de Planning Poker para estimación de historias de usuario en sprints ágiles. Construida con React, Node.js, Socket.io y MongoDB.

## 🚀 Características

- **Votación en tiempo real** con Socket.io
- **Interfaz intuitiva** con React y TypeScript
- **Persistencia de datos** con MongoDB
- **Roles de usuario** (Administrador y Participante)
- **Revelación de votos** controlada por el administrador
- **Reinicio de sesiones** para nuevas estimaciones

## 🛠️ Tecnologías

### Frontend (Cliente)
- React 18
- TypeScript
- Vite
- Socket.io Client
- CSS Modules

### Backend (Servidor)
- Node.js
- Express
- Socket.io
- MongoDB con Mongoose
- TypeScript

## 📋 Prerrequisitos

- Node.js (versión 16 o superior)
- npm (versión 8 o superior)
- MongoDB (local o Atlas)

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd sprint_vote
```

### 2. Instalar dependencias
```bash
# Instalar todas las dependencias (raíz, servidor y cliente)
npm run install:all
```

### 3. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp server/env.example server/.env

# Editar las variables según tu configuración
nano server/.env
```

### 4. Configurar MongoDB
- **Opción A: MongoDB Atlas (Recomendado)**
  - Crear una cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
  - Crear un cluster gratuito
  - Obtener la cadena de conexión
  - Actualizar `MONGODB_URI` en `server/.env`

- **Opción B: MongoDB Local**
  - Instalar MongoDB localmente
  - Usar la cadena de conexión: `mongodb://localhost:27017/sprint-vote`

## 🏃‍♂️ Ejecución

### Desarrollo (Recomendado)
```bash
# Ejecutar servidor y cliente simultáneamente
npm run dev
```

### Desarrollo con base de datos
```bash
# Solo servidor con base de datos
npm run server:dev-db

# Solo cliente
npm run client:dev
```

### Producción
```bash
# Construir para producción
npm run build

# Ejecutar en producción
npm start
```

## 🌐 Acceso a la aplicación

- **Cliente**: http://localhost:3000
- **Servidor**: http://localhost:3001

## 🎮 Cómo usar

1. **Acceder a la aplicación** en http://localhost:3000
2. **Ingresar tu nombre**:
   - Nombre normal: `Juan` (participante)
   - Administrador: `Juan_admin` (administrador)
3. **Votar** seleccionando una carta (1, 3, 5, 8, 13)
4. **Revelar votos** (solo administrador)
5. **Reiniciar** para nueva estimación (solo administrador)

## 📁 Estructura del proyecto

```
sprint_vote/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── hooks/         # Hooks personalizados
│   │   ├── types/         # Tipos TypeScript
│   │   └── ...
│   └── package.json
├── server/                # Backend Node.js
│   ├── src/
│   │   ├── models/        # Modelos MongoDB
│   │   ├── types/         # Tipos TypeScript
│   │   └── index.ts       # Servidor principal
│   └── package.json
├── package.json           # Configuración principal
└── README.md
```

## 🔧 Scripts disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm start` - Ejecutar en producción
- `npm run install:all` - Instalar todas las dependencias
- `npm run clean` - Limpiar node_modules y builds

## 🐛 Solución de problemas

### Error de conexión a MongoDB
- Verificar que la cadena de conexión sea correcta
- Asegurarse de que MongoDB esté ejecutándose
- Verificar la configuración de red en MongoDB Atlas

### Error de Socket.io
- Verificar que el servidor esté ejecutándose en el puerto 3001
- Verificar la configuración de CORS

### Error de compilación TypeScript
- Ejecutar `npm run clean` y `npm run install:all`
- Verificar que todas las dependencias estén instaladas

## 📝 Licencia

MIT License

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📞 Soporte

Si tienes problemas o preguntas, por favor abre un issue en el repositorio.