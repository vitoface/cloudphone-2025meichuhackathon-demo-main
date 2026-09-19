'use client';

import { useState, useEffect, useRef } from 'react';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface ProximityReport {
  id: number | string;
  latitude: number;
  longtitude?: number;
  longitude?: number;
  title: string | null;
  description?: string | null;
  created_at?: string;
}

interface ProximityAlertProps {
  location: { lat: number; lng: number } | null;
  reports: ProximityReport[];
}

export default function ProximityAlert({ location, reports }: ProximityAlertProps) {
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  
  // 記錄已通知過的事件 ID (黑名單)
  const warnedIdsRef = useRef<Set<string>>(new Set());
  
  const getEventId = (evt: ProximityReport) => {
    if (evt.id !== undefined && evt.id !== null) return String(evt.id);
    const lng = evt.longtitude || evt.longitude;
    return `event-${evt.latitude}-${lng}`;
  };

  useEffect(() => {
    if (!location || !reports || reports.length === 0) {
      return;
    }

    const WARNING_THRESHOLD = 500; 

    // 1. 取得自己最後回報的時間 (過濾自己報的事件)
    const myLastReportStr = localStorage.getItem('my_last_report_time');
    const myLastReportTime = myLastReportStr ? parseInt(myLastReportStr, 10) : 0;

    // 2. 找出 500 公尺內的危險事件
    const allNearby = reports.filter(r => {
      const rLng = r.longtitude || r.longitude;
      if (!r.latitude || !rLng) return false;
      const dist = calculateDistance(location.lat, location.lng, r.latitude, rLng);
      return dist <= WARNING_THRESHOLD;
    });

    // 3. 過濾掉「已經警告過」以及「自己剛剛回報的」
    const nearbyUnwarned = allNearby.filter(r => {
      // 如果已經在黑名單，略過
      if (warnedIdsRef.current.has(getEventId(r))) return false;

      // 如果這筆事件的建立時間，距離自己按下回報的時間不到 15 秒，視為「自己報的」，略過
      const eventTime = new Date(r.created_at || 0).getTime();
      if (myLastReportTime > 0 && Math.abs(eventTime - myLastReportTime) < 15000) {
        // 順便把它加進黑名單，以免以後被當成別人的
        warnedIdsRef.current.add(getEventId(r));
        return false;
      }

      return true;
    });

    // 4. 如果有發現真正的新危險，觸發左下角閃爍！
    if (nearbyUnwarned.length > 0) {
      // 把當下所有的事件都加進黑名單，代表「這批我都通知過了」
      allNearby.forEach(evt => warnedIdsRef.current.add(getEventId(evt)));
      
      // 開啟閃爍燈
      setIsBlinking(true);

      // 閃爍 5 秒後自動隱藏
      setTimeout(() => {
        setIsBlinking(false);
      }, 5000);
    }

  }, [reports, location]);

  if (!isBlinking) return null;

  return (
    <>
      {/* 定義閃爍的 CSS 動畫 */}
      <style>
        {`
          @keyframes flashRed {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>

      {/* 左下角的紅色驚嘆號警示燈 */}
      <div style={{
        position: 'absolute', // 🌟 改成 absolute (跟隨父容器對齊)
        bottom: '0px',        // 🌟 貼齊文字最下緣
        left: '0px',          // 🌟 貼齊地圖左界
        zIndex: 9999,
        width: '24px',
        height: '24px',
        backgroundColor: '#dc2626',
        color: '#ffffff',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        boxShadow: '0 0 8px rgba(220, 38, 38, 0.8)',
        animation: 'flashRed 0.6s infinite',
        fontFamily: 'sans-serif',
        border: '1.5px solid #ffffff'
      }}>
        !
      </div>
    </>
  );
}
