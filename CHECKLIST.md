# Superadmin AtendeHub — Next.js

- [x] Clonar/analisar Vite/TanStack e preservar fonte anterior em legacy.
- [x] Migrar rotas para App Router e preservar componentes/design system.
- [x] Criar login de plataforma, BFF, proxy (middleware Next 16) e proteção no servidor.
- [x] Listar empresas reais: busca, filtros, paginação, loading/erro/vazio; somente consulta.
- [x] Testar login/logout, sessão expirada/forjada, rejeição de tenant, origem e indisponibilidade.
- [x] Validar desktop/mobile e gerar prints.

Frontend: /workspace/super-admin-atendehub. Backend separado: /workspace/atend-hub-backend-ZHNER7. Nenhum Docker. Telas ainda não integradas conservam seu estado de desenvolvimento, sem dados fictícios em produção.

Validação: 11 testes Vitest, build, lint e cenário E2E com API real aprovados. API Python: 60 testes Pytest aprovados. Verificados cookies HttpOnly/Path, logout/replay, sessão expirada/forjada, conta de tenant, cabeçalhos de bypass, origem, allowlist, busca/filtros, erro/retry e mobile. Prints desktop/mobile atualizados. Nenhum Docker ou conta real criada; E2E usa SQLite temporário.

## Pendências futuras
- [ ] Integrar indicadores reais do Dashboard.
- [ ] Implementar telas de importação/revisão da base comum usando APIs existentes.
- [ ] Integrar planos, consumo de IA, auditoria e configurações.
- [ ] Cadastro/edição/ativação de empresas, quando solicitado.
- [ ] Hospedagem, HTTPS e configuração de produção.

Roadmap completo dos módulos SaaS: CHECKLIST.md do repositório Atend-hub-backend. Este arquivo acompanha o recorte do frontend superadmin.

### Proteção antirrobô antes da hospedagem
- [x] Validar Turnstile no backend em cadastro/login do cliente e login da plataforma; preservar rate limiting.
- [x] Integrar widget nos três formulários com expiração, erro e renovação do token.
- [x] Testar bloqueios, replay, modo de teste e gerar prints.
- [ ] Configurar chaves reais/domínios autorizados e publicar no Railway após validar produção — chaves reais/origens/variáveis já configuradas e PostgreSQL ativo; bloqueio atual: autorizar o aplicativo Railway nos três repositórios GitHub.

Validação antirrobô: 138 Pytest, 109 Vitest do cliente e 15 do superadmin aprovados; builds dos dois Next e E2E de cliente/superadmin aprovados com widget e Siteverify oficiais usando par público de TESTE. Testes backend sem modo dummy cobrem host/action incorretos, token ausente, replay persistente, expiração, indisponibilidade e senha ainda obrigatória. Cadastro e login do cliente funcionam; senha incorreta renova o desafio; login da plataforma funciona e recusa POST sem token. Prints desktop/mobile gerados; dados somente em SQLite temporário. Produção não aceita modo/chaves de teste e nenhum deploy Railway foi iniciado sem as chaves reais. Segredo fica somente no backend.

Preparação Railway: projeto privado AtendeHub criado, ambiente production e serviços vazios api/cliente/superadmin com domínios reservados. Ainda sem fonte/deployment; banco/variáveis de produção e chaves Turnstile reais pendentes. Endereços de cliente/superadmin informados para cadastro no widget. Plano técnico em docs/RAILWAY.md do backend.

Preparação Railway atualizada: chaves reais do Turnstile exclusivas do backend, APP_ORIGIN HTTPS, BACKEND_URL pela rede privada, porta PORT e railway.toml/.railwayignore configurados. PostgreSQL com volume e deployment SUCCESS. Publicação deste frontend pendente: Railway informa User does not have access to the repo mesmo após conectar a conta; aguardando permissão da instalação GitHub. Nenhuma aplicação foi declarada publicada.

### Publicação concluída via CLI
- [x] Autenticar a conta com créditos e publicar o código local no serviço existente.
- [x] Observar status SUCCESS e HTTP 200 no login/configuração antirrobô.
- [x] Gerar prints desktop/mobile de produção e validar ausência de overflow.
- [ ] Validar login real com confirmação humana do Turnstile (widget interativo renderizado).
- [ ] Habilitar autodeploy GitHub se/quando a autorização de fonte estiver disponível.

Publicado em https://superadmin-production-3d47.up.railway.app/login; API pela rede privada, Turnstile real ativado sem modo dummy. Login sem token e origem não autorizada foram recusados. Upload direto não depende do GitHub e novos pushes não publicam automaticamente. Não foram criados usuários comerciais fictícios.

### Login conforme referência visual
- [x] Aplicar composição em moldura arredondada, painel visual e formulário; preservar cores/tokens, autenticação e Turnstile; sem login social; gerar prints e validar.

Validação em 09/11/2026: build/TypeScript, ESLint dos arquivos alterados, 15 Vitest e dois E2E existentes aprovados (autenticação/isolamento com API/SQLite reais e desafio Cloudflare com chaves oficiais de teste). Prints desktop/mobile gerados. Tokens de cores globais e contratos de autenticação preservados; sem botão Google/cadastro público. Alteração local, sem push ou publicação.

### Correção de largura do acesso
- [x] Remover fundo/margem escuros e limite de largura no login, ocupar janela completa; validar localmente.
- [ ] Publicar a correção de largura no Railway e confirmar no navegador.

Build/TypeScript e E2E de autenticação/isolamento aprovados em 1920x1080; bounding box do container confirmada em x=0/y=0 e largura igual à área útil da janela. Mantidas as cores do painel e o Turnstile.
