'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MapInfoItem {
  id: string | number;
  created_at: string;
  events: string | null;
  latitude: number;
  longtitude: number;
  description?: string;
}

// 對應 route.ts 中定義的事件型別與樣式配置
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

// 計算兩點經緯度的直線距離 (km)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // 地球半徑 (km)
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
    return `前方 ${Math.round(distanceKm * 1000)}m`;
  }
  return `前方 ${distanceKm.toFixed(1)}km`;
}

export default function ListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<
    (MapInfoItem & { distance?: number })[]
  >([]);
  const [loading, setLoading] = useState(true);

  // 監聽實體按鍵：按 0 返回主畫面
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '0') {
        router.push('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  // Fetch API 資料
  useEffect(() => {
    async function fetchEvents(userLat?: number, userLng?: number) {
      setLoading(true);
      try {
        // 若有取得定位，帶上參數（注意 route 命名為 longtitude）
        const params = new URLSearchParams();
        if (userLat !== undefined && userLng !== undefined) {
          params.set('latitude', userLat.toString());
          params.set('longtitude', userLng.toString());
        }

        const res = await fetch(`/api/mapinfo?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch events');
        
        const data: MapInfoItem[] = await res.json();

        // 排除無效事件並計算相對距離
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
        setLoading(false);
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchEvents(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // 若無法取得定位則抓取全量事件
          fetchEvents();
        }
      );
    } else {
      fetchEvents();
    }
  }, []);

  return (
    <main
      style={{
        padding: '6px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
      }}
    >
      <h2
        style={{
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '4px',
          color: '#000000',
        }}
      >
        周遭路況列表
      </h2>
      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '12px' }}>
        按 [0] 返回地圖
      </div>

      {/* 清單區 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {loading ? (
          <div style={{ fontSize: '12px', color: '#6b7280', padding: '16px' }}>
            載入中...
          </div>
        ) : events.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#6b7280', padding: '16px' }}>
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
                  width: '220px',
                  padding: '6px 8px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      color: config.color,
                      fontWeight: 'bold',
                    }}
                  >
                    {config.prefix} {config.label}
                  </span>
                  {item.distance !== undefined && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        padding: '2px 4px',
                        borderRadius: '3px',
                      }}
                    >
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
          marginTop: '12px',
          width: '220px',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '6px 8px',
          backgroundColor: '#fee2e2',
          border: '1px solid #f87171',
          borderRadius: '4px',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            padding: '2px 6px',
            borderRadius: '3px',
            marginRight: '10px',
          }}
        >
          [ 0 ]
        </span>
        <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 'bold' }}>
          返回地圖
        </span>
      </div>
    </main>
  );
}