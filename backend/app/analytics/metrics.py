"""Quantitative error metrics and accuracy evaluation functions.

All error calculations define error as:
    error = forecast - actual

Includes guards against zero-actual and empty sets.
"""

from __future__ import annotations

import math
from typing import Any, Dict

import numpy as np
import pandas as pd


def compute_metrics(
    aligned_df: pd.DataFrame,
    total_target_hours: int | None = None,
) -> Dict[str, Any]:
    """Compute comprehensive accuracy and risk metrics on aligned actuals and forecasts.

    Parameters:
    -----------
    aligned_df: pd.DataFrame
        DataFrame containing at least ['actual', 'forecast', 'error', 'absError'].
    total_target_hours: int | None
        Total expected target hours in the evaluation window for computing coverage %.

    Returns:
    --------
    Dict containing bias, mae, rmse, nmae, smape, median_abs_error, p90_abs_error,
    p95_abs_error, signed error percentiles (p5, p50, p95), mean_actual, mean_forecast,
    count, and coverage_pct.
    """
    if aligned_df.empty:
        return {
            "count": 0,
            "coverage_pct": 0.0,
            "mean_actual": 0.0,
            "mean_forecast": 0.0,
            "bias": 0.0,
            "mae": 0.0,
            "rmse": 0.0,
            "nmae_pct": 0.0,
            "smape_pct": 0.0,
            "median_abs_error": 0.0,
            "p90_abs_error": 0.0,
            "p95_abs_error": 0.0,
            "error_p5": 0.0,
            "error_p50": 0.0,
            "error_p95": 0.0,
            "planning_buffer_p90": 0.0,
            "planning_buffer_p95": 0.0,
            "bias_direction": "NEUTRAL",
        }

    actuals = aligned_df["actual"].to_numpy(dtype=float)
    forecasts = aligned_df["forecast"].to_numpy(dtype=float)
    errors = forecasts - actuals
    abs_errors = np.abs(errors)
    n = len(errors)

    # 1. Summary means
    mean_actual = float(np.mean(actuals))
    mean_forecast = float(np.mean(forecasts))

    # 2. Bias (Mean Error): forecast - actual
    bias = float(np.mean(errors))
    bias_direction = "OVER" if bias > 1e-3 else ("UNDER" if bias < -1e-3 else "NEUTRAL")

    # 3. MAE & RMSE
    mae = float(np.mean(abs_errors))
    rmse = float(math.sqrt(float(np.mean(errors**2))))

    # 4. Normalized MAE (% of mean actual)
    if mean_actual > 1e-6:
        nmae_pct = float((mae / mean_actual) * 100.0)
    else:
        nmae_pct = 0.0

    # 5. Symmetric MAPE (sMAPE)
    # 200 * |F - A| / (|A| + |F|)
    sum_vals = np.abs(actuals) + np.abs(forecasts)
    valid_mask = sum_vals > 1e-6
    if np.any(valid_mask):
        smape_pct = float(np.mean(200.0 * abs_errors[valid_mask] / sum_vals[valid_mask]))
    else:
        smape_pct = 0.0

    # 6. Absolute error percentiles
    median_abs_error = float(np.percentile(abs_errors, 50))
    p90_abs_error = float(np.percentile(abs_errors, 90))
    p95_abs_error = float(np.percentile(abs_errors, 95))

    # 7. Signed error percentiles (P5, P50, P95)
    error_p5 = float(np.percentile(errors, 5))
    error_p50 = float(np.percentile(errors, 50))
    error_p95 = float(np.percentile(errors, 95))

    # 8. Coverage calculation
    if total_target_hours and total_target_hours > 0:
        coverage_pct = round((n / total_target_hours) * 100.0, 2)
    else:
        coverage_pct = 100.0

    return {
        "count": n,
        "coverage_pct": coverage_pct,
        "mean_actual": round(mean_actual, 2),
        "mean_forecast": round(mean_forecast, 2),
        "bias": round(bias, 2),
        "bias_direction": bias_direction,
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "nmae_pct": round(nmae_pct, 2),
        "smape_pct": round(smape_pct, 2),
        "median_abs_error": round(median_abs_error, 2),
        "p90_abs_error": round(p90_abs_error, 2),
        "p95_abs_error": round(p95_abs_error, 2),
        "error_p5": round(error_p5, 2),
        "error_p50": round(error_p50, 2),
        "error_p95": round(error_p95, 2),
        "planning_buffer_p90": round(p90_abs_error, 2),
        "planning_buffer_p95": round(p95_abs_error, 2),
    }
