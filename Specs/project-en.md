Here’s the English version of your spec:

---

# Orbita — Spec

> Chat with an AI that queries real data from SimilarWeb and responds in natural language.

---

## Overview

Orbita is an intelligent chat that combines the Anthropic API (Claude) with the SimilarWeb API to allow anyone to ask questions about traffic, audience, and performance of any website — without needing to understand dashboards or APIs.

**Example usage:**

```
User: What are the main competitors of notion.so?
Orbita: Based on SimilarWeb data, Notion’s main competitors are:
        Confluence (atlassian.com), Coda (coda.io), Obsidian (obsidian.md)...
```

---

## Problem it solves

Tools like SimilarWeb have complex dashboards with dozens of metrics. Orbita turns this into a simple conversation — anyone on the team (product, marketing, sales) can get insights without training.

---

## Tech stack

| Layer         | Technology                    | Rationale                                     |
| ------------- | ----------------------------- | --------------------------------------------- |
| Frontend      | Next.js 14 (App Router)       | Full-stack, SSR, API routes in same project   |
| Language      | TypeScript                    | Type safety for external API payloads         |
| Styling       | Tailwind CSS                  | Utility-first, no runtime overhead            |
| Deployment    | Vercel                        | Automatic CI/CD, edge functions, analytics    |
| Database      | Neon (serverless Postgres)    | Serverless, scales to zero, ORM-compatible    |
| ORM           | Drizzle ORM                   | Lightweight, type-safe, simple migrations     |
| Auth          | NextAuth.js                   | Social login (Google / GitHub) without server |
| Rate limiting | Upstash Redis                 | Serverless, prevents abuse per user           |
| Cache         | Upstash Redis                 | Cache SimilarWeb responses (TTL: 1h)          |
| AI            | Anthropic API (claude-sonnet) | Reasoning + tool use to orchestrate APIs      |
| Web data      | SimilarWeb API                | Source of traffic and audience data           |

---

## Architecture

```
Browser (user)
    │
    ▼
Vercel — Next.js App
    ├── /app/page.tsx           → Chat UI (React)
    ├── /app/api/chat/route.ts  → AI agent (tool-use loop)
    └── /app/api/auth/          → NextAuth
    │
    ├── Anthropic API           → Claude orchestrates calls
    ├── SimilarWeb API          → Real traffic data
    └── Neon Postgres           → Conversations + users
         │
         └── Upstash Redis      → Rate limit + response cache
```

### Message flow

```
1. User sends a message via chat
2. Frontend sends POST /api/chat with conversation history
3. API Route checks rate limit (Upstash)
4. Claude receives the message + available tools
5. Claude decides which SimilarWeb endpoint to call
6. API Route executes the call (checks Redis cache first)
7. Result returns to Claude → Claude generates final answer
8. Response is saved in Neon and returned to frontend
```

---

## Tools available to the agent

| Tool                   | SimilarWeb Endpoint                                     | Description                       |
| ---------------------- | ------------------------------------------------------- | --------------------------------- |
| `get_website_overview` | `/website/{domain}/total-traffic-and-engagement/visits` | Total visits and engagement       |
| `get_geo_distribution` | `/website/{domain}/geo/traffic-by-country`              | Geographic distribution           |
| `get_similar_sites`    | `/website/{domain}/similar-sites`                       | Competitors and similar websites  |
| `get_global_rank`      | `/website/{domain}/global-rank`                         | Global ranking                    |
| `get_traffic_sources`  | `/website/{domain}/traffic-sources/overview`            | Traffic sources (search, social…) |

---

## Database schema

```sql
-- Authenticated users
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  image      TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved conversations
CREATE TABLE conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT,                       -- auto-generated (first message)
  messages   JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SimilarWeb usage log (to avoid redundant calls)
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

## Folder structure

```
orbita/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Main chat UI
│   │   ├── layout.tsx                  # Root layout + providers
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts            # Agent endpoint
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts        # NextAuth handler
│   │   └── history/
│   │       └── page.tsx                # Conversation history
│   ├── components/
│   │   ├── Chat.tsx                    # Chat container
│   │   ├── Message.tsx                 # Message bubble
│   │   ├── ToolBadge.tsx               # Tool usage indicator
│   │   └── Sidebar.tsx                 # Sidebar history
│   └── lib/
│       ├── anthropic.ts                # Client + tool definitions
│       ├── similarweb.ts               # SimilarWeb API wrapper
│       ├── db.ts                       # Neon + Drizzle schema
│       ├── ratelimit.ts                # Upstash rate limiter
│       └── cache.ts                    # Upstash cache helper
├── drizzle/
│   └── migrations/                     # Drizzle Kit migrations
├── .env.local.example                 # Environment template
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── spec.md                            # This file
└── README.md
```

---

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# AI
ANTHROPIC_API_KEY=sk-ant-...

# Web data
SIMILARWEB_API_KEY=...

# Database (Neon)
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require

# Cache and rate limit (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Auth (NextAuth)
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=                        # openssl rand -base64 32
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Running locally

```bash
# 1. Clone and install
git clone https://github.com/your-username/orbita.git
cd orbita
npm install

# 2. Configure environment variables
cp .env.local.example .env.local
# edit .env.local with your keys

# 3. Run migrations
npx drizzle-kit push

# 4. Start server
npm run dev
# open http://localhost:3000
```

---

## Deployment (Vercel)

```bash
# Install CLI
npm i -g vercel

# Initial deploy
vercel

# Add environment variables
vercel env add ANTHROPIC_API_KEY
vercel env add SIMILARWEB_API_KEY
vercel env add DATABASE_URL
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET

# Redeploy with variables
vercel --prod
```

---

## Roadmap

### v1.0 — MVP

* [x] Conversational agent with tool use
* [x] SimilarWeb API integration
* [ ] Vercel deployment + public domain
* [ ] Google Auth (NextAuth)
* [ ] Conversation history in Neon
* [ ] Rate limiting with Upstash

### v1.1 — Quality

* [ ] Streaming responses (SSE)
* [ ] Smart caching for SimilarWeb responses
* [ ] Error handling and SimilarWeb plan limits
* [ ] Integration tests for tools

### v1.2 — Multi-user

* [ ] Per-user usage dashboard
* [ ] Credit limits per account
* [ ] Export conversations (PDF / Markdown)
* [ ] Share analysis via link

### v2.0 — Product

* [ ] Pricing plans (free / pro)
* [ ] Integrations with other sources (SEMrush, Ahrefs)
* [ ] Automated alerts (e.g., competitor traffic +30%)
* [ ] Public API for external integrations

---

## Limits and considerations

* **SimilarWeb API:** Available endpoints depend on your plan. 403 errors indicate restricted endpoints.
* **Rate limit:** Default is 20 messages per hour per user (configurable via Upstash).
* **Cache:** SimilarWeb responses are cached for 1 hour to reduce API usage.
* **Security:** API keys are stored only in server environment variables — never exposed to the client.

---



*Built with Next.js, Anthropic Claude, SimilarWeb API, and Neon Postgres.*
