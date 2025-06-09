import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Device, PppoeUser } from '../types';
import { Plus, Users, Edit, Trash2, Phone } from 'lucide-react';

export function PppoeUsers() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<PppoeUser[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

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
      const response = await fetch(`/api/users/pppoe/${deviceId}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`/api/users/pppoe/${userId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchUsers(parseInt(selectedDevice));
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
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

  const openWhatsApp = (phone: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">PPPoE Users</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">PPPoE Users</h1>
        <Button disabled={!selectedDevice}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            PPPoE User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {selectedDevice && (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Service Cost</TableHead>
                    <TableHead>Data Usage</TableHead>
                    <TableHead>Uptime</TableHead>
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
                        {user.contact_name && (
                          <div className="space-y-1">
                            <div className="font-medium">{user.contact_name}</div>
                            {user.contact_phone && (
                              <div className="text-xs text-muted-foreground">
                                {user.contact_phone}
                              </div>
                            )}
                            {user.contact_whatsapp && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openWhatsApp(user.contact_whatsapp!)}
                                className="h-6 px-2 text-xs"
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                WhatsApp
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.service_cost > 0 ? `$${user.service_cost}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>↓ {formatBytes(user.bytes_in)}</div>
                          <div>↑ {formatBytes(user.bytes_out)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatUptime(user.uptime)}</TableCell>
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
                  No PPPoE users found for this device.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
