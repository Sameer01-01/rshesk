"""Unit tests for analytics functions: selection, metrics, horizon, and breakdowns."""

from datetime import datetime, timezone

import numpy as np
import pandas as pd

from backend.app.analytics.breakdowns import (
    analyze_by_generation_level,
    analyze_by_hour_of_day,
    analyze_daily_summary,
    generate_key_insights,
)
from backend.app.analytics.metrics import compute_metrics
from backend.app.analytics.selection import (
    align_actuals_and_forecasts,
    compute_cutoff_datetime,
    select_forecasts,
)


def test_compute_cutoff_datetime_cross_month():
    """Verify D-1 cutoff crosses month boundary correctly (target 1 Jan -> cutoff 31 Dec)."""
    target = datetime(2026, 1, 1, 14, 0, 0, tzinfo=timezone.utc)
    cutoff = compute_cutoff_datetime(target, cutoff_hour=9)

    assert cutoff == datetime(2025, 12, 31, 9, 0, 0, tzinfo=timezone.utc)
    assert cutoff.tzinfo == timezone.utc


def test_compute_cutoff_datetime_configurable_hour():
    """Verify configurable cutoff hour works."""
    target = datetime(2026, 1, 15, 0, 0, 0, tzinfo=timezone.utc)
    cutoff = compute_cutoff_datetime(target, cutoff_hour=11)
    assert cutoff == datetime(2026, 1, 14, 11, 0, 0, tzinfo=timezone.utc)


def test_select_forecasts_decision_mode_no_leakage():
    """Verify latest forecast published on or before cutoff is selected, never after."""
    target_time = pd.Timestamp("2026-01-02 12:00:00+00:00")
    # For target 2026-01-02, cutoff at 09:00 on 2026-01-01 is 2026-01-01 09:00:00+00:00

    df_fc = pd.DataFrame(
        [
            # Before cutoff: 07:00
            {
                "startTime": target_time,
                "publishTime": pd.Timestamp("2026-01-01 07:00:00+00:00"),
                "generation": 10000.0,
            },
            # Exact boundary: 09:00 (eligible!)
            {
                "startTime": target_time,
                "publishTime": pd.Timestamp("2026-01-01 09:00:00+00:00"),
                "generation": 11000.0,
            },
            # After cutoff: 09:01 (leakage! MUST be excluded)
            {
                "startTime": target_time,
                "publishTime": pd.Timestamp("2026-01-01 09:01:00+00:00"),
                "generation": 12000.0,
            },
            # Way after cutoff: 2026-01-02 06:00
            {
                "startTime": target_time,
                "publishTime": pd.Timestamp("2026-01-02 06:00:00+00:00"),
                "generation": 13000.0,
            },
        ]
    )

    selected = select_forecasts(df_fc, mode="decision", cutoff_hour=9)
    assert len(selected) == 1
    # Must pick the exact 09:00 forecast with generation 11000.0
    assert selected.iloc[0]["forecast"] == 11000.0
    assert selected.iloc[0]["publishTime"] == pd.Timestamp("2026-01-01 09:00:00+00:00")
    # Horizon hours: 2026-01-02 12:00 - 2026-01-01 09:00 = 27 hours
    assert selected.iloc[0]["horizonHours"] == 27.0


def test_select_forecasts_horizon_mode():
    """Verify horizon mode filters publishTime <= startTime - H hours."""
    target_time = pd.Timestamp("2026-01-02 12:00:00+00:00")
    # Horizon H = 12h means publishTime <= 2026-01-02 00:00:00

    df_fc = pd.DataFrame(
        [
            {
                "startTime": target_time,
                "publishTime": pd.Timestamp("2026-01-01 18:00:00+00:00"),
                "generation": 5000.0,
            },
            {
                "startTime": target_time,
                "publishTime": pd.Timestamp("2026-01-02 00:00:00+00:00"),
                "generation": 5500.0,
            },
            {
                "startTime": target_time,
                "publishTime": pd.Timestamp("2026-01-02 02:00:00+00:00"),
                "generation": 6000.0,
            },
        ]
    )

    selected = select_forecasts(df_fc, mode="horizon", horizon_hours=12.0)
    assert len(selected) == 1
    assert selected.iloc[0]["forecast"] == 5500.0
    assert selected.iloc[0]["horizonHours"] == 12.0


