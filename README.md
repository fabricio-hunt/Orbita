# Orbita

> Chat with an AI that queries real SimilarWeb data and responds in natural language.

---

## Overview

Orbita is an intelligent chat application that combines the Anthropic API (Claude) with the SimilarWeb API, allowing anyone to ask questions about website traffic, audience, and performance—without needing to understand dashboards or APIs.

**Usage Example:**
```
User: What are the main competitors of notion.so?
Orbita: Based on SimilarWeb data, Notion's main competitors are:
         Confluence (atlassian.com), Coda (coda.io), Obsidian (obsidian.md)...
```

---

## The Problem It Solves

Tools like SimilarWeb offer complex dashboards with dozens of metrics. Orbita transforms this access into a simple conversation—anyone on the team (product, marketing, sales) can gain insights without prior training.

---

## Tech Stack

| Layer           | Technology                        | Justification                                 |
|-----------------|-----------------------------------|-----------------------------------------------|
| Frontend        | Next.js 14 (App Router)           | Full-stack, SSR, API Routes in one project    |
| Language        | TypeScript                        | Typing for external API payloads              |
| Styling         | Tailwind CSS                      | Utility-first, zero runtime overhead          |
| Deployment      | Vercel                            | Auto CI/CD, edge functions, analytics         |
| Database        | Neon (Serverless Postgres)        | Serverless, scales to zero, ORM compatible    |
| ORM             | Drizzle ORM                       | Lightweight, type-safe, simple migrations     |
| Auth            | NextAuth.js                       | Serverless social login (Google / GitHub)     |
| Rate Limiting   | Upstash Redis                     | Serverless, prevents abuse per user           |
| Cache           | Upstash Redis                     | SimilarWeb response cache (1h TTL)            |
| AI              | Anthropic API (claude-sonnet)     | Reasoning + tool use to orchestrate APIs      |
| Web Data        | SimilarWeb API                    | Source for traffic and audience data          |

---

## Architecture

```
Browser (user)
    │
    ▼
Vercel — Next.js App
    ├── /app/page.tsx           → Chat UI (React)
    ├── /app/api/chat/route.ts  → AI Agent (tool use loop)
    └── /app/api/auth/          → NextAuth
    │
    ├── Anthropic API           → Claude orchestrates API calls
    ├── SimilarWeb API          → Real traffic data
    └── Neon Postgres           → Chat history + users
         │
         └── Upstash Redis      → Rate limit + response caching
```

### Message Flow

```
1. User sends a message via chat
2. Frontend makes a POST request to /api/chat with conversation history
3. API Route checks rate limits (Upstash)
4. Claude receives the message + available tools
5. Claude decides which SimilarWeb endpoint to call
6. API Route executes the call (checks Redis cache first)
7. Result is returned to Claude → Claude generates the final response
8. Response is saved to Neon and returned to the frontend
```

---

## Available Agent Tools

| Tool                   | SimilarWeb Endpoint                                        | Description                        |
|------------------------|------------------------------------------------------------|------------------------------------|
| `get_website_overview` | `/website/{domain}/total-traffic-and-engagement/visits`    | Total visits and engagement        |
| `get_geo_distribution` | `/website/{domain}/geo/traffic-by-country`                 | Geographic distribution            |
| `get_similar_sites`    | `/website/{domain}/similar-sites`                          | Competitors and similar sites      |
| `get_global_rank`      | `/website/{domain}/global-rank`                            | Global ranking                     |
| `get_traffic_sources`  | `/website/{domain}/traffic-sources/overview`               | Traffic sources (search, social…)  |

---

## How to Run Locally

```bash
# 1. Clone and install
git clone https://github.com/your-username/orbita.git
cd orbita
npm install

# 2. Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# 3. Run database migrations
npx drizzle-kit push

# 4. Start the development server
npm run dev
# Access at http://localhost:3000
```

---

## Deployment (Vercel)

```bash
# Install CLI
npm i -g vercel

# Initial deployment
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
- [x] Conversational agent with tool use
- [x] SimilarWeb API integration
- [ ] Vercel deployment + public domain
- [x] Auth with Google (NextAuth)
- [ ] Chat history in Neon
- [x] Rate limiting with Upstash

### v1.1 — Quality
- [ ] Response streaming (SSE)
- [x] Smart caching of SimilarWeb responses
- [ ] Error handling and SimilarWeb plan limits
- [ ] Integration tests for tools

### v1.2 — Multi-user
- [ ] Usage dashboard per user
- [ ] Credit limits per account
- [ ] Export conversations (PDF / Markdown)
- [ ] Share analyses via link

### v2.0 — Product
- [ ] Access plans (free / pro)
- [ ] Integration with other sources (SEMrush, Ahrefs)
- [ ] Automated alerts (e.g., competitor traffic increased by 30%)
- [ ] Public API to integrate into other systems

---

## Limits and Considerations

- **SimilarWeb API:** The available endpoints depend on your contracted plan. 403 errors indicate an endpoint is outside the plan.
- **Rate limit:** By default, 20 messages per hour per user (configurable via Upstash).
- **Cache:** SimilarWeb responses are cached for 1 hour to save API quota.
- **Security:** API keys remain strictly in server environment variables—never exposed to the client.

---

## License

MIT — see `LICENSE` for details.

---

*Built with Next.js, Anthropic Claude, SimilarWeb API, and Neon Postgres.*
