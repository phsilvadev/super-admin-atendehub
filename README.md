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

### Verificação antirrobô
Os formulários públicos de autenticação usam Cloudflare Turnstile; a API valida o token antes de criar sessões/empresas. A configuração pública é carregada em runtime pelo BFF; nenhuma chave secreta fica neste frontend. Tokens expiram e são renovados após cada tentativa. Falha de script/configuração não libera envio. O backend possui instruções completas em `docs/ANTIBOT.md`; modo de teste local não deve ser publicado.

Teste de navegador com widget/Siteverify oficiais e chaves públicas de teste:
```bash
BACKEND_SOURCE_DIR=../Atend-hub-backend E2E_TURNSTILE_TEST=1 npm run test:e2e -- e2e/turnstile.spec.ts
```
Produção no Railway depende de chaves reais, hostnames, HTTPS/APP_ORIGIN e backend PostgreSQL validados.

Publicado em https://superadmin-production-3d47.up.railway.app/login. Deploy direto pelo CLI autenticado na conta com créditos; atualizar com railway up apontando explicitamente projeto/ambiente/serviço. Instruções/IDs em docs/RAILWAY.md do backend. Autodeploy GitHub ainda não vinculado. Turnstile de produção exige confirmação humana.

### Layout de acesso

Login alinhado à referência visual, mantendo a paleta atual e o Turnstile. Área ocupa toda a janela, sem fundo preto externo nem limite de 1600px. Não há login social no superadmin. Deployment ffa90106-3b32-481b-be3a-b4659925a1a8 confirmado em SUCCESS, com validação desktop de 1920x1080.

## Base de conhecimento
`/base-conhecimento` tem Biblioteca, Importações e Revisão, integradas ao backend. O menu lateral tem somente Base de conhecimento; a importação é uma aba interna. A URL antiga `/importacoes` redireciona para `/base-conhecimento?tab=imports`. É necessário autenticar com uma conta de superadministrador; sessões das distribuidoras não dão acesso.

- Biblioteca: busca textual em título/texto/fonte, filtros de tipo/categoria/status, paginação no banco; indicadores removidos desta tela.
- Conteúdo: criação e edição de texto com categoria/fonte; versões imutáveis, proteção por versão concorrente, publicação após três confirmações e nota de revisão, desativação confirmada.
- Importação: seleção/arrastar JSON, modelo para download, referência de autorização, termos para remoção, resultado tratado, histórico e atalhos para revisão. De 2 a 200 mensagens, até 3.000 caracteres por mensagem e corpo de até 512 KiB. `messages` contém `role: customer|agent` e `text`. O request_id é reutilizado ao repetir o mesmo envio após falha de rede.
- Skeletons, estados vazios, erros/retry, sessão expirada e layouts desktop/mobile incluídos. Textos são renderizados como texto, sem HTML executável.

Nenhum conteúdo é publicado automaticamente. A remoção de identificadores é assistida e exige revisão humana. TXT/ZIP do WhatsApp, PDF, políticas privadas de empresas, embeddings e respostas de IA não estão incluídos. Teste integrado: `npx playwright test e2e/knowledge.spec.ts` (API real com SQLite temporário; não executa Docker nem integrações externas).

Prévia visual de 10/11/2026: a aba Importações reúne arquivo e autorização no mesmo painel, com rodapé de envio e histórico acessível pelo botão Histórico de importações em um modal lateral direito. Mantém o fluxo JSON e as confirmações existentes; em telas menores os blocos ficam empilhados e o painel de histórico ocupa a largura da tela. O histórico possui rolagem interna, paginação fixa, fundo desfocado e fechamento por Escape com retorno de foco ao botão. Validada com o E2E da biblioteca, build/TypeScript e lint. Esta revisão visual está local até sua publicação.

## Configurações de plataforma
`/configuracoes` possui abas OpenAI e Administradores integradas ao BFF e à API real.
- Qualquer superadmin ativo pode gerenciar/testar a credencial OpenAI, confirmando a própria senha. Chave write-only, sem localStorage e sem NEXT_PUBLIC; criptografia e diagnóstico ficam no backend. O formulário informa armazenamento não configurado e diferencia salvar credencial de testar acesso. O diagnóstico não gera respostas nem valida saldo.
- Gestão de administradores com busca/paginação, cadastro, edição e desativação confirmada. O primeiro admin tem indicação de conta protegida, sem ação de edição para outras contas. Ele edita a si mesmo; sua desativação é proibida. A API também aplica todas as regras, inclusive chamadas diretas, e revoga sessões quando necessário.
- Skeletons, erros/retry, confirmações de senha e layout mobile. `/scripts/start-e2e-backend.py` gera uma chave mestra descartável apenas para SQLite temporário, sem credencial real OpenAI. Teste: `npx playwright test e2e/platform-settings.spec.ts`. O contrato do provedor é testado no backend com HTTP simulado; o E2E não chama OpenAI com chave fictícia.

A API exige a migration `20261110_platform_settings` e `PLATFORM_CREDENTIAL_KEY` configurada somente no backend. A chave real OpenAI deve ser informada pelo formulário; validação real pendente até cadastrá-la. A configuração não habilita automaticamente IA comercial ou suporte.

OpenAI após cadastro: a configuração salva abre em resumo com modelo, credencial protegida, estado do acesso e último teste. O formulário aparece apenas no cadastro/edição; cancelar descarta alterações locais. Teste/remoção pedem senha em modal. Salvar a chave não equivale a conexão validada: estados separados mostram chave salva, teste confirmado ou falha de acesso. O resumo é carregado da API também após recarregar a página.

## Consumo de IA
`/consumo-ia` agora usa dados da API de plataforma: filtros por período/empresa/usuário/modelo/status/cálculo, atualização a cada30s, tokens/cache, gasto estimado em USD, cobertura das medições, ranking por empresa e chamadas paginadas. Não acessa conteúdo das conversas nem credenciais. Custos desconhecidos são indicados; o total calculável é subtotal se houver pendências.

A aba Tarifas mostra USD/1M tokens e permite cadastrar vigências com fonte oficial, confirmação de senha e aplicação opcional a registros sem preço. Tarifas já usadas não são editadas nem sobrescrevem valores históricos. O painel representa chamadas instrumentadas da plataforma (hoje suporte); não é a fatura OpenAI, não inclui uso externo nem inventa câmbio. Registros antigos sem cache/modalidade são identificados como estimativas. Requer migration20261110_ai_usage. Teste: `npx playwright test e2e/ai-usage.spec.ts` (dados financeiros fictícios apenas em SQLite temporário, nunca na produção).
