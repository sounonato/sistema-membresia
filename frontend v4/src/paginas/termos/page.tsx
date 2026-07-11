export function TermosPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <a href="/" className="font-serif text-xl">
            Membresia<span className="text-amber-700">.</span>
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div className="border-b border-stone-300 pb-8">
          <p className="text-[10px] tracking-[0.3em] uppercase text-amber-700 mb-3">
            Documentação legal
          </p>
          <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight">
            Termos de Uso
          </h1>
          <p className="text-stone-500 text-sm mt-3">
            Última atualização: julho de 2026
          </p>
        </div>

        <div className="prose prose-stone max-w-none space-y-8 text-sm leading-relaxed text-stone-700">

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-stone-900 border-b border-stone-200 pb-2">
              1. Aceitação dos termos
            </h2>
            <p>
              Ao solicitar o cadastro e utilizar o Sistema Membresia, sua organização
              religiosa (doravante "Igreja") concorda com estes Termos de Uso. O uso
              contínuo da plataforma constitui aceitação de quaisquer atualizações.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-stone-900 border-b border-stone-200 pb-2">
              2. Descrição do serviço
            </h2>
            <p>
              O Sistema Membresia é uma plataforma de gestão ministerial que permite
              às igrejas registrar membros, acompanhar convertidos, organizar grupos
              de discipulado e gestionar ministérios. O sistema é disponibilizado como
              serviço (SaaS) mediante aprovação da solicitação de cadastro.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-stone-900 border-b border-stone-200 pb-2">
              3. Responsabilidades da Igreja
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Manter as credenciais de acesso em sigilo e comunicar imediatamente
                qualquer uso não autorizado.
              </li>
              <li>
                Cadastrar apenas dados de pessoas que consentiram com o tratamento
                de suas informações pessoais.
              </li>
              <li>
                Não utilizar a plataforma para fins ilícitos, difamatórios ou
                prejudiciais a terceiros.
              </li>
              <li>
                Manter os dados dos membros atualizados e remover dados de pessoas
                que solicitarem exclusão.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-stone-900 border-b border-stone-200 pb-2">
              4. Tratamento de dados pessoais (LGPD)
            </h2>
            <p>
              O Sistema Membresia atua como operador dos dados pessoais fornecidos
              pela Igreja, que permanece como controladora nos termos da Lei Geral de
              Proteção de Dados (Lei 13.709/2018).
            </p>
            <p>
              Os dados coletados (nome, telefone, e-mail, data de nascimento, endereço
              e informações religiosas) são utilizados exclusivamente para as finalidades
              da gestão ministerial da Igreja contratante.
            </p>
            <p>
              Os dados não são compartilhados com terceiros, exceto quando exigido por
              lei ou ordem judicial.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-stone-900 border-b border-stone-200 pb-2">
              5. Planos e pagamento
            </h2>
            <p>
              O plano Básico é gratuito e sujeito a limites de membros cadastrados.
              O plano Pro possui preço definido mediante contato e proporciona acesso
              ilimitado e suporte prioritário.
            </p>
            <p>
              O não pagamento das mensalidades do plano Pro pode resultar na suspensão
              do acesso, com dados retidos por 30 dias para recuperação.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-stone-900 border-b border-stone-200 pb-2">
              6. Disponibilidade e limitação de responsabilidade
            </h2>
            <p>
              Empenhamos esforços razoáveis para manter o sistema disponível, mas não
              garantimos disponibilidade ininterrupta. Não nos responsabilizamos por
              perdas decorrentes de indisponibilidade temporária.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-stone-900 border-b border-stone-200 pb-2">
              7. Cancelamento e exclusão de dados
            </h2>
            <p>
              A Igreja pode solicitar o cancelamento a qualquer momento. Após o
              cancelamento, os dados serão retidos por 30 dias para eventual
              recuperação e, após esse prazo, excluídos definitivamente.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-stone-900 border-b border-stone-200 pb-2">
              8. Contato
            </h2>
            <p>
              Para dúvidas, solicitações de exclusão de dados ou questões relacionadas
              a estes termos, entre em contato através do suporte disponível no sistema.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
