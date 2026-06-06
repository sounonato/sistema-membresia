import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, User, MapPin, Heart, Church } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { NovoConvertido } from '@/types'

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
  ja_fez_discipulado: z.boolean(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-amber-700">
        <Icon size={16} />
        {label}
      </CardTitle>
    </CardHeader>
  )
}

async function fetchConvertido(id: string) {
  const { data } = await supabase.from('novos_convertidos').select('*').eq('id', id).single()
  return data as NovoConvertido
}

export default function EditarConvertido() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: convertido, isLoading } = useQuery({
    queryKey: ['convertido', id],
    queryFn: () => fetchConvertido(id!),
    enabled: !!id,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData, any, FormData>({
    resolver: zodResolver(schema) as any,
    values: convertido ? {
      nome: convertido.nome ?? '',
      telefone: convertido.telefone ?? '',
      email: convertido.email ?? '',
      data_conversao: convertido.data_conversao ?? '',
      data_nascimento: convertido.data_nascimento ?? '',
      endereco: convertido.endereco ?? '',
      bairro: convertido.bairro ?? '',
      cidade: convertido.cidade ?? '',
      estado_civil: convertido.estado_civil ?? '',
      genero: convertido.genero ?? '',
      tem_filhos: convertido.tem_filhos ?? false,
      qtd_filhos: convertido.qtd_filhos ?? 0,
      profissao: convertido.profissao ?? '',
      como_conheceu: convertido.como_conheceu ?? '',
      batizado: convertido.batizado ?? false,
      quer_batismo: convertido.quer_batismo ?? false,
      ja_frequentava_igreja: convertido.ja_frequentava_igreja ?? false,
      igreja_anterior: convertido.igreja_anterior ?? '',
      ja_fez_discipulado: convertido.ja_fez_discipulado ?? false,
      observacoes: convertido.observacoes ?? '',
    } : undefined,
  })

  const temFilhos = watch('tem_filhos')
  const jaFrequentava = watch('ja_frequentava_igreja')

  async function onSubmit(data: FormData) {
    const { error } = await supabase
      .from('novos_convertidos')
      .update({
        ...data,
        email: data.email || null,
        estado_civil: data.estado_civil || null,
        como_conheceu: data.como_conheceu || null,
        qtd_filhos: data.tem_filhos ? (data.qtd_filhos ?? 0) : 0,
      })
      .eq('id', id!)

    if (error) {
      alert('Erro ao salvar: ' + error.message)
      return
    }
    navigate(`/convertidos/${id}`)
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 max-w-2xl">
        <div className="h-8 bg-stone-100 rounded-xl w-48" />
        <div className="h-48 bg-stone-100 rounded-2xl" />
        <div className="h-32 bg-stone-100 rounded-2xl" />
      </div>
    )
  }

  if (!convertido) return <p className="text-stone-500">Convertido não encontrado.</p>

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Editar Convertido</h1>
          <p className="text-sm text-stone-500">{convertido.nome}</p>
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
              label="Gênero / Faixa etária"
              placeholder="Selecionar..."
              options={[
                { value: 'masculino', label: 'Masculino' },
                { value: 'feminino', label: 'Feminino' },
                { value: 'jovem', label: 'Jovem' },
                { value: 'adolescente', label: 'Adolescente' },
              ]}
              {...register('genero')}
            />
            <Input label="Profissão" placeholder="Contador, professor..." {...register('profissao')} />
            <div className="flex items-center gap-3 pt-2">
              <input type="checkbox" id="tem_filhos" {...register('tem_filhos')} className="w-4 h-4 accent-amber-700 rounded" />
              <label htmlFor="tem_filhos" className="text-sm font-medium text-stone-700 cursor-pointer">Tem filhos?</label>
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
            <Input label="Cidade" placeholder="Fortaleza" {...register('cidade')} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 cursor-pointer hover:border-amber-300 hover:bg-amber-50/10 transition-colors">
                <input type="checkbox" {...register('batizado')} className="w-4 h-4 accent-amber-700 rounded" />
                <span className="text-sm font-medium text-stone-700">É batizado?</span>
              </label>
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 cursor-pointer hover:border-amber-300 hover:bg-amber-50/10 transition-colors">
                <input type="checkbox" {...register('quer_batismo')} className="w-4 h-4 accent-amber-700 rounded" />
                <span className="text-sm font-medium text-stone-700">Quer se batizar?</span>
              </label>
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 cursor-pointer hover:border-amber-300 hover:bg-amber-50/10 transition-colors">
                <input type="checkbox" {...register('ja_frequentava_igreja')} className="w-4 h-4 accent-amber-700 rounded" />
                <span className="text-sm font-medium text-stone-700">Frequentava igreja?</span>
              </label>
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 cursor-pointer hover:border-amber-300 hover:bg-amber-50/10 transition-colors">
                <input type="checkbox" {...register('ja_fez_discipulado')} className="w-4 h-4 accent-amber-700 rounded" />
                <span className="text-sm font-medium text-stone-700">Já fez discipulado?</span>
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
              label="Pedido de oração / Observações"
              placeholder="Observações sobre o convertido..."
              {...register('observacoes')}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end pb-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <Save size={15} />
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
