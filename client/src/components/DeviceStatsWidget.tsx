import * as React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Device, DeviceStats } from '../types';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Thermometer, 
  Zap, 
  Clock,
  Wifi,
  WifiOff 
} from 'lucide-react';

export function DeviceStatsWidget() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceStats, setDeviceStats] = useState<Record<number, DeviceStats>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (devices.length > 0) {
      fetchAllDeviceStats();
    }
  }, [devices]);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data.filter((device: Device) => device.type === 'MikroTik'));
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllDeviceStats = async () => {
    const statsPromises = devices.map(async (device) => {
      try {
        const response = await fetch(`/api/device-stats/${device.id}`);
        if (response.ok) {
          const stats = await response.json();
          return { deviceId: device.id, stats };
        }
      } catch (error) {
        console.error(`Failed to fetch stats for device ${device.id}:`, error);
      }
      return null;
    });

    const results = await Promise.all(statsPromises);
    const statsMap: Record<number, DeviceStats> = {};
    
    results.forEach(result => {
      if (result) {
        statsMap[result.deviceId] = result.stats;
      }
    });

    setDeviceStats(statsMap);
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 80) return 'text-orange-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getTemperatureColor = (temp: number | null) => {
    if (!temp) return 'text-gray-500';
    if (temp >= 70) return 'text-red-500';
    if (temp >= 60) return 'text-orange-500';
    if (temp >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MikroTik Device Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const mikrotikDevices = devices.filter(device => device.type === 'MikroTik');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Server className="h-5 w-5 mr-2" />
          MikroTik Device Status
        </CardTitle>
        <CardDescription>
          Real-time monitoring of MikroTik router performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {mikrotikDevices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No MikroTik devices configured yet.
            </div>
          ) : (
            mikrotikDevices.map((device) => {
              const stats = deviceStats[device.id];
              
              return (
                <div key={device.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{device.name}</h4>
                      <p className="text-sm text-muted-foreground">{device.host}</p>
                    </div>
                    <Badge variant={device.is_online ? 'default' : 'secondary'}>
                      {device.is_online ? (
                        <Wifi className="h-3 w-3 mr-1" />
                      ) : (
                        <WifiOff className="h-3 w-3 mr-1" />
                      )}
                      {device.is_online ? 'Online' : 'Offline'}
                    </Badge>
                  </div>

                  {stats && device.is_online ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* CPU Usage */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center">
                            <Cpu className="h-4 w-4 mr-1" />
                            CPU
                          </span>
                          <span className={getStatusColor(stats.cpu_usage)}>
                            {stats.cpu_usage}%
                          </span>
                        </div>
                        <Progress value={stats.cpu_usage} className="h-2" />
                      </div>

                      {/* Memory Usage */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center">
                            <HardDrive className="h-4 w-4 mr-1" />
                            Memory
                          </span>
                          <span className={getStatusColor(stats.memory_usage)}>
                            {stats.memory_usage}%
                          </span>
                        </div>
                        <Progress value={stats.memory_usage} className="h-2" />
                      </div>

                      {/* Disk Usage */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center">
                            <HardDrive className="h-4 w-4 mr-1" />
                            Disk
                          </span>
                          <span className={getStatusColor(stats.disk_usage)}>
                            {stats.disk_usage}%
                          </span>
                        </div>
                        <Progress value={stats.disk_usage} className="h-2" />
                      </div>

                      {/* Uptime */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Uptime
                          </span>
                          <span className="text-green-600">
                            {formatUptime(stats.uptime)}
                          </span>
                        </div>
                      </div>

                      {/* Temperature */}
                      {stats.temperature && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center">
                              <Thermometer className="h-4 w-4 mr-1" />
                              Temperature
                            </span>
                            <span className={getTemperatureColor(stats.temperature)}>
                              {stats.temperature}°C
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Voltage */}
                      {stats.voltage && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center">
                              <Zap className="h-4 w-4 mr-1" />
                              Voltage
                            </span>
                            <span className="text-blue-600">
                              {stats.voltage}V
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      {device.is_online ? 'Loading device statistics...' : 'Device is offline'}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
