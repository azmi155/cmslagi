import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get hotspot profiles
router.get('/hotspot/:deviceId', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const profiles = await db
      .selectFrom('hotspot_profiles')
      .selectAll()
      .where('device_id', '=', parseInt(deviceId))
      .execute();

    res.json(profiles);
  } catch (error) {
    console.error('Get hotspot profiles error:', error);
    res.status(500).json({ error: 'Failed to get hotspot profiles' });
  }
});

// Add hotspot profile
router.post('/hotspot', requireAuth, async (req, res) => {
  try {
    const { device_id, name, rate_limit, session_timeout, shared_users } = req.body;

    if (!device_id || !name) {
      res.status(400).json({ error: 'Device ID and profile name are required' });
      return;
    }

    const profile = await db
      .insertInto('hotspot_profiles')
      .values({
        device_id,
        name,
        rate_limit,
        session_timeout,
        shared_users: shared_users || 1,
        created_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirst();

    res.status(201).json(profile);
  } catch (error) {
    console.error('Add hotspot profile error:', error);
    res.status(500).json({ error: 'Failed to add hotspot profile' });
  }
});

// Update hotspot profile
router.put('/hotspot/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rate_limit, session_timeout, shared_users } = req.body;

    const profile = await db
      .updateTable('hotspot_profiles')
      .set({
        name,
        rate_limit,
        session_timeout,
        shared_users: shared_users || 1
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json(profile);
  } catch (error) {
    console.error('Update hotspot profile error:', error);
    res.status(500).json({ error: 'Failed to update hotspot profile' });
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

// Get PPPoE profiles
router.get('/pppoe/:deviceId', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const profiles = await db
      .selectFrom('pppoe_profiles')
      .selectAll()
      .where('device_id', '=', parseInt(deviceId))
      .execute();

    res.json(profiles);
  } catch (error) {
    console.error('Get PPPoE profiles error:', error);
    res.status(500).json({ error: 'Failed to get PPPoE profiles' });
  }
});

// Add PPPoE profile
router.post('/pppoe', requireAuth, async (req, res) => {
  try {
    const { device_id, name, local_address, remote_address, rate_limit, session_timeout } = req.body;

    if (!device_id || !name) {
      res.status(400).json({ error: 'Device ID and profile name are required' });
      return;
    }

    const profile = await db
      .insertInto('pppoe_profiles')
      .values({
        device_id,
        name,
        local_address,
        remote_address,
        rate_limit,
        session_timeout,
        created_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirst();

    res.status(201).json(profile);
  } catch (error) {
    console.error('Add PPPoE profile error:', error);
    res.status(500).json({ error: 'Failed to add PPPoE profile' });
  }
});

// Update PPPoE profile
router.put('/pppoe/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, local_address, remote_address, rate_limit, session_timeout } = req.body;

    const profile = await db
      .updateTable('pppoe_profiles')
      .set({
        name,
        local_address,
        remote_address,
        rate_limit,
        session_timeout
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json(profile);
  } catch (error) {
    console.error('Update PPPoE profile error:', error);
    res.status(500).json({ error: 'Failed to update PPPoE profile' });
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
