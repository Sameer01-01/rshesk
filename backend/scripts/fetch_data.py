"""Data ingestion pipeline for Elexon BMRS datasets.

Fetches January 2026 UK National Wind generation actuals (FUELHH) and corresponding
forecasts (WINDFOR) published from 2025-12-25 through 2026-01-31.
Cleans, standardizes to UTC, validates against schema and data quality rules,
and persists locally in Parquet and CSV formats.
"""

from __future__ import annotations

import logging
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List

import httpx
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("fetch_data")

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data"


def fetch_with_retry(
    client: httpx.Client,
    url: str,
    params: Dict[str, Any],
    max_retries: int = 5,
    backoff_factor: float = 1.5,
) -> List[Dict[str, Any]]:
    """Fetch JSON data from Elexon BMRS with exponential backoff retry."""
    last_error: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            resp = client.get(url, params=params, timeout=30.0)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list):
                    return data
                elif isinstance(data, dict) and "data" in data:
                    return data["data"]
                return []
            elif resp.status_code in (429, 500, 502, 503, 504):
                sleep_sec = backoff_factor**attempt
                logger.warning(
                    f"HTTP {resp.status_code} for {url}. Retrying in {sleep_sec:.1f}s (Attempt {attempt}/{max_retries})"
                )
                time.sleep(sleep_sec)
            else:
                resp.raise_for_status()
        except (httpx.RequestError, httpx.HTTPStatusError) as exc:
            last_error = exc
            sleep_sec = backoff_factor**attempt
            logger.warning(
                f"Request error: {exc}. Retrying in {sleep_sec:.1f}s (Attempt {attempt}/{max_retries})"
            )
            time.sleep(sleep_sec)

    raise RuntimeError(f"Failed to fetch {url} after {max_retries} attempts: {last_error}")


def fetch_fuelhh_actuals(
    client: httpx.Client,
    start_date: str = "2026-01-01",
    end_date: str = "2026-01-31",
    chunk_days: int = 7,
) -> pd.DataFrame:
    """Fetch FUELHH actual generation for wind in chunked date windows."""
    logger.info(
        f"Fetching FUELHH actuals from {start_date} to {end_date} (chunk size: {chunk_days}d)..."
    )
    url = f"{BASE_URL}/datasets/FUELHH/stream"
    dt_curr = datetime.strptime(start_date, "%Y-%m-%d")
    dt_end = datetime.strptime(end_date, "%Y-%m-%d")

    records: List[Dict[str, Any]] = []
    while dt_curr <= dt_end:
        chunk_end = min(dt_curr + timedelta(days=chunk_days - 1), dt_end)
        s_from = dt_curr.strftime("%Y-%m-%d")
        s_to = chunk_end.strftime("%Y-%m-%d")
        logger.info(f"Fetching FUELHH chunk: {s_from} to {s_to}...")

        params = {
            "settlementDateFrom": s_from,
            "settlementDateTo": s_to,
            "fuelType": "WIND",
            "format": "json",
        }
        chunk_data = fetch_with_retry(client, url, params)
        records.extend(chunk_data)
        logger.info(f"Retrieved {len(chunk_data)} records for chunk {s_from}..{s_to}")
        dt_curr = chunk_end + timedelta(days=1)

    df = pd.DataFrame(records)
    logger.info(f"Total raw FUELHH records fetched: {len(df)}")
    return clean_actuals(df)


def clean_actuals(df: pd.DataFrame) -> pd.DataFrame:
    """Standardize, validate, and clean FUELHH wind generation actuals."""
    if df.empty:
        raise ValueError("FUELHH dataset is empty!")

    # Parse timestamps as UTC aware
    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)

    # Validate numeric generation
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    df = df.dropna(subset=["startTime", "generation"])

    # Ensure integer generation
    df["generation"] = df["generation"].astype(float)

    # Drop duplicate target periods if any
    initial_len = len(df)
    df = df.drop_duplicates(subset=["startTime"]).sort_values("startTime").reset_index(drop=True)
    if len(df) < initial_len:
        logger.warning(f"Dropped {initial_len - len(df)} duplicate startTime records from actuals.")

    # Quality Checks
    expected_intervals = 31 * 48  # 31 days * 48 half hours = 1488
    actual_intervals = len(df)
    logger.info(
        f"Actuals Data Quality: {actual_intervals}/{expected_intervals} half-hours present."
    )
    if actual_intervals < expected_intervals:
        logger.warning(
            f"Data gap detected: missing {expected_intervals - actual_intervals} intervals."
        )

    min_gen = df["generation"].min()
    max_gen = df["generation"].max()
    mean_gen = df["generation"].mean()
    negative_gens = (df["generation"] < 0).sum()
    logger.info(
        f"Actuals Gen Range: Min={min_gen:.1f} MW, Max={max_gen:.1f} MW, Mean={mean_gen:.1f} MW. Negatives={negative_gens}"
    )

    keep_cols = ["startTime", "generation", "settlementDate", "settlementPeriod", "publishTime"]
    return df[keep_cols]


