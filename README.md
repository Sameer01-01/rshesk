# Wind Forecast Monitor (UK National Desk — January 2026)

[![Live Web Application](https://img.shields.io/badge/Live%20App-windforecast--phi.vercel.app-0284c7?style=for-the-badge&logo=vercel)](https://windforecast-phi.vercel.app/)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-blue?style=flat-square&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-Passing-success?style=flat-square)](https://github.com)

---

## 🌐 Live Production Application
> ### 🔗 **[https://windforecast-phi.vercel.app/](https://windforecast-phi.vercel.app/)**
> **Interactive Live Dashboard** featuring real UK Elexon BMRS market data, point-in-time forecast selection, empirical error analysis, vintage curve evolution, and interactive light/dark theme switching.

- **Frontend Deployment**: [https://windforecast-phi.vercel.app/](https://windforecast-phi.vercel.app/) (Hosted on Vercel CDN)
- **API Health Check**: `http://localhost:8000/api/health` (or your deployed cloud backend URL)
- **Interactive OpenAPI Documentation**: `http://localhost:8000/docs` (Swagger UI) & `http://localhost:8000/redoc`

---

## 📌 Executive Summary & Business Context

In the UK wholesale electricity market, energy utility trading desks must decide — one day before delivery (**day D-1**) — how much electricity to procure from thermal generators, interconnector auctions, and spot markets to meet consumer demand. Because wind output is weather-dependent and volatile, power procurement strategies rely heavily on National Grid wind generation forecasts.

When wind output is **over-forecasted**, the utility under-procures thermal/hedged power and is forced to purchase emergency replacement power on the real-time Balancing Mechanism at potentially astronomical cash-out imbalance prices. Conversely, when wind is **under-forecasted**, the utility over-procures thermal generation and must dump surplus energy at distress prices.

**Wind Forecast Monitor** is an institutional-grade decision-support and accuracy evaluation platform that solves this operational challenge. It enforces **strict zero look-ahead bias** by isolating the exact wind generation forecasts that were published before the day-ahead gate closure (default **09:00 UTC on D-1**). It quantifies empirical balancing errors (MAE, RMSE, systematic bias, and P90/P95 error reserve buffers), assesses horizon accuracy degradation up to 48 hours, profiles diurnal errors, and allows traders to inspect the evolution of forecast vintages over time.

---

## 🌓 Key Platform Features

- **🌓 Dynamic Light & Dark Mode**: One-click animated theme switcher (persisted to `localStorage`) with custom CSS tokens, frosted glass cards, glow effects, and adaptive chart palettes.
- **🛡️ Zero Look-Ahead Gate Closure Filtering**: Automatically computes the exact point-in-time forecast cutoff for every single settlement day:
  $$\text{Cutoff}(T) = \text{Date}(T) - 1\text{ day at } 09:00\text{ UTC}$$
  Ensures no forecast produced after the trader committed their day-ahead position is ever evaluated.
- **⚡ Fixed Horizon Mode**: Toggle between Day-Ahead Decision Mode and Fixed Lead-Time Mode (from 1 hour to 48 hours ahead) to analyze short-term vs medium-term forecast skill.
- **📈 Comprehensive Headline Error Metrics**:
  - **Mean Absolute Error (MAE)** & **Normalized MAE (% of mean generation)**
  - **Root Mean Square Error (RMSE)** (penalizing large extreme forecast misses)
  - **Net Bias / Mean Signed Error** (identifying systematic over- or under-forecasting)
  - **sMAPE (Symmetric Mean Absolute Percentage Error)**
  - **Forecast Skill Score** evaluated against a Naive Persistence Baseline:
    $$\text{Skill Score} = 1 - \frac{\text{MAE}_{\text{forecast}}}{\text{MAE}_{\text{persistence}}}$$
  - **P90 & P95 Error Risk Buffers** (recommended reserve MW margins to hedge forecast tail risk)
- **📊 Interactive Data Visualizations (Recharts)**:
  - **Main Comparison Chart**: Actual vs. Forecasted generation with empirical P5–P95 confidence envelope, signed error area, and brush slider.
  - **Error Distribution & Timeline**: Signed error histogram and hourly time series.
  - **Horizon Degradation Curve**: Tracks how MAE, RMSE, and Bias worsen as lead time increases from 1h to 48h.
  - **Diurnal & Generation-Level Breakdown**: Reveals intraday error profiles (morning vs evening peaks) and performance across low (<5GW), medium (5-12GW), and high (>12GW) wind output regimes.
  - **Forecast Vintage Explorer**: Select any target delivery hour and visualize how every successive forecast run published over the preceding 72 hours converged towards actual outturn.
- **📋 Daily Operational Summary Table**: Sortable, filterable table of daily metrics with one-click **CSV Export**.
- **💡 Rule-Based Automated Insights Panel**: Dynamic market insights highlighting bias direction, peak error periods, and hedging recommendations.

---

## 📊 January 2026 Key Empirical Findings

All metrics computed across all **744 hourly target periods** in January 2026 using official Elexon BMRS data with the standard 09:00 UTC day-ahead cutoff:

| Metric | Empirical Value | Trading Desk Implication |
|---|---|---|
| **Mean Actual Generation** | **11,581.11 MW** | Baseline UK wind fleet output |
| **Mean Decision Forecast** | **13,432.64 MW** | Expected wind fleet output at decision gate |
| **Net Bias (Signed Error)** | **+1,851.53 MW** | **Systematic Over-Forecast**: Forecast was higher than reality on average |
| **Mean Absolute Error (MAE)** | **2,127.48 MW** | Average volumetric imbalance per hour |
| **Normalized MAE** | **18.37%** | MAE relative to average generation |
| **Root Mean Square Error (RMSE)** | **2,606.07 MW** | Elevated due to volatile wind ramp events |
| **sMAPE** | **18.72%** | Symmetric relative percentage error |
| **Skill Score vs. Persistence** | **+44.7%** | Day-ahead forecast substantially outperforms naive persistence |
| **P90 Reserve Buffer** | **±4,306.40 MW** | 90% of hours had error within this margin |
| **Empirical 90% Envelope (P5–P95)**| **[-1,038.65 MW, +5,350.90 MW]** | Asymmetric skew toward over-forecasting |
| **Horizon Degradation (0h → 48h)** | **1,794 MW → 2,380 MW (+32.6%)** | Uncertainty escalates predictably with lead time |

---

## 🗄️ Real Data Source & Quality Assurance

This application uses **genuine, verified UK National Energy Market Data** ingested from the official **Elexon BMRS API** (`https://data.elexon.co.uk/bmrs/api/v1`):

1. **Actual Wind Generation (`FUELHH`)**:
   - **Endpoint**: `/datasets/FUELHH/stream` (`fuelType=WIND`)
   - **Resolution**: Half-hourly (30-min).
   - **January 2026 Outturns**: **1,488 records** (31 days × 48 settlement periods). 100% complete, 0 missing intervals, 0 nulls.
   - **Fleet Range**: Min **1,695 MW** (calm periods) to Max **17,805 MW** (winter storms).

2. **Wind Generation Forecasts (`WINDFOR`)**:
   - **Endpoint**: `/datasets/WINDFOR/stream`
   - **Resolution**: Hourly intervals (top-of-hour).
   - **Publication Window**: Published continuously every 2 to 4 hours from **2025-12-25** through **2026-01-31**.
   - **Coverage**: **22,192 forecast records** projecting out to 72 hours ahead.
   - **Resolution Alignment**: Half-hourly actuals are aligned to top-of-the-hour forecast timestamps using an exact inner join, yielding 744 target hours in January (100% coverage).

For comprehensive schema details and data cleansing notes, see [`docs/DATA_NOTES.md`](docs/DATA_NOTES.md).

---

## 🏗️ Architecture & Technology Stack

```mermaid
graph TD
    subgraph Market Data
        Elexon[Elexon BMRS API] -->|fetch_data.py| Parquet[backend/data/*.parquet]
    end

    subgraph Backend - FastAPI (Python 3.12)
        Parquet --> DataLoader[DataLoader - In-Memory Cache]
        DataLoader --> AnalyticsEngine[Analytics Engine / Pandas]
        AnalyticsEngine -->|Zero-Leakage Filter| FilterService[Point-in-Time Selector]
        FilterService --> MetricsService[Metrics & Horizon Calculator]
        MetricsService --> REST[FastAPI REST Router /api/*]
    end

    subgraph Frontend - React 18 & Vite
        REST -->|JSON via React Query| Client[API Client]
        Client --> State[Dashboard State]
        State --> UI[Header, ControlsBar, KpiCards, Charts, Tables, Vintages]
        ThemeEngine[useTheme Context] -->|CSS Variables & Recharts Tokens| UI
    end
```

### Backend
- **Framework**: Python 3.12 + [FastAPI](https://fastapi.tiangolo.com)
- **Data Engine**: [Pandas](https://pandas.pydata.org) & [PyArrow](https://arrow.apache.org/docs/python/) (Zero-latency in-memory cache)
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/) schemas
- **Testing**: [Pytest](https://pytest.org) (23 unit & integration tests)

### Frontend
- **Framework**: [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite 5](https://vitejs.dev)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com) + Custom CSS Design System (CSS variables for light/dark theming)
- **Visualizations**: [Recharts](https://recharts.org) (Responsive charts with custom tooltips, brushes, and gradient fills)
- **Data Fetching**: [TanStack React Query v5](https://tanstack.com/query) (Automatic caching and stale-while-revalidate)
- **Icons**: [Lucide React](https://lucide.dev)

---

## 📁 Repository Directory Structure

```
.
├── Dockerfile                  # Production container (Python 3.12-slim)
├── docker-compose.yml          # Container orchestration configuration
├── pyproject.toml              # Ruff linter and Pytest test runner configuration
├── .env.example                # Environment variables template
├── docs/                       # Architectural and operational documentation
│   ├── ARCHITECTURE.md         # Detailed system design, data flow, and components
│   ├── DATA_NOTES.md           # Elexon BMRS endpoint inspection, schemas, and verification
│   ├── DEPLOYMENT.md           # Production deployment guide
│   ├── METHODOLOGY.md          # Gate closure cutoff rules, formulas, and assumptions
│   └── VIDEO_SCRIPT.md         # 10-minute presentation script
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint, lifespan event, CORS & gzip middleware
│   │   ├── config.py           # Application settings (Pydantic Settings)
│   │   ├── api/routers.py      # REST endpoints (/api/meta, /api/comparison, /api/metrics, etc.)
│   │   ├── analytics/          # Pure computational engine (point-in-time selection, metrics, horizon)
│   │   ├── data/loader.py      # In-memory DataFrame repository (Parquet & CSV fallback)
│   │   └── schemas/models.py   # Pydantic v2 validation models
│   ├── scripts/fetch_data.py   # Automated data ingestion pipeline for Elexon BMRS
│   ├── data/                   # Stored dataset (actuals.parquet/csv, forecasts.parquet/csv)
│   ├── tests/                  # 23 unit & integration test suites
│   └── requirements.txt        # Backend dependencies
└── frontend/
    ├── src/
    │   ├── api/client.ts       # Typed REST API client supporting relative and absolute base URLs
    │   ├── components/         # Modular dashboard components:
    │   │   ├── Header.tsx           # Title, status indicator, and animated theme switch
    │   │   ├── ControlsBar.tsx      # Date pickers, presets, cutoff & horizon selectors
    │   │   ├── KpiCards.tsx         # Executive KPI summary cards with glow effects
    │   │   ├── MainComparisonChart.tsx # Time-series actual vs forecast with P5-P95 envelope
    │   │   ├── ErrorCharts.tsx      # Signed error line chart and error distribution histogram
    │   │   ├── HorizonAnalysisChart.tsx # Error degradation vs forecast lead time (1-48h)
    │   │   ├── DiurnalAndLevelCharts.tsx# Diurnal profile & generation-level error breakdowns
    │   │   ├── DailySummaryTable.tsx # Daily breakdown table with sorting and CSV export
    │   │   ├── VintageExplorer.tsx  # Forecast vintage evolution for individual target hours
    │   │   ├── InsightsPanel.tsx    # Automated operational takeaway badges
    │   │   └── MethodologyModal.tsx # Full methodology modal with formulas & definitions
    │   ├── context/ThemeContext.tsx # Light/dark mode provider with chart palette tokens
    │   ├── types/index.ts      # Shared TypeScript domain interfaces
    │   ├── tests/              # Vitest + React Testing Library test suites
    │   ├── App.tsx             # Root dashboard container
    │   └── main.tsx            # React application mount
    ├── package.json            # Pinned frontend dependencies
    ├── .npmrc                  # npm configuration for CI/CD peer dependency compatibility
    └── vite.config.ts          # Vite build and test configuration
```

---

## 🚀 How to Run Locally

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker

### 1. Run with Docker (Recommended)
```bash
docker compose up --build
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

---

### 2. Run Manually (Backend + Frontend)

#### Step 1: Start Backend
```bash
# In repository root:
python -m venv venv
venv\Scripts\activate       # On Linux/macOS: source venv/bin/activate
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

#### Step 2: Start Frontend
```bash
# In another terminal:
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

### 3. Re-fetch Live Market Data
To fetch the raw Elexon BMRS records fresh from the UK API:
```bash
python backend/scripts/fetch_data.py
```
This queries the Elexon BMRS API with exponential backoff, validates timestamps in UTC, and updates `backend/data/*.parquet` and `backend/data/*.csv`.

---

### 4. Running Automated Tests

```bash
# Backend Tests (23 test cases including hand-computed math fixtures)
pytest backend/tests/ -v

# Backend Linters
ruff check backend/
ruff format --check backend/

# Frontend Tests
cd frontend
npm run test

# Frontend TypeScript Typecheck & Production Build
npm run build
```

---

## 📐 Mathematical Methodology

### 1. Error Definition
$$\text{Error}_t = \text{Forecast}_t - \text{Actual}_t$$
- **Positive Error ($>0$)**: Over-forecast (generation was less than anticipated; utility faces short imbalance).
- **Negative Error ($<0$)**: Under-forecast (generation exceeded anticipated; utility faces long imbalance).

### 2. Error Metrics
- **Mean Absolute Error (MAE)**:
  $$\text{MAE} = \frac{1}{N} \sum_{t=1}^N \left| \text{Forecast}_t - \text{Actual}_t \right|$$
- **Root Mean Square Error (RMSE)**:
  $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{t=1}^N (\text{Forecast}_t - \text{Actual}_t)^2}$$
- **Mean Signed Error (Bias)**:
  $$\text{Bias} = \frac{1}{N} \sum_{t=1}^N (\text{Forecast}_t - \text{Actual}_t)$$
- **Symmetric Mean Absolute Percentage Error (sMAPE)**:
  $$\text{sMAPE} = \frac{100\%}{N} \sum_{t=1}^N \frac{|\text{Forecast}_t - \text{Actual}_t|}{(|\text{Forecast}_t| + |\text{Actual}_t|) / 2}$$
- **Skill Score vs. Persistence**:
  $$\text{Skill Score} = 1 - \frac{\text{MAE}_{\text{model}}}{\text{MAE}_{\text{persistence}}}$$
  Where naive persistence predicts $F_{t} = A_{t-24\text{h}}$ (same-hour generation from previous day).

---

## AI Tools Disclosure
> **AI Usage Disclosure**: In accordance with transparent development practices, AI programming tools (Claude, and Gemini) were used as programming assistants during this project for drafting test suites, implementing Pydantic/TypeScript interfaces, generating CSS color tokens, and preparing comprehensive technical documentation. All mathematical algorithms, business logic rules, and data validations were rigorously verified against official UK Elexon BMRS market specifications.

---

## 📄 License
This project is licensed under the MIT License. Data provided via Elexon BMRS Open Data License.
