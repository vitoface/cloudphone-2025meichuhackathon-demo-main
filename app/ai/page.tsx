'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGeolocation } from '@/component/useGeolocation';

// ==========================================
// 🌐 多國語言字典 (i18n Translations)
// ==========================================
const translations = {
  'zh': {
    pageTitle: 'AI 區域危險分析',
    defaultSummary: '移動中心探測圈，按 [Enter] 進行危險分析。',
    analyzing: 'AI 分析中...',
    apiError: 'API 回應錯誤',
    noDisaster: '✅ 無災害',
    lowRisk: '🟢 低風險',
    mediumRisk: '🟡 中風險',
    highRisk: '🔴 高風險',
    densityFormat: (level: string, index: string, multiplier: string) => `${level} | 指數:${index} (聚集:${multiplier}x)`,
    analysisComplete: '分析完成。',
    networkError: '連線或分析失敗，請檢查網路。',
    executeBtn: '[Enter] 執行分析',
    backBtn: '[0] 返回主地圖',
    moveZoomText: '[上下左右] 移動探測圈 | [1/3] 縮放'
  },
  'en': {
    pageTitle: 'AI Area Danger Analysis',
    defaultSummary: 'Move center circle, press [Enter] to analyze.',
    analyzing: 'AI Analyzing...',
    apiError: 'API response error',
    noDisaster: '✅ No disaster',
    lowRisk: '🟢 Low risk',
    mediumRisk: '🟡 Medium risk',
    highRisk: '🔴 High risk',
    densityFormat: (level: string, index: string, multiplier: string) => `${level} | Index:${index} (Cluster:${multiplier}x)`,
    analysisComplete: 'Analysis complete.',
    networkError: 'Connection or analysis failed, check network.',
    executeBtn: '[Enter] Analyze',
    backBtn: '[0] Back to map',
    moveZoomText: '[Arrows] Move | [1/3] Zoom'
  },
  'ar': {
    pageTitle: 'تحليل المخاطر بالذكاء الاصطناعي',
    defaultSummary: 'حرك الدائرة المركزية، اضغط [Enter] للتحليل.',
    analyzing: 'جاري تحليل الذكاء الاصطناعي...',
    apiError: 'خطأ في استجابة واجهة برمجة التطبيقات',
    noDisaster: '✅ لا توجد كوارث',
    lowRisk: '🟢 خطر منخفض',
    mediumRisk: '🟡 خطر متوسط',
    highRisk: '🔴 خطر عالي',
    densityFormat: (level: string, index: string, multiplier: string) => `${level} | مؤشر:${index} (تجمع:${multiplier}x)`,
    analysisComplete: 'اكتمل التحليل.',
    networkError: 'فشل الاتصال أو التحليل، تحقق من الشبكة.',
    executeBtn: '[Enter] تنفيذ التحليل',
    backBtn: '[0] العودة للخريطة',
    moveZoomText: '[أسهم] تحريك | [1/3] تكبير/تصغير'
  },
  'fr': {
    pageTitle: 'Analyse de zone par IA',
    defaultSummary: 'Déplacez le cercle central, appuyez sur [Entrée] pour analyser.',
    analyzing: 'Analyse IA en cours...',
    apiError: 'Erreur de réponse API',
    noDisaster: '✅ Aucun désastre',
    lowRisk: '🟢 Risque faible',
    mediumRisk: '🟡 Risque moyen',
    highRisk: '🔴 Risque élevé',
    densityFormat: (level: string, index: string, multiplier: string) => `${level} | Indice:${index} (Groupe:${multiplier}x)`,
    analysisComplete: 'Analyse terminée.',
    networkError: 'Échec de connexion ou d\'analyse, vérifiez le réseau.',
    executeBtn: '[Entrée] Analyser',
    backBtn: '[0] Retour à la carte',
    moveZoomText: '[Flèches] Déplacer | [1/3] Zoom'
  },
  'pt': {
    pageTitle: 'Análise de Perigo com IA',
    defaultSummary: 'Mova o círculo central, pressione [Enter] para analisar.',
    analyzing: 'IA Analisando...',
    apiError: 'Erro de resposta da API',
    noDisaster: '✅ Sem desastres',
    lowRisk: '🟢 Baixo risco',
    mediumRisk: '🟡 Médio risco',
    highRisk: '🔴 Alto risco',
    densityFormat: (level: string, index: string, multiplier: string) => `${level} | Índice:${index} (Cluster:${multiplier}x)`,
    analysisComplete: 'Análise concluída.',
    networkError: 'Falha na conexão ou análise, verifique a rede.',
    executeBtn: '[Enter] Analisar',
    backBtn: '[0] Voltar ao mapa',
    moveZoomText: '[Setas] Mover | [1/3] Zoom'
  },
  'vi': {
    pageTitle: 'Phân tích Nguy hiểm AI',
    defaultSummary: 'Di chuyển vòng tròn, nhấn [Enter] để phân tích.',
    analyzing: 'AI Đang phân tích...',
    apiError: 'Lỗi phản hồi API',
    noDisaster: '✅ Không có thảm họa',
    lowRisk: '🟢 Rủi ro thấp',
    mediumRisk: '🟡 Rủi ro trung bình',
    highRisk: '🔴 Rủi ro cao',
    densityFormat: (level: string, index: string, multiplier: string) => `${level} | Chỉ số:${index} (Cụm:${multiplier}x)`,
    analysisComplete: 'Phân tích hoàn tất.',
    networkError: 'Lỗi kết nối/phân tích, kiểm tra mạng.',
    executeBtn: '[Enter] Phân tích',
    backBtn: '[0] Trở về bản đồ',
    moveZoomText: '[Mũi tên] Di chuyển | [1/3] Thu phóng'
  },
  'ha': {
    pageTitle: 'Binciken Haɗari na AI',
    defaultSummary: 'Matsar da da\'irar, danna [Enter] don bincike.',
    analyzing: 'AI tana bincike...',
    apiError: 'Matsalar API',
    noDisaster: '✅ Babu bala\'i',
    lowRisk: '🟢 Karamin haɗari',
    mediumRisk: '🟡 Matsakaicin haɗari',
    highRisk: '🔴 Babban haɗari',
    densityFormat: (level: string, index: string, multiplier: string) => `${level} | Lamba:${index} (Tari:${multiplier}x)`,
    analysisComplete: 'An gama bincike.',
    networkError: 'Matsalar intanet, sake gwadawa.',
    executeBtn: '[Enter] Bincika',
    backBtn: '[0] Koma taswira',
    moveZoomText: '[Kibau] Matsar | [1/3] Zun'
  },
  'sw': {
    pageTitle: 'Uchambuzi wa Hatari wa AI',
    defaultSummary: 'Sogeza mduara, bonyeza [Enter] kuchambua.',
    analyzing: 'AI inachambua...',
    apiError: 'Hitilafu ya API',
    noDisaster: '✅ Hakuna janga',
    lowRisk: '🟢 Hatari ndogo',
    mediumRisk: '🟡 Hatari ya kati',
    highRisk: '🔴 Hatari kubwa',
    densityFormat: (level: string, index: string, multiplier: string) => `${level} | Kielezo:${index} (Kundi:${multiplier}x)`,
    analysisComplete: 'Uchambuzi umekamilika.',
    networkError: 'Imeshindwa kuunganisha, angalia mtandao.',
    executeBtn: '[Enter] Chambua',
    backBtn: '[0] Rudi kwenye ramani',
    moveZoomText: '[Mishale] Sogeza | [1/3] Kuza'
  }
};

