import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { createMikroTikConnection } from '../services/mikrotik.js';

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

    let profiles = [];

    if (device.type === 'MikroTik') {
      console.log(`Loading hotspot profiles from MikroTik device: ${device.host}`);
      
      const mikrotik = await createMikroTikConnection({
        host: device.host,
        port: device.port,
        username: device.username,
        password: device.password
      });

      if (!mikrotik) {
        res.status(500).json({ error: 'Failed to connect to MikroTik device' });
        return;
      }

      try {
        const mikrotikProfiles = await mikrotik.getHotspotProfiles();
        console.log(`Found ${mikrotikProfiles.length} hotspot profiles on device`);

        // Save profiles to database
        const savedProfiles = [];
        for (const profile of mikrotikProfiles) {
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
                rate_limit: profile['rate-limit'] || null,
                session_timeout: profile['session-timeout'] ? parseInt(profile['session-timeout']) : null,
                shared_users: profile['shared-users'] ? parseInt(profile['shared-users']) : 1,
                created_at: new Date().toISOString()
              })
              .returningAll()
              .executeTakeFirst();

            savedProfiles.push(saved);
          } else {
            // Update existing profile with latest data from device
            const updated = await db
              .updateTable('hotspot_profiles')
              .set({
                rate_limit: profile['rate-limit'] || null,
                session_timeout: profile['session-timeout'] ? parseInt(profile['session-timeout']) : null,
                shared_users: profile['shared-users'] ? parseInt(profile['shared-users']) : 1
              })
              .where('id', '=', existing.id)
              .returningAll()
              .executeTakeFirst();

            savedProfiles.push(updated);
          }
        }

        profiles = savedProfiles;
      } finally {
        await mikrotik.disconnect();
      }
    } else {
      // Simulate loading profiles for non-MikroTik devices
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
        }
      ];

      const savedProfiles = [];
      for (const profile of simulatedProfiles) {
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

      profiles = savedProfiles;
    }

    res.json({
      message: `Loaded ${profiles.length} hotspot profiles from device`,
      profiles: profiles
    });
  } catch (error) {
    console.error('Load hotspot profiles error:', error);
    res.status(500).json({ error: 'Failed to load hotspot profiles: ' + error.message });
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

    let profiles = [];

    if (device.type === 'MikroTik') {
      console.log(`Loading PPPoE profiles from MikroTik device: ${device.host}`);
      
      const mikrotik = await createMikroTikConnection({
        host: device.host,
        port: device.port,
        username: device.username,
        password: device.password
      });

      if (!mikrotik) {
        res.status(500).json({ error: 'Failed to connect to MikroTik device' });
        return;
      }

      try {
        const mikrotikProfiles = await mikrotik.getPppoeProfiles();
        console.log(`Found ${mikrotikProfiles.length} PPPoE profiles on device`);

        // Save profiles to database
        const savedProfiles = [];
        for (const profile of mikrotikProfiles) {
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
                local_address: profile['local-address'] || null,
                remote_address: profile['remote-address'] || null,
                rate_limit: profile['rate-limit'] || null,
                session_timeout: profile['session-timeout'] ? parseInt(profile['session-timeout']) : null,
                created_at: new Date().toISOString()
              })
              .returningAll()
              .executeTakeFirst();

            savedProfiles.push(saved);
          } else {
            // Update existing profile with latest data from device
            const updated = await db
              .updateTable('pppoe_profiles')
              .set({
                local_address: profile['local-address'] || null,
                remote_address: profile['remote-address'] || null,
                rate_limit: profile['rate-limit'] || null,
                session_timeout: profile['session-timeout'] ? parseInt(profile['session-timeout']) : null
              })
              .where('id', '=', existing.id)
              .returningAll()
              .executeTakeFirst();

            savedProfiles.push(updated);
          }
        }

        profiles = savedProfiles;
      } finally {
        await mikrotik.disconnect();
      }
    } else {
      // Simulate loading profiles for non-MikroTik devices
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
        }
      ];

      const savedProfiles = [];
      for (const profile of simulatedProfiles) {
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

      profiles = savedProfiles;
    }

    res.json({
      message: `Loaded ${profiles.length} PPPoE profiles from device`,
      profiles: profiles
    });
  } catch (error) {
    console.error('Load PPPoE profiles error:', error);
    res.status(500).json({ error: 'Failed to load PPPoE profiles: ' + error.message });
  }
});

