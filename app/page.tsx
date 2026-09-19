'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  // 使用者真實 GPS 定位 (固定 Marker 用)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  // 地圖視野中心點 (按鍵 2, 4, 5, 6 平移用)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  // 縮放級別 (10 ~ 19)
  const [zoom, setZoom] = useState<number>(15);

  const GEOAPIFY_API_KEY = '912286ec590d4b4daa1d0f4a22f38420';

  const fetchLocation = () => {
    setLoading(true);
    setErrorMsg('');

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrorMsg('此裝置不支援定位功能');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(coords);
        setMapCenter(coords); // 初始化時地圖中心等於使用者所在位置
        setLoading(false);
      },
      (error) => {
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
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  // 監聽實體按鍵操作
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 根據當前縮放層級計算平移步長（越放大，經緯度變化量越細緻）
      const step = 0.0003 * Math.pow(2, 15 - zoom);

      // 1. 縮放控制：[↑ / 1] 放大，[↓ / 3] 縮小
      if (e.key === 'ArrowUp' || e.key === '1') {
        e.preventDefault();
        setZoom((prev) => Math.min(prev + 1, 19));
      } else if (e.key === 'ArrowDown' || e.key === '3') {
        e.preventDefault();
        setZoom((prev) => Math.max(prev - 1, 10));
      }

      // 2. 地圖視野移動：[2] 上移、[5] 下移、[4] 左移、[6] 右移
      if (e.key === '2') {
        e.preventDefault();
        setMapCenter((prev) => (prev ? { ...prev, lat: prev.lat + step } : null));
      } else if (e.key === '5') {
        e.preventDefault();
        setMapCenter((prev) => (prev ? { ...prev, lat: prev.lat - step } : null));
      } else if (e.key === '4') {
        e.preventDefault();
        setMapCenter((prev) => (prev ? { ...prev, lng: prev.lng - step } : null));
      } else if (e.key === '6') {
        e.preventDefault();
        setMapCenter((prev) => (prev ? { ...prev, lng: prev.lng + step } : null));
      }

      // 3. 快捷重設中心：按 [0] 快速回到使用者當前 GPS 座標
      if (e.key === '0') {
        e.preventDefault();
        if (location) setMapCenter(location);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom, location]);

  // center 帶入動態平移的 mapCenter，marker 依舊釘在真實的 location
  const mapImageUrl = mapCenter && location
    ? `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=220&height=130&center=lonlat:${mapCenter.lng},${mapCenter.lat}&zoom=${zoom}&marker=lonlat:${location.lng},${location.lat};color:%23ff0000;size:medium&apiKey=${GEOAPIFY_API_KEY}`
    : '';

  return (
    <main style={{ padding: '6px', textAlign: 'center', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#000000' }}>
        即時路況定位
      </h2>

      {loading && <p style={{ fontSize: '12px', color: '#333333' }}>正在取得 GPS 定位中...</p>}

      {errorMsg && (
        <div style={{ color: '#dc2626', fontSize: '12px' }}>
          <p>{errorMsg}</p>
          <button
            onClick={fetchLocation}
            style={{
              marginTop: '8px',
              padding: '4px 10px',
              fontSize: '12px',
              backgroundColor: '#e5e7eb',
              color: '#000000',
              border: '1px solid #9ca3af',
              borderRadius: '4px',
            }}
          >
            重新整理定位
          </button>
        </div>
      )}

      {location && mapCenter && (
        <div>
          <img
            src={mapImageUrl}
            alt="即時路況街道地圖"
            style={{
              width: '220px',
              height: '130px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              display: 'block',
              margin: '0 auto',
            }}
          />

          {/* 操作指引（專為 240x320 小螢幕排版優化） */}
          <div style={{ fontSize: '10px', color: '#374151', marginTop: '6px', lineHeight: '1.4' }}>
            <p><strong>[1/↑]</strong> 放大 | <strong>[3/↓]</strong> 縮小 (級別: {zoom})</p>
            <p><strong>[2/4/5/6]</strong> 上左下右移 | <strong>[0]</strong> 回中心</p>
          </div>

          <div style={{ fontSize: '11px', marginTop: '4px', color: '#000000', lineHeight: '1.3' }}>
            <p>目前座標：{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
          </div>
        </div>
      )}
    </main>
  );
}