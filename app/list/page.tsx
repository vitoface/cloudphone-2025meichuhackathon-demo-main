'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// 🌟 路徑改為 @/component/useGeolocation
import { useGeolocation } from '@/component/useGeolocation'; 

// ==========================================
// 🌐 多國語言字典 (i18n Translations)
// ==========================================
const translations = {
  'zh': {
    title: '周遭路況列表',
    controls: '[2]上滑 [5]下滑 | [0]返回',
    locating: '定位中...',
    loading: '載入路況中...',
    noEvents: '周遭暫無突發路況',
    coord: '座標',
    back: '返回地圖',
    backLabel: '按數字鍵 0，返回地圖',
    distPrefix: '距離',
    unitKm: '公里',
    evtCrash: { label: '發生車禍', prefix: '[嚴重]' },
    evtJam: { label: '嚴重塞車', prefix: '[提醒]' },
    evtWork: { label: '道路施工', prefix: '[注意]' },
    evtDanger: { label: '不明危險', prefix: '[危險]' },
    evtDisaster: { label: '天災路況', prefix: '[警戒]' },
    evtDefault: { label: '一般事件', prefix: '[提醒]' }
  },
  'en': {
    title: 'Nearby Traffic',
    controls: '[2]Up [5]Down | [0]Back',
    locating: 'Locating...',
    loading: 'Loading events...',
    noEvents: 'No events nearby',
    coord: 'Coord',
    back: 'Back to Map',
    backLabel: 'Press 0 to go back to Map',
    distPrefix: 'Dist',
    unitKm: 'km',
    evtCrash: { label: 'Car Crash', prefix: '[Severe]' },
    evtJam: { label: 'Traffic Jam', prefix: '[Alert]' },
    evtWork: { label: 'Roadwork', prefix: '[Notice]' },
    evtDanger: { label: 'Danger', prefix: '[Danger]' },
    evtDisaster: { label: 'Disaster', prefix: '[Warning]' },
    evtDefault: { label: 'General', prefix: '[Notice]' }
  },
  'ar': { // 阿拉伯文
    title: 'حركة المرور القريبة',
    controls: '[2]أعلى [5]أسفل | [0]رجوع',
    locating: 'تحديد الموقع...',
    loading: 'جاري التحميل...',
    noEvents: 'لا توجد أحداث',
    coord: 'إحداثيات',
    back: 'رجوع للخريطة',
    backLabel: 'اضغط 0 للرجوع للخريطة',
    distPrefix: 'بعد',
    unitKm: 'كم',
    evtCrash: { label: 'حادث سير', prefix: '[شديد]' },
    evtJam: { label: 'ازدحام', prefix: '[تنبيه]' },
    evtWork: { label: 'أعمال طرق', prefix: '[ملاحظة]' },
    evtDanger: { label: 'خطر مجهول', prefix: '[خطر]' },
    evtDisaster: { label: 'كارثة', prefix: '[تحذير]' },
    evtDefault: { label: 'عام', prefix: '[تنبيه]' }
  },
  'fr': { // 法文
    title: 'Trafic à proximité',
    controls: '[2]Haut [5]Bas | [0]Retour',
    locating: 'Localisation...',
    loading: 'Chargement...',
    noEvents: 'Aucun événement',
    coord: 'Coord',
    back: 'Retour carte',
    backLabel: 'Appuyez sur 0 pour revenir',
    distPrefix: 'Dist',
    unitKm: 'km',
    evtCrash: { label: 'Accident', prefix: '[Grave]' },
    evtJam: { label: 'Bouchon', prefix: '[Alerte]' },
    evtWork: { label: 'Travaux', prefix: '[Info]' },
    evtDanger: { label: 'Danger', prefix: '[Danger]' },
    evtDisaster: { label: 'Désastre', prefix: '[Avert]' },
    evtDefault: { label: 'Général', prefix: '[Info]' }
  },
  'pt': { // 葡萄牙文
    title: 'Trânsito Próximo',
    controls: '[2]Cima [5]Baixo | [0]Voltar',
    locating: 'Localizando...',
    loading: 'Carregando...',
    noEvents: 'Sem eventos',
    coord: 'Coord',
    back: 'Voltar ao Mapa',
    backLabel: 'Pressione 0 para voltar',
    distPrefix: 'Dist',
    unitKm: 'km',
    evtCrash: { label: 'Acidente', prefix: '[Grave]' },
    evtJam: { label: 'Congestão', prefix: '[Alerta]' },
    evtWork: { label: 'Obras', prefix: '[Aviso]' },
    evtDanger: { label: 'Perigo', prefix: '[Perigo]' },
    evtDisaster: { label: 'Desastre', prefix: '[Aviso]' },
    evtDefault: { label: 'Geral', prefix: '[Aviso]' }
  },
  'vi': { // 越南文
    title: 'Giao thông gần đây',
    controls: '[2]Lên [5]Xuống | [0]Về',
    locating: 'Đang định vị...',
    loading: 'Đang tải...',
    noEvents: 'Không có sự kiện',
    coord: 'Tọa độ',
    back: 'Về Bản đồ',
    backLabel: 'Nhấn phím 0 để về Bản đồ',
    distPrefix: 'Cách',
    unitKm: 'km',
    evtCrash: { label: 'Tai nạn', prefix: '[Nghiêm trọng]' },
    evtJam: { label: 'Tắc đường', prefix: '[Báo động]' },
    evtWork: { label: 'Thi công', prefix: '[Lưu ý]' },
    evtDanger: { label: 'Nguy hiểm', prefix: '[Nguy hiểm]' },
    evtDisaster: { label: 'Thiên tai', prefix: '[Cảnh báo]' },
    evtDefault: { label: 'Chung', prefix: '[Lưu ý]' }
  },
  'ha': { // 豪薩語
    title: 'Trafik a Kusa',
    controls: '[2]Sama [5]Ƙasa | [0]Koma',
    locating: 'Nemo wuri...',
    loading: 'Ana lodi...',
    noEvents: 'Babu alama',
    coord: 'Tsari',
    back: 'Koma Taswira',
    backLabel: 'Danna 0 don komawa',
    distPrefix: 'Nisa',
    unitKm: 'km',
    evtCrash: { label: 'Hatsari', prefix: '[Tsananin]' },
    evtJam: { label: 'Cunkoso', prefix: '[Gargaɗi]' },
    evtWork: { label: 'Aiki', prefix: '[Lura]' },
    evtDanger: { label: 'Hadari', prefix: '[Hadari]' },
    evtDisaster: { label: 'Bala\'i', prefix: '[Gargaɗi]' },
    evtDefault: { label: 'Gaba ɗaya', prefix: '[Lura]' }
  },
  'sw': { // 斯瓦希里語
    title: 'Trafiki Karibu',
    controls: '[2]Juu [5]Chini | [0]Rudi',
    locating: 'Inatafuta...',
    loading: 'Inapakia...',
    noEvents: 'Hakuna matukio',
    coord: 'Kuratibu',
    back: 'Rudi Ramani',
    backLabel: 'Bonyeza 0 kurudi',
    distPrefix: 'Umbali',
    unitKm: 'km',
    evtCrash: { label: 'Ajali', prefix: '[Kubwa]' },
    evtJam: { label: 'Msongamano', prefix: '[Tahadhari]' },
    evtWork: { label: 'Ujenzi', prefix: '[Taarifa]' },
    evtDanger: { label: 'Hatari', prefix: '[Hatari]' },
    evtDisaster: { label: 'Janga', prefix: '[Onyo]' },
    evtDefault: { label: 'Kawaida', prefix: '[Taarifa]' }
  }
};

