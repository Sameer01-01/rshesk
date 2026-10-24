"""API integration tests for FastAPI endpoints."""

from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["data_loaded"] is True
    assert data["rows_actuals"] == 1488
    assert data["rows_forecasts"] > 20000


def test_meta():
    resp = client.get("/api/meta")
    assert resp.status_code == 200
    data = resp.json()
    assert data["project_name"] == "Wind Forecast Monitor"
    assert "start" in data["available_range"]
    assert data["default_cutoff_hour"] == 9
    assert data["data_quality"]["actuals_total_rows"] == 1488


def test_actuals():
    resp = client.get("/api/actuals?start=2026-01-01T00:00:00Z&end=2026-01-02T00:00:00Z")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    assert "startTime" in data[0]
    assert "generation" in data[0]


def test_forecasts():
    resp = client.get(
        "/api/forecasts?start=2026-01-01T00:00:00Z&end=2026-01-02T00:00:00Z&mode=decision&cutoffHour=9"
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    assert "startTime" in data[0]
    assert "publishTime" in data[0]
    assert "horizonHours" in data[0]
    assert "generation" in data[0]


def test_comparison():
    resp = client.get(
        "/api/comparison?start=2026-01-01T00:00:00Z&end=2026-01-03T00:00:00Z&mode=decision&cutoffHour=9"
    )
    assert resp.status_code == 200
    res = resp.json()
    assert "data" in res
    assert "diagnostics" in res
    assert len(res["data"]) > 0
    row = res["data"][0]
    assert "actual" in row
    assert "forecast" in row
    assert "error" in row
    assert "absError" in row


def test_metrics():
    resp = client.get(
        "/api/metrics?start=2026-01-01T00:00:00Z&end=2026-01-31T23:59:59Z&mode=decision&cutoffHour=9"
    )
    assert resp.status_code == 200
    m = resp.json()
    assert m["count"] == 744
    assert m["mae"] > 0
    assert m["rmse"] > m["mae"]
    assert "bias" in m
    assert "p90_abs_error" in m


def test_metrics_by_horizon():
    resp = client.get("/api/metrics/by-horizon")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 5
    assert data[0]["horizonHours"] < data[-1]["horizonHours"]


def test_metrics_by_hour():
    resp = client.get("/api/metrics/by-hour?cutoffHour=9")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 24
    assert data[0]["hour"] == 0
    assert data[-1]["hour"] == 23


def test_metrics_by_level():
    resp = client.get("/api/metrics/by-level")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2


def test_metrics_daily():
    resp = client.get("/api/metrics/daily?cutoffHour=9")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 31  # 31 days in Jan 2026


def test_forecast_vintages():
    resp = client.get("/api/forecast-vintages?targetTime=2026-01-05T12:00:00Z&cutoffHour=9")
    assert resp.status_code == 200
    data = resp.json()
    assert data["targetTime"].startswith("2026-01-05T12:00:00")
    assert len(data["vintages"]) > 0
    selected_count = sum(1 for v in data["vintages"] if v["isDecisionSelected"])
    assert selected_count == 1


def test_insights():
    resp = client.get("/api/insights")
    assert resp.status_code == 200
    data = resp.json()
    assert "insights" in data
    assert len(data["insights"]) >= 3


def test_date_range_validation_out_of_bounds():
    # Outside Jan 2026
    resp = client.get("/api/actuals?start=2025-06-01T00:00:00Z&end=2025-06-05T00:00:00Z")
    assert resp.status_code == 422
    assert "January 2026" in resp.json()["detail"]


def test_date_range_validation_inverted():
    # start > end
    resp = client.get("/api/actuals?start=2026-01-10T00:00:00Z&end=2026-01-05T00:00:00Z")
    assert resp.status_code == 422
