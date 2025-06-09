import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Device } from '../types';
import { Plus, RefreshCw, Wifi, WifiOff, Edit, Trash2, Monitor, TestTube } from 'lucide-react';
import { DeviceForm } from '../components/DeviceForm';
import { MikroTikSyncButton } from '../components/MikroTikSyncButton';

export function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);

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

  const handleTestConnection = async (deviceId: number) => {
    setTestingConnection(deviceId);
    
    try {
      console.log('Testing connection for device:', deviceId);
      
      const response = await fetch(`/api/devices/${deviceId}/test-connection`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Connection test result:', result);
        
        if (result.success) {
          alert(`Connection successful!\nDevice: ${result.identity}\nVersion: ${result.version}`);
        } else {
          alert(`Connection failed: ${result.message}`);
        }
      } else {
        const errorData = await response.json();
        console.error('Connection test failed:', errorData);
        alert(`Connection test failed: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
      alert('Network error: Failed to test connection');
    } finally {
      setTestingConnection(null);
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

  const handleSyncComplete = () => {
    // Refresh the devices list after sync
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
                <div className="flex items-center space-x-2">
                  <Badge variant={device.type === 'MikroTik' ? 'default' : 'secondary'}>
                    {device.type}
                  </Badge>
                  <Badge variant={device.is_online ? 'default' : 'secondary'}>
                    {device.is_online ? (
                      <Wifi className="h-3 w-3 mr-1" />
                    ) : (
                      <WifiOff className="h-3 w-3 mr-1" />
                    )}
                    {device.is_online ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
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
              
              <div className="flex flex-wrap gap-2">
                {device.type === 'MikroTik' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTestConnection(device.id)}
                    disabled={testingConnection === device.id}
                  >
                    <TestTube className={`h-3 w-3 mr-1 ${testingConnection === device.id ? 'animate-pulse' : ''}`} />
                    {testingConnection === device.id ? 'Testing...' : 'Test'}
                  </Button>
                )}
                
                <MikroTikSyncButton 
                  deviceId={device.id} 
                  deviceType={device.type}
                  onSyncComplete={handleSyncComplete}
                />
                
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

              {device.type === 'MikroTik' && (
                <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                  <strong>MikroTik Integration:</strong> This device supports real-time sync, 
                  profile loading, and user management through RouterOS API.
                </div>
              )}
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