// Sync users from device
router.post('/users/:deviceId/sync', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { type } = req.body; // 'hotspot' or 'pppoe'
    
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

    if (device.type !== 'MikroTik') {
      res.status(400).json({ error: 'User synchronization is only available for MikroTik devices' });
      return;
    }

    console.log(`Syncing ${type} users from MikroTik device: ${device.host}`);
    
    const mikrotik = await createMikroTikConnection({
      host: device.host,
      port: device.port,
      username: device.username,
      password: device.password
    });

    if (!mikrotik) {
      res.status(500).json({ error: 'Failed to connect to MikroTik device' });
      return;
    }

    try {
      let syncedCount = 0;

      if (type === 'hotspot') {
        const mikrotikUsers = await mikrotik.getHotspotUsers();
        console.log(`Found ${mikrotikUsers.length} hotspot users on device`);

        for (const user of mikrotikUsers) {
          // Check if user already exists
          const existing = await db
            .selectFrom('hotspot_users')
            .selectAll()
            .where('device_id', '=', parseInt(deviceId))
            .where('username', '=', user.name)
            .executeTakeFirst();

          if (!existing) {
            await db
              .insertInto('hotspot_users')
              .values({
                device_id: parseInt(deviceId),
                username: user.name,
                password: user.password,
                profile: user.profile || null,
                comment: user.comment || null,
                disabled: user.disabled === 'true' ? 1 : 0,
                bytes_in: user['bytes-in'] ? parseInt(user['bytes-in']) : 0,
                bytes_out: user['bytes-out'] ? parseInt(user['bytes-out']) : 0,
                uptime: user.uptime ? parseInt(user.uptime) : 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .execute();

            syncedCount++;
          } else {
            // Update existing user with latest data
            await db
              .updateTable('hotspot_users')
              .set({
                password: user.password,
                profile: user.profile || null,
                comment: user.comment || null,
                disabled: user.disabled === 'true' ? 1 : 0,
                bytes_in: user['bytes-in'] ? parseInt(user['bytes-in']) : 0,
                bytes_out: user['bytes-out'] ? parseInt(user['bytes-out']) : 0,
                uptime: user.uptime ? parseInt(user.uptime) : 0,
                updated_at: new Date().toISOString()
              })
              .where('id', '=', existing.id)
              .execute();
          }
        }
      } else if (type === 'pppoe') {
        const mikrotikUsers = await mikrotik.getPppoeUsers();
        console.log(`Found ${mikrotikUsers.length} PPPoE users on device`);

        for (const user of mikrotikUsers) {
          // Check if user already exists
          const existing = await db
            .selectFrom('pppoe_users')
            .selectAll()
            .where('device_id', '=', parseInt(deviceId))
            .where('username', '=', user.name)
            .executeTakeFirst();

          if (!existing) {
            await db
              .insertInto('pppoe_users')
              .values({
                device_id: parseInt(deviceId),
                username: user.name,
                password: user.password,
                profile: user.profile || null,
                service: user.service || null,
                caller_id: user['caller-id'] || null,
                comment: user.comment || null,
                disabled: user.disabled === 'true' ? 1 : 0,
                contact_name: null,
                contact_phone: null,
                contact_whatsapp: null,
                service_cost: 0,
                bytes_in: 0,
                bytes_out: 0,
                uptime: 0,
                customer_name: null,
                customer_address: null,
                ip_address: null,
                service_package_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .execute();

            syncedCount++;
          } else {
            // Update existing user with latest data
            await db
              .updateTable('pppoe_users')
              .set({
                password: user.password,
                profile: user.profile || null,
                service: user.service || null,
                caller_id: user['caller-id'] || null,
                comment: user.comment || null,
                disabled: user.disabled === 'true' ? 1 : 0,
                updated_at: new Date().toISOString()
              })
              .where('id', '=', existing.id)
              .execute();
          }
        }
      }

      res.json({
        message: `Synchronized ${syncedCount} new ${type} users from device`,
        synced_count: syncedCount
      });

    } finally {
      await mikrotik.disconnect();
    }

  } catch (error) {
    console.error('Sync users error:', error);
    res.status(500).json({ error: 'Failed to sync users: ' + error.message });
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
