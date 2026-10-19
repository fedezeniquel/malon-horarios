-- ==============================================================================
-- MALÓN HORARIOS — ESQUEMA DE BASE DE DATOS Y TIEMPO REAL (EN ESPAÑOL)
-- ==============================================================================
-- Proyecto: rysvimpgwuvyuqheolnd
-- Ejecutá este script en el SQL Editor de tu proyecto en Supabase:
-- https://supabase.com/dashboard/project/rysvimpgwuvyuqheolnd/sql/new
-- ==============================================================================

-- 0. LIMPIEZA DE TABLAS PREVIAS (Para evitar conflictos de tipos y columnas anteriores)
DROP TABLE IF EXISTS public.solicitudes_cambio CASCADE;
DROP TABLE IF EXISTS public.cambios_turno CASCADE;
DROP TABLE IF EXISTS public.turnos CASCADE;
DROP TABLE IF EXISTS public.guardias_sabado CASCADE;
DROP TABLE IF EXISTS public.feriados CASCADE;
DROP TABLE IF EXISTS public.profesores CASCADE;

-- 1. TABLA: TURNOS (Turnos semanales fijos de la grilla)
CREATE TABLE public.turnos (
  id TEXT PRIMARY KEY,
  dia_semana INTEGER NOT NULL,          -- 1: Lunes, 2: Martes, 3: Miércoles, 4: Jueves, 5: Viernes, 6: Sábado
  hora_inicio TEXT NOT NULL,           -- ej: '07:00'
  hora_fin TEXT NOT NULL,              -- ej: '09:00'
  duracion_horas NUMERIC NOT NULL,     -- ej: 2
  franja TEXT NOT NULL,                -- 'manana', 'siesta', 'tarde', 'noche', 'sabado'
  coach_id TEXT NOT NULL,              -- ej: 'patri'
  coach_nombre TEXT NOT NULL,          -- ej: 'Patri'
  es_dupla BOOLEAN NOT NULL DEFAULT FALSE,
  companero_nombre TEXT,               -- Nombre del compañero de dupla
  notas TEXT,
  actualizado_el TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: CAMBIOS_TURNO (Bolsa de cambios y reemplazos solicitados)
CREATE TABLE public.cambios_turno (
  id TEXT PRIMARY KEY,
  creado_el TIMESTAMPTZ DEFAULT NOW(),
  fecha_turno TEXT NOT NULL,           -- YYYY-MM-DD
  nombre_dia TEXT NOT NULL,            -- ej: 'Lunes'
  solicitante_id TEXT NOT NULL,
  solicitante_nombre TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  tipo TEXT NOT NULL,                  -- 'single_hour', 'multiple_hours', 'full_shift'
  franja TEXT NOT NULL,                -- 'manana', 'siesta', 'tarde', 'noche'
  motivo TEXT,
  estado TEXT NOT NULL DEFAULT 'open', -- 'open', 'claimed', 'confirmed', 'cancelled'
  tomado_por_id TEXT,
  tomado_por_nombre TEXT,
  tomado_el TIMESTAMPTZ,
  confirmado_el TIMESTAMPTZ,
  tipo_compensacion TEXT,              -- 'work', 'pay'
  actualizado_el TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: GUARDIAS_SABADO (Guardias rotativas de los sábados)
CREATE TABLE public.guardias_sabado (
  id TEXT PRIMARY KEY,
  fecha TEXT NOT NULL,                 -- YYYY-MM-DD
  coach_id TEXT NOT NULL,
  coach_nombre TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,           -- '11:00'
  hora_fin TEXT NOT NULL,              -- '14:00'
  estado TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'replaced'
  nombre_reemplazo TEXT,
  notas TEXT,
  actualizado_el TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: FERIADOS (Horarios y duplas de feriados)
CREATE TABLE public.feriados (
  id TEXT PRIMARY KEY,
  fecha TEXT NOT NULL,                 -- YYYY-MM-DD
  nombre TEXT NOT NULL,                -- ej: 'Día de la Independencia'
  esta_cerrado BOOLEAN NOT NULL DEFAULT FALSE,
  horas_seleccionadas JSONB NOT NULL DEFAULT '[]'::jsonb,
  horario_texto TEXT NOT NULL,         -- ej: '09:00 a 13:00 hs'
  total_horas NUMERIC NOT NULL DEFAULT 0,
  coach_id_1 TEXT NOT NULL,
  coach_nombre_1 TEXT NOT NULL,
  coach_id_2 TEXT NOT NULL,
  coach_nombre_2 TEXT NOT NULL,
  bloques JSONB DEFAULT '[]'::jsonb,
  notas TEXT,
  actualizado_el TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- POLÍTICAS DE ACCESO PÚBLICO (Row Level Security)
-- ==============================================================================
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cambios_turno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardias_sabado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura y escritura publica de turnos') THEN
    CREATE POLICY "Permitir lectura y escritura publica de turnos" ON public.turnos FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura y escritura publica de cambios_turno') THEN
    CREATE POLICY "Permitir lectura y escritura publica de cambios_turno" ON public.cambios_turno FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura y escritura publica de guardias_sabado') THEN
    CREATE POLICY "Permitir lectura y escritura publica de guardias_sabado" ON public.guardias_sabado FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura y escritura publica de feriados') THEN
    CREATE POLICY "Permitir lectura y escritura publica de feriados" ON public.feriados FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- HABILITAR REALTIME (Sincronización instantánea entre celulares y computadoras)
-- ==============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.turnos;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cambios_turno;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.guardias_sabado;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feriados;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
