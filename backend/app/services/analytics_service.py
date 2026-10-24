"""Service layer encapsulating cached analytics queries and date range validation."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Tuple

import pandas as pd
from fastapi import HTTPException

from backend.app.analytics.breakdowns import (
    analyze_by_generation_level,
    analyze_by_hour_of_day,
    analyze_daily_summary,
    generate_key_insights,
    get_forecast_vintages,
)
from backend.app.analytics.horizon import analyze_horizon_degradation
from backend.app.analytics.metrics import compute_metrics
from backend.app.analytics.selection import align_actuals_and_forecasts, select_forecasts
from backend.app.data.loader import DataLoader

JAN_START = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
JAN_END = datetime(2026, 1, 31, 23, 59, 59, tzinfo=timezone.utc)


def parse_and_validate_range(
    start: str | None,
    end: str | None,
) -> Tuple[datetime, datetime]:
    """Validate query range lies within January 2026, returning UTC datetime bounds."""
    start_dt = JAN_START if not start else pd.to_datetime(start, utc=True).to_pydatetime()
    end_dt = JAN_END if not end else pd.to_datetime(end, utc=True).to_pydatetime()

    if start_dt > end_dt:
        raise HTTPException(
            status_code=422, detail="start time must be earlier than or equal to end time."
        )

    # Bounds check: Must overlap with January 2026
    if end_dt < JAN_START or start_dt > JAN_END:
        raise HTTPException(
            status_code=422,
            detail="Requested date range must fall within January 2026 (2026-01-01 to 2026-01-31).",
        )

    # Restrict to January bounds
    bounded_start = max(start_dt, JAN_START)
    bounded_end = min(end_dt, JAN_END)

    return bounded_start, bounded_end


class AnalyticsService:
    def __init__(self) -> None:
        self.loader = DataLoader.get_instance()

    def get_meta(self) -> Dict[str, Any]:
        act = self.loader.actuals
        fc = self.loader.forecasts

        return {
            "project_name": "Wind Forecast Monitor",
            "version": "1.0.0",
            "available_range": {
                "start": JAN_START.isoformat(),
                "end": JAN_END.isoformat(),
            },
            "default_cutoff_hour": 9,
            "data_quality": {
                "actuals_total_rows": len(act),
                "actuals_min_mw": float(act["generation"].min()),
                "actuals_max_mw": float(act["generation"].max()),
                "actuals_mean_mw": round(float(act["generation"].mean()), 2),
                "actuals_intervals_missing": 0,
                "forecasts_total_rows": len(fc),
                "forecasts_min_mw": float(fc["generation"].min()),
                "forecasts_max_mw": float(fc["generation"].max()),
                "forecasts_mean_mw": round(float(fc["generation"].mean()), 2),
                "resolution_actuals": "30-minute",
                "resolution_forecasts": "60-minute",
                "timezone": "UTC (GMT in January)",
            },
        }

    def get_actuals(self, start_dt: datetime, end_dt: datetime) -> List[Dict[str, Any]]:
        act = self.loader.actuals
        mask = (act["startTime"] >= start_dt) & (act["startTime"] <= end_dt)
        filtered = act.loc[mask, ["startTime", "generation"]].sort_values("startTime")
        return [
            {"startTime": row["startTime"].isoformat(), "generation": float(row["generation"])}
            for _, row in filtered.iterrows()
        ]

    def get_forecasts(
        self,
        start_dt: datetime,
        end_dt: datetime,
        mode: Literal["decision", "horizon"] = "decision",
        cutoff_hour: int = 9,
        horizon_hours: float = 24.0,
    ) -> List[Dict[str, Any]]:
        fc = self.loader.forecasts
        selected = select_forecasts(
            fc,
            mode=mode,
            cutoff_hour=cutoff_hour,
            horizon_hours=horizon_hours,
        )
        mask = (selected["startTime"] >= start_dt) & (selected["startTime"] <= end_dt)
        filtered = selected[mask]
        return [
            {
                "startTime": row["startTime"].isoformat(),
                "publishTime": row["publishTime"].isoformat(),
                "horizonHours": float(row["horizonHours"]),
                "generation": float(row["forecast"]),
            }
            for _, row in filtered.iterrows()
        ]

    def get_comparison(
        self,
        start_dt: datetime,
        end_dt: datetime,
        mode: Literal["decision", "horizon"] = "decision",
        cutoff_hour: int = 9,
        horizon_hours: float = 24.0,
    ) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
        act = self.loader.actuals
        fc = self.loader.forecasts
        aligned, diag = align_actuals_and_forecasts(
            actuals_df=act,
            forecasts_df=fc,
            mode=mode,
            cutoff_hour=cutoff_hour,
            horizon_hours=horizon_hours,
            start_time=start_dt,
            end_time=end_dt,
        )

        records = [
            {
                "startTime": row["startTime"].isoformat(),
                "actual": float(row["actual"]),
                "forecast": float(row["forecast"]),
                "publishTime": row["publishTime"].isoformat(),
                "horizonHours": float(row["horizonHours"]),
                "error": round(float(row["error"]), 2),
                "absError": round(float(row["absError"]), 2),
            }
            for _, row in aligned.iterrows()
        ]
        return records, diag

    def get_metrics(
        self,
        start_dt: datetime,
        end_dt: datetime,
        mode: Literal["decision", "horizon"] = "decision",
        cutoff_hour: int = 9,
        horizon_hours: float = 24.0,
    ) -> Dict[str, Any]:
        act = self.loader.actuals
        fc = self.loader.forecasts
        aligned, _ = align_actuals_and_forecasts(
            actuals_df=act,
            forecasts_df=fc,
            mode=mode,
            cutoff_hour=cutoff_hour,
            horizon_hours=horizon_hours,
            start_time=start_dt,
            end_time=end_dt,
        )

        total_hours = int((end_dt - start_dt).total_seconds() / 3600.0) + 1
        return compute_metrics(aligned, total_target_hours=total_hours)

    def get_horizon_breakdown(self, start_dt: datetime, end_dt: datetime) -> List[Dict[str, Any]]:
        act = self.loader.actuals
        fc = self.loader.forecasts
        mask_act = (act["startTime"] >= start_dt) & (act["startTime"] <= end_dt)
        return analyze_horizon_degradation(act[mask_act], fc)

    def get_hour_breakdown(
        self,
        start_dt: datetime,
        end_dt: datetime,
        mode: Literal["decision", "horizon"] = "decision",
        cutoff_hour: int = 9,
        horizon_hours: float = 24.0,
    ) -> List[Dict[str, Any]]:
        act = self.loader.actuals
        fc = self.loader.forecasts
        aligned, _ = align_actuals_and_forecasts(
            act,
            fc,
            mode=mode,
            cutoff_hour=cutoff_hour,
            horizon_hours=horizon_hours,
            start_time=start_dt,
            end_time=end_dt,
        )
        return analyze_by_hour_of_day(aligned)

    def get_level_breakdown(
        self,
        start_dt: datetime,
        end_dt: datetime,
        mode: Literal["decision", "horizon"] = "decision",
        cutoff_hour: int = 9,
        horizon_hours: float = 24.0,
    ) -> List[Dict[str, Any]]:
        act = self.loader.actuals
        fc = self.loader.forecasts
        aligned, _ = align_actuals_and_forecasts(
            act,
            fc,
            mode=mode,
            cutoff_hour=cutoff_hour,
            horizon_hours=horizon_hours,
            start_time=start_dt,
            end_time=end_dt,
        )
        return analyze_by_generation_level(aligned)

    def get_daily_summary(
        self,
        start_dt: datetime,
        end_dt: datetime,
        cutoff_hour: int = 9,
    ) -> List[Dict[str, Any]]:
        act = self.loader.actuals
        fc = self.loader.forecasts
        aligned, _ = align_actuals_and_forecasts(
            act, fc, mode="decision", cutoff_hour=cutoff_hour, start_time=start_dt, end_time=end_dt
        )
        return analyze_daily_summary(aligned)

    def get_vintages(self, target_time: datetime, cutoff_hour: int = 9) -> Dict[str, Any]:
        fc = self.loader.forecasts
        act = self.loader.actuals
        return get_forecast_vintages(
            forecasts_df=fc,
            actuals_df=act,
            target_time=target_time,
            cutoff_hour=cutoff_hour,
        )

    def get_insights(
        self,
        start_dt: datetime,
        end_dt: datetime,
        mode: Literal["decision", "horizon"] = "decision",
        cutoff_hour: int = 9,
        horizon_hours: float = 24.0,
    ) -> List[str]:
        metrics = self.get_metrics(
            start_dt, end_dt, mode=mode, cutoff_hour=cutoff_hour, horizon_hours=horizon_hours
        )
        daily = self.get_daily_summary(start_dt, end_dt, cutoff_hour=cutoff_hour)
        horizon = self.get_horizon_breakdown(start_dt, end_dt)
        return generate_key_insights(metrics, daily, horizon)


service = AnalyticsService()
