# EMPlytic — Deployment Guide

This guide covers deploying **EMPlytic** (FastAPI Backend + PostgreSQL Database + React Frontend) to **Render** and **Railway**.

---

## 🚀 Option 1: Render (100% Free Tier — No Credit Card Required)

Render is pre-configured via the [`render.yaml`](./render.yaml) blueprint included in this repository. It automatically spins up:
1. **FastAPI Backend Web Service** (`emplytic-backend`) — Free compute instance (`plan: free`, 0.1 CPU, 512 MB RAM).
2. **React Frontend Static Site** (`emplytic-frontend`) — Free static site hosting on Render's global CDN with client-side SPA routing rewrites.
3. **Database** — Runs out-of-the-box on built-in SQLite with zero setup and automatic demo dataset & user seeding! *(Optional: If you want cloud PostgreSQL without paying or entering a credit card, you can use [Neon.tech](https://neon.tech) and set `DATABASE_URL` in your backend environment variables).*

### Method A: 1-Click Blueprint (Recommended)
1. Push your latest code to GitHub:
   ```bash
   git push origin master
   ```
2. Go to the [Render Dashboard](https://dashboard.render.com/) and sign in.
3. Click **New +** in the top navigation bar and select **Blueprint**.
4. Connect your GitHub account and select your `EMPlytic` repository.
5. Render reads `render.yaml` and displays the 2 free services:
   - Web Service: `emplytic-backend` (Free)
   - Static Site: `emplytic-frontend` (Free)
6. Click **Apply**. Render will deploy both services at **$0 / month with no credit card required**.

> **Note on `VITE_API_URL`**: Render defaults your backend service address to `https://emplytic-backend.onrender.com`. If your backend receives a unique suffix (e.g., `https://emplytic-backend-xyz.onrender.com`), simply go to **`emplytic-frontend`** → **Environment** in the Render Dashboard, update `VITE_API_URL` with your actual backend URL, and click **Manual Deploy** → **Deploy latest commit**.

### Method B: Manual Free Setup on Render (Alternative)
If you prefer creating services manually from the Render dashboard:
1. **Deploy Backend (Web Service):**
   - Click **New +** → **Web Service** → Connect your repository.
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Select **Free** ($0/mo).
   - Under **Environment Variables**, add:
     - `PYTHON_VERSION`: `3.11.9`
     - `DEMO_MODE`: `true`
     - `ALLOWED_ORIGINS`: `*`
   - Click **Create Web Service**.
2. **Deploy Frontend (Static Site):**
   - Click **New +** → **Static Site** → Connect your repository.
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `./dist`
   - Under **Environment Variables**, add:
     - `VITE_API_URL`: `https://<your-backend-name>.onrender.com`
   - Under **Redirects/Rewrites**, add rewrite rule:
     - Source: `/*` → Destination: `/index.html` → Action: `Rewrite`
   - Click **Create Static Site**.

---

## 🚆 Option 2: Railway

Railway offers seamless full-stack hosting with zero-config database linking.

### Step 1: Push to GitHub
Make sure your code is pushed to your GitHub repository (as described above).

### Step 2: Deploy Backend & Database on Railway
1. Go to [Railway.app](https://railway.app/) and sign in with GitHub.
2. Click **New Project** → **Provision PostgreSQL**.
3. In the same project canvas, click **+ Create** → **GitHub Repo** → select your `emplytic` repo.
4. Click on the added repo service:
   - Go to **Settings** → **Root Directory**: set to `/backend`.
   - Go to **Variables** → Click **Add Reference** to link the PostgreSQL database:
     - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
     - `DEMO_MODE`: `true`
     - `ALLOWED_ORIGINS`: `*`
     - `SECRET_KEY`: `change-this-to-a-secure-random-key`
   - In **Settings** → **Networking** → Click **Generate Domain** (e.g. `emplytic-backend-production.up.railway.app`).

### Step 3: Deploy Frontend on Railway
1. In the same Railway project, click **+ Create** → **GitHub Repo** → select your `emplytic` repo again.
2. Click on the new service:
   - Go to **Settings** → **Root Directory**: set to `/frontend`.
   - Go to **Variables**:
     - `VITE_API_URL`: Paste the backend domain from Step 2 (e.g. `https://emplytic-backend-production.up.railway.app`).
   - In **Settings** → **Networking** → Click **Generate Domain**.
3. Your frontend is now connected to your backend and live!

---

## 🛠️ Environment Variables Reference

| Variable | Service | Description | Example / Recommended |
|---|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` (or SQLite fallback) |
| `DEMO_MODE` | Backend | Seeds initial demo dataset & accounts | `true` |
| `SECRET_KEY` | Backend | JWT signing secret | Any random 32+ character string |
| `ALLOWED_ORIGINS` | Backend | Allowed CORS origins | `*` (or your frontend domain) |
| `VITE_API_URL` | Frontend | Full URL of the backend API | `https://emplytic-backend.onrender.com` |

---

## 🔑 Default Login Credentials (when `DEMO_MODE=true`)

- **HR Administrator**:
  - Email: `admin@emplytic.com`
  - Password: `admin123`
- **Employee Portal**:
  - Email / ID: `employee@emplytic.com` *(or ID `1`)*
  - Password: `emp123`
