export type Perfil = 'admin' | 'pastor' | 'lider' | 'discipulador'

export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: Perfil
  ativo: boolean
  criado_em: string
}

export type StatusConvertido = 'ativo' | 'em_discipulado' | 'encerrado' | 'inativo'
export type EstadoCivil = 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel'
export type ComoConheceu = 'amigo' | 'familiar' | 'redes_sociais' | 'evento' | 'culto' | 'outro'

export interface NovoConvertido {
  id: string
  nome: string
  telefone: string
  email: string | null
  data_conversao: string
  data_nascimento: string | null
  endereco: string | null
  bairro: string | null
  cidade: string | null
  estado_civil: EstadoCivil | null
  tem_filhos: boolean
  qtd_filhos: number | null
  profissao: string | null
  como_conheceu: ComoConheceu | null
  batizado: boolean
  quer_batismo: boolean
  ja_frequentava_igreja: boolean
  igreja_anterior: string | null
  observacoes: string | null
  foto_url: string | null
  status: StatusConvertido
  criado_por: string | null
  criado_em: string
  atualizado_em: string
}

export type TipoGrupo = 'individual' | 'grupo'
export type StatusGrupo = 'ativo' | 'encerrado' | 'pausado'

export interface Discipulador {
  id: string
  nome: string
  telefone: string
  email: string | null
  usuario_id: string | null
  ativo: boolean
  criado_em: string
}

export interface ModuloDiscipulado {
  id: string
  nome: string
  descricao: string | null
  total_aulas: number
  ordem: number
  ativo: boolean
}

export interface GrupoDiscipulado {
  id: string
  nome: string
  discipulador_id: string
  tipo: TipoGrupo
  modulo_id: string | null
  status: StatusGrupo
  data_inicio: string | null
  data_fim: string | null
  observacoes: string | null
  criado_em: string
  discipulador?: Discipulador
  modulo?: ModuloDiscipulado
  membros?: GrupoMembro[]
  progresso?: ProgressoAula[]
}

export type StatusMembro = 'ativo' | 'encerrado' | 'transferido'

export interface GrupoMembro {
  id: string
  grupo_id: string
  convertido_id: string
  data_entrada: string
  data_saida: string | null
  status: StatusMembro
  convertido?: NovoConvertido
}

export type StatusAula = 'realizada' | 'pendente' | 'cancelada'

export interface ProgressoAula {
  id: string
  grupo_id: string
  numero_aula: number
  data_realizada: string | null
  observacoes: string | null
  status: StatusAula
  criado_em: string
}

export interface DashboardStats {
  total_convertidos: number
  convertidos_mes: number
  em_discipulado: number
  grupos_ativos: number
  aulas_realizadas_mes: number
  taxa_conclusao: number
}
