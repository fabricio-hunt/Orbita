# Orbita — Spec

> Converse com uma IA que consulta dados reais da SimilarWeb e responde em linguagem natural.

---

## Visão geral

Orbita é um chat inteligente que combina a API da Anthropic (Claude) com a API da SimilarWeb para permitir que qualquer pessoa faça perguntas sobre tráfego, audiência e performance de qualquer site — sem precisar entender de dashboards ou APIs.

**Exemplo de uso:**
```
Usuário: Quais são os principais concorrentes do notion.so?
Orbita:  Com base nos dados da SimilarWeb, os principais concorrentes do Notion são:
         Confluence (atlassian.com), Coda (coda.io), Obsidian (obsidian.md)...
```

---

## Problema que resolve

Ferramentas como SimilarWeb têm dashboards complexos com dezenas de métricas. Orbita transforma esse acesso em uma conversa simples — qualquer pessoa da equipe (produto, marketing, vendas) consegue obter insights sem treinamento.

---

## Stack técnica

| Camada          | Tecnologia                        | Justificativa                                 |
|-----------------|-----------------------------------|-----------------------------------------------|
| Frontend        | Next.js 14 (App Router)           | Full-stack, SSR, API Routes no mesmo projeto  |
| Linguagem       | TypeScript                        | Tipagem para os payloads das APIs externas    |
| Estilo          | Tailwind CSS                      | Utilitário, sem overhead de runtime           |
| Deploy          | Vercel                            | CI/CD automático, edge functions, analytics   |
| Banco de dados  | Neon (Postgres serverless)        | Serverless, escala a zero, compatível com ORM |
| ORM             | Drizzle ORM                       | Leve, type-safe, migrations simples           |
| Auth            | NextAuth.js                       | Login social (Google / GitHub) sem servidor   |
| Rate limiting   | Upstash Redis                     | Serverless, limita abuso por usuário          |
| Cache           | Upstash Redis                     | Cache de respostas SimilarWeb (TTL: 1h)       |
| IA              | Anthropic API (claude-sonnet)     | Raciocínio + tool use para orquestrar APIs    |
| Dados web       | SimilarWeb API                    | Fonte dos dados de tráfego e audiência        |

---

## Arquitetura

```
Browser (usuário)
    │
    ▼
Vercel — Next.js App
    ├── /app/page.tsx           → UI do chat (React)
    ├── /app/api/chat/route.ts  → Agente IA (loop de tool use)
    └── /app/api/auth/          → NextAuth
    │
    ├── Anthropic API           → Claude orquestra as chamadas
    ├── SimilarWeb API          → Dados reais de tráfego
    └── Neon Postgres           → Histórico de conversas + usuários
         │
         └── Upstash Redis      → Rate limit + cache de respostas
```

### Fluxo de uma mensagem

```
1. Usuário envia mensagem pelo chat
2. Frontend faz POST /api/chat com histórico da conversa
3. API Route checa rate limit (Upstash)
4. Claude recebe a mensagem + tools disponíveis
5. Claude decide qual endpoint da SimilarWeb chamar
6. API Route executa a chamada (verifica cache Redis primeiro)
7. Resultado volta para Claude → Claude gera resposta final
8. Resposta é salva no Neon e devolvida ao frontend
```

---

## Tools disponíveis para o agente

| Tool                   | Endpoint SimilarWeb                                        | Descrição                          |
|------------------------|------------------------------------------------------------|------------------------------------|
| `get_website_overview` | `/website/{domain}/total-traffic-and-engagement/visits`    | Visitas totais e engajamento       |
| `get_geo_distribution` | `/website/{domain}/geo/traffic-by-country`                 | Distribuição geográfica            |
| `get_similar_sites`    | `/website/{domain}/similar-sites`                          | Concorrentes e sites similares     |
| `get_global_rank`      | `/website/{domain}/global-rank`                            | Ranking global                     |
| `get_traffic_sources`  | `/website/{domain}/traffic-sources/overview`               | Fontes de tráfego (busca, social…) |

---

## Schema do banco de dados

