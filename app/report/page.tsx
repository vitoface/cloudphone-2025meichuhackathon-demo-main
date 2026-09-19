'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGeolocation } from '@/component/useGeolocation';

// 定義後端支援的事件清單與顯示標題
const REPORT_OPTIONS = [
  { title: '發生車禍', event: 'car_crash' },
  { title: '嚴重塞車', event: 'traffic_jam' },
  { title: '道路施工', event: 'roadwork' },
  { title: '不明危險', event: 'unknown_danger' },
  { title: '自然災害', event: 'natural_disaster' },
];

export default function ReportPage() {
  const router = useRouter();
  const { fetchLocation, loading, errorMsg } = useGeolocation({ watch: false, autoFetch: false });

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState('請使用上下鍵選擇，按 Enter 回報');
  const [isReporting, setIsReporting] = useState(false);

  // 用來追蹤每一個選項的 DOM 元素，以便自動捲動
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 🌟 當選中的索引改變時，自動將該項目捲動到可視範圍內
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest', // 確保剛好完整顯示在畫面內
      });
    }
  }, [selectedIndex]);

  // 處理實際送出回報的邏輯
  const handleReport = async (option: typeof REPORT_OPTIONS[0]) => {
    if (isReporting || loading) return;
    setIsReporting(true);
    setStatusMessage('定位並傳送中，請稍候...');

    try {
      const currentCoords = await fetchLocation();

      if (!currentCoords || !currentCoords.lat || !currentCoords.lng) {
        throw new Error(errorMsg || '無法取得座標');
      }

      const response = await fetch('/api/newMapinfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          longtitude: currentCoords.lng,
          latitude: currentCoords.lat,
          title: option.title,
          description: '透過實體按鍵手機回報',
          events: option.event,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatusMessage(`回報成功！已記錄：${option.title}`);
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        console.error('API 錯誤回應:', result);
        setStatusMessage(`回報失敗: ${result.error || '伺服器錯誤'}`);
        setIsReporting(false);
        setTimeout(() => {
          setStatusMessage('請使用上下鍵選擇，按 Enter 回報');
        }, 3000);
      }
    } catch (error) {
      console.error('處理回報時發生錯誤:', error);
      setStatusMessage('網路或定位失敗，請稍後再試。');
      setIsReporting(false);
      setTimeout(() => {
        setStatusMessage('請使用上下鍵選擇，按 Enter 回報');
      }, 3000);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  // 監聽實體按鍵
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isReporting || loading) return;

      switch (event.key) {
        case 'ArrowUp':
        case '2':
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : REPORT_OPTIONS.length - 1));
          break;
        case 'ArrowDown':
        case '5':
          event.preventDefault();
          setSelectedIndex((prev) => (prev < REPORT_OPTIONS.length - 1 ? prev + 1 : 0));
          break;
        case 'Enter':
          event.preventDefault();
          handleReport(REPORT_OPTIONS[selectedIndex]);
          break;
        case '0':
          event.preventDefault();
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
  }, [selectedIndex, isReporting, loading, router]);

  return (
    <main style={{ padding: '6px', textAlign: 'center', backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '6px', color: '#000000' }}>
        狀況回報選單
      </h2>

      {/* 狀態提示區 */}
      <div style={{ fontSize: '11px', color: isReporting || loading ? '#2563eb' : '#dc2626', marginBottom: '8px', fontWeight: 'bold' }}>
        {loading ? 'GPS 定位中...' : statusMessage}
      </div>

      {/* 模擬手機大小的顯示容器 */}
      <div
        style={{
          width: '210px',
          height: '110px', // 限制高度，大約只能同時看到 2.5 個選項，超出就會觸發自動捲動
          margin: '0 auto',
          overflowY: 'hidden', // 隱藏滑鼠滾動條，純靠鍵盤連動
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          backgroundColor: '#f9fafb',
          padding: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {REPORT_OPTIONS.map((opt, index) => {
          const isSelected = index === selectedIndex;
          return (
            <div
              key={opt.event}
              ref={(el) => { itemRefs.current[index] = el; }} // 綁定每個選項的 ref
              onClick={() => {
                setSelectedIndex(index);
                handleReport(opt);
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
                fontSize: '12px',
                fontWeight: 'bold',
                flexShrink: 0, // 防止項目被壓縮
              }}
            >
              <span style={{ marginRight: '8px', opacity: 0.7 }}>[{index + 1}]</span>
              <span>{opt.title}</span>
            </div>
          );
        })}
      </div>

      {/* 按鍵操作指引 */}
      <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '6px', lineHeight: '1.3' }}>
        <p><strong>[↑/2] [↓/5]</strong> 移動選擇</p>
        <p><strong>[Enter]</strong> 確認送出回報</p>
      </div>

      {/* 底部取消按鈕 */}
      <div
        style={{
          marginTop: '8px',
          width: '210px',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '4px 8px',
          backgroundColor: '#fee2e2',
          border: '1px solid #f87171',
          borderRadius: '4px',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#dc2626', color: '#ffffff', padding: '1px 5px', borderRadius: '3px', marginRight: '8px' }}>[ 0 ]</span>
        <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: 'bold' }}>取消返回</span>
      </div>
    </main>
  );
}