import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import path from 'path';
import { setupStaticServing } from './static-serve.js';
import { db } from './db/connection.js';

// Import routes
import authRoutes from './routes/auth.js';
import deviceRoutes from './routes/devices.js';
import userRoutes from './routes/users.js';
import profileRoutes from './routes/profiles.js';
import reportRoutes from './routes/reports.js';
import systemRoutes from './routes/system.js';
import brandingRoutes from './routes/branding.js';
import profileManagementRoutes from './routes/profile-management.js';
import notesRoutes from './routes/notes.js';
import deviceStatsRoutes from './routes/device-stats.js';
import wanMonitorsRoutes from './routes/wan-monitors.js';

dotenv.config();

const app = express();

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const dataDirectory = process.env.DATA_DIRECTORY || './data';
app.use('/uploads', express.static(path.join(dataDirectory, 'uploads')));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/profile-management', profileManagementRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/device-stats', deviceStatsRoutes);
app.use('/api/wan-monitors', wanMonitorsRoutes);

// Initialize default admin user if it doesn't exist
async function initializeDefaultAdmin() {
  try {
    console.log('Checking for admin user...');
    
    const adminExists = await db
      .selectFrom('admin_users')
      .select('id')
      .where('username', '=', 'admin')
      .executeTakeFirst();

    if (!adminExists) {
      console.log('Creating default admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db
        .insertInto('admin_users')
        .values({
          username: 'admin',
          password_hash: hashedPassword,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .execute();
      
      console.log('Default admin user created successfully: admin/admin123');
    } else {
      console.log('Admin user already exists');
      
      // Check if the password hash is valid, if not update it
      const admin = await db
        .selectFrom('admin_users')
        .selectAll()
        .where('username', '=', 'admin')
        .executeTakeFirst();
      
      if (admin) {
        try {
          // Try to verify the existing hash with admin123
          const isValid = await bcrypt.compare('admin123', admin.password_hash);
          if (!isValid) {
            console.log('Updating admin password hash...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await db
              .updateTable('admin_users')
              .set({
                password_hash: hashedPassword,
                updated_at: new Date().toISOString()
              })
              .where('username', '=', 'admin')
              .execute();
            
            console.log('Admin password hash updated successfully');
          }
        } catch (error) {
          console.log('Invalid password hash detected, updating...');
          const hashedPassword = await bcrypt.hash('admin123', 10);
          
          await db
            .updateTable('admin_users')
            .set({
              password_hash: hashedPassword,
              updated_at: new Date().toISOString()
            })
            .where('username', '=', 'admin')
            .execute();
          
          console.log('Admin password hash fixed successfully');
        }
      }
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
}

// Initialize default WAN monitors
async function initializeDefaultWanMonitors() {
  try {
    console.log('Checking for default WAN monitors...');
    
    const existingMonitors = await db
      .selectFrom('wan_monitors')
      .select('id')
      .execute();

    if (existingMonitors.length === 0) {
      console.log('Creating default WAN monitors...');
      
      const defaultMonitors = [
        {
          name: 'Google DNS',
          host: '8.8.8.8',
          description: 'Google Public DNS Server',
          is_active: 1, // Convert boolean to integer
          last_ping_success: 0, // Convert boolean to integer
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'Cloudflare DNS',
          host: '1.1.1.1',
          description: 'Cloudflare Public DNS Server',
          is_active: 1, // Convert boolean to integer
          last_ping_success: 0, // Convert boolean to integer
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      for (const monitor of defaultMonitors) {
        await db
          .insertInto('wan_monitors')
          .values(monitor)
          .execute();
      }
      
      console.log('Default WAN monitors created successfully');
    } else {
      console.log('WAN monitors already exist');
    }
  } catch (error) {
    console.error('Error initializing WAN monitors:', error);
  }
}

// Start periodic WAN monitoring
function startWanMonitoring() {
  console.log('Starting WAN monitoring service...');
  
  // Ping all monitors every 2 minutes
  setInterval(async () => {
    try {
      console.log('Running scheduled WAN monitor pings...');
      
      const monitors = await db
        .selectFrom('wan_monitors')
        .selectAll()
        .where('is_active', '=', 1) // Use integer comparison
        .execute();

      for (const monitor of monitors) {
        try {
          // Simple ping without using the route (to avoid auth requirements)
          const pingResult = await performSimplePing(monitor.host);
          
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

          // Record ping history (keep only last 1000 entries per monitor)
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

          // Clean up old history entries using proper SQLite syntax
          // First, count total entries for this monitor
          const countResult = await db
            .selectFrom('wan_ping_history')
            .select(db.fn.count('id').as('total'))
            .where('wan_monitor_id', '=', monitor.id)
            .executeTakeFirst();

          const totalEntries = Number(countResult?.total || 0);

          if (totalEntries > 1000) {
            // Get the IDs of entries to keep (most recent 1000)
            const entriesToKeep = await db
              .selectFrom('wan_ping_history')
              .select('id')
              .where('wan_monitor_id', '=', monitor.id)
              .orderBy('ping_time', 'desc')
              .limit(1000)
              .execute();

            const keepIds = entriesToKeep.map(entry => entry.id);

            // Delete all entries that are not in the keep list
            if (keepIds.length > 0) {
              await db
                .deleteFrom('wan_ping_history')
                .where('wan_monitor_id', '=', monitor.id)
                .where('id', 'not in', keepIds)
                .execute();
            }
          }

        } catch (error) {
          console.error(`Failed to ping WAN monitor ${monitor.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in WAN monitoring cycle:', error);
    }
  }, 2 * 60 * 1000); // 2 minutes
}

// Simple ping function for background monitoring
async function performSimplePing(host: string): Promise<{
  success: boolean;
  latency: number | null;
  error: string | null;
}> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    const isWindows = process.platform === 'win32';
    const pingCommand = isWindows 
      ? `ping -n 1 ${host}` 
      : `ping -c 1 ${host}`;

    const { stdout } = await execAsync(pingCommand, {
      timeout: 5000
    });

    let latency: number | null = null;
    
    if (isWindows) {
      const latencyMatch = stdout.match(/time[<=](\d+)ms/i);
      if (latencyMatch) {
        latency = parseInt(latencyMatch[1]);
      }
    } else {
      const latencyMatch = stdout.match(/time=(\d+(?:\.\d+)?) ms/i);
      if (latencyMatch) {
        latency = parseFloat(latencyMatch[1]);
      }
    }

    const success = isWindows 
      ? !stdout.includes('Request timed out') && !stdout.includes('could not find host')
      : stdout.includes('1 received') || stdout.includes('1 packets transmitted, 1 received');

    return {
      success,
      latency,
      error: success ? null : 'Ping failed or timed out'
    };

  } catch (error) {
    return {
      success: false,
      latency: null,
      error: error.message || 'Ping command failed'
    };
  }
}

// Export a function to start the server
export async function startServer(port) {
  try {
    // Initialize default admin user
    await initializeDefaultAdmin();
    
    // Initialize default WAN monitors
    await initializeDefaultWanMonitors();

    if (process.env.NODE_ENV === 'production') {
      setupStaticServing(app);
    }
    
    app.listen(port, () => {
      console.log(`Network Infrastructure Management Server running on port ${port}`);
      console.log(`Dashboard available at: http://localhost:${port}`);
      console.log('Default login credentials: admin / admin123');
      
      // Start WAN monitoring after server is running
      startWanMonitoring();
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server directly if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting Network Infrastructure Management Server...');
  startServer(process.env.PORT || 3001);
}