def fetch_windfor_forecasts(
    client: httpx.Client,
    start_dt_str: str = "2025-12-25T00:00:00Z",
    end_dt_str: str = "2026-02-01T00:00:00Z",
    chunk_days: int = 7,
) -> pd.DataFrame:
    """Fetch WINDFOR wind generation forecasts in chunked publish windows."""
    logger.info(f"Fetching WINDFOR forecasts published {start_dt_str} to {end_dt_str}...")
    url = f"{BASE_URL}/datasets/WINDFOR/stream"
    dt_curr = datetime.fromisoformat(start_dt_str.replace("Z", "+00:00"))
    dt_end = datetime.fromisoformat(end_dt_str.replace("Z", "+00:00"))

    records: List[Dict[str, Any]] = []
    while dt_curr < dt_end:
        chunk_end = min(dt_curr + timedelta(days=chunk_days), dt_end)
        s_from = dt_curr.strftime("%Y-%m-%dT%H:%M:%SZ")
        s_to = chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ")
        logger.info(f"Fetching WINDFOR chunk: {s_from} to {s_to}...")

        params = {
            "publishDateTimeFrom": s_from,
            "publishDateTimeTo": s_to,
            "format": "json",
        }
        chunk_data = fetch_with_retry(client, url, params)
        records.extend(chunk_data)
        logger.info(f"Retrieved {len(chunk_data)} records for chunk {s_from}..{s_to}")
        dt_curr = chunk_end

    df = pd.DataFrame(records)
    logger.info(f"Total raw WINDFOR records fetched: {len(df)}")
    return clean_forecasts(df)


def clean_forecasts(df: pd.DataFrame) -> pd.DataFrame:
    """Standardize, validate, and clean WINDFOR forecasts."""
    if df.empty:
        raise ValueError("WINDFOR dataset is empty!")

    # Parse timestamps as UTC aware
    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)

    # Validate numeric generation
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    df = df.dropna(subset=["publishTime", "startTime", "generation"])
    df["generation"] = df["generation"].astype(float)

    # Deduplicate on (publishTime, startTime)
    initial_len = len(df)
    df = (
        df.drop_duplicates(subset=["publishTime", "startTime"])
        .sort_values(["publishTime", "startTime"])
        .reset_index(drop=True)
    )
    if len(df) < initial_len:
        logger.warning(f"Dropped {initial_len - len(df)} duplicate forecast rows.")

    min_gen = df["generation"].min()
    max_gen = df["generation"].max()
    mean_gen = df["generation"].mean()
    negative_gens = (df["generation"] < 0).sum()
    logger.info(
        f"Forecasts Gen Range: Min={min_gen:.1f} MW, Max={max_gen:.1f} MW, Mean={mean_gen:.1f} MW. Negatives={negative_gens}"
    )

    keep_cols = ["publishTime", "startTime", "generation"]
    return df[keep_cols]


def run_pipeline() -> None:
    """Execute complete ingestion pipeline and save to Parquet & CSV."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Target storage directory: {OUTPUT_DIR}")

    with httpx.Client(headers={"User-Agent": "WindForecastMonitor/1.0"}) as client:
        # 1. Actuals
        df_actuals = fetch_fuelhh_actuals(client, start_date="2026-01-01", end_date="2026-01-31")
        actuals_parquet = OUTPUT_DIR / "actuals.parquet"
        actuals_csv = OUTPUT_DIR / "actuals.csv"
        df_actuals.to_parquet(actuals_parquet, index=False)
        df_actuals.to_csv(actuals_csv, index=False)
        logger.info(f"Saved actuals: {actuals_parquet} ({len(df_actuals)} rows)")

        # 2. Forecasts
        df_forecasts = fetch_windfor_forecasts(
            client,
            start_dt_str="2025-12-25T00:00:00Z",
            end_dt_str="2026-02-01T00:00:00Z",
        )
        forecasts_parquet = OUTPUT_DIR / "forecasts.parquet"
        forecasts_csv = OUTPUT_DIR / "forecasts.csv"
        df_forecasts.to_parquet(forecasts_parquet, index=False)
        df_forecasts.to_csv(forecasts_csv, index=False)
        logger.info(f"Saved forecasts: {forecasts_parquet} ({len(df_forecasts)} rows)")

    logger.info("Data ingestion completed successfully.")


if __name__ == "__main__":
    run_pipeline()
