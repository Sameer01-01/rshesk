"""Forecast accuracy degradation analysis across forecast horizons (0 to 48 hours)."""

from __future__ import annotations

from typing import Any, Dict, List, Sequence

import pandas as pd

from backend.app.analytics.metrics import compute_metrics
from backend.app.analytics.selection import align_actuals_and_forecasts


def analyze_horizon_degradation(
    actuals_df: pd.DataFrame,
    forecasts_df: pd.DataFrame,
    horizons: Sequence[int] = (0, 3, 6, 9, 12, 18, 24, 30, 36, 42, 48),
) -> List[Dict[str, Any]]:
    """Evaluate forecast accuracy as a function of lead time horizon (hours).

    For each horizon H, selects the most recent forecast published at least
    H hours prior to target delivery time, aligns with actuals, and calculates
    error metrics (MAE, RMSE, Bias, Count).
    """
    results: List[Dict[str, Any]] = []

    for h in horizons:
        aligned, diag = align_actuals_and_forecasts(
            actuals_df=actuals_df,
            forecasts_df=forecasts_df,
            mode="horizon",
            horizon_hours=float(h),
        )

        if aligned.empty:
            continue

        metrics = compute_metrics(aligned)
        results.append(
            {
                "horizonHours": int(h),
                "mae": metrics["mae"],
                "rmse": metrics["rmse"],
                "bias": metrics["bias"],
                "biasDirection": metrics["bias_direction"],
                "nmaePct": metrics["nmae_pct"],
                "p90AbsError": metrics["p90_abs_error"],
                "count": metrics["count"],
            }
        )

    return sorted(results, key=lambda x: x["horizonHours"])
