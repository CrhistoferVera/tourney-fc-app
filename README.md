# Tourney FC — App Móvil (Frontend)

Aplicación móvil para la **gestión de torneos de fútbol**: creación de torneos (liga y copa),
inscripción de equipos, fixture, tabla de posiciones, cuadro de eliminación (bracket),
seguimiento de partidos en vivo, estadísticas y gestión de equipos y jugadores.

Esta es la parte **frontend** del proyecto. Necesita el backend
(`tourney-fc-backend`) en ejecución para funcionar.

---

## 🛠️ Tecnologías utilizadas

- **React Native** `0.81` con **Expo** `~54`
- **Expo Router** (navegación basada en archivos)
- **TypeScript**
- **NativeWind / TailwindCSS** (estilos)
- **Zustand** (manejo de estado global)
- **React Native Maps** (selección de ubicación de canchas)
- **Expo Image Picker** (subida de escudos de equipos)

---

## ✅ Requisitos previos

- **Node.js** 18 o superior
- **npm** (incluido con Node.js)
- **Expo Go** instalado en tu teléfono (Android/iOS), o un emulador
  de Android Studio / simulador de iOS
- El **backend** (`tourney-fc-backend`) corriendo y accesible

---

## 🚀 Instalación y ejecución

1. **Instalar las dependencias**

   ```bash
   npm install
   ```

2. **Configurar la URL del backend**

   Crea un archivo `.env` en la raíz de este proyecto (puedes copiar
   `.env.example`) y define la dirección donde corre el backend:

   ```bash
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
   ```

   > ⚠️ Si pruebas en un teléfono físico, usa la **IP local de tu PC**
   > (no `localhost`), porque `localhost` apuntaría al propio teléfono.
   > Puedes ver tu IP con `ipconfig` (Windows) o `ifconfig` (Mac/Linux).

3. **Iniciar la aplicación**

   ```bash
   npm start
   ```

   Luego escanea el código QR con la app **Expo Go**, o presiona:
   - `a` → abrir en emulador de Android
   - `i` → abrir en simulador de iOS

---

## 📜 Scripts disponibles

| Comando            | Descripción                              |
| ------------------ | ---------------------------------------- |
| `npm start`        | Inicia el servidor de desarrollo de Expo |
| `npm run android`  | Abre la app en un emulador Android        |
| `npm run ios`      | Abre la app en un simulador iOS           |
| `npm run web`      | Ejecuta la app en el navegador            |
| `npm run lint`     | Analiza el código con ESLint              |
| `npm run format`   | Formatea el código con Prettier           |

---

## 📁 Estructura del proyecto

```
tourney-fc-app/
├── app/              # Pantallas y navegación (Expo Router, file-based routing)
│   ├── (auth)/       # Login, registro, recuperación de contraseña
│   ├── (app)/        # Pantallas principales (torneos, equipos, partidos)
│   └── (profile)/    # Perfil del usuario
├── components/       # Componentes reutilizables (UI)
├── services/         # Llamadas a la API del backend
├── store/            # Estado global (Zustand)
├── hooks/            # Hooks personalizados
├── utils/            # Funciones auxiliares
├── constants/        # Constantes y temas
├── assets/           # Imágenes, fuentes e íconos
├── app.json          # Configuración del proyecto Expo
├── tailwind.config.js
├── tsconfig.json
└── package.json      # Dependencias y scripts
```

---

## 📝 Notas

- Las **dependencias** no se incluyen en la entrega: están especificadas en
  `package.json` y se instalan con `npm install`.
- El escudo de cada equipo puede ser una **imagen personalizada** (subida a la
  galería) o un **escudo predeterminado**; ambos se muestran de forma consistente
  en el fixture, el bracket, la tabla y el resto de pantallas mediante el
  componente `components/tournament/ShieldDisplay.tsx`.
