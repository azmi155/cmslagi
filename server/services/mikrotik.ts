import { RouterOSAPI } from 'routeros-client';

export interface MikroTikConnection {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface MikroTikProfile {
  name: string;
  'rate-limit'?: string;
  'session-timeout'?: string;
  'shared-users'?: string;
  'local-address'?: string;
  'remote-address'?: string;
}

export interface MikroTikUser {
  name: string;
  password: string;
  profile?: string;
  comment?: string;
  disabled?: string;
  service?: string;
  'caller-id'?: string;
  'bytes-in'?: string;
  'bytes-out'?: string;
  uptime?: string;
}

export interface MikroTikSystemResource {
  'cpu-load': string;
  'free-memory': string;
  'total-memory': string;
  'free-hdd-space': string;
  'total-hdd-space': string;
  uptime: string;
  'board-name': string;
  version: string;
}

export class MikroTikService {
  private api: RouterOSAPI | null = null;
  private isConnected = false;

  async connect(connection: MikroTikConnection): Promise<boolean> {
    try {
      console.log(`Connecting to MikroTik at ${connection.host}:${connection.port}...`);
      
      this.api = new RouterOSAPI({
        host: connection.host,
        user: connection.username,
        password: connection.password,
        port: connection.port,
        timeout: 10000, // 10 second timeout
      });

      await this.api.connect();
      this.isConnected = true;
      
      console.log(`Successfully connected to MikroTik at ${connection.host}`);
      return true;
    } catch (error) {
      console.error(`Failed to connect to MikroTik at ${connection.host}:`, error.message);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.api && this.isConnected) {
      try {
        await this.api.close();
        console.log('Disconnected from MikroTik');
      } catch (error) {
        console.error('Error disconnecting from MikroTik:', error.message);
      }
    }
    this.api = null;
    this.isConnected = false;
  }

  private ensureConnected(): void {
    if (!this.api || !this.isConnected) {
      throw new Error('Not connected to MikroTik device');
    }
  }

  // Test connection and get system identity
  async testConnection(): Promise<{ success: boolean; identity?: string; version?: string }> {
    try {
      this.ensureConnected();
      
      const identity = await this.api!.write('/system/identity/print');
      const resource = await this.api!.write('/system/resource/print');
      
      return {
        success: true,
        identity: identity[0]?.name || 'Unknown',
        version: resource[0]?.version || 'Unknown'
      };
    } catch (error) {
      console.error('MikroTik test connection failed:', error.message);
      return { success: false };
    }
  }

  // Get system resources (CPU, memory, etc.)
  async getSystemResource(): Promise<MikroTikSystemResource | null> {
    try {
      this.ensureConnected();
      
      const resources = await this.api!.write('/system/resource/print');
      return resources[0] as MikroTikSystemResource || null;
    } catch (error) {
      console.error('Failed to get system resources:', error.message);
      return null;
    }
  }

  // Get hotspot user profiles
  async getHotspotProfiles(): Promise<MikroTikProfile[]> {
    try {
      this.ensureConnected();
      
      const profiles = await this.api!.write('/ip/hotspot/user/profile/print');
      return profiles.map(profile => ({
        name: profile.name,
        'rate-limit': profile['rate-limit'],
        'session-timeout': profile['session-timeout'],
        'shared-users': profile['shared-users']
      }));
    } catch (error) {
      console.error('Failed to get hotspot profiles:', error.message);
      return [];
    }
  }

  // Get PPPoE profiles
  async getPppoeProfiles(): Promise<MikroTikProfile[]> {
    try {
      this.ensureConnected();
      
      const profiles = await this.api!.write('/ppp/profile/print');
      return profiles.map(profile => ({
        name: profile.name,
        'local-address': profile['local-address'],
        'remote-address': profile['remote-address'],
        'rate-limit': profile['rate-limit'],
        'session-timeout': profile['session-timeout']
      }));
    } catch (error) {
      console.error('Failed to get PPPoE profiles:', error.message);
      return [];
    }
  }