interface MapInfoItem {
  id: string | number;
  created_at: string;
  events: string | null;
  latitude: number;
  longtitude: number;
  description?: string;
}

// 保留過濾用的合法事件清單
const VALID_EVENTS = ['car_crash', 'traffic_jam', 'roadwork', 'unknown_danger', 'natural_disaster'];

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

// 支援多國語言的距離格式化
function formatDistance(distanceKm: number, prefixLabel: string): string {
  if (distanceKm < 1) {
    return `${prefixLabel} ${Math.round(distanceKm * 1000)}m`;
  }
  return `${prefixLabel} ${distanceKm.toFixed(1)}km`;
}

export default function ListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<(MapInfoItem & { distance?: number })[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  
  // 🌐 語言狀態管理
  const [langCode, setLangCode] = useState<string>('zh');
  
  // 用於綁定中間的列表容器，以程式化方式控制捲動
  const scrollRef = useRef<HTMLDivElement>(null);

  const { location, errorMsg, loading: geoLoading } = useGeolocation({ autoFetch: true });

  // 🌐 初始化抓取使用者系統語言
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const navLang = navigator.language.split('-')[0].toLowerCase();
      if (navigator.language.toLowerCase().startsWith('zh')) {
        setLangCode('zh');
      } else if (translations[navLang as keyof typeof translations]) {
        setLangCode(navLang);
      } else {
        setLangCode('en'); // 找不到支援的語言時，強制使用英文
      }
    }
  }, []);

  const t = translations[langCode as keyof typeof translations] || translations['zh'];

  // 動態獲取本地化的事件標籤與顏色
  const getEventConfig = (type: string) => {
    switch (type) {
      case 'car_crash': return { ...t.evtCrash, color: '#dc2626' };
      case 'traffic_jam': return { ...t.evtJam, color: '#ea580c' };
      case 'roadwork': return { ...t.evtWork, color: '#d97706' };
      case 'unknown_danger': return { ...t.evtDanger, color: '#e11d48' };
      case 'natural_disaster': return { ...t.evtDisaster, color: '#7c3aed' };
      default: return { ...t.evtDefault, color: '#374151' };
    }
  };

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
        .filter((item) => item.events && VALID_EVENTS.includes(item.events))
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
      dir={langCode === 'ar' ? 'rtl' : 'ltr'} // 🌟 自動支援阿拉伯文的右到左排版
      style={{
        width: '100%',
        maxWidth: '240px',          // 最大寬度保護
        height: '320px',            // 直接鎖定 320px 高度
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
        {t.title}
      </h2>
      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>
        {t.controls}
      </div>

      {/* 模擬手機大小的顯示容器 (列表區) */}
      <div
        ref={scrollRef}
        aria-live="polite" // 🌟 關鍵 3：當內容變化時，系統朗讀新狀態
        style={{
          width: '210px',           // 與圖二相同的 210px 寬度
          flex: 1,                  // 自動填滿標題與底部按鈕之間的剩餘空間
          overflowY: 'scroll',      // 保持可滾動特性
          scrollbarWidth: 'none',  // Firefox 隱藏捲軸
          msOverflowStyle: 'none', // IE/Edge 隱藏捲軸
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
            {geoLoading ? t.locating : t.loading}
          </div>
        ) : events.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#6b7280', padding: '16px', textAlign: 'center' }}>
            {t.noEvents}
          </div>
        ) : (
          events.map((item, index) => {
            const config = getEventConfig(item.events || '');

            // 準備給支援 ARIA 的引擎讀的完美白話文
            const distText = item.distance ? `，${t.distPrefix} ${item.distance.toFixed(1)} ${t.unitKm}` : '';
            const speakText = `第 ${index + 1} 筆，${config.label}${distText}`;

            return (
              // 🌟 關鍵修改：將 div 改為 button，並確保樣式被重置，完美兼容 Kingvoice
              <button
                key={item.id}
                tabIndex={0} // 🌟 關鍵 1：讓上下鍵可以 Focus 到這張卡片
                aria-label={speakText} // 🌟 關鍵 2：朗讀優先文案
                style={{
                  display: 'block',     // 確保按鈕表現像區塊元素
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '6px 8px',
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb', // 內層卡片加一點邊框
                  borderRadius: '4px',
                  textAlign: 'left',
                  flexShrink: 0, // 確保卡片不會因為 flex 空間不夠而被擠壓變形
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  appearance: 'none',
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: config.color, fontWeight: 'bold' }}>
                    {config.prefix} {config.label}
                  </span>
                  {item.distance !== undefined && (
                    <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: '#e5e7eb', color: '#374151', padding: '2px 4px', borderRadius: '3px' }}>
                      {formatDistance(item.distance, t.distPrefix)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#4b5563' }}>
                  {item.description || `${t.coord}: ${item.latitude.toFixed(3)}, ${item.longtitude.toFixed(3)}`}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 底部取消按鈕 */}
      <button
        onClick={() => router.push('/')}
        tabIndex={0}
        aria-label={t.backLabel}
        style={{
          display: 'flex',
          appearance: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          flexShrink: 0,           // 關鍵：防止被壓縮或推擠出畫面
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
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#dc2626', color: '#ffffff', padding: '2px 6px', borderRadius: '3px', marginRight: '10px' }}>
          [ 0 ]
        </span>
        <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: 'bold' }}>
          {t.back}
        </span>
      </button>
    </main>
  );
}