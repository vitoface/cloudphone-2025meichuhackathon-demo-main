'use client';

import { useState, useEffect, useRef } from 'react';

export default function HomePage() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentZoom, setCurrentZoom] = useState<number>(15);

  // 用於掛載地圖 DOM 與儲存 Leaflet 物件實例
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // 1. 取得 GPS 定位
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

  // 2. 初始化 Leaflet 動態地圖
  useEffect(() => {
    if (!location || !mapContainerRef.current) return;

    let isMounted = true;

    // 動態載入 Leaflet，規避 SSR window 報錯
    import('leaflet').then((L) => {
      if (!isMounted) return;

      // 修正 Leaflet 預設 Marker 圖示在 Next.js 中的路徑缺失問題
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // 初始化 Map（禁用預設縮放按鈕與觸控拖曳以符合按鍵機純物理控制）
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [location.lat, location.lng],
          zoom: 15,
          zoomControl: false,
          dragging: false,
          touchZoom: false,
          doubleClickZoom: false,
          scrollWheelZoom: false,
        });

        // 串接 OpenStreetMap 圖層串流
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        // 釘選真實 GPS 定位紅點標記
        const marker = L.marker([location.lat, location.lng]).addTo(map);
        marker.bindPopup('您的目前位置');

        mapInstanceRef.current = map;
        // 確保 DOM 渲染完畢後 Leaflet 正確對齊容器尺寸
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
        markerRef.current = marker;

        map.on('zoomend', () => {
          setCurrentZoom(map.getZoom());
        });
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location]);

  // 3. 監聽實體按鍵控制地圖（縮放、平移與回中心）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // 像素平移距離（每次平移 40px，在 QVGA 240 寬度下移動約 1/6 螢幕）
      const panDistance = 40;

      // 縮放：[↑ / 1] 放大，[↓ / 3] 縮小
      if (e.key === 'ArrowUp' || e.key === '1') {
        e.preventDefault();
        map.zoomIn();
      } else if (e.key === 'ArrowDown' || e.key === '3') {
        e.preventDefault();
        map.zoomOut();
      }

      // 視野平移：[2] 上移、[5] 下移、[4] 左移、[6] 右移
      if (e.key === '2') {
        e.preventDefault();
        map.panBy([0, -panDistance], { animate: true });
      } else if (e.key === '5') {
        e.preventDefault();
        map.panBy([0, panDistance], { animate: true });
      } else if (e.key === '4') {
        e.preventDefault();
        map.panBy([-panDistance, 0], { animate: true });
      } else if (e.key === '6') {
        e.preventDefault();
        map.panBy([panDistance, 0], { animate: true });
      }

      // [0] 快速回到使用者 GPS 中心點
      if (e.key === '0') {
        e.preventDefault();
        if (location) {
          map.panTo([location.lat, location.lng], { animate: true });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location]);

  return (
    <main style={{ padding: '6px', textAlign: 'center', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#000000' }}>
        即時路況定位 (Leaflet)
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

      {location && (
        <div>
          {/* Leaflet 渲染容器（適配按鍵機 240x320 螢幕） */}
          <div
            ref={mapContainerRef}
            style={{
              width: '220px',
              height: '140px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              margin: '0 auto',
              position: 'relative', // 確保子圖磚以這個框框為基準
              overflow: 'hidden',   // 避免圖磚超出框線
              zIndex: 1,
            }}
          />

          {/* 按鍵指引提示 */}
          <div style={{ fontSize: '10px', color: '#374151', marginTop: '6px', lineHeight: '1.4' }}>
            <p><strong>[1/↑]</strong> 放大 | <strong>[3/↓]</strong> 縮小 (級別: {currentZoom})</p>
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