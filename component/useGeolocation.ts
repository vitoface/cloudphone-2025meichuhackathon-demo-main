// component/useGeolocation.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

interface GeolocationOptions {
  autoFetch?: boolean;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const { autoFetch = true } = options;

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 新增：讓外部（例如地圖頁）可以手動更新精確位置，並跨頁面儲存
  const updateLocation = useCallback((lat: number, lng: number) => {
    const coords = { lat, lng };
    setLocation(coords);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user_precise_lat', lat.toString());
      sessionStorage.setItem('user_precise_lng', lng.toString());
    }
  }, []);

  const fetchLocation = useCallback(async (): Promise<{ lat: number; lng: number }> => {
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. 先檢查 sessionStorage 是否已經有使用者手動校正過的位置
      if (typeof window !== 'undefined') {
        const savedLat = sessionStorage.getItem('user_precise_lat');
        const savedLng = sessionStorage.getItem('user_precise_lng');
        if (savedLat && savedLng) {
          const coords = { lat: parseFloat(savedLat), lng: parseFloat(savedLng) };
          setLocation(coords);
          setLoading(false);
          return coords; // 直接回傳記憶的精確位置
        }
      }

      // 2. 如果沒有記憶位置，才呼叫 IP API 取得大致位置
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('無法連接至 IP 定位服務');
      
      const data = await response.json();
      if (data.error) throw new Error(data.reason || 'IP 定位服務發生錯誤');
      if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
        throw new Error('無法解析 IP 位置資訊');
      }

      const coords = { lat: data.latitude, lng: data.longitude };

      // 將初次取得的 IP 位置也存入 sessionStorage 作為基準
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('user_precise_lat', coords.lat.toString());
        sessionStorage.setItem('user_precise_lng', coords.lng.toString());
      }

      setLocation(coords);
      return coords;
    } catch (error: any) {
      const msg = error.message || '發生未知錯誤';
      setErrorMsg(msg);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchLocation().catch(() => {});
    }
  }, [autoFetch, fetchLocation]);

  // 將 updateLocation 匯出，讓 page 檔可以呼叫
  return { location, errorMsg, loading, fetchLocation, updateLocation };
}