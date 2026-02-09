# ComuniApp

ComuniApp es una aplicación React que se integra con un proyecto Firebase existente (Auth + Firestore).

Requisitos previos:

- Node 18+ / npm
- Un proyecto Firebase con Authentication (email/password) y Firestore (ubicación: nam5)

Configurar variables de entorno (archivo `.env.local` o variables de entorno del entorno):

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Instalar y ejecutar:

```bash
npm install
npm run dev
```

Notas:

- La app usa las colecciones existentes `/users` y `/communities`.
- No cambia estructuras existentes; las reglas Firestore incluidas asumen los campos descritos.
