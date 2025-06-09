import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// System performance metrics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    // Simulate system stats
    const stats = {
      cpu: {
        usage: Math.floor(Math.random() * 100),
        cores: 4
      },
      memory: {
        used: Math.floor(Math.random() * 8000000000), // Random bytes
        total: 16000000000, // 16GB
        usage: Math.floor(Math.random() * 80)
      },
      disk: {
        used: Math.floor(Math.random() * 500000000000), // Random bytes
        total: 1000000000000, // 1TB
        usage: Math.floor(Math.random() * 60)
      },
      network: {
        bytesIn: Math.floor(Math.random() * 1000000000),
        bytesOut: Math.floor(Math.random() * 1000000000),
        packetsIn: Math.floor(Math.random() * 1000000),
        packetsOut: Math.floor(Math.random() * 1000000)
      },
      uptime: Math.floor(Math.random() * 86400 * 30), // Random uptime in seconds
      timestamp: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ error: 'Failed to get system stats' });
  }
});

export default router;
