'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// 🌟 路徑改為 @/component/useGeolocation
import { useGeolocation } from '@/component/useGeolocation'; 

interface MapInfoItem {
  id: string | number;
  created_at: string;
  events: string | null;
  latitude: number;
  longtitude: number;
  description?: string;
}

const EVENT_CONFIG: Record<
  string,
  { label: string; prefix: string; color: string }
> = {
  car_crash: { label: '發生車禍', prefix: '[嚴重]', color: '#dc2626' },
  traffic_jam: { label: '嚴重塞車', prefix: '[提醒]', color: '#ea580c' },
  roadwork: { label: '道路施工', prefix: '[注意]', color: '#d97706' },
  unknown_danger: { label: '不明危險', prefix: '[危險]', color: '#e11d48' },
  natural_disaster: { label: '天災路況', prefix: '[警戒]', color: '#7c3aed' },
};

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `距離 ${Math.round(distanceKm * 1000)}m`;
  }
  return `距離 ${distanceKm.toFixed(1)}km`;
}

export default function ListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<(MapInfoItem & { distance?: number })[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  
  // 用於綁定中間的列表容器，以程式化方式控制捲動
  const scrollRef = useRef<HTMLDivElement>(null);

  const { location, errorMsg, loading: geoLoading } = useGeolocation({ autoFetch: true });

  // 監聽實體按鍵：2上 5下 0返回
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '0') {
        router.push('/');
      } else if (event.key === '2') {
        if (scrollRef.current) scrollRef.current.scrollBy({ top: -55, behavior: 'smooth' });
      } else if (event.key === '5') {
        if (scrollRef.current) scrollRef.current.scrollBy({ top: 55, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  async function fetchEvents(userLat?: number, userLng?: number) {
    setApiLoading(true);
    try {
      const params = new URLSearchParams();
      if (userLat !== undefined && userLng !== undefined) {
        params.set('latitude', userLat.toString());
        params.set('longtitude', userLng.toString());
      }

      const res = await fetch(`/api/mapinfo?${params.toString()}`, { 
        cache: 'no-store' 
      });
      
      if (!res.ok) throw new Error('Failed to fetch events');
      
      const data: MapInfoItem[] = await res.json();

      const processed = data
        .filter((item) => item.events && EVENT_CONFIG[item.events])
        .map((item) => {
          const dist =
            userLat !== undefined && userLng !== undefined
              ? calculateDistance(userLat, userLng, item.latitude, item.longtitude)
              : undefined;
          return { ...item, distance: dist };
        })
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

      setEvents(processed);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setApiLoading(false);
    }
  }

  useEffect(() => {
    if (geoLoading) return;
    if (location) {
      fetchEvents(location.lat, location.lng);
    } else if (errorMsg) {
      fetchEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, geoLoading, errorMsg]);

  const isPageLoading = geoLoading || (apiLoading && events.length === 0);

  return (
    <main
      style={{
        width: '100%',
        maxWidth: '240px',          // 最大寬度保護
        height: '100vh',            // 滿版高度
        maxHeight: '320px',         // 限制在功能機的最大高度內
        margin: '0 auto',
        overflow: 'hidden',         // 隱藏整頁的捲動，避免雙層捲軸
        boxSizing: 'border-box',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',    // 使用 flex 讓中間容器自動延展
        alignItems: 'center',
        backgroundColor: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      {/* 頂部狀態與提示區 */}
      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '2px', color: '#000000' }}>
        周遭路況列表
      </h2>
      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>
        [2]上滑 [5]下滑 | [0]返回
      </div>

      {/* 模擬手機大小的顯示容器 (列表區) */}
      <div
        ref={scrollRef}
        style={{
          width: '210px',           // 與圖二相同的 210px 寬度
          flex: 1,                  // 自動填滿標題與底部按鈕之間的剩餘空間
          overflowY: 'hidden',      // 隱藏預設捲軸，靠 2/5 按鍵程式化滑動
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          backgroundColor: '#f9fafb',
          padding: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {isPageLoading ? (
          <div style={{ fontSize: '12px', color: '#6b7280', padding: '16px', textAlign: 'center' }}>
            {geoLoading ? '定位中...' : '載入路況中...'}
          </div>
        ) : events.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#6b7280', padding: '16px', textAlign: 'center' }}>
            周遭暫無突發路況
          </div>
        ) : (
          events.map((item) => {
            const config = EVENT_CONFIG[item.events || ''] || {
              label: '一般事件',
              prefix: '[提醒]',
              color: '#374151',
            };

            return (
              <div
                key={item.id}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '6px 8px',
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb', // 內層卡片加一點邊框
                  borderRadius: '4px',
                  textAlign: 'left',
                  flexShrink: 0, // 確保卡片不會因為 flex 空間不夠而被擠壓變形
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: config.color, fontWeight: 'bold' }}>
                    {config.prefix} {config.label}
                  </span>
                  {item.distance !== undefined && (
                    <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: '#e5e7eb', color: '#374151', padding: '2px 4px', borderRadius: '3px' }}>
                      {formatDistance(item.distance)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#4b5563' }}>
                  {item.description || `座標: ${item.latitude.toFixed(3)}, ${item.longtitude.toFixed(3)}`}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底部取消按鈕 */}
      <div
        onClick={() => router.push('/')}
        style={{
          cursor: 'pointer',
          marginTop: '6px',
          marginBottom: '2px',
          width: '210px',           // 與上方容器寬度切齊
          boxSizing: 'border-box',
          padding: '4px 8px',
          backgroundColor: '#fee2e2',
          border: '1px solid #f87171',
          borderRadius: '4px',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#dc2626', color: '#ffffff', padding: '2px 6px', borderRadius: '3px', marginRight: '10px' }}>
          [ 0 ]
        </span>
        <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: 'bold' }}>
          返回地圖
        </span>
      </div>
    </main>
  );
}