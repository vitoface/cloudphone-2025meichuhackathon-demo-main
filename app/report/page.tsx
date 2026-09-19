'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('請按數字鍵回報狀況：');
  const [isReporting, setIsReporting] = useState(false);

  // 處理回報的邏輯
  const handleReport = (eventType: string) => {
    if (isReporting) return; // 避免重複送出
    setIsReporting(true);
    setStatusMessage('定位中，請稍候...');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // 在這裡，你們可以把資料打給後端 API
          console.log(`[送出回報] 類型: ${eventType}, 緯度: ${lat}, 經度: ${lng}`);
          
          setStatusMessage(`回報成功！類型：${eventType}`);
          
          // 停留 2 秒後自動跳轉回首頁
          setTimeout(() => {
            router.push('/');
          }, 2000);
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
           timeout: 5000,
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
          handleReport('塞車');
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

      {/* 清單選項 (寬度鎖定 220px 配合地圖尺寸) */}
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