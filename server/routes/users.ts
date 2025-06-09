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
        disabled: 0,
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
      customer_name, customer_address, ip_address, service_package_id
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
      customer_name, customer_address, ip_address, service_package_id
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
