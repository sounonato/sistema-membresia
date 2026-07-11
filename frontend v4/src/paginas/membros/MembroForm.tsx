import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionLabel } from "@/components/layout/PageHeader";
import type { Membro } from "@/lib/api";
import { useConvertidos } from "@/paginas/convertidos/hooks";

const inputClass =
  "border-0 border-b border-stone-300 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-amber-800 font-serif text-base h-11";

const selectTriggerClass = "rounded-none border-stone-300 h-11";

type Props = {
  initial?: Partial<Membro>;
  submitLabel?: string;
  showStatusSection?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (dados: Partial<Membro>) => void | Promise<void>;
};

export function MembroForm({
  initial,
  submitLabel = "Salvar membro",
  showStatusSection = false,
  loading = false,
  onCancel,
  onSubmit,
}: Props) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<Partial<Membro>>({
    nome: "",
    telefone: "",
    email: "",
    data_nascimento: "",
    genero: null,
    estado_civil: null,
    profissao: "",
    endereco: "",
    bairro: "",
    cidade: "",
    estado: "",
    data_entrada: hoje,
    tipo_entrada: null,
    data_batismo: "",
    batizado: false,
    fez_discipulado: false,
    convertido_id: null,
    nome_conjuge: "",
    tem_filhos: false,
    qtd_filhos: 0,
    observacoes: "",
    status: "ativo",
    carta_entrada_origem: "",
    carta_saida_destino: "",
    data_saida: "",
    motivo_saida: "",
    ...initial,
  });

  useEffect(() => {
    if (initial) setForm((f) => ({ ...f, ...initial }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id]);

  const { data: convertidos } = useConvertidos();

  function set<K extends keyof Membro>(k: K, v: Membro[K] | null | undefined) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nome?.trim() || !form.telefone?.trim() || !form.data_entrada) return;
    await onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12 max-w-3xl">
      {/* Seção I */}
      <section>
        <SectionLabel n="I.">Dados pessoais</SectionLabel>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Nome" n="a.">
            <Input
              required
              value={form.nome ?? ""}
              onChange={(e) => set("nome", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Telefone" n="b.">
            <Input
              required
              value={form.telefone ?? ""}
              onChange={(e) => set("telefone", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="E-mail" n="c.">
            <Input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Data de nascimento" n="d.">
            <Input
              type="date"
              value={form.data_nascimento ?? ""}
              onChange={(e) => set("data_nascimento", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Gênero" n="e.">
            <Select
              value={form.genero ?? ""}
              onValueChange={(v) => set("genero", (v || null) as Membro["genero"])}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Estado civil" n="f.">
            <Select
              value={form.estado_civil ?? ""}
              onValueChange={(v) => set("estado_civil", (v || null) as Membro["estado_civil"])}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                <SelectItem value="casado">Casado(a)</SelectItem>
                <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                <SelectItem value="uniao_estavel">União estável</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Profissão" n="g.">
            <Input
              value={form.profissao ?? ""}
              onChange={(e) => set("profissao", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Seção II */}
      <section>
        <SectionLabel n="II.">Endereço</SectionLabel>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Endereço" n="a.">
            <Input
              value={form.endereco ?? ""}
              onChange={(e) => set("endereco", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Bairro" n="b.">
            <Input
              value={form.bairro ?? ""}
              onChange={(e) => set("bairro", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Cidade" n="c.">
            <Input
              value={form.cidade ?? ""}
              onChange={(e) => set("cidade", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Estado (UF)" n="d.">
            <Input
              value={form.estado ?? ""}
              onChange={(e) => set("estado", e.target.value)}
              maxLength={2}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Seção III */}
      <section>
        <SectionLabel n="III.">Dados eclesiásticos</SectionLabel>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Data de entrada" n="a.">
            <Input
              required
              type="date"
              value={form.data_entrada ?? ""}
              onChange={(e) => set("data_entrada", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Tipo de entrada" n="b.">
            <Select
              value={form.tipo_entrada ?? ""}
              onValueChange={(v) =>
                set("tipo_entrada", (v || null) as Membro["tipo_entrada"])
              }
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="batismo">Batismo</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="aclamacao">Aclamação</SelectItem>
                <SelectItem value="reconciliacao">Reconciliação</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Data do batismo" n="c.">
            <Input
              type="date"
              value={form.data_batismo ?? ""}
              onChange={(e) => set("data_batismo", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Convertido de origem" n="d.">
            <Select
              value={form.convertido_id ?? ""}
              onValueChange={(v) => set("convertido_id", v || null)}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                {(convertidos ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} — {c.telefone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-center gap-3 pt-2">
            <Checkbox
              id="batizado"
              checked={!!form.batizado}
              onCheckedChange={(v) => set("batizado", !!v)}
            />
            <label htmlFor="batizado" className="text-sm font-serif">
              Batizado
            </label>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Checkbox
              id="fez_disc"
              checked={!!form.fez_discipulado}
              onCheckedChange={(v) => set("fez_discipulado", !!v)}
            />
            <label htmlFor="fez_disc" className="text-sm font-serif">
              Fez discipulado
            </label>
          </div>
        </div>
      </section>

      {/* Seção IV */}
      <section>
        <SectionLabel n="IV.">Família</SectionLabel>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex items-center gap-3 pt-2">
            <Checkbox
              id="tem_filhos"
              checked={!!form.tem_filhos}
              onCheckedChange={(v) => set("tem_filhos", !!v)}
            />
            <label htmlFor="tem_filhos" className="text-sm font-serif">
              Tem filhos
            </label>
          </div>
          {form.tem_filhos && (
            <Field label="Quantidade de filhos" n="a.">
              <Input
                type="number"
                min={0}
                value={form.qtd_filhos ?? 0}
                onChange={(e) => set("qtd_filhos", Number(e.target.value))}
                className={inputClass}
              />
            </Field>
          )}
          <Field label="Nome do cônjuge" n="b.">
            <Input
              value={form.nome_conjuge ?? ""}
              onChange={(e) => set("nome_conjuge", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Seção V */}
      <section>
        <SectionLabel n="V.">Observações</SectionLabel>
        <Textarea
          rows={4}
          value={form.observacoes ?? ""}
          onChange={(e) => set("observacoes", e.target.value)}
          className="rounded-none border-stone-300 focus-visible:ring-0 focus-visible:border-amber-800 font-serif"
        />
      </section>

      {showStatusSection && (
        <section>
          <SectionLabel n="VI.">Status e transferência</SectionLabel>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Status" n="a.">
              <Select
                value={form.status ?? "ativo"}
                onValueChange={(v) => set("status", v as Membro["status"])}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="transferido">Transferido</SelectItem>
                  <SelectItem value="falecido">Falecido</SelectItem>
                  <SelectItem value="excluido">Excluído</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.tipo_entrada === "transferencia" && (
              <Field label="Carta de origem" n="b.">
                <Input
                  value={form.carta_entrada_origem ?? ""}
                  onChange={(e) => set("carta_entrada_origem", e.target.value)}
                  className={inputClass}
                />
              </Field>
            )}
            {form.status === "transferido" && (
              <>
                <Field label="Igreja de destino" n="c.">
                  <Input
                    value={form.carta_saida_destino ?? ""}
                    onChange={(e) => set("carta_saida_destino", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Data de saída" n="d.">
                  <Input
                    type="date"
                    value={form.data_saida ?? ""}
                    onChange={(e) => set("data_saida", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Motivo" n="e.">
                  <Input
                    value={form.motivo_saida ?? ""}
                    onChange={(e) => set("motivo_saida", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </>
            )}
          </div>
        </section>
      )}

      <div className="flex gap-3 pt-4 border-t border-stone-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-none border-stone-300"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="rounded-none bg-stone-900 hover:bg-amber-800 text-amber-50 gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  n,
  children,
}: {
  label: string;
  n: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="flex items-baseline gap-3 text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-1">
        <span className="font-serif italic text-amber-800 not-italic normal-case tabular-nums text-xs">
          {n}
        </span>
        {label}
      </Label>
      {children}
    </div>
  );
}