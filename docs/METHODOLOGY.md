# Methodology, Operational Assumptions & Metric Definitions

## 1. Wholesale Power Trading Context & The Decision Problem
UK electricity suppliers and wholesale market participants purchase power in the Day-Ahead Wholesale Auctions (EPEX SPOT GB and Nord Pool GB). 

### The Market Timeline
- **Gate Closure**: UK day-ahead auction orders close late morning (11:00 UTC / 12:00 CET) on day **D-1** for power delivery across the 24 hours of delivery day **D**.
- **Trading Desk Margin**: Power trading desks prepare and finalize procurement portfolios between 08:30 and 10:00 UTC on day D-1.
- **Default Cutoff Configuration**: The system adopts **09:00 UTC on D-1** as the default decision gate cutoff (fully configurable from 00:00 to 23:00 UTC). This guarantees that traders only utilize forecasts that had already been published and ingested before bidding commitments were made.

---

## 2. Zero Look-Ahead Leakage Forecast Selection
A core failure mode of retrospective forecasting evaluations is **look-ahead leakage**—evaluating forecasts published after the market auction had already closed (e.g. intraday runs published on day D).

### Selection Algorithm
For every target delivery time $T$ occurring on delivery date $D$:
1. Determine the gate closure cutoff timestamp:
   $$\text{Cutoff}(T) = (D - 1\text{ day}) \text{ at } H_{\text{cutoff}}\text{:00:00 UTC}$$
2. Query all forecasts published for target $T$:
   $$\mathcal{F}(T) = \{ f \in \text{WINDFOR} \mid f.\text{startTime} = T \}$$
3. Filter strictly for pre-decision publications:
   $$\mathcal{F}_{\text{eligible}}(T) = \{ f \in \mathcal{F}(T) \mid f.\text{publishTime} \le \text{Cutoff}(T) \}$$
4. Select the latest available vintage:
   $$f^*(T) = \arg\max_{f \in \mathcal{F}_{\text{eligible}}(T)} f.\text{publishTime}$$

If $\mathcal{F}_{\text{eligible}}(T)$ is empty, no forecast is assumed, and the target hour is recorded in diagnostics as an unhedged period.

### Fixed Lead Horizon Mode
To evaluate accuracy degradation as a function of lead time, the system also supports lead horizon filtering:
$$\mathcal{F}_{\ge H}(T) = \{ f \in \mathcal{F}(T) \mid f.\text{publishTime} \le T - H \text{ hours} \}$$
$$f^*_H(T) = \arg\max_{f \in \mathcal{F}_{\ge H}(T)} f.\text{publishTime}$$

---

## 3. Quantitative Error Metric Definitions

All errors are defined as:
$$e_i = \text{Forecast}_i - \text{Actual}_i$$

| Metric | Formula | Interpretation for Traders |
|---|---|---|
| **Bias (Mean Error)** | $\frac{1}{N} \sum_{i=1}^N (f_i - a_i)$ | Positive indicates over-forecast (under-procurement of thermal backup). Negative indicates under-forecast. |
| **MAE (Mean Absolute Error)** | $\frac{1}{N} \sum_{i=1}^N \|f_i - a_i\|$ | The average magnitude of volume imbalance. Baseline for calculating cash balancing reserve costs. |
| **RMSE (Root Mean Square Error)** | $\sqrt{\frac{1}{N} \sum_{i=1}^N (f_i - a_i)^2}$ | Heavily penalizes large ramp forecast errors. Higher RMSE relative to MAE indicates fat-tailed tail risk. |
| **Normalized MAE (NMAE)** | $\frac{\text{MAE}}{\frac{1}{N}\sum a_i} \times 100\%$ | Error expressed as a percentage of average January wind output (11,581 MW). |
| **sMAPE (Symmetric MAPE)** | $\frac{100\%}{N} \sum_{i=1}^N \frac{2\|f_i - a_i\|}{\|a_i\| + \|f_i\|}$ | Percentage error guarded against zero or near-zero generation periods. |
| **P90 Absolute Error** | 90th percentile of $\|e_i\|$ | **The Empirical Planning Buffer:** In 90% of hours, wind forecast error will not exceed this MW value. |
| **P5 & P95 Signed Error** | 5th and 95th percentiles of $e_i$ | Symmetrical 90% confidence envelope $[P_5, P_{95}]$. |

---

## 4. Dataset Resolution & Alignment
- **Actuals (`FUELHH`)**: 30-minute intervals (48 settlement periods/day = 1,488 records in Jan 2026).
- **Forecasts (`WINDFOR`)**: 60-minute intervals (24 hourly delivery intervals/day = 744 target hours in Jan 2026).
- **Alignment Strategy**:
  - Exact inner join on `startTime` matching top-of-the-hour outturns (`:00`) against the hourly forecasts.
  - Exactly **744 hours** are evaluated (100% hourly target coverage).
  - The intermediate half-hours (`:30`) in `FUELHH` are tracked and reported in data coverage diagnostics without synthetic interpolation.

---

## 5. Timezone & Operating Conventions
- In January, the United Kingdom observes Greenwich Mean Time (GMT).
- Standard UTC is identical to GMT. All datetimes in the database, API, and UI are stored and displayed in UTC.
