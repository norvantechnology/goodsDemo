# Deployment Guide: Vercel (Frontend) & Render (Backend)

This repository includes pre-configured deployment files (`render.yaml`, `vercel.json`) that allow **Render** and **Vercel** to automatically detect, build, and deploy your project with minimal configuration.

---

## Architecture Overview
- **Backend**: Node.js & Express API deployed on **Render** (Root Directory: `backend/`)
- **Frontend**: Vite + React SPA deployed on **Vercel** (Root Directory: `frontend/` or root `./`)
- **Database**: MongoDB Atlas (Cloud)

---

## Part 1: Deploy Backend to Render

### Option A: Automatic Blueprint (Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub/GitLab repository.
4. Render will automatically read [`render.yaml`](./render.yaml) and configure:
   - **Name**: `goodsdemo-backend`
   - **Runtime**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
5. During the prompt, enter your `MONGODB_URI`:
   ```
   mongodb+srv://<username>:<password>@cluster0.j4s9xww.mongodb.net/goodsdemo?retryWrites=true&w=majority
   ```
   *(Render will automatically generate a secure random `JWT_SECRET` for you).*
6. Click **Apply**.
7. Copy your deployed backend URL (e.g. `https://goodsdemo-backend.onrender.com`).

---

### Option B: Manual Web Service
If you prefer creating a Web Service manually:
1. Click **New +** → **Web Service**.
2. Select your repository.
3. Configure the settings:
   | Setting | Value |
   | :--- | :--- |
   | **Name** | `goodsdemo-backend` |
   | **Region** | Oregon (or closest to you) |
   | **Root Directory** | `backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: your MongoDB Atlas connection string
   - `JWT_SECRET`: your custom secret key (minimum 32 characters)
   - `JWT_EXPIRES_IN`: `7d`
5. Click **Create Web Service**.

---

## Part 2: Seed the Database (Initial Data)

Once the backend is live on Render:
1. In the Render Dashboard, go to your `goodsdemo-backend` service.
2. Click **Shell** in the left menu.
3. Run the seed script:
   ```bash
   npm run seed
   ```
   This will initialize:
   - Locations (Warehouses A, B, C and Shops B, C)
   - Product categories & initial catalog
   - Demo user accounts (`admin@demo.com`, `accountant@demo.com`, etc., password: `password123`)

---

## Part 3: Deploy Frontend to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project**.
3. Import your GitHub/GitLab repository.
4. Vercel will automatically detect `vercel.json` and Vite framework:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (or click Edit and select `frontend`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist` (or `frontend/dist` if root)
5. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://your-backend.onrender.com/api` |
   *(Replace with your actual Render backend URL from Part 1).*
6. Click **Deploy**.

---

## Why These Files Work Automatically

- **`render.yaml` (Root)**:
  Instructs Render's infrastructure-as-code engine on where the code is (`backend/`), how to build and start it, sets up health checks, and configures environment variables automatically.

- **`vercel.json` (Root & `frontend/`)**:
  Instructs Vercel to route all client-side URLs (`/products`, `/pos`, `/sales`, `/inventory`, etc.) to `/index.html` (SPA fallback), preventing 404 errors when pages are reloaded or directly visited.

- **`frontend/src/services/api.js`**:
  Dynamically uses `VITE_API_URL` when deployed to production, while seamlessly falling back to Vite's local `/api` proxy in local development.

- **`backend/src/server.js`**:
  CORS is configured to accept requests from any origin (`*`), allowing the Vercel frontend to communicate with the Render backend without CORS errors.
