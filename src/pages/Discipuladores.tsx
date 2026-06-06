import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserCheck, Phone, BookOpen, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { formatPhone } from '@/lib/utils'
import type { Discipulador } from '@/types'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  telefone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

async function fetchDiscipuladores() {
  const { data } = await supabase
    .from('discipuladores')
    .select('*, grupos:grupos_discipulado(id, status)')
    .order('nome')
  return (data ?? []) as (Discipulador & { grupos: { id: string; status: string }[] })[]
}

export default function Discipuladores() {
  const [showDialog, setShowDialog] = useState(false)
  const [discError, setDiscError] = useState('')
  const [toggleError, setToggleError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nome: string } | null>(null)
  const queryClient = useQueryClient()

  const { data: discipuladores = [], isLoading } = useQuery({
    queryKey: ['discipuladores-full'],
    queryFn: fetchDiscipuladores,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const create = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase.from('discipuladores').insert({
        ...data,
        email: data.email || null,
        ativo: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discipuladores-full'] })
      queryClient.invalidateQueries({ queryKey: ['discipuladores'] })
      setShowDialog(false)
      reset()
      setDiscError('')
    },
    onError: (err: any) => setDiscError(err.message ?? 'Erro ao criar discipulador'),
  })

  const deleteDiscipulador = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('discipuladores').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discipuladores-full'] })
      queryClient.invalidateQueries({ queryKey: ['discipuladores'] })
      setDeleteTarget(null)
    },
    onError: (err: any) => setToggleError(err.message ?? 'Erro ao excluir discipulador'),
  })

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      setToggleError('')
      const { error } = await supabase.from('discipuladores').update({ ativo: !ativo }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discipuladores-full'] }),
    onError: (err: any) => setToggleError(err.message ?? 'Erro ao atualizar discipulador'),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Discipuladores</h1>
          <p className="text-sm text-stone-500 mt-1">{discipuladores.filter(d => d.ativo).length} ativos</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus size={16} />
          Novo Discipulador
        </Button>
      </div>

      {toggleError && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {toggleError}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-stone-100 animate-pulse rounded-2xl border border-stone-200" />
          ))}
        </div>
      ) : discipuladores.length === 0 ? (
        <Card className="p-10 text-center">
          <UserCheck size={40} className="text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 font-medium">Nenhum discipulador cadastrado</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {discipuladores.map((d) => {
            const gruposAtivos = d.grupos?.filter((g) => g.status === 'ativo').length ?? 0
            return (
              <Card key={d.id} className="p-5 hover:border-amber-300 transition-all">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={d.nome} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-lg font-bold text-stone-900 truncate">{d.nome}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant={d.ativo ? 'success' : 'default'}>
                          {d.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="info">
                          <BookOpen size={10} className="mr-1" />
                          {gruposAtivos} grupos
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-stone-600">
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-stone-400" />
                      {formatPhone(d.telefone)}
                    </div>
                    {d.email && (
                      <p className="text-xs text-stone-400 pl-5">{d.email}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => toggleAtivo.mutate({ id: d.id, ativo: d.ativo })}
                      className="text-xs text-stone-400 hover:text-amber-700 transition-colors font-medium"
                    >
                      {d.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: d.id, nome: d.nome })}
                      className="text-xs text-stone-400 hover:text-red-600 transition-colors font-medium flex items-center gap-1"
                    >
                      <Trash2 size={11} />
                      Excluir
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Excluir Discipulador"
        description={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? Esta ação não pode ser desfeita e removerá todos os dados vinculados.`}
      >
        <div className="flex gap-3 justify-end pt-1">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => deleteTarget && deleteDiscipulador.mutate(deleteTarget.id)}
            loading={deleteDiscipulador.isPending}
          >
            <Trash2 size={14} />
            Excluir permanentemente
          </Button>
        </div>
      </Dialog>

      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) setDiscError('') }} title="Novo Discipulador">
        <form onSubmit={handleSubmit((data) => create.mutate(data))} className="space-y-4">
          {discError && <p className="text-sm text-red-500">{discError}</p>}
          <Input label="Nome completo" required error={errors.nome?.message} {...register('nome')} />
          <Input label="Telefone" required error={errors.telefone?.message} {...register('telefone')} />
          <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button type="submit" loading={create.isPending}>Cadastrar</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
