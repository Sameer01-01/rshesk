"""Analytical breakdowns by hour-of-day, generation level, daily summaries, vintages, and insights."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

import numpy as np
import pandas as pd

from backend.app.analytics.selection import compute_cutoff_datetime, select_forecasts


def analyze_by_hour_of_day(aligned_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Group aligned forecast and actuals by hour of day (0-23 UTC)."""
    if aligned_df.empty:
        return []

    df = aligned_df.copy()
    df["hour"] = df["startTime"].dt.hour

    results: List[Dict[str, Any]] = []
    for hour, grp in df.groupby("hour"):
        errors = (grp["forecast"] - grp["actual"]).to_numpy(dtype=float)
        abs_errors = np.abs(errors)
        actuals = grp["actual"].to_numpy(dtype=float)
        mean_act = float(np.mean(actuals))
        mae = float(np.mean(abs_errors))
        rmse = float(np.sqrt(np.mean(errors**2)))
        bias = float(np.mean(errors))

        results.append(
            {
                "hour": int(hour),
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "bias": round(bias, 2),
                "meanActual": round(mean_act, 2),
                "meanForecast": round(float(np.mean(grp["forecast"])), 2),
                "count": len(grp),
            }
        )

    return sorted(results, key=lambda x: x["hour"])


def analyze_by_generation_level(aligned_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Group errors by actual wind generation regime (Low, Moderate, High wind)."""
    if aligned_df.empty:
        return []

    df = aligned_df.copy()
    bins = [-float("inf"), 7000.0, 13000.0, float("inf")]
    labels = ["Low Wind (<7 GW)", "Medium Wind (7-13 GW)", "High Wind (>13 GW)"]

    df["regime"] = pd.cut(df["actual"], bins=bins, labels=labels)

    results: List[Dict[str, Any]] = []
    for label in labels:
        grp = df[df["regime"] == label]
        if grp.empty:
            continue

        errors = (grp["forecast"] - grp["actual"]).to_numpy(dtype=float)
        abs_errors = np.abs(errors)
        actuals = grp["actual"].to_numpy(dtype=float)
        mean_act = float(np.mean(actuals))
        mae = float(np.mean(abs_errors))
        rmse = float(np.sqrt(np.mean(errors**2)))
        bias = float(np.mean(errors))
        nmae = round((mae / mean_act * 100.0), 2) if mean_act > 0 else 0.0

        results.append(
            {
                "regime": str(label),
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "bias": round(bias, 2),
                "nmaePct": nmae,
                "meanActual": round(mean_act, 2),
                "minActual": round(float(grp["actual"].min()), 2),
                "maxActual": round(float(grp["actual"].max()), 2),
                "count": len(grp),
            }
        )

    return results


def analyze_daily_summary(aligned_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Compute per-day summary: MAE, Bias, Peak Actual, Peak Forecast, Total Count."""
    if aligned_df.empty:
        return []

    df = aligned_df.copy()
    df["date"] = df["startTime"].dt.strftime("%Y-%m-%d")

    results: List[Dict[str, Any]] = []
    for date_str, grp in df.groupby("date"):
        errors = (grp["forecast"] - grp["actual"]).to_numpy(dtype=float)
        abs_errors = np.abs(errors)
        mae = float(np.mean(abs_errors))
        bias = float(np.mean(errors))

        results.append(
            {
                "date": date_str,
                "mae": round(mae, 2),
                "bias": round(bias, 2),
                "peakActual": round(float(grp["actual"].max()), 2),
                "peakForecast": round(float(grp["forecast"].max()), 2),
                "meanActual": round(float(grp["actual"].mean()), 2),
                "meanForecast": round(float(grp["forecast"].mean()), 2),
                "count": len(grp),
            }
        )

    return sorted(results, key=lambda x: x["date"])


def get_forecast_vintages(
    forecasts_df: pd.DataFrame,
    actuals_df: pd.DataFrame,
    target_time: datetime,
    cutoff_hour: int = 9,
) -> Dict[str, Any]:
    """Retrieve the evolution of all published forecasts for a specific delivery target time."""
    if not pd.api.types.is_datetime64_any_dtype(forecasts_df["startTime"]):
        forecasts_df = forecasts_df.copy()
        forecasts_df["startTime"] = pd.to_datetime(forecasts_df["startTime"], utc=True)
        forecasts_df["publishTime"] = pd.to_datetime(forecasts_df["publishTime"], utc=True)

    target_utc = target_time.astimezone(timezone.utc)
    target_date = target_utc.date()

    # Determine decision cutoff
    cutoff_dt = compute_cutoff_datetime(target_utc, cutoff_hour=cutoff_hour)

    # Filter all forecasts for this targetTime
    vintages = (
        forecasts_df[forecasts_df["startTime"] == target_utc].sort_values("publishTime").copy()
    )

    # Find actual outturn
    act_match = actuals_df[actuals_df["startTime"] == target_utc]
    actual_val = float(act_match["generation"].iloc[0]) if not act_match.empty else None

    # Find decision-selected forecast
    selected_row = select_forecasts(
        vintages,
        mode="decision",
        cutoff_hour=cutoff_hour,
    )
    selected_publish_time = selected_row["publishTime"].iloc[0] if not selected_row.empty else None

    vintage_list: List[Dict[str, Any]] = []
    for _, row in vintages.iterrows():
        pub_time = row["publishTime"]
        horizon_h = round((target_utc - pub_time).total_seconds() / 3600.0, 2)
        is_selected = (selected_publish_time is not None) and (pub_time == selected_publish_time)
        is_before_cutoff = pub_time <= cutoff_dt

        vintage_list.append(
            {
                "publishTime": pub_time.isoformat(),
                "forecast": float(row["generation"]),
                "horizonHours": horizon_h,
                "isDecisionSelected": is_selected,
                "isBeforeCutoff": is_before_cutoff,
            }
        )

    return {
        "targetTime": target_utc.isoformat(),
        "deliveryDate": target_date.strftime("%Y-%m-%d"),
        "cutoffTime": cutoff_dt.isoformat(),
        "cutoffHour": cutoff_hour,
        "actualGeneration": actual_val,
        "vintages": vintage_list,
    }


def generate_key_insights(
    metrics: Dict[str, Any],
    daily_list: List[Dict[str, Any]],
    horizon_list: List[Dict[str, Any]],
) -> List[str]:
    """Generate 4 actionable insights tailored for the energy trading desk."""
    insights: List[str] = []

    # 1. Planning Buffer
    p90 = metrics.get("p90_abs_error", 0)
    p5 = metrics.get("error_p5", 0)
    p95 = metrics.get("error_p95", 0)
    insights.append(
        f"Planning Buffer: In 90% of hours, decision-time forecast error was contained within {p90:,.0f} MW "
        f"(90% empirical error envelope spans [{p5:+,.0f} MW to {p95:+,.0f} MW])."
    )

    # 2. Systematic Bias
    bias = metrics.get("bias", 0)
    direction = metrics.get("bias_direction", "NEUTRAL")
    nmae = metrics.get("nmae_pct", 0)
    if abs(bias) > 50:
        dir_text = (
            "over-predicting wind output" if direction == "OVER" else "under-predicting wind output"
        )
        insights.append(
            f"Systematic Bias: The day-ahead model exhibits a net bias of {bias:+,.0f} MW ({dir_text}), "
            f"representing {nmae:.1f}% normalized MAE of mean generation."
        )
    else:
        insights.append(
            f"Neutral Bias: The forecast is well-centered with negligible overall bias ({bias:+,.1f} MW)."
        )

    # 3. Peak Volatility Day
    if daily_list:
        worst_day = max(daily_list, key=lambda x: x["mae"])
        insights.append(
            f"Highest Volatility: Day {worst_day['date']} saw maximum forecast divergence with MAE of "
            f"{worst_day['mae']:,.0f} MW (peak actual wind was {worst_day['peakActual']:,.0f} MW)."
        )

    # 4. Lead-Time Degradation
    if horizon_list and len(horizon_list) >= 2:
        first_h = horizon_list[0]
        last_h = horizon_list[-1]
        pct_increase = (
            ((last_h["mae"] - first_h["mae"]) / first_h["mae"]) * 100.0 if first_h["mae"] > 0 else 0
        )
        insights.append(
            f"Horizon Degradation: MAE increases from {first_h['mae']:,.0f} MW at {first_h['horizonHours']}h horizon "
            f"to {last_h['mae']:,.0f} MW at {last_h['horizonHours']}h horizon (+{pct_increase:.1f}% error growth)."
        )

    return insights
