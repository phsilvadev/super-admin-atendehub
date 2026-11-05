# Arquitetura — AtendeHub Superadmin

## Estrutura

```text
src/
  app/                    # App Router: públicas, grupo protegido e BFF
    login/
    (protected)/          # Layout exige identidade platform_admin
      empresas/           # Somente listagem
    api/platform/         # Allowlist de endpoints; não aceita destino arbitrário
  components/
    auth/                 # Login e revalidação no navegador
    screens/              # Empresas e telas migradas
    ui/                   # Design system original
  lib/
    auth/                 # Cookie, contratos e validação com FastAPI (server-only)
    api/                  # Cliente e schemas da listagem
  proxy.ts                # Middleware Next.js 16
legacy/vite-tanstack/      # Referência original, fora da compilação/runtime
scripts/                  # Backend temporário para E2E
```

Frontend e backend são projetos separados. Next usa BFF para não expor endereço/credenciais de backend ao browser. A sessão é validada na API (banco de sessões da plataforma) e de novo nas fronteiras de renderização; role de empresa não substitui identidade de plataforma. A sessão nunca é inferida apenas do valor do cookie.

O cookie de backend tem Path=/api/v1/platform, incompatível com páginas como /empresas. O BFF aceita apenas Set-Cookie do nome esperado e preserva atributos de segurança ao mudar Path=/ no host do frontend. Não há Domain compartilhado adicionado. Cookie de tenant não é encaminhado. Origem de mutações é validada em ambas as aplicações; URLs de redirecionamento após login/logout são fixas.

A listagem exige platform_context no FastAPI. Consulta somente campos necessários: cadastro da empresa, perfil, nome do plano e primeiro administrador ativo em ordem alfabética. Não permite impersonar, editar ou criar empresas. Busca/paginação são processadas no servidor; resumo independe dos filtros. A leitura global é auditada sem copiar dados pessoais para o evento. Indisponibilidade ou resposta inválida não entrega conteúdo protegido.

O Dashboard e os outros módulos ainda mantêm o visual/estado vazio original. Importações/base comum e integrações operacionais não foram ampliadas nesta entrega. A aplicação é Next.js; a versão anterior foi arquivada sem editar arquivos com cabeçalho de geração automática. A solicitação explícita de migração substitui as convenções antigas de TanStack que só se aplicam ao código arquivado.
