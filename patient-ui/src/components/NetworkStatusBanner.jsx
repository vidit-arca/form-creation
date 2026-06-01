import React from 'react';
import { useNetworkStatus } from '../utils/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';

export const NetworkStatusBanner = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) {
    // Optionally return a short-lived toast here instead of null
    return null; 
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-orange-500 text-white px-4 py-3 shadow-md flex items-center justify-center space-x-2">
      <WifiOff className="w-5 h-5" />
      <span className="font-semibold text-sm">
        ⚠️ Offline Mode: Your forms will be saved locally on this device and securely synced once you reconnect.
      </span>
    </div>
  );
};
