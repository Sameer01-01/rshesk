# Elexon BMRS Data Notes & Ingestion Specification

## 1. Executive Summary & Verification Findings
This document details the exploratory findings, parameter specifications, timestamp conventions, data resolution characteristics, and data quality metrics for the UK Elexon BMRS datasets used in the **Wind Forecast Monitor** application.

Verification was conducted directly against the live Elexon BMRS API (`https://data.elexon.co.uk/bmrs/api/v1`) without authentication requirements.

---

## 2. Dataset Specifications

### A. Actual Generation: `FUELHH` (Half-Hourly Generation Outturn by Fuel Type)
- **Endpoint**: `GET /datasets/FUELHH/stream`
- **Query Parameters**:
  - `settlementDateFrom`: ISO Date `YYYY-MM-DD` (e.g. `2026-01-01`)
  - `settlementDateTo`: ISO Date `YYYY-MM-DD` (e.g. `2026-01-31`)
  - `fuelType`: `WIND`
  - `format`: `json`
- **Response Fields**:
  | Field | Type | Description | Example |
  |---|---|---|---|
  | `dataset` | string | Constant identifier | `"FUELHH"` |
  | `publishTime` | string (ISO 8601 UTC) | Publication timestamp | `"2026-01-03T00:00:00Z"` |
  | `startTime` | string (ISO 8601 UTC) | Target interval start time | `"2026-01-01T00:00:00Z"` |
  | `settlementDate` | string (YYYY-MM-DD) | UK Settlement Date | `"2026-01-01"` |
  | `settlementPeriod` | integer (1–48/50) | Half-hour period of day | `1` to `48` |
  | `fuelType` | string | Generation fuel type | `"WIND"` |
  | `generation` | integer/float (MW) | Total actual generation | `14202` |
- **Resolution**: 30-minute intervals (`:00` and `:30`).
- **January 2026 Verification**:
  - Expected records: 31 days × 48 settlement periods = **1,488 records**.
  - Verified count: **1,488 records** (100% complete, 0 missing intervals).
  - Null count: 0 across all fields.
  - Duplicates on `startTime`: 0.
  - Min generation: **1,695 MW**; Max generation: **17,805 MW**; Mean: **11,580.7 MW**.

---

### B. Forecast Generation: `WINDFOR` (Wind Generation Forecast)
- **Endpoint**: `GET /datasets/WINDFOR/stream`
- **Query Parameters**:
  - `publishDateTimeFrom`: ISO 8601 UTC datetime `YYYY-MM-DDTHH:MM:SSZ` (e.g. `2025-12-25T00:00:00Z`)
  - `publishDateTimeTo`: ISO 8601 UTC datetime `YYYY-MM-DDTHH:MM:SSZ` (e.g. `2026-02-01T00:00:00Z`)
  - `format`: `json`
- **Response Fields**:
  | Field | Type | Description | Example |
  |---|---|---|---|
  | `dataset` | string | Constant identifier | `"WINDFOR"` |
  | `publishTime` | string (ISO 8601 UTC) | When forecast was produced | `"2026-01-01T02:30:00Z"` |
  | `startTime` | string (ISO 8601 UTC) | Target delivery start time | `"2026-01-01T03:00:00Z"` |
  | `generation` | integer/float (MW) | Forecasted wind output | `19498` |
- **Resolution**: 60-minute intervals (top-of-the-hour: `00:00`, `01:00`, ..., `23:00`).
- **Publication Frequency**: Published every 2 to 4 hours (e.g. ~8 runs per day: 02:30, 04:30, 07:30, 09:30, 11:30, 15:30, 18:30, 22:30 UTC).
- **Target Horizon**: Each forecast run projects out up to ~72 hours ahead.
- **Period `2025-12-25` to `2026-01-31` Verification**:
  - Verified count: **22,192 records**.
  - Null count: 0 across all fields.
  - Duplicates on `[publishTime, startTime]`: 0.
  - Min generation: **1,981 MW**; Max generation: **21,353 MW**.

---

## 3. Critical Temporal & Resolution Alignment
1. **Resolution Difference**:
   - Actuals (`FUELHH`) are reported at 30-minute intervals (48 points/day).
   - Forecasts (`WINDFOR`) are produced at 60-minute intervals (24 points/day, top-of-the-hour).
2. **Alignment Strategy**:
   - An exact join on `startTime` aligns the top-of-the-hour actuals (e.g., `12:00:00Z`) with the hourly forecasts (`12:00:00Z`).
   - The intermediate half-hours (`:30`) in actuals have no corresponding WINDFOR forecast.
   - Per requirements, we perform an inner join on `startTime` and explicitly track/report data coverage:
     - Total hourly delivery targets in Jan 2026: 31 days × 24 hours = **744 hours**.
     - All 744 target hours possess matching actuals and pre-gate decision forecasts (100% coverage of hourly targets).
     - Coverage metrics in the API distinguish between target hours evaluated and half-hourly actual outturns.
3. **Timezone Uniformity**:
   - In January, the UK observes Greenwich Mean Time (GMT), which is UTC +00:00.
   - All internal storage, analytics, and API representations strictly use UTC (ISO 8601 with `Z` suffix or explicit `+00:00`).

---

## 4. Ingestion & Storage Architecture
- A standalone ingestion script `backend/scripts/fetch_data.py` queries Elexon with chunking (7-day windows) and exponential backoff retry.
- The raw and cleaned data is persisted to `backend/data/actuals.parquet` (and CSV fallback) and `backend/data/forecasts.parquet` (and CSV fallback).
- The files are committed into the repository so runtime operation never requires outbound internet connectivity to Elexon.
