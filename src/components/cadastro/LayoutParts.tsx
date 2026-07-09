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
              Credenciamento Nacional de Fornecedores
            </p>
            <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">
              CADBRASIL Oficial ®
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

export function InstitutionalFooter() {
  return (
    <footer className="mt-10 border-t border-border bg-muted/20 py-8 text-xs text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3 items-start">
          <div>
            <p className="text-sm font-bold tracking-tight text-foreground">CADBRASIL</p>
            <p className="mt-2 max-w-xs leading-relaxed">
              Plataforma privada de credenciamento e assessoria para licitações públicas. Sem vínculo com órgãos governamentais.
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Conformidade</p>
            <p className="mt-2 leading-relaxed">
              LGPD · Lei 13.709/2018 · Dados criptografados em trânsito e em repouso.
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">Suporte institucional</p>
            <p className="mt-2 leading-relaxed">
              <a href="mailto:privacidade@cadbrasil.com.br" className="hover:text-primary hover:underline">privacidade@cadbrasil.com.br</a>
              <span className="mx-1">·</span>
              <a href="tel:551121220202" className="hover:text-primary hover:underline">(11) 2122-0202</a>
            </p>
            <p className="mt-2 text-[11px]">© 2026 CADBRASIL · Todos os direitos reservados</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppFloating() {
  return (
    <a
      href="https://wa.me/551121220202?text=Ol%C3%A1%2C+estou+na+p%C3%A1gina+de+cadastro+da+CADBRASIL+e+preciso+de+suporte."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 hover:shadow-xl"
      aria-label="Suporte via WhatsApp"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

