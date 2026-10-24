# Deployment Guide

This application is packaged as a **single unified Docker container** (root `Dockerfile`) that compiles the React TypeScript frontend and serves both the FastAPI endpoints (`/api/*`) and the static React Single Page Application (SPA) from a single port (`8000`).

Because all January 2026 Elexon data is pre-bundled in `backend/data/`, **no database, external storage, API keys, or internet egress** are required at runtime.

---

## Option A (Recommended): Render Web Service

1. **Sign in** to [Render](https://render.com).
2. Click **New +** &rarr; **Web Service**.
3. Connect your Git repository.
4. Configure the service:
   - **Name**: `wind-forecast-monitor` (or your anonymous repo name)
   - **Region**: Frankfurt / London (or closest to user)
   - **Environment**: **Docker** (Uses root `./Dockerfile`)
   - **Branch**: `main`
   - **Plan**: Free (or Starter)
5. **Environment Variables**:
   - `PORT`: `8000`
   - `DEFAULT_CUTOFF_HOUR`: `9`
   - `CORS_ORIGINS`: `*`
6. **Health Check Path**:
   - Set Health Check Path to: `/api/health`
7. Click **Create Web Service**.
8. **Warm-up Note**: Render free-tier instances sleep after 15 minutes of inactivity. When spinning up for the evaluation demo, ping the URL once 60 seconds in advance.

---

## Option B: Railway Deployment

1. **Sign in** to [Railway](https://railway.app).
2. Click **New Project** &rarr; **Deploy from GitHub repo**.
3. Select your repository. Railway automatically detects the root `Dockerfile`.
4. Under **Settings**:
   - **Port**: `8000`
   - **Healthcheck Path**: `/api/health`
5. **Variables**:
   - `PORT`: `8000`
   - `DEFAULT_CUTOFF_HOUR`: `9`
6. Click **Deploy**. The app will be accessible at your Railway-provided public domain.

---

## Option C: Local Docker Run

To verify the container locally:
```bash
# Build unified production container
docker build -t wind-forecast-monitor:latest .

# Run container on port 8000
docker run -p 8000:8000 -e PORT=8000 wind-forecast-monitor:latest
```
Visit `http://localhost:8000` in your web browser.

---

## Option D: Local Development (Without Docker)

Run backend and frontend concurrently in two terminals:

**Terminal 1 (Backend):**
```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API docs available at: `http://localhost:8000/docs`

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
Interactive dashboard available at: `http://localhost:5173`
