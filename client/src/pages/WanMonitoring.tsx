import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { WanMonitor } from '../types';
import { 
  Plus, 
  Activity, 
  Edit, 
  Trash2, 
  RefreshCw,
  Globe,
  Wifi,
  WifiOff,
  Timer,
  Zap
} from 'lucide-react';

export function WanMonitoring() {
  const [monitors, setMonitors] = useState<WanMonitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<WanMonitor | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = async () => {
    try {
      const response = await fetch('/api/wan-monitors');
      if (response.ok) {
        const data = await response.json();
        setMonitors(data);
      }
    } catch (error) {
      console.error('Failed to fetch WAN monitors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingMonitor ? `/api/wan-monitors/${editingMonitor.id}` : '/api/wan-monitors';
      const method = editingMonitor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchMonitors();
        setShowForm(false);
        setEditingMonitor(null);
        setFormData({
          name: '',
          host: '',
          description: '',
          is_active: true
        });
      }
    } catch (error) {
      console.error('Failed to save WAN monitor:', error);
    }
  };

  const handleEdit = (monitor: WanMonitor) => {
    setEditingMonitor(monitor);
    setFormData({
      name: monitor.name,
      host: monitor.host,
      description: monitor.description || '',
      is_active: monitor.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (monitorId: number) => {
    if (confirm('Are you sure you want to delete this WAN monitor?')) {
      try {
        const response = await fetch(`/api/wan-monitors/${monitorId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchMonitors();
        }
      } catch (error) {
        console.error('Failed to delete WAN monitor:', error);
      }
    }
  };

  const handlePing = async (monitorId: number) => {
    try {
      const response = await fetch(`/api/wan-monitors/${monitorId}/ping`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchMonitors();
      }
    } catch (error) {
      console.error('Failed to ping WAN monitor:', error);
    }
  };

  const handlePingAll = async () => {
    setIsPinging(true);
    try {
      const response = await fetch('/api/wan-monitors/ping-all', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchMonitors();
      }
    } catch (error) {
      console.error('Failed to ping all WAN monitors:', error);
    } finally {
      setIsPinging(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatLatency = (latency: number | null) => {
    if (latency === null) return '-';
    return `${latency}ms`;
  };

  const getLatencyColor = (latency: number | null) => {
    if (latency === null) return 'text-gray-500';
    if (latency < 50) return 'text-green-600';
    if (latency < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">WAN Monitoring</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Activity className="h-8 w-8 mr-3" />
          <h1 className="text-3xl font-bold">WAN Monitoring</h1>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handlePingAll} disabled={isPinging}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {isPinging ? 'Pinging...' : 'Ping All'}
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Monitor
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monitors</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monitors.length}</div>
            <p className="text-xs text-muted-foreground">
              {monitors.filter(m => m.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {monitors.filter(m => m.last_ping_success).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Responding to ping
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {monitors.filter(m => !m.last_ping_success).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Not responding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const validLatencies = monitors
                  .filter(m => m.last_ping_success && m.last_ping_latency !== null)
                  .map(m => m.last_ping_latency!);
                
                if (validLatencies.length === 0) return '-';
                
                const avg = validLatencies.reduce((sum, lat) => sum + lat, 0) / validLatencies.length;
                return `${Math.round(avg)}ms`;
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monitors Table */}
      <Card>
        <CardHeader>
          <CardTitle>WAN Monitors</CardTitle>
          <CardDescription>
            Monitor external connectivity by pinging remote hosts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Last Ping</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitors.map((monitor) => (
                <TableRow key={monitor.id}>
                  <TableCell className="font-medium">{monitor.name}</TableCell>
                  <TableCell>{monitor.host}</TableCell>
                  <TableCell>
                    <Badge variant={monitor.last_ping_success ? 'default' : 'secondary'}>
                      {monitor.last_ping_success ? (
                        <Wifi className="h-3 w-3 mr-1" />
                      ) : (
                        <WifiOff className="h-3 w-3 mr-1" />
                      )}
                      {monitor.last_ping_success ? 'Online' : 'Offline'}
                    </Badge>
                  </TableCell>
                  <TableCell className={getLatencyColor(monitor.last_ping_latency)}>
                    {formatLatency(monitor.last_ping_latency)}
                  </TableCell>
                  <TableCell>
                    {monitor.last_ping_time 
                      ? new Date(monitor.last_ping_time).toLocaleString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={monitor.is_active ? 'default' : 'secondary'}>
                      {monitor.is_active ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePing(monitor.id)}
                      >
                        <Zap className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(monitor)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(monitor.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {monitors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No WAN monitors configured. Click "Add Monitor" to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Monitor Dialog */}
      {showForm && (
        <Dialog open={true} onOpenChange={() => {
          setShowForm(false);
          setEditingMonitor(null);
          setFormData({
            name: '',
            host: '',
            description: '',
            is_active: true
          });
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMonitor ? 'Edit WAN Monitor' : 'Add New WAN Monitor'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Monitor Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Google DNS"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="host">Host/IP Address</Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                  placeholder="8.8.8.8"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  IP address or hostname to ping
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Google Public DNS Server"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Active Monitoring</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingMonitor(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMonitor ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
