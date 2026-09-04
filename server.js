require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/qr', require('./routes/qr'));
app.use('/api/analytics', require('./routes/analytics'));

app.get('/r/:id', (req, res) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    db.prepare('INSERT INTO scans (qr_id, ip, user_agent) VALUES (?, ?, ?)').run(
      campaign.id,
      req.ip,
      req.headers['user-agent'] || ''
    );

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

app.listen(PORT, () => {
  console.log(`qr-tracker server running on http://localhost:${PORT}`);
});
