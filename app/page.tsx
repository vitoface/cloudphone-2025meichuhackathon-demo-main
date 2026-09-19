'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface TrafficEvent {
  id: string;
  lat: number;
  lng: number;
  event: 'traffic' | 'danger' | 'normal' | string;
  description?: string;
  radius?: number; // 塞車影響半徑（公尺）
  paths?: [number, number][][];
}

export default function HomePage() {
  const router = useRouter();

  // 測試座標（清大自強路）
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>({
    lat: 24.7936,
    lng: 120.9917,
  });
  const [currentZoom, setCurrentZoom] = useState<number>(17);

  // 塞車事件：設定半徑 80 公尺
  const [events, setEvents] = useState<TrafficEvent[]>([
    {
      id: 'traffic-01',
      lat: 24.79395,
      lng: 120.9917,
      event: 'traffic',
      description: '自強路周邊：嚴重壅塞（五向射線路網染色）',
      radius: 20,
    },
    {
      id: 'danger-01',
      lat: 24.7942,
      lng: 120.9926,
      event: 'danger',
      description: '【事故警報】單線封閉',
      radius: 35,
    },
    {
      id: 'traffic-02',
      lat: 24.79395,
      lng: 120.9925,
      event: 'traffic',
      description: '自強路周邊：嚴重壅塞（五向射線路網染色）',
      radius: 20,
    },
  ]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const eventLayerGroupRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  // 繪製地圖圖層
  const drawLayers = (eventList: TrafficEvent[]) => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    if (!eventLayerGroupRef.current) {
      eventLayerGroupRef.current = L.layerGroup().addTo(map);
    }
    eventLayerGroupRef.current.clearLayers();

    eventList.forEach((item) => {
      // 1. 塞車：將抓取到的多條路徑全部繪製
      if (item.event === 'traffic') {
        if (item.paths && item.paths.length > 0) {
          item.paths.forEach((roadCoords) => {
            const polyline = L.polyline(roadCoords, {
              color: '#b91c1c', // 深紅
              weight: 5,        // 5px 貼合車道寬度
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            });

            if (item.description) {
              polyline.bindPopup(`<b>壅塞路況</b><br/>${item.description}`);
            }
            polyline.addTo(eventLayerGroupRef.current);
          });
        }

        // 塞車中心點標記（像素固定大小，不隨地圖縮放變形）
        const centerDot = L.circleMarker([item.lat, item.lng], {
          radius: 4.5,
          fillColor: '#991b1b',
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 1,
        });

        if (item.description) {
          centerDot.bindPopup(`<b>事件中心點</b><br/>${item.description}`);
        }
        centerDot.addTo(eventLayerGroupRef.current);
      }

      // 2. 危險事件：紅色警示圈 + 中心點
      if (item.event === 'danger') {
        const circle = L.circle([item.lat, item.lng], {
          color: '#dc2626',
          fillColor: '#ef4444',
          fillOpacity: 0.6,
          radius: item.radius || 35,
          weight: 3,
        });

        if (item.description) {
          circle.bindPopup(`<b>🚨 危險警報</b><br/>${item.description}`);
        }
        circle.addTo(eventLayerGroupRef.current);

        const dangerDot = L.circleMarker([item.lat, item.lng], {
          radius: 4,
          fillColor: '#dc2626',
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 1,
        });
        dangerDot.addTo(eventLayerGroupRef.current);
      }
    });
  };

  // 核心功能：向 5 個不同方向發射射線規劃路徑，拼出附近所有交會道路
  const fetchMultiRayRoads = async (lat: number, lng: number, radiusMeters: number): Promise<[number, number][][]> => {
    const r = radiusMeters || 80;
    const latDelta = r / 111000;
    const lngDelta = r / (111000 * Math.cos((lat * Math.PI) / 180));

    // 5 個不同方向角度 (0°, 72°, 144°, 216°, 288°)
    const angles = [0, 72, 144, 216, 288];
    const rayTasks = angles.map((deg) => {
      const rad = (deg * Math.PI) / 180;
      // 以中心點向外延伸出該角度的端點座標
      const targetLat = lat + latDelta * Math.sin(rad);
      const targetLng = lng + lngDelta * Math.cos(rad);

      // 規劃由中心點到該端點（或反向）的真實道路行駛路徑
      return {
        start: [lng, lat],
        end: [targetLng, targetLat],
      };
    });

    try {
      // 最多 5 次請求同時發出 (Promise.all)
      const requests = rayTasks.map(async ({ start, end }) => {
        const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          return data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );
        }
        return null;
      });

      const results = await Promise.all(requests);
      // 過濾掉失敗或長度不足的路線
      return results.filter((seg): seg is [number, number][] => seg !== null && seg.length > 1);
    } catch (err) {
      console.warn('五向道路探索失敗:', err);
      return [];
    }
  };

  // 載入時觸發探索
  useEffect(() => {
    let isCancelled = false;

    async function loadRoads() {
      const updatedEvents = await Promise.all(
        events.map(async (ev) => {
          if (ev.event === 'traffic' && (!ev.paths || ev.paths.length === 0)) {
            const multiPaths = await fetchMultiRayRoads(ev.lat, ev.lng, ev.radius || 80);
            if (multiPaths.length > 0) {
              return { ...ev, paths: multiPaths };
            }
          }
          return ev;
        })
      );

      if (!isCancelled) {
        setEvents(updatedEvents);
        drawLayers(updatedEvents);
      }
    }

    loadRoads();
    return () => {
      isCancelled = true;
    };
  }, []);

  // 初始化 Leaflet
  useEffect(() => {
    if (!location || !mapContainerRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted) return;
      leafletRef.current = L;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [location.lat, location.lng],
          zoom: 17,
          zoomControl: false,
          dragging: false,
          touchZoom: false,
          doubleClickZoom: false,
          scrollWheelZoom: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        mapInstanceRef.current = map;

        const marker = L.marker([location.lat, location.lng]).addTo(map);
        marker.bindPopup('目前位置');

        drawLayers(events);

        setTimeout(() => map.invalidateSize(), 100);
        map.on('zoomend', () => setCurrentZoom(map.getZoom()));
      } else {
        drawLayers(events);
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

  // 按鍵控制支援（QVGA 螢幕相容）[cite: 7, 8]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '8') {
        e.preventDefault();
        router.push('/list');
        return;
      }
      if (e.key === '9') {
        e.preventDefault();
        router.push('/report');
        return;
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      const panDistance = 30;

      if (e.key === 'ArrowUp' || e.key === '1') {
        e.preventDefault();
        map.zoomIn();
      } else if (e.key === 'ArrowDown' || e.key === '3') {
        e.preventDefault();
        map.zoomOut();
      }

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

      if (e.key === '0') {
        e.preventDefault();
        if (location) map.panTo([location.lat, location.lng], { animate: true });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location, router]);

  return (
    <main style={{ padding: '6px', textAlign: 'center', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <h2
        suppressHydrationWarning
        style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#000000' }}
      >
        即時路況定位 (五向路網貼路)
      </h2>

      {location && (
        <div>
          <div
            ref={mapContainerRef}
            style={{
              width: '220px',
              height: '140px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              margin: '0 auto',
              position: 'relative',
              overflow: 'hidden',
              zIndex: 1,
            }}
          />

          <div style={{ fontSize: '10px', color: '#374151', marginTop: '6px', lineHeight: '1.4' }}>
            <p><strong>[1/↑]</strong> 放大 | <strong>[3/↓]</strong> 縮小 (級別: {currentZoom})</p>
            <p><strong>[2/4/5/6]</strong> 上左下右移 | <strong>[0]</strong> 回中心</p>
            <p style={{ color: '#dc2626', marginTop: '2px' }}>
              <strong>[8]</strong> 列表 | <strong>[9]</strong> 回報
            </p>
          </div>

          <div style={{ fontSize: '11px', marginTop: '4px', color: '#000000', lineHeight: '1.3' }}>
            <p>目前座標：{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
          </div>
        </div>
      )}
    </main>
  );
}