import * as React from 'react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { HotspotProfile } from '../types';

interface HotspotProfileFormProps {
  profile?: HotspotProfile | null;
  deviceId: number;
  onClose: () => void;
  onSave: () => void;
}

export function HotspotProfileForm({ profile, deviceId, onClose, onSave }: HotspotProfileFormProps) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    rate_limit: profile?.rate_limit || '',
    session_timeout: profile?.session_timeout || '',
    shared_users: profile?.shared_users || 1,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = profile ? `/api/profiles/hotspot/${profile.id}` : '/api/profiles/hotspot';
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
      console.error('Failed to save hotspot profile:', error);
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
            {profile ? 'Edit Hotspot Profile' : 'Add New Hotspot Profile'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Profile Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="default"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate_limit">Rate Limit</Label>
            <Input
              id="rate_limit"
              value={formData.rate_limit}
              onChange={(e) => handleInputChange('rate_limit', e.target.value)}
              placeholder="1M/1M"
            />
            <p className="text-xs text-muted-foreground">
              Format: upload/download (e.g., 1M/1M, 512k/512k)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session_timeout">Session Timeout (seconds)</Label>
            <Input
              id="session_timeout"
              type="number"
              value={formData.session_timeout}
              onChange={(e) => handleInputChange('session_timeout', parseInt(e.target.value) || 0)}
              placeholder="3600"
            />
            <p className="text-xs text-muted-foreground">
              0 = No timeout, 3600 = 1 hour
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shared_users">Shared Users</Label>
            <Input
              id="shared_users"
              type="number"
              min="1"
              value={formData.shared_users}
              onChange={(e) => handleInputChange('shared_users', parseInt(e.target.value) || 1)}
              placeholder="1"
              required
            />
            <p className="text-xs text-muted-foreground">
              Number of concurrent logins allowed
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
