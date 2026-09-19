'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGeolocation } from '@/component/useGeolocation';

interface AiResponse {
  summary: string;
  disasterCount?: number; 
  disasters: any[];
}

export default function AiAnalysisPage() {
  const router = useRouter();
  const { location: geoCoords } = useGeolocation({ autoFetch: true });
  
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('移動中心探測圈，按 [Enter] 進行危險分析。');
  const [densityInfo, setDensityInfo] = useState<string>(''); 
  const [viewCenter, setViewCenter] = useState({ lat: 24.7936, lng: 120.9917 }); 
  
  const SEARCH_RADIUS = 5000; 

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const centerCircleRef = useRef<any>(null);
  const resultLayerGroupRef = useRef<any>(null);

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
          zoom: 11.5, 
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

  const handleAiAnalysis = async () => {
    if (loading) return;
    setLoading(true);
    setAiSummary('AI 分析中...');
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
      const count = data.disasterCount || 0; 

      // 🌟 1. 定義災害權重，並同時找出案件分布的邊界 (Bounding Box)
      const EVENT_WEIGHTS: Record<string, number> = {
        natural_disaster: 10,
        car_crash: 8,
        unknown_danger: 5,
        roadwork: 3,
        traffic_jam: 2,
      };

      let totalRiskScore = 0;
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

      if (data.disasters && data.disasters.length > 0) {
        data.disasters.forEach(d => {
          totalRiskScore += EVENT_WEIGHTS[d.events] || 1;
          // 記錄最極端的經緯度，用來畫出實際分布的矩形
          if (d.latitude < minLat) minLat = d.latitude;
          if (d.latitude > maxLat) maxLat = d.latitude;
          if (d.longtitude < minLng) minLng = d.longtitude;
          if (d.longtitude > maxLng) maxLng = d.longtitude;
        });
      }

      // 🌟 2. 計算「總搜尋面積」(大圓圈)
      const radiusKm = SEARCH_RADIUS / 1000;
      const searchAreaSqKm = Math.PI * Math.pow(radiusKm, 2);

      // 🌟 3. 實作你提出的「分布面積比例校正」
      let clusterMultiplier = 1; 

      // 如果有 2 個以上的案件，才能構成有意義的面積
      if (count > 1) {
        // 經緯度轉公里 (1緯度約 111 公里，經度需乘上 cos(緯度))
        // 加上 Math.max(..., 0.1) 是為了避免案件排成一條直線導致面積為 0 (最少給 100x100 公尺的緩衝)
        const heightKm = Math.max((maxLat - minLat) * 111, 0.1); 
        const widthKm = Math.max((maxLng - minLng) * 111 * Math.cos(targetLat * Math.PI / 180), 0.1);
        const actualEventAreaSqKm = heightKm * widthKm;

        // 【你的核心邏輯】：總面積 / 實際分布面積
        // 如果 78 平方公里的圓內，案件只集中在 2 平方公里內，係數就是 39 倍！
        const rawRatio = searchAreaSqKm / actualEventAreaSqKm;
        
        // 為了避免極端值把分數算爆，我們限制最大只能放大 3.5 倍
        clusterMultiplier = Math.min(rawRatio, 3.5); 
      }

      // 🌟 4. 模擬「總使用人數/車流量」的時段參數
      const hour = new Date().getHours();
      const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
      const timeMultiplier = isRushHour ? 1.5 : 1.0;

      // 🌟 5. 終極校正公式
      // (總權重 / 總面積) * 聚集度校正(最高3.5倍) * 時段校正(1.5倍)
      const rawDensity = (totalRiskScore / searchAreaSqKm) * clusterMultiplier * timeMultiplier;
      
      // 放大倍率並鎖定最高 10 分
      const riskIndex = Math.min(rawDensity * 5, 10); 

      // 🌟 6. 判定標準
      let riskColor = '#22c55e'; // 綠色
      let riskLevel = '🟢 低風險';
      
      if (count === 0) {
        riskLevel = '✅ 無災害'; 
      } else if (riskIndex >= 6.5) {
        riskColor = '#ef4444'; 
        riskLevel = '🔴 高風險';
      } else if (riskIndex >= 3.0) {
        riskColor = '#eab308'; 
        riskLevel = '🟡 中風險';
      }

      // 縮短文字，去掉 /10.0 和 係數 兩字
      setDensityInfo(`${riskLevel} | 指數:${riskIndex.toFixed(1)} (聚集:${clusterMultiplier.toFixed(1)}x)`);
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
          // 建立完整的顏色對應表
          const dotColors: Record<string, string> = {
            car_crash: '#000000',        // 黑色 (車禍)
            traffic_jam: '#b91c1c',      // 深紅 (塞車)
            roadwork: '#ea580c',         // 橘色 (施工)
            natural_disaster: '#7c3aed', // 紫色 (自然災害)
            unknown_danger: '#ca8a04',   // 黃色 (不明危險)
          };

          data.disasters.forEach(d => {
            // 從對應表抓顏色，如果真的遇到例外才給預設灰色
            const dotColor = dotColors[d.events] || '#6b7280'; 
            
            L.circleMarker([d.latitude, d.longtitude], {
              radius: 4,
              fillColor: dotColor,
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const panDistance = 40;

      switch(e.key) {
        case '1': map.zoomIn(); break;
        case '3': map.zoomOut(); break;
        case '2': case 'ArrowUp': map.panBy([0, -panDistance]); break;
        case '5': case 'ArrowDown': map.panBy([0, panDistance]); break;
        case '4': case 'ArrowLeft': map.panBy([-panDistance, 0]); break;
        case '6': case 'ArrowRight': map.panBy([panDistance, 0]); break;
        case 'Enter': 
          e.preventDefault();
          handleAiAnalysis(); 
          break;
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
      <h2 style={{ fontSize: '13px', fontWeight: 'bold', margin: '2px 0', color: '#1e40af', flexShrink: 0 }}>
        AI 區域危險分析
      </h2>

      {/* 🌟 讓地圖 flex: 1 自動撐開，變成畫面上的主角 */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '220px', flex: 1, minHeight: '130px' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: '6px', border: '1px solid #d1d5db' }} />
      </div>

      {/* 🌟 文字方塊改為固定高度 80px，不浪費空間 */}
      <div style={{
        flexShrink: 0, width: '220px', height: '80px', marginTop: '4px', backgroundColor: '#f3f4f6', 
        border: '1px solid #e5e7eb', borderRadius: '4px', padding: '6px',
        overflowY: 'auto', fontSize: '11px', color: '#1f2937', lineHeight: '1.4',
        display: 'flex', flexDirection: 'column'
      }}>
        {densityInfo && (
          <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #d1d5db', paddingBottom: '2px' }}>
            {densityInfo}
          </div>
        )}
        
        <div style={{ whiteSpace: 'pre-wrap', color: loading ? '#2563eb' : '#dc2626', fontWeight: loading ? 'normal' : 'bold' }}>
          {aiSummary}
        </div>
      </div>

      <div style={{ flexShrink: 0, width: '220px', textAlign: 'center', marginTop: '3px', fontSize: '10px', color: '#4b5563' }}>
        <span style={{ color: '#2563eb', fontWeight: 'bold' }}>[Enter] 執行分析</span> | <span>[0] 返回主地圖</span><br/>
        <span>[上下左右] 移動探測圈 | [1/3] 縮放</span>
      </div>
    </main>
  );
}