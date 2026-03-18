# Deployment Design: Vercel (Frontend) + Render (Backend)

**Date:** 2026-03-18
**Status:** Approved

## Goal

Deploy MusicSourceClassifier as a fully functional live application using free-tier hosting. Frontend on Vercel, backend on Render.

## Constraints

- Free tier only (Vercel free, Render free)
- PyTorch + torchopenl3 exceed Vercel's 250MB serverless function limit
- Render free tier: 512MB RAM, spins down after 15min inactivity
- torchopenl3 requires Python 3.11 (uses removed `imp` module on 3.12+)
- Cold starts (30-60s) are acceptable

## Memory Budget (512MB Render Free Tier)

Estimated peak usage during audio analysis:

| Component | Estimated RAM |
|-----------|--------------|
| Python interpreter | ~30MB |
| PyTorch CPU runtime | ~150-200MB |
| CNN model loaded | ~50MB |
| TorchOpenL3 model (lazy, first similarity call) | ~50-100MB |
| FAISS index + numpy embeddings | ~20MB |
| librosa + scipy overhead | ~50MB |
| Audio processing peak (single request) | ~50-100MB |
| **Total estimated peak** | **~400-550MB** |

This is tight for 512MB. Mitigations:
- Use `--preload` in gunicorn so models load before fork (no duplication)
- Set `MAX_CONTENT_LENGTH = 50MB` to prevent oversized uploads exhausting RAM
- If OOM occurs on free tier, upgrade to Render Starter ($7/mo, 1GB RAM)

## Architecture

```
User Browser
    │
    ├── Static assets (HTML/JS/CSS, demo tracks)
    │       served by Vercel CDN
    │
    └── POST /api/analyze (audio file upload)
            │
            └── Render (Docker Web Service)
                    Flask API
                    PyTorch CNN classifier
                    TorchOpenL3 + FAISS similarity search
                    Model files bundled in image (~9MB)
```

## Frontend: Vercel

### Build configuration
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18+

### Environment variable
- `VITE_API_BASE_URL` = Render backend URL (e.g. `https://musicsourceclassifier-api.onrender.com`)

### Files to add
- `vercel.json` — SPA rewrites so React Router works on refresh (all paths rewrite to `/index.html`)

### Static assets
- `public/demo/` (696KB of sample tracks) — served by Vercel CDN
- `public/favicon.ico`, `public/robots.txt` — served as-is

## Backend: Render

### Service type
- Docker Web Service (free tier)
- Region: Oregon (default, closest to most US users)

### Dockerfile
- Base image: `python:3.11-slim`
- Install PyTorch CPU-only from `https://download.pytorch.org/whl/cpu` (smaller than full CUDA build)
- Install remaining requirements from `requirements-deploy.txt` (excludes `torch`/`torchaudio` to avoid double-install from PyPI)
- Copy `backend/` directory with model files, embeddings, and CSV metadata
- Set `PYTHONUNBUFFERED=1` for real-time log output on Render
- Expose on `$PORT` (Render assigns this dynamically)

### Key Docker decisions
- Python 3.11 specifically — torchopenl3's dependency `resampy` uses `imp` module removed in 3.12
- CPU-only PyTorch — no GPU on free tier, saves ~1.5GB image size
- `torch` and `torchaudio` installed separately from CPU-only index BEFORE `requirements-deploy.txt` to prevent pip re-downloading the full CUDA build
- `torchcodec` excluded from deploy requirements — it has limited platform support and is not used by any backend code

### Production server
- Use `gunicorn` with `--preload` to load models in the master process (avoids memory duplication)
- Single worker (512MB RAM constraint)
- 120s timeout (covers cold-start model loading + inference)
- Bind to `0.0.0.0:$PORT`

### render.yaml
- Blueprint file for one-click deploy from GitHub
- Includes health check path `/api/health`

## Code Changes Required

