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
- [x] Publicar a correção de largura no Railway e confirmar no navegador.

Build/TypeScript e E2E de autenticação/isolamento aprovados em 1920x1080; bounding box do container confirmada em x=0/y=0 e largura igual à área útil da janela. Mantidas as cores do painel e o Turnstile.

Publicado no Railway: ffa90106-3b32-481b-be3a-b4659925a1a8 em SUCCESS. Commit c829998 em origin/development. Confirmação real do navegador em 1920x1080: HTTP 200, container x=0/y=0/largura 1920; cantos externos brancos. Login social ausente, cores atuais preservadas, Turnstile real enabled=true/testing=false. Print de produção gerado sem dados de acesso preenchidos. Trello e layouts concluídos.

### Moldura branca e altura responsiva
- [x] Recuar somente painel colorido em 8px sobre fundo branco; adaptar alturas/espaçamentos a notebook e manter campos/Turnstile acessíveis. Build, TypeScript e E2E responsivo aprovados: notebook 1366x768, login 1366x650, desktop 1920x1080 e mobile 390x844. Turnstile representado por widget de 65px no teste de geometria, sem envio de autenticação.

### Base de conhecimento — implementação
- [x] Biblioteca conectada, importação JSON autorizada, revisão/publicação/desativação com versões; filtros/paginação no servidor, skeletons, erro/retry e conflitos. Build/TypeScript, lint, 20 Vitest e E2E de ponta a ponta com API/SQLite reais aprovados; regressão de autenticação/isolamento aprovada. Prints desktop/mobile gerados com dados apenas de teste.

Publicado: commit 3038bb6, Railway 41c70529-adb5-4fa7-9aaf-83b774eae8fd em SUCCESS; API 5d179377-5388-4089-a744-def48bc8441f em SUCCESS. Prints mostram o fluxo com API real e SQLite temporário, sem dados demonstrativos inseridos na produção. TXT/PDF e consulta por IA continuam pendentes.

### Simplificação da base de conhecimento
- [x] Remover indicadores e entrada duplicada Importações do menu lateral; manter a aba interna e redirecionar a URL antiga para /base-conhecimento?tab=imports. Build/TypeScript, lint e E2E do fluxo completo aprovados; prints desktop/mobile atualizados.

### Padrão visual de importação — 10/11/2026
- [x] Unificar o formulário em um painel com arquivo e autorização alinhados, histórico abaixo em listagem e responsividade. Build/TypeScript, lint e E2E completo com API/SQLite reais aprovados; prints desktop/mobile gerados. Prévia local, sem push ou publicação nesta etapa.

### Histórico em painel lateral — 10/11/2026
- [x] Mover histórico para modal lateral direito com botão, fundo desfocado, rolagem interna e paginação fixa. Testados abertura, seleção de resultado, Escape/restauração de foco e largura mobile no E2E real; build/TypeScript/lint aprovados. Prints desktop/mobile gerados. Prévia local, sem push/publicação.

### Configurações da plataforma — OpenAI e administradores
- [x] Integrar abas OpenAI e Administradores com cadastro/edição/desativação e proteção do primeiro admin; qualquer superadmin gerencia OpenAI. Build/TypeScript/lint, 24 Vitest e E2E real API/SQLite de configurações e autenticação/isolamento aprovados; prints desktop/mobile gerados. Código local, sem push/publicação. Chave real OpenAI e diagnóstico externo pendentes.


Publicação em 10/11/2026: push development concluído nos três repositórios (API 6c609a1, cliente 3af6530, superadmin 9b49a06). Railway API 44c36254-c40c-44dc-8602-3da17b50484b, cliente c7ca8ff9-1a45-486a-9fc9-2643cf3a7635 e superadmin 5cf06c23-ce22-4086-a848-3d816a7e820f em SUCCESS. Readiness API e logins dos frontends HTTP200; configuração sem sessão401. Chave mestra de armazenamento configurada no ambiente protegido do backend, sem expor valor. Chave OpenAI real e validação externa pendentes de cadastro pelo formulário. Incluídos histórico lateral de importações e indicadores da central no Dashboard.

### OpenAI — estado após cadastro
- [x] Mostrar resumo persistido após salvar/recarregar, separar chave salva de conexão validada/falha, recolher formulário em edição e pedir senha em modal para testar/remover. Build/TypeScript, lint e E2E API/SQLite real aprovados; diagnóstico de provedor simulado apenas no teste visual, sem chamada com chave fictícia. Prints gerados.
