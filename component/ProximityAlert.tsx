'use client';

import { useState, useEffect, useRef } from 'react';

// 簡單計算距離與方位（用來在彈窗上顯示「距離幾公尺、方位」給駕駛看）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getBearingText(lat1: number, lon1: number, lat2: number, lon2: number) {
  const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;

  if (brng >= 337.5 || brng < 22.5) return '正前方';
  if (brng >= 22.5 && brng < 67.5) return '右前方';
  if (brng >= 67.5 && brng < 112.5) return '正右方';
  if (brng >= 112.5 && brng < 157.5) return '右後方';
  if (brng >= 157.5 && brng < 202.5) return '正後方';
  if (brng >= 202.5 && brng < 247.5) return '左後方';
  if (brng >= 247.5 && brng < 292.5) return '正左方';
  return '左前方';
}

function getTimeAgo(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return '剛剛';
  return `${diffMins} 分鐘前`;
}

interface ProximityAlertProps {
  location: { lat: number; lng: number } | null;
  reports: Array<{
    id: number;
    latitude: number;
    longtitude: number;
    title: string;
    description?: string;
    created_at?: string;
  }>;
}

export default function ProximityAlert({ location, reports }: ProximityAlertProps) {
  const [alertItem, setAlertItem] = useState<any>(null);
  const [otherCount, setOtherCount] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  
  // 記錄上一輪彈出的事件 ID，避免同一筆資料重複閃爍
  const lastAlertedIdRef = useRef<number | null>(null);

  useEffect(() => {
    // 如果沒有定位，或是後端回傳的清單是空的，就關閉警告
    if (!reports || reports.length === 0) {
      setIsVisible(false);
      return;
    }

    // 依照時間排序，抓取後端回傳清單中「最新的一筆」（最後一個）
    const sortedReports = [...reports].sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    });

    const latest = sortedReports[0];

    // 如果有使用者座標，順便計算距離與方位顯示在畫面上；沒有的話就直接顯示後端給的座標
    let distance = 0;
    let bearing = '前方';
    if (location) {
      const rLng = latest.longtitude || (latest as any).longitude;
      distance = Math.round(calculateDistance(location.lat, location.lng, latest.latitude, rLng));
      bearing = getBearingText(location.lat, location.lng, latest.latitude, rLng);
    }

    const formattedAlert = {
      ...latest,
      distance,
      bearing,
      timeAgo: getTimeAgo(latest.created_at || new Date().toISOString()),
    };

    setAlertItem(formattedAlert);
    setOtherCount(sortedReports.length - 1); // 還有幾筆其他狀況

    // 如果這是一筆「新的」危險狀況，就讓它在畫面上閃現 4 秒
    if (lastAlertedIdRef.current !== latest.id) {
      lastAlertedIdRef.current = latest.id;
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false); // 4 秒後自動消失
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [reports, location]);

  // 如果不在顯示狀態或是沒有資料，就不渲染
  if (!isVisible || !alertItem) return null;

  const displayLng = alertItem.longtitude || alertItem.longitude;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9999,
      width: '210px',
      backgroundColor: '#000000',
      color: '#ffffff',
      border: '3px solid #dc2626',
      borderRadius: '6px',
      padding: '10px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ef4444', marginBottom: '2px' }}>
        [警告] 前方有狀況！
      </div>
      
      {/* 數字標記：提示還有其他幾筆，可以按 8 看列表 */}
      {otherCount > 0 && (
        <div style={{ fontSize: '10px', color: '#fca5a5', marginBottom: '4px' }}>
          (附近還有另外 {otherCount} 筆，可按 <strong style={{color: '#fff'}}>8</strong> 看列表)
        </div>
      )}

      <div style={{ fontSize: '15px', fontWeight: 'bold', margin: '4px 0', color: '#ffffff' }}>
        {alertItem.title}
      </div>
      <div style={{ fontSize: '11px', color: '#e5e7eb', lineHeight: '1.4', textAlign: 'left', paddingLeft: '8px' }}>
        距離：約 {alertItem.distance} 公尺 ({alertItem.bearing})<br />
        座標：{alertItem.latitude.toFixed(4)}, {displayLng.toFixed(4)}<br />
        時間：{alertItem.timeAgo}回報
      </div>
      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px', borderTop: '1px dashed #4b5563', paddingTop: '4px' }}>
        請放慢車速注意安全
      </div>
    </div>
  );
}