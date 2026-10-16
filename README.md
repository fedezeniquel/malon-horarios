# 🏋️ Malón - Horarios & Staff

Sistema web **Mobile-First / PWA** diseñado para la gestión de turnos semanales, guardias rotativas de sábados, asignación de feriados y bolsa comunitaria de reemplazos para los coaches del gimnasio **Malón**.

---

## 📱 ¿Qué podés hacer con la app?

### 1. 👤 Perfil personal en tu celular
- **Primer ingreso guiado:** Al abrir la app por primera vez, cada coach selecciona su nombre y activa la casilla *"Recordar mi perfil en este dispositivo"*.
- **Acceso directo:** La app recuerda al coach para que entre directamente a sus turnos cada vez que abra la aplicación desde su teléfono.
- **Desvincular o cambiar:** Desde la barra superior podés cambiar de perfil o desvincular el celular en cualquier momento.

### 2. ⏰ División del día en 4 turnos operativos
El día laboral del gimnasio se organiza de forma clara en cuatro bloques:
- **Turno Mañana:** 07:00 a 13:00 hs
- **Turno Siesta:** 13:00 a 16:00 hs
- **Turno Tarde:** 16:00 a 19:00 hs
- **Turno Noche:** 19:00 a 21:00 hs

### 3. 📅 Mi Grilla y Grilla General
- **Mi Grilla:** Vista individual donde cada coach ve sus turnos fijos de la semana, su sábado de guardia asignado en el mes y los feriados que le tocan.
- **Grilla General:** Vista completa del gimnasio organizada por día y franja horaria para saber quién está en sala en todo momento.

### 4. 🔄 Bolsa de Cambios y Reemplazos entre Coaches
Permite a los coaches publicar solicitudes de reemplazo cuando no pueden asistir:
- **Modalidades flexibles:**
  - **Turno Completo**
  - **1 Hora Suelta**
  - **Horas Múltiples:** Permite pedir rangos continuos incluso entre turnos contiguos (por ejemplo, de **18:00 a 20:00 hs** cruzando los turnos Tarde y Noche).
- **Compensación entre compañeros:**
  - **Devolver con horas de trabajo:** Arreglo mano a mano entre coaches (no altera el cómputo mensual).
  - **Pagar las horas:** Se computan y transfieren las horas trabajadas al coach que cubrió el turno.

### 5. 🚩 Feriados con Duplas de Coaches
- Configuración de feriados con horarios especiales.
- Permite asignar **distintas duplas de coaches** para turnos no consecutivos (por ejemplo: Dupla A de 08:00 a 09:00, Dupla B de 13:00 a 14:00 y Dupla C de 18:00 a 19:00).

### 6. 🔒 Modo Jefe (Acceso Administrativo)
- Protegido por **PIN de seguridad** (exclusivo para perfiles con rol Admin / Coach Admin).
- Permite crear, modificar o eliminar turnos en la grilla fija, asignar guardias de sábado y auditar las horas mensuales trabajadas por cada coach.

### 7. 📲 Instalable como App (PWA)
- Se puede instalar directamente en la pantalla de inicio de teléfonos **Android** y **iPhone/iOS** como una aplicación nativa, rápida y sin barras del navegador.

---

## 🛠️ Tecnologías utilizadas

- **Frontend:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Empaquetador & Servidor:** [Vite](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Iconos:** [Lucide React](https://lucide.dev/)
- **PWA:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- **Backend / Realtime (opcional):** [Supabase](https://supabase.com/)

---

## 🚀 Instalación y uso local

### Requisitos previos
- Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).

### Pasos

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abrí tu navegador en [http://localhost:5173/](http://localhost:5173/).

3. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 🔐 Configuración del PIN de Administración

Por defecto el PIN maestro de administración es `1234` (también admite `1988`).

Si querés personalizarlo, podés definirlo en un archivo `.env`:
```env
VITE_ADMIN_MASTER_PIN=tu_pin_personalizado
```

---

## 👥 Equipo y Staff de Coaches

- **Fede** (FZ) — *Admin / Jefe*
- **Nacho** (NB) — *Coach Admin*
- **Santi** (SS) — *Coach*
- **Lucas** (LL) — *Coach*
- **Agus** (AG) — *Coach*
- **Cami** (CP) — *Coach*
- **Flor** (FF) — *Coach*
