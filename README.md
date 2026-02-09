# 🏘️ ComuniApp

**Sistema de gestión comunitaria** - Aplicación web para administrar comunidades residenciales con comunicación en tiempo real.

![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-10+-FFCA28?logo=firebase)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)

---

## 📋 Características

### ✅ Funcionalidades Core

| Módulo               | Descripción                                            |
| -------------------- | ------------------------------------------------------ |
| 🔐 **Autenticación** | Login/Registro con Firebase Auth (email/password)      |
| 👥 **Roles**         | Sistema de 3 niveles: SuperAdmin, Admin, Residente     |
| 📢 **Avisos**        | Tablón de anuncios con categorías y prioridades        |
| 🚨 **Alertas**       | Sistema de alertas comunitarias (alta/media)           |
| 📊 **Encuestas**     | Votaciones con visualización en tiempo real            |
| 💬 **Chat**          | Chat comunitario estilo WhatsApp (tiempo real)         |
| 🆘 **Emergencias**   | Botón de pánico + banner global + notificación al chat |
| ⭐ **Freemium**      | Modelo de negocio con funciones premium bloqueadas     |

### 🔒 Funciones Premium (UI mockup)

- Notificaciones push
- Reportes y estadísticas avanzadas
- Historial de emergencias
- Encuestas avanzadas
- Exportar datos (CSV, PDF)
- Soporte prioritario 24/7

---

## 🚀 Instalación

### Requisitos previos

- Node.js 18+
- npm o yarn
- Proyecto Firebase con Authentication y Firestore

### 1. Clonar repositorio

```bash
git clone https://github.com/TU_USUARIO/comuniapp.git
cd comuniapp
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Firebase

Crear archivo `.env.local` en la raíz:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Desplegar reglas de Firestore

```bash
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abrir http://localhost:5173

---

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── AdminRoute.jsx        # Protección rutas admin
│   ├── ResidentRoute.jsx     # Protección rutas residente
│   ├── SuperAdminRoute.jsx   # Protección rutas superadmin
│   ├── Navbar.jsx            # Navegación principal
│   ├── EmergencyButton.jsx   # Botón flotante de emergencia
│   ├── EmergencyBanner.jsx   # Banner de emergencia activa
│   └── PremiumLock.jsx       # Componentes premium bloqueados
├── context/
│   └── AuthContext.jsx       # Estado global de autenticación
├── pages/
│   ├── Login.jsx             # Inicio de sesión
│   ├── Register.jsx          # Registro de usuarios
│   ├── PendingPage.jsx       # Espera de aprobación
│   ├── AdminDashboard.jsx    # Panel administrador
│   ├── ResidentDashboard.jsx # Panel residente
│   ├── SuperAdminDashboard.jsx # Panel super administrador
│   ├── PostsPage.jsx         # Tablón de avisos
│   ├── AlertsPage.jsx        # Gestión de alertas
│   ├── SurveysPage.jsx       # Encuestas y votaciones
│   ├── ChatPage.jsx          # Chat comunitario
│   ├── CommunityPage.jsx     # Gestión de comunidad
│   └── PlanesPage.jsx        # Comparación planes Free/Premium
├── services/
│   └── firebase.js           # Configuración Firebase
├── App.jsx                   # Rutas principales
├── main.jsx                  # Entry point
└── styles.css                # Estilos globales
```

---

## 🗄️ Modelo de Datos (Firestore)

### Colecciones existentes (no modificar estructura)

```
/users/{uid}
├── displayName: string
├── email: string
├── role: "superadmin" | "admin" | "resident" | "pending"
├── communityId: string
├── apartment: string
├── createdAt: timestamp
└── updatedAt: timestamp

/communities/{id}
├── name: string
├── description: string
├── address: string
├── adminId: string (uid del líder)
├── members: array<string> (uids)
├── totalMembers: number
├── isPremium: boolean
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Colecciones nuevas

```
/posts/{id}
├── title: string
├── content: string
├── category: "seguridad" | "mantenimiento" | "eventos" | "general"
├── priority: "normal" | "urgente"
├── communityId: string
├── createdBy: string
└── createdAt: timestamp

/alerts/{id}
├── message: string
├── level: "alta" | "media"
├── communityId: string
└── createdAt: timestamp

/surveys/{id}
├── question: string
├── options: array<string>
├── votes: map<uid, option>
├── active: boolean
├── communityId: string
└── createdAt: timestamp

/chats/{id}
├── communityId: string
└── createdAt: timestamp

/messages/{id}
├── chatId: string
├── senderId: string
├── senderName: string
├── message: string
├── isEmergency: boolean
└── createdAt: timestamp

/emergencies/{id}
├── communityId: string
├── activatedBy: string
├── activatedByName: string
├── active: boolean
├── createdAt: timestamp
├── resolvedAt: timestamp
└── resolvedBy: string
```

---

## 👥 Sistema de Roles

| Rol            | Permisos                                                               |
| -------------- | ---------------------------------------------------------------------- |
| **superadmin** | Gestión global: asignar comunidades, cambiar roles, crear líderes      |
| **admin**      | Líder de comunidad: CRUD avisos/alertas/encuestas, aprobar miembros    |
| **resident**   | Vecino: leer contenido, votar encuestas, usar chat, activar emergencia |
| **pending**    | En espera de aprobación por admin                                      |

---

## 🔒 Seguridad

Las reglas de Firestore están en `firestore.rules` e incluyen:

- Validación de autenticación
- Verificación de membresía a comunidad
- Permisos basados en rol
- Protección de datos sensibles
- Validación de estructura de documentos

---

## 🎨 Tecnologías

- **Frontend:** React 18 + Vite
- **Routing:** React Router v6
- **Estado:** Context API
- **Backend:** Firebase (Auth + Firestore)
- **Estilos:** CSS inline (preparado para Tailwind/MUI)
- **Tiempo real:** Firestore onSnapshot

---

## 📱 Capturas de Pantalla

| Dashboard Admin                                  | Chat                         | Emergencia                     |
| ------------------------------------------------ | ---------------------------- | ------------------------------ |
| Estadísticas, alertas recientes, accesos rápidos | Estilo WhatsApp, tiempo real | Botón flotante + banner global |

---

## 🛠️ Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
npm run lint     # Verificar código
```

---

## 🚀 Despliegue

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Vercel / Netlify

Conectar repositorio y configurar:

- Build command: `npm run build`
- Output directory: `dist`
- Variables de entorno: Agregar todas las `VITE_FIREBASE_*`

---

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m "feat: descripción"`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

Ver [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) para guía detallada de mejoras frontend.

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

Desarrollado como proyecto de gestión comunitaria.

---

**ComuniApp** - Conectando comunidades 🏘️
