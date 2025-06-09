import * as React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { DashboardStats, SystemStats } from '../types';
import { Monitor, Users, Activity, Wifi } from 'lucide-react';
import { DateTimeDisplay } from '../components/DateTimeDisplay';
import { NotesWidget } from '../components/NotesWidget';
import { DeviceStatsWidget } from '../components/DeviceStatsWidget';

export function Overview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchSystemStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchSystemStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reports/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/system/stats');
      if (response.ok) {
        const data = await response.json();
        setSystemStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Network Infrastructure Overview</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Network Infrastructure Overview</h1>
      
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Main Stats and System Info */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.devices.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.devices.online || 0} online
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hotspot Users</CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.users.hotspot || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Wi-Fi accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">PPPoE Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.users.pppoe || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Dial-up accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.sessions.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Currently online
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Performance */}
          {systemStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>CPU Usage</CardTitle>
                  <CardDescription>{systemStats.cpu.cores} cores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usage</span>
                      <span>{systemStats.cpu.usage}%</span>
                    </div>
                    <Progress value={systemStats.cpu.usage} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage</CardTitle>
                  <CardDescription>
                    {formatBytes(systemStats.memory.used)} / {formatBytes(systemStats.memory.total)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usage</span>
                      <span>{systemStats.memory.usage}%</span>
                    </div>
                    <Progress value={systemStats.memory.usage} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Disk Usage</CardTitle>
                  <CardDescription>
                    {formatBytes(systemStats.disk.used)} / {formatBytes(systemStats.disk.total)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usage</span>
                      <span>{systemStats.disk.usage}%</span>
                    </div>
                    <Progress value={systemStats.disk.usage} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* MikroTik Device Status */}
          <DeviceStatsWidget />

          {/* Network & System Info */}
          {systemStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Network Traffic</CardTitle>
                  <CardDescription>Real-time network statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Bytes In:</span>
                      <span className="text-sm font-medium">
                        {formatBytes(systemStats.network.bytesIn)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Bytes Out:</span>
                      <span className="text-sm font-medium">
                        {formatBytes(systemStats.network.bytesOut)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Packets In:</span>
                      <span className="text-sm font-medium">
                        {systemStats.network.packetsIn.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Packets Out:</span>
                      <span className="text-sm font-medium">
                        {systemStats.network.packetsOut.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Server status and uptime</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Uptime:</span>
                      <span className="text-sm font-medium">
                        {formatUptime(systemStats.uptime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Last Update:</span>
                      <span className="text-sm font-medium">
                        {new Date(systemStats.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Column - DateTime and Notes */}
        <div className="lg:col-span-4 space-y-6">
          {/* Date and Time Display */}
          <DateTimeDisplay />

          {/* Notes Widget */}
          <NotesWidget />
        </div>
      </div>
    </div>
  );
}
