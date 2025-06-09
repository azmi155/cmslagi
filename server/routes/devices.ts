import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all devices
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('Getting all devices...');
    const devices = await db
      .selectFrom('devices')
      .selectAll()
      .execute();

    console.log(`Found ${devices.length} devices`);
    res.json(devices);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

// Add device
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('Adding new device...');
    console.log('Request body:', req.body);
    
    const { name, type, host, port, username, password } = req.body;

    // Validate required fields
    if (!name || !type || !host || !username || !password) {
      console.log('Missing required fields:', { 
        name: !!name, 
        type: !!type, 
        host: !!host, 
        username: !!username, 
        password: !!password 
      });
      res.status(400).json({ error: 'All fields (name, type, host, username, password) are required' });
      return;
    }

    // Validate and set default port
    let devicePort = port;
    if (!devicePort) {
      devicePort = 8728; // Default MikroTik API port
    }
    
    // Convert to number and validate
    devicePort = parseInt(devicePort.toString());
    if (isNaN(devicePort) || devicePort < 1 || devicePort > 65535) {
      console.log('Invalid port:', port, 'converted to:', devicePort);
      res.status(400).json({ error: 'Port must be a valid number between 1 and 65535' });
      return;
    }

    console.log('Creating device with data:', {
      name,
      type,
      host,
      port: devicePort,
      username,
      password: '[HIDDEN]'
    });

    const device = await db
      .insertInto('devices')
      .values({
        name: name.trim(),
        type: type.trim(),
        host: host.trim(),
        port: devicePort,
        username: username.trim(),
        password: password,
        is_online: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirst();

    console.log('Device created successfully:', device?.id);
    
    if (!device) {
      console.error('Device creation failed - no data returned');
      res.status(500).json({ error: 'Failed to create device - no data returned' });
      return;
    }

    res.status(201).json(device);
  } catch (error) {
    console.error('Add device error:', error);
    
    // Check for specific SQLite errors
    if (error.message && error.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: 'A device with this name or host already exists' });
      return;
    }
    
    res.status(500).json({ error: 'Failed to add device: ' + error.message });
  }
});

// Update device
router.put('/:id', requireAuth, async (req, res) => {
  try {
    console.log('Updating device:', req.params.id);
    console.log('Request body:', req.body);
    
    const { id } = req.params;
    const { name, type, host, port, username, password } = req.body;

    // Validate required fields
    if (!name || !type || !host || !username || !password) {
      console.log('Missing required fields for update');
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Validate and set default port
    let devicePort = port || 8728;
    devicePort = parseInt(devicePort.toString());
    if (isNaN(devicePort) || devicePort < 1 || devicePort > 65535) {
      console.log('Invalid port for update:', devicePort);
      res.status(400).json({ error: 'Port must be a valid number between 1 and 65535' });
      return;
    }

    const device = await db
      .updateTable('devices')
      .set({
        name: name.trim(),
        type: type.trim(),
        host: host.trim(),
        port: devicePort,
        username: username.trim(),
        password: password,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();

    if (!device) {
      console.log('Device not found for update:', id);
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    console.log('Device updated successfully:', device.id);
    res.json(device);
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Failed to update device: ' + error.message });
  }
});

// Delete device
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    console.log('Deleting device:', req.params.id);
    const { id } = req.params;

    const result = await db
      .deleteFrom('devices')
      .where('id', '=', parseInt(id))
      .execute();

    if (result.length === 0) {
      console.log('Device not found for deletion:', id);
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    console.log('Device deleted successfully:', id);
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

// Sync device status
router.post('/:id/sync', requireAuth, async (req, res) => {
  try {
    console.log('Syncing device:', req.params.id);
    const { id } = req.params;

    // For now, just simulate a sync operation
    const isOnline = Math.random() > 0.3; // 70% chance online

    const device = await db
      .updateTable('devices')
      .set({
        is_online: isOnline,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();

    if (!device) {
      console.log('Device not found for sync:', id);
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    console.log('Device synced successfully:', id, 'Online:', isOnline);
    res.json({ 
      message: 'Device sync completed',
      is_online: isOnline,
      device: device
    });
  } catch (error) {
    console.error('Sync device error:', error);
    res.status(500).json({ error: 'Failed to sync device' });
  }
});

export default router;
