'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLocation = () => {
    setLoading(true);
    setErrorMsg('');

    // 檢查瀏覽器是否支援 Geolocation API
    if (!navigator.geolocation) {
      setErrorMsg('此裝置不支援定位功能');
      setLoading(false);
      return;
    }

    // 請求 GPS 定位
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (error) => {
        // 處理常見錯誤（例如：權限拒絕、無法抓取位置、逾時）
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
      },
      {
        enableHighAccuracy: true, // 嘗試使用高精度 GPS
        timeout: 10000,           // 10 秒逾時
        maximumAge: 0             // 不使用快取，取得當前最新位置
      }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return (
    <main style={{ padding: '8px', color: '#fff' }}>
      <h2 style={{ fontSize: '14px', marginBottom: '8px' }}>即時路況查詢</h2>

      {loading && <p style={{ fontSize: '12px' }}>正在取得 GPS 定位中...</p>}
      
      {errorMsg && (
        <div style={{ color: '#ff6b6b', fontSize: '12px' }}>
          <p>{errorMsg}</p>
          <p style={{ marginTop: '4px' }}>請按重試鍵重新整理</p>
        </div>
      )}

      {location && (
        <div style={{ fontSize: '12px' }}>
          <p>緯度：{location.lat.toFixed(4)}</p>
          <p>經度：{location.lng.toFixed(4)}</p>
          {/* 接下來可以在這裡傳入經緯度，呼叫路況 API */}
        </div>
      )}
    </main>
  );
}