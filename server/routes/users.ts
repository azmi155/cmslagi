import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get hotspot users
router.get('/hotspot/:deviceId', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const users = await db
      .selectFrom('hotspot_users')
      .selectAll()
      .where('device_id', '=', parseInt(deviceId))
      .execute();

    res.json(users);
  } catch (error) {
    console.error('Get hotspot users error:', error);
    res.status(500).json({ error: 'Failed to get hotspot users' });
  }
});

// Add hotspot user
router.post('/hotspot', requireAuth, async (req, res) => {
  try {
    const { device_id, username, password, profile, comment } = req.body;

    if (!device_id || !username || !password) {
      res.status(400).json({ error: 'Device ID, username, and password are required' });
      return;
    }

    const user = await db
      .insertInto('hotspot_users')
      .values({
        device_id,
        username,
        password,
        profile,
        comment,
        disabled: false,
        bytes_in: 0,
        bytes_out: 0,
        uptime: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirst();

    res.status(201).json(user);
  } catch (error) {
    console.error('Add hotspot user error:', error);
    res.status(500).json({ error: 'Failed to add hotspot user' });
  }
});

// Update hotspot user
router.put('/hotspot/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, profile, comment, disabled } = req.body;

    const user = await db
      .updateTable('hotspot_users')
      .set({
        username,
        password,
        profile,
        comment,
        disabled: disabled || false,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Update hotspot user error:', error);
    res.status(500).json({ error: 'Failed to update hotspot user' });
  }
});

// Delete hotspot user
router.delete('/hotspot/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .deleteFrom('hotspot_users')
      .where('id', '=', parseInt(id))
      .execute();

    if (result.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete hotspot user error:', error);
    res.status(500).json({ error: 'Failed to delete hotspot user' });
  }
});

// Get PPPoE users
router.get('/pppoe/:deviceId', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const users = await db
      .selectFrom('pppoe_users')
      .selectAll()
      .where('device_id', '=', parseInt(deviceId))
      .execute();

    res.json(users);
  } catch (error) {
    console.error('Get PPPoE users error:', error);
    res.status(500).json({ error: 'Failed to get PPPoE users' });
  }
});

// Add PPPoE user
router.post('/pppoe', requireAuth, async (req, res) => {
  try {
    const { 
      device_id, username, password, profile, service, caller_id, 
      comment, contact_name, contact_phone, contact_whatsapp, service_cost 
    } = req.body;

    if (!device_id || !username || !password) {
      res.status(400).json({ error: 'Device ID, username, and password are required' });
      return;
    }

    const user = await db
      .insertInto('pppoe_users')
      .values({
        device_id,
        username,
        password,
        profile,
        service,
        caller_id,
        comment,
        contact_name,
        contact_phone,
        contact_whatsapp,
        service_cost: service_cost || 0,
        disabled: false,
        bytes_in: 0,
        bytes_out: 0,
        uptime: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirst();

    res.status(201).json(user);
  } catch (error) {
    console.error('Add PPPoE user error:', error);
    res.status(500).json({ error: 'Failed to add PPPoE user' });
  }
});

// Update PPPoE user
router.put('/pppoe/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      username, password, profile, service, caller_id, comment, 
      contact_name, contact_phone, contact_whatsapp, service_cost, disabled 
    } = req.body;

    const user = await db
      .updateTable('pppoe_users')
      .set({
        username,
        password,
        profile,
        service,
        caller_id,
        comment,
        contact_name,
        contact_phone,
        contact_whatsapp,
        service_cost: service_cost || 0,
        disabled: disabled || false,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Update PPPoE user error:', error);
    res.status(500).json({ error: 'Failed to update PPPoE user' });
  }
});

// Delete PPPoE user
router.delete('/pppoe/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .deleteFrom('pppoe_users')
      .where('id', '=', parseInt(id))
      .execute();

    if (result.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete PPPoE user error:', error);
    res.status(500).json({ error: 'Failed to delete PPPoE user' });
  }
});

export default router;
