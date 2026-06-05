import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Church, Heart, MapPin, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  telefone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  data_nascimento: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado_civil: z.string().optional(),
  tem_filhos: z.boolean(),
  qtd_filhos: z.coerce.number().min(0).optional(),
  profissao: z.string().optional(),
  como_conheceu: z.string().optional(),
  batizado: z.boolean(),
  quer_batismo: z.boolean(),
  ja_frequentava_igreja: z.boolean(),
  igreja_anterior: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-primary-700 text-sm">
        <Icon size={15} />
        {label}
      </CardTitle>
    </CardHeader>
  )
}

export default function FormularioPublico() {
  const [enviado, setEnviado] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData, any, FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      data_conversao: new Date().toISOString().split('T')[0],
      tem_filhos: false,
      batizado: false,
      quer_batismo: false,
      ja_frequentava_igreja: false,
      cidade: 'Fortaleza',
    } as any,
  })

  const temFilhos = watch('tem_filhos')
  const jaFrequentava = watch('ja_frequentava_igreja')

  async function onSubmit(data: FormData) {
    setSaving(true)
    setErro('')
    try {
      const { error } = await supabase.from('novos_convertidos').insert({
        ...data,
        email: data.email || null,
        estado_civil: data.estado_civil || null,
        como_conheceu: data.como_conheceu || null,
        qtd_filhos: data.tem_filhos ? (data.qtd_filhos ?? 0) : 0,
        data_conversao: new Date().toISOString().split('T')[0],
        status: 'ativo',
        criado_por: null,
      })
      if (error) throw error
      setEnviado(true)
    } catch {
      setErro('Erro ao enviar. Tente novamente.')
      setSaving(false)
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo(a)! 🎉</h1>
          <p className="text-gray-500 leading-relaxed">
            Seus dados foram registrados com sucesso. Nossa equipe entrará em contato em breve para acompanhar sua caminhada na fé.
          </p>
          <p className="text-sm text-gray-400 mt-6">Que Deus abençoe você!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary-200">
            <Church size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo(a)!</h1>
          <p className="text-sm text-gray-500 mt-1">Preencha seus dados para começarmos sua jornada</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Dados Pessoais */}
          <Card>
            <SectionTitle icon={User} label="Dados Pessoais" />
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Nome completo" placeholder="Seu nome completo" required error={errors.nome?.message} {...register('nome')} />
              </div>
              <Input label="WhatsApp" placeholder="(88) 99999-9999" required error={errors.telefone?.message} {...register('telefone')} />
              <Input label="E-mail" type="email" placeholder="seu@email.com" error={errors.email?.message} {...register('email')} />
              <Input label="Data de nascimento" type="date" {...register('data_nascimento')} />
              <Select
                label="Estado civil"
                placeholder="Selecionar..."
                options={[
                  { value: 'solteiro', label: 'Solteiro(a)' },
                  { value: 'casado', label: 'Casado(a)' },
                  { value: 'divorciado', label: 'Divorciado(a)' },
                  { value: 'viuvo', label: 'Viúvo(a)' },
                  { value: 'uniao_estavel', label: 'União Estável' },
                ]}
                {...register('estado_civil')}
              />
              <Input label="Profissão" placeholder="Sua profissão" {...register('profissao')} />
              <div className="flex items-center gap-2.5 col-span-1">
                <input type="checkbox" id="tem_filhos" {...register('tem_filhos')} className="w-4 h-4 accent-primary-600" />
                <label htmlFor="tem_filhos" className="text-sm font-medium text-gray-700">Tem filhos?</label>
              </div>
              {temFilhos && (
                <Input label="Quantidade de filhos" type="number" min={1} {...register('qtd_filhos')} />
              )}
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <SectionTitle icon={MapPin} label="Endereço" />
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Endereço" placeholder="Rua, número" {...register('endereco')} />
              </div>
              <Input label="Bairro" placeholder="Seu bairro" {...register('bairro')} />
              <Input label="Cidade" defaultValue="Fortaleza" {...register('cidade')} />
            </CardContent>
          </Card>

          {/* Fé */}
          <Card>
            <SectionTitle icon={Heart} label="Informações de Fé" />
            <CardContent className="space-y-4">
              <Select
                label="Como conheceu nossa igreja?"
                placeholder="Selecionar..."
                options={[
                  { value: 'amigo', label: 'Por um amigo(a)' },
                  { value: 'familiar', label: 'Por um familiar' },
                  { value: 'redes_sociais', label: 'Pelas redes sociais' },
                  { value: 'evento', label: 'Em um evento' },
                  { value: 'culto', label: 'Veio ao culto' },
                  { value: 'outro', label: 'Outro' },
                ]}
                {...register('como_conheceu')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-primary-300 transition-colors">
                  <input type="checkbox" {...register('batizado')} className="w-4 h-4 accent-primary-600" />
                  <span className="text-sm text-gray-700">Sou batizado(a)</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-primary-300 transition-colors">
                  <input type="checkbox" {...register('quer_batismo')} className="w-4 h-4 accent-primary-600" />
                  <span className="text-sm text-gray-700">Quero me batizar</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-primary-300 transition-colors">
                  <input type="checkbox" {...register('ja_frequentava_igreja')} className="w-4 h-4 accent-primary-600" />
                  <span className="text-sm text-gray-700">Frequentava outra igreja</span>
                </label>
              </div>

              {jaFrequentava && (
                <Input label="Qual igreja?" placeholder="Nome da igreja" {...register('igreja_anterior')} />
              )}

              <Textarea
                label="Conta um pouquinho sobre você (opcional)"
                placeholder="Como foi sua experiência, o que te trouxe até aqui..."
                {...register('observacoes')}
              />
            </CardContent>
          </Card>

          {erro && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 text-center">
              {erro}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={saving}>
            Enviar meus dados ✨
          </Button>

          <p className="text-xs text-gray-400 text-center pb-4">
            Seus dados são sigilosos e serão usados apenas pela equipe pastoral.
          </p>
        </form>
      </div>
    </div>
  )
}
