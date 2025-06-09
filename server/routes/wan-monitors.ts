import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const execAsync = promisify(exec);

// Get all WAN monitors
router.get('/', requireAuth, async (req, res) => {
  try {
    const monitors = await db
      .selectFrom('wan_monitors')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    // Convert integer values back to booleans for API response
    const formattedMonitors = monitors.map(monitor => ({
      ...monitor,
      is_active: Boolean(monitor.is_active),
      last_ping_success: Boolean(monitor.last_ping_success)
    }));

    res.json(formattedMonitors);
  } catch (error) {
    console.error('Get WAN monitors error:', error);
    res.status(500).json({ error: 'Failed to get WAN monitors' });
  }
});

// Add WAN monitor
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, host, description } = req.body;

    if (!name || !host) {
      res.status(400).json({ error: 'Name and host are required' });
      return;
    }

    const monitor = await db
      .insertInto('wan_monitors')
      .values({
        name,
        host,
        description,
        is_active: 1, // Convert boolean to integer
        last_ping_success: 0, // Convert boolean to integer
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirst();

    if (monitor) {
      // Convert integer values back to booleans for API response
      const formattedMonitor = {
        ...monitor,
        is_active: Boolean(monitor.is_active),
        last_ping_success: Boolean(monitor.last_ping_success)
      };
      res.status(201).json(formattedMonitor);
    }
  } catch (error) {
    console.error('Add WAN monitor error:', error);
    res.status(500).json({ error: 'Failed to add WAN monitor' });
  }
});

// Update WAN monitor
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, host, description, is_active } = req.body;

    const monitor = await db
      .updateTable('wan_monitors')
      .set({
        name,
        host,
        description,
        is_active: is_active !== undefined ? (is_active ? 1 : 0) : 1, // Convert boolean to integer
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();

    if (!monitor) {
      res.status(404).json({ error: 'WAN monitor not found' });
      return;
    }

    // Convert integer values back to booleans for API response
    const formattedMonitor = {
      ...monitor,
      is_active: Boolean(monitor.is_active),
      last_ping_success: Boolean(monitor.last_ping_success)
    };

    res.json(formattedMonitor);
  } catch (error) {
    console.error('Update WAN monitor error:', error);
    res.status(500).json({ error: 'Failed to update WAN monitor' });
  }
});

// Delete WAN monitor
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .deleteFrom('wan_monitors')
      .where('id', '=', parseInt(id))
      .execute();

    if (result.length === 0) {
      res.status(404).json({ error: 'WAN monitor not found' });
      return;
    }

    res.json({ message: 'WAN monitor deleted successfully' });
  } catch (error) {
    console.error('Delete WAN monitor error:', error);
    res.status(500).json({ error: 'Failed to delete WAN monitor' });
  }
});

// Ping a specific WAN monitor
router.post('/:id/ping', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const monitor = await db
      .selectFrom('wan_monitors')
      .selectAll()
      .where('id', '=', parseInt(id))
      .executeTakeFirst();

    if (!monitor) {
      res.status(404).json({ error: 'WAN monitor not found' });
      return;
    }

    const pingResult = await performPing(monitor.host);
    
    // Update monitor status
    await db
      .updateTable('wan_monitors')
      .set({
        last_ping_time: new Date().toISOString(),
        last_ping_success: pingResult.success ? 1 : 0, // Convert boolean to integer
        last_ping_latency: pingResult.latency,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .execute();

    // Record ping history
    await db
      .insertInto('wan_ping_history')
      .values({
        wan_monitor_id: parseInt(id),
        ping_time: new Date().toISOString(),
        success: pingResult.success ? 1 : 0, // Convert boolean to integer
        latency: pingResult.latency,
        error_message: pingResult.error
      })
      .execute();

    res.json(pingResult);
  } catch (error) {
    console.error('Ping WAN monitor error:', error);
    res.status(500).json({ error: 'Failed to ping WAN monitor' });
  }
});

