# SkillSync AI - Production Deployment & Operations Guide

This guide provides step-by-step instructions to deploy **SkillSync AI** to any standard hosting platform: **Render**, **Railway**, **Docker / Docker Compose**, or a **Plain Linux VPS (Ubuntu/Debian with Systemd + Nginx)**.

---

## 1. Prerequisites & Required Setup

### 1.1 MongoDB Atlas Database Setup
SkillSync AI requires a MongoDB database (v4.4+ to v8.x). For production hosting, use **MongoDB Atlas**:
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new Shared (M0 Free Tier) or Dedicated Cluster in your desired geographic region.
3. Under **Security > Database Access**:
   - Click **Add New Database User**.
   - Create a user (e.g. `skillsync_admin`) with **Read and write to any database** privileges and a strong password.
4. Under **Security > Network Access**:
   - Click **Add IP Address**.
   - For cloud providers with dynamic IPs (Render, Railway, Heroku), add `0.0.0.0/0` (Allow Access from Anywhere).
   - For a dedicated VPS, add your specific VPS static IPv4 address.
5. Under **Deployments > Database > Connect**:
   - Choose **Drivers > Node.js**.
   - Copy the connection string. It will look like:
     ```text
     mongodb+srv://<username>:<password>@<cluster>.mongodb.net/skillsync_ai?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your credentials, and specify `/skillsync_ai` as the database name.

### 1.2 Environment Variables Overview
Every production deployment must configure the following environment variables:

| Variable Name | Required | Example / Recommended Value | Description |
|:---|:---:|:---|:---|
| `PORT` | Yes | `5000` (or injected by platform) | Port for the Express backend server |
| `NODE_ENV` | Yes | `production` | Enables production optimizations & logging |
| `TRUST_PROXY` | Yes | `true` | **Critical**: Enables reverse proxy trust for `express-rate-limit` & client IPs |
| `MONGO_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/skillsync_ai` | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | `(Use the 96-char secret from .env.production.template)` | Strong secret for signing JWT auth tokens (must be >= 32 chars) |
| `JWT_EXPIRE` | No | `30d` | Lifetime of issued JWT tokens |
| `CORS_ORIGIN` | Yes | `https://your-domain.com` | Exact public domain of your web app (comma-separated if multiple) |
| `GEMINI_API_KEY` | Optional | `AIzaSy...` | If omitted, proctoring & mentor seamlessly use deterministic rules & knowledgebase |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Model for interview answer evaluation |
| `GEMINI_MENTOR_MODEL`| No | `gemini-2.5-flash` | Model for technical mentor chat |
| `INTERVIEW_LLM_TIMEOUT_MS` | No | `8000` | Fallback timeout in milliseconds |

> [!WARNING]
> **HTTPS is Required for Proctoring Features**: Web browsers strictly require a **Secure Context (`https://`)** to access `navigator.mediaDevices.getUserMedia` (webcam and microphone) and the `SpeechRecognition` API. If deployed over plain HTTP, mock interviews will be unable to capture audio/video.

---

## 2. Seeding Production Database

After launching the database for the first time, run the initial seed scripts to populate default platform metrics and the 246-question interview bank:

```bash
# In the skillsync-ai-backend/skillsync-ai-backend directory:
MONGO_URI="your-production-mongo-uri" JWT_SECRET="your-jwt-secret" npm run seed
MONGO_URI="your-production-mongo-uri" JWT_SECRET="your-jwt-secret" npm run seed:questions
```

Both scripts are fully **idempotent** and can be re-run safely at any time.

---

## 3. Platform-Specific Deployment Guides

### Option A: Render (Recommended PaaS)
Render provides zero-downtime deploys and automated SSL certificates.

1. **Create Web Service**:
   - Push your code to a private GitHub/GitLab repository.
   - On the Render dashboard, click **New + > Web Service**.
   - Connect your repository.
2. **Configure Settings**:
   - **Name**: `skillsync-ai`
   - **Root Directory**: `skillsync-ai-backend/skillsync-ai-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm ci --omit=dev`
   - **Start Command**: `npm start`
   - **Plan**: `Free` or `Starter`
3. **Health Check Path**:
   - Under **Advanced**, set **Health Check Path** to `/api/status`.
4. **Environment Variables**:
   Add the variables listed in Section 1.2:
   - `NODE_ENV`: `production`
   - `TRUST_PROXY`: `true`
   - `MONGO_URI`: `(Your Atlas connection string)`
   - `JWT_SECRET`: `(Your 96-character random secret)`
   - `CORS_ORIGIN`: `https://skillsync-ai.onrender.com` (replace with your assigned Render URL)
