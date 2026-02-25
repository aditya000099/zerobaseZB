# ZeroBase

Open-source Backend as a Service — Database, Auth, Storage, and Realtime out of the box.

## Quick Start (Local)

```bash
git clone https://github.com/aditya000099/zerobase.git
cd zerobase
cp .env.example .env        # edit credentials
docker compose up --build
```

Dashboard → `http://localhost:3000`

---

## Hosting Guide

ZeroBase ships as a single Docker image. Any host that runs Docker works.

### 1. Create a `.env` file

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=zerobase_main
```

### 2. Pick a host & deploy

#### Option A — VPS (cheapest)

Any \$5/mo VPS (DigitalOcean, Hetzner, Linode, AWS Lightsail):

```bash
# SSH into your server
ssh user@your-server

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone & run
git clone https://github.com/aditya000099/zerobase.git
cd zerobase
cp .env.example .env   # edit with real credentials
docker compose up -d   # runs in background
```

Point a domain to your server IP and put it behind a reverse proxy (Caddy/Nginx) for HTTPS.

**Caddy example** (`/etc/caddy/Caddyfile`):
```
api.yourdomain.com {
    reverse_proxy localhost:3000
}
```

#### Option B — Railway / Render

1. Push to GitHub
2. Create a new project on [Railway](https://railway.app) or [Render](https://render.com)
3. Add a PostgreSQL service
4. Set env vars: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
5. Deploy — it auto-detects the `Dockerfile`

#### Option C — Fly.io

```bash
fly launch            # auto-detects Dockerfile
fly postgres create   # managed Postgres
fly secrets set POSTGRES_USER=admin POSTGRES_PASSWORD=<pw> POSTGRES_DB=zerobase_main
fly deploy
```

### 3. Connect your app

```bash
npm install zerobase
```

```js
import { ZeroBaseClient, DatabaseClient, AuthClient, StorageClient, RealtimeClient } from "zerobase";

const client = new ZeroBaseClient("your-project-id", "https://api.yourdomain.com", "your-api-key");
const db = new DatabaseClient(client);
const auth = new AuthClient(client);
const storage = new StorageClient(client);
const rt = new RealtimeClient(client);
```

---

## Stack

| Layer     | Tech             |
|-----------|------------------|
| API       | Node.js, Express |
| Database  | PostgreSQL       |
| Dashboard | React            |
| Realtime  | WebSocket        |
| Container | Docker           |
| SDK       | TypeScript (npm) |
