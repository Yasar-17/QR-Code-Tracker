const express = require('express');
const QRCode = require('qrcode');
const { queryAll, queryOne, insert, deleteById, save } = require('../db');

const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { name, destination_url } = req.body;

    if (!name || !destination_url) {
      return res.status(400).json({ error: 'name and destination_url are required' });
    }

    const id = insert('campaigns', {
      name,
      destination_url,
      created_at: new Date().toISOString()
    });

    const baseUrl = process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, '') : `http://localhost:${process.env.PORT || 3000}`;
    const qrUrl = `${baseUrl}/r/${id}`;
    const qrImage = await QRCode.toDataURL(qrUrl);

    res.status(201).json({
      id,
      name,
      qr_image: qrImage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/list', (req, res) => {
  try {
    const campaigns = queryAll('campaigns');
    const result = campaigns.map(c => ({
      id: c.id,
      name: c.name,
      destination_url: c.destination_url,
      created_at: c.created_at,
      scan_count: queryAll('scans', s => s.qr_id === c.id).length
    })).sort((a, b) => b.id - a.id);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const campaignId = Number(req.params.id);

    // Delete associated scans first to avoid orphaned data
    const scans = queryAll('scans', s => s.qr_id === campaignId);
    scans.forEach(s => {
      deleteById('scans', s.id);
    });

    // Delete the campaign
    deleteById('campaigns', campaignId);

    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
