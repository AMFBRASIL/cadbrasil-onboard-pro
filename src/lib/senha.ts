/**
 * Gera uma senha forte (uso no client, no botão "Gerar senha").
 * Garante ao menos 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.
 */
export function gerarSenhaForte(): string {
  const maiusculas = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const minusculas = "abcdefghijkmnpqrstuvwxyz";
  const numeros = "23456789";
  const especiais = "!@#$%&*";
  const todos = maiusculas + minusculas + numeros + especiais;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  let senha = pick(maiusculas) + pick(minusculas) + pick(numeros) + pick(especiais);
  for (let i = 0; i < 8; i++) senha += pick(todos);
  return senha
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
