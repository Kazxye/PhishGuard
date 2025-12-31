# PhishGuard

<div align="center">

![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Real-time phishing detection system with browser extension and REST API**

[Features](#features) • [Installation](#installation) • [API Reference](#api-reference) • [Extension](#browser-extension) • [Contributing](#contributing)

</div>

---

## Overview

PhishGuard is a multi-layer phishing detection system that analyzes URLs in real-time using five complementary detection techniques. It consists of a FastAPI backend service and a Chrome extension for seamless browser integration.

## Features

| Detection Method | Description |
|-----------------|-------------|
| **Homograph Detection** | Identifies Unicode characters that visually mimic ASCII letters (Cyrillic, Greek, etc.) |
| **Domain Age Analysis** | Queries WHOIS data to flag newly registered domains |
| **SSL Verification** | Validates certificate authenticity, expiration, and issuer |
| **Brand Impersonation** | Detects typosquatting and similarity to 80+ known brands |
| **Form Analysis** | Scans HTML for suspicious input patterns and external form actions |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Chrome Extension                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Content    │  │  Service    │  │      Popup UI           │  │
│  │  Script     │──│  Worker     │──│   (React + Tailwind)    │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │ REST API
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PhishGuard API                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     FastAPI                                │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────┐  │ │
│  │  │ Homograph │ │   WHOIS   │ │    SSL    │ │   Brand    │  │ │
│  │  │ Detector  │ │  Service  │ │  Checker  │ │  Matcher   │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └────────────┘  │ │
│  │  ┌───────────┐ ┌───────────┐ ┌──────────────────────────┐  │ │
│  │  │   Form    │ │   Risk    │ │     Cache Service        │  │ │
│  │  │ Analyzer  │ │Calculator │ │    (In-Memory + TTL)     │  │ │
│  │  └───────────┘ └───────────┘ └──────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

### Backend (API)

```bash
# Clone the repository
git clone https://github.com/yourusername/phishguard.git
cd phishguard/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Run the server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Using Docker

```bash
cd backend
docker build -t phishguard-api .
docker run -p 8000:8000 phishguard-api
```

## API Reference

### Health Check

```http
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Analyze URL

```http
POST /api/v1/analyze
Content-Type: application/json

{
  "url": "https://example.com",
  "html_content": "<html>...</html>"  // Optional
}
```

**Response:**
```json
{
  "url": "https://example.com",
  "domain": "example.com",
  "risk_level": "safe",
  "risk_score": 15,
  "homograph": {
    "has_homographs": false,
    "suspicious_characters": [],
    "score": 0
  },
  "domain_age": {
    "creation_date": "2015-03-14T00:00:00Z",
    "age_days": 3500,
    "is_new_domain": false,
    "score": 0
  },
  "ssl": {
    "has_ssl": true,
    "is_valid": true,
    "issuer": "DigiCert Inc",
    "score": 0
  },
  "brand_similarity": {
    "matches": [],
    "highest_similarity": 0.0,
    "is_suspicious": false,
    "score": 0
  },
  "recommendations": ["No significant threats detected."],
  "analyzed_at": "2024-01-01T12:00:00Z"
}
```

### Risk Levels

| Level | Score Range | Description |
|-------|-------------|-------------|
| `safe` | 0-19 | No significant threats detected |
| `low` | 20-39 | Minor anomalies, proceed with caution |
| `medium` | 40-59 | Multiple risk indicators present |
| `high` | 60-79 | Strong indicators of phishing |
| `critical` | 80-100 | Highly likely phishing attempt |

## Browser Extension

See [extension/README.md](extension/README.md) for installation and usage instructions.

### Quick Start

```bash
cd extension

# Install dependencies
npm install

# Generate icons (open in browser)
# Open public/icons/generate-icons.html and download the icons

# Build
npm run build

# Load in Chrome: chrome://extensions/ → Load unpacked → select dist/
```

### Extension Features

- 🔍 Real-time URL analysis on navigation
- 🎨 Color-coded badge (green/yellow/red)
- 🌙 Dark mode support
- 📋 History of last 10 analyses
- ✅ Whitelist for trusted domains
- 🔔 Notifications for high-risk sites
- 🚩 Report suspicious sites

## Development

### Running Tests

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_homograph.py -v
```

### Code Quality

```bash
# Format code
ruff format app tests

# Lint
ruff check app tests --fix
```

## Project Structure

```
phishguard/
├── backend/
│   ├── app/
│   │   ├── api/            # REST endpoints
│   │   ├── models/         # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── data/           # Static data (brands list)
│   ├── tests/              # Unit tests
│   ├── Dockerfile
│   └── requirements.txt
│
├── extension/              # Chrome extension
│   ├── src/
│   │   ├── background/     # Service worker
│   │   ├── content/        # DOM analyzer
│   │   └── popup/          # React UI
│   └── manifest.json
│
└── README.md
```

## Security Considerations

- The API does not store analyzed URLs or user data
- WHOIS queries are cached to prevent rate limiting abuse
- SSL certificate validation follows industry standards
- Brand matching uses local comparison (no external API calls)

## Roadmap

- [ ] Machine learning model for content analysis
- [ ] Firefox extension support
- [ ] Real-time threat feed integration
- [ ] Dashboard for threat analytics

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Built with security in mind</sub>
</div>
