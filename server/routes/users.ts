import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { createMikroTikConnection, parseMikroTikBytes, parseMikroTikTime } from '../services/mikrotik.js';

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
    const { device_id, username, password, profile, comment, sync_to_device } = req.body;

    if (!device_id || !username || !password) {
      res.status(400).json({ error: 'Device ID, username, and password are required' });
      return;
    }

    // Get device info for MikroTik sync
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', device_id)
      .executeTakeFirst();

    if (!device) {
      res.status(400).json({ error: 'Device not found' });
      return;
    }

    // Add user to database
    const user = await db
      .insertInto('hotspot_users')
      .values({
        device_id,
        username,
        password,
        profile,
        comment,
        disabled: 0,
        bytes_in: 0,
        bytes_out: 0,
        uptime: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirst();

    // Sync to MikroTik device if requested and device is MikroTik
    if (sync_to_device && device.type === 'MikroTik') {
      console.log(`Syncing hotspot user ${username} to MikroTik device: ${device.host}`);
      
      const mikrotik = await createMikroTikConnection({
        host: device.host,
        port: device.port,
        username: device.username,
        password: device.password
      });

      if (mikrotik) {
        try {
          const success = await mikrotik.addHotspotUser({
            name: username,
            password: password,
            profile: profile || undefined,
            comment: comment || undefined,
            disabled: 'false'
          });

          if (!success) {
            console.log('Failed to add user to MikroTik device, but user saved to database');
          }
        } finally {
          await mikrotik.disconnect();
        }
      }
    }

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
    const { username, password, profile, comment, disabled, sync_to_device } = req.body;

    // Get existing user to compare changes
    const existingUser = await db
      .selectFrom('hotspot_users')
      .selectAll()
      .where('id', '=', parseInt(id))
      .executeTakeFirst();

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update user in database
    const user = await db
      .updateTable('hotspot_users')
      .set({
        username,
        password,
        profile,
        comment,
        disabled: disabled ? 1 : 0,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Sync to MikroTik device if requested
    if (sync_to_device) {
      const device = await db
        .selectFrom('devices')
        .selectAll()
        .where('id', '=', user.device_id)
        .executeTakeFirst();

      if (device && device.type === 'MikroTik') {
        console.log(`Syncing hotspot user ${username} changes to MikroTik device: ${device.host}`);
        
        const mikrotik = await createMikroTikConnection({
          host: device.host,
          port: device.port,
          username: device.username,
          password: device.password
        });

        if (mikrotik) {
          try {
            const success = await mikrotik.updateHotspotUser(existingUser.username, {
              password: password,
              profile: profile || undefined,
              comment: comment || undefined,
              disabled: disabled ? 'true' : 'false'
            });

            if (!success) {
              console.log('Failed to update user on MikroTik device, but changes saved to database');
            }
          } finally {
            await mikrotik.disconnect();
          }
        }
      }
    }

    // Convert integer back to boolean for API response
    const responseUser = {
      ...user,
      disabled: Boolean(user.disabled)
    };

    res.json(responseUser);
  } catch (error) {
    console.error('Update hotspot user error:', error);
    res.status(500).json({ error: 'Failed to update hotspot user' });
  }
});

// Delete hotspot user
router.delete('/hotspot/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get user details before deletion
    const user = await db
      .selectFrom('hotspot_users')
      .selectAll()
      .where('id', '=', parseInt(id))
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete from database
    const result = await db
      .deleteFrom('hotspot_users')
      .where('id', '=', parseInt(id))
      .execute();

    if (result.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Also remove from MikroTik device if it's online
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', user.device_id)
      .executeTakeFirst();

    if (device && device.type === 'MikroTik' && device.is_online) {
      console.log(`Removing hotspot user ${user.username} from MikroTik device: ${device.host}`);
      
      const mikrotik = await createMikroTikConnection({
        host: device.host,
        port: device.port,
        username: device.username,
        password: device.password
      });

      if (mikrotik) {
        try {
          await mikrotik.removeHotspotUser(user.username);
        } catch (error) {
          console.log('Failed to remove user from MikroTik device:', error.message);
        } finally {
          await mikrotik.disconnect();
        }
      }
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete hotspot user error:', error);
    res.status(500).json({ error: 'Failed to delete hotspot user' });
  }
});

// Get PPPoE users with service package details
router.get('/pppoe/:deviceId', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const users = await db
      .selectFrom('pppoe_users')
      .leftJoin('service_packages', 'pppoe_users.service_package_id', 'service_packages.id')
      .select([
        'pppoe_users.id',
        'pppoe_users.device_id',
        'pppoe_users.username',
        'pppoe_users.password',
        'pppoe_users.profile',
        'pppoe_users.service',
        'pppoe_users.caller_id',
        'pppoe_users.comment',
        'pppoe_users.disabled',
        'pppoe_users.contact_name',
        'pppoe_users.contact_phone',
        'pppoe_users.contact_whatsapp',
        'pppoe_users.service_cost',
        'pppoe_users.bytes_in',
        'pppoe_users.bytes_out',
        'pppoe_users.uptime',
        'pppoe_users.created_at',
        'pppoe_users.updated_at',
        'pppoe_users.customer_name',
        'pppoe_users.customer_address',
        'pppoe_users.ip_address',
        'pppoe_users.service_package_id',
        'service_packages.name as package_name',
        'service_packages.description as package_description',
        'service_packages.price as package_price',
        'service_packages.bandwidth_up as package_bandwidth_up',
        'service_packages.bandwidth_down as package_bandwidth_down'
      ])
      .where('pppoe_users.device_id', '=', parseInt(deviceId))
      .execute();

    res.json(users);
  } catch (error) {
    console.error('Get PPPoE users error:', error);
    res.status(500).json({ error: 'Failed to get PPPoE users' });
  }
});

