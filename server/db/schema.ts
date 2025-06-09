export interface DatabaseSchema {
  admin_users: AdminUser;
  devices: Device;
  hotspot_profiles: HotspotProfile;
  pppoe_profiles: PppoeProfile;
  hotspot_users: HotspotUser;
  pppoe_users: PppoeUser;
  user_sessions: UserSession;
  branding_settings: BrandingSettings;
  notes: Note;
  device_stats: DeviceStats;
  wan_monitors: WanMonitor;
  wan_ping_history: WanPingHistory;
  service_packages: ServicePackage;
}

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: number;
  name: string;
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  is_online: number; // SQLite stores boolean as integer (0/1)
  last_sync: string | null;
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

export interface HotspotUser {
  id: number;
  device_id: number;
  username: string;
  password: string;
  profile: string | null;
  comment: string | null;
  disabled: number; // SQLite stores boolean as integer (0/1)
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
  disabled: number; // SQLite stores boolean as integer (0/1)
  contact_name: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  service_cost: number;
  bytes_in: number;
  bytes_out: number;
  uptime: number;
  created_at: string;
  updated_at: string;
  customer_name: string | null;
  customer_address: string | null;
  ip_address: string | null;
  service_package_id: number | null;
}

export interface UserSession {
  id: number;
  device_id: number;
  username: string;
  session_id: string | null;
  caller_id: string | null;
  address: string | null;
  uptime: number;
  bytes_in: number;
  bytes_out: number;
  start_time: string;
  end_time: string | null;
  is_active: number; // SQLite stores boolean as integer (0/1)
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
  completed: number; // SQLite stores boolean as integer (0/1)
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
  is_active: number; // SQLite stores boolean as integer (0/1)
  last_ping_time: string | null;
  last_ping_success: number; // SQLite stores boolean as integer (0/1)
  last_ping_latency: number | null;
  created_at: string;
  updated_at: string;
}

export interface WanPingHistory {
  id: number;
  wan_monitor_id: number;
  ping_time: string;
  success: number; // SQLite stores boolean as integer (0/1)
  latency: number | null;
  error_message: string | null;
}

export interface ServicePackage {
  id: number;
  name: string;
  description: string | null;
  price: number;
  bandwidth_up: string | null;
  bandwidth_down: string | null;
  duration_days: number;
  is_active: number; // SQLite stores boolean as integer (0/1)
  created_at: string;
  updated_at: string;
}
