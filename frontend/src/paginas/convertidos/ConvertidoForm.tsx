import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Convertido } from "./hooks";

type Props = {
  initial?: Partial<Convertido>;
  submitting: boolean;
  onSubmit: (data: Partial<Convertido>) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
};

export function ConvertidoForm({ initial, submitting, onSubmit, onCancel, submitLabel = "Salvar" }: Props) {
  const [form, setForm] = useState<Partial<Convertido>>(initial ?? {});
  function set<K extends keyof Convertido>(k: K, v: Convertido[K] | undefined) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handle(e: FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }

  return (
    <form onSubmit={handle} className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-serif text-primary">Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nome completo *">
            <Input required value={form.nome ?? ""} onChange={(e) => set("nome", e.target.value)} />
          </Field>
          <Field label="Telefone / WhatsApp *">
            <Input required value={form.telefone ?? ""} onChange={(e) => set("telefone", e.target.value)} />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Data de nascimento *">
            <Input
              type="date"
              required
              value={form.data_nascimento?.slice(0, 10) ?? ""}
              onChange={(e) => set("data_nascimento", e.target.value)}
            />
          </Field>
          <Field label="Estado civil">
            <Select value={form.estado_civil} onValueChange={(v) => set("estado_civil", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {["Solteiro", "Casado", "Divorciado", "Viúvo", "União Estável"].map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Gênero">
            <Select value={form.genero} onValueChange={(v) => set("genero", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Profissão">
            <Input value={form.profissao ?? ""} onChange={(e) => set("profissao", e.target.value)} />
          </Field>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Checkbox
                checked={!!form.tem_filhos}
                onCheckedChange={(v) => set("tem_filhos", !!v)}
              />
              Tem filhos?
            </Label>
            {form.tem_filhos && (
              <Input
                type="number"
                min={0}
                placeholder="Quantidade de filhos"
                value={form.qtd_filhos ?? ""}
                onChange={(e) => set("qtd_filhos", Number(e.target.value))}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-serif text-primary">Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Endereço">
            <Input value={form.endereco ?? ""} onChange={(e) => set("endereco", e.target.value)} />
          </Field>
          <Field label="Bairro">
            <Input value={form.bairro ?? ""} onChange={(e) => set("bairro", e.target.value)} />
          </Field>
          <Field label="Cidade">
            <Input value={form.cidade ?? ""} onChange={(e) => set("cidade", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-serif text-primary">Informações da Conversão</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Data da conversão *">
            <Input
              type="date"
              required
              value={form.data_conversao?.slice(0, 10) ?? ""}
              onChange={(e) => set("data_conversao", e.target.value)}
            />
          </Field>
          <Field label="Como conheceu a igreja">
            <Select value={form.como_conheceu} onValueChange={(v) => set("como_conheceu", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {["Amigo", "Familiar", "Redes Sociais", "Evento", "Culto", "Outro"].map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-serif text-primary">Informações de Fé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CheckRow checked={!!form.batizado} onChange={(v) => set("batizado", v)} label="É batizado?" />
            <CheckRow checked={!!form.quer_batizar} onChange={(v) => set("quer_batizar", v)} label="Quer se batizar?" />
            <div className="space-y-2">
              <CheckRow
                checked={!!form.frequentava_outra_igreja}
                onChange={(v) => set("frequentava_outra_igreja", v)}
                label="Frequentava outra igreja?"
              />
              {form.frequentava_outra_igreja && (
                <Input
                  placeholder="Qual igreja?"
                  value={form.qual_igreja ?? ""}
                  onChange={(e) => set("qual_igreja", e.target.value)}
                />
              )}
            </div>
            <CheckRow checked={!!form.fez_discipulado} onChange={(v) => set("fez_discipulado", v)} label="Já fez discipulado?" />
          </div>
          <Field label="Observações / Pedido de oração">
            <Textarea
              rows={4}
              value={form.observacoes ?? ""}
              onChange={(e) => set("observacoes", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting} className="rounded-xl">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <Label className="flex items-center gap-2">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      {label}
    </Label>
  );
}