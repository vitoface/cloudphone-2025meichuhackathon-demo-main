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

  // 新增 useRef 用來綁定需要滾動的容器
  const scrollRef = useRef<HTMLElement>(null);

  const { location, errorMsg, loading: geoLoading } = useGeolocation({ autoFetch: true });

  // 監聽實體按鍵：按 0 返回主畫面
  //擴充實體按鍵監聽：加入 2(上) 與 5(下)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '0') {
        router.push('/');
      } else if (event.key === '2') {
        // 向上滑動 60px
        if (scrollRef.current) {
          scrollRef.current.scrollBy({ top: -60, behavior: 'smooth' });
        }
      } else if (event.key === '5') {
        // 向下滑動 60px
        if (scrollRef.current) {
          scrollRef.current.scrollBy({ top: 60, behavior: 'smooth' });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  // 定義抓取 API 的函數
  async function fetchEvents(userLat?: number, userLng?: number) {
    setApiLoading(true);
    try {
      const params = new URLSearchParams();
      if (userLat !== undefined && userLng !== undefined) {
        params.set('latitude', userLat.toString());
        params.set('longtitude', userLng.toString());
      }

      // 🚨 解決延遲更新的關鍵：加上 cache: 'no-store'，強制每次抓取最新資料 🚨
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

  // 整合 API 呼叫與 Geolocation 的結果
  useEffect(() => {
    // 如果定位還在載入中，先不要打 API
    if (geoLoading) return;

    // 如果成功取得座標，帶座標去查詢；如果發生錯誤 (例如拒絕授權)，就不帶座標查詢
    if (location) {
      fetchEvents(location.lat, location.lng);
    } else if (errorMsg) {
      fetchEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, geoLoading, errorMsg]);

  // 畫面是否處於載入狀態 (定位中 或 API請求中)
  const isPageLoading = geoLoading || (apiLoading && events.length === 0);

  return (
    <main
      style={{
        width: '240px',           // 嚴格限制寬度符合手機螢幕
        height: '320px',          // 嚴格限制高度
        overflowY: 'auto',        // 內容超過高度時顯示垂直捲軸
        overflowX: 'hidden',      // 隱藏水平捲軸避免破版
        boxSizing: 'border-box',  // 讓 padding 包含在 240x320 的尺寸內
        padding: '6px',
        margin: '0 auto',         // 在一般電腦螢幕開發時可以置中顯示
        textAlign: 'center',
        backgroundColor: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#000000' }}>
        周遭路況列表
      </h2>
      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '12px' }}>
        按 [0] 返回地圖
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        {isPageLoading ? (
          <div style={{ fontSize: '12px', color: '#6b7280', padding: '16px' }}>
            {geoLoading ? '正在取得定位...' : '正在載入路況...'}
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
                  width: '100%', // 改為 100% 自適應容器寬度 (扣除 padding)
                  maxWidth: '220px', 
                  boxSizing: 'border-box',
                  padding: '6px 8px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  textAlign: 'left',
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
          marginTop: '12px',
          marginBottom: '12px', // 底部留白，避免被切掉
          width: '100%',
          maxWidth: '220px',
          boxSizing: 'border-box',
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
        <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#dc2626', color: '#ffffff', padding: '2px 6px', borderRadius: '3px', marginRight: '10px' }}>
          [ 0 ]
        </span>
        <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 'bold' }}>
          返回地圖
        </span>
      </div>
    </main>
  );
}