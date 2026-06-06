import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, User, MapPin, Heart, Church } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  telefone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  data_conversao: z.string().min(1, 'Data obrigatória'),
  data_nascimento: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado_civil: z.string().optional(),
  genero: z.string().optional(),
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
      <CardTitle className="flex items-center gap-2 text-primary-700">
        <Icon size={16} />
        {label}
      </CardTitle>
    </CardHeader>
  )
}

export default function NovoConvertido() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData, any, FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      data_conversao: new Date().toISOString().split('T')[0],
      tem_filhos: false,
      batizado: false,
      quer_batismo: false,
      ja_frequentava_igreja: false,
    },
  })

  const temFilhos = watch('tem_filhos')
  const jaFrequentava = watch('ja_frequentava_igreja')

  async function onSubmit(data: FormData) {
    setSaving(true)
    setServerError('')
    try {
      const { error } = await supabase.from('novos_convertidos').insert({
        ...data,
        email: data.email || null,
        estado_civil: data.estado_civil || null,
        como_conheceu: data.como_conheceu || null,
        qtd_filhos: data.tem_filhos ? (data.qtd_filhos ?? 0) : 0,
        criado_por: user?.id ?? null,
        status: 'ativo',
      })
      if (error) throw error
      navigate('/convertidos')
    } catch (err) {
      setServerError('Erro ao salvar. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Convertido</h1>
          <p className="text-sm text-gray-500">Preencha os dados do novo membro</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Dados Pessoais */}
        <Card>
          <SectionTitle icon={User} label="Dados Pessoais" />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Nome completo"
                placeholder="João da Silva"
                error={errors.nome?.message}
                required
                {...register('nome')}
              />
            </div>
            <Input
              label="Telefone / WhatsApp"
              placeholder="(88) 99999-9999"
              error={errors.telefone?.message}
              required
              {...register('telefone')}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="joao@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Data de nascimento"
              type="date"
              {...register('data_nascimento')}
            />
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
            <Select
              label="Gênero"
              placeholder="Selecionar..."
              options={[
                { value: 'masculino', label: 'Masculino' },
                { value: 'feminino', label: 'Feminino' },
                { value: 'outro', label: 'Outro / Prefiro não informar' },
              ]}
              {...register('genero')}
            />
            <Input label="Profissão" placeholder="Contador, professor..." {...register('profissao')} />
            <div className="flex items-center gap-3 pt-2">
              <input type="checkbox" id="tem_filhos" {...register('tem_filhos')} className="w-4 h-4 accent-primary-600" />
              <label htmlFor="tem_filhos" className="text-sm font-medium text-gray-700">Tem filhos?</label>
            </div>
            {temFilhos && (
              <Input
                label="Quantidade de filhos"
                type="number"
                min={1}
                {...register('qtd_filhos')}
              />
            )}
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <SectionTitle icon={MapPin} label="Endereço" />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Endereço" placeholder="Rua, número, complemento" {...register('endereco')} />
            </div>
            <Input label="Bairro" placeholder="Centro" {...register('bairro')} />
            <Input label="Cidade" placeholder="Fortaleza" defaultValue="Fortaleza" {...register('cidade')} />
          </CardContent>
        </Card>

        {/* Conversão */}
        <Card>
          <SectionTitle icon={Heart} label="Informações da Conversão" />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Data da conversão"
              type="date"
              required
              error={errors.data_conversao?.message}
              {...register('data_conversao')}
            />
            <Select
              label="Como conheceu a igreja"
              placeholder="Selecionar..."
              options={[
                { value: 'amigo', label: 'Amigo(a)' },
                { value: 'familiar', label: 'Familiar' },
                { value: 'redes_sociais', label: 'Redes Sociais' },
                { value: 'evento', label: 'Evento' },
                { value: 'culto', label: 'Culto' },
                { value: 'outro', label: 'Outro' },
              ]}
              {...register('como_conheceu')}
            />
          </CardContent>
        </Card>

        {/* Fé */}
        <Card>
          <SectionTitle icon={Church} label="Informações de Fé" />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-primary-300 transition-colors">
                <input type="checkbox" {...register('batizado')} className="w-4 h-4 accent-primary-600" />
                <span className="text-sm font-medium text-gray-700">É batizado?</span>
              </label>
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-primary-300 transition-colors">
                <input type="checkbox" {...register('quer_batismo')} className="w-4 h-4 accent-primary-600" />
                <span className="text-sm font-medium text-gray-700">Quer se batizar?</span>
              </label>
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-primary-300 transition-colors">
                <input type="checkbox" {...register('ja_frequentava_igreja')} className="w-4 h-4 accent-primary-600" />
                <span className="text-sm font-medium text-gray-700">Frequentava igreja?</span>
              </label>
            </div>
            {jaFrequentava && (
              <Input
                label="Qual igreja frequentava?"
                placeholder="Nome da igreja anterior"
                {...register('igreja_anterior')}
              />
            )}
            <Textarea
              label="Observações"
              placeholder="Informações adicionais relevantes..."
              {...register('observacoes')}
            />
          </CardContent>
        </Card>

        {serverError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
            {serverError}
          </p>
        )}

        <div className="flex gap-3 justify-end pb-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            <Save size={15} />
            Salvar Convertido
          </Button>
        </div>
      </form>
    </div>
  )
}