interface AiResponse {
  summary: string;
  disasterCount?: number; 
  disasters: any[];
}

export default function AiAnalysisPage() {
  const router = useRouter();
  const { location: geoCoords } = useGeolocation({ autoFetch: true });
  
  // 🌐 語言狀態管理 (預設英文為後備)
  const [langCode, setLangCode] = useState<string>('en');

  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>(''); // 初始為空字串，將由翻譯字典提供預設
  const [densityInfo, setDensityInfo] = useState<string>(''); 
  const [viewCenter, setViewCenter] = useState({ lat: 24.7936, lng: 120.9917 }); 
  
  const SEARCH_RADIUS = 5000; 

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const centerCircleRef = useRef<any>(null);
  const resultLayerGroupRef = useRef<any>(null);

  // 初始化語言
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const navLang = navigator.language.split('-')[0].toLowerCase();
      if (navigator.language.toLowerCase().startsWith('zh')) {
        setLangCode('zh');
      } else if (translations[navLang as keyof typeof translations]) {
        setLangCode(navLang);
      } else {
        setLangCode('en');
      }
    }
  }, []);

  const t = translations[langCode as keyof typeof translations] || translations['en'];

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
    setAiSummary(t.analyzing);
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

      if (!res.ok) throw new Error(t.apiError);
      
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
      let riskLevel = t.lowRisk;
      
      if (count === 0) {
        riskLevel = t.noDisaster; 
      } else if (riskIndex >= 6.5) {
        riskColor = '#ef4444'; 
        riskLevel = t.highRisk;
      } else if (riskIndex >= 3.0) {
        riskColor = '#eab308'; 
        riskLevel = t.mediumRisk;
      }

      // 縮短文字，去掉 /10.0 和 係數 兩字
      setDensityInfo(t.densityFormat(riskLevel, riskIndex.toFixed(1), clusterMultiplier.toFixed(1)));
      setAiSummary(data.summary || t.analysisComplete);

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
      setAiSummary(t.networkError);
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
  }, [loading, viewCenter, router, handleAiAnalysis]); // Added handleAiAnalysis to deps

  // 若未執行分析或取得資料前，提供預設顯示
  const displaySummary = aiSummary || t.defaultSummary;

  return (
    <main 
      dir={langCode === 'ar' ? 'rtl' : 'ltr'}
      style={{
        width: '100%', maxWidth: '240px', height: '100vh', maxHeight: '320px',
        margin: '0 auto', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', backgroundColor: '#ffffff', padding: '4px', boxSizing: 'border-box'
      }}
    >
      <h2 style={{ fontSize: '13px', fontWeight: 'bold', margin: '2px 0', color: '#1e40af', flexShrink: 0 }}>
        {t.pageTitle}
      </h2>

      {/* 🌟 讓地圖 flex: 1 自動撐開，變成畫面上的主角 */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '220px', flex: 1, minHeight: '130px' }}>
        {/* Leaflet map usually expects LTR internally to avoid tile offset issues, thus dir="ltr" here */}
        <div ref={mapContainerRef} dir="ltr" style={{ width: '100%', height: '100%', borderRadius: '6px', border: '1px solid #d1d5db' }} />
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
          {displaySummary}
        </div>
      </div>

      <div style={{ flexShrink: 0, width: '220px', textAlign: 'center', marginTop: '3px', fontSize: '10px', color: '#4b5563' }}>
        <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{t.executeBtn}</span> | <span>{t.backBtn}</span><br/>
        <span>{t.moveZoomText}</span>
      </div>
    </main>
  );
}