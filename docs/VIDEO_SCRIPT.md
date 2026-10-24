# Video Presentation Script (Max 10 Minutes)

This script is structured into two 5-minute segments:
1. **Part 1 (0:00 - 5:00): Customer Pitch & Trading Desk Walkthrough** (Client-focused)
2. **Part 2 (5:00 - 10:00): Technical Architecture & Engineering Review** (Tech Lead focus)

---

## Part 1: Customer Pitch & Live Dashboard Walkthrough (0:00 – 5:00)

### [0:00 – 1:00] The Power Trader's Problem
- **Spoken**: *"Hello everyone. In the UK wholesale power market, energy suppliers must make day-ahead procurement decisions on day D-1 before gate closure. If wind generation turns out lower than expected, the utility faces expensive cash-out penalties on the balancing mechanism; if wind is over-forecast, we over-procure expensive thermal power.
- To make profitable, risk-mitigated decisions, trading desks need two things:
  1. Instant visibility into the exact wind generation forecast that was locked in before gate closure—with zero look-ahead distortion.
  2. Quantitative error metrics to size empirical reserve buffers.
  Today, I'm presenting the **Wind Forecast Monitor** built specifically for UK trading desks using official Elexon BMRS data for January 2026."*

### [1:00 – 2:30] A Day in the Life: Decision Walkthrough
- **Action**: Open the dashboard at `http://localhost:8000` (or live URL). Point to the Controls Bar.
- **Spoken**: *"Let's look at the dashboard. At the top, we have our Controls Bar. By default, our evaluation mode is set to Day-Ahead Cutoff at 09:00 UTC on D-1. Why 09:00? Because UK day-ahead auctions close around late morning, and 09:00 gives our traders the necessary margin to finalize bids.
- Let's select **Peak Volatility Day (Jan 15, 2026)**. Notice how our KPI cards and charts instantly refresh with sub-millisecond speed:
  - On January 15th, wind generation surged rapidly. Our main chart shows the green line—actual generation—climbing above 16,000 MW, while the blue line shows the decision-time forecast locked in the prior morning.
  - Notice the shaded light blue envelope around the forecast: this is our **P5 to P95 empirical planning buffer**. Traders don't just see a single point estimate; they see the 90% confidence envelope based on historical forecast errors."*

### [2:30 – 3:45] January 2026 Headline Numbers & Actionable Insights
- **Action**: Switch preset to **Full Month (Jan 1 – 31)**. Focus on the KPI cards and Key Insights panel.
- **Spoken**: *"Looking across the entire month of January 2026:
  - **MAE**: **2,127 MW** (which is 18.4% of our average wind generation of 11,581 MW).
  - **RMSE**: **2,606 MW**, reflecting penalties for sudden wind ramp events.
  - **Systematic Bias**: **+1,852 MW (OVER-FORECAST)**. This is a critical insight for traders: the day-ahead forecast systematically over-predicted wind outturns in January. Knowing this, our procurement team knows to adjust thermal purchasing upward.
  - **P90 Buffer**: **±4,306 MW**. In 90% of hours, wind error is contained within 4,306 MW. This provides our trading desk with an exact quantitative reserve sizing rule."*

### [3:45 – 5:00] Lead-Time Degradation & Roadmap
- **Action**: Scroll to the Horizon Analysis Chart and Vintage Explorer.
- **Spoken**: *"Down here, our Horizon Degradation curve shows how forecast accuracy deteriorates with lead time: from 1,794 MW MAE at 0h lead time up to 2,380 MW at 48h—a 32.6% error growth.
- In our Forecast Vintage Explorer, traders can pick any delivery hour and inspect every forecast run published over the preceding 72 hours, seeing exactly which run was locked in at gate closure and how the model adjusted over time.
- **Next Phase Capabilities**: In future releases, we can expand beyond national wind to incorporate solar PV, regional transmission zonal breakdowns, and probabilistic machine learning ensemble forecasts."*

---

## Part 2: Technical Architecture & Code Deep Dive (5:00 – 10:00)

### [5:00 – 6:15] System Architecture & Clean Data Flow
- **Action**: Display `docs/ARCHITECTURE.md` Mermaid diagram.
- **Spoken**: *"Now let's switch gears to the engineering architecture.
- We designed this application around a zero-external-dependency, offline-ready architecture:
  1. **Data Ingestion**: A standalone pipeline `backend/scripts/fetch_data.py` fetched January 2026 actuals (`FUELHH`, 1,488 records) and forecasts (`WINDFOR`, 22,192 records) from Elexon BMRS in 7-day chunks with exponential backoff retry.
  2. **Storage**: Data is pre-bundled in compressed Parquet and CSV files in `backend/data/`. At application startup, FastAPI loads these into memory in under 50 milliseconds.
  3. **Zero Network Dependence**: The runtime server makes zero outbound calls to Elexon, eliminating latency spikes, third-party outages, or rate-limiting failures during production trading."*

### [6:15 – 7:30] Zero Look-Ahead Leakage & Analytics Implementation
- **Action**: Open `backend/app/analytics/selection.py` and `backend/app/analytics/metrics.py`.
- **Spoken**: *"The core analytical challenge is preventing look-ahead leakage:
  - In `selection.py`, for every delivery hour on day D, we compute the D-1 cutoff timestamp. Using vectorized pandas logic, we filter `publishTime <= cutoff(D-1)` and take the maximum publishTime. Any forecast published after cutoff is strictly discarded.
  - In `metrics.py`, we implement pure, unit-tested functions for Bias, MAE, RMSE, sMAPE, and percentiles.
  - Notice our resolution handling: Actuals are 30-minute settlement periods while forecasts are 60-minute top-of-the-hour. We execute an inner join on `startTime` to evaluate all 744 target hours in January (100% hourly coverage), while tracking unmatched half-hours explicitly in diagnostics rather than silently dropping them."*

### [7:30 – 8:45] Full-Stack Tech Stack & Test Suite
- **Action**: Open terminal and run `pytest backend/tests/ -v` and `npm run test`.
- **Spoken**: *"Our tech stack is strictly modern and type-safe:
  - **Backend**: Python 3.12, FastAPI, Pydantic v2 schemas, and Pandas.
  - **Frontend**: React 18, Vite, TypeScript in strict mode, Recharts, TanStack Query, and Tailwind CSS.
  - **Quality Assurance**: We have 23 backend tests covering month-boundary cutoff calculations (e.g. target Jan 1 uses Dec 31 cutoff), boundary equality, zero-actual handling, and API integration paths. On the frontend, Vitest and React Testing Library test our KPI cards and control state synchronization.
  - Notice that all controls synchronize with the URL query string, allowing traders to share direct links to specific views."*

### [8:45 – 10:00] Containerization, Deployment & Wrap-Up
- **Action**: Show `Dockerfile` and `docker-compose.yml`.
- **Spoken**: *"For deployment:
  - We engineered a unified multi-stage root `Dockerfile`. Stage 1 builds the React application using Node 20. Stage 2 copies the compiled static assets into our Python 3.12 container. FastAPI serves both the JSON API under `/api` and the React frontend with SPA fallback from a single port (8000).
  - This single container can be deployed to Render, Railway, or Heroku with zero secrets or database configuration needed.
  - **AI Tools Disclosure**: AI assistance (Google Antigravity / Gemini) was leveraged during development for test scaffolding, API contract generation, and UI polishing.
  - Thank you for your time. The repository, documentation, and live links are ready for review."*
