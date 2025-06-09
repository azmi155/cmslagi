import * as React from 'react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { PppoeProfile } from '../types';

interface PppoeProfileFormProps {
  profile?: PppoeProfile | null;
  deviceId: number;
  onClose: () => void;
  onSave: () => void;
}

export function PppoeProfileForm({ profile, deviceId, onClose, onSave }: PppoeProfileFormProps) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    local_address: profile?.local_address || '',
    remote_address: profile?.remote_address || '',
    rate_limit: profile?.rate_limit || '',
    session_timeout: profile?.session_timeout || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = profile ? `/api/profiles/pppoe/${profile.id}` : '/api/profiles/pppoe';
      const method = profile ? 'PUT' : 'POST';

      const payload = profile 
        ? formData 
        : { ...formData, device_id: deviceId };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save PPPoE profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {profile ? 'Edit PPPoE Profile' : 'Add New PPPoE Profile'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Profile Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="pppoe-default"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate_limit">Rate Limit</Label>
            <Input
              id="rate_limit"
              value={formData.rate_limit}
              onChange={(e) => handleInputChange('rate_limit', e.target.value)}
              placeholder="2M/2M"
            />
            <p className="text-xs text-muted-foreground">
              Format: upload/download (e.g., 2M/2M, 10M/10M)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="local_address">Local Address</Label>
            <Input
              id="local_address"
              value={formData.local_address}
              onChange={(e) => handleInputChange('local_address', e.target.value)}
              placeholder="192.168.1.1"
            />
            <p className="text-xs text-muted-foreground">
              Server IP address for PPPoE connection
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remote_address">Remote Address</Label>
            <Input
              id="remote_address"
              value={formData.remote_address}
              onChange={(e) => handleInputChange('remote_address', e.target.value)}
              placeholder="192.168.1.2-192.168.1.100"
            />
            <p className="text-xs text-muted-foreground">
              IP pool for client addresses (range or single IP)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session_timeout">Session Timeout (seconds)</Label>
            <Input
              id="session_timeout"
              type="number"
              value={formData.session_timeout}
              onChange={(e) => handleInputChange('session_timeout', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              0 = No timeout
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (profile ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
