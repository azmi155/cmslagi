import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all devices
router.get('/', requireAuth, async (req, res) => {
  try {
    const devices = await db
      .selectFrom('devices')
      .selectAll()
      .execute();

    res.json(devices);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

// Add device
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, type, host, port, username, password } = req.body;

    if (!name || !type || !host || !username || !password) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const device = await db
      .insertInto('devices')
      .values({
        name,
        type,
        host,
        port: port || 8728,
        username,
        password,
        is_online: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirst();

    res.status(201).json(device);
  } catch (error) {
    console.error('Add device error:', error);
    res.status(500).json({ error: 'Failed to add device' });
  }
});

// Update device
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, host, port, username, password } = req.body;

    const device = await db
      .updateTable('devices')
      .set({
        name,
        type,
        host,
        port: port || 8728,
        username,
        password,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    res.json(device);
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// Delete device
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .deleteFrom('devices')
      .where('id', '=', parseInt(id))
      .execute();

    if (result.length === 0) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

// Sync device status
router.post('/:id/sync', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // For now, just simulate a sync operation
    const isOnline = Math.random() > 0.3; // 70% chance online

    await db
      .updateTable('devices')
      .set({
        is_online: isOnline,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .execute();

    res.json({ 
      message: 'Device sync completed',
      is_online: isOnline 
    });
  } catch (error) {
    console.error('Sync device error:', error);
    res.status(500).json({ error: 'Failed to sync device' });
  }
});

export default router;
