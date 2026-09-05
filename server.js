const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, queryOne, insert } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const rawBASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const BASE_URL = rawBASE_URL ? rawBASE_URL.replace(/\/$/, '') : `http://localhost:${PORT}`;

const allowedOrigins = [
  'https://your-vercel-app.vercel.app',  // Replace with actual Vercel URL after deploy
  'http://localhost:3000'
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  }
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/qr', require('./routes/qr'));
app.use('/api/analytics', require('./routes/analytics'));

app.get('/r/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const campaign = queryOne('campaigns', c => c.id === id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    insert('scans', {
      qr_id: campaign.id,
      ip: req.ip,
      user_agent: req.headers['user-agent'] || ''
    });

    let url = campaign.destination_url;
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    res.redirect(302, url);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

initDb();
const server = app.listen(PORT, () => {
  console.log(`qr-tracker server running on ${BASE_URL || `http://localhost:${PORT}`}`);
  console.log(`RESOLVED BASE_URL: ${BASE_URL || 'NOT SET - using localhost fallback'}`);
  if (!process.env.BASE_URL) {
    console.warn('⚠️  BASE_URL environment variable is not set!');
    console.warn('   QR codes will use localhost URLs. Set BASE_URL in Railway dashboard.');
  }
});
