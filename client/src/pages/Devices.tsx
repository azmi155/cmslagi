import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Device } from '../types';
import { Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { DeviceForm } from '../components/DeviceForm';

export function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (deviceId: number) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/sync`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchDevices();
      }
    } catch (error) {
      console.error('Failed to sync device:', error);
    }
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setShowForm(true);
  };

  const handleDelete = async (deviceId: number) => {
    if (confirm('Are you sure you want to delete this device?')) {
      try {
        const response = await fetch(`/api/devices/${deviceId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchDevices();
        }
      } catch (error) {
        console.error('Failed to delete device:', error);
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDevice(null);
    fetchDevices();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Devices</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Network Devices</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <Card key={device.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{device.name}</CardTitle>
                <Badge variant={device.is_online ? 'default' : 'secondary'}>
                  {device.is_online ? (
                    <Wifi className="h-3 w-3 mr-1" />
                  ) : (
                    <WifiOff className="h-3 w-3 mr-1" />
                  )}
                  {device.is_online ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{device.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Host:</span>
                  <span>{device.host}:{device.port}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Username:</span>
                  <span>{device.username}</span>
                </div>
                {device.last_sync && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Sync:</span>
                    <span>{new Date(device.last_sync).toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSync(device.id)}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEdit(device)}
                >
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDelete(device.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {devices.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No devices configured. Click "Add Device" to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <DeviceForm
          device={editingDevice}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
