'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGeolocation } from '@/component/useGeolocation';
import ProximityAlert from '@/component/ProximityAlert'; // 🌟 引入左下角驚嘆號預警模組

// 定義支援的 5 種事件代碼
export type EventType = 
  | 'traffic_jam'        // 嚴重塞車 (大範圍貼路, 紅色)
  | 'car_crash'          // 發生車禍 (小範圍貼路, 黑色)
  | 'roadwork'           // 道路施工 (中範圍貼路, 橙色)
  | 'natural_disaster'   // 自然災害 (圓圈警戒)
  | 'unknown_danger';    // 不明危險 (圓圈警戒)

// 前端地圖繪製所使用的事件格式
interface TrafficEvent {
  key: string;
  lat: number;
  lng: number;
  eventType: EventType;
  title: string;
  description?: string;
  radius?: number;
  paths?: [number, number][][];
}

// 後端 /api/mapinfo 回傳的原始資料格式
interface ApiMapInfoItem {
  id: number;
  created_at: string;
  latitude: number;
  longtitude: number;
  title: string | null;
  description: string | null;
  events: string | null;
}

export default function HomePage() {
  const router = useRouter();

  // 1. 定位 Hook
  const { 
    location: geoCoords, 
    loading: geoLoading, 
    errorMsg: geoError,
    updateLocation 
  } = useGeolocation({
    autoFetch: true,
  });

  // 使用者真實/校正後的座標
  const userLocationRef = useRef<{ lat: number; lng: number }>({
    lat: 24.7936,
    lng: 120.9917,
  });

  const [currentZoom, setCurrentZoom] = useState<number>(17);
  const [viewCenter, setViewCenter] = useState<{ lat: number; lng: number }>({
    lat: 24.7936,
    lng: 120.9917,
  });

  // 存放地圖事件 (畫圖層用)
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  
  // 🌟 新增：存放 API 原始回報資料 (給左下角預警燈用)
  const [cloudReports, setCloudReports] = useState<ApiMapInfoItem[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const eventLayerGroupRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  // 記錄是否為第一次載入定位
  const hasInitializedCenterRef = useRef<boolean>(false);

  // 2. 初始定位載入
  useEffect(() => {
    if (geoCoords && !hasInitializedCenterRef.current) {
      userLocationRef.current = geoCoords;

      if (!sessionStorage.getItem('map_last_lat')) {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([geoCoords.lat, geoCoords.lng]);
        }
        setViewCenter(geoCoords);
      }

      if (markerRef.current) {
        markerRef.current.setLatLng([geoCoords.lat, geoCoords.lng]);
      }
      
      hasInitializedCenterRef.current = true;
    }
  }, [geoCoords]);

  // 五向射線道路探索
  const fetchMultiRayRoads = async (lat: number, lng: number, radiusMeters: number): Promise<[number, number][][]> => {
    const r = radiusMeters || 30;
    const latDelta = r / 111000;
    const lngDelta = r / (111000 * Math.cos((lat * Math.PI) / 180));

    const angles = [0, 72, 144, 216, 288];
    const rayTasks = angles.map((deg) => {
      const rad = (deg * Math.PI) / 180;
      return {
        start: [lng, lat],
        end: [lng + lngDelta * Math.cos(rad), lat + latDelta * Math.sin(rad)],
      };
    });

    try {
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
      return results.filter((seg): seg is [number, number][] => seg !== null && seg.length > 1);
    } catch (err) {
      console.warn('五向道路探索失敗:', err);
      return [];
    }
  };

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
      if (item.eventType === 'car_crash') {
        if (item.paths && item.paths.length > 0) {
          item.paths.forEach((roadCoords) => {
            const polyline = L.polyline(roadCoords, {
              color: '#000000', 
              weight: 5.5,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            });
            polyline.bindPopup(`<b>💥 ${item.title}</b><br/>${item.description || ''}`);
            polyline.addTo(eventLayerGroupRef.current);
          });
        }
        const centerDot = L.circleMarker([item.lat, item.lng], {
          radius: 4.5, fillColor: '#000000', color: '#ffffff', weight: 1.5, opacity: 1, fillOpacity: 1,
        });
        centerDot.bindPopup(`<b>💥 ${item.title}</b><br/>${item.description || ''}`);
        centerDot.addTo(eventLayerGroupRef.current);
      }
      
      else if (item.eventType === 'traffic_jam') {
        if (item.paths && item.paths.length > 0) {
          item.paths.forEach((roadCoords) => {
            const polyline = L.polyline(roadCoords, {
              color: '#b91c1c', weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round',
            });
            polyline.bindPopup(`<b>🚗 ${item.title}</b><br/>${item.description || ''}`);
            polyline.addTo(eventLayerGroupRef.current);
          });
        }
        const centerDot = L.circleMarker([item.lat, item.lng], {
          radius: 4.5, fillColor: '#991b1b', color: '#ffffff', weight: 1.5, opacity: 1, fillOpacity: 1,
        });
        centerDot.bindPopup(`<b>🚗 ${item.title}</b><br/>${item.description || ''}`);
        centerDot.addTo(eventLayerGroupRef.current);
      }

      else if (item.eventType === 'roadwork') {
        if (item.paths && item.paths.length > 0) {
          item.paths.forEach((roadCoords) => {
            const polyline = L.polyline(roadCoords, {
              color: '#ea580c', weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round',
            });
            polyline.bindPopup(`<b>🚧 ${item.title}</b><br/>${item.description || ''}`);
            polyline.addTo(eventLayerGroupRef.current);
          });
        }
        const centerDot = L.circleMarker([item.lat, item.lng], {
          radius: 4.5, fillColor: '#ea580c', color: '#ffffff', weight: 1.5, opacity: 1, fillOpacity: 1,
        });
        centerDot.bindPopup(`<b>🚧 ${item.title}</b><br/>${item.description || ''}`);
        centerDot.addTo(eventLayerGroupRef.current);
      }

      else if (item.eventType === 'natural_disaster') {
        const circle = L.circle([item.lat, item.lng], {
          color: '#7c3aed', fillColor: '#8b5cf6', fillOpacity: 0.55, radius: item.radius || 35, weight: 3,
        });
        circle.bindPopup(`<b>⚠️ ${item.title}</b><br/>${item.description || ''}`);
        circle.addTo(eventLayerGroupRef.current);
        const disasterDot = L.circleMarker([item.lat, item.lng], {
          radius: 4.5, fillColor: '#7c3aed', color: '#ffffff', weight: 1.5, opacity: 1, fillOpacity: 1,
        });
        disasterDot.addTo(eventLayerGroupRef.current);
      }

      else {
        const circle = L.circle([item.lat, item.lng], {
          color: '#ca8a04', fillColor: '#eab308', fillOpacity: 0.5, radius: item.radius || 30, weight: 2.5,
        });
        circle.bindPopup(`<b>⚠️ ${item.title}</b><br/>${item.description || ''}`);
        circle.addTo(eventLayerGroupRef.current);
        const dangerDot = L.circleMarker([item.lat, item.lng], {
          radius: 4, fillColor: '#ca8a04', color: '#ffffff', weight: 1.5, opacity: 1, fillOpacity: 1,
        });
        dangerDot.addTo(eventLayerGroupRef.current);
      }
    });
  };

  const parseEventType = (
    title: string, 
    eventsField: string
  ): { type: EventType; displayTitle: string; radius: number } => {
    const t = title.trim();
    const e = eventsField.trim().toLowerCase();

    if (t.includes('塞車') || e === 'traffic_jam' || e === 'traffic') return { type: 'traffic_jam', displayTitle: '嚴重塞車', radius: 45 };
    if (t.includes('車禍') || e === 'car_crash' || e === 'accident') return { type: 'car_crash', displayTitle: '發生車禍', radius: 8 };
    if (t.includes('施工') || e === 'roadwork') return { type: 'roadwork', displayTitle: '道路施工', radius: 28 };
    if (t.includes('災害') || e === 'natural_disaster') return { type: 'natural_disaster', displayTitle: '自然災害', radius: 35 };
    return { type: 'unknown_danger', displayTitle: t || '不明危險', radius: 30 };
  };

  // 3. 從 /api/mapinfo 抓取資料並轉換
  const fetchAndProcessEvents = async (currentEvents: TrafficEvent[]) => {
    try {
      const res = await fetch('/api/mapinfo');
      if (!res.ok) return;

      const apiData: ApiMapInfoItem[] = await res.json();
      
      // 🌟 將原始資料存起來，提供給左下角警示燈模組
      setCloudReports(apiData);

      const mappedEvents: TrafficEvent[] = apiData.map((item, idx) => {
        const { type, displayTitle, radius } = parseEventType(item.title || '', item.events || '');
        const uniqueKey = `ev-${item.latitude.toFixed(5)}-${item.longtitude.toFixed(5)}-${idx}`;
        const existingEvent = currentEvents.find((e) => e.key === uniqueKey);

        return {
          key: uniqueKey,
          lat: item.latitude,
          lng: item.longtitude,
          eventType: type,
          title: displayTitle,
          description: item.description || '',
          radius: radius,
          paths: existingEvent?.paths,
        };
      });

      const roadNeedTypes: EventType[] = ['traffic_jam', 'roadwork', 'car_crash'];

      const resolvedEvents = await Promise.all(
        mappedEvents.map(async (ev) => {
          if (roadNeedTypes.includes(ev.eventType) && (!ev.paths || ev.paths.length === 0)) {
            const multiPaths = await fetchMultiRayRoads(ev.lat, ev.lng, ev.radius || 30);
            if (multiPaths.length > 0) {
              return { ...ev, paths: multiPaths };
            }
          }
          return ev;
        })
      );

      setEvents(resolvedEvents);
      drawLayers(resolvedEvents);
    } catch (error) {
      console.error('抓取 /api/mapinfo 失敗:', error);
    }
  };

  useEffect(() => {
    fetchAndProcessEvents([]);
  }, []);

  // 4. 每 10 秒靜默輪詢
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAndProcessEvents(events);
    }, 10000);

    return () => clearInterval(interval);
  }, [events]);

  // 5. 初始化 Leaflet
  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;

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
        const savedLat = sessionStorage.getItem('map_last_lat');
        const savedLng = sessionStorage.getItem('map_last_lng');
        const savedZoom = sessionStorage.getItem('map_last_zoom');

        const initialCenter: [number, number] = savedLat && savedLng
          ? [parseFloat(savedLat), parseFloat(savedLng)]
          : [userLocationRef.current.lat, userLocationRef.current.lng];

        const initialZoom = savedZoom ? parseInt(savedZoom, 10) : 17;

        const map = L.map(mapContainer, {
          center: initialCenter,
          zoom: initialZoom,
          zoomControl: false,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        mapInstanceRef.current = map;

        const marker = L.marker([userLocationRef.current.lat, userLocationRef.current.lng], {
          draggable: true 
        }).addTo(map);
        marker.bindPopup('您的精確位置<br/>(可拖曳，或按 [7] 重新定於中心)');
        markerRef.current = marker;

        marker.on('dragend', function (e: any) {
          const position = e.target.getLatLng();
          userLocationRef.current = { lat: position.lat, lng: position.lng };
          updateLocation(position.lat, position.lng);
        });

        drawLayers(events);

        map.on('moveend', () => {
          const center = map.getCenter();
          setViewCenter({ lat: center.lat, lng: center.lng });
          sessionStorage.setItem('map_last_lat', center.lat.toString());
          sessionStorage.setItem('map_last_lng', center.lng.toString());
        });

        map.on('zoomend', () => {
          const z = map.getZoom();
          setCurrentZoom(z);
          sessionStorage.setItem('map_last_zoom', z.toString());
        });

        setTimeout(() => map.invalidateSize(), 150);
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [updateLocation]);

  // 6. 按鍵控制支援
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

      if (e.key === '7') {
        e.preventDefault();
        const center = map.getCenter();
        userLocationRef.current = { lat: center.lat, lng: center.lng };
        
        updateLocation(center.lat, center.lng);

        if (markerRef.current) {
          markerRef.current.setLatLng([center.lat, center.lng]);
          markerRef.current.openPopup();
        }
      }

      if (e.key === '0') {
        e.preventDefault();
        map.panTo([userLocationRef.current.lat, userLocationRef.current.lng], { animate: true });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, updateLocation]);

  return (
    <main
      style={{
        width: '100%',
        maxWidth: '240px',          // 限制最大寬度保護
        height: '100vh',            // 滿版高度
        maxHeight: '320px',         // 限制最大高度符合功能型手機
        margin: '0 auto',
        overflow: 'hidden',         // 隱藏整頁的捲動，避免雙層捲軸
        boxSizing: 'border-box',
        padding: '4px',             // 縮小 padding 留更多空間給地圖
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      {/* 頂部標題區 (設定 flexShrink: 0 確保不會被地圖擠壓) */}
      <div style={{ flexShrink: 0, textAlign: 'center', width: '100%' }}>
        <h2
          suppressHydrationWarning
          style={{ fontSize: '13px', fontWeight: 'bold', margin: '2px 0 4px 0', color: '#000000' }}
        >
          即時路況定位 (道路貼合)
        </h2>
      </div>

      {/* 中間地圖容器 (設定 flex: 1 自動填滿剩餘高度) */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            flex: 1,                // 🌟 關鍵：讓地圖自己延展高度
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 1,
          }}
        />
        {/* 預警模組：依然放在相對定位的容器中，完美貼齊地圖左下角 */}
        <ProximityAlert location={userLocationRef.current} reports={cloudReports} />
      </div>

      {/* 底部操作與資訊區 (設定 flexShrink: 0 固定在底部) */}
      <div style={{ flexShrink: 0, width: '220px', textAlign: 'center', marginTop: '4px' }}>
        
        {/* 圖例 */}
        <div style={{ fontSize: '9px', color: '#374151', lineHeight: '1.2' }}>
          <span style={{ color: '#b91c1c' }}>■ 塞車</span> | 
          <span style={{ color: '#000000' }}>■ 車禍</span> | 
          <span style={{ color: '#ea580c' }}>■ 施工</span> | 
          <span style={{ color: '#7c3aed' }}>● 災害</span> | 
          <span style={{ color: '#ca8a04' }}>● 危險</span>
        </div>

        {/* 按鍵操作指引 */}
        <div style={{ fontSize: '10px', color: '#374151', marginTop: '2px', lineHeight: '1.3' }}>
          <p><strong>[1/↑]</strong> 放大 | <strong>[3/↓]</strong> 縮小 (級別: {currentZoom})</p>
          <p><strong>[2/4/5/6]</strong> 移動 | <strong>[0]</strong> 找圖釘 | <strong>[7]</strong> 定位</p>
          <p style={{ color: '#dc2626', marginTop: '2px' }}>
            <strong>[8]</strong> 列表 | <strong>[9]</strong> 回報
          </p>
        </div>

        {/* 座標資訊 (稍微縮小字體以節省空間) */}
        <div style={{ fontSize: '9px', marginTop: '2px', color: '#4b5563', lineHeight: '1.2' }}>
          <p style={{ color: '#000' }}>中心：{viewCenter.lat.toFixed(4)}, {viewCenter.lng.toFixed(4)}</p>
          <p>
            精確：{userLocationRef.current.lat.toFixed(4)}, {userLocationRef.current.lng.toFixed(4)}
            {geoLoading && <span style={{ color: '#2563eb' }}> (抓取中)</span>}
            {geoError && <span style={{ color: '#dc2626' }}> ({geoError})</span>}
          </p>
        </div>

      </div>
    </main>
  );
}