// Get single PPPoE user with details
router.get('/pppoe/detail/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await db
      .selectFrom('pppoe_users')
      .leftJoin('service_packages', 'pppoe_users.service_package_id', 'service_packages.id')
      .select([
        'pppoe_users.id',
        'pppoe_users.device_id',
        'pppoe_users.username',
        'pppoe_users.password',
        'pppoe_users.profile',
        'pppoe_users.service',
        'pppoe_users.caller_id',
        'pppoe_users.comment',
        'pppoe_users.disabled',
        'pppoe_users.contact_name',
        'pppoe_users.contact_phone',
        'pppoe_users.contact_whatsapp',
        'pppoe_users.service_cost',
        'pppoe_users.bytes_in',
        'pppoe_users.bytes_out',
        'pppoe_users.uptime',
        'pppoe_users.created_at',
        'pppoe_users.updated_at',
        'pppoe_users.customer_name',
        'pppoe_users.customer_address',
        'pppoe_users.ip_address',
        'pppoe_users.service_package_id',
        'service_packages.name as package_name',
        'service_packages.description as package_description',
        'service_packages.price as package_price',
        'service_packages.bandwidth_up as package_bandwidth_up',
        'service_packages.bandwidth_down as package_bandwidth_down',
        'service_packages.duration_days as package_duration_days'
      ])
      .where('pppoe_users.id', '=', parseInt(id))
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get PPPoE user detail error:', error);
    res.status(500).json({ error: 'Failed to get PPPoE user details' });
  }
});

