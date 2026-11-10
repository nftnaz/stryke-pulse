# Stryke Pulse

**NSE F&O Market Intelligence Dashboard** — inspired by Tredye, powered by Upstox + AI4Finance (FinGPT / FinRobot / FinRL).

Modern analytics for Indian futures & options traders: Market Pulse, Options flow, OI walls, sector rotation, AI commentary, and more.

Domain: strykepulse.com (or your chosen variant)

## Stack

- **Backend**: FastAPI
- **Frontend**: Jinja2 + HTMX + Tailwind (fast iteration)
- **Data**: Upstox Analysis APIs (PCR, Max Pain, OI, FII/DII) + public sources
- **AI**: FinRobot agents + FinGPT + Groq / Ollama (RAG + multi-agent research)
- **Future**: MCP tools, FinRL strategy lab, production deploy

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Add your UPSTOX_ACCESS_TOKEN and optional GROQ_API_KEY

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open http://localhost:8000

Without an Upstox token the UI runs on realistic mock data so you can develop immediately.

## Project layout

```
stryke-pulse/
├── app/
│   ├── main.py
│   ├── core/config.py
│   ├── routers/
│   ├── services/          # Upstox client, Pulse, Options, AI analyst
│   ├── models/
│   ├── templates/
│   └── static/
├── rag/                   # FinGPT / vector store
├── mcp/                   # Model Context Protocol tools
├── scripts/
└── data/
```

## Roadmap

- [x] Project skeleton + Pulse endpoint + UI
- [ ] Live Upstox quotes + Options (PCR / Max Pain / OI walls)
- [ ] FinRobot / FinGPT AI Analyst panel
- [ ] Screeners, Radar, more tabs
- [ ] MCP server
- [ ] Deploy

## Disclaimer

Educational and analytical tool only. Not investment advice. Data may be delayed or incomplete. Always do your own research and manage risk.

---

Built for Indian F&O traders.
