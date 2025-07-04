import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Device, HotspotProfile, PppoeProfile } from '../types';
import { Download, Trash2, Wifi, Users, Plus, Edit } from 'lucide-react';
import { HotspotProfileForm } from '../components/HotspotProfileForm';
import { PppoeProfileForm } from '../components/PppoeProfileForm';

export function ProfileManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [hotspotProfiles, setHotspotProfiles] = useState<HotspotProfile[]>([]);
  const [pppoeProfiles, setPppoeProfiles] = useState<PppoeProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [message, setMessage] = useState('');
  
  // Form states
  const [showHotspotForm, setShowHotspotForm] = useState(false);
  const [showPppoeForm, setShowPppoeForm] = useState(false);
  const [editingHotspotProfile, setEditingHotspotProfile] = useState<HotspotProfile | null>(null);
  const [editingPppoeProfile, setEditingPppoeProfile] = useState<PppoeProfile | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      fetchProfiles(parseInt(selectedDevice));
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

  const fetchProfiles = async (deviceId: number) => {
    try {
      // Fetch hotspot profiles
      const hotspotResponse = await fetch(`/api/profiles/hotspot/${deviceId}`);
      if (hotspotResponse.ok) {
        const hotspotData = await hotspotResponse.json();
        setHotspotProfiles(hotspotData);
      }

      // Fetch PPPoE profiles
      const pppoeResponse = await fetch(`/api/profiles/pppoe/${deviceId}`);
      if (pppoeResponse.ok) {
        const pppoeData = await pppoeResponse.json();
        setPppoeProfiles(pppoeData);
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  const loadHotspotProfiles = async () => {
    if (!selectedDevice) return;

    setIsLoadingProfiles(true);
    setMessage('');

    try {
      const response = await fetch(`/api/profile-management/hotspot/${selectedDevice}/load`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        await fetchProfiles(parseInt(selectedDevice));
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to load hotspot profiles');
      }
    } catch (error) {
      console.error('Load hotspot profiles error:', error);
      setMessage('Failed to load hotspot profiles');
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const loadPppoeProfiles = async () => {
    if (!selectedDevice) return;

    setIsLoadingProfiles(true);
    setMessage('');

    try {
      const response = await fetch(`/api/profile-management/pppoe/${selectedDevice}/load`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        await fetchProfiles(parseInt(selectedDevice));
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to load PPPoE profiles');
      }
    } catch (error) {
      console.error('Load PPPoE profiles error:', error);
      setMessage('Failed to load PPPoE profiles');
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const deleteHotspotProfile = async (profileId: number) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      const response = await fetch(`/api/profiles/hotspot/${profileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProfiles(parseInt(selectedDevice));
        setMessage('Hotspot profile deleted successfully');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to delete hotspot profile');
      }
    } catch (error) {
      console.error('Delete hotspot profile error:', error);
      setMessage('Failed to delete hotspot profile');
    }
  };

  const deletePppoeProfile = async (profileId: number) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      const response = await fetch(`/api/profiles/pppoe/${profileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProfiles(parseInt(selectedDevice));
        setMessage('PPPoE profile deleted successfully');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to delete PPPoE profile');
      }
    } catch (error) {
      console.error('Delete PPPoE profile error:', error);
      setMessage('Failed to delete PPPoE profile');
    }
  };

  const handleEditHotspotProfile = (profile: HotspotProfile) => {
    setEditingHotspotProfile(profile);
    setShowHotspotForm(true);
  };

  const handleEditPppoeProfile = (profile: PppoeProfile) => {
    setEditingPppoeProfile(profile);
    setShowPppoeForm(true);
  };

  const handleHotspotFormClose = () => {
    setShowHotspotForm(false);
    setEditingHotspotProfile(null);
  };

  const handlePppoeFormClose = () => {
    setShowPppoeForm(false);
    setEditingPppoeProfile(null);
  };

  const handleProfileSave = async () => {
    await fetchProfiles(parseInt(selectedDevice));
    setMessage('Profile saved successfully');
  };

  const formatTimeout = (seconds: number | null) => {
    if (!seconds) return 'No limit';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Profile Management</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profile Management</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('successfully') || message.includes('Loaded') 
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

      {/* Device Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Device Selection</CardTitle>
          <CardDescription>
            Select a device to manage its profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {selectedDevice && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Management</CardTitle>
            <CardDescription>
              Manage user profiles for different connection types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hotspot" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="hotspot" className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Hotspot Profiles
                </TabsTrigger>
                <TabsTrigger value="pppoe" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  PPPoE Profiles
                </TabsTrigger>
              </TabsList>

              {/* Hotspot Profiles Tab */}
              <TabsContent value="hotspot" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Hotspot User Profiles</h3>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowHotspotForm(true)}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Profile
                    </Button>
                    <Button
                      onClick={loadHotspotProfiles}
                      disabled={isLoadingProfiles}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isLoadingProfiles ? 'Loading...' : 'Load from Device'}
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profile Name</TableHead>
                      <TableHead>Rate Limit</TableHead>
                      <TableHead>Session Timeout</TableHead>
                      <TableHead>Shared Users</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotspotProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.name}</TableCell>
                        <TableCell>{profile.rate_limit || '-'}</TableCell>
                        <TableCell>{formatTimeout(profile.session_timeout)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{profile.shared_users}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(profile.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditHotspotProfile(profile)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteHotspotProfile(profile.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {hotspotProfiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hotspot profiles found. Click "Add Profile" or "Load from Device" to get started.
                  </div>
                )}
              </TabsContent>

              {/* PPPoE Profiles Tab */}
              <TabsContent value="pppoe" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">PPPoE User Profiles</h3>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowPppoeForm(true)}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Profile
                    </Button>
                    <Button
                      onClick={loadPppoeProfiles}
                      disabled={isLoadingProfiles}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isLoadingProfiles ? 'Loading...' : 'Load from Device'}
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profile Name</TableHead>
                      <TableHead>Rate Limit</TableHead>
                      <TableHead>Local Address</TableHead>
                      <TableHead>Remote Address</TableHead>
                      <TableHead>Session Timeout</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pppoeProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.name}</TableCell>
                        <TableCell>{profile.rate_limit || '-'}</TableCell>
                        <TableCell>{profile.local_address || '-'}</TableCell>
                        <TableCell className="max-w-32 truncate">
                          {profile.remote_address || '-'}
                        </TableCell>
                        <TableCell>{formatTimeout(profile.session_timeout)}</TableCell>
                        <TableCell>
                          {new Date(profile.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPppoeProfile(profile)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deletePppoeProfile(profile.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {pppoeProfiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No PPPoE profiles found. Click "Add Profile" or "Load from Device" to get started.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Forms */}
      {showHotspotForm && (
        <HotspotProfileForm
          profile={editingHotspotProfile}
          deviceId={parseInt(selectedDevice)}
          onClose={handleHotspotFormClose}
          onSave={handleProfileSave}
        />
      )}

      {showPppoeForm && (
        <PppoeProfileForm
          profile={editingPppoeProfile}
          deviceId={parseInt(selectedDevice)}
          onClose={handlePppoeFormClose}
          onSave={handleProfileSave}
        />
      )}
    </div>
  );
}