// Add PPPoE user
router.post('/pppoe', requireAuth, async (req, res) => {
  try {
    const { 
      device_id, username, password, profile, service, caller_id, 
      comment, contact_name, contact_phone, contact_whatsapp, service_cost,
      customer_name, customer_address, ip_address, service_package_id, sync_to_device
    } = req.body;

    if (!device_id || !username || !password) {
      res.status(400).json({ error: 'Device ID, username, and password are required' });
      return;
    }

    // Get device info for MikroTik sync
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', device_id)
      .executeTakeFirst();

    if (!device) {
      res.status(400).json({ error: 'Device not found' });
      return;
    }

    // Add user to database
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
        disabled: 0,
        bytes_in: 0,
        bytes_out: 0,
        uptime: 0,
        customer_name,
        customer_address,
        ip_address,
        service_package_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirst();

    // Sync to MikroTik device if requested and device is MikroTik
    if (sync_to_device && device.type === 'MikroTik') {
      console.log(`Syncing PPPoE user ${username} to MikroTik device: ${device.host}`);
      
      const mikrotik = await createMikroTikConnection({
        host: device.host,
        port: device.port,
        username: device.username,
        password: device.password
      });

      if (mikrotik) {
        try {
          const success = await mikrotik.addPppoeUser({
            name: username,
            password: password,
            profile: profile || undefined,
            service: service || undefined,
            'caller-id': caller_id || undefined,
            comment: comment || undefined,
            disabled: 'false'
          });

          if (!success) {
            console.log('Failed to add user to MikroTik device, but user saved to database');
          }
        } finally {
          await mikrotik.disconnect();
        }
      }
    }

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
      contact_name, contact_phone, contact_whatsapp, service_cost, disabled,
      customer_name, customer_address, ip_address, service_package_id, sync_to_device
    } = req.body;

    // Get existing user to compare changes
    const existingUser = await db
      .selectFrom('pppoe_users')
      .selectAll()
      .where('id', '=', parseInt(id))
      .executeTakeFirst();

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update user in database
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
        disabled: disabled ? 1 : 0,
        customer_name,
        customer_address,
        ip_address,
        service_package_id,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Sync to MikroTik device if requested
    if (sync_to_device) {
      const device = await db
        .selectFrom('devices')
        .selectAll()
        .where('id', '=', user.device_id)
        .executeTakeFirst();

      if (device && device.type === 'MikroTik') {
        console.log(`Syncing PPPoE user ${username} changes to MikroTik device: ${device.host}`);
        
        const mikrotik = await createMikroTikConnection({
          host: device.host,
          port: device.port,
          username: device.username,
          password: device.password
        });

        if (mikrotik) {
          try {
            const success = await mikrotik.updatePppoeUser(existingUser.username, {
              password: password,
              profile: profile || undefined,
              service: service || undefined,
              'caller-id': caller_id || undefined,
              comment: comment || undefined,
              disabled: disabled ? 'true' : 'false'
            });

            if (!success) {
              console.log('Failed to update user on MikroTik device, but changes saved to database');
            }
          } finally {
            await mikrotik.disconnect();
          }
        }
      }
    }

    // Convert integer back to boolean for API response
    const responseUser = {
      ...user,
      disabled: Boolean(user.disabled)
    };

    res.json(responseUser);
  } catch (error) {
    console.error('Update PPPoE user error:', error);
    res.status(500).json({ error: 'Failed to update PPPoE user' });
  }
});

// Delete PPPoE user
router.delete('/pppoe/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get user details before deletion
    const user = await db
      .selectFrom('pppoe_users')
      .selectAll()
      .where('id', '=', parseInt(id))
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete from database
    const result = await db
      .deleteFrom('pppoe_users')
      .where('id', '=', parseInt(id))
      .execute();

    if (result.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Also remove from MikroTik device if it's online
    const device = await db
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', user.device_id)
      .executeTakeFirst();

    if (device && device.type === 'MikroTik' && device.is_online) {
      console.log(`Removing PPPoE user ${user.username} from MikroTik device: ${device.host}`);
      
      const mikrotik = await createMikroTikConnection({
        host: device.host,
        port: device.port,
        username: device.username,
        password: device.password
      });

      if (mikrotik) {
        try {
          await mikrotik.removePppoeUser(user.username);
        } catch (error) {
          console.log('Failed to remove user from MikroTik device:', error.message);
        } finally {
          await mikrotik.disconnect();
        }
      }
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete PPPoE user error:', error);
    res.status(500).json({ error: 'Failed to delete PPPoE user' });
  }
});

export default router;
