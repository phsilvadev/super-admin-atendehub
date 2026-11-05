# AtendeHub — Superadministrador

Frontend exclusivo da plataforma, migrado de Vite/TanStack para Next.js 16 + React 19 + TypeScript. O design system original foi preservado. Login e listagem de empresas utilizam a API FastAPI real. Cadastro/edição de empresas não fazem parte desta entrega.

## Organização dos projetos

| Projeto | Pasta |
|---|---|
| Superadmin Next.js | `/workspace/super-admin-atendehub` |
| Backend FastAPI | `/workspace/atend-hub-backend-ZHNER7` |
| Painel das distribuidoras | `/workspace/consistent-design-system` |

O backend permanece no seu próprio repositório; não há cópia de código Python dentro do frontend. `src/app` contém rotas/layouts/BFF, `src/components` contém telas e componentes, `src/lib/auth` valida sessões no servidor e `src/lib/api` contém contratos/cliente de consulta. `legacy/vite-tanstack` preserva a implementação anterior, inclusive arquivos gerados sem alterações; não é compilada, publicada ou utilizada como fallback. Vite continua apenas como ferramenta do Vitest, não como runtime da aplicação.

## Execução local

Node.js 22+, npm e backend Python 3.12+ com dependências já instaladas.

```bash
npm ci
cp .env.example .env
npm run dev
```

Frontend em `http://localhost:3001`; backend em `http://127.0.0.1:8000`. Para servir o build: `npm run build` e `npm start`. `APP_ORIGIN` é obrigatório ao executar o build de produção e precisa ser a origem exata do painel. `BACKEND_URL` é exclusivo do servidor; nunca usar NEXT_PUBLIC nem enviar credenciais de integração ao navegador. Não há Docker nesta execução.

No repositório do backend:

```bash
.venv/bin/alembic upgrade head
.venv/bin/python -m app.cli.platform_admin --email seu-email@empresa.com.br --name "Seu nome"
.venv/bin/uvicorn app.main:app --reload --port 8000
```

A senha é solicitada interativamente; não há conta ou senha padrão. O backend precisa permitir explicitamente a origem `http://localhost:3001` em ALLOWED_ORIGINS (exemplo/default de desenvolvimento atualizados). Contas das distribuidoras não autenticam neste painel. Em produção: origem HTTPS explícita, COOKIE_SECURE e banco PostgreSQL conforme validação do backend.

## Segurança

- Proxy Next 16 (`src/proxy.ts`, equivalente ao middleware) confere a sessão com a API, sem confiar em cookie presente ou cabeçalhos do cliente.
- Layout protegido confere novamente a sessão no servidor; página Empresas tem conferência própria. Browser guard revalida ao focar e periodicamente, ocultando conteúdo em falhas e redirecionando sessões revogadas.
- BFF de mesma origem permite somente auth/login, auth/logout, auth/me e companies, com métodos explícitos. Não é proxy aberto para outras rotas da API.
- Somente o cookie `atendehub_platform_session` é encaminhado; a sessão de tenant é ignorada. Cookie HttpOnly/SameSite/Secure preservados; o BFF muda Path para `/` no frontend para permitir proteção das páginas. A API continua com cookie restrito ao seu prefixo de plataforma.
- POST exige Origin exato e JSON, limita corpo a 16 KiB e rejeita origem cross-site. FastAPI aplica sua própria validação de origem, autenticação, expiração e rate limiting.
- Headers no-store, nosniff, proteção contra frames, política de referência e restrições de formulários/objetos. Tokens não são guardados no localStorage nem retornados em JSON.
- Indisponibilidade da API não autoriza o acesso; proxy retorna 503 e demais camadas falham fechadas.

## Empresas — somente consulta

`GET /api/v1/platform/companies` retorna empresas reais, perfil comercial, administrador ativo, plano, status e datas. Há busca por nome/CNPJ/e-mail, filtro ativa/teste/teste encerrado/inativa, resumo global e paginação. Campos ausentes são apresentados como não informados. Datas usam America/Sao_Paulo. A data de cadastro vem do timestamp persistido no cadastro inicial da empresa (`trial_started_at`), que atualmente não possui fluxo de renovação.

A tela possui skeleton, erro/retry, vazio e layout responsivo com rolagem interna da tabela. Não há botões locais de cadastro/edição nem persistência simulada. Os demais módulos preservam os placeholders existentes e ainda dependem de implementação/instrumentação real; os indicadores do Dashboard não foram inventados.

## Validação

```bash
npm test
npm run lint
npm run build
BACKEND_SOURCE_DIR=/workspace/atend-hub-backend-ZHNER7 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e
```

E2E usa FastAPI real, migrations, plano seed e superadmin de teste em SQLite temporário nas portas 8400/3400; não usa o banco local nem cria credenciais reais. Capturas geradas em test-results usam dados exclusivamente de teste. Cobertura: login/logout, isolamento de identidades, sessão expirada/forjada/revogada, origem, restrição de rotas/métodos, busca, filtros, erro e mobile. Testes unitários verificam também falha fechada quando a API está indisponível.

Histórico Lovable preservado; alterações na branch development, sem reescrever main. Consulte CHECKLIST.md e ARCHITECTURE.md.
