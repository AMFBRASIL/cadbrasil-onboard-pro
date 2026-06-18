import { Button } from "@/components/ui/button";
import {
  BadgeCheck,
  FileCheck2,
  CheckCircle2,
} from "lucide-react";
import { TopBar, Header } from "@/components/cadastro/LayoutParts";

export const Route = createFileRoute("/conclusao-cadastro")({
  head: () => ({
    meta: [
      { title: "Credenciamento Recebido — CADBRASIL" },
      { name: "description", content: "Seu credenciamento foi protocolado com sucesso na plataforma CADBRASIL." },
    ],
  }),
  component: ConclusaoCadastroPage,
});

function ConclusaoCadastroPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-lg animate-scale-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 ring-8 ring-success/5">
            <BadgeCheck className="h-10 w-10 text-success" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
            Credenciamento Recebido com Sucesso
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Seu processo foi encaminhado para análise da equipe especializada da CADBRASIL. Você receberá atualizações por email institucional.
          </p>

          <div className="mx-auto mt-6 inline-flex items-center gap-3 rounded-lg border border-border bg-primary-soft/40 px-5 py-3 text-left">
            <FileCheck2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Número do Processo</p>
              <p className="font-mono text-base font-semibold text-primary-deep">CAD-2026-00001254</p>
            </div>
          </div>

          <ul className="mx-auto mt-8 max-w-md space-y-2 text-left text-sm">
            {["Análise documental", "Validação cadastral", "Liberação da plataforma", "Início do acompanhamento SICAF"].map((s) => (
              <li key={s} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" /> {s}
              </li>
            ))}
          </ul>

          <Button className="mt-8 h-11 bg-primary px-6 hover:bg-primary-deep">
            Acessar Portal do Fornecedor
          </Button>
        </div>
      </main>
    </div>
  );
}
