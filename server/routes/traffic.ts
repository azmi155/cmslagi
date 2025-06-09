import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { createMikroTikConnection } from '../services/mikrotik.js';

const router = express.Router();

// Get interface traffic data from MikroTik device
router.get('/:deviceId/interfaces', requireAuth, async (req, res) => {
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

    if (device.type !== 'MikroTik') {
      res.status(400).json({ error: 'Traffic monitoring is only available for MikroTik devices' });
      return;
    }

    console.log(`Getting interface traffic from MikroTik device: ${device.host}`);
    
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
      // Get interface statistics
      const interfaces = await mikrotik.getInterfaceStats();
      
      if (interfaces) {
        // Format the interface data
        const formattedInterfaces = interfaces.map((iface: any) => ({
          name: iface.name,
          type: iface.type || 'ethernet',
          running: iface.running === 'true',
          disabled: iface.disabled === 'true',
          tx_bytes: parseInt(iface['tx-byte']) || 0,
          rx_bytes: parseInt(iface['rx-byte']) || 0,
          tx_packets: parseInt(iface['tx-packet']) || 0,
          rx_packets: parseInt(iface['rx-packet']) || 0,
          tx_errors: parseInt(iface['tx-error']) || 0,
          rx_errors: parseInt(iface['rx-error']) || 0,
          tx_drops: parseInt(iface['tx-drop']) || 0,
          rx_drops: parseInt(iface['rx-drop']) || 0,
          mtu: parseInt(iface.mtu) || 1500,
          actual_mtu: parseInt(iface['actual-mtu']) || 1500,
          link_downs: parseInt(iface['link-downs']) || 0,
          comment: iface.comment || null
        }));

        res.json(formattedInterfaces);
      } else {
        res.json([]);
      }
    } finally {
      await mikrotik.disconnect();
    }

  } catch (error) {
    console.error('Get interface traffic error:', error);
    res.status(500).json({ error: 'Failed to get interface traffic: ' + error.message });
  }
});

// Get historical traffic data (simulated for now)
router.get('/:deviceId/history/:interfaceName', requireAuth, async (req, res) => {
  try {
    const { deviceId, interfaceName } = req.params;
    const { hours = 24 } = req.query;
    
    // Generate sample historical data for the interface
    const hoursCount = parseInt(hours as string);
    const historicalData = Array.from({ length: hoursCount }, (_, i) => {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - (hoursCount - 1 - i));
      
      return {
        timestamp: timestamp.toISOString(),
        tx_bytes: Math.floor(Math.random() * 1000000000), // Random bytes
        rx_bytes: Math.floor(Math.random() * 5000000000), // Random bytes
        tx_packets: Math.floor(Math.random() * 1000000),
        rx_packets: Math.floor(Math.random() * 5000000)
      };
    });

    res.json({
      interface: interfaceName,
      period_hours: hoursCount,
      data: historicalData
    });
  } catch (error) {
    console.error('Get historical traffic error:', error);
    res.status(500).json({ error: 'Failed to get historical traffic data' });
  }
});

export default router;
