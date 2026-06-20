import {
  Building2,
  CheckCircle2,
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
    <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
              COR_ETAPA[etapa.icone],
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
              concluida && "bg-success/15 text-success",
              andamento && "bg-primary/15 text-primary",
              !concluida && !andamento && "bg-muted text-muted-foreground",
            )}
          >
            {concluida ? "Concluída" : andamento ? "Em andamento" : "Pendente"}
          </span>
        </div>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Etapa {etapa.numero}
        </p>
        <h3 className="mt-1 text-base font-bold leading-snug text-foreground">{etapa.titulo}</h3>
        <p className="mt-1 text-xs font-medium text-primary">{etapa.subtitulo}</p>
        <p className="mt-3 flex-1 text-xs leading-relaxed text-muted-foreground">{etapa.descricao}</p>

        <div
          className={cn(
            "mt-4 rounded-xl border px-3 py-2.5 text-xs leading-relaxed",
            concluida && "border-success/30 bg-success/5 text-foreground",
            andamento && "border-primary/30 bg-primary/5 text-foreground",
            !concluida && !andamento && "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          {etapa.statusTexto}
        </div>
      </div>

      <div className="border-t border-border px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {concluida ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <CircleDashed className="h-4 w-4" />
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
        className="max-h-[95vh] max-w-6xl gap-0 overflow-hidden border-0 p-0 sm:rounded-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-deep via-primary to-primary-deep px-6 py-6 text-primary-foreground sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
                <Sparkles className="h-3.5 w-3.5" />
                Sua jornada CADBRASIL
              </span>
              <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
                {loading ? "Consultando cadastro..." : tituloDoc}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85">
                {loading
                  ? "Buscando o status do seu processo SICAF na base CADBRASIL."
                  : "Este documento já possui cadastro. Veja em qual etapa do processo SICAF sua empresa está e acesse o portal para continuar."}
              </p>
            </div>
          </div>

          {cliente && (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{cliente.razaoSocial}</p>
                  <p className="font-mono text-xs text-primary-foreground/75">
                    {docLabel}: {documentoMasked || cliente.documento}
                  </p>
                </div>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  {cliente.etapasConcluidas}/{cliente.totalEtapas} etapas
                </span>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs text-primary-foreground/80">
                  <span>Progresso geral</span>
                  <span>{progressoPct}%</span>
                </div>
                <Progress value={progressoPct} className="h-2 bg-white/20 [&>div]:bg-amber-400" />
              </div>

              {cliente.protocolo && (
                <p className="mt-3 font-mono text-xs text-primary-foreground/70">
                  Protocolo: {cliente.protocolo}
                </p>
              )}
            </>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto bg-muted/30 px-4 py-6 sm:px-6 sm:py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-4 text-sm">Carregando etapas do processo...</p>
            </div>
          ) : cliente ? (
            <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-stretch">
              {cliente.etapas.map((etapa, i) => (
                <div key={etapa.numero} className="flex min-w-0 flex-1 items-stretch gap-2 lg:gap-3">
                  <EtapaCard etapa={etapa} />
                  {i < cliente.etapas.length - 1 && (
                    <div className="hidden shrink-0 items-center lg:flex">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Não foi possível carregar os detalhes. Utilize o portal do fornecedor para acessar sua conta.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-4 border-t border-border bg-card px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {cliente && cliente.etapasConcluidas === cliente.totalEtapas ? (
              <>
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>Todas as etapas foram validadas</span>
              </>
            ) : (
              <>
                <CircleDashed className="h-4 w-4" />
                <span>Continue no portal para avançar nas próximas etapas</span>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" className="h-11" onClick={onInformarOutro}>
              Informar outro {docLabel}
            </Button>
            <Button asChild size="lg" className="h-12 px-8 text-base font-semibold shadow-lg">
              <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                Acessar Portal Fornecedor
                <ChevronRight className="ml-1 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
