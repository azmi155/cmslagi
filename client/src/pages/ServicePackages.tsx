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
import { ServicePackage } from '../types';
import { Plus, Package, Edit, Trash2, DollarSign } from 'lucide-react';

export function ServicePackages() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    bandwidth_up: '',
    bandwidth_down: '',
    duration_days: '30',
    is_active: true
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/service-packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error('Failed to fetch service packages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      setMessage('Nama paket dan harga wajib diisi');
      return;
    }

    try {
      const url = editingPackage ? `/api/service-packages/${editingPackage.id}` : '/api/service-packages';
      const method = editingPackage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0
        }),
      });

      if (response.ok) {
        await fetchPackages();
        setShowForm(false);
        setEditingPackage(null);
        setFormData({
          name: '',
          description: '',
          price: '',
          bandwidth_up: '',
          bandwidth_down: '',
          duration_days: '30',
          is_active: true
        });
        setMessage(`Paket layanan berhasil ${editingPackage ? 'diupdate' : 'ditambahkan'}`);
      } else {
        const error = await response.json();
        setMessage(error.error || 'Gagal menyimpan paket layanan');
      }
    } catch (error) {
      console.error('Failed to save service package:', error);
      setMessage('Gagal menyimpan paket layanan');
    }
  };

  const handleEdit = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price.toString(),
      bandwidth_up: pkg.bandwidth_up || '',
      bandwidth_down: pkg.bandwidth_down || '',
      duration_days: pkg.duration_days.toString(),
      is_active: pkg.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (packageId: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus paket layanan ini?')) {
      try {
        const response = await fetch(`/api/service-packages/${packageId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchPackages();
          setMessage('Paket layanan berhasil dihapus');
        } else {
          const error = await response.json();
          setMessage(error.error || 'Gagal menghapus paket layanan');
        }
      } catch (error) {
        console.error('Failed to delete service package:', error);
        setMessage('Gagal menghapus paket layanan');
      }
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setMessage('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Paket Layanan</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Package className="h-8 w-8 mr-3" />
          <h1 className="text-3xl font-bold">Paket Layanan</h1>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Paket
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('berhasil') 
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paket</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
            <p className="text-xs text-muted-foreground">
              {packages.filter(p => p.is_active).length} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paket Aktif</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {packages.filter(p => p.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Tersedia untuk pelanggan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Harga Terendah</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {packages.length > 0 ? formatCurrency(Math.min(...packages.filter(p => p.is_active).map(p => p.price))) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Paket termurah
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Harga Tertinggi</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {packages.length > 0 ? formatCurrency(Math.max(...packages.filter(p => p.is_active).map(p => p.price))) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Paket termahal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Paket Layanan</CardTitle>
          <CardDescription>
            Kelola paket layanan internet untuk pelanggan PPPoE
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Paket</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Bandwidth</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{pkg.name}</div>
                      {pkg.description && (
                        <div className="text-sm text-muted-foreground">
                          {pkg.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    {formatCurrency(pkg.price)}
                  </TableCell>
                  <TableCell>
                    {pkg.bandwidth_up && pkg.bandwidth_down 
                      ? `${pkg.bandwidth_up}/${pkg.bandwidth_down}`
                      : '-'
                    }
                  </TableCell>
                  <TableCell>{pkg.duration_days} hari</TableCell>
                  <TableCell>
                    <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                      {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(pkg.created_at).toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(pkg)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(pkg.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {packages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada paket layanan. Klik "Tambah Paket" untuk membuat paket pertama.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Package Dialog */}
      {showForm && (
        <Dialog open={true} onOpenChange={() => {
          setShowForm(false);
          setEditingPackage(null);
          setFormData({
            name: '',
            description: '',
            price: '',
            bandwidth_up: '',
            bandwidth_down: '',
            duration_days: '30',
            is_active: true
          });
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? 'Edit Paket Layanan' : 'Tambah Paket Layanan'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Paket *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Premium 20Mbps"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Paket internet premium untuk streaming dan gaming"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga (IDR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="250000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_days">Durasi (Hari)</Label>
                  <Input
                    id="duration_days"
                    type="number"
                    min="1"
                    value={formData.duration_days}
                    onChange={(e) => handleInputChange('duration_days', e.target.value)}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bandwidth_up">Bandwidth Upload</Label>
                  <Input
                    id="bandwidth_up"
                    value={formData.bandwidth_up}
                    onChange={(e) => handleInputChange('bandwidth_up', e.target.value)}
                    placeholder="20M"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bandwidth_down">Bandwidth Download</Label>
                  <Input
                    id="bandwidth_down"
                    value={formData.bandwidth_down}
                    onChange={(e) => handleInputChange('bandwidth_down', e.target.value)}
                    placeholder="20M"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Paket Aktif</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingPackage(null);
                  }}
                >
                  Batal
                </Button>
                <Button type="submit">
                  {editingPackage ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
