const express = require('express');
const QRCode = require('qrcode');
const db = require('../db');

const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { name, destination_url } = req.body;

    if (!name || !destination_url) {
      return res.status(400).json({ error: 'name and destination_url are required' });
    }

    const stmt = db.prepare('INSERT INTO campaigns (name, destination_url) VALUES (?, ?)');
    const result = stmt.run(name, destination_url);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/r/${result.lastInsertRowid}`;
    const qrImage = await QRCode.toDataURL(qrUrl);

    res.status(201).json({
      id: result.lastInsertRowid,
      name,
      qr_image: qrImage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/list', (req, res) => {
  try {
    const campaigns = db.prepare(`
      SELECT
        c.id,
        c.name,
        c.destination_url,
        c.created_at,
        COUNT(s.id) AS scan_count
      FROM campaigns c
      LEFT JOIN scans s ON c.id = s.qr_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all();

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
