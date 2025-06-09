import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BrandingSettings } from '../types';
import { Upload, Trash2, Image, Palette } from 'lucide-react';

export function Branding() {
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    company_name: '',
    company_description: '',
    primary_color: '#000000',
    secondary_color: '#ffffff'
  });

  useEffect(() => {
    fetchBranding();
  }, []);

  useEffect(() => {
    if (branding) {
      setFormData({
        company_name: branding.company_name || '',
        company_description: branding.company_description || '',
        primary_color: branding.primary_color || '#000000',
        secondary_color: branding.secondary_color || '#ffffff'
      });
    }
  }, [branding]);

  const fetchBranding = async () => {
    try {
      const response = await fetch('/api/branding');
      if (response.ok) {
        const data = await response.json();
        setBranding(data);
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage('Only image files are allowed');
      return;
    }

    setIsUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/branding/logo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setBranding(data);
        setMessage('Logo uploaded successfully');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Upload logo error:', error);
      setMessage('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to delete the logo?')) return;

    try {
      const response = await fetch('/api/branding/logo', {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setBranding(data);
        setMessage('Logo deleted successfully');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to delete logo');
      }
    } catch (error) {
      console.error('Delete logo error:', error);
      setMessage('Failed to delete logo');
    }
  };

  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage('');

    try {
      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setBranding(data);
        setMessage('Branding updated successfully');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to update branding');
      }
    } catch (error) {
      console.error('Update branding error:', error);
      setMessage('Failed to update branding');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setMessage('');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Branding</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Palette className="h-8 w-8 mr-3" />
        <h1 className="text-3xl font-bold">Branding Management</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('successfully') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Image className="h-5 w-5 mr-2" />
              Logo Management
            </CardTitle>
            <CardDescription>
              Upload and manage your company logo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {branding?.logo_path && (
              <div className="text-center">
                <img
                  src={branding.logo_path}
                  alt="Company Logo"
                  className="max-w-48 max-h-32 mx-auto rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteLogo}
                  className="mt-2"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Logo
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="logo">
                {branding?.logo_path ? 'Replace Logo' : 'Upload Logo'}
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => document.getElementById('logo')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Browse'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Update your company details and branding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateBranding} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Network Manager"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_description">Company Description</Label>
                <Textarea
                  id="company_description"
                  value={formData.company_description}
                  onChange={(e) => handleInputChange('company_description', e.target.value)}
                  placeholder="Network Infrastructure Management System"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? 'Updating...' : 'Update Branding'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            Preview how your branding will look
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center space-x-4">
              {branding?.logo_path && (
                <img
                  src={branding.logo_path}
                  alt="Logo Preview"
                  className="h-12 w-auto"
                />
              )}
              <div>
                <h2 
                  className="text-2xl font-bold"
                  style={{ color: formData.primary_color }}
                >
                  {formData.company_name || 'Network Manager'}
                </h2>
                <p className="text-muted-foreground">
                  {formData.company_description || 'Network Infrastructure Management System'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
