const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Lê variáveis do .env
const envPath = path.join(__dirname, '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=')
  if (key && vals.length) envVars[key.trim()] = vals.join('=').trim()
})

const supabaseUrl = envVars['VITE_SUPABASE_URL']
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['VITE_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas no .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const filePath = path.join(__dirname, '..', 'manual_nazareno.txt')

async function main() {
  const content = fs.readFileSync(filePath)
  const { error } = await supabase.storage
    .from('documentos')
    .upload('manual_nazareno.txt', content, {
      contentType: 'text/plain',
      upsert: true,
    })

  if (error) {
    console.error('❌ Erro no upload:', error.message)
    console.log('\n⚠️  Se o bucket "documentos" não existir, crie-o no Supabase:')
    console.log('   Supabase Dashboard → Storage → New bucket → nome: "documentos" → Public: OFF')
    process.exit(1)
  }

  console.log('✅ Manual enviado para o Supabase Storage com sucesso!')
  console.log('   Bucket: documentos')
  console.log('   Arquivo: manual_nazareno.txt')
}

main().catch(console.error)
