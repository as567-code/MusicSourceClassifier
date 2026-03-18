# Vercel + Render Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy MusicSourceClassifier frontend on Vercel and backend on Render (Docker), fully functional on free tiers.

**Architecture:** Vite static build on Vercel CDN with SPA rewrites. Flask+PyTorch backend in a Docker container on Render free tier with gunicorn, CPU-only PyTorch, and health-check-gated routing.

**Tech Stack:** Vercel (static hosting), Render (Docker web service), gunicorn, Docker, Python 3.11

**Spec:** `docs/superpowers/specs/2026-03-18-vercel-render-deployment-design.md`

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `Dockerfile` | Docker image for Render backend |
| Create | `requirements-deploy.txt` | Python deps without torch/torchaudio/torchcodec |
| Create | `.dockerignore` | Exclude frontend/node_modules from Docker context |
| Create | `vercel.json` | SPA rewrite rules for Vercel |
| Create | `render.yaml` | Render blueprint for one-click deploy |
| Modify | `backend/app.py:70-84` | CORS from env var + upload size limit |
| Modify | `backend/routes.py:15-17` | Health check verifies model state |
| Modify | `.gitignore` | Add venv312/ |

---

### Task 1: Create deployment requirements file

**Files:**
- Create: `requirements-deploy.txt`

This file lists Python dependencies for the Docker image, excluding `torch`, `torchaudio`, and `torchcodec` which are either installed separately from the CPU-only index or unused.

- [ ] **Step 1: Create `requirements-deploy.txt`**

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

Note: `pytest` is excluded — not needed in production. `torch`/`torchaudio` are installed from the CPU-only wheel index in the Dockerfile. `torchcodec` is unused by backend code.

- [ ] **Step 2: Commit**

```bash
git add requirements-deploy.txt
git commit -m "feat: add deploy-specific requirements excluding torch/torchcodec"
```

---

### Task 2: Create Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create `Dockerfile`**

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

Note: Shell form is required so that `$PORT` expands at runtime (Render sets this env var) and gunicorn's factory-call syntax `create_app()` works. `${PORT:-10000}` defaults to 10000 if unset. `gunicorn` is in `requirements-deploy.txt` so no separate install needed.

- [ ] **Step 2: Commit**

```bash
git add Dockerfile
git commit -m "feat: add Dockerfile for Render deployment (Python 3.11 + PyTorch CPU)"
```

---

### Task 3: Create .dockerignore

**Files:**
- Create: `.dockerignore`

- [ ] **Step 1: Create `.dockerignore`**

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
bun.lockb
package-lock.json
package.json
tsconfig*.json
tailwind.config.ts
vite.config.ts
postcss.config.js
eslint.config.js
index.html
```

- [ ] **Step 2: Commit**

```bash
git add .dockerignore
git commit -m "feat: add .dockerignore to slim Docker build context"
```

---

### Task 4: Update backend health check

**Files:**
- Modify: `backend/routes.py:15-17`

The health check must return 503 while models are loading so Render doesn't route traffic before the runtime is ready.

- [ ] **Step 1: Update health check in `backend/routes.py`**

Replace lines 15-17:

```python
@routes.route('/api/health')
def health_check():
    return jsonify({"status": "healthy"})
```

With:

```python
@routes.route('/api/health')
def health_check():
    if __package__:
        from . import globals
    else:
        import globals

    if not globals.runtime_ready():
        return jsonify({"status": "loading"}), 503
    return jsonify({"status": "healthy"})
```

- [ ] **Step 2: Verify existing tests still pass**

Run: `venv/bin/python -m pytest backend/tests -q 2>/dev/null || echo "No backend tests or venv issue — verify manually"`

- [ ] **Step 3: Commit**

```bash
git add backend/routes.py
git commit -m "feat: health check returns 503 until models finish loading"
```

---

### Task 5: Update CORS and add upload size limit

**Files:**
- Modify: `backend/app.py:70-84`

- [ ] **Step 1: Update `create_app()` in `backend/app.py`**

Replace line 72:

```python
    CORS(app)
```

With:

```python
    cors_origins = os.environ.get("CORS_ORIGINS", "*")
    if cors_origins == "*":
        CORS(app)
    else:
        CORS(app, origins=[o.strip() for o in cors_origins.split(",") if o.strip()])
