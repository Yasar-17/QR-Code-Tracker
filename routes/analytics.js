const express = require('express');
const { queryAll } = require('../db');

const router = express.Router();

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

router.get('/:qrId/summary', (req, res) => {
  try {
    const id = Number(req.params.qrId);
    const scans = queryAll('scans', s => s.qr_id === id);
    const todayStr = today();
    const weekAgo = daysAgo(6);

    res.json({
      total_scans: scans.length,
      scans_today: scans.filter(s => s.timestamp && s.timestamp.startsWith(todayStr)).length,
      scans_this_week: scans.filter(s => s.timestamp && s.timestamp >= weekAgo).length,
      unique_ips: new Set(scans.map(s => s.ip)).size
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:qrId/daily', (req, res) => {
  try {
    const id = Number(req.params.qrId);
    const scans = queryAll('scans', s => s.qr_id === id);

    const dayCounts = {};
    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i);
      dayCounts[d] = 0;
    }

    scans.forEach(s => {
      if (s.timestamp) {
        const day = s.timestamp.slice(0, 10);
        if (dayCounts.hasOwnProperty(day)) {
          dayCounts[day]++;
        }
      }
    });

    const result = Object.entries(dayCounts).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:qrId/recent', (req, res) => {
  try {
    const id = Number(req.params.qrId);
    const scans = queryAll('scans', s => s.qr_id === id)
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, 20)
      .map(s => ({
        timestamp: s.timestamp,
        ip: s.ip,
        user_agent: s.user_agent
      }));

    res.json(scans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