  // Get hotspot users
  async getHotspotUsers(): Promise<MikroTikUser[]> {
    try {
      this.ensureConnected();
      
      const users = await this.api!.write('/ip/hotspot/user/print');
      return users.map(user => ({
        name: user.name,
        password: user.password,
        profile: user.profile,
        comment: user.comment,
        disabled: user.disabled,
        'bytes-in': user['bytes-in'],
        'bytes-out': user['bytes-out'],
        uptime: user.uptime
      }));
    } catch (error) {
      console.error('Failed to get hotspot users:', error.message);
      return [];
    }
  }

  // Get PPPoE users
  async getPppoeUsers(): Promise<MikroTikUser[]> {
    try {
      this.ensureConnected();
      
      const users = await this.api!.write('/ppp/secret/print');
      return users.map(user => ({
        name: user.name,
        password: user.password,
        profile: user.profile,
        service: user.service,
        'caller-id': user['caller-id'],
        comment: user.comment,
        disabled: user.disabled
      }));
    } catch (error) {
      console.error('Failed to get PPPoE users:', error.message);
      return [];
    }
  }

  // Add hotspot user
  async addHotspotUser(user: Partial<MikroTikUser>): Promise<boolean> {
    try {
      this.ensureConnected();
      
      const command = ['/ip/hotspot/user/add'];
      if (user.name) command.push(`=name=${user.name}`);
      if (user.password) command.push(`=password=${user.password}`);
      if (user.profile) command.push(`=profile=${user.profile}`);
      if (user.comment) command.push(`=comment=${user.comment}`);
      if (user.disabled) command.push(`=disabled=${user.disabled}`);

      await this.api!.write(command);
      console.log(`Added hotspot user: ${user.name}`);
      return true;
    } catch (error) {
      console.error('Failed to add hotspot user:', error.message);
      return false;
    }
  }

  // Add PPPoE user
  async addPppoeUser(user: Partial<MikroTikUser>): Promise<boolean> {
    try {
      this.ensureConnected();
      
      const command = ['/ppp/secret/add'];
      if (user.name) command.push(`=name=${user.name}`);
      if (user.password) command.push(`=password=${user.password}`);
      if (user.profile) command.push(`=profile=${user.profile}`);
      if (user.service) command.push(`=service=${user.service}`);
      if (user['caller-id']) command.push(`=caller-id=${user['caller-id']}`);
      if (user.comment) command.push(`=comment=${user.comment}`);
      if (user.disabled) command.push(`=disabled=${user.disabled}`);

      await this.api!.write(command);
      console.log(`Added PPPoE user: ${user.name}`);
      return true;
    } catch (error) {
      console.error('Failed to add PPPoE user:', error.message);
      return false;
    }
  }

  // Update hotspot user
  async updateHotspotUser(username: string, updates: Partial<MikroTikUser>): Promise<boolean> {
    try {
      this.ensureConnected();
      
      // First find the user ID
      const users = await this.api!.write(['/ip/hotspot/user/print', `?name=${username}`]);
      if (users.length === 0) {
        throw new Error(`Hotspot user ${username} not found`);
      }

      const userId = users[0]['.id'];
      const command = ['/ip/hotspot/user/set', `=.id=${userId}`];
      
      if (updates.password) command.push(`=password=${updates.password}`);
      if (updates.profile) command.push(`=profile=${updates.profile}`);
      if (updates.comment) command.push(`=comment=${updates.comment}`);
      if (updates.disabled !== undefined) command.push(`=disabled=${updates.disabled}`);

      await this.api!.write(command);
      console.log(`Updated hotspot user: ${username}`);
      return true;
    } catch (error) {
      console.error('Failed to update hotspot user:', error.message);
      return false;
    }
  }

  // Update PPPoE user
  async updatePppoeUser(username: string, updates: Partial<MikroTikUser>): Promise<boolean> {
    try {
      this.ensureConnected();
      
      // First find the user ID
      const users = await this.api!.write(['/ppp/secret/print', `?name=${username}`]);
      if (users.length === 0) {
        throw new Error(`PPPoE user ${username} not found`);
      }

      const userId = users[0]['.id'];
      const command = ['/ppp/secret/set', `=.id=${userId}`];
      
      if (updates.password) command.push(`=password=${updates.password}`);
      if (updates.profile) command.push(`=profile=${updates.profile}`);
      if (updates.service) command.push(`=service=${updates.service}`);
      if (updates['caller-id']) command.push(`=caller-id=${updates['caller-id']}`);
      if (updates.comment) command.push(`=comment=${updates.comment}`);
      if (updates.disabled !== undefined) command.push(`=disabled=${updates.disabled}`);

      await this.api!.write(command);
      console.log(`Updated PPPoE user: ${username}`);
      return true;
    } catch (error) {
      console.error('Failed to update PPPoE user:', error.message);
      return false;
    }
  }