def test_compute_metrics_hand_computed():
    """Verify hand-computed error metrics on known sample values.

    Actuals:    [100, 200, 300, 400]
    Forecasts:  [120, 180, 350, 390]
    Errors:     [+20, -20, +50, -10]
    Abs Errors: [ 20,  20,  50,  10]

    Bias: (20 - 20 + 50 - 10) / 4 = 40 / 4 = 10.0 (OVER)
    MAE:  (20 + 20 + 50 + 10) / 4 = 100 / 4 = 25.0
    RMSE: sqrt((400 + 400 + 2500 + 100) / 4) = sqrt(3400 / 4) = sqrt(850) = 29.15
    Mean Actual: 250.0
    NMAE: 25.0 / 250.0 * 100 = 10.0%
    Median Abs Error: median(10, 20, 20, 50) = 20.0
    """
    df = pd.DataFrame(
        {
            "actual": [100.0, 200.0, 300.0, 400.0],
            "forecast": [120.0, 180.0, 350.0, 390.0],
        }
    )
    df["error"] = df["forecast"] - df["actual"]
    df["absError"] = df["error"].abs()

    m = compute_metrics(df, total_target_hours=4)

    assert m["count"] == 4
    assert m["coverage_pct"] == 100.0
    assert m["bias"] == 10.0
    assert m["bias_direction"] == "OVER"
    assert m["mae"] == 25.0
    assert m["rmse"] == round(np.sqrt(850), 2)
    assert m["nmae_pct"] == 10.0
    assert m["median_abs_error"] == 20.0


def test_compute_metrics_zero_actual():
    """Verify metrics handle zero actual without dividing by zero."""
    df = pd.DataFrame(
        {
            "actual": [0.0, 0.0],
            "forecast": [0.0, 0.0],
        }
    )
    df["error"] = df["forecast"] - df["actual"]
    df["absError"] = df["error"].abs()

    m = compute_metrics(df)
    assert m["count"] == 2
    assert m["mae"] == 0.0
    assert m["nmae_pct"] == 0.0
    assert m["smape_pct"] == 0.0


def test_compute_metrics_empty():
    """Verify empty DataFrame returns zeroed metrics dict without crashing."""
    df = pd.DataFrame(columns=["actual", "forecast", "error", "absError"])
    m = compute_metrics(df)
    assert m["count"] == 0
    assert m["coverage_pct"] == 0.0
    assert m["mae"] == 0.0


def test_align_actuals_and_forecasts_diagnostics():
    """Verify diagnostics accurately count matched vs missing targets."""
    t1 = pd.Timestamp("2026-01-01 10:00:00+00:00")
    t2 = pd.Timestamp("2026-01-01 11:00:00+00:00")
    t3 = pd.Timestamp("2026-01-01 12:00:00+00:00")

    df_act = pd.DataFrame(
        [
            {"startTime": t1, "generation": 1000.0},
            {"startTime": t2, "generation": 2000.0},
        ]
    )

    df_fc = pd.DataFrame(
        [
            {
                "startTime": t2,
                "publishTime": pd.Timestamp("2025-12-31 08:00:00+00:00"),
                "generation": 2100.0,
            },
            {
                "startTime": t3,
                "publishTime": pd.Timestamp("2025-12-31 08:00:00+00:00"),
                "generation": 3100.0,
            },
        ]
    )

    aligned, diag = align_actuals_and_forecasts(df_act, df_fc, mode="decision", cutoff_hour=9)
    # t2 matched
    assert len(aligned) == 1
    assert aligned.iloc[0]["startTime"] == t2
    assert diag["actuals_count"] == 2
    assert diag["forecasts_count"] == 2
    assert diag["aligned_count"] == 1


def test_breakdowns_and_insights():
    """Verify hour-of-day, generation level, and insight generation."""
    t1 = pd.Timestamp("2026-01-01 10:00:00+00:00")
    t2 = pd.Timestamp("2026-01-01 11:00:00+00:00")

    aligned = pd.DataFrame(
        [
            {
                "startTime": t1,
                "actual": 5000.0,
                "forecast": 5200.0,
                "error": 200.0,
                "absError": 200.0,
            },
            {
                "startTime": t2,
                "actual": 14000.0,
                "forecast": 13500.0,
                "error": -500.0,
                "absError": 500.0,
            },
        ]
    )

    by_hour = analyze_by_hour_of_day(aligned)
    assert len(by_hour) == 2
    assert by_hour[0]["hour"] == 10
    assert by_hour[0]["mae"] == 200.0

    by_level = analyze_by_generation_level(aligned)
    assert len(by_level) >= 1

    daily = analyze_daily_summary(aligned)
    assert len(daily) == 1
    assert daily[0]["date"] == "2026-01-01"

    metrics = compute_metrics(aligned)
    insights = generate_key_insights(metrics, daily, [])
    assert len(insights) >= 2
