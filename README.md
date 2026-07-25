# Sekar Dairy Farm Livestock Trading Platform

A modern, responsive, and secure livestock trading platform designed specifically for **Sekar Dairy Farm**. The project consists of two separate frontend websites—one for customers to browse listings and contact the farm, and one for vendors to manage the catalog—both sharing a single, unified backend API.

---

## 📁 Repository Structure

The project is structured as a monorepo containing the following components:

*   **`backend/`**: A Node.js & Express REST API that handles database operations, authentication, and file uploads. Configured for hosting on **Render**.
*   **`customer/`**: A Vite-based React SPA for customers to search, filter, and view livestock media. Features interactive Call, WhatsApp, and Google Maps actions. Configured for hosting on **Vercel**.
*   **`vendor/`**: A Vite-based React SPA with dashboard interfaces for farm owners to manage listings, update availability status, and upload photos/videos. Configured for hosting on **Vercel**.

---

## 🛠️ Tech Stack & Integrations

1.  **Frontend Websites**: React 18, Vite, Lucide Icons, and Vanilla CSS with custom glassmorphic aesthetics, fluid transitions, and responsive sliders.
2.  **Shared Backend**: Node.js, Express, Multer.
3.  **Database Integration (Free)**:
    *   **Production**: **MongoDB Atlas** (Free Tier - 512MB).
    *   **Local Development Fallback**: Automatically falls back to a **local JSON database** (`backend/data/listings.json` and `users.json`) if no database URI is supplied, ensuring out-of-the-box operation.
4.  **Media Upload & Storage (Free)**:
    *   **Production**: **Cloudinary** (Free Tier - 25GB Storage/Bandwidth). Auto-optimizes photos and video uploads.
    *   **Local Development Fallback**: Automatically falls back to saving uploads on the **local server disk** (`backend/uploads/`) and serves them statically.

---

## 🔑 Default Credentials

The platform is seeded with a default vendor admin user on startup:
*   **Username**: `sekar`
*   **Password**: `farm123`

*(You can customize these credentials in the environment variables.)*

---

## 🚀 Local Development Setup

To run the platform locally, follow these steps:

### Prerequisites
Make sure you have Node.js and NPM installed on your machine. (If using the provided workspace setup, a local portable environment is already configured in `.node_env/`).

### 1. Run the Backend Server
1. Navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your keys (optional, will run with local fallback if empty):
   ```bash
   cp .env.example .env
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *The server will run on [http://localhost:5000](http://localhost:5000).*

### 2. Run the Customer Portal
1. Navigate to the `customer` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   *The website will be active on [http://localhost:3000](http://localhost:3000).*

### 3. Run the Vendor Portal
1. Navigate to the `vendor` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   *The admin panel will be active on [http://localhost:3001](http://localhost:3001).*

---

## 🌐 Hosting & Deployment Guide

This project is configured to deploy directly to GitHub, Render, and Vercel.

### 1. GitHub Setup
Initialize Git in the root directory and push your code:
```bash
git init
git add .
git commit -m "Initial commit - Sekar Dairy Farm Livestock Platform"
# Create a repository on GitHub, then link and push:
git remote add origin https://github.com/YOUR_USERNAME/sekar-dairy-farm.git
git branch -M main
git push -u origin main
```

---

### 2. Render Deployment (Backend Server)
Deploy the Express API to **Render** using the provided `render.yaml` Blueprint or manually:

#### Option A: Deployment via Blueprint (Recommended)
1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository.
4. Render will read the root `render.yaml` file and automatically configure the Web Service with the correct root directory (`backend`), build commands (`npm install`), and environment variables.
5. Click **Apply** to deploy.

#### Option B: Manual Setup
1. Create a new **Web Service** on Render.
2. Connect your GitHub repository.
3. Set **Root Directory** to `backend`.
4. Set **Runtime** to `Node`.
5. Set **Build Command** to `npm install`.
6. Set **Start Command** to `npm start`.
7. Under **Environment Variables**, add the following:
   *   `PORT`: `5000`
   *   `MONGODB_URI`: *Your free MongoDB Atlas connection string*
   *   `JWT_SECRET`: *A secure random string (e.g. `mySecretKey456`)*
   *   `CLOUDINARY_CLOUD_NAME`: *Your Cloudinary cloud name*
   *   `CLOUDINARY_API_KEY`: *Your Cloudinary API key*
   *   `CLOUDINARY_API_SECRET`: *Your Cloudinary API secret*
   *   `ADMIN_USERNAME`: `sekar` (or your custom admin name)
   *   `ADMIN_PASSWORD`: *Your custom admin password*

---

### 3. Vercel Deployment (Customer and Vendor Frontends)
Vercel is ideal for hosting the static React frontends. You will deploy them as two separate Vercel projects.

#### Deploying the Customer Portal:
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** > **Project** and import your GitHub repository.
3. Under **Project Name**, enter `sekar-dairy-farm-customer`.
4. Under **Root Directory**, click edit and select **`customer`**.
5. Keep the default build settings (Vite settings are automatically detected).
6. Under **Environment Variables**, add:
   *   `VITE_API_URL`: *The HTTPS URL of your deployed Render backend (e.g., `https://sekar-dairy-farm-backend.onrender.com`)*
7. Click **Deploy**.

#### Deploying the Vendor Portal:
1. Back on the Vercel Dashboard, click **Add New** > **Project** and import the same repository.
2. Under **Project Name**, enter `sekar-dairy-farm-vendor`.
3. Under **Root Directory**, click edit and select **`vendor`**.
4. Keep the default build settings.
5. Under **Environment Variables**, add:
   *   `VITE_API_URL`: *The HTTPS URL of your deployed Render backend (e.g., `https://sekar-dairy-farm-backend.onrender.com`)*
6. Click **Deploy**.

---

## ⚙️ Free Account Registrations

To enable production databases and uploads:
1.  **MongoDB Atlas (Free Database)**:
    *   Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
    *   Create a free M0 cluster.
    *   Whitelist all IP addresses (`0.0.0.0/0`) in Network Access.
    *   Create a database user and copy the connection URI into your Render `MONGODB_URI` environment variable.
2.  **Cloudinary (Free Image & Video Storage)**:
    *   Sign up at [cloudinary.com](https://cloudinary.com).
    *   Go to your dashboard to retrieve your **Cloud Name**, **API Key**, and **API Secret**.
    *   Copy these credentials to your Render environment variables.
