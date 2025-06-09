import * as React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Device, SystemStats } from '../types';
import { Activity, Cpu, HardDrive, Network, RefreshCw, Cable } from 'lucide-react';

interface InterfaceStats {
  name: string;
  type: string;
  running: boolean;
  disabled: boolean;
  tx_bytes: number;
  rx_bytes: number;
  tx_packets: number;
  rx_packets: number;
  tx_errors: number;
  rx_errors: number;
  tx_drops: number;
  rx_drops: number;
  mtu: number;
  actual_mtu: number;
  link_downs: number;
  comment: string | null;
}

export function Monitoring() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [interfaceStats, setInterfaceStats] = useState<InterfaceStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDevices();
    fetchSystemStats();
    
    // Refresh stats every 10 seconds
    const interval = setInterval(() => {
      fetchSystemStats();
      if (selectedDevice) {
        fetchInterfaceStats(parseInt(selectedDevice));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedDevice]);

  useEffect(() => {
    if (selectedDevice) {
      fetchInterfaceStats(parseInt(selectedDevice));
    }
  }, [selectedDevice]);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        const mikrotikDevices = data.filter((device: Device) => device.type === 'MikroTik');
        setDevices(mikrotikDevices);
        if (mikrotikDevices.length > 0 && !selectedDevice) {
          setSelectedDevice(mikrotikDevices[0].id.toString());
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

  const fetchInterfaceStats = async (deviceId: number) => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/traffic/${deviceId}/interfaces`);
      if (response.ok) {
        const data = await response.json();
        setInterfaceStats(data);
      } else {
        console.error('Failed to fetch interface stats');
        setInterfaceStats([]);
      }
    } catch (error) {
      console.error('Failed to fetch interface stats:', error);
      setInterfaceStats([]);
    } finally {
      setIsRefreshing(false);
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

  const getInterfaceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ethernet':
      case 'ether':
        return Cable;
      case 'wlan':
      case 'wireless':
        return Activity;
      default:
        return Network;
    }
  };

  const handleRefreshInterfaces = () => {
    if (selectedDevice) {
      fetchInterfaceStats(parseInt(selectedDevice));
    }
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

      {/* Interface Traffic Monitoring */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Network className="h-5 w-5 mr-2" />
                Interface Traffic Monitoring
              </CardTitle>
              <CardDescription>
                Real-time interface statistics from MikroTik devices
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose a MikroTik device" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id.toString()}>
                      {device.name} ({device.host})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleRefreshInterfaces}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedDevice ? (
            <div className="overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Interface</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>TX Bytes</TableHead>
                    <TableHead>RX Bytes</TableHead>
                    <TableHead>TX Packets</TableHead>
                    <TableHead>RX Packets</TableHead>
                    <TableHead>Errors/Drops</TableHead>
                    <TableHead>MTU</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interfaceStats.map((iface) => {
                    const InterfaceIcon = getInterfaceIcon(iface.type);
                    
                    return (
                      <TableRow key={iface.name}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <InterfaceIcon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{iface.name}</div>
                              {iface.comment && (
                                <div className="text-xs text-muted-foreground">
                                  {iface.comment}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{iface.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={iface.running && !iface.disabled ? 'default' : 'secondary'}>
                              {iface.running && !iface.disabled ? 'Running' : 'Down'}
                            </Badge>
                            {iface.disabled && (
                              <div className="text-xs text-muted-foreground">Disabled</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-blue-600">{formatBytes(iface.tx_bytes)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-green-600">{formatBytes(iface.rx_bytes)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{iface.tx_packets.toLocaleString()}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{iface.rx_packets.toLocaleString()}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {(iface.tx_errors > 0 || iface.rx_errors > 0) && (
                              <div className="text-red-600">
                                E: {iface.tx_errors + iface.rx_errors}
                              </div>
                            )}
                            {(iface.tx_drops > 0 || iface.rx_drops > 0) && (
                              <div className="text-orange-600">
                                D: {iface.tx_drops + iface.rx_drops}
                              </div>
                            )}
                            {iface.link_downs > 0 && (
                              <div className="text-yellow-600">
                                L: {iface.link_downs}
                              </div>
                            )}
                            {iface.tx_errors === 0 && iface.rx_errors === 0 && 
                             iface.tx_drops === 0 && iface.rx_drops === 0 && 
                             iface.link_downs === 0 && (
                              <div className="text-green-600">Clean</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {iface.mtu !== iface.actual_mtu ? (
                              <div>
                                <div>{iface.actual_mtu}</div>
                                <div className="text-xs text-muted-foreground">
                                  (cfg: {iface.mtu})
                                </div>
                              </div>
                            ) : (
                              <div>{iface.mtu}</div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {interfaceStats.length === 0 && !isRefreshing && (
                <div className="text-center py-8 text-muted-foreground">
                  No interface data available. Make sure the device is online and accessible.
                </div>
              )}

              {isRefreshing && (
                <div className="text-center py-8 text-muted-foreground">
                  Loading interface statistics...
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {devices.length === 0 
                ? 'No MikroTik devices available for traffic monitoring.'
                : 'Select a MikroTik device to view interface statistics.'
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