  // Remove hotspot user
  async removeHotspotUser(username: string): Promise<boolean> {
    try {
      this.ensureConnected();
      
      const users = await this.api!.write(['/ip/hotspot/user/print', `?name=${username}`]);
      if (users.length === 0) {
        throw new Error(`Hotspot user ${username} not found`);
      }

      const userId = users[0]['.id'];
      await this.api!.write(['/ip/hotspot/user/remove', `=.id=${userId}`]);
      console.log(`Removed hotspot user: ${username}`);
      return true;
    } catch (error) {
      console.error('Failed to remove hotspot user:', error.message);
      return false;
    }
  }

  // Remove PPPoE user
  async removePppoeUser(username: string): Promise<boolean> {
    try {
      this.ensureConnected();
      
      const users = await this.api!.write(['/ppp/secret/print', `?name=${username}`]);
      if (users.length === 0) {
        throw new Error(`PPPoE user ${username} not found`);
      }

      const userId = users[0]['.id'];
      await this.api!.write(['/ppp/secret/remove', `=.id=${userId}`]);
      console.log(`Removed PPPoE user: ${username}`);
      return true;
    } catch (error) {
      console.error('Failed to remove PPPoE user:', error.message);
      return false;
    }
  }

  // Get active sessions
  async getActiveSessions(): Promise<any[]> {
    try {
      this.ensureConnected();
      
      // Get hotspot active sessions
      const hotspotSessions = await this.api!.write('/ip/hotspot/active/print');
      
      // Get PPPoE active sessions
      const pppoeSessions = await this.api!.write('/ppp/active/print');
      
      return [
        ...hotspotSessions.map(session => ({ ...session, type: 'hotspot' })),
        ...pppoeSessions.map(session => ({ ...session, type: 'pppoe' }))
      ];
    } catch (error) {
      console.error('Failed to get active sessions:', error.message);
      return [];
    }
  }
}

// Helper function to create MikroTik service instance and connect
export async function createMikroTikConnection(connection: MikroTikConnection): Promise<MikroTikService | null> {
  const service = new MikroTikService();
  const connected = await service.connect(connection);
  
  if (!connected) {
    await service.disconnect();
    return null;
  }
  
  return service;
}

// Helper function to parse MikroTik time format
export function parseMikroTikTime(timeStr: string): number {
  if (!timeStr) return 0;
  
  let totalSeconds = 0;
  const parts = timeStr.split(/[dhms]/);
  
  if (timeStr.includes('d')) {
    const days = parseInt(parts[0]) || 0;
    totalSeconds += days * 86400;
  }
  
  if (timeStr.includes('h')) {
    const hours = parseInt(parts[timeStr.includes('d') ? 1 : 0]) || 0;
    totalSeconds += hours * 3600;
  }
  
  if (timeStr.includes('m')) {
    const minutes = parseInt(parts[timeStr.includes('h') ? (timeStr.includes('d') ? 2 : 1) : (timeStr.includes('d') ? 1 : 0)]) || 0;
    totalSeconds += minutes * 60;
  }
  
  if (timeStr.includes('s')) {
    const seconds = parseInt(parts[parts.length - 2]) || 0;
    totalSeconds += seconds;
  }
  
  return totalSeconds;
}

// Helper function to parse MikroTik byte format
export function parseMikroTikBytes(bytesStr: string): number {
  if (!bytesStr) return 0;
  
  const match = bytesStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?i?B?)$/i);
  if (!match) return parseInt(bytesStr) || 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  switch (unit) {
    case 'KIB':
    case 'KB': return value * 1024;
    case 'MIB':
    case 'MB': return value * 1024 * 1024;
    case 'GIB':
    case 'GB': return value * 1024 * 1024 * 1024;
    case 'TIB':
    case 'TB': return value * 1024 * 1024 * 1024 * 1024;
    default: return value;
  }
}