5. **Alternative: 1-Click Blueprint**:
   You can also select **New > Blueprint** and select `render.yaml` from the project root.

---

### Option B: Railway
Railway automatically detects Node.js and Procfiles.

1. Create a new project on [Railway.app](https://railway.app).
2. Connect your GitHub repository.
3. In **Settings > General**:
   - **Root Directory**: Set to `skillsync-ai-backend/skillsync-ai-backend` (or use the root `Procfile`).
   - **Build Command**: `npm ci --omit=dev`
   - **Start Command**: `npm start`
4. In **Variables**, add all required environment variables (`MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `TRUST_PROXY=true`, `CORS_ORIGIN=https://your-railway-domain.up.railway.app`).
5. In **Networking**, click **Generate Domain** to get an automatic HTTPS URL.

---

### Option C: Docker & Docker Compose
A production `Dockerfile` and `docker-compose.yml` are provided in the project root.

#### 1. Local Production Simulation (App + MongoDB)
To run SkillSync AI with a local MongoDB container:
```bash
# From the project root (where docker-compose.yml is located):
docker-compose up -d --build
```
- Web Application: `http://localhost:5000`
- API Health Check: `http://localhost:5000/api/status`
- View logs: `docker-compose logs -f skillsync-app`

#### 2. Standalone Docker Container (Connecting to Atlas)
To build and run only the SkillSync application container:
```bash
# Build the container image:
docker build -t skillsync-ai:latest .

# Run the container with environment variables:
docker run -d \
  --name skillsync-ai \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e TRUST_PROXY=true \
  -e PORT=5000 \
  -e MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/skillsync_ai" \
  -e JWT_SECRET="your-secure-jwt-secret-here-min-64-chars" \
  -e CORS_ORIGIN="https://your-domain.com" \
  skillsync-ai:latest
```

---

### Option D: Plain Linux VPS (Ubuntu / Debian)

For deploying on an Ubuntu 22.04 / 24.04 LTS VPS (DigitalOcean, Linode, AWS EC2, Hetzner).

#### Step 1: Install Node.js LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git build-essential nginx certbot python3-certbot-nginx
```

#### Step 2: Clone & Install Dependencies
```bash
sudo mkdir -p /var/www/skillsync
sudo chown -R $USER:$USER /var/www/skillsync
cd /var/www/skillsync

# Copy or git clone your project files here
cd skillsync-ai-backend/skillsync-ai-backend
npm ci --omit=dev
```

#### Step 3: Configure Systemd Service
Create `/etc/systemd/system/skillsync.service`:
```ini
[Unit]
Description=SkillSync AI Career Readiness Platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/skillsync/skillsync-ai-backend/skillsync-ai-backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=5000
Environment=TRUST_PROXY=true
Environment=MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/skillsync_ai
Environment=JWT_SECRET=your_96_char_secret_from_template
Environment=JWT_EXPIRE=30d
Environment=CORS_ORIGIN=https://skillsync.yourdomain.com

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable skillsync
sudo systemctl start skillsync
sudo systemctl status skillsync
```

#### Step 4: Configure Nginx Reverse Proxy with HTTPS
Create `/etc/nginx/sites-available/skillsync`:
```nginx
server {
    listen 80;
    server_name skillsync.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        
        # Reverse Proxy Headers for Express and WebSockets
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable proxy buffering for Server-Sent Events (SSE mentor stream)
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
```

Enable site and acquire SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/skillsync /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Generate Let's Encrypt SSL certificate
sudo certbot --nginx -d skillsync.yourdomain.com
```

---

## 4. Verification & Post-Deployment Checklist

1. **Verify Health Endpoint**:
   ```bash
   curl -i https://your-domain.com/api/status
   ```
   Must return HTTP 200 with `status: "Active"` and `database.connected: true`.
2. **Verify Frontend Single-Page App**:
   Navigate to `https://your-domain.com` in Google Chrome or Firefox. Confirm:
   - Dashboard loads with metrics.
   - Auth dialog opens.
   - Profile, Resume, and Coding tabs render.
3. **Verify Webcam & Mic in Secure Context**:
   - Go to Mock Interview tab.
   - Click **Start Interview Wizard**.
   - Verify browser prompts for camera/mic permission and video stream appears in preview.
4. **Verify Reverse Proxy Client IP Handling**:
   - In application logs, confirm client IPs are recognized rather than `127.0.0.1`.

---
*Maintained by SkillSync AI Engineering & DevOps Operations.*