// Ping all active WAN monitors
router.post('/ping-all', requireAuth, async (req, res) => {
  try {
    const monitors = await db
      .selectFrom('wan_monitors')
      .selectAll()
      .where('is_active', '=', 1) // Use integer comparison
      .execute();

    const results = [];

    for (const monitor of monitors) {
      try {
        const pingResult = await performPing(monitor.host);
        
        // Update monitor status
        await db
          .updateTable('wan_monitors')
          .set({
            last_ping_time: new Date().toISOString(),
            last_ping_success: pingResult.success ? 1 : 0, // Convert boolean to integer
            last_ping_latency: pingResult.latency,
            updated_at: new Date().toISOString()
          })
          .where('id', '=', monitor.id)
          .execute();

        // Record ping history
        await db
          .insertInto('wan_ping_history')
          .values({
            wan_monitor_id: monitor.id,
            ping_time: new Date().toISOString(),
            success: pingResult.success ? 1 : 0, // Convert boolean to integer
            latency: pingResult.latency,
            error_message: pingResult.error
          })
          .execute();

        results.push({
          monitor_id: monitor.id,
          name: monitor.name,
          host: monitor.host,
          ...pingResult
        });
      } catch (error) {
        console.error(`Failed to ping ${monitor.name} (${monitor.host}):`, error);
        results.push({
          monitor_id: monitor.id,
          name: monitor.name,
          host: monitor.host,
          success: false,
          latency: null,
          error: error.message
        });
      }
    }

    res.json({
      total_monitors: monitors.length,
      successful_pings: results.filter(r => r.success).length,
      failed_pings: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error('Ping all WAN monitors error:', error);
    res.status(500).json({ error: 'Failed to ping WAN monitors' });
  }
});

// Get ping history for a WAN monitor
router.get('/:id/history', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.query;

    const since = new Date();
    since.setHours(since.getHours() - parseInt(hours as string));

    const history = await db
      .selectFrom('wan_ping_history')
      .selectAll()
      .where('wan_monitor_id', '=', parseInt(id))
      .where('ping_time', '>=', since.toISOString())
      .orderBy('ping_time', 'desc')
      .execute();

    // Convert integer values back to booleans for API response
    const formattedHistory = history.map(entry => ({
      ...entry,
      success: Boolean(entry.success)
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error('Get WAN monitor history error:', error);
    res.status(500).json({ error: 'Failed to get WAN monitor history' });
  }
});

// Perform ping operation
async function performPing(host: string): Promise<{
  success: boolean;
  latency: number | null;
  error: string | null;
}> {
  try {
    console.log(`Pinging ${host}...`);
    
    // Determine ping command based on OS
    const isWindows = process.platform === 'win32';
    const pingCommand = isWindows 
      ? `ping -n 1 ${host}` 
      : `ping -c 1 ${host}`;

    const { stdout, stderr } = await execAsync(pingCommand, {
      timeout: 5000 // 5 second timeout
    });

    if (stderr) {
      console.log(`Ping stderr for ${host}:`, stderr);
    }

    console.log(`Ping stdout for ${host}:`, stdout);

    // Parse latency from output
    let latency: number | null = null;
    
    if (isWindows) {
      // Windows ping output parsing
      const latencyMatch = stdout.match(/time[<=](\d+)ms/i);
      if (latencyMatch) {
        latency = parseInt(latencyMatch[1]);
      }
    } else {
      // Linux/Unix ping output parsing
      const latencyMatch = stdout.match(/time=(\d+(?:\.\d+)?) ms/i);
      if (latencyMatch) {
        latency = parseFloat(latencyMatch[1]);
      }
    }

    // Check if ping was successful
    const success = isWindows 
      ? !stdout.includes('Request timed out') && !stdout.includes('could not find host')
      : stdout.includes('1 received') || stdout.includes('1 packets transmitted, 1 received');

    return {
      success,
      latency,
      error: success ? null : 'Ping failed or timed out'
    };

  } catch (error) {
    console.error(`Ping error for ${host}:`, error);
    return {
      success: false,
      latency: null,
      error: error.message || 'Ping command failed'
    };
  }
}

export default router;
