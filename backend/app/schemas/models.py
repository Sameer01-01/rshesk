"""Pydantic schemas and response models for the Wind Forecast Monitor API."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "healthy"
    data_loaded: bool
    rows_actuals: int
    rows_forecasts: int


class MetaResponse(BaseModel):
    project_name: str
    version: str
    available_range: Dict[str, str]
    default_cutoff_hour: int
    data_quality: Dict[str, Any]


class ActualRecord(BaseModel):
    startTime: datetime
    generation: float


class ForecastRecord(BaseModel):
    startTime: datetime
    publishTime: datetime
    horizonHours: float
    generation: float


class ComparisonRecord(BaseModel):
    startTime: datetime
    actual: float
    forecast: float
    publishTime: datetime
    horizonHours: float
    error: float
    absError: float


class ComparisonResponse(BaseModel):
    data: List[ComparisonRecord]
    diagnostics: Dict[str, int]


class MetricsResponse(BaseModel):
    count: int
    coverage_pct: float
    mean_actual: float
    mean_forecast: float
    bias: float
    bias_direction: str
    mae: float
    rmse: float
    nmae_pct: float
    smape_pct: float
    median_abs_error: float
    p90_abs_error: float
    p95_abs_error: float
    error_p5: float
    error_p50: float
    error_p95: float
    planning_buffer_p90: float
    planning_buffer_p95: float


class HorizonMetric(BaseModel):
    horizonHours: int
    mae: float
    rmse: float
    bias: float
    biasDirection: str
    nmaePct: float
    p90AbsError: float
    count: int


class HourMetric(BaseModel):
    hour: int
    mae: float
    rmse: float
    bias: float
    meanActual: float
    meanForecast: float
    count: int


class LevelMetric(BaseModel):
    regime: str
    mae: float
    rmse: float
    bias: float
    nmaePct: float
    meanActual: float
    minActual: float
    maxActual: float
    count: int


class DailyMetric(BaseModel):
    date: str
    mae: float
    bias: float
    peakActual: float
    peakForecast: float
    meanActual: float
    meanForecast: float
    count: int


class VintageEntry(BaseModel):
    publishTime: str
    forecast: float
    horizonHours: float
    isDecisionSelected: bool
    isBeforeCutoff: bool


class ForecastVintageResponse(BaseModel):
    targetTime: str
    deliveryDate: str
    cutoffTime: str
    cutoffHour: int
    actualGeneration: Optional[float]
    vintages: List[VintageEntry]


class InsightsResponse(BaseModel):
    insights: List[str]