### 1. Add `Dockerfile` (project root)
```dockerfile
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements-deploy.txt .
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements-deploy.txt

COPY backend/ ./backend/

EXPOSE 10000

CMD gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 1 --timeout 120 --preload "backend.app:create_app()"
```

### 2. Add `requirements-deploy.txt` (project root)
A copy of `requirements.txt` with `torch`, `torchaudio`, and `torchcodec` removed (these are either installed separately from the CPU index or unused in production):
```
Flask
flask-cors
librosa
numpy
faiss-cpu
torchopenl3
soundfile
tqdm
six
julius
nnAudio
pandas
gunicorn
```

### 3. Add `.dockerignore` (project root)
Prevents sending unnecessary files as Docker build context:
```
node_modules/
dist/
.git/
src/
public/
venv/
venv312/
*.md
.pytest_cache/
.claude/
uploads/
docs/
```

### 4. Add `vercel.json` (project root)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 5. Update `backend/app.py` — CORS + upload limit
- Set CORS origin from `CORS_ORIGINS` env var (defaults to `*` for dev)
- Add `MAX_CONTENT_LENGTH = 50MB` to prevent oversized uploads

```python
CORS(app, origins=os.environ.get("CORS_ORIGINS", "*").split(","))
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
```

### 6. Update health check to verify model state
`/api/health` should return 503 while models are still loading so Render doesn't route traffic prematurely:

```python
@routes.route('/api/health')
def health_check():
    if not globals.runtime_ready():
        return jsonify({"status": "loading"}), 503
    return jsonify({"status": "healthy"})
```

### 7. Add `render.yaml` (project root)
```yaml
services:
  - type: web
    name: musicsourceclassifier-api
    runtime: docker
    dockerfilePath: ./Dockerfile
    plan: free
    healthCheckPath: /api/health
    envVars:
      - key: PORT
        value: "10000"
      - key: CORS_ORIGINS
        sync: false
```

## Data files (bundled in Docker image)

| File | Size | Purpose |
|------|------|---------|
| `backend/models/audio_cnn_20epochs_best.pth` | 4.9MB | CNN classifier weights |
| `backend/embeddings/gtzan_real_X_pooled.npy` | 2.0MB | Pre-computed FAISS embeddings |
| `backend/embeddings/gtzan_real_X.npy` | 2.0MB | Raw embeddings |
| `backend/csv/gtzan_real_meta.csv` | 60KB | GTZAN track metadata |
| `backend/csv/GTZANindex.txt` | 68KB | Song catalog index |

Total: ~9MB. No external storage needed.

## Upload file handling

Uploaded files are written to `/app/uploads/` inside the container. This path is ephemeral (Render's filesystem resets on redeploy/restart). The existing code already deletes uploads after processing in `analysis_service.py:cleanup_upload()`, so this is fine.

## Cold start behavior

- Render free tier spins down after 15min of no traffic
- First request after spin-down: 30-60s while container boots and PyTorch loads
- Frontend's existing `AnalysisTimeline` UI naturally covers this — user sees "analysis in progress" with stage progression
- Health check returns 503 during model loading, so Render won't route traffic prematurely
- No additional frontend code changes needed

## Testing the deployment

1. Push code to GitHub
2. Connect repo to Vercel — set `VITE_API_BASE_URL` env var to Render URL
3. Connect repo to Render — it detects the Dockerfile automatically
4. Verify: `curl https://<render-url>/api/health` returns `{"status": "healthy"}`
5. Verify: visit Vercel URL, upload a track, confirm full analysis completes
6. Verify: test both AI and human verdict paths

## Security considerations

- CORS: set `CORS_ORIGINS` env var on Render to the Vercel domain (e.g. `https://musicsourceclassifier.vercel.app`)
- Upload size: capped at 50MB via `MAX_CONTENT_LENGTH`
- File uploads: existing UUID-based naming + cleanup-after-analysis is sufficient
- No secrets needed — model files are bundled, no API keys involved
