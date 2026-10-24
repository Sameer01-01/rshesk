"""In-memory data repository for actuals and forecasts.

Loads from pre-bundled Parquet files (with CSV fallback), validates UTC timestamps,
and caches DataFrames in memory for zero-latency query responses.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Tuple

import pandas as pd

logger = logging.getLogger("data_loader")

DEFAULT_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


class DataLoader:
    _instance: DataLoader | None = None

    def __init__(self, data_dir: Path | str | None = None) -> None:
        self.data_dir = Path(data_dir) if data_dir else DEFAULT_DATA_DIR
        self._actuals_df: pd.DataFrame | None = None
        self._forecasts_df: pd.DataFrame | None = None

    @classmethod
    def get_instance(cls, data_dir: Path | str | None = None) -> DataLoader:
        if cls._instance is None:
            cls._instance = cls(data_dir=data_dir)
        return cls._instance

    def load_data(self, force_reload: bool = False) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Load actuals and forecasts DataFrames into memory."""
        if not force_reload and self._actuals_df is not None and self._forecasts_df is not None:
            return self._actuals_df, self._forecasts_df

        logger.info(f"Loading data from {self.data_dir}...")

        # 1. Load Actuals
        actuals_parquet = self.data_dir / "actuals.parquet"
        actuals_csv = self.data_dir / "actuals.csv"
        if actuals_parquet.exists():
            df_act = pd.read_parquet(actuals_parquet)
        elif actuals_csv.exists():
            df_act = pd.read_csv(actuals_csv)
        else:
            raise FileNotFoundError(
                f"Neither actuals.parquet nor actuals.csv found in {self.data_dir}"
            )

        df_act["startTime"] = pd.to_datetime(df_act["startTime"], utc=True)
        if "publishTime" in df_act.columns:
            df_act["publishTime"] = pd.to_datetime(df_act["publishTime"], utc=True)
        self._actuals_df = df_act.sort_values("startTime").reset_index(drop=True)

        # 2. Load Forecasts
        forecasts_parquet = self.data_dir / "forecasts.parquet"
        forecasts_csv = self.data_dir / "forecasts.csv"
        if forecasts_parquet.exists():
            df_fc = pd.read_parquet(forecasts_parquet)
        elif forecasts_csv.exists():
            df_fc = pd.read_csv(forecasts_csv)
        else:
            raise FileNotFoundError(
                f"Neither forecasts.parquet nor forecasts.csv found in {self.data_dir}"
            )

        df_fc["startTime"] = pd.to_datetime(df_fc["startTime"], utc=True)
        df_fc["publishTime"] = pd.to_datetime(df_fc["publishTime"], utc=True)
        self._forecasts_df = df_fc.sort_values(["publishTime", "startTime"]).reset_index(drop=True)

        logger.info(
            f"Loaded {len(self._actuals_df)} actuals rows and {len(self._forecasts_df)} forecasts rows."
        )
        return self._actuals_df, self._forecasts_df

    @property
    def actuals(self) -> pd.DataFrame:
        if self._actuals_df is None:
            self.load_data()
        assert self._actuals_df is not None
        return self._actuals_df

    @property
    def forecasts(self) -> pd.DataFrame:
        if self._forecasts_df is None:
            self.load_data()
        assert self._forecasts_df is not None
        return self._forecasts_df
