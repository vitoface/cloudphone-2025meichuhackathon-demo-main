'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGeolocation } from '@/component/useGeolocation';

interface AiResponse {
  summary: string;
  disasterCount?: number; // 改為可選，因為後端 0 件時沒有回傳此欄位
  disasters: any[];
}

export default function AiAnalysisPage() {
  const router = useRouter();
  
  const { location: geoCoords } = useGeolocation({ autoFetch: true });
  
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('移動中心探測圈，按 [Enter] 分析區域危險密度。');
  const [densityInfo, setDensityInfo] = useState<string>(''); 
  
  const [viewCenter, setViewCenter] = useState({ lat: 24.7936, lng: 120.9917 }); 
  
  // 🌟 修改 2：最大框的範圍到半徑 5 公里 (5000公尺)
  const SEARCH_RADIUS = 5000; 

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const centerCircleRef = useRef<any>(null);
  const resultLayerGroupRef = useRef<any>(null);

  // 1. 初始化地圖與探測圈
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
        const initialCenter: [number, number] = geoCoords 
          ? [geoCoords.lat, geoCoords.lng] 
          : [viewCenter.lat, viewCenter.lng];

        const map = L.map(mapContainer, {
          center: initialCenter,
          zoom: 11.5, // 🌟 為了容納 5 公里的半徑，將視野拉遠
          zoomControl: false,
          dragging: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        resultLayerGroupRef.current = L.layerGroup().addTo(map);

        const updateCenterReticle = () => {
          const currentCenter = map.getCenter();
          setViewCenter({ lat: currentCenter.lat, lng: currentCenter.lng });

          if (centerCircleRef.current) {
            centerCircleRef.current.setLatLng(currentCenter);
          } else {
            centerCircleRef.current = L.circle(currentCenter, {
              color: '#3b82f6',
              fillColor: 'transparent', 
              weight: 2,
              dashArray: '5, 5',
              radius: SEARCH_RADIUS
            }).addTo(map);
          }
        };

        updateCenterReticle();
        map.on('move', updateCenterReticle);
        
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
  }, [geoCoords]);

  // 2. 執行分析與密度計算
  const handleAiAnalysis = async () => {
    if (loading) return;
    setLoading(true);
    setAiSummary('分析中...');
    setDensityInfo('');
    
    if (resultLayerGroupRef.current) {
      resultLayerGroupRef.current.clearLayers();
    }

    try {
      const targetLat = viewCenter.lat;
      const targetLng = viewCenter.lng;

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: targetLat,
          longitude: targetLng,
          radius: SEARCH_RADIUS
        })
      });

      if (!res.ok) throw new Error('API 回應錯誤');
      
      const data: AiResponse = await res.json();
      const L = leafletRef.current;

      // 🌟 修改 3：前端防呆，如果後端沒給 disasterCount 或為 undefined，直接視為 0
      const count = data.disasterCount || 0; 

      const radiusKm = SEARCH_RADIUS / 1000;
      const areaSqKm = Math.PI * Math.pow(radiusKm, 2);
      const density = count / areaSqKm; 

      let riskColor = '#22c55e'; // 綠色
      let riskLevel = '🟢 低風險';
      
      if (count === 0) {
        riskLevel = '✅ 無災害'; // 0 件時特別顯示為無災害
      } else if (density >= 1.5) {
        riskColor = '#ef4444'; // 紅色
        riskLevel = '🔴 高風險';
      } else if (density >= 0.5) {
        riskColor = '#eab308'; // 黃色
        riskLevel = '🟡 中風險';
      }

      setDensityInfo(`${riskLevel} | 密度: ${density.toFixed(2)} 件/km² (共 ${count} 件)`);
      setAiSummary(data.summary || '分析完成。');

      if (L) {
        L.circle([targetLat, targetLng], {
          color: riskColor,
          fillColor: riskColor,
          fillOpacity: 0.35, 
          weight: 2,
          radius: SEARCH_RADIUS
        }).addTo(resultLayerGroupRef.current);

        if (data.disasters && data.disasters.length > 0) {
          data.disasters.forEach(d => {
            L.circleMarker([d.latitude, d.longtitude], {
              radius: 3,
              fillColor: '#000',
              color: '#fff',
              weight: 1,
              fillOpacity: 1
            }).addTo(resultLayerGroupRef.current);
          });
        }
      }

    } catch (error) {
      setAiSummary('連線或分析失敗，請檢查網路。');
    } finally {
      setLoading(false);
    }
  };

  // 3. 按鍵監聽
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const panDistance = 40;

      switch(e.key) {
        case '1': case 'ArrowUp': map.zoomIn(); break;
        case '3': case 'ArrowDown': map.zoomOut(); break;
        case '2': map.panBy([0, -panDistance]); break;
        case '5': map.panBy([0, panDistance]); break;
        case '4': map.panBy([-panDistance, 0]); break;
        case '6': map.panBy([panDistance, 0]); break;
        
        // 🌟 修改 1：只綁定 Enter 作為執行分析
        case 'Enter': 
          e.preventDefault();
          handleAiAnalysis(); 
          break;
          
        // 🌟 修改 1：綁定 0 為返回主地圖
        case '0': 
          e.preventDefault();
          router.push('/'); 
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, viewCenter, router]);

  return (
    <main style={{
      width: '100%', maxWidth: '240px', height: '100vh', maxHeight: '320px',
      margin: '0 auto', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', backgroundColor: '#ffffff', padding: '4px', boxSizing: 'border-box'
    }}>
      <h2 style={{ fontSize: '13px', fontWeight: 'bold', margin: '2px 0', color: '#1e40af' }}>
        AI 區域密度分析
      </h2>

      <div style={{ position: 'relative', width: '100%', maxWidth: '220px', height: '120px', flexShrink: 0 }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: '6px', border: '1px solid #d1d5db' }} />
      </div>

      <div style={{
        flex: 1, width: '220px', marginTop: '4px', backgroundColor: '#f3f4f6', 
        border: '1px solid #e5e7eb', borderRadius: '4px', padding: '4px',
        overflowY: 'auto', fontSize: '11px', color: '#1f2937', lineHeight: '1.4',
        display: 'flex', flexDirection: 'column'
      }}>
        {densityInfo && (
          <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #d1d5db', paddingBottom: '2px' }}>
            {densityInfo}
          </div>
        )}
        
        <div style={{ whiteSpace: 'pre-wrap', color: loading ? '#2563eb' : '#1f2937' }}>
          {aiSummary}
        </div>
      </div>

      {/* 🌟 修改了介面下方的按鍵提示 */}
      <div style={{ flexShrink: 0, width: '220px', textAlign: 'center', marginTop: '2px', fontSize: '10px', color: '#4b5563' }}>
        <span style={{ color: '#2563eb', fontWeight: 'bold' }}>[Enter] 執行分析</span> | <span>[0] 返回主地圖</span><br/>
        <span>[2/4/5/6] 移動探測圈 | [1/3] 縮放</span>
      </div>
    </main>
  );
}