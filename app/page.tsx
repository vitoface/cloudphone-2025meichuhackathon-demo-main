'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGeolocation } from '@/component/useGeolocation';
import ProximityAlert from '@/component/ProximityAlert';

// ==========================================
// 🌐 多國語言字典 (i18n Translations)
// 包含 itel NEO R60+ 支援的語言，英文為安全後備
// ==========================================
const translations = {
  'zh': {
    title: '即時路況定位 (避障導航)',
    evtJam: '嚴重塞車', evtCrash: '發生車禍', evtWork: '道路施工', evtDisaster: '自然災害', evtDanger: '不明危險',
    navInit: '移動視野按 [*] 設定目的地', navArrived: '已位於目標點周遭', navCalc: '計算避障路徑中...', 
    navNoRoute: '無可行導航路線', navActive: '導航中', navSafe: '避開危險', navFailed: '避障路徑規劃失敗',
    myLocation: '您的目前位置<br/>(可拖曳校正)', destLocation: '目標地點',
    legendNav: '導航', legendCrash: '車禍', legendJam: '塞車', legendWork: '施工', legendDisaster: '災害',
    move: '移動', zoom: '縮放', backStart: '回起點', setDest: '設中心為終點導航 (按*覆蓋)',
    locate: '定位', list: '列表', report: '回報',
    center: '中心', start: '起點', locating: '定位中', mins: '分'
  },
  'en': {
    title: 'Real-time Traffic (Safe Nav)',
    evtJam: 'Traffic Jam', evtCrash: 'Car Crash', evtWork: 'Roadwork', evtDisaster: 'Disaster', evtDanger: 'Unknown Danger',
    navInit: 'Move map & press [*] to set destination', navArrived: 'Arrived at destination', navCalc: 'Calculating safe route...', 
    navNoRoute: 'No valid route found', navActive: 'Navigating', navSafe: 'avoided danger', navFailed: 'Routing failed',
    myLocation: 'Your Location<br/>(Drag to adjust)', destLocation: 'Destination',
    legendNav: 'Nav', legendCrash: 'Crash', legendJam: 'Jam', legendWork: 'Work', legendDisaster: 'Disaster',
    move: 'Move', zoom: 'Zoom', backStart: 'Start', setDest: 'Set Dest via Center (* to overwrite)',
    locate: 'Locate', list: 'List', report: 'Report',
    center: 'Center', start: 'Start', locating: 'Locating', mins: 'min'
  },
  'ar': {
    title: 'حركة المرور (ملاحة آمنة)',
    evtJam: 'ازدحام شديد', evtCrash: 'حادث سير', evtWork: 'أعمال طرق', evtDisaster: 'كارثة طبيعية', evtDanger: 'خطر مجهول',
    navInit: 'حرك الخريطة واضغط [*] للوجهة', navArrived: 'وصلت للوجهة', navCalc: 'جاري حساب مسار آمن...', 
    navNoRoute: 'لا يوجد مسار', navActive: 'توجيه', navSafe: 'تجنب الخطر', navFailed: 'فشل التوجيه',
    myLocation: 'موقعك<br/>(اسحب للتعديل)', destLocation: 'الوجهة',
    legendNav: 'ملاحة', legendCrash: 'حادث', legendJam: 'ازدحام', legendWork: 'أعمال', legendDisaster: 'كارثة',
    move: 'تحريك', zoom: 'تكبير/تصغير', backStart: 'بداية', setDest: 'تعيين الوجهة بالمركز (* للتجاوز)',
    locate: 'موقع', list: 'قائمة', report: 'إبلاغ',
    center: 'مركز', start: 'بداية', locating: 'جاري التحديد', mins: 'دقيقة'
  },
  'fr': {
    title: 'Trafic en direct (Nav sécurisée)',
    evtJam: 'Gros bouchon', evtCrash: 'Accident', evtWork: 'Travaux', evtDisaster: 'Catastrophe', evtDanger: 'Danger inconnu',
    navInit: 'Déplacer et appuyer [*] pour dest', navArrived: 'Arrivé à destination', navCalc: 'Calcul itinéraire sûr...', 
    navNoRoute: 'Aucun itinéraire', navActive: 'Navigation', navSafe: 'danger évité', navFailed: 'Échec calcul',
    myLocation: 'Votre position<br/>(Glisser pour ajuster)', destLocation: 'Destination',
    legendNav: 'Nav', legendCrash: 'Accident', legendJam: 'Bouchon', legendWork: 'Travaux', legendDisaster: 'Désastre',
    move: 'Déplacer', zoom: 'Zoom', backStart: 'Départ', setDest: 'Dest au centre (* pour écraser)',
    locate: 'Loc', list: 'Liste', report: 'Signaler',
    center: 'Centre', start: 'Départ', locating: 'Loc...', mins: 'min'
  },
  'pt': {
    title: 'Trânsito Real (Nav Segura)',
    evtJam: 'Congestionamento', evtCrash: 'Acidente', evtWork: 'Obras', evtDisaster: 'Desastre', evtDanger: 'Perigo',
    navInit: 'Mova e aperte [*] para destino', navArrived: 'Chegou ao destino', navCalc: 'Calculando rota segura...', 
    navNoRoute: 'Sem rota', navActive: 'Navegando', navSafe: 'perigo evitado', navFailed: 'Falha na rota',
    myLocation: 'Sua localização<br/>(Arraste para ajustar)', destLocation: 'Destino',
    legendNav: 'Nav', legendCrash: 'Acidente', legendJam: 'Congestão', legendWork: 'Obras', legendDisaster: 'Desastre',
    move: 'Mover', zoom: 'Zoom', backStart: 'Início', setDest: 'Destino no centro (* p/ sobrescrever)',
    locate: 'Loc', list: 'Lista', report: 'Relatar',
    center: 'Centro', start: 'Início', locating: 'Localizando', mins: 'min'
  },
  'vi': {
    title: 'Giao thông TT (Tránh vật cản)',
    evtJam: 'Tắc đường nghiêm trọng', evtCrash: 'Tai nạn', evtWork: 'Công trường', evtDisaster: 'Thiên tai', evtDanger: 'Nguy hiểm',
    navInit: 'Di chuyển & nhấn [*] chọn đích', navArrived: 'Đã đến đích', navCalc: 'Đang tính đường an toàn...', 
    navNoRoute: 'Không có đường', navActive: 'Đang chỉ đường', navSafe: 'tránh nguy hiểm', navFailed: 'Lỗi tính đường',
    myLocation: 'Vị trí của bạn<br/>(Kéo để sửa)', destLocation: 'Đích đến',
    legendNav: 'Dẫn đường', legendCrash: 'Tai nạn', legendJam: 'Tắc đường', legendWork: 'Thi công', legendDisaster: 'Thiên tai',
    move: 'Di chuyển', zoom: 'Thu phóng', backStart: 'Bắt đầu', setDest: 'Đặt đích ở giữa (* để ghi đè)',
    locate: 'Định vị', list: 'Danh sách', report: 'Báo cáo',
    center: 'Trung tâm', start: 'Bắt đầu', locating: 'Đang tìm', mins: 'phút'
  },
  'ha': {
    title: 'Trafik a Lokaci (Tukwici mai kyau)',
    evtJam: 'Cunkoson ababen hawa', evtCrash: 'Hatsarin mota', evtWork: 'Aikin hanya', evtDisaster: 'Bala\'i', evtDanger: 'Hadari',
    navInit: 'Matsa ka danna [*] don inda zaka', navArrived: 'An isa', navCalc: 'Ana lissafin hanya...', 
    navNoRoute: 'Babu hanya', navActive: 'Yin tukwici', navSafe: 'an kiyaye', navFailed: 'An gaza',
    myLocation: 'Wurinka<br/>(Ja don gyara)', destLocation: 'Inda zaka',
    legendNav: 'Tukwici', legendCrash: 'Hatsari', legendJam: 'Cunkoso', legendWork: 'Aiki', legendDisaster: 'Bala\'i',
    move: 'Matsa', zoom: 'Zuƙowa', backStart: 'Fara', setDest: 'Saka Cibiya don Inda zaka',
    locate: 'Wuri', list: 'Jeri', report: 'Rahoto',
    center: 'Cibiya', start: 'Fara', locating: 'Neman wuri', mins: 'min'
  },
  'sw': {
    title: 'Trafiki ya Moja kwa Moja (Njia Salama)',
    evtJam: 'Msongamano mkubwa', evtCrash: 'Ajali', evtWork: 'Ujenzi wa barabara', evtDisaster: 'Janga', evtDanger: 'Hatari',
    navInit: 'Sogeza na ubonyeze [*] kuweka kituo', navArrived: 'Umefika', navCalc: 'Inakokotoa njia salama...', 
    navNoRoute: 'Hakuna njia', navActive: 'Inaongoza', navSafe: 'hatari imezuiwa', navFailed: 'Imeshindwa',
    myLocation: 'Eneo lako<br/>(Buruta kurekebisha)', destLocation: 'Kituo',
    legendNav: 'Njia', legendCrash: 'Ajali', legendJam: 'Msongamano', legendWork: 'Ujenzi', legendDisaster: 'Janga',
    move: 'Sogeza', zoom: 'Kuza', backStart: 'Anza', setDest: 'Weka kituo katikati (* kufunika)',
    locate: 'Eneo', list: 'Orodha', report: 'Ripoti',
    center: 'Kituo', start: 'Anza', locating: 'Inatafuta', mins: 'dk'
  }
};

