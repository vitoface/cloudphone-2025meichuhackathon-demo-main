'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ListPage() {
  const router = useRouter();

  // 監聽實體按鍵：按 0 返回主畫面
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '0') {
        router.push('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  return (
    <main style={{ padding: '6px', textAlign: 'center', backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#000000' }}>
        周遭路況列表
      </h2>
      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '12px' }}>
        按 [0] 返回地圖
      </div>

      {/* 清單區 (鎖定 220px，與地圖、回報頁面寬度一致) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        
        {/* 項目 1 */}
        <div style={{ width: '220px', padding: '6px 8px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 'bold' }}>[嚴重] 發生車禍</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: '#e5e7eb', color: '#374151', padding: '2px 4px', borderRadius: '3px' }}>前方 300m</span>
          </div>
          <div style={{ fontSize: '11px', color: '#4b5563' }}>慈雲路與埔頂路交叉口</div>
        </div>

        {/* 項目 2 */}
        <div style={{ width: '220px', padding: '6px 8px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', color: '#d97706', fontWeight: 'bold' }}>[注意] 道路施工</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: '#e5e7eb', color: '#374151', padding: '2px 4px', borderRadius: '3px' }}>前方 1.2km</span>
          </div>
          <div style={{ fontSize: '11px', color: '#4b5563' }}>光復路一段 (占用外線)</div>
        </div>

        {/* 項目 3 */}
        <div style={{ width: '220px', padding: '6px 8px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', color: '#ea580c', fontWeight: 'bold' }}>[提醒] 嚴重塞車</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: '#e5e7eb', color: '#374151', padding: '2px 4px', borderRadius: '3px' }}>前方 2.5km</span>
          </div>
          <div style={{ fontSize: '11px', color: '#4b5563' }}>園區一路 (走走停停)</div>
        </div>

      </div>

      {/* 底部取消按鈕 */}
      <div style={{ marginTop: '12px', width: '220px', marginLeft: 'auto', marginRight: 'auto', padding: '6px 8px', backgroundColor: '#fee2e2', border: '1px solid #f87171', borderRadius: '4px', textAlign: 'left', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#dc2626', color: '#ffffff', padding: '2px 6px', borderRadius: '3px', marginRight: '10px' }}>[ 0 ]</span>
        <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 'bold' }}>返回地圖</span>
      </div>
      
    </main>
  );
}