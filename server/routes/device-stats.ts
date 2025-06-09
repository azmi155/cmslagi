import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get device statistics
router.get('/:deviceId', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Get latest stats for the device
    const latestStats = await db
      .selectFrom('device_stats')
      .selectAll()
      .where('device_id', '=', parseInt(deviceId))
      .orderBy('recorded_at', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (!latestStats) {
      // Generate and store sample stats if none exist
      const sampleStats = {
        device_id: parseInt(deviceId),
        cpu_usage: Math.floor(Math.random() * 80) + 10, // 10-90%
        memory_usage: Math.floor(Math.random() * 70) + 20, // 20-90%
        disk_usage: Math.floor(Math.random() * 60) + 15, // 15-75%
        uptime: Math.floor(Math.random() * 86400 * 30), // 0-30 days in seconds
        temperature: Math.floor(Math.random() * 30) + 35, // 35-65°C
        voltage: (Math.random() * 2 + 11).toFixed(1), // 11-13V
        recorded_at: new Date().toISOString()
      };

      const newStats = await db
        .insertInto('device_stats')
        .values(sampleStats)
        .returningAll()
        .executeTakeFirst();

      res.json(newStats);
    } else {
      res.json(latestStats);
    }
  } catch (error) {
    console.error('Get device stats error:', error);
    res.status(500).json({ error: 'Failed to get device statistics' });
  }
});

// Get device statistics history
router.get('/:deviceId/history', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { hours = 24 } = req.query;
    
    const since = new Date();
    since.setHours(since.getHours() - parseInt(hours as string));
    
    const stats = await db
      .selectFrom('device_stats')
      .selectAll()
      .where('device_id', '=', parseInt(deviceId))
      .where('recorded_at', '>=', since.toISOString())
      .orderBy('recorded_at', 'desc')
      .execute();

    res.json(stats);
  } catch (error) {
    console.error('Get device stats history error:', error);
    res.status(500).json({ error: 'Failed to get device statistics history' });
  }
});

// Record new device statistics
router.post('/:deviceId', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { cpu_usage, memory_usage, disk_usage, uptime, temperature, voltage } = req.body;

    const stats = await db
      .insertInto('device_stats')
      .values({
        device_id: parseInt(deviceId),
        cpu_usage: cpu_usage || 0,
        memory_usage: memory_usage || 0,
        disk_usage: disk_usage || 0,
        uptime: uptime || 0,
        temperature: temperature || null,
        voltage: voltage || null,
        recorded_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirst();

    res.status(201).json(stats);
  } catch (error) {
    console.error('Record device stats error:', error);
    res.status(500).json({ error: 'Failed to record device statistics' });
  }
});

export default router;
