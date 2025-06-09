export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Device {
  id: number;
  name: string;
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  is_online: boolean;
  last_sync: string | null;
  created_at: string;
  updated_at: string;
}

export interface HotspotUser {
  id: number;
  device_id: number;
  username: string;
  password: string;
  profile: string | null;
  comment: string | null;
  disabled: boolean;
  bytes_in: number;
  bytes_out: number;
  uptime: number;
  created_at: string;
  updated_at: string;
}

export interface PppoeUser {
  id: number;
  device_id: number;
  username: string;
  password: string;
  profile: string | null;
  service: string | null;
  caller_id: string | null;
  comment: string | null;
  disabled: boolean;
  contact_name: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  service_cost: number;
  bytes_in: number;
  bytes_out: number;
  uptime: number;
  created_at: string;
  updated_at: string;
}

export interface HotspotProfile {
  id: number;
  device_id: number;
  name: string;
  rate_limit: string | null;
  session_timeout: number | null;
  shared_users: number;
  created_at: string;
}

export interface PppoeProfile {
  id: number;
  device_id: number;
  name: string;
  local_address: string | null;
  remote_address: string | null;
  rate_limit: string | null;
  session_timeout: number | null;
  created_at: string;
}

export interface DashboardStats {
  devices: {
    total: number;
    online: number;
  };
  users: {
    hotspot: number;
    pppoe: number;
  };
  sessions: {
    active: number;
  };
}

export interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  uptime: number;
  timestamp: string;
}

export interface BrandingSettings {
  id: number;
  logo_filename: string | null;
  logo_path: string | null;
  company_name: string;
  company_description: string | null;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  priority: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceStats {
  id: number;
  device_id: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  uptime: number;
  temperature: number | null;
  voltage: number | null;
  recorded_at: string;
}

export interface WanMonitor {
  id: number;
  name: string;
  host: string;
  description: string | null;
  is_active: boolean;
  last_ping_time: string | null;
  last_ping_success: boolean;
  last_ping_latency: number | null;
  created_at: string;
  updated_at: string;
}

export interface WanPingHistory {
  id: number;
  wan_monitor_id: number;
  ping_time: string;
  success: boolean;
  latency: number | null;
  error_message: string | null;
}
