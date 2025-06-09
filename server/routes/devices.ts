import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { createMikroTikConnection, parseMikroTikTime, parseMikroTikBytes } from '../services/mikrotik.js';

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
        is_online: 0, // Convert boolean to integer (false = 0)
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

    // Convert integer back to boolean for API response
    const responseDevice = {
      ...device,
      is_online: Boolean(device.is_online)
    };

    res.status(201).json(responseDevice);
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
    
    // Convert integer back to boolean for API response
    const responseDevice = {
      ...device,
      is_online: Boolean(device.is_online)
    };

    res.json(responseDevice);
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

// Sync device status and data
router.post('/:id/sync', requireAuth, async (req, res) => {
  try {
    console.log('Syncing device:', req.params.id);
    const { id } = req.params;

    // Get device details
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', parseInt(id))
      .executeTakeFirst();

    if (!device) {
      console.log('Device not found for sync:', id);
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    let isOnline = false;
    let syncData: any = {};

    // For MikroTik devices, try to connect and sync real data
    if (device.type === 'MikroTik') {
      console.log(`Attempting to connect to MikroTik device: ${device.host}:${device.port}`);
      
      const mikrotik = await createMikroTikConnection({
        host: device.host,
        port: device.port,
        username: device.username,
        password: device.password
      });

      if (mikrotik) {
        try {
          console.log('Successfully connected to MikroTik, testing connection...');
          
          // Test connection and get device info
          const testResult = await mikrotik.testConnection();
          if (testResult.success) {
            isOnline = true;
            syncData.identity = testResult.identity;
            syncData.version = testResult.version;

            // Get system resources
            const systemResource = await mikrotik.getSystemResource();
            if (systemResource) {
              // Parse CPU load
              const cpuLoad = parseInt(systemResource['cpu-load']) || 0;
              
              // Calculate memory usage
              const totalMemory = parseInt(systemResource['total-memory']) || 1;
              const freeMemory = parseInt(systemResource['free-memory']) || 0;
              const usedMemory = totalMemory - freeMemory;
              const memoryUsage = Math.round((usedMemory / totalMemory) * 100);

              // Calculate disk usage
              const totalDisk = parseInt(systemResource['total-hdd-space']) || 1;
              const freeDisk = parseInt(systemResource['free-hdd-space']) || 0;
              const usedDisk = totalDisk - freeDisk;
              const diskUsage = Math.round((usedDisk / totalDisk) * 100);

              // Parse uptime
              const uptime = parseMikroTikTime(systemResource.uptime);

              // Store device statistics
              await db
                .insertInto('device_stats')
                .values({
                  device_id: parseInt(id),
                  cpu_usage: cpuLoad,
                  memory_usage: memoryUsage,
                  disk_usage: diskUsage,
                  uptime: uptime,
                  temperature: null, // MikroTik doesn't always provide temperature
                  voltage: null, // MikroTik doesn't always provide voltage
                  recorded_at: new Date().toISOString()
                })
                .execute();

              syncData.systemResource = {
                cpuLoad,
                memoryUsage,
                diskUsage,
                uptime,
                boardName: systemResource['board-name'],
                version: systemResource.version
              };
            }

            console.log('Successfully synced MikroTik device data');
          } else {
            console.log('MikroTik connection test failed');
          }
        } catch (error) {
          console.error('Error during MikroTik sync:', error.message);
        } finally {
          await mikrotik.disconnect();
        }
      } else {
        console.log('Failed to establish connection to MikroTik device');
      }
    } else {
      // For non-MikroTik devices, just simulate a ping test
      isOnline = Math.random() > 0.3; // 70% chance online
      console.log(`Simulated sync for ${device.type} device:`, isOnline ? 'online' : 'offline');
    }

    // Update device status
    const updatedDevice = await db
      .updateTable('devices')
      .set({
        is_online: isOnline ? 1 : 0, // Convert boolean to integer
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();

    if (!updatedDevice) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    console.log('Device synced successfully:', id, 'Online:', isOnline);
    
    // Convert integer back to boolean for API response
    const responseDevice = {
      ...updatedDevice,
      is_online: Boolean(updatedDevice.is_online)
    };

    res.json({ 
      message: 'Device sync completed',
      is_online: isOnline,
      device: responseDevice,
      sync_data: syncData
    });
  } catch (error) {
    console.error('Sync device error:', error);
    res.status(500).json({ error: 'Failed to sync device: ' + error.message });
  }
});

// Test MikroTik connection
router.post('/:id/test-connection', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get device details
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', parseInt(id))
      .executeTakeFirst();

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    if (device.type !== 'MikroTik') {
      res.status(400).json({ error: 'This feature is only available for MikroTik devices' });
      return;
    }

    console.log(`Testing connection to MikroTik device: ${device.host}:${device.port}`);
    
    const mikrotik = await createMikroTikConnection({
      host: device.host,
      port: device.port,
      username: device.username,
      password: device.password
    });

    if (!mikrotik) {
      res.json({
        success: false,
        message: 'Failed to establish connection to MikroTik device'
      });
      return;
    }

    try {
      const testResult = await mikrotik.testConnection();
      
      if (testResult.success) {
        res.json({
          success: true,
          message: 'Successfully connected to MikroTik device',
          identity: testResult.identity,
          version: testResult.version
        });
      } else {
        res.json({
          success: false,
          message: 'Connection established but test failed'
        });
      }
    } finally {
      await mikrotik.disconnect();
    }

  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to test connection: ' + error.message 
    });
  }
});

export default router;
