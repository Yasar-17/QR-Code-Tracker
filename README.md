# QR Tracker

A Node.js + Express backend for creating QR codes and tracking scans, with a single-page analytics dashboard.

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** SQLite via better-sqlite3 (no ORM)
- **Frontend:** Vanilla HTML, Tailwind CSS (CDN), Chart.js (CDN)

## Setup

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server runs at `http://localhost:3000` by default. Configure the port in `.env`:

```
PORT=3000
BASE_URL=http://localhost:3000
```

## API Endpoints

### QR Codes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/qr/create` | Create a campaign. Body: `{ "name": "...", "destination_url": "..." }` |
| GET | `/api/qr/list` | List all campaigns with scan counts |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/:qrId/summary` | Total scans, today, this week, unique IPs |
| GET | `/api/analytics/:qrId/daily` | Daily scan counts for the last 30 days |
| GET | `/api/analytics/:qrId/recent` | Last 20 scans |

### Redirect

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/r/:id` | Logs a scan, then 302 redirects to the destination URL |

## Deploying to Railway

1. Push your project to a GitHub repository
2. Go to [railway.app](https://railway.app) and sign in with GitHub
3. Click **New Project > Deploy from GitHub Repo** and select your repo
4. Railway will auto-detect Node.js and run `npm install` + `npm start`
5. Once deployed, go to the **Settings** tab and note your app URL (e.g. `https://qr-tracker.up.railway.app`)
6. In **Settings > Variables**, add:
   - `BASE_URL` = `https://your-app-url.up.railway.app` (no trailing slash)
7. Redeploy the service (Railway auto-redeploys on push, or click **Deploy** manually)

**Note:** This project uses SQLite, which stores data in a local file. On Railway, the filesystem is ephemeral — data will be lost on each redeploy. This is fine for demos and prototyping. For production, consider switching to a managed database (e.g. Railway's PostgreSQL plugin).

## Testing a QR Scan Locally

1. Start the server: `npm start`
2. Open `http://localhost:3000` in your browser
3. Click **New QR Code**, enter a name and URL (e.g. `https://example.com`)
4. Copy the redirect link shown after creation (e.g. `http://localhost:3000/r/1`)
5. Open that link in a new tab to simulate a scan
6. Return to the dashboard and click **View Analytics** to see the scan recorded

Or using curl:

```bash
# Create a QR code
curl -X POST http://localhost:3000/api/qr/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","destination_url":"https://example.com"}'

# Simulate a scan
curl -v http://localhost:3000/r/1

# Check analytics
curl http://localhost:3000/api/analytics/1/summary
```
