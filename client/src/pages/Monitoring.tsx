import * as React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Device, SystemStats } from '../types';
import { Activity, Cpu, HardDrive, Network } from 'lucide-react';

export function Monitoring() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
    fetchSystemStats();
    
    // Refresh stats every 10 seconds
    const interval = setInterval(() => {
      fetchSystemStats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
        if (data.length > 0 && !selectedDevice) {
          setSelectedDevice(data[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setIsLoading(false);
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

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Monitoring</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Network Monitoring</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Real-time Monitoring
          </CardTitle>
          <CardDescription>
            Monitor system performance and network traffic in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Monitor Device:</label>
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose a device" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.id} value={device.id.toString()}>
                    {device.name} ({device.host})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* System Performance Metrics */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className={getStatusColor(systemStats.cpu.usage)}>
                  {systemStats.cpu.usage}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {systemStats.cpu.cores} cores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className={getStatusColor(systemStats.memory.usage)}>
                  {systemStats.memory.usage}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(systemStats.memory.used)} / {formatBytes(systemStats.memory.total)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className={getStatusColor(systemStats.disk.usage)}>
                  {systemStats.disk.usage}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(systemStats.disk.used)} / {formatBytes(systemStats.disk.total)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {formatUptime(systemStats.uptime)}
              </div>
              <p className="text-xs text-muted-foreground">
                Since last restart
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Network Traffic */}
      {systemStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Network className="h-5 w-5 mr-2" />
              Network Traffic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {formatBytes(systemStats.network.bytesIn)}
                </div>
                <p className="text-sm text-muted-foreground">Bytes In</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {formatBytes(systemStats.network.bytesOut)}
                </div>
                <p className="text-sm text-muted-foreground">Bytes Out</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {systemStats.network.packetsIn.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Packets In</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {systemStats.network.packetsOut.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Packets Out</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active User Sessions</CardTitle>
          <CardDescription>
            Real-time view of connected users and their activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No active sessions to display. Session monitoring will appear here when users are connected.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
