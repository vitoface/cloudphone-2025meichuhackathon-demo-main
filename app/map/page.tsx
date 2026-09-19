'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MapPage() {
  const router = useRouter();
  const [zoomLevel, setZoomLevel] = useState(15);
  const [alertMessage, setAlertMessage] = useState('前方 500m 發生車禍');
  const [alertType, setAlertType] = useState('danger'); // danger 或 safe

  // 監聽實體按鍵
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case '1':
          // 放大地圖
          setZoomLevel((prev) => Math.min(prev + 1, 20));
          break;
        case '3':
          // 縮小地圖
          setZoomLevel((prev) => Math.max(prev - 1, 10));
          break;
        case '5':
          // 跳轉至回報頁面
          router.push('/report');
          break;
        case '8':
          // 跳轉至純文字路況清單頁面 (適合強光下閱讀)
          router.push('/list');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden font-sans">
      
      {/* 頂部：即時警報疊加層 (HUD) */}
      <div className="absolute top-0 left-0 w-full z-10 p-2">
        <div className={`p-2 rounded border-2 shadow-lg ${
          alertType === 'danger' ? 'bg-red-900 border-red-500 text-white' : 'bg-green-900 border-green-500 text-white'
        }`}>
          <div className="text-sm font-bold opacity-80">即時路況偵測</div>
          <div className="text-xl font-bold tracking-wider">{alertMessage}</div>
        </div>
      </div>

      {/* 中間：模擬地圖畫面 (後續可替換為真實地圖 API) */}
      <div 
        className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
        style={{ transform: `scale(${zoomLevel / 15})` }}
      >
        {/* 模擬的道路網格背景 */}
        <div className="w-[200%] h-[200%] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* 使用者當前位置 (鎖定在畫面正中央) */}
        <div className="absolute z-20 flex flex-col items-center">
          <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
          <div className="mt-1 bg-black text-white text-xs px-2 py-0.5 rounded font-bold">目前位置</div>
        </div>

        {/* 模擬前方的危險標記 */}
        <div className="absolute z-20 flex flex-col items-center -mt-[200px]">
          <div className="w-8 h-8 bg-red-600 rounded border-2 border-white animate-pulse flex items-center justify-center font-bold text-white">!</div>
          <div className="mt-1 bg-red-900 text-white text-xs px-2 py-0.5 rounded font-bold border border-red-500">事故點</div>
        </div>
      </div>

      {/* 底部：按鍵操作提示列 */}
      <div className="absolute bottom-0 left-0 w-full z-10 bg-black border-t-2 border-gray-700 pb-2">
        <div className="grid grid-cols-2 gap-1 p-1 text-center text-sm font-bold text-gray-300">
          <div className="bg-gray-800 p-1 rounded"><span className="text-white">[1]</span> 放大</div>
          <div className="bg-gray-800 p-1 rounded"><span className="text-white">[3]</span> 縮小</div>
          <div className="bg-gray-800 p-1 rounded"><span className="text-white text-yellow-400">[5]</span> 回報路況</div>
          <div className="bg-gray-800 p-1 rounded"><span className="text-white">[8]</span> 文字清單</div>
        </div>
      </div>

    </div>
  );
}