'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('請按數字鍵回報狀況：');
  const [isReporting, setIsReporting] = useState(false);

  // 處理真實 API 回報的邏輯 (按下按鈕當下才抓座標)
  const handleReport = (eventType: string) => {
    if (isReporting) return; // 避免重複送出
    setIsReporting(true);
    setStatusMessage('定位並傳送中，請稍候...');

    if ('geolocation' in navigator) {
      // 1. 按下按鈕的瞬間，才開始抓取當下座標
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            // 2. 抓到座標後，立刻打 API 送給後端
            // 🔥 確認這裡是 /api/newMapinfo 還是 /api/mapinfo
            const response = await fetch('/api/newMapinfo', { 
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                longtitude: lng, 
                latitude: lat,
                title: eventType,
                description: '透過實體按鍵手機回報',
              }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
              setStatusMessage(`回報成功！已記錄：${eventType}`);
              
              // 成功後停留 2 秒自動跳轉回地圖首頁
              setTimeout(() => {
                router.push('/');
              }, 2000);
            } else {
              console.error('API 錯誤回應:', result);
              setStatusMessage(`回報失敗: ${result.error || '伺服器錯誤'}`);
              setIsReporting(false);
              
              setTimeout(() => {
                 setStatusMessage('請按數字鍵回報狀況：');
              }, 3000);
            }
          } catch (error) {
            console.error('網路請求失敗:', error);
            setStatusMessage('網路連線失敗，請稍後再試。');
            setIsReporting(false);
            
            setTimeout(() => {
               setStatusMessage('請按數字鍵回報狀況：');
            }, 3000);
          }
        },
        (error) => {
          console.error('定位失敗', error);
          setStatusMessage('定位失敗，請確認 GPS 權限。');
          setIsReporting(false);
          
          setTimeout(() => {
             setStatusMessage('請按數字鍵回報狀況：');
          }, 3000);
        },
        {
           enableHighAccuracy: true,
           timeout: 10000, // 給 GPS 稍微多一點時間 (10秒)
           maximumAge: 0
        }
      );
    } else {
      setStatusMessage('裝置不支援定位功能。');
      setIsReporting(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  // 監聽鍵盤按鍵
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isReporting) return;

      switch (event.key) {
        case '1':
          handleReport('車禍');
          break;
        case '2':
          handleReport('施工');
          break;
        case '3':
          handleReport('嚴重塞車');
          break;
        case '4':
          handleReport('不明危險');
          break;
        case '0':
          handleCancel();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReporting, router]);

  return (
    <main style={{ padding: '6px', textAlign: 'center', backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#000000' }}>
        狀況回報
      </h2>

      {/* 狀態提示區 */}
      <div style={{ fontSize: '12px', color: isReporting ? '#2563eb' : '#dc2626', marginBottom: '12px', fontWeight: 'bold' }}>
        {statusMessage}
      </div>

      {/* 清單選項 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        
        <div style={{ width: '220px', padding: '6px 8px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'left', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#000000', color: '#ffffff', padding: '2px 6px', borderRadius: '3px', marginRight: '10px' }}>[ 1 ]</span>
          <span style={{ fontSize: '13px', color: '#000000', fontWeight: 'bold' }}>發生車禍</span>
        </div>
        
        <div style={{ width: '220px', padding: '6px 8px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'left', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#000000', color: '#ffffff', padding: '2px 6px', borderRadius: '3px', marginRight: '10px' }}>[ 2 ]</span>
          <span style={{ fontSize: '13px', color: '#000000', fontWeight: 'bold' }}>道路施工</span>
        </div>
        
        <div style={{ width: '220px', padding: '6px 8px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'left', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#000000', color: '#ffffff', padding: '2px 6px', borderRadius: '3px', marginRight: '10px' }}>[ 3 ]</span>
          <span style={{ fontSize: '13px', color: '#000000', fontWeight: 'bold' }}>嚴重塞車</span>
        </div>
        
        <div style={{ width: '220px', padding: '6px 8px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'left', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#000000', color: '#ffffff', padding: '2px 6px', borderRadius: '3px', marginRight: '10px' }}>[ 4 ]</span>
          <span style={{ fontSize: '13px', color: '#000000', fontWeight: 'bold' }}>不明危險</span>
        </div>

      </div>

      {/* 底部取消按鈕 */}
      <div style={{ marginTop: '12px', width: '220px', marginLeft: 'auto', marginRight: 'auto', padding: '6px 8px', backgroundColor: '#fee2e2', border: '1px solid #f87171', borderRadius: '4px', textAlign: 'left', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#dc2626', color: '#ffffff', padding: '2px 6px', borderRadius: '3px', marginRight: '10px' }}>[ 0 ]</span>
        <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 'bold' }}>取消返回</span>
      </div>
    </main>
  );
}