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
