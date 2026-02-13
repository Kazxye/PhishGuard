# PhishGuard

<div align="center">

<!-- Replace with your generated banner image -->
<!-- ![PhishGuard Banner](docs/banner.png) -->

![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![VirusTotal](https://img.shields.io/badge/VirusTotal-Integrated-394EFF?style=for-the-badge&logo=virustotal&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Multi-layer phishing detection system with real-time browser protection and threat intelligence**

[Features](#features) · [Architecture](#architecture) · [Getting Started](#getting-started) · [API Reference](#api-reference) · [Extension](#browser-extension) · [Configuration](#configuration)

</div>

---

## Overview

PhishGuard is a real-time phishing detection platform that combines six complementary analysis techniques to identify malicious websites. It consists of a high-performance **FastAPI** backend running concurrent analysis pipelines and a **Chrome extension** that provides seamless, automatic protection during browsing.

The system evaluates URLs through multiple security layers simultaneously — from Unicode homograph attacks to global threat intelligence via VirusTotal — producing a weighted risk score that reflects the combined findings of all engines.

## Features

### Detection Engines

| Engine | Weight | Description |
|--------|--------|-------------|
| **Homograph Detection** | 20% | Identifies Unicode characters (Cyrillic, Greek, fullwidth) that visually mimic ASCII letters in domain names |
| **Domain Age Analysis** | 10% | Queries WHOIS data to flag newly registered domains, a common indicator of phishing campaigns |
| **SSL Verification** | 10% | Validates certificate authenticity, expiration, issuer reputation, and encryption status |
| **Brand Impersonation** | 25% | Detects typosquatting using Levenshtein distance against 80+ known brands with leet-speak substitution |
| **Form Analysis** | 10% | Scans page HTML for suspicious input patterns, external form actions, and credential harvesting |
| **VirusTotal** | 25% | Cross-references URLs against 70+ security engines for global threat intelligence |

Weights are dynamically redistributed when optional engines (Form Analysis, VirusTotal) are unavailable. Combo multipliers amplify the score when multiple engines flag the same URL.

### Extension

- Real-time URL analysis on every navigation
- Color-coded badge with risk score (green/yellow/orange/red)
- Dark mode with 8 customizable accent themes
- Analysis history (last 10 sites)
- Domain whitelist management
- Browser notifications for high-risk sites
- Report suspicious sites
- Configurable backend URL

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Chrome Extension (MV3)                        │
│                                                                      │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────────────┐  │
│  │   Content     │  │   Service     │  │       Popup UI            │  │
│  │   Script      │──│   Worker      │──│   (React + Tailwind)      │  │
│  │ (DOM Extract) │  │ (Orchestrator)│  │                           │  │
│  └──────────────┘  └───────┬───────┘  └───────────────────────────┘  │
└────────────────────────────┼─────────────────────────────────────────┘
                             │ REST API (async)
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       PhishGuard API (FastAPI)                        │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    asyncio.gather (parallel)                    │  │
│  │                                                                │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐  │  │
│  │  │ Homograph │ │   WHOIS   │ │    SSL    │ │    Brand      │  │  │
│  │  │ Detector  │ │  Service  │ │  Checker  │ │   Matcher     │  │  │
│  │  │  (sync*)  │ │  (sync*)  │ │  (sync*)  │ │   (sync*)     │  │  │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────────┘  │  │
│  │  ┌───────────┐ ┌───────────┐                                  │  │
│  │  │   Form    │ │ VirusTotal│  * = wrapped in asyncio.to_thread │  │
│  │  │ Analyzer  │ │  (async)  │                                  │  │
│  │  │  (sync*)  │ │  (httpx)  │                                  │  │
│  │  └───────────┘ └───────────┘                                  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────┐  ┌──────────────────────────────────────────┐    │
│  │     Risk      │  │          Cache Service                    │    │
│  │  Calculator   │  │  (In-Memory + TTL per service)            │    │
│  └───────────────┘  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

All detection engines run concurrently via `asyncio.gather`. Synchronous services (WHOIS, SSL, Homograph, Brand) are offloaded to threads with `asyncio.to_thread`, while VirusTotal uses native async HTTP via `httpx`. This reduces total response time to the duration of the slowest engine rather than the sum of all.

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- Google Chrome
- VirusTotal API key ([free registration](https://www.virustotal.com/gui/join-us)) — optional but recommended

### Backend

```bash
git clone https://github.com/Kazxye/PhishGuard.git
cd PhishGuard/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Linux/macOS
.\venv\Scripts\Activate.ps1     # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your VIRUSTOTAL_API_KEY

# Start the server
uvicorn app.main:app --reload
```

API available at `http://localhost:8000` | Swagger docs at `http://localhost:8000/docs`

### Chrome Extension

```bash
cd PhishGuard/extension

npm install
npm run build
```

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder

The extension will automatically analyze every HTTP/HTTPS page you visit.

### Docker

```bash
cd backend
docker build -t phishguard-api .
docker run -p 8000:8000 --env-file .env phishguard-api
```

## Configuration

All settings are managed through environment variables in `backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `VIRUSTOTAL_API_KEY` | _(empty)_ | VirusTotal API key. Leave empty to disable VT engine |
| `VIRUSTOTAL_TIMEOUT` | `10` | Timeout in seconds for VT API calls |
| `DOMAIN_AGE_THRESHOLD_DAYS` | `30` | Domains newer than this are flagged |
| `SIMILARITY_THRESHOLD` | `0.75` | Minimum Levenshtein ratio to flag brand similarity |
| `WHOIS_TIMEOUT` | `10` | Timeout for WHOIS queries |
| `SSL_TIMEOUT` | `5` | Timeout for SSL certificate checks |
| `CACHE_TTL_WHOIS` | `3600` | WHOIS cache duration (seconds) |
| `CACHE_TTL_SSL` | `300` | SSL cache duration (seconds) |
| `CACHE_TTL_VIRUSTOTAL` | `900` | VirusTotal cache duration (seconds) |
| `CORS_ORIGINS_STR` | `*` | Allowed CORS origins (comma-separated) |

## API Reference

### Analyze URL

```http
POST /api/v1/analyze
Content-Type: application/json
```

```json
{
  "url": "https://example.com",
  "html_content": "<html>...</html>"
}
```

The `html_content` field is optional. When provided (automatically by the Chrome extension content script), it enables the Form Analysis engine.

### Risk Levels

| Level | Score | Description |
|-------|-------|-------------|
| `safe` | 0-19 | No significant threats detected |
| `low` | 20-39 | Minor anomalies, proceed with caution |
| `medium` | 40-59 | Multiple risk indicators present |
| `high` | 60-79 | Strong indicators of phishing |
| `critical` | 80-100 | Highly likely phishing attempt |

### Other Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Service health check |
| `GET` | `/api/v1/brands` | List monitored brands and categories |

Full interactive documentation available at `/docs` (Swagger) or `/redoc`.

## Project Structure

```
PhishGuard/
├── backend/
│   ├── app/
│   │   ├── api/                  # REST endpoints
│   │   │   └── routes.py         # Async analysis pipeline
│   │   ├── models/
│   │   │   └── schemas.py        # Pydantic models (request/response)
│   │   ├── services/
│   │   │   ├── homograph_detector.py
│   │   │   ├── whois_service.py
│   │   │   ├── ssl_checker.py
│   │   │   ├── brand_matcher.py
│   │   │   ├── form_analyzer.py
│   │   │   ├── virustotal_service.py
│   │   │   ├── risk_calculator.py
│   │   │   └── cache_service.py
│   │   ├── data/
│   │   │   └── known_brands.py   # 80+ brand definitions
│   │   ├── config.py             # Pydantic settings
│   │   └── main.py               # App factory
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── extension/
│   ├── src/
│   │   ├── background/           # Service worker (analysis orchestration)
│   │   ├── content/              # DOM analyzer (form extraction)
│   │   ├── popup/                # React UI (gauge, history, settings)
│   │   └── shared/               # Types, API client, storage, constants
│   ├── public/
│   │   └── manifest.json         # Chrome MV3 manifest
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## Development

### Running Tests

```bash
cd backend
pip install -r requirements-dev.txt

pytest --cov=app --cov-report=html
pytest tests/test_homograph.py -v
```

### Code Quality

```bash
ruff format app tests
ruff check app tests --fix
```

## Security Considerations

- No URL or user data is persisted — all analysis is stateless
- WHOIS, SSL, and VirusTotal responses are cached in-memory with TTL to prevent rate limiting
- SSL validation follows industry standards via Python ssl module
- Brand matching runs locally with no external API calls
- VirusTotal integration uses API key authentication over HTTPS
- The extension requests minimal Chrome permissions

## Roadmap

- [ ] Machine learning model for content classification
- [ ] Firefox extension (WebExtensions API)
- [ ] Internationalization (PT-BR / EN)
- [ ] Threat analytics dashboard
- [ ] Blocklist with custom block page
- [ ] Report endpoint with persistence

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with security in mind**

[Report a Bug](https://github.com/Kazxye/PhishGuard/issues) · [Request a Feature](https://github.com/Kazxye/PhishGuard/issues)

</div>