export type EventType = 
  | 'traffic_jam'        // 嚴重塞車 (深紅粗線)
  | 'car_crash'          // 發生車禍 (黑色粗線)
  | 'roadwork'           // 道路施工 (橘色粗線)
  | 'natural_disaster'   // 自然災害 (紫色圓圈)
  | 'unknown_danger';    // 不明危險 (黃色圓圈)

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

interface ApiMapInfoItem {
  id: number;
  created_at: string;
  latitude: number;
  longtitude: number;
  title: string | null;
  description: string | null;
  events: string | null;
}

const EVENT_PENALTY: Record<EventType, number> = {
  natural_disaster: 1000,
  car_crash: 800,
  roadwork: 300,
  traffic_jam: 200,
  unknown_danger: 150,
};

// 🌟 回報項目定義
const REPORT_OPTIONS = [
  { title: '發生車禍', event: 'car_crash' as EventType },
  { title: '嚴重塞車', event: 'traffic_jam' as EventType },
  { title: '道路施工', event: 'roadwork' as EventType },
  { title: '不明危險', event: 'unknown_danger' as EventType },
  { title: '自然災害', event: 'natural_disaster' as EventType },
];

export default function HomePage() {
  const router = useRouter();

  // 🌐 語言狀態管理
  const [langCode, setLangCode] = useState<string>('zh');

  // 🌟 單頁內嵌回報彈窗狀態（第二種解法核心）
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportIndex, setReportIndex] = useState<number>(0);
  const [reportStatus, setReportStatus] = useState<string>('請使用 2/5 鍵選擇，按 Enter 回報');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // 1. 定位 Hook
  const { 
    location: geoCoords, 
    loading: geoLoading, 
    errorMsg: geoError,
    updateLocation 
  } = useGeolocation({
    autoFetch: true,
  });

  // 目前自身位置
  const userLocationRef = useRef<{ lat: number; lng: number }>({
    lat: 24.7936,
    lng: 120.9917,
  });

  const [currentZoom, setCurrentZoom] = useState<number>(17);
  const [viewCenter, setViewCenter] = useState<{ lat: number; lng: number }>({
    lat: 24.7936,
    lng: 120.9917,
  });

  // 存放事件
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const eventsRef = useRef<TrafficEvent[]>([]);
  eventsRef.current = events;

  const [cloudReports, setCloudReports] = useState<ApiMapInfoItem[]>([]);
  
  // 目的地狀態
  const [navStatus, setNavStatus] = useState<string>('');
  const navDestinationRef = useRef<{ lat: number; lng: number } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const eventLayerGroupRef = useRef<any>(null);
  const navLayerGroupRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  const hasInitializedCenterRef = useRef<boolean>(false);

  // 初始化語系與在線狀態
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
      setIsOnline(navigator.onLine);
    }
  }, []);

  const t = translations[langCode as keyof typeof translations] || translations['zh'];

  const getLocalizedEventTitle = (type: EventType) => {
    switch (type) {
      case 'traffic_jam': return t.evtJam;
      case 'car_crash': return t.evtCrash;
      case 'roadwork': return t.evtWork;
      case 'natural_disaster': return t.evtDisaster;
      default: return t.evtDanger;
    }
  };

  const getDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const drawNavRoute = (path: [number, number][]) => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    if (!navLayerGroupRef.current) {
      navLayerGroupRef.current = L.layerGroup().addTo(map);
    }
    navLayerGroupRef.current.clearLayers();

    const navPolyline = L.polyline(path, {
      color: '#2563eb',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    });
    navPolyline.addTo(navLayerGroupRef.current);
  };

  const planSafeNavigation = async (
    start: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    currentEvents: TrafficEvent[]
  ) => {
    if (getDistanceMeters(start.lat, start.lng, destination.lat, destination.lng) < 10) {
      setNavStatus(t.navArrived);
      if (navLayerGroupRef.current) navLayerGroupRef.current.clearLayers();
      return;
    }

    setNavStatus(t.navCalc);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&alternatives=3`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('路由請求失敗');

      const data = await res.json();
      if (!data.routes || data.routes.length === 0) {
        setNavStatus(t.navNoRoute);
        return;
      }

      let bestRoute = data.routes[0];
      let lowestPenaltyScore = Infinity;

      data.routes.forEach((route: any) => {
        const routeCoords: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );

        let totalPenalty = route.duration;

        currentEvents.forEach((ev) => {
          const hitRadius = (ev.radius || 30) + 10;
          const hasConflict = routeCoords.some(([rLat, rLng]) => {
            return getDistanceMeters(rLat, rLng, ev.lat, ev.lng) <= hitRadius;
          });

          if (hasConflict) {
            totalPenalty += EVENT_PENALTY[ev.eventType] || 200;
          }
        });

        if (totalPenalty < lowestPenaltyScore) {
          lowestPenaltyScore = totalPenalty;
          bestRoute = route;
        }
      });

      const bestPath: [number, number][] = bestRoute.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]]
      );

      drawNavRoute(bestPath);

      const distanceKm = (bestRoute.distance / 1000).toFixed(1);
      const minutes = Math.ceil(bestRoute.duration / 60);
      setNavStatus(`${t.navActive}: ${distanceKm}km (${minutes}${t.mins}，${t.navSafe})`);
    } catch {
      setNavStatus(t.navFailed);
    }
  };

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
    } catch {
      return [];
    }
  };

  const drawLayers = (eventList: TrafficEvent[]) => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    if (!eventLayerGroupRef.current) {
      eventLayerGroupRef.current = L.layerGroup().addTo(map);
    }
    eventLayerGroupRef.current.clearLayers();

    // 1. 半透明警戒圓
    eventList.forEach((item) => {
      const displayTitle = getLocalizedEventTitle(item.eventType);
      if (item.eventType === 'natural_disaster' || item.eventType === 'unknown_danger') {
        const color = item.eventType === 'natural_disaster' ? '#7c3aed' : '#ca8a04';
        L.circle([item.lat, item.lng], {
          color,
          fillColor: color,
          fillOpacity: 0.5,
          radius: item.radius || 30,
          weight: 2.5,
        }).bindPopup(`<b>${displayTitle}</b><br/>${item.description || ''}`).addTo(eventLayerGroupRef.current);
      }
    });

    // 2. 塞車與施工折線
    eventList.forEach((item) => {
      const displayTitle = getLocalizedEventTitle(item.eventType);
      if ((item.eventType === 'traffic_jam' || item.eventType === 'roadwork') && item.paths) {
        const color = item.eventType === 'traffic_jam' ? '#b91c1c' : '#ea580c';
        item.paths.forEach((roadCoords) => {
          L.polyline(roadCoords, {
            color,
            weight: 5,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          }).bindPopup(`<b>${displayTitle}</b><br/>${item.description || ''}`).addTo(eventLayerGroupRef.current);
        });
      }
    });

    // 3. 車禍折線
    eventList.forEach((item) => {
      const displayTitle = getLocalizedEventTitle(item.eventType);
      if (item.eventType === 'car_crash' && item.paths) {
        item.paths.forEach((roadCoords) => {
          L.polyline(roadCoords, {
            color: '#000000',
            weight: 5.5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }).bindPopup(`<b>💥 ${displayTitle}</b><br/>${item.description || ''}`).addTo(eventLayerGroupRef.current);
        });
      }
    });

    // 4. 中心標記點
    eventList.forEach((item) => {
      const displayTitle = getLocalizedEventTitle(item.eventType);
      const isCrash = item.eventType === 'car_crash';
      const dotColors: Record<EventType, string> = {
        traffic_jam: '#991b1b',
        roadwork: '#ea580c',
        natural_disaster: '#7c3aed',
        unknown_danger: '#ca8a04',
        car_crash: '#000000',
      };

      L.circleMarker([item.lat, item.lng], {
        radius: isCrash ? 4.5 : 4,
        fillColor: dotColors[item.eventType],
        color: '#ffffff',
        weight: 1.5,
        fillOpacity: 1,
      }).bindPopup(`<b>${displayTitle}</b><br/>${item.description || ''}`).addTo(eventLayerGroupRef.current);
    });
  };

  useEffect(() => {
    if (eventsRef.current.length > 0) {
      drawLayers(eventsRef.current);
    }
    if (markerRef.current) markerRef.current.bindPopup(t.myLocation);
    if (destMarkerRef.current) destMarkerRef.current.bindPopup(`🏁 ${t.destLocation}`);
  }, [langCode]);

  const parseEventType = (
    title: string, 
    eventsField: string
  ): { type: EventType; radius: number } => {
    const t_str = title.trim();
    const e_str = eventsField.trim().toLowerCase();

    if (t_str.includes('塞車') || e_str === 'traffic_jam' || e_str === 'traffic') return { type: 'traffic_jam', radius: 45 };
    if (t_str.includes('車禍') || e_str === 'car_crash' || e_str === 'accident') return { type: 'car_crash', radius: 16 };
    if (t_str.includes('施工') || e_str === 'roadwork') return { type: 'roadwork', radius: 28 };
    if (t_str.includes('災害') || e_str === 'natural_disaster') return { type: 'natural_disaster', radius: 35 };
    return { type: 'unknown_danger', radius: 30 };
  };

  const fetchAndProcessEvents = async (currentEvents: TrafficEvent[]) => {
    try {
      const res = await fetch('/api/mapinfo');
      if (!res.ok) return;

      const apiData: ApiMapInfoItem[] = await res.json();
      setCloudReports(apiData);

      const mappedEvents: TrafficEvent[] = apiData.map((item, idx) => {
        const { type, radius } = parseEventType(item.title || '', item.events || '');
        const uniqueKey = `ev-${item.latitude.toFixed(5)}-${item.longtitude.toFixed(5)}-${idx}`;
        const existingEvent = currentEvents.find((e) => e.key === uniqueKey);

        return {
          key: uniqueKey,
          lat: item.latitude,
          lng: item.longtitude,
          eventType: type,
          title: item.title || '',
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

      if (navDestinationRef.current) {
        planSafeNavigation(userLocationRef.current, navDestinationRef.current, resolvedEvents);
      }
    } catch (error) {
      console.error('抓取 /api/mapinfo 失敗:', error);
    }
  };

  useEffect(() => {
    fetchAndProcessEvents([]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAndProcessEvents(eventsRef.current);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // 🌟 背景檢查與自動同步離線佇列
  const updatePendingCount = () => {
    if (typeof window === 'undefined') return;
    try {
      const queue = JSON.parse(localStorage.getItem('offline_reports') || '[]');
      setPendingSyncCount(Array.isArray(queue) ? queue.length : 0);
    } catch {
      setPendingSyncCount(0);
    }
  };

  const handleOnlineAutoSync = async () => {
    setIsOnline(true);
    const raw = localStorage.getItem('offline_reports');
    if (!raw) return;

    let queue: any[] = [];
    try {
      queue = JSON.parse(raw);
    } catch {
      return;
    }

    if (queue.length === 0) return;

    console.log(`連線恢復，自動補送 ${queue.length} 筆回報...`);
    try {
      for (const item of queue) {
        await fetch('/api/newMapinfo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      }
      localStorage.removeItem('offline_reports');
      setPendingSyncCount(0);
      alert(`已恢復連線！自動同步了 ${queue.length} 筆離線回報。`);
      fetchAndProcessEvents(eventsRef.current);
    } catch (e) {
      console.error('自動補送失敗，留待下次重試:', e);
    }
  };

  useEffect(() => {
    updatePendingCount();
    const onOnline = () => handleOnlineAutoSync();
    const onOffline = () => {
      setIsOnline(false);
      updatePendingCount();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    if (navigator.onLine) {
      handleOnlineAutoSync();
    }

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // 🌟 單頁回報送出邏輯（完全在本地執行，有網打 API，沒網直接存 localStorage）
  const submitQuickReport = async (option: typeof REPORT_OPTIONS[0]) => {
    if (isSubmittingReport) return;
    setIsSubmittingReport(true);
    setReportStatus('處理中，請稍候...');

    const payload = {
      longtitude: userLocationRef.current.lng,
      latitude: userLocationRef.current.lat,
      title: option.title,
      description: '透過實體按鍵手機回報',
      events: option.event,
      created_at: new Date().toISOString(),
    };

    // 斷網情況：直接存入本地 localStorage，絕不跳恐龍
    if (!navigator.onLine) {
      try {
        const queue = JSON.parse(localStorage.getItem('offline_reports') || '[]');
        queue.push(payload);
        localStorage.setItem('offline_reports', JSON.stringify(queue));
        updatePendingCount();
        setReportStatus('📦 離線模式：回報已暫存至本地！');
      } catch {
        setReportStatus('暫存失敗');
      }

      setTimeout(() => {
        setIsSubmittingReport(false);
        setShowReportModal(false);
        setReportStatus('請使用 2/5 鍵選擇，按 Enter 回報');
      }, 1500);
      return;
    }

    // 連線正常：直接打 API
    try {
      const res = await fetch('/api/newMapinfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setReportStatus(`回報成功：${option.title}`);
        fetchAndProcessEvents(eventsRef.current);
      } else {
        setReportStatus(`回報失敗: ${data.error || '伺服器異常'}`);
      }
    } catch {
      // 網路突然中斷時降級回暫存
      const queue = JSON.parse(localStorage.getItem('offline_reports') || '[]');
      queue.push(payload);
      localStorage.setItem('offline_reports', JSON.stringify(queue));
      updatePendingCount();
      setReportStatus('⚠️ 連線中斷，已轉存為離線回報');
    }

    setTimeout(() => {
      setIsSubmittingReport(false);
      setShowReportModal(false);
      setReportStatus('請使用 2/5 鍵選擇，按 Enter 回報');
    }, 1500);
  };

  // 初始化 Leaflet
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
        marker.bindPopup(t.myLocation);
        markerRef.current = marker;

        marker.on('dragend', function (e: any) {
          const position = e.target.getLatLng();
          userLocationRef.current = { lat: position.lat, lng: position.lng };
          updateLocation(position.lat, position.lng);
          if (navDestinationRef.current) {
            planSafeNavigation(position, navDestinationRef.current, eventsRef.current);
          }
        });

        drawLayers(eventsRef.current);

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
  }, [updateLocation, t.myLocation, t.destLocation]);

  // 🌟 按鍵控制：根據是否開啟彈窗進行事件分流
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 情況 A：彈窗已開啟時，按鍵專注於選單導航與送出
      if (showReportModal) {
        if (isSubmittingReport) return;

        if (e.key === 'ArrowUp' || e.key === '2') {
          e.preventDefault();
          setReportIndex((prev) => (prev > 0 ? prev - 1 : REPORT_OPTIONS.length - 1));
        } else if (e.key === 'ArrowDown' || e.key === '5') {
          e.preventDefault();
          setReportIndex((prev) => (prev < REPORT_OPTIONS.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          submitQuickReport(REPORT_OPTIONS[reportIndex]);
        } else if (e.key === '0') {
          e.preventDefault();
          setShowReportModal(false); // 取消並關閉彈窗
        }
        return; // 攔截其他地圖按鍵
      }

      // 情況 B：正常地圖瀏覽狀態
      if (e.key === '8') {
        e.preventDefault();
        router.push('/list');
        return;
      }

      // 🌟 [9] 鍵：原地開啟彈窗，絕不呼叫 router.push('/report')
      if (e.key === '9') {
        e.preventDefault();
        setShowReportModal(true);
        return;
      }

      const map = mapInstanceRef.current;
      const L = leafletRef.current;
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

        hasInitializedCenterRef.current = true;
        if (navDestinationRef.current) {
          planSafeNavigation(center, navDestinationRef.current, eventsRef.current);
        }
      }

      if (e.key === '*' || e.key === 'Enter') {
        e.preventDefault();
        const center = map.getCenter();
        const dest = { lat: center.lat, lng: center.lng };
        navDestinationRef.current = dest;

        if (L) {
          if (destMarkerRef.current) {
            destMarkerRef.current.setLatLng([dest.lat, dest.lng]);
          } else {
            const destMarker = L.circleMarker([dest.lat, dest.lng], {
              radius: 6,
              fillColor: '#16a34a',
              color: '#ffffff',
              weight: 2,
              fillOpacity: 1,
            }).addTo(map);
            destMarker.bindPopup(`🏁 ${t.destLocation}`);
            destMarkerRef.current = destMarker;
          }
        }

        planSafeNavigation(userLocationRef.current, dest, eventsRef.current);
      }

      if (e.key === '0') {
        e.preventDefault();
        map.panTo([userLocationRef.current.lat, userLocationRef.current.lng], { animate: true });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showReportModal, reportIndex, isSubmittingReport, router, updateLocation, t.destLocation]);

  return (
    <main
      dir={langCode === 'ar' ? 'rtl' : 'ltr'}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '240px',
        height: '100vh',
        maxHeight: '320px',
        margin: '0 auto',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: '4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      {/* 頂部標題與離線提示列 */}
      <div style={{ flexShrink: 0, textAlign: 'center', width: '100%' }}>
        <h2
          suppressHydrationWarning
          style={{ fontSize: '13px', fontWeight: 'bold', margin: '2px 0', color: '#000000' }}
        >
          {t.title}
        </h2>

        {(!isOnline || pendingSyncCount > 0) && (
          <div
            style={{
              fontSize: '9px',
              backgroundColor: isOnline ? '#fef3c7' : '#fee2e2',
              color: isOnline ? '#92400e' : '#991b1b',
              padding: '1px 4px',
              borderRadius: '3px',
              fontWeight: 'bold',
              marginBottom: '2px',
              border: `1px solid ${isOnline ? '#fcd34d' : '#fca5a5'}`
            }}
          >
            {!isOnline ? `⚠️ 離線狀態 (待同步: ${pendingSyncCount})` : `🔄 恢復連線：同步中 (${pendingSyncCount})`}
          </div>
        )}
      </div>

      {/* 地圖容器與預警提示 */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            flex: 1,
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 1,
          }}
        />
        <ProximityAlert location={userLocationRef.current} reports={cloudReports} />
      </div>

      {/* 導航狀態欄 */}
      <div style={{
        flexShrink: 0,
        width: '220px',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '4px',
        padding: '1px 3px',
        marginTop: '3px',
        fontSize: '9px',
        color: '#1d4ed8',
        fontWeight: 600,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {navStatus || t.navInit}
      </div>

      {/* 底部操作與資訊區 */}
      <div style={{ flexShrink: 0, width: '220px', textAlign: 'center', marginTop: '2px' }}>
        <div style={{ fontSize: '9px', color: '#374151', lineHeight: '1.2' }}>
          <span style={{ color: '#2563eb' }}>▬ {t.legendNav}</span> | 
          <span style={{ color: '#000000' }}>■ {t.legendCrash}</span> | 
          <span style={{ color: '#b91c1c' }}>■ {t.legendJam}</span> | 
          <span style={{ color: '#ea580c' }}>■ {t.legendWork}</span> | 
          <span style={{ color: '#7c3aed' }}>● {t.legendDisaster}</span>
        </div>

        <div style={{ fontSize: '10px', color: '#374151', marginTop: '2px', lineHeight: '1.3' }}>
          <p><strong>[2/4/5/6]</strong> {t.move} | <strong>[1/3]</strong> {t.zoom} | <strong>[0]</strong> {t.backStart}</p>
          <p style={{ color: '#16a34a' }}><strong>[*]</strong> {t.setDest}</p>
          <p style={{ color: '#dc2626', marginTop: '1px' }}>
            <strong>[7]</strong> {t.locate} | <strong>[8]</strong> {t.list} | <strong>[9]</strong> {t.report}
          </p>
        </div>

        <div style={{ fontSize: '9px', marginTop: '1px', color: '#4b5563', lineHeight: '1.2' }}>
          <p>{t.center}：{viewCenter.lat.toFixed(4)}, {viewCenter.lng.toFixed(4)}</p>
          <p>
            {t.start}：{userLocationRef.current.lat.toFixed(4)}, {userLocationRef.current.lng.toFixed(4)}
            {geoLoading && <span style={{ color: '#2563eb' }}> ({t.locating})</span>}
            {geoError && <span style={{ color: '#dc2626' }}> ({geoError})</span>}
          </p>
        </div>
      </div>

      {/* 🌟 核心第二解法 UI：完全在本地記憶體中的單頁回報彈窗 */}
      {showReportModal && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            zIndex: 9999, // 蓋在 Leaflet 之上
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '6px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ flexShrink: 0, textAlign: 'center', width: '100%' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 'bold', margin: '2px 0', color: '#000000' }}>
              狀況回報選單
            </h2>
            <div style={{ fontSize: '10px', color: isSubmittingReport ? '#2563eb' : '#dc2626', fontWeight: 'bold', marginBottom: '4px' }}>
              {reportStatus}
            </div>
          </div>

          {/* 選項列表 */}
          <div
            style={{
              width: '210px',
              flex: 1,
              overflowY: 'auto',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: '#f9fafb',
              padding: '4px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {REPORT_OPTIONS.map((opt, idx) => {
              const isSelected = idx === reportIndex;
              return (
                <div
                  key={opt.event}
                  onClick={() => {
                    setReportIndex(idx);
                    submitQuickReport(opt);
                  }}
                  style={{
                    padding: '6px 8px',
                    backgroundColor: isSelected ? '#000000' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#000000',
                    border: isSelected ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: '4px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                >
                  <span style={{ marginRight: '8px', opacity: 0.7 }}>[{idx + 1}]</span>
                  <span>{opt.title}</span>
                </div>
              );
            })}
          </div>

          {/* 操作說明與取消鍵 */}
          <div style={{ flexShrink: 0, width: '210px', marginTop: '6px' }}>
            <div style={{ fontSize: '10px', color: '#4b5563', marginBottom: '4px', textAlign: 'center' }}>
              <strong>[2/↑] [5/↓]</strong> 選擇 | <strong>[Enter]</strong> 送出
            </div>
            <div
              onClick={() => setShowReportModal(false)}
              style={{
                cursor: 'pointer',
                width: '100%',
                boxSizing: 'border-box',
                padding: '4px 8px',
                backgroundColor: '#fee2e2',
                border: '1px solid #f87171',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: '#dc2626', color: '#ffffff', padding: '1px 5px', borderRadius: '3px', marginRight: '8px' }}>
                [ 0 ]
              </span>
              <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: 'bold' }}>
                取消返回地圖
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}