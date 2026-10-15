# EMPlytic — Deployment Guide

This guide covers deploying **EMPlytic** (FastAPI Backend + PostgreSQL Database + React Frontend) to **Render** and **Railway**.

---

## 🚀 Option 1: Render (Recommended — 1-Click Blueprint)

Render is pre-configured via the [`render.yaml`](./render.yaml) blueprint included in this repository. It automatically spins up:
1. **Managed PostgreSQL Database** (`emplytic-db`)
2. **FastAPI Backend Web Service** (`emplytic-backend`)
3. **React Frontend Static Site** (`emplytic-frontend`) with client-side routing rewrites

### Step 1: Push your code to GitHub
1. Create a new repository on [GitHub](https://github.com/new) named `emplytic` (public or private).
2. Push your local repository to GitHub:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/emplytic.git
   git push -u origin main
   ```

### Step 2: Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and sign in.
2. Click **New +** in the top navigation bar and select **Blueprint**.
3. Connect your GitHub account and select your `emplytic` repository.
4. Render will read `render.yaml` and display the 3 resources:
   - Database: `emplytic-db` (Free tier)
   - Web Service: `emplytic-backend`
   - Static Site: `emplytic-frontend`
5. Click **Apply**.
6. Render will automatically build the backend, provision the database, build the React frontend, and deploy everything live!

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
