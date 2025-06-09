import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Device, HotspotUser } from '../types';
import { Plus, Wifi, Edit, Trash2, RefreshCw, Download } from 'lucide-react';

export function HotspotUsers() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<HotspotUser[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSync, setIsSync] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      fetchUsers(parseInt(selectedDevice));
    }
  }, [selectedDevice]);

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

  const fetchUsers = async (deviceId: number) => {
    try {
      const response = await fetch(`/api/users/hotspot/${deviceId}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSyncUsers = async () => {
    if (!selectedDevice) return;

    setIsSync(true);
    setMessage('');

    try {
      const response = await fetch(`/api/profile-management/hotspot/${selectedDevice}/sync-users`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        await fetchUsers(parseInt(selectedDevice));
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to sync hotspot users');
      }
    } catch (error) {
      console.error('Sync hotspot users error:', error);
      setMessage('Failed to sync hotspot users');
    } finally {
      setIsSync(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`/api/users/hotspot/${userId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchUsers(parseInt(selectedDevice));
          setMessage('User deleted successfully');
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
        setMessage('Failed to delete user');
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Hotspot Users</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const selectedDeviceData = devices.find(d => d.id.toString() === selectedDevice);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Hotspot Users</h1>
        <Button disabled={!selectedDevice}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('successfully') || message.includes('Synchronized') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessage('')}
            className="ml-2 h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wifi className="h-5 w-5 mr-2" />
            Wi-Fi User Management
          </CardTitle>
          <CardDescription>
            Manage hotspot users for Wi-Fi authentication and access control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Select Device:</label>
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

            {selectedDevice && selectedDeviceData?.type === 'MikroTik' && (
              <div className="flex space-x-2">
                <Button
                  onClick={() => fetchUsers(parseInt(selectedDevice))}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={handleSyncUsers}
                  disabled={isSync}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isSync ? 'Syncing...' : 'Sync from Device'}
                </Button>
              </div>
            )}
          </div>

          {selectedDevice && (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Usage</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.profile || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={user.disabled ? 'secondary' : 'default'}>
                          {user.disabled ? 'Disabled' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>↓ {formatBytes(user.bytes_in)}</div>
                          <div>↑ {formatBytes(user.bytes_out)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatUptime(user.uptime)}</TableCell>
                      <TableCell className="max-w-32 truncate">
                        {user.comment || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedDeviceData?.type === 'MikroTik' 
                    ? 'No hotspot users found. Click "Sync from Device" to load users from the MikroTik device.'
                    : 'No hotspot users found for this device.'
                  }
                </div>
              )}
            </div>
          )}

          {selectedDeviceData?.type === 'MikroTik' && (
            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
              <strong>MikroTik Integration:</strong> This device supports real-time user synchronization. 
              Use "Sync from Device" to import all existing users from the router, or add users here 
              and they can be pushed to the device.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
