# 📋 Arquitectura, Componentes y Funciones — Malón Horarios

Guía técnica y funcional completa del sistema de gestión de horarios, coberturas, guardias y cambios de turnos para **Malón en Movimiento**.

---

## 📑 Tabla de Contenidos
1. [Arquitectura General y Flujo de Datos](#1-arquitectura-general-y-flujo-de-datos)
2. [Hooks](#2-hooks)
3. [Componentes](#3-componentes)
   - [Layout y Navegación](#layout-y-navegación)
   - [Pantallas Principales](#pantallas-principales)
   - [Modales Operativos y Administrativos](#modales-operativos-y-administrativos)
4. [Módulos de Lógica y Funciones de Negocio](#4-módulos-de-lógica-y-funciones-de-negocio)
   - [Gestión de Estado (AppContext)](#gestión-de-estado-appcontext)
   - [Cálculo de Horas y Auditoría (hoursAudit)](#cálculo-de-horas-y-auditoría-hoursaudit)
   - [Rotación de Guardias de Sábado (guardRotation)](#rotación-de-guardias-de-sábado-guardrotation)
   - [Sistema de Notificaciones (notifications)](#sistema-de-notificaciones-notifications)
5. [Estructura de Datos y Modelos (TypeScript)](#5-estructura-de-datos-y-modelos-typescript)

---

## 1. Arquitectura General y Flujo de Datos

La aplicación es una **Progressive Web App (PWA)** construida con **React**, **TypeScript**, **Tailwind CSS** y **Vite**. Está optimizada bajo una filosofía *Mobile-First*, pensada para su uso ágil por parte de los coaches desde sus teléfonos personales o tablets del gimnasio.

```
┌────────────────────────────────────────────────────────┐
│                        App.tsx                         │
│   ┌────────────────────────────────────────────────┐   │
│   │                   Header.tsx                   │   │
│   │   [Identidad] [Notificaciones] [Coach] [Jefe]  │   │
│   └────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────┐   │
│   │               Pantalla Activa                  │   │
│   │   (MiGrilla.tsx | General.tsx | Cambios.tsx)   │   │
│   └────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────┐   │
│   │                 Navigation.tsx                 │   │
│   └────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────┐   │
│   │                Modales Globales                │   │
│   └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
                           │
                 useApp() (AppContext)
                           │
      ┌────────────────────┴────────────────────┐
      ▼                                         ▼
LocalStorage (Persistencia Local)      Supabase (Opcional en tiempo real)
```

---

## 2. Hooks

### • `useApp()`
- **Archivo:** `src/context/AppContext.tsx`
- **Descripción:** Hook de acceso global al estado de la aplicación.
- **Responsabilidad:** Permite a cualquier componente leer y actualizar la lista de coaches, turnos, guardias de sábados, feriados, solicitudes de cambios y notificaciones sin requerir prop-drilling.

### • Hooks Estándar de React Empleados
- **`useState`:** Controla estados locales de interfaz (filtros de solapas, selección de horas en formularios, modales abiertos/cerrados, etc.) y estados globales persistentes en `AppContext`.
- **`useEffect`:**
  - Sincroniza en tiempo real los cambios del estado con `localStorage`.
  - Escucha eventos en tiempo real con Supabase mediante WebSockets (si está configurado).
  - Ejecuta chequeos automáticos de recordatorios (ej. detección de guardias de sábado asignadas o turnos de feriados en los próximos días).
- **`useContext`:** Motor de consumo de `AppContext` dentro de `useApp()`.

---

## 3. Componentes

### Layout y Navegación

| Componente | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| **`App`** | `src/App.tsx` | Envoltorio raíz. Configura el `AppProvider`, estructura el contenedor móvil y monta el encabezado, navegación y modales. |
| **`Header`** | `src/components/Header.tsx` | Barra superior fija. Aloja el logo de Malón, el botón de campana con contador de avisos no leídos, el selector de coach activo y el botón de desbloqueo/bloqueo de **PIN JEFE** (exclusivo para roles `admin` y `coach_admin`). |
| **`Navigation`** | `src/components/Navigation.tsx` | Barra inferior fija de navegación entre solapas (*Mi Grilla*, *General*, *Cambios*). Incluye un contador numérico de cambios disponibles. |
| **`InstallPrompt`** | `src/components/InstallPrompt.tsx` | Banner emergente que invita a instalar la PWA en la pantalla de inicio del celular o escritorio. |

---

### Pantallas Principales

| Pantalla | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| **`MiGrilla`** | `src/components/screens/MiGrilla.tsx` | **Vista personal del coach activo.**<br>• Muestra sus turnos semanales fijos (07:00 a 21:00 hs) y resalta si tiene compañero en doble cobertura.<br>• Destaca su próxima guardia de sábado asignada (11:00 a 14:00 hs).<br>• Lista feriados donde tiene turno asignado.<br>• Permite pedir reemplazo directamente desde su tarjeta de turno con un solo clic. |
| **`General`** | `src/components/screens/General.tsx` | **Grilla operativa completa del gimnasio.**<br>• Selector de días de la semana y solapa especial de Feriados.<br>• Muestra bloques con diseño unificado (cobertura simple o doble).<br>• En **Modo Jefe**, permite editar horarios, pasar turnos de simple a doble, cambiar los coaches asignados y agregar feriados. |
| **`Cambios`** | `src/components/screens/Cambios.tsx` | **Bolsa comunitaria de reemplazos.**<br>• Solapas: *Disponibles*, *Mis Pedidos*, *En Proceso / Historial*.<br>• Permite a los compañeros tomar turnos libres.<br>• **Flujo de compensación:** Al confirmar, el solicitante elige si compensa: **🤝 Devolver con trabajo** (delta 0hs en liquidación) o **💰 Pagar horas** (transferencia de horas computadas). |

---

### Modales Operativos y Administrativos

| Modal | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| **`CoachPickerModal`** | `src/components/modals/CoachPickerModal.tsx` | Pantalla *"¿Quién sos?"* para seleccionar qué coach está usando el sistema. |
| **`AdminPinModal`** | `src/components/modals/AdminPinModal.tsx` | Teclado numérico táctil para ingresar el PIN de administración y desbloquear funciones de Jefe. |
| **`CreateShiftChangeModal`** | `src/components/modals/CreateShiftChangeModal.tsx` | Formulario de solicitud de cambio. Restringe la selección **exclusivamente a las horas que el coach tiene asignadas**, en formato 24hs (07:00 a 21:00 hs). |
| **`EditShiftModal`** | `src/components/modals/EditShiftModal.tsx` | Editor administrativo de bloques de cobertura (conmutador simple/doble, asignación de coaches 1 y 2, selectores 24hs y notas). |
| **`EditGuardModal`** | `src/components/modals/EditGuardModal.tsx` | Permite al Jefe reasignar o cambiar el coach de una guardia de sábado. |
| **`ManageHolidayModal`** | `src/components/modals/ManageHolidayModal.tsx` | Gestión de días feriados: selección individual de horas operativas mediante checkboxes interactivos y asignación obligatoria de doble cobertura. |
| **`MonthlyAuditModal`** | `src/components/modals/MonthlyAuditModal.tsx` | Auditoría mensual para el Jefe. Desglosa horas regulares, sábados, feriados y reemplazos computados con botón de copiado rápido para WhatsApp o planilla de sueldos. |
| **`NotificationsModal`** | `src/components/modals/NotificationsModal.tsx` | Centro de Notificaciones In-App y Push. Filtra por avisos pertinentes al coach, permite activar notificaciones en el celular y navegar al turno relacionado. |

---

## 4. Módulos de Lógica y Funciones de Negocio

### Gestión de Estado (`src/context/AppContext.tsx`)

- **`setCurrentCoach(coach)`:** Cambia el perfil activo y bloquea el modo Jefe si el nuevo perfil carece de privilegios administrativos.
- **`verifyAdminPin(pin)`:** Verifica el PIN de Jefe (`1988` o `1234`) y habilita herramientas de gestión.
- **`lockAdmin()`:** Cierra y bloquea la sesión administrativa.
- **`createShiftChange(data)`:** Publica un nuevo pedido de cambio en estado `open` y genera una notificación al staff.
- **`claimShiftChange(requestId)`:** Marca el cambio como tomado (`claimed`) por el coach activo y notifica al solicitante.
- **`confirmShiftChange(requestId, compensationType)`:** Confirma el reemplazo (`confirmed`), registra si se devuelve con trabajo (`work`) o se pagan las horas (`pay`), y notifica al coach que cubrió el turno.
- **`cancelShiftChange(requestId)`:** Cancela la solicitud publicada.
- **`saveShiftBlock(data)` / `deleteShiftBlock(ids)`:** Guarda modificaciones en los bloques de la grilla general.
- **`addHoliday(data)` / `updateHoliday(data)` / `deleteHoliday(id)`:** Gestiona feriados y notifica a los coaches asignados.
- **`addNotification(data)`:** Registra un nuevo aviso en el historial y envía una notificación Web Push del navegador si está autorizado.
- **`markNotificationAsRead(id)` / `markAllNotificationsAsRead()` / `clearNotifications()`:** Control de lectura y limpieza de avisos.

---

### Cálculo de Horas y Auditoría (`src/lib/hoursAudit.ts`)

- **`calculateDurationHours(start, end)`:** Calcula la diferencia exacta en horas en formato 24hs (`07:00` a `09:30` = `2.5 hs`).
- **`getAvailableEndHours(startTime)`:** Devuelve horas de fin válidas estrictamente posteriores al inicio.
- **`getWeekdayOccurrencesInMonth(year, month)`:** Calcula cuántas veces se repite cada día de la semana (Lunes a Sábado) en un mes calendario dado.
- **`calculateMonthlyAudit(year, month, ...)`:**
  1. Multiplica las horas semanales del coach por las repeticiones del día en el mes.
  2. Descuenta feriados laborables donde no se dictó el turno regular.
  3. Suma las guardias de sábados efectivamente asignadas.
  4. Suma las horas trabajadas en feriados en doble cobertura.
  5. Aplica la compensación de cambios:
     - Si es `pay`: suma horas a quien cubrió y descuenta al solicitante.
     - Si es `work`: aplica `delta 0` (no modifica liquidación porque se compensa entre ellos).

---

### Rotación de Guardias de Sábado (`src/lib/guardRotation.ts`)

- **`getMonthlyGuards(year, month, guards)`:** Filtra las guardias de sábados correspondientes al mes seleccionado.
- **`getNextCoachForSaturday(lastCoachId, staff)`:** Determina qué coach continúa en la rotación equitativa de los sábados de 11:00 a 14:00 hs.

---

### Sistema de Notificaciones (`src/lib/notifications.ts`)

- **`isPushSupported()`:** Verifica compatibilidad del navegador con la API de Notificaciones y Service Worker.
- **`getPushPermission()`:** Consulta el estado actual de permisos (`granted`, `denied`, `default`).
- **`requestPushPermission()`:** Solicita autorización al usuario para mostrar alertas en el sistema operativo.
- **`sendBrowserNotification(title, options)`:** Envía notificaciones locales/push visibles en el teléfono o escritorio mediante el Service Worker de la PWA.

---

## 5. Estructura de Datos y Modelos (TypeScript)

Definidos en `src/types/index.ts`:

```typescript
// Roles del staff
export type Role = 'admin' | 'coach_admin' | 'coach';

// Miembro del equipo
export interface StaffMember {
  id: string;
  name: string;
  role: Role;
  initials: string;
  phone?: string;
}

// Turno regular en grilla
export interface Shift {
  id: string;
  day_of_week: number; // 1: Lun, 2: Mar, ..., 6: Sáb
  start_time: string;  // "07:00"
  end_time: string;    // "21:00"
  duration_hours: number;
  franja: 'manana' | 'tarde' | 'noche' | 'sabado';
  coach_id: string;
  coach_name: string;
  is_double_coverage: boolean;
  partner_name?: string;
  notes?: string;
}

// Guardia de Sábado
export interface SaturdayGuard {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // "11:00"
  end_time: string;   // "14:00"
  coach_id: string;
  coach_name: string;
  status: 'scheduled' | 'completed' | 'replaced';
  replacement_coach_name?: string;
}

// Modalidad de compensación de cambio
export type ShiftCompensationType = 'work' | 'pay';

// Solicitud de cambio de turno
export interface ShiftChangeRequest {
  id: string;
  created_at: string;
  requester_id: string;
  requester_name: string;
  target_date: string;
  day_name: string;
  start_time: string;
  end_time: string;
  type: 'single_hour' | 'multiple_hours' | 'full_shift';
  franja: 'manana' | 'tarde' | 'noche' | 'sabado';
  reason: string;
  status: 'open' | 'claimed' | 'confirmed' | 'cancelled';
  claimed_by_id?: string;
  claimed_by_name?: string;
  claimed_at?: string;
  confirmed_at?: string;
  compensation_type?: ShiftCompensationType;
}

// Feriado con doble cobertura
export interface HolidaySchedule {
  id: string;
  date: string;
  name: string;
  is_closed: boolean;
  selected_hours: string[]; // ["09:00", "10:00", "11:00", "12:00"]
  time_display: string;    // "09:00 a 13:00 hs"
  total_hours: number;
  coach_id_1: string;
  coach_name_1: string;
  coach_id_2: string;
  coach_name_2: string;
  notes?: string;
}

// Notificación de la App
export interface AppNotification {
  id: string;
  type: 'shift_change_request' | 'shift_change_claimed' | 'saturday_guard_reminder' | 'holiday_assignment' | 'holiday_reminder';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  target_coach_id?: string;
  link_tab?: 'mi-grilla' | 'general' | 'cambios';
}
```
