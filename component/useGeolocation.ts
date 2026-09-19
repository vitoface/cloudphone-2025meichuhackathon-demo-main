// component/useGeolocation.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface GeolocationOptions {
  watch?: boolean;     // 是否持續追蹤座標變化
  autoFetch?: boolean; // 是否在元件載入時自動抓取一次定位
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const { watch = false, autoFetch = true } = options;

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  const handleError = useCallback((error: GeolocationPositionError) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setErrorMsg('未允許定位權限');
        break;
      case error.POSITION_UNAVAILABLE:
        setErrorMsg('無法取得目前位置');
        break;
      case error.TIMEOUT:
        setErrorMsg('定位請求逾時');
        break;
      default:
        setErrorMsg('發生未知錯誤');
        break;
    }
    setLoading(false);
  }, []);

  const fetchLocation = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setErrorMsg('');

      if (typeof window === 'undefined' || !navigator.geolocation) {
        const msg = '此裝置不支援定位功能';
        setErrorMsg(msg);
        setLoading(false);
        reject(new Error(msg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(coords);
          setLoading(false);
          resolve(coords);
        },
        (error) => {
          handleError(error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0, 
        }
      );
    });
  }, [handleError]);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    if (watch) {
      setLoading(true);
      setErrorMsg('');
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoading(false);
          setErrorMsg('');
        },
        handleError,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else if (autoFetch) {
      fetchLocation().catch(() => {});
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [watch, autoFetch, fetchLocation, handleError]);

  return { location, errorMsg, loading, fetchLocation };
}