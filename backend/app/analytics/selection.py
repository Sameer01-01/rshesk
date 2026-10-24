"""Forecast selection and alignment logic without look-ahead leakage.

Supports:
1. Decision-time mode: for target date D, uses cutoff at D-1 09:00 UTC (configurable).
   Picks latest forecast published on or before the cutoff.
2. Horizon mode: latest forecast published at least H hours prior to target startTime.
"""

from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from typing import Dict, Literal, Tuple

import pandas as pd


def compute_cutoff_datetime(target_dt: datetime, cutoff_hour: int = 9) -> datetime:
    """Compute gate closure cutoff datetime on day D-1.

    For any target time on delivery day D, day D-1 is D - 1 day.
    Cutoff time is cutoff_hour:00:00 UTC on day D-1.
    """
    delivery_date = target_dt.date()
    d_minus_1 = delivery_date - timedelta(days=1)
    cutoff_time = time(hour=cutoff_hour, minute=0, second=0)
    return datetime.combine(d_minus_1, cutoff_time, tzinfo=timezone.utc)


def select_forecasts(
    forecasts_df: pd.DataFrame,
    mode: Literal["decision", "horizon"] = "decision",
    cutoff_hour: int = 9,
    horizon_hours: float = 24.0,
) -> pd.DataFrame:
    """Select the appropriate forecast per target startTime without look-ahead leakage.

    Parameters:
    -----------
    forecasts_df: pd.DataFrame
        DataFrame with columns ['publishTime', 'startTime', 'generation'].
        Timestamps must be UTC-aware datetime64.
    mode: "decision" or "horizon"
    cutoff_hour: int
        Hour of day (0-23 UTC) on day D-1 for decision gate closure. Default is 9.
    horizon_hours: float
        Required lead time in hours if mode == 'horizon' (publishTime <= startTime - H hours).

    Returns:
    --------
    pd.DataFrame with columns ['startTime', 'publishTime', 'forecast', 'horizonHours'].
    """
    if forecasts_df.empty:
        return pd.DataFrame(columns=["startTime", "publishTime", "forecast", "horizonHours"])

    df = forecasts_df.copy()
    if not pd.api.types.is_datetime64_any_dtype(df["publishTime"]):
        df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
    if not pd.api.types.is_datetime64_any_dtype(df["startTime"]):
        df["startTime"] = pd.to_datetime(df["startTime"], utc=True)

    if mode == "decision":
        # Vectorized cutoff computation for each target startTime
        # Delivery date D is the UTC date of startTime
        # Cutoff is (D - 1 day) at cutoff_hour:00:00 UTC
        start_dates = df["startTime"].dt.floor("D")
        cutoff_series = start_dates - pd.Timedelta(days=1) + pd.Timedelta(hours=cutoff_hour)
        # Filter forecasts published on or before the cutoff (strictly <= cutoff)
        eligible = df[df["publishTime"] <= cutoff_series]
    elif mode == "horizon":
        # Forecast published at least horizon_hours before target startTime
        required_cutoff = df["startTime"] - pd.Timedelta(hours=horizon_hours)
        eligible = df[df["publishTime"] <= required_cutoff]
    else:
        raise ValueError(f"Unknown mode '{mode}'. Must be 'decision' or 'horizon'.")

    if eligible.empty:
        return pd.DataFrame(columns=["startTime", "publishTime", "forecast", "horizonHours"])

    # For each target startTime, select the record with the MAXIMUM publishTime (latest available forecast)
    # Sort by startTime ascending, publishTime descending
    sorted_eligible = eligible.sort_values(["startTime", "publishTime"], ascending=[True, False])
    selected = sorted_eligible.drop_duplicates(subset=["startTime"], keep="first").copy()

    # Compute horizon in hours = (startTime - publishTime) in hours
    selected["horizonHours"] = (
        (selected["startTime"] - selected["publishTime"]).dt.total_seconds() / 3600.0
    ).round(2)
    selected["forecast"] = selected["generation"].astype(float)

    selected = (
        selected[["startTime", "publishTime", "forecast", "horizonHours"]]
        .sort_values("startTime")
        .reset_index(drop=True)
    )
    return selected


def align_actuals_and_forecasts(
    actuals_df: pd.DataFrame,
    forecasts_df: pd.DataFrame,
    mode: Literal["decision", "horizon"] = "decision",
    cutoff_hour: int = 9,
    horizon_hours: float = 24.0,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """Align actual generation and selected forecasts on startTime via inner join.

    Also tracks target coverage diagnostics:
    - actuals_count: Total actual records in window
    - forecasts_count: Total selected forecast records in window
    - aligned_count: Count of matched intervals
    - actuals_without_forecast: Actual intervals with no forecast available
    - forecasts_without_actual: Forecast intervals with no actual available
    """
    act = actuals_df.copy()
    if not pd.api.types.is_datetime64_any_dtype(act["startTime"]):
        act["startTime"] = pd.to_datetime(act["startTime"], utc=True)

    # Filter actuals to requested range if supplied
    if start_time is not None:
        act = act[act["startTime"] >= start_time]
    if end_time is not None:
        act = act[act["startTime"] <= end_time]

    # Select forecasts
    fc_selected = select_forecasts(
        forecasts_df,
        mode=mode,
        cutoff_hour=cutoff_hour,
        horizon_hours=horizon_hours,
    )

    if start_time is not None:
        fc_selected = fc_selected[fc_selected["startTime"] >= start_time]
    if end_time is not None:
        fc_selected = fc_selected[fc_selected["startTime"] <= end_time]

    act_renamed = act[["startTime", "generation"]].rename(columns={"generation": "actual"})

    # Perform outer join first to compute unmatched diagnostics
    outer_merged = pd.merge(act_renamed, fc_selected, on="startTime", how="outer")

    actuals_without_forecast = int(
        outer_merged["actual"].notna().sum() - outer_merged["forecast"].notna().sum()
    )
    forecasts_without_actual = int(
        outer_merged["forecast"].notna().sum() - outer_merged["actual"].notna().sum()
    )

    # Inner join for analytical comparison
    aligned = pd.merge(act_renamed, fc_selected, on="startTime", how="inner")

    # Error = Forecast - Actual
    aligned["error"] = aligned["forecast"] - aligned["actual"]
    aligned["absError"] = aligned["error"].abs()
    aligned = aligned.sort_values("startTime").reset_index(drop=True)

    diagnostics = {
        "actuals_count": len(act),
        "forecasts_count": len(fc_selected),
        "aligned_count": len(aligned),
        "actuals_without_forecast": max(0, actuals_without_forecast),
        "forecasts_without_actual": max(0, forecasts_without_actual),
    }

    return aligned, diagnostics
