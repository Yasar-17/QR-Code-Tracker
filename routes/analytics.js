const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/:qrId/summary', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT
        COUNT(*) AS total_scans,
        COALESCE(SUM(CASE WHEN DATE(timestamp) = DATE('now') THEN 1 ELSE 0 END), 0) AS scans_today,
        COALESCE(SUM(CASE WHEN DATE(timestamp) >= DATE('now', '-6 days') THEN 1 ELSE 0 END), 0) AS scans_this_week,
        COUNT(DISTINCT ip) AS unique_ips
      FROM scans
      WHERE qr_id = ?
    `).get(req.params.qrId);

    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:qrId/daily', (req, res) => {
  try {
    const rows = db.prepare(`
      WITH RECURSIVE days(day) AS (
        SELECT DATE('now', '-29 days')
        UNION ALL
        SELECT DATE(day, '+1 day') FROM days WHERE day < DATE('now')
      )
      SELECT days.day AS date, COUNT(scans.id) AS count
      FROM days
      LEFT JOIN scans ON DATE(scans.timestamp) = days.day AND scans.qr_id = ?
      GROUP BY days.day
      ORDER BY days.day
    `).all(req.params.qrId);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:qrId/recent', (req, res) => {
  try {
    const scans = db.prepare(`
      SELECT timestamp, ip, user_agent
      FROM scans
      WHERE qr_id = ?
      ORDER BY timestamp DESC
      LIMIT 20
    `).all(req.params.qrId);

    res.json(scans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
