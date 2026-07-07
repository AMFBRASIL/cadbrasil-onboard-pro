import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Gavel,
  Loader2,
  Rocket,
  Scale,
  Sparkles,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import type { ClienteExistenteDetalhe, EtapaSicaf } from "@/lib/cliente-consulta";
import { getPortalDocumentosUrl } from "@/lib/portal";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  loading?: boolean;
  cliente: ClienteExistenteDetalhe | null;
  documentoMasked: string;
  tipo: "pj" | "pf";
  onClose: () => void;
  onInformarOutro: () => void;
};

const ICONE_ETAPA = {
  rocket: Rocket,
  scale: Scale,
  gavel: Gavel,
} as const;

const COR_ETAPA = {
  rocket: "from-violet-500 to-purple-600",
  scale: "from-teal-500 to-emerald-600",
  gavel: "from-amber-500 to-orange-600",
} as const;

function EtapaCard({ etapa }: { etapa: EtapaSicaf }) {
  const Icon = ICONE_ETAPA[etapa.icone];
  const concluida = etapa.status === "concluida";
  const andamento = etapa.status === "em_andamento";

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-border bg-card shadow-sm sm:rounded-2xl xl:flex-1">
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-md sm:h-12 sm:w-12 sm:rounded-xl",
              COR_ETAPA[etapa.icone],
            )}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:px-2.5 sm:py-1 sm:text-[10px]",
              concluida && "bg-success/15 text-success",
              andamento && "bg-primary/15 text-primary",
              !concluida && !andamento && "bg-muted text-muted-foreground",
            )}
          >
            {concluida ? "Concluída" : andamento ? "Em andamento" : "Pendente"}
          </span>
        </div>

        <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:mt-4 sm:text-[11px]">
          Etapa {etapa.numero}
        </p>
        <h3 className="mt-0.5 text-sm font-bold leading-snug text-foreground sm:mt-1 sm:text-base">
          {etapa.titulo}
        </h3>
        <p className="mt-0.5 text-[11px] font-medium text-primary sm:mt-1 sm:text-xs">
          {etapa.subtitulo}
        </p>
        <p className="mt-2 flex-1 text-[11px] leading-relaxed text-muted-foreground sm:mt-3 sm:text-xs">
          {etapa.descricao}
        </p>

        <div
          className={cn(
            "mt-3 rounded-lg border px-3 py-2 text-[11px] leading-relaxed sm:mt-4 sm:rounded-xl sm:py-2.5 sm:text-xs",
            concluida && "border-success/30 bg-success/5 text-foreground",
            andamento && "border-primary/30 bg-primary/5 text-foreground",
            !concluida && !andamento && "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          {etapa.statusTexto}
        </div>
      </div>

      <div className="border-t border-border px-4 py-2.5 sm:px-5 sm:py-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground sm:text-xs">
          {concluida ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success sm:h-4 sm:w-4" />
          ) : (
            <CircleDashed className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          )}
          <span className="font-medium">{etapa.titulo}</span>
        </div>
      </div>
    </div>
  );
}

export function ClienteExistenteModal({
  open,
  loading,
  cliente,
  documentoMasked,
  tipo,
  onClose,
  onInformarOutro,
}: Props) {
  const portalUrl = getPortalDocumentosUrl();
  const progressoPct = cliente
    ? Math.round((cliente.etapasConcluidas / cliente.totalEtapas) * 100)
    : 0;
  const docLabel = tipo === "pf" ? "CPF" : "CNPJ";
  const tituloDoc = tipo === "pf" ? "CPF já cadastrado" : "CNPJ já cadastrado";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="flex max-h-[92dvh] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-0 overflow-hidden border-0 p-0 sm:max-h-[95vh] sm:w-full sm:rounded-2xl [&>button]:text-primary-foreground [&>button]:hover:text-white"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-br from-primary-deep via-primary to-primary-deep px-4 py-4 pr-12 text-primary-foreground sm:px-8 sm:py-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/80 sm:text-[11px] sm:tracking-[0.2em]">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Sua jornada CADBRASIL
            </span>
            <h2 className="mt-1.5 text-lg font-bold tracking-tight sm:mt-2 sm:text-2xl lg:text-3xl">
              {loading ? "Consultando cadastro..." : tituloDoc}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-primary-foreground/85 sm:mt-2 sm:max-w-2xl sm:text-sm">
              {loading
                ? "Buscando o status do seu processo SICAF na base CADBRASIL."
                : "Este documento já possui cadastro. Veja em qual etapa do processo SICAF sua empresa está e acesse o portal para continuar."}
            </p>
          </div>

          {cliente && (
            <>
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur-sm sm:mt-5 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 sm:h-10 sm:w-10">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{cliente.razaoSocial}</p>
                    <p className="font-mono text-[11px] text-primary-foreground/75 sm:text-xs">
                      {docLabel}: {documentoMasked || cliente.documento}
                    </p>
                  </div>
                </div>
                <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold sm:text-xs">
                  {cliente.etapasConcluidas}/{cliente.totalEtapas} etapas
                </span>
              </div>

              <div className="mt-3 sm:mt-4">
                <div className="mb-1 flex justify-between text-[11px] text-primary-foreground/80 sm:mb-1.5 sm:text-xs">
                  <span>Progresso geral</span>
                  <span>{progressoPct}%</span>
                </div>
                <Progress value={progressoPct} className="h-1.5 bg-white/20 sm:h-2 [&>div]:bg-amber-400" />
              </div>

              {cliente.protocolo && (
                <p className="mt-2 font-mono text-[10px] text-primary-foreground/70 sm:mt-3 sm:text-xs">
                  Protocolo: {cliente.protocolo}
                </p>
              )}
            </>
          )}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 px-3 py-4 sm:px-6 sm:py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground sm:py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary sm:h-10 sm:w-10" />
              <p className="mt-3 text-sm sm:mt-4">Carregando etapas do processo...</p>
            </div>
          ) : cliente ? (
            <div className="flex flex-col items-stretch gap-2 xl:flex-row xl:items-stretch xl:gap-3">
              {cliente.etapas.map((etapa, i) => (
                <div key={etapa.numero} className="contents">
                  <EtapaCard etapa={etapa} />
                  {i < cliente.etapas.length - 1 && (
                    <div className="flex shrink-0 items-center justify-center py-0.5 xl:py-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                        <ChevronDown className="h-4 w-4 text-muted-foreground xl:hidden" />
                        <ChevronRight className="hidden h-4 w-4 text-muted-foreground xl:block" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground sm:py-8">
              Não foi possível carregar os detalhes. Utilize o portal do fornecedor para acessar sua conta.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border bg-card px-3 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground sm:justify-start sm:text-left sm:text-xs">
              {cliente && cliente.etapasConcluidas === cliente.totalEtapas ? (
                <>
                  <Trophy className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>Todas as etapas foram validadas</span>
                </>
              ) : (
                <>
                  <CircleDashed className="h-4 w-4 shrink-0" />
                  <span>Continue no portal para avançar nas próximas etapas</span>
                </>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button variant="outline" className="h-11 w-full sm:w-auto" onClick={onInformarOutro}>
                Informar outro {docLabel}
              </Button>
              <Button asChild size="lg" className="h-11 w-full px-6 text-sm font-semibold shadow-lg sm:h-12 sm:w-auto sm:px-8 sm:text-base">
                <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                  Acessar Portal Fornecedor
                  <ChevronRight className="ml-1 h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