```

- [ ] **Step 2: Add upload size limit**

After line 75 (`app.config['MODELS_LOADED'] = False`), add:

```python
    app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB
```

- [ ] **Step 3: Verify the app still starts locally**

Run: `venv312/bin/python -c "from backend.app import create_app; app = create_app(load_models=False); print('OK')"` (or equivalent with available venv)

- [ ] **Step 4: Commit**

```bash
git add backend/app.py
git commit -m "feat: CORS from CORS_ORIGINS env var + 50MB upload limit"
```

---

### Task 6: Create vercel.json

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures React Router paths like `/analyze` and `/results/ai` work on page refresh instead of returning 404.

- [ ] **Step 2: Verify Vite build still works**

Run: `npm run build`

Expected: Build succeeds, `dist/` directory contains `index.html` and asset files.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat: add vercel.json with SPA rewrites for React Router"
```

---

### Task 7: Create render.yaml

**Files:**
- Create: `render.yaml`

- [ ] **Step 1: Create `render.yaml`**

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

`sync: false` on `CORS_ORIGINS` means it must be set manually in Render's dashboard after deploy (set it to the Vercel domain URL).

- [ ] **Step 2: Commit**

```bash
git add render.yaml
git commit -m "feat: add render.yaml blueprint for one-click Render deploy"
```

---

### Task 8: Update .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add `venv312/` to `.gitignore`**

After the `venv/` line (line 30), add:

```
venv312/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add venv312/ to gitignore"
```

---

### Task 9: Local Docker build test

This task validates that the Dockerfile builds successfully before pushing to Render.

- [ ] **Step 1: Build the Docker image locally**

Run: `docker build -t musicsourceclassifier-api .`

Expected: Build completes without errors. Final image contains Python 3.11 + all deps + backend code.

Note: This will take several minutes on first build (PyTorch download ~200MB). If Docker is not installed locally, skip this task — Render will build it on push.

- [ ] **Step 2: Smoke-test the container locally**

Run: `docker run --rm -p 10000:10000 -e PORT=10000 musicsourceclassifier-api &`

Wait ~30s for models to load, then:

Run: `curl http://localhost:10000/api/health`

Expected: `{"status":"healthy"}`

- [ ] **Step 3: Stop the container**

Run: `docker stop $(docker ps -q --filter ancestor=musicsourceclassifier-api)`

---

### Task 10: Deploy to Render and Vercel

This task covers the actual deployment steps.

- [ ] **Step 1: Push all changes to GitHub**

Run: `git push origin main`

- [ ] **Step 2: Deploy backend to Render**

1. Go to https://dashboard.render.com
2. Click "New" > "Web Service"
3. Connect your GitHub repo (`as567-code/MusicSourceClassifier`)
4. Render auto-detects the Dockerfile
5. Set environment variables:
   - `PORT` = `10000`
   - `CORS_ORIGINS` = (leave blank until you have the Vercel URL)
6. Click "Create Web Service"
7. Wait for build + deploy (first build: ~5-10 min)

- [ ] **Step 3: Verify Render backend**

Run: `curl https://<your-render-url>/api/health`

Expected: `{"status":"healthy"}` (may take 30-60s on first request while models load)

- [ ] **Step 4: Deploy frontend to Vercel**

1. Go to https://vercel.com/dashboard
2. Click "Add New" > "Project"
3. Import your GitHub repo
4. Vercel auto-detects Vite — verify:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Set environment variable:
   - `VITE_API_BASE_URL` = `https://<your-render-url>` (the Render URL from Step 3, NO trailing slash)
6. Click "Deploy"

- [ ] **Step 5: Update Render CORS**

Go back to Render dashboard > your service > Environment:
- Set `CORS_ORIGINS` = `https://<your-vercel-url>` (e.g. `https://musicsourceclassifier.vercel.app`)
- Click "Save Changes" — Render will redeploy automatically

- [ ] **Step 6: End-to-end verification**

1. Visit your Vercel URL
2. Upload an audio file or click a sample track
3. Verify analysis completes and shows results
4. Test both AI and human verdict paths
5. Refresh the results page — verify it restores from session storage
