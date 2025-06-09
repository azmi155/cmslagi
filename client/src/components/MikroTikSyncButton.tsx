import * as React from 'react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface MikroTikSyncButtonProps {
  deviceId: number;
  deviceType: string;
  onSyncComplete?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showTooltip?: boolean;
}

export function MikroTikSyncButton({ 
  deviceId, 
  deviceType, 
  onSyncComplete,
  variant = 'outline',
  size = 'sm',
  showTooltip = true
}: MikroTikSyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<'success' | 'error' | null>(null);

  const handleSync = async () => {
    if (deviceType !== 'MikroTik') {
      return;
    }

    setIsLoading(true);
    setLastSyncResult(null);

    try {
      const response = await fetch(`/api/devices/${deviceId}/sync`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        setLastSyncResult('success');
        console.log('Device sync completed:', result);
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        setLastSyncResult('error');
        console.error('Device sync failed');
      }
    } catch (error) {
      setLastSyncResult('error');
      console.error('Device sync error:', error);
    } finally {
      setIsLoading(false);
      
      // Clear the result after 3 seconds
      setTimeout(() => {
        setLastSyncResult(null);
      }, 3000);
    }
  };

  const getIcon = () => {
    if (isLoading) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    if (lastSyncResult === 'success') {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    
    if (lastSyncResult === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    
    return <RefreshCw className="h-4 w-4" />;
  };

  const getButtonText = () => {
    if (isLoading) return 'Syncing...';
    if (lastSyncResult === 'success') return 'Synced';
    if (lastSyncResult === 'error') return 'Failed';
    return 'Sync';
  };

  const getTooltipText = () => {
    if (deviceType !== 'MikroTik') {
      return 'Sync is only available for MikroTik devices';
    }
    
    if (isLoading) return 'Connecting to MikroTik device...';
    if (lastSyncResult === 'success') return 'Successfully synced with device';
    if (lastSyncResult === 'error') return 'Failed to sync with device';
    return 'Sync data with MikroTik device';
  };

  const button = (
    <Button 
      onClick={handleSync} 
      disabled={isLoading || deviceType !== 'MikroTik'}
      variant={variant}
      size={size}
    >
      {getIcon()}
      <span className="ml-2">{getButtonText()}</span>
    </Button>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
