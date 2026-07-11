CREATE TABLE IF NOT EXISTS tokens_reset_senha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour'),
  usado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
