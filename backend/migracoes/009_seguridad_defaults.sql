-- Contas criadas pelo seed histórico devem trocar a senha no primeiro acesso.
-- Não remove nem desativa contas existentes; apenas elimina o risco operacional
-- de manter a senha pública conhecida como credencial permanente.
UPDATE usuarios
SET deve_trocar_senha = true
WHERE senha_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
