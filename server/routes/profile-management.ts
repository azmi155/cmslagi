import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Load hotspot profiles from device
router.post('/hotspot/:deviceId/load', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Get device info
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', parseInt(deviceId))
      .executeTakeFirst();

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Simulate loading profiles from MikroTik device
    // In real implementation, you would connect to the MikroTik API here
    const simulatedProfiles = [
      {
        name: 'default',
        rate_limit: '1M/1M',
        session_timeout: 3600,
        shared_users: 1
      },
      {
        name: 'premium',
        rate_limit: '5M/5M',
        session_timeout: 7200,
        shared_users: 2
      },
      {
        name: 'basic',
        rate_limit: '512k/512k',
        session_timeout: 1800,
        shared_users: 1
      }
    ];

    // Save profiles to database
    const savedProfiles = [];
    for (const profile of simulatedProfiles) {
      // Check if profile already exists
      const existing = await db
        .selectFrom('hotspot_profiles')
        .selectAll()
        .where('device_id', '=', parseInt(deviceId))
        .where('name', '=', profile.name)
        .executeTakeFirst();

      if (!existing) {
        const saved = await db
          .insertInto('hotspot_profiles')
          .values({
            device_id: parseInt(deviceId),
            name: profile.name,
            rate_limit: profile.rate_limit,
            session_timeout: profile.session_timeout,
            shared_users: profile.shared_users,
            created_at: new Date().toISOString()
          })
          .returningAll()
          .executeTakeFirst();

        savedProfiles.push(saved);
      } else {
        savedProfiles.push(existing);
      }
    }

    res.json({
      message: `Loaded ${savedProfiles.length} hotspot profiles from device`,
      profiles: savedProfiles
    });
  } catch (error) {
    console.error('Load hotspot profiles error:', error);
    res.status(500).json({ error: 'Failed to load hotspot profiles' });
  }
});

// Load PPPoE profiles from device
router.post('/pppoe/:deviceId/load', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Get device info
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', parseInt(deviceId))
      .executeTakeFirst();

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Simulate loading PPPoE profiles from MikroTik device
    const simulatedProfiles = [
      {
        name: 'pppoe-default',
        local_address: '192.168.1.1',
        remote_address: '192.168.1.2-192.168.1.100',
        rate_limit: '2M/2M',
        session_timeout: 0
      },
      {
        name: 'pppoe-premium',
        local_address: '192.168.1.1',
        remote_address: '192.168.1.101-192.168.1.150',
        rate_limit: '10M/10M',
        session_timeout: 0
      },
      {
        name: 'pppoe-business',
        local_address: '192.168.1.1',
        remote_address: '192.168.1.151-192.168.1.200',
        rate_limit: '20M/20M',
        session_timeout: 0
      }
    ];

    // Save profiles to database
    const savedProfiles = [];
    for (const profile of simulatedProfiles) {
      // Check if profile already exists
      const existing = await db
        .selectFrom('pppoe_profiles')
        .selectAll()
        .where('device_id', '=', parseInt(deviceId))
        .where('name', '=', profile.name)
        .executeTakeFirst();

      if (!existing) {
        const saved = await db
          .insertInto('pppoe_profiles')
          .values({
            device_id: parseInt(deviceId),
            name: profile.name,
            local_address: profile.local_address,
            remote_address: profile.remote_address,
            rate_limit: profile.rate_limit,
            session_timeout: profile.session_timeout,
            created_at: new Date().toISOString()
          })
          .returningAll()
          .executeTakeFirst();

        savedProfiles.push(saved);
      } else {
        savedProfiles.push(existing);
      }
    }

    res.json({
      message: `Loaded ${savedProfiles.length} PPPoE profiles from device`,
      profiles: savedProfiles
    });
  } catch (error) {
    console.error('Load PPPoE profiles error:', error);
    res.status(500).json({ error: 'Failed to load PPPoE profiles' });
  }
});

// Delete hotspot profile
router.delete('/hotspot/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .deleteFrom('hotspot_profiles')
      .where('id', '=', parseInt(id))
      .execute();

    if (result.length === 0) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({ message: 'Hotspot profile deleted successfully' });
  } catch (error) {
    console.error('Delete hotspot profile error:', error);
    res.status(500).json({ error: 'Failed to delete hotspot profile' });
  }
});

// Delete PPPoE profile
router.delete('/pppoe/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .deleteFrom('pppoe_profiles')
      .where('id', '=', parseInt(id))
      .execute();

    if (result.length === 0) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({ message: 'PPPoE profile deleted successfully' });
  } catch (error) {
    console.error('Delete PPPoE profile error:', error);
    res.status(500).json({ error: 'Failed to delete PPPoE profile' });
  }
});

export default router;
