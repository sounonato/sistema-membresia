import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, GraduationCap, BookOpen, Edit, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { ModuloDiscipulado } from '@/types'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  descricao: z.string().optional(),
  total_aulas: z.coerce.number().min(1, 'Mínimo 1 aula').max(52),
  ordem: z.coerce.number().min(1),
})

type FormData = z.infer<typeof schema>

async function fetchModulos() {
  const { data } = await supabase
    .from('modulos_discipulado')
    .select('*, grupos:grupos_discipulado(id)')
    .order('ordem')
  return (data ?? []) as (ModuloDiscipulado & { grupos: { id: string }[] })[]
}

export default function Modulos() {
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<ModuloDiscipulado | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: modulos = [], isLoading } = useQuery({
    queryKey: ['modulos-full'],
    queryFn: fetchModulos,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData, any, FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { total_aulas: 12, ordem: 1 },
  })

  function openCreate() {
    setEditing(null)
    reset({ total_aulas: 12, ordem: modulos.length + 1 })
    setShowDialog(true)
  }

  function openEdit(m: ModuloDiscipulado) {
    setEditing(m)
    setValue('nome', m.nome)
    setValue('descricao', m.descricao ?? '')
    setValue('total_aulas', m.total_aulas)
    setValue('ordem', m.ordem)
    setShowDialog(true)
  }

  const save = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) {
        await supabase.from('modulos_discipulado').update(data).eq('id', editing.id)
      } else {
        await supabase.from('modulos_discipulado').insert({ ...data, ativo: true })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos-full'] })
      queryClient.invalidateQueries({ queryKey: ['modulos'] })
      setShowDialog(false)
      reset()
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('modulos_discipulado').update({ ativo: false }).eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modulos-full'] }),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Módulos de Discipulado</h1>
          <p className="text-sm text-stone-500 mt-1">{modulos.filter(m => m.ativo).length} módulos ativos</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Novo Módulo
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-stone-100 animate-pulse rounded-2xl border border-stone-200" />)}
        </div>
      ) : modulos.filter(m => m.ativo).length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center shadow-[0_1px_4px_rgba(28,25,23,0.06)]">
          <GraduationCap size={40} className="text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 font-medium">Nenhum módulo cadastrado</p>
          <p className="text-sm text-stone-400 mt-1">Crie módulos de ensino para o discipulado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modulos.filter(m => m.ativo).map((m, idx) => (
            <div key={m.id} className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center gap-4 shadow-[0_1px_4px_rgba(28,25,23,0.06)] hover:shadow-[0_4px_16px_rgba(28,25,23,0.10)] transition-all">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-amber-200">
                <span className="text-amber-800 font-bold text-sm">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif text-lg font-semibold text-stone-900">{m.nome}</h3>
                  <Badge variant="purple">
                    <BookOpen size={10} className="mr-1" />
                    {m.total_aulas} aulas
                  </Badge>
                  <Badge variant="info">
                    {m.grupos?.length ?? 0} grupos
                  </Badge>
                </div>
                {m.descricao && (
                  <p className="text-sm text-stone-500 mt-1 line-clamp-2">{m.descricao}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(m)}
                  aria-label="Editar módulo"
                  className="p-2 rounded-lg text-stone-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(m.id)}
                  aria-label="Excluir módulo"
                  className="p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog: Confirmar desativação de módulo */}
      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={() => setConfirmDeleteId(null)}
        title="Desativar módulo"
        description="O módulo será desativado e não aparecerá em novos grupos. Grupos existentes não são afetados."
      >
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
          <Button
            variant="outline"
            className="text-red-700 border-red-200 hover:bg-red-50 bg-white"
            loading={remove.isPending}
            onClick={() => { remove.mutate(confirmDeleteId!); setConfirmDeleteId(null) }}
          >
            Desativar
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title={editing ? 'Editar Módulo' : 'Novo Módulo'}
      >
        <form onSubmit={handleSubmit((data) => save.mutate(data))} className="space-y-4">
          <Input label="Nome do módulo" required error={errors.nome?.message} placeholder="Ex: Fundamentos da Fé" {...register('nome')} />
          <Textarea label="Descrição" placeholder="O que será ensinado neste módulo..." {...register('descricao')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Total de aulas" type="number" min={1} max={52} error={errors.total_aulas?.message} {...register('total_aulas')} />
            <Input label="Ordem" type="number" min={1} {...register('ordem')} hint="Sequência do módulo" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button type="submit" loading={save.isPending}>{editing ? 'Salvar' : 'Criar Módulo'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
