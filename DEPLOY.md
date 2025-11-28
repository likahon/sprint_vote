# Deploy en Render

## Pasos para hacer deploy en Render:

### 1. Preparar el repositorio
- Asegúrate de que todos los cambios estén committeados y pusheados a GitHub

### 2. Crear cuenta en Render
- Ve a [render.com](https://render.com) y crea una cuenta
- Conecta tu cuenta de GitHub

### 3. Crear servicio web
1. En el dashboard de Render, haz clic en "New +"
2. Selecciona "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura el servicio:
   - **Name**: `sprint-vote`
   - **Environment**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Node Version**: `18`

### 4. Configurar variables de entorno
En la sección "Environment Variables", agrega:
- `NODE_ENV`: `production`
- `MONGODB_URI`: Tu string de conexión de MongoDB Atlas
- `CORS_ORIGIN`: `https://tu-app-name.onrender.com`
- `SOCKET_CORS_ORIGIN`: `https://tu-app-name.onrender.com`

### 5. Configurar MongoDB Atlas
1. Ve a [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crea un cluster gratuito si no tienes uno
3. Crea un usuario de base de datos
4. Configura las IP permitidas (agrega `0.0.0.0/0` para permitir todas las IPs)
5. Obtén la cadena de conexión y úsala en `MONGODB_URI`

### 6. Deploy
- Haz clic en "Create Web Service"
- Render automáticamente hará el build y deploy
- El proceso puede tomar 5-10 minutos

### 7. Verificar
- Una vez completado, tu app estará disponible en `https://tu-app-name.onrender.com`
- Verifica que la conexión a la base de datos funcione correctamente

## Notas importantes:
- Render puede tardar en "despertar" la aplicación si no se usa por un tiempo (plan gratuito)
- Los logs están disponibles en el dashboard de Render para debugging
- Cualquier push a la rama principal activará un nuevo deploy automáticamente

## Troubleshooting:
- Si hay errores de build, revisa los logs en Render
- Si hay problemas de conexión a MongoDB, verifica las variables de entorno
- Si Socket.io no funciona, verifica las configuraciones de CORS