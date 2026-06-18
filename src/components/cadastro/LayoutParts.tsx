import {
  ShieldCheck,
  Lock,
  FileCheck2,
  HeadphonesIcon,
  Landmark,
} from "lucide-react";

export function TopBar() {
  return (
    <div className="border-b border-border bg-primary-deep text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs lg:px-8">
        <div className="flex items-center gap-2">
          <Landmark className="h-3.5 w-3.5" />
          <span>Plataforma oficial de credenciamento de fornecedores</span>
        </div>
        <div className="hidden items-center gap-4 sm:flex">
          <span>Ouvidoria</span>
          <span>Acessibilidade</span>
          <span>Alto contraste</span>
        </div>
      </div>
    </div>
  );
}

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <Logo />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              CADBRASIL
            </p>
            <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">
              Credenciamento Nacional de Fornecedores
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Regularize sua empresa para participação em licitações públicas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center lg:gap-2">
          <Seal icon={ShieldCheck} label="Ambiente Seguro" />
          <Seal icon={Lock} label="LGPD" />
          <Seal icon={FileCheck2} label="SSL" />
          <Seal icon={HeadphonesIcon} label="Processo Assistido" />
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary-deep text-primary-foreground shadow-sm">
      <Landmark className="h-6 w-6" />
    </div>
  );
}

function Seal({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-primary-soft/50 px-3 py-2 text-xs font-medium text-primary-deep">
      <Icon className="h-3.5 w-3.5 text-success" /> {label}
    </div>
  );
}
