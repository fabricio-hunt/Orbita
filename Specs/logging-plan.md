# Especificação de Logs — Orbita

Este documento detalha a estratégia de observabilidade e auditoria da aplicação.

## 1. Logs de Aplicação (Pino)

Utilizado para monitoramento em tempo real e depuração.

- **Biblioteca:** `pino`
- **Formato:** JSON (estruturado) para produção, texto legível (`pino-pretty`) para desenvolvimento.
- **Níveis de Log:**
  - `info`: Fluxo normal da aplicação (ex: "Requisição recebida").
  - `warn`: Comportamentos inesperados mas não fatais (ex: "Cache miss no Redis").
  - `error`: Falhas críticas (ex: "Erro ao conectar com a API da SimilarWeb").

### Implementação Sugerida
Criar `src/lib/logger.ts` para centralizar a instância do logger.

---

## 2. Logs de Auditoria (Banco de Dados)

Utilizado para histórico permanente, métricas de consumo e suporte ao usuário.

### Tabela: `system_logs`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `user_id` | UUID | Relacionamento com usuário (se aplicável) |
| `event` | TEXT | Nome do evento (ex: `api_call`, `auth_success`) |
| `metadata` | JSONB | Dados extras (payload da API, status code, tokens) |
| `created_at` | TIMESTAMP | Data/hora do evento |

### Casos de Uso
- Monitorar quantos créditos da SimilarWeb cada usuário está consumindo.
- Rastrear erros recorrentes em turnos específicos do chat.

---

## 3. Logs de Requisições (Middleware)

Capturar automaticamente todas as interações com os endpoints `/api/*`.

- **Dados capturados:** Path, Method, Status Code, Latência.

---

## Próximos Passos
1. [x] Configurar `src/lib/logger.ts`.
2. [x] Adicionar `system_logs` ao schema do Drizzle em `src/lib/db.ts`.
3. [x] Implementar middleware de logs para as API Routes.
