import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Device, PppoeUser } from '../types';
import { Plus, Users, Edit, Trash2, Phone, Eye, MessageCircle, RefreshCw, Download } from 'lucide-react';
import { PppoeUserDetailDialog } from '../components/PppoeUserDetailDialog';

export function PppoeUsers() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<PppoeUser[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<PppoeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSync, setIsSync] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      fetchUsers(parseInt(selectedDevice));
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

  const fetchUsers = async (deviceId: number) => {
    try {
      const response = await fetch(`/api/users/pppoe/${deviceId}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSyncUsers = async () => {
    if (!selectedDevice) return;

    setIsSync(true);
    setMessage('');

    try {
      const response = await fetch(`/api/profile-management/pppoe/${selectedDevice}/sync-users`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        await fetchUsers(parseInt(selectedDevice));
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to sync PPPoE users');
      }
    } catch (error) {
      console.error('Sync PPPoE users error:', error);
      setMessage('Failed to sync PPPoE users');
    } finally {
      setIsSync(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      try {
        const response = await fetch(`/api/users/pppoe/${userId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchUsers(parseInt(selectedDevice));
          setMessage('User berhasil dihapus');
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
        setMessage('Gagal menghapus user');
      }
    }
  };

  const handleViewUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/pppoe/detail/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setSelectedUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const openWhatsApp = (phone: string, customerName?: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const message = `Halo ${customerName || 'Pelanggan'}, kami dari layanan internet. Ada yang bisa kami bantu?`;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Pengguna PPPoE</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const selectedDeviceData = devices.find(d => d.id.toString() === selectedDevice);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pengguna PPPoE</h1>
        <Button disabled={!selectedDevice}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pengguna
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('berhasil') || message.includes('Synchronized') 
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Manajemen Pengguna PPPoE
          </CardTitle>
          <CardDescription>
            Kelola pengguna PPPoE untuk koneksi dial-up dan layanan internet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Pilih Perangkat:</label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Pilih perangkat" />
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

            {selectedDevice && selectedDeviceData?.type === 'MikroTik' && (
              <div className="flex space-x-2">
                <Button
                  onClick={() => fetchUsers(parseInt(selectedDevice))}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={handleSyncUsers}
                  disabled={isSync}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isSync ? 'Syncing...' : 'Sinkron dari Perangkat'}
                </Button>
              </div>
            )}
          </div>

          {selectedDevice && (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Pelanggan</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Paket Layanan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.customer_name || user.contact_name || '-'}
                          </div>
                          {user.customer_address && (
                            <div className="text-xs text-muted-foreground truncate max-w-32">
                              {user.customer_address}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{user.username}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {user.ip_address || '-'}
                      </TableCell>
                      <TableCell>
                        {user.package_name ? (
                          <div>
                            <div className="font-medium">{user.package_name}</div>
                            {user.package_price && (
                              <div className="text-xs text-green-600">
                                {formatCurrency(user.package_price)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.disabled ? 'secondary' : 'default'}>
                          {user.disabled ? 'Nonaktif' : 'Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {user.contact_phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`tel:${user.contact_phone}`, '_self');
                              }}
                              title="Telepon"
                            >
                              <Phone className="h-3 w-3" />
                            </Button>
                          )}
                          {user.contact_whatsapp && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openWhatsApp(user.contact_whatsapp!, user.customer_name || user.contact_name);
                              }}
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              title="WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewUser(user.id)}
                            title="Lihat Detail"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" title="Edit">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Hapus"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedDeviceData?.type === 'MikroTik' 
                    ? 'Tidak ada pengguna PPPoE. Klik "Sinkron dari Perangkat" untuk memuat pengguna dari router MikroTik.'
                    : 'Tidak ada pengguna PPPoE yang ditemukan untuk perangkat ini.'
                  }
                </div>
              )}
            </div>
          )}

          {selectedDeviceData?.type === 'MikroTik' && (
            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
              <strong>Integrasi MikroTik:</strong> Perangkat ini mendukung sinkronisasi pengguna real-time. 
              Gunakan "Sinkron dari Perangkat" untuk mengimpor semua pengguna yang ada dari router, 
              atau tambahkan pengguna di sini dan mereka dapat didorong ke perangkat.
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      {selectedUser && (
        <PppoeUserDetailDialog
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onEdit={(user) => {
            // TODO: Implement edit functionality
            console.log('Edit user:', user);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
