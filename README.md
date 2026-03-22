# 🛡️ TruMonix — Smart Transaction Surveillance

> **Zero-Trust Financial Fraud Detection System** | DBMS Mini Project | NNM Institute of Technology

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://postgresql.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker)](https://docker.com)

---

## 📌 Overview

TruMonix is an adaptive, Zero-Trust based **transaction monitoring and fraud detection system** designed to enhance financial security through intelligent risk evaluation. Every transaction is treated as potentially risky and evaluated across multiple behavioral, contextual, and rule-based dimensions in real time.

**Tech Stack:**
- **Backend:** FastAPI + PostgreSQL + SQLAlchemy
- **Frontend:** React 18 + Tailwind CSS + Recharts
- **Auth:** JWT with Role-Based Access Control (RBAC)
- **Deploy:** Docker Compose + Nginx

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
git clone https://github.com/yourusername/trumonix.git
cd trumonix

# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Build & launch
docker-compose up --build
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs

---

### Option 2: Manual Setup

#### 1. PostgreSQL Database

```bash
psql -U postgres
CREATE DATABASE xyz;
CREATE USER trumonix WITH PASSWORD 'xyz';
GRANT ALL PRIVILEGES ON DATABASE xyz TO xyz;
\q
```

#### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env          # edit DATABASE_URL if needed
uvicorn app.main:app --reload --port 8000
```

#### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---



> The admin account is **auto-seeded** on first backend startup.

---

## 🧠 Risk Engine

The risk engine scores every transaction from **0–100** across 9 dimensions:

| Risk Factor | Description | Max Weight |
|-------------|-------------|-----------|
| `HIGH_VALUE_TRANSACTION` | Amount ≥ $10,000 | +25 |
| `EXTREME_AMOUNT_DEVIATION` | 10× historical average | +30 |
| `HIGH_RISK_MERCHANT_CATEGORY` | Crypto, Gambling, Forex, etc. | +20 |
| `HIGH_TRANSACTION_FREQUENCY` | ≥5 transactions/hour | +20 |
| `VELOCITY_AMOUNT_EXCEEDED` | >$20K total in 1 hour | +20 |
| `UNKNOWN_DEVICE` | New device ID | +15 |
| `LOCATION_ANOMALY` | New location | +15 |
| `ODD_TRANSACTION_HOURS` | 00:00–05:00 UTC | +10 |
| `FIRST_TRANSACTION` | No history baseline | +5 |

**Decision thresholds:**
- Score **0–29** → ✅ `APPROVED`
- Score **30–69** → ⚠️ `FLAGGED` (admin review)
- Score **70–100** → 🚫 `BLOCKED`

---

## 📡 API Endpoints

### Auth
```
POST /api/v1/auth/register
POST /api/v1/auth/login
```

### Transactions
```
POST   /api/v1/transactions/          # Submit transaction
GET    /api/v1/transactions/my        # My transactions (paginated)
GET    /api/v1/transactions/my/summary
GET    /api/v1/transactions/all       # Admin: all transactions
GET    /api/v1/transactions/{id}
PATCH  /api/v1/transactions/{id}/review  # Admin: approve/block
```

### Analytics (Admin)
```
GET /api/v1/analytics/overview
GET /api/v1/analytics/risk-distribution
GET /api/v1/analytics/top-risk-factors
GET /api/v1/analytics/recent-alerts
```

---

## 🗄️ Database Schema

```
users               — User accounts with behavioral profile
  └─ transactions   — Transaction records with risk scores & factors
       └─ audit_logs — Immutable action log for compliance
```

Key design decisions:
- **Normalized to 3NF** — no data redundancy
- **Indexed** on user_id, status, created_at for fast queries
- **JSON column** for flexible risk_factors storage
- **Immutable audit_logs** — append-only compliance trail

---

## 🌐 Deployment (Production)

### Render.com
1. Create a **PostgreSQL** service → copy `DATABASE_URL`
2. Create a **Web Service** for backend → set env vars, start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Create a **Static Site** for frontend → build command: `npm run build`, publish dir: `dist`

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
---

## 📄 License

This project is academic and intended for educational use.