```sql
-- Usuários autenticados
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  image      TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversas salvas
CREATE TABLE conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT,                       -- gerado automaticamente (primeiro turno)
  messages   JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Log de uso da SimilarWeb (para evitar chamadas redundantes)
CREATE TABLE api_calls (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  tool_name  TEXT NOT NULL,
  domain     TEXT NOT NULL,
  cached     BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Estrutura de pastas

```
orbita/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Chat UI principal
│   │   ├── layout.tsx                  # Layout raiz + providers
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts            # Endpoint do agente
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts        # NextAuth handler
│   │   └── history/
│   │       └── page.tsx                # Histórico de conversas
│   ├── components/
│   │   ├── Chat.tsx                    # Container do chat
│   │   ├── Message.tsx                 # Bolha de mensagem
│   │   ├── ToolBadge.tsx               # Indicador de tool use
│   │   └── Sidebar.tsx                 # Histórico lateral
│   └── lib/
│       ├── anthropic.ts                # Cliente + definição das tools
│       ├── similarweb.ts               # Wrapper da SimilarWeb API
│       ├── db.ts                       # Conexão Neon + schema Drizzle
│       ├── ratelimit.ts                # Upstash rate limiter
│       └── cache.ts                    # Upstash cache helper
├── drizzle/
│   └── migrations/                     # Migrations geradas pelo Drizzle Kit
├── .env.local.example                  # Template de variáveis de ambiente
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── spec.md                             # Este arquivo
└── README.md
```

---

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```bash
# IA
ANTHROPIC_API_KEY=sk-ant-...

# Dados web
SIMILARWEB_API_KEY=...

# Banco de dados (Neon)
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require

# Cache e rate limit (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Auth (NextAuth)
NEXTAUTH_URL=https://seu-app.vercel.app
NEXTAUTH_SECRET=                        # openssl rand -base64 32
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Como rodar localmente

```bash
# 1. Clone e instale
git clone https://github.com/seu-usuario/orbita.git
cd orbita
npm install

# 2. Configure as variáveis de ambiente
cp .env.local.example .env.local
# edite .env.local com suas chaves

# 3. Rode as migrations
npx drizzle-kit push

# 4. Inicie o servidor
npm run dev
# acesse http://localhost:3000
```

---

## Deploy (Vercel)

```bash
# Instale a CLI
npm i -g vercel

# Deploy inicial
vercel

# Adicione as variáveis de ambiente
vercel env add ANTHROPIC_API_KEY
vercel env add SIMILARWEB_API_KEY
vercel env add DATABASE_URL
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET

# Redeploy com as variáveis
vercel --prod
```

---

## Roadmap

### v1.0 — MVP
- [x] Agente conversacional com tool use
- [x] Integração SimilarWeb API
- [ ] Deploy Vercel + domínio público
- [x] Auth com Google (NextAuth)
- [x] Histórico de conversas no Neon
- [x] Rate limiting com Upstash

### v1.1 — Qualidade
- [ ] Streaming de respostas (SSE)
- [x] Cache inteligente de respostas SimilarWeb
- [ ] Tratamento de erros e limites do plano SimilarWeb
- [x] Testes de integração para as tools

### v1.2 — Multi-usuário
- [ ] Dashboard de uso por usuário
- [ ] Limite de créditos por conta
- [ ] Export de conversas (PDF / Markdown)
- [ ] Compartilhamento de análises via link

### v2.0 — Produto
- [ ] Planos de acesso (free / pro)
- [ ] Integração com outras fontes (SEMrush, Ahrefs)
- [ ] Alertas automáticos (ex: tráfego de concorrente subiu 30%)
- [ ] API pública para integrar em outros sistemas

---

## Limites e considerações

- **SimilarWeb API:** Os endpoints disponíveis dependem do plano contratado. Erros 403 indicam endpoint fora do plano.
- **Rate limit:** Por padrão, 20 mensagens por hora por usuário (configurável via Upstash).
- **Cache:** Respostas da SimilarWeb são cacheadas por 1 hora para economizar cota da API.
- **Segurança:** As chaves de API ficam exclusivamente em variáveis de ambiente do servidor — nunca expostas ao cliente.

---

## Licença

MIT — veja `LICENSE` para detalhes.

---

*Construído com Next.js, Anthropic Claude, SimilarWeb API e Neon Postgres.*