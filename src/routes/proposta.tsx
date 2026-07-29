import { createFileRoute } from "@tanstack/react-router";

import {
  TopBar,
  Header,
  InstitutionalFooter,
  WhatsAppFloating,
} from "@/components/cadastro/LayoutParts";
import { PropostaConfigurador } from "@/components/proposta/PropostaConfigurador";
import { buildSeoHead } from "@/lib/seo";

const PATH = "/proposta";
const TITLE = "Monte sua proposta CADBRASIL — módulos e investimento anual";
const DESCRIPTION =
  "Configure sua proposta CADBRASIL: pacote padrão SICAF + gestores por R$ 985/ano e módulos opcionais de licitações, IA, contratos e análise completa.";

export const Route = createFileRoute("/proposta")({
  validateSearch: (search: Record<string, unknown>) => ({
    protocolo:
      typeof search.protocolo === "string" ? search.protocolo.trim() : undefined,
  }),
  head: () =>
    buildSeoHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      keywords:
        "proposta CADBRASIL, módulos licitações, SICAF, gestor de editais, leitor de licitações, IA edital",
      ogType: "website",
      abstract: DESCRIPTION,
    }),
  component: PropostaPage,
});

function PropostaPage() {
  const { protocolo } = Route.useSearch();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col">
      <TopBar />
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-8 lg:px-8">
        <PropostaConfigurador protocolo={protocolo} />
      </main>
      <InstitutionalFooter />
      <WhatsAppFloating />
    </div>
  );
}
