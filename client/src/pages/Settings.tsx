import * as React from 'react';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Settings as SettingsIcon, Lock, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Settings() {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('New passwords do not match');
      setIsChangingPassword(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage('New password must be at least 6 characters long');
      setIsChangingPassword(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        setPasswordMessage('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const error = await response.json();
        setPasswordMessage(error.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      setPasswordMessage('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
    setPasswordMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <SettingsIcon className="h-8 w-8 mr-3" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              User Information
            </CardTitle>
            <CardDescription>
              Your account details and information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={user?.username || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={user?.role || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Input value="Network Administrator" disabled />
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your account password for security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                  required
                />
              </div>

              {passwordMessage && (
                <p className={`text-sm ${
                  passwordMessage.includes('successfully') 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {passwordMessage}
                </p>
              )}

              <Button 
                type="submit" 
                disabled={isChangingPassword}
                className="w-full"
              >
                {isChangingPassword ? 'Changing Password...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Network Infrastructure Management System details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Version</Label>
              <p className="text-sm text-muted-foreground">1.0.0</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Environment</Label>
              <p className="text-sm text-muted-foreground">
                {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Features</Label>
              <p className="text-sm text-muted-foreground">
                MikroTik Integration, User Management, Monitoring
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Database</Label>
              <p className="text-sm text-muted-foreground">SQLite</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Session Management</Label>
              <p className="text-sm text-muted-foreground">Express Session</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Authentication</Label>
              <p className="text-sm text-muted-foreground">bcrypt + Sessions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardHeader>
          <CardTitle className="text-orange-800 dark:text-orange-200">
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-700 dark:text-orange-300">
          <ul className="space-y-2 text-sm">
            <li>• Change default passwords on all network devices</li>
            <li>• Use strong passwords with at least 12 characters</li>
            <li>• Enable two-factor authentication where possible</li>
            <li>• Regularly update device firmware and software</li>
            <li>• Monitor user access and session activity</li>
            <li>• Backup configuration and user data regularly</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
