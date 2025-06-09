import * as React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Device, WanMonitor } from '../types';
import { 
  Network, 
  Monitor, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Router,
  Server,
  Globe,
  Zap,
  Link as LinkIcon,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface NetworkNode {
  id: string;
  type: 'internet' | 'wan_monitor' | 'router' | 'device';
  device?: Device;
  wanMonitor?: WanMonitor;
  x: number;
  y: number;
  label: string;
  status: 'online' | 'offline' | 'unknown';
  latency?: number | null;
}

interface NetworkLink {
  from: string;
  to: string;
  type: 'ethernet' | 'wireless' | 'wan';
  status: 'active' | 'inactive';
}

export function Topology() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [wanMonitors, setWanMonitors] = useState<WanMonitor[]>([]);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (devices.length > 0 || wanMonitors.length > 0) {
      generateTopology();
    }
  }, [devices, wanMonitors]);

  const fetchData = async () => {
    try {
      // Fetch devices
      const devicesResponse = await fetch('/api/devices');
      if (devicesResponse.ok) {
        const devicesData = await devicesResponse.json();
        setDevices(devicesData);
      }

      // Fetch WAN monitors
      const wanResponse = await fetch('/api/wan-monitors');
      if (wanResponse.ok) {
        const wanData = await wanResponse.json();
        setWanMonitors(wanData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTopology = () => {
    const newNodes: NetworkNode[] = [];
    const newLinks: NetworkLink[] = [];

    // Add internet node (center top)
    newNodes.push({
      id: 'internet',
      type: 'internet',
      x: 400,
      y: 50,
      label: 'Internet',
      status: 'online'
    });

    // Add WAN monitor nodes around internet
    wanMonitors.forEach((monitor, index) => {
      const angle = (index / wanMonitors.length) * 2 * Math.PI;
      const radius = 100;
      const x = 400 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);

      newNodes.push({
        id: `wan_${monitor.id}`,
        type: 'wan_monitor',
        wanMonitor: monitor,
        x,
        y,
        label: monitor.name,
        status: monitor.last_ping_success ? 'online' : 'offline',
        latency: monitor.last_ping_latency
      });

      // Connect WAN monitors to internet
      newLinks.push({
        from: 'internet',
        to: `wan_${monitor.id}`,
        type: 'wan',
        status: monitor.last_ping_success ? 'active' : 'inactive'
      });
    });

    // Group devices by type
    const routers = devices.filter(d => d.type === 'MikroTik' || d.type === 'Router');
    const otherDevices = devices.filter(d => d.type !== 'MikroTik' && d.type !== 'Router');

    // Position main routers
    routers.forEach((device, index) => {
      const x = 200 + (index * 400);
      const y = 250;
      
      newNodes.push({
        id: device.id.toString(),
        type: 'router',
        device,
        x,
        y,
        label: device.name,
        status: device.is_online ? 'online' : 'offline'
      });

      // Connect to internet (assuming first router is gateway)
      if (index === 0) {
        newLinks.push({
          from: 'internet',
          to: device.id.toString(),
          type: 'wan',
          status: device.is_online ? 'active' : 'inactive'
        });
      } else {
        // Connect to first router
        newLinks.push({
          from: routers[0].id.toString(),
          to: device.id.toString(),
          type: 'ethernet',
          status: device.is_online ? 'active' : 'inactive'
        });
      }
    });

    // Position other devices
    otherDevices.forEach((device, index) => {
      const routerIndex = index % Math.max(routers.length, 1);
      const router = routers[routerIndex];
      const angle = (index / otherDevices.length) * 2 * Math.PI;
      const radius = 150;
      
      const routerNode = newNodes.find(n => n.id === router?.id.toString());
      const routerX = routerNode?.x || 400;
      const routerY = routerNode?.y || 250;
      
      const x = routerX + radius * Math.cos(angle);
      const y = routerY + radius * Math.sin(angle) + 150;
      
      newNodes.push({
        id: device.id.toString(),
        type: 'device',
        device,
        x,
        y,
        label: device.name,
        status: device.is_online ? 'online' : 'offline'
      });

      // Connect to router
      if (router) {
        newLinks.push({
          from: router.id.toString(),
          to: device.id.toString(),
          type: device.type === 'Wireless' ? 'wireless' : 'ethernet',
          status: device.is_online ? 'active' : 'inactive'
        });
      }
    });

    setNodes(newNodes);
    setLinks(newLinks);
  };

  const getNodeIcon = (node: NetworkNode) => {
    switch (node.type) {
      case 'internet':
        return Globe;
      case 'wan_monitor':
        return Activity;
      case 'router':
        return Router;
      case 'device':
        if (node.device?.type === 'OLT') return Server;
        return Monitor;
      default:
        return Monitor;
    }
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getLinkColor = (link: NetworkLink) => {
    if (link.status === 'active') {
      switch (link.type) {
        case 'wan':
          return 'stroke-blue-500';
        case 'wireless':
          return 'stroke-purple-500';
        case 'ethernet':
          return 'stroke-green-500';
        default:
          return 'stroke-gray-500';
      }
    }
    return 'stroke-gray-300';
  };

  const refreshTopology = async () => {
    setIsLoading(true);
    await fetchData();
  };

  const pingWanMonitors = async () => {
    try {
      const response = await fetch('/api/wan-monitors/ping-all', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to ping WAN monitors:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Network Topology</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Network className="h-8 w-8 mr-3" />
          <h1 className="text-3xl font-bold">Network Topology</h1>
        </div>
        <div className="flex space-x-2">
          <Button onClick={pingWanMonitors} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Ping WAN
          </Button>
          <Button onClick={refreshTopology} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Topology Visualization */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Network Diagram</CardTitle>
              <CardDescription>
                Visual representation of your network infrastructure including WAN monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-96 bg-gray-50 dark:bg-gray-900 rounded-lg border overflow-hidden">
                <svg width="100%" height="100%" className="absolute inset-0">
                  {/* Render links */}
                  {links.map((link, index) => {
                    const fromNode = nodes.find(n => n.id === link.from);
                    const toNode = nodes.find(n => n.id === link.to);
                    
                    if (!fromNode || !toNode) return null;
                    
                    return (
                      <g key={index}>
                        <line
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          className={`${getLinkColor(link)} stroke-2`}
                          strokeDasharray={link.type === 'wireless' ? '5,5' : 'none'}
                        />
                        {/* Link label */}
                        <text
                          x={(fromNode.x + toNode.x) / 2}
                          y={(fromNode.y + toNode.y) / 2 - 5}
                          className="text-xs fill-muted-foreground"
                          textAnchor="middle"
                        >
                          {link.type === 'wireless' && <tspan>📶</tspan>}
                          {link.type === 'wan' && <tspan>🌐</tspan>}
                          {link.type === 'ethernet' && <tspan>🔗</tspan>}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Render nodes */}
                {nodes.map((node) => {
                  const Icon = getNodeIcon(node);
                  const isSelected = selectedNode?.id === node.id;
                  
                  return (
                    <div
                      key={node.id}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${
                        isSelected ? 'z-10' : ''
                      }`}
                      style={{ left: node.x, top: node.y }}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className={`
                        relative p-3 rounded-full border-2 shadow-lg
                        ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 bg-white dark:bg-gray-800'}
                        hover:scale-110 transition-transform
                      `}>
                        <Icon className={`h-6 w-6 ${
                          node.status === 'online' ? 'text-green-600' : 
                          node.status === 'offline' ? 'text-red-600' : 'text-gray-600'
                        }`} />
                        
                        {/* Status indicator */}
                        <div className={`
                          absolute -top-1 -right-1 w-3 h-3 rounded-full
                          ${getNodeColor(node.status)}
                        `} />

                        {/* WAN monitor latency indicator */}
                        {node.type === 'wan_monitor' && node.latency && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                            {node.latency}ms
                          </div>
                        )}
                      </div>
                      
                      {/* Node label */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
                        <div className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs border shadow-sm whitespace-nowrap">
                          {node.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Device Details Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Node Details</CardTitle>
              <CardDescription>
                {selectedNode ? 'Selected node information' : 'Click on a node to view details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    {React.createElement(getNodeIcon(selectedNode), { className: "h-5 w-5" })}
                    <span className="font-medium">{selectedNode.label}</span>
                    <Badge variant={selectedNode.status === 'online' ? 'default' : 'secondary'}>
                      {selectedNode.status === 'online' ? (
                        <Wifi className="h-3 w-3 mr-1" />
                      ) : (
                        <WifiOff className="h-3 w-3 mr-1" />
                      )}
                      {selectedNode.status}
                    </Badge>
                  </div>

                  {selectedNode.device && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{selectedNode.device.type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Host:</span>
                        <span>{selectedNode.device.host}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Port:</span>
                        <span>{selectedNode.device.port}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Username:</span>
                        <span>{selectedNode.device.username}</span>
                      </div>
                      {selectedNode.device.last_sync && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Sync:</span>
                          <span>{new Date(selectedNode.device.last_sync).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedNode.wanMonitor && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Host:</span>
                        <span>{selectedNode.wanMonitor.host}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Description:</span>
                        <span>{selectedNode.wanMonitor.description || '-'}</span>
                      </div>
                      {selectedNode.wanMonitor.last_ping_latency && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Latency:</span>
                          <span className="text-green-600">
                            {selectedNode.wanMonitor.last_ping_latency}ms
                          </span>
                        </div>
                      )}
                      {selectedNode.wanMonitor.last_ping_time && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Ping:</span>
                          <span>{new Date(selectedNode.wanMonitor.last_ping_time).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Active:</span>
                        <span>{selectedNode.wanMonitor.is_active ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  )}

                  {selectedNode.type === 'internet' && (
                    <div className="text-sm text-muted-foreground">
                      Internet gateway connection point for your network infrastructure.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a node from the topology diagram to view its details.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Network Statistics */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Network Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Devices:</span>
                  <span className="font-medium">{devices.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Online Devices:</span>
                  <span className="font-medium text-green-600">
                    {devices.filter(d => d.is_online).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Offline Devices:</span>
                  <span className="font-medium text-red-600">
                    {devices.filter(d => !d.is_online).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">WAN Monitors:</span>
                  <span className="font-medium">{wanMonitors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">WAN Online:</span>
                  <span className="font-medium text-green-600">
                    {wanMonitors.filter(w => w.last_ping_success).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">WAN Offline:</span>
                  <span className="font-medium text-red-600">
                    {wanMonitors.filter(w => !w.last_ping_success).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Activity className="h-3 w-3" />
                  <span>WAN Monitor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-1 bg-blue-500"></div>
                  <span>WAN Connection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-1 bg-green-500"></div>
                  <span>Ethernet</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-1 bg-purple-500" style={{ background: 'repeating-linear-gradient(to right, #8b5cf6 0, #8b5cf6 3px, transparent 3px, transparent 6px)' }}></div>
                  <span>Wireless</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Online</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Offline</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
