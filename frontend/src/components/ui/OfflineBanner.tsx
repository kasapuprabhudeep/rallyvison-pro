import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600/95 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg backdrop-blur-md animate-in slide-in-from-top duration-300">
        <WifiOff className="w-4 h-4 animate-bounce shrink-0" />
        <span>Court Connection Offline — Telemetry is operating in local mode until connection resumes.</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-cyan-600/95 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg backdrop-blur-md animate-in slide-in-from-top duration-300">
        <Wifi className="w-4 h-4 shrink-0" />
        <span>Connection Restored — Live optical sync active.</span>
      </div>
    );
  }

  return null;
};

