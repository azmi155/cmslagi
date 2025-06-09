import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Dashboard statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    // Get device counts
    const deviceStats = await db
      .selectFrom('devices')
      .select([
        db.fn.count('id').as('total_devices'),
        db.fn.countAll().filterWhere('is_online', '=', 1).as('online_devices') // Use integer comparison
      ])
      .executeTakeFirst();

    // Get user counts
    const hotspotUserCount = await db
      .selectFrom('hotspot_users')
      .select(db.fn.count('id').as('count'))
      .executeTakeFirst();

    const pppoeUserCount = await db
      .selectFrom('pppoe_users')
      .select(db.fn.count('id').as('count'))
      .executeTakeFirst();

    // Get active sessions
    const activeSessions = await db
      .selectFrom('user_sessions')
      .select(db.fn.count('id').as('count'))
      .where('is_active', '=', 1) // Use integer comparison
      .executeTakeFirst();

    res.json({
      devices: {
        total: Number(deviceStats?.total_devices) || 0,
        online: Number(deviceStats?.online_devices) || 0
      },
      users: {
        hotspot: Number(hotspotUserCount?.count) || 0,
        pppoe: Number(pppoeUserCount?.count) || 0
      },
      sessions: {
        active: Number(activeSessions?.count) || 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Monthly usage report
router.get('/monthly/:year/:month', requireAuth, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Generate sample monthly data
    const monthlyData = Array.from({ length: 30 }, (_, i) => ({
      date: `${year}-${month.padStart(2, '0')}-${(i + 1).toString().padStart(2, '0')}`,
      upload: Math.floor(Math.random() * 1000000000), // Random bytes
      download: Math.floor(Math.random() * 5000000000), // Random bytes
      sessions: Math.floor(Math.random() * 100)
    }));

    res.json(monthlyData);
  } catch (error) {
    console.error('Get monthly report error:', error);
    res.status(500).json({ error: 'Failed to get monthly report' });
  }
});

// Network traffic data
router.get('/traffic/:deviceId', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Generate sample traffic data for the last 24 hours
    const trafficData = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date();
      hour.setHours(hour.getHours() - (23 - i));
      
      return {
        time: hour.toISOString(),
        upload: Math.floor(Math.random() * 100000000), // Random bytes per hour
        download: Math.floor(Math.random() * 500000000) // Random bytes per hour
      };
    });

    res.json(trafficData);
  } catch (error) {
    console.error('Get traffic data error:', error);
    res.status(500).json({ error: 'Failed to get traffic data' });
  }
});

export default router;
