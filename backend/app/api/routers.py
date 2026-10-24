"""FastAPI route handlers for Wind Forecast Monitor endpoints."""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from backend.app.schemas.models import (
    ActualRecord,
    ComparisonResponse,
    DailyMetric,
    ForecastRecord,
    ForecastVintageResponse,
    HealthResponse,
    HorizonMetric,
    HourMetric,
    InsightsResponse,
    LevelMetric,
    MetaResponse,
    MetricsResponse,
)
from backend.app.services.analytics_service import parse_and_validate_range, service

router = APIRouter(prefix="/api", tags=["Wind Forecast Monitor"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> Dict[str, Any]:
    """Liveness probe reporting in-memory data cache row counts."""
    act_rows = len(service.loader.actuals)
    fc_rows = len(service.loader.forecasts)
    return {
        "status": "healthy",
        "data_loaded": (act_rows > 0 and fc_rows > 0),
        "rows_actuals": act_rows,
        "rows_forecasts": fc_rows,
    }


@router.get("/meta", response_model=MetaResponse)
def get_meta() -> Dict[str, Any]:
    """Retrieve metadata, date bounds, default cutoff configuration, and data-quality summary."""
    return service.get_meta()


@router.get("/actuals", response_model=List[ActualRecord])
def get_actuals(
    start: Optional[str] = Query(None, description="Start datetime (ISO 8601 UTC)"),
    end: Optional[str] = Query(None, description="End datetime (ISO 8601 UTC)"),
) -> List[Dict[str, Any]]:
    """Retrieve 30-minute outturn wind generation actuals."""
    start_dt, end_dt = parse_and_validate_range(start, end)
    return service.get_actuals(start_dt, end_dt)


@router.get("/forecasts", response_model=List[ForecastRecord])
def get_forecasts(
    start: Optional[str] = Query(None, description="Start datetime (ISO 8601 UTC)"),
    end: Optional[str] = Query(None, description="End datetime (ISO 8601 UTC)"),
    mode: Literal["decision", "horizon"] = Query(
        "decision", description="'decision' (D-1 cutoff) or 'horizon' (>= H hours)"
    ),
    cutoffHour: int = Query(
        9, ge=0, le=23, description="Decision gate closure hour on D-1 (0-23 UTC)"
    ),
    horizonHours: float = Query(24.0, ge=0.0, le=48.0, description="Lead time horizon in hours"),
) -> List[Dict[str, Any]]:
    """Retrieve selected wind forecasts matching decision cutoff or horizon constraints."""
    start_dt, end_dt = parse_and_validate_range(start, end)
    return service.get_forecasts(
        start_dt,
        end_dt,
        mode=mode,
        cutoff_hour=cutoffHour,
        horizon_hours=horizonHours,
    )


@router.get("/comparison", response_model=ComparisonResponse)
def get_comparison(
    start: Optional[str] = Query(None, description="Start datetime (ISO 8601 UTC)"),
    end: Optional[str] = Query(None, description="End datetime (ISO 8601 UTC)"),
    mode: Literal["decision", "horizon"] = Query("decision"),
    cutoffHour: int = Query(9, ge=0, le=23),
    horizonHours: float = Query(24.0, ge=0.0, le=48.0),
) -> Dict[str, Any]:
    """Align actuals and selected forecasts on startTime and return errors and coverage diagnostics."""
    start_dt, end_dt = parse_and_validate_range(start, end)
    records, diag = service.get_comparison(
        start_dt,
        end_dt,
        mode=mode,
        cutoff_hour=cutoffHour,
        horizon_hours=horizonHours,
    )
    return {"data": records, "diagnostics": diag}


@router.get("/metrics", response_model=MetricsResponse)
def get_metrics(
    start: Optional[str] = Query(None, description="Start datetime (ISO 8601 UTC)"),
    end: Optional[str] = Query(None, description="End datetime (ISO 8601 UTC)"),
    mode: Literal["decision", "horizon"] = Query("decision"),
    cutoffHour: int = Query(9, ge=0, le=23),
    horizonHours: float = Query(24.0, ge=0.0, le=48.0),
) -> Dict[str, Any]:
    """Compute overall quantitative error metrics (MAE, RMSE, Bias, Percentiles, Buffer)."""
    start_dt, end_dt = parse_and_validate_range(start, end)
    return service.get_metrics(
        start_dt,
        end_dt,
        mode=mode,
        cutoff_hour=cutoffHour,
        horizon_hours=horizonHours,
    )


@router.get("/metrics/by-horizon", response_model=List[HorizonMetric])
def get_metrics_by_horizon(
    start: Optional[str] = Query(None, description="Start datetime (ISO 8601 UTC)"),
    end: Optional[str] = Query(None, description="End datetime (ISO 8601 UTC)"),
) -> List[Dict[str, Any]]:
    """Evaluate accuracy degradation across forecast lead horizons (0 to 48 hours)."""
    start_dt, end_dt = parse_and_validate_range(start, end)
    return service.get_horizon_breakdown(start_dt, end_dt)


@router.get("/metrics/by-hour", response_model=List[HourMetric])
def get_metrics_by_hour(
    start: Optional[str] = Query(None, description="Start datetime (ISO 8601 UTC)"),
    end: Optional[str] = Query(None, description="End datetime (ISO 8601 UTC)"),
    mode: Literal["decision", "horizon"] = Query("decision"),
    cutoffHour: int = Query(9, ge=0, le=23),
    horizonHours: float = Query(24.0, ge=0.0, le=48.0),
) -> List[Dict[str, Any]]:
    """Compute error metrics grouped by hour of the delivery day (0 to 23 UTC)."""
    start_dt, end_dt = parse_and_validate_range(start, end)
    return service.get_hour_breakdown(
        start_dt,
        end_dt,
        mode=mode,
        cutoff_hour=cutoffHour,
        horizon_hours=horizonHours,
    )


@router.get("/metrics/by-level", response_model=List[LevelMetric])
def get_metrics_by_level(
    start: Optional[str] = Query(None, description="Start datetime (ISO 8601 UTC)"),
    end: Optional[str] = Query(None, description="End datetime (ISO 8601 UTC)"),
    mode: Literal["decision", "horizon"] = Query("decision"),
    cutoffHour: int = Query(9, ge=0, le=23),
    horizonHours: float = Query(24.0, ge=0.0, le=48.0),
) -> List[Dict[str, Any]]:
    """Compute error metrics grouped by actual wind generation regime (Low, Moderate, High)."""
    start_dt, end_dt = parse_and_validate_range(start, end)
    return service.get_level_breakdown(
        start_dt,
        end_dt,
        mode=mode,
        cutoff_hour=cutoffHour,
        horizon_hours=horizonHours,
    )


@router.get("/metrics/daily", response_model=List[DailyMetric])
def get_daily_metrics(
    start: Optional[str] = Query(None, description="Start datetime (ISO 8601 UTC)"),
    end: Optional[str] = Query(None, description="End datetime (ISO 8601 UTC)"),
    cutoffHour: int = Query(9, ge=0, le=23),
) -> List[Dict[str, Any]]:
    """Retrieve daily summary metrics (MAE, Bias, Peak Actual, Peak Forecast) per day."""
    start_dt, end_dt = parse_and_validate_range(start, end)
    return service.get_daily_summary(start_dt, end_dt, cutoff_hour=cutoffHour)


@router.get("/forecast-vintages", response_model=ForecastVintageResponse)
def get_forecast_vintages_endpoint(
    targetTime: str = Query(..., description="Target delivery startTime (ISO 8601 UTC)"),
    cutoffHour: int = Query(9, ge=0, le=23),
) -> Dict[str, Any]:
    """Retrieve all successive forecasts published for a single target time to observe evolution."""
    try:
        target_dt = pd.to_datetime(targetTime, utc=True).to_pydatetime()
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Invalid targetTime ISO format: {exc}")

    return service.get_vintages(target_dt, cutoff_hour=cutoffHour)


@router.get("/insights", response_model=InsightsResponse)
def get_insights(
    start: Optional[str] = Query(None, description="Start datetime (ISO 8601 UTC)"),
    end: Optional[str] = Query(None, description="End datetime (ISO 8601 UTC)"),
    mode: Literal["decision", "horizon"] = Query("decision"),
    cutoffHour: int = Query(9, ge=0, le=23),
    horizonHours: float = Query(24.0, ge=0.0, le=48.0),
) -> Dict[str, Any]:
    """Generate dynamic narrative trading desk insights and planning buffer recommendations."""
    start_dt, end_dt = parse_and_validate_range(start, end)
    insights = service.get_insights(
        start_dt,
        end_dt,
        mode=mode,
        cutoff_hour=cutoffHour,
        horizon_hours=horizonHours,
    )
    return {"insights": insights}
