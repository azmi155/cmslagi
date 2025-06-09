import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Device } from '../types';
import { Plus, RefreshCw, Wifi, WifiOff, Edit, Trash2, Monitor } from 'lucide-react';
import { DeviceForm } from '../components/DeviceForm';

export function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      console.log('Fetching devices...');
      const response = await fetch('/api/devices');
      console.log('Devices response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Devices fetched:', data.length);
        setDevices(data);
        setError('');
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch devices:', errorData);
        setError(errorData.error || 'Failed to fetch devices');
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      setError('Network error: Failed to fetch devices');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSync = async (deviceId: number) => {
    try {
      console.log('Syncing device:', deviceId);
      setRefreshing(true);
      
      const response = await fetch(`/api/devices/${deviceId}/sync`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Sync result:', result);
        await fetchDevices();
        setError('');
      } else {
        const errorData = await response.json();
        console.error('Sync failed:', errorData);
        setError(errorData.error || 'Failed to sync device');
      }
    } catch (error) {
      console.error('Failed to sync device:', error);
      setError('Network error: Failed to sync device');
    } finally {
      setRefreshing(false);
    }
  };

  const handleEdit = (device: Device) => {
    console.log('Editing device:', device);
    setEditingDevice(device);
    setShowForm(true);
  };

  const handleDelete = async (deviceId: number) => {
    if (confirm('Are you sure you want to delete this device?')) {
      try {
        console.log('Deleting device:', deviceId);
        const response = await fetch(`/api/devices/${deviceId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          console.log('Device deleted successfully');
          await fetchDevices();
          setError('');
        } else {
          const errorData = await response.json();
          console.error('Delete failed:', errorData);
          setError(errorData.error || 'Failed to delete device');
        }
      } catch (error) {
        console.error('Failed to delete device:', error);
        setError('Network error: Failed to delete device');
      }
    }
  };

  const handleFormClose = () => {
    console.log('Closing device form');
    setShowForm(false);
    setEditingDevice(null);
    // Refresh the devices list after form closes
    fetchDevices();
  };

  const handleAddDevice = () => {
    console.log('Opening add device form');
    setEditingDevice(null);
    setShowForm(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDevices();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Monitor className="h-8 w-8 mr-3" />
          <h1 className="text-3xl font-bold">Network Devices</h1>
        </div>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Monitor className="h-8 w-8 mr-3" />
          <h1 className="text-3xl font-bold">Network Devices</h1>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAddDevice}>
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError('')}
            className="ml-2 h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      )}

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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(device.created_at).toLocaleDateString()}</span>
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
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEdit(device)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDelete(device.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {devices.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No devices configured yet. Click "Add Device" to get started.
            </p>
            <Button onClick={handleAddDevice}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Device
            </Button>
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
