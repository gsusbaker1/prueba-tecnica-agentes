-- Esquema SQL de referencia para la tabla `items` en Supabase
-- Columnas en inglés con valores de dominio en español.

CREATE TABLE IF NOT EXISTS public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  description text DEFAULT '',
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta')),
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'completado')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para acelerar ordenación y filtros frecuentes
CREATE INDEX IF NOT EXISTS items_status_created_at_idx
  ON public.items (status, created_at DESC);

-- Acceso público directo (sin login obligatorio, según requisitos de la prueba técnica)
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read items" ON public.items;
CREATE POLICY "Public read items"
  ON public.items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public insert items" ON public.items;
CREATE POLICY "Public insert items"
  ON public.items FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update items" ON public.items;
CREATE POLICY "Public update items"
  ON public.items FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete items" ON public.items;
CREATE POLICY "Public delete items"
  ON public.items FOR DELETE
  USING (true);
