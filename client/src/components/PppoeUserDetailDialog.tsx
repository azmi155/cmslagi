import * as React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { PppoeUser } from '../types';
import { 
  User, 
  Globe, 
  MessageCircle, 
  Phone, 
  MapPin, 
  Package, 
  DollarSign,
  Calendar,
  Activity,
  HardDrive
} from 'lucide-react';

interface PppoeUserDetailDialogProps {
  user: PppoeUser;
  onClose: () => void;
  onEdit: (user: PppoeUser) => void;
}

export function PppoeUserDetailDialog({ user, onClose, onEdit }: PppoeUserDetailDialogProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const openWhatsApp = (phone: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const message = `Halo ${user.customer_name || user.contact_name}, kami dari layanan internet. Ada yang bisa kami bantu?`;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const callPhone = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Detail Pelanggan PPPoE
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informasi Pelanggan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nama Pelanggan</label>
                <p className="text-base font-medium">
                  {user.customer_name || user.contact_name || '-'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Username PPPoE</label>
                <p className="text-base font-mono bg-muted px-2 py-1 rounded">
                  {user.username}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                <p className="text-base font-mono">
                  {user.ip_address || '-'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div>
                  <Badge variant={user.disabled ? 'secondary' : 'default'}>
                    {user.disabled ? 'Nonaktif' : 'Aktif'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Alamat
              </label>
              <p className="text-base">
                {user.customer_address || '-'}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Informasi Kontak
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nomor Telepon</label>
                <div className="flex items-center space-x-2">
                  <p className="text-base">{user.contact_phone || '-'}</p>
                  {user.contact_phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => callPhone(user.contact_phone!)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                <div className="flex items-center space-x-2">
                  <p className="text-base">{user.contact_whatsapp || '-'}</p>
                  {user.contact_whatsapp && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openWhatsApp(user.contact_whatsapp!)}
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Service Package */}
          {user.package_name && (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Paket Layanan
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nama Paket</label>
                  <p className="text-base font-medium">{user.package_name}</p>
                  {user.package_description && (
                    <p className="text-sm text-muted-foreground">{user.package_description}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Harga</label>
                  <p className="text-base font-medium text-green-600">
                    {user.package_price ? formatCurrency(user.package_price) : '-'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bandwidth</label>
                  <p className="text-base">
                    {user.package_bandwidth_up && user.package_bandwidth_down 
                      ? `${user.package_bandwidth_up}/${user.package_bandwidth_down}`
                      : '-'
                    }
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Durasi</label>
                  <p className="text-base">
                    {user.package_duration_days ? `${user.package_duration_days} hari` : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Usage Statistics */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Statistik Penggunaan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <HardDrive className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">Data Masuk</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatBytes(user.bytes_in)}
                </p>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <HardDrive className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground">Data Keluar</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatBytes(user.bytes_out)}
                </p>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-muted-foreground">Waktu Online</p>
                <p className="text-lg font-semibold text-purple-600">
                  {formatUptime(user.uptime)}
                </p>
              </div>
            </div>
          </div>

          {/* Technical Information */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Informasi Teknis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Profile</label>
                <p className="text-base">{user.profile || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Service</label>
                <p className="text-base">{user.service || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Caller ID</label>
                <p className="text-base font-mono">{user.caller_id || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dibuat</label>
                <p className="text-base">{new Date(user.created_at).toLocaleDateString('id-ID')}</p>
              </div>
            </div>

            {user.comment && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Komentar</label>
                <p className="text-base">{user.comment}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
            <Button onClick={() => onEdit(user)}>
              Edit Pelanggan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
