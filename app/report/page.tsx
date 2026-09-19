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
  const { fetchLocation, loading, errorMsg } = useGeolocation({autoFetch: false });

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState('請使用上下鍵選擇，按 Enter 回報');
  const [isReporting, setIsReporting] = useState(false);

  // 用來追蹤每一個選項的 DOM 元素，以便自動捲動
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 當選中的索引改變時，自動將該項目捲動到可視範圍內
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest', 
      });
    }
  }, [selectedIndex]);

  // 處理實際送出回報的邏輯
  const handleReport = async (option: typeof REPORT_OPTIONS[0]) => {
    if (isReporting || loading) return;

    // 🌟 【新增：30 秒回報冷卻機制】防止連點或洗版
    const COOLDOWN_SECONDS = 30;
    const lastReportStr = localStorage.getItem('my_last_report_time');
    
    if (lastReportStr) {
      const elapsedMs = Date.now() - parseInt(lastReportStr, 10);
      const elapsedSecs = Math.floor(elapsedMs / 1000);

      // 如果距離上次回報還不到 30 秒，擋下來！
      if (elapsedSecs < COOLDOWN_SECONDS) {
        const remainingSecs = COOLDOWN_SECONDS - elapsedSecs;
        setStatusMessage(`⏳ 冷卻中... 請等待 ${remainingSecs} 秒`);
        
        // 3 秒後恢復原本的提示文字
        setTimeout(() => {
          setStatusMessage('請使用上下鍵選擇，按 Enter 回報');
        }, 3000);
        return; // 直接中斷，不送出 API
      }
    }

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
        // 成功送出後，更新時間戳記（同時給冷卻鎖、以及左下角警示燈過濾用）
        localStorage.setItem('my_last_report_time', Date.now().toString());
        
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
    <main
      style={{
        width: '100%',
        maxWidth: '240px',          // 最大寬度保護
        height: '100vh',            // 滿版高度
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
      {/* 頂部狀態與提示區 (設定 flexShrink: 0 避免被壓縮) */}
      <div style={{ flexShrink: 0, textAlign: 'center', width: '100%' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '2px', color: '#000000' }}>
          狀況回報選單
        </h2>
        <div style={{ fontSize: '11px', color: isReporting || loading || statusMessage.includes('冷卻中') ? '#2563eb' : '#dc2626', marginBottom: '6px', fontWeight: 'bold' }}>
          {loading ? 'GPS 定位中...' : statusMessage}
        </div>
      </div>

      {/* 模擬手機大小的顯示容器 (選單區) */}
      <div
        style={{
          width: '210px',
          flex: 1,                  // 自動填滿標題與底部按鈕之間的剩餘空間
          overflowY: 'scroll',      // 允許捲動以配合 scrollIntoView
          scrollbarWidth: 'none',   // 隱藏 Firefox 捲軸
          msOverflowStyle: 'none',  // 隱藏 IE/Edge 捲軸
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
        {REPORT_OPTIONS.map((opt, index) => {
          const isSelected = index === selectedIndex;
          return (
            <div
              key={opt.event}
              ref={(el) => { itemRefs.current[index] = el; }}
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
                flexShrink: 0, // 確保選項卡片不會被擠壓變形
                boxSizing: 'border-box',
              }}
            >
              <span style={{ marginRight: '8px', opacity: 0.7 }}>[{index + 1}]</span>
              <span>{opt.title}</span>
            </div>
          );
        })}
      </div>

      {/* 底部按鍵指引與取消按鈕 (設定 flexShrink: 0 確保貼齊底部) */}
      <div style={{ flexShrink: 0, width: '210px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* 按鍵操作指引 */}
        <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '6px', marginBottom: '4px', lineHeight: '1.3', textAlign: 'center' }}>
          <span><strong>[↑/2] [↓/5]</strong> 移動 | <strong>[Enter]</strong> 送出</span>
        </div>

        {/* 底部取消按鈕 */}
        <div
          onClick={handleCancel}
          style={{
            cursor: 'pointer',
            width: '100%',
            boxSizing: 'border-box',
            padding: '4px 8px',
            backgroundColor: '#fee2e2',
            border: '1px solid #f87171',
            borderRadius: '4px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#dc2626', color: '#ffffff', padding: '1px 5px', borderRadius: '3px', marginRight: '8px' }}>
            [ 0 ]
          </span>
          <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: 'bold' }}>
            取消返回
          </span>
        </div>
      </div>
    </main>
  );
}