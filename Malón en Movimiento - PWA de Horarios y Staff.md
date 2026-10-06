# Malón en Movimiento - PWA de Horarios y Staff

## 1. Stack Tecnológico
- Frontend: Vite + React (TypeScript) + Tailwind CSS + Lucide Icons + VitePWA.
- Backend/Base de Datos: Supabase (PostgreSQL) con Realtime activado.
- Sin login individual: Selección local en el teléfono guardada en localStorage.
- Acceso de administración: Protegido por PIN numérico maestro.

## 2. Identidad Visual y Paleta (Malón)
- malon-bg: #0B0B0C (Fondo general dark mode)
- malon-card: #161619 (Tarjetas y módulos)
- malon-surface: #222227 (Bordes y elementos inactivos)
- malon-red: #B91C1C (Color principal, alertas, acciones destacadas)
- malon-sand: #C99E70 (Acentos, turnos dobles, botones secundarios)
- malon-white: #FFFFFF (Textos principales)
- malon-muted: #8E8E93 (Textos secundarios)

## 3. Jerarquía y Roles de Staff
- admin: Patri (Control total)
- coach_admin: Fede, Vicky (Turnos propios + acceso administrativo por PIN)
- coach: Cristian, Gala, Javi, Ema, Lucas, Gise, Sil (Operación estándar)

## 4. Estructura de Turnos y Franjas
- Turno Mañana (07:00 a 13:00): Doble cobertura 07-09 hs (Patri + Cristian), individual 09-13 hs (Fede).
- Turno Tarde (13:00 a 18:00): Bloques individuales (Sil, Gala, Gise, Javi, Vicky).
- Turno Noche (18:00 a 21:00): Doble cobertura simultánea (Javi, Ema, Lucas).
- Guardias de Sábado (11:00 a 14:00): Turnos rotativos definidos en guardias_sabado.

## 5. Pantallas de la PWA (Mobile-First)
1. "Mi Grilla": Vista personal del profesor, carga semanal acumulada, guardias y solicitud de reemplazo.
2. "General": Cronograma de sala dividido por Mañana, Tarde y Noche con vista de turnos dobles y botón PIN JEFE.
3. "Cambios": Bolsa comunitaria de cambios. Soporta selección de 1 hora suelta, horas múltiples o turno completo, con confirmación entre partes (peer-to-peer).