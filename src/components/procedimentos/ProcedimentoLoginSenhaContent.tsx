import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

import { TopBar, Header } from "@/components/cadastro/LayoutParts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getPortalDocumentosUrl,
  getPortalEsqueciSenhaUrl,
  getPortalUrl,
} from "@/lib/portal";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const PASSOS_LOGIN = [
  {
    num: 1,
    title: "Acesse o Portal do Fornecedor",
    text: "Entre em fornecedor.cadbrasil.com.br e clique em entrar / fazer login.",
  },
  {
    num: 2,
    title: "Informe seu e-mail de acesso",
    text: "Use o mesmo e-mail cadastrado na etapa de credenciamento ou informado no protocolo de boas-vindas.",
  },
  {
    num: 3,
    title: "Digite sua senha",
    text: "A senha foi definida por você durante o cadastro, na etapa “Acesso ao Portal”.",
  },
  {
    num: 4,
    title: "Pronto — você está no painel",
    text: "Após o login, envie documentos, acompanhe o SICAF e utilize os recursos da plataforma.",
  },
];

const PASSOS_RECUPERAR = [
  {
    num: 1,
    title: 'Clique em "Esqueci minha senha"',
    text: "Na tela de login do portal, localize o link Esqueci minha senha (ou acesse diretamente a página de recuperação).",
  },
  {
    num: 2,
    title: "Informe o e-mail cadastrado",
    text: "Digite o e-mail de acesso da sua conta. Você receberá as instruções para redefinir a senha.",
  },
  {
    num: 3,
    title: "Siga o link recebido por e-mail",
    text: "Abra a mensagem enviada pela CADBRASIL e crie uma nova senha seguindo as orientações.",
  },
  {
    num: 4,
    title: "Entre novamente no portal",
    text: "Com a nova senha, faça login normalmente e continue seu credenciamento.",
  },
];

function PassosLista({
  passos,
  className,
}: {
  passos: { num: number; title: string; text: string }[];
  className?: string;
}) {
  return (
    <ol className={cn("space-y-4", className)}>
      {passos.map((passo) => (
        <li
          key={passo.num}
          className="flex gap-4 rounded-lg border border-border bg-card p-4"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {passo.num}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{passo.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{passo.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ProcedimentoLoginSenhaContent() {
  const portalLoginUrl = getPortalDocumentosUrl();
  const portalEsqueciSenhaUrl = getPortalEsqueciSenhaUrl();
  const portalUrl = getPortalUrl();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary-deep via-primary to-primary-deep text-primary-foreground">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(60rem 30rem at 80% -10%, white, transparent)",
            }}
          />
          <div className="relative mx-auto max-w-5xl px-4 py-14 text-center lg:px-8 lg:py-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
              <KeyRound className="h-3.5 w-3.5" />
              Acesso ao portal
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight lg:text-4xl">
              Login e senha no Portal CADBRASIL
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/85 lg:text-lg">
              Orientações para entrar na plataforma e recuperar sua senha com segurança.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 bg-white px-8 text-primary hover:bg-white/90"
              >
                <a href={portalLoginUrl} target="_blank" rel="noopener noreferrer">
                  <LogIn className="mr-2 h-4 w-4" />
                  Acessar o portal
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/40 bg-white/10 px-8 text-primary-foreground hover:bg-white/20"
              >
                <a href={portalEsqueciSenhaUrl} target="_blank" rel="noopener noreferrer">
                  Esqueci minha senha
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <section>
              <div className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Como fazer login</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Use as credenciais criadas durante o cadastro inicial neste site.
              </p>
              <PassosLista passos={PASSOS_LOGIN} className="mt-6" />
            </section>

            <section>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Esqueceu a senha?</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Se tiver dúvida ou não lembrar da senha, utilize a recuperação oficial no portal.
              </p>
              <PassosLista passos={PASSOS_RECUPERAR} className="mt-6" />
            </section>
          </div>

          <div className="mt-12 overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary-soft/50 to-card shadow-sm">
            <div className="border-b border-primary/15 bg-primary-deep/5 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Dúvida sobre login ou senha?
                  </p>
                  <h3 className="mt-0.5 text-lg font-bold text-foreground">
                    Clique em &quot;Esqueci minha senha&quot; no portal
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    A recuperação de senha é feita exclusivamente pelo Portal do Fornecedor CADBRASIL.
                    Não é necessário ligar ou enviar e-mail — basta acessar a página oficial de
                    recuperação e seguir as instruções enviadas para o seu e-mail cadastrado.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  Link oficial:{" "}
                  <span className="font-medium text-foreground">{portalEsqueciSenhaUrl}</span>
                </span>
              </p>
              <Button asChild size="lg" className="shrink-0 px-8">
                <a href={portalEsqueciSenhaUrl} target="_blank" rel="noopener noreferrer">
                  Ir para Esqueci minha senha
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-warning/40 bg-warning/5 p-5">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-warning-foreground" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Ainda não tem cadastro?</p>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  O login do portal só funciona após concluir o credenciamento inicial. Se você ainda
                  não se cadastrou, inicie pelo formulário oficial e crie sua senha na etapa
                  &quot;Acesso ao Portal&quot;.
                </p>
                <Button asChild variant="link" className="mt-2 h-auto p-0 text-primary">
                  <Link to="/">
                    Iniciar cadastro
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Portal:{" "}
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              {portalUrl}
            </a>
          </p>
        </div>
      </main>

      <footer className="border-t border-border bg-primary-deep text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center lg:px-8">
          <p className="text-sm text-primary-foreground/75">
            © {new Date().getFullYear()} {SITE_NAME}. Procedimento de login e senha.
          </p>
          <p className="mt-2 text-xs text-primary-foreground/55">
            {SITE_URL}/procedimento-login-senha
          </p>
        </div>
      </footer>
    </div>
  );
}